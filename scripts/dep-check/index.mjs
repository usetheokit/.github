#!/usr/bin/env node
/**
 * dep-check — the ecosystem dependency gate.
 *
 * Four questions, deliberately not collapsed into one, because they differ in what
 * they need in order to be answered and therefore in whether they may fail a build:
 *
 *   manifest   (A) does the declared range admit the version the lockfile installs?
 *                  offline, deterministic — BLOCKING
 *   floors     (B) which published version is the bottom of each range?
 *                  offline — feeds a CI matrix leg that runs the suite there
 *   registry   (C) does the range still admit the sibling's published latest?
 *                  needs the network — REPORTS, never blocks
 *   consumers  (D) who in the ecosystem breaks if this package publishes version X?
 *                  needs the network — run by the publisher, before the major
 *
 * C is the one that catches a range going stale, and it is exactly the one that must
 * not gate a push: on the day a sibling cuts a major, every repository in the
 * organisation would go red without anyone having touched anything. A build that
 * breaks on someone else's release schedule teaches a team to ignore red, and then
 * none of the other three mean anything either.
 */
import { parseArgs } from "node:util";
import { ceilingDrift, consumersLeftBehind, installedDrift, isSibling, rangeFloor } from "./src/checks.mjs";
import { findPublishablePackages, resolveInstalledVersion, siblingReferences } from "./src/ecosystem.mjs";
import { consumersOf, discoverEcosystemPackages, latestVersion, packument, publishedVersions } from "./src/registry.mjs";
import { installFromTarball } from "./src/tarball.mjs";

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    root: { type: "string", default: "." },
    json: { type: "boolean", default: false },
    markdown: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});
const [command, ...rest] = positionals;

const USAGE = `dep-check <command> [--root <dir>] [--json]

  manifest                    (A) declared range vs the version actually installed. Exits 1 on drift.
  floors                      (B) the lowest published version each range admits.
  registry                    (C) declared range vs the sibling's published latest. Never exits 1.
  consumers <pkg> <version>   (E) who breaks if <pkg> publishes <version>.
  install                     (D) pack, install as a consumer, assert one copy of each sibling. Exits 1 on failure.
  audit                       every PUBLISHED package in the scope, not only the ones in this checkout.
`;

/**
 * One line per finding — or JSON when a workflow reads it, or markdown when the
 * output is going into an issue body.
 *
 * The markdown form is deliberately not "the text form with pipes". An issue is read
 * by a person deciding whether to act, so it leads with what is broken for consumers
 * and separates it from what is merely a version behind.
 */
function report({ title, findings, columns, note }) {
  if (flags.json) {
    console.log(JSON.stringify({ command, findings }, null, 2));
    return;
  }
  if (flags.markdown) {
    console.log(renderMarkdown({ title, findings, note }));
    return;
  }
  console.log(`\n${title} — ${findings.length} finding${findings.length === 1 ? "" : "s"}`);
  if (note) console.log(note);
  for (const f of findings) console.log("  " + columns(f));
}

/** The issue-body form: what breaks a consumer first, what is merely behind after. */
function renderMarkdown({ title, findings, note }) {
  const contract = findings.filter((f) => f.severity === "contract");
  const behind = findings.filter((f) => f.severity !== "contract");
  const lines = [`## ${title}`, ""];
  if (note) lines.push(note.trim().replace(/^\s+/gm, ""), "");

  if (contract.length) {
    lines.push(
      "### Broken install contract",
      "",
      "A peer range that no longer admits the sibling's published `latest`. A consumer installing",
      "this combination gets an `ERESOLVE` from npm, or — worse, because it is silent — a second",
      "copy of the runtime hoisted above the one the app runs.",
      "",
      "| package | field | sibling | declares | latest | behind |",
      "| --- | --- | --- | --- | --- | --- |",
      ...contract.map((f) => `| \`${f.pkg}\`${f.deprecated ? " *(deprecated)*" : ""} | ${f.field} | \`${f.dep}\` | \`${f.range}\` | ${f.latest} | ${f.majorsBehind} |`),
      "",
    );
  } else {
    lines.push("### Broken install contract", "", "None.", "");
  }

  if (behind.length) {
    lines.push(
      "### Merely behind",
      "",
      "Ordinary dependencies one or more versions back. Renovate's job, not a gate's.",
      "",
      "| package | sibling | declares | latest |",
      "| --- | --- | --- | --- |",
      ...behind.map((f) => `| \`${f.pkg}\` | \`${f.dep}\` | \`${f.range}\` | ${f.latest} |`),
      "",
    );
  }
  return lines.join("\n");
}

/** Every sibling reference in the repository, paired with where it was declared. */
function collectReferences(root) {
  const refs = [];
  for (const pkg of findPublishablePackages(root)) {
    for (const ref of siblingReferences(pkg.manifest, isSibling)) {
      refs.push({ ...ref, pkg: pkg.manifest.name, dir: pkg.dir });
    }
  }
  return refs;
}

async function commandManifest(root) {
  const findings = [];
  for (const ref of collectReferences(root)) {
    const installed = resolveInstalledVersion(ref.dir, ref.dep);
    const drift = installedDrift({ range: ref.range, installed });
    if (drift) findings.push({ ...ref, ...drift });
  }
  report({
    title: "A) declared range vs installed version",
    findings,
    columns: (f) => `${f.pkg.padEnd(28)} ${f.field.padEnd(17)} ${f.dep.padEnd(22)} declares ${f.range} — installed ${f.installed}`,
  });
  return findings.length === 0 ? 0 : 1;
}

async function commandFloors(root) {
  const findings = [];
  for (const ref of collectReferences(root)) {
    const floor = rangeFloor(ref.range, await publishedVersions(ref.dep));
    if (floor) findings.push({ ...ref, floor });
  }
  report({
    title: "B) the bottom of each declared range",
    findings,
    note: "  Run the suite against these, not only against latest. A range is a claim about an interval.",
    columns: (f) => `${f.pkg.padEnd(28)} ${f.dep.padEnd(22)} ${f.range.padEnd(18)} floor ${f.floor}`,
  });
  return 0;
}

async function commandRegistry(root) {
  const refs = collectReferences(root);
  const latest = new Map();
  for (const { dep } of refs) {
    if (!latest.has(dep)) latest.set(dep, await latestVersion(dep));
  }
  const findings = [];
  for (const ref of refs) {
    const drift = ceilingDrift({ range: ref.range, latest: latest.get(ref.dep) });
    if (drift) findings.push({ ...ref, ...drift, severity: ref.field === "peerDependencies" ? "contract" : "behind" });
  }
  // A stale peer is a broken install contract for every consumer; a stale dependency
  // is just being a version behind, which is ordinary and what Renovate is for.
  findings.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "contract" ? -1 : 1));
  report({
    title: "C) declared range vs published latest",
    findings,
    note: "  `contract` = a peer range that no longer admits latest: consumers cannot install this combination.\n  `behind`   = an ordinary dependency one or more versions back.",
    columns: (f) => `[${f.severity}] ${f.pkg.padEnd(26)} ${f.dep.padEnd(22)} ${f.range.padEnd(18)} latest ${f.latest} (${f.majorsBehind} major${f.majorsBehind === 1 ? "" : "s"} behind)`,
  });
  return 0; // never blocks — see the header
}

async function commandConsumers([pkg, nextVersion]) {
  if (!pkg || !nextVersion) {
    console.error("consumers needs a package and the version about to be published");
    return 2;
  }
  const consumers = await consumersOf(pkg);
  const findings = consumersLeftBehind({ consumers, nextVersion }).map((c) => ({ ...c, nextVersion }));
  report({
    title: `D) consumers left behind by ${pkg}@${nextVersion}`,
    findings,
    note: `  Checked ${consumers.length} published consumer${consumers.length === 1 ? "" : "s"} of ${pkg}.`,
    columns: (f) => `${f.pkg.padEnd(28)} ${f.depType.padEnd(17)} declares ${f.range} — excludes ${nextVersion}`,
  });
  return 0; // informational by design: the release decides, this only tells it who pays
}

async function commandInstall(root) {
  const findings = [];
  for (const pkg of findPublishablePackages(root)) {
    const siblings = siblingReferences(pkg.manifest, isSibling)
      .filter((r) => r.field === "peerDependencies" && !/^(workspace|link|file|portal):/.test(r.range))
      .map((r) => `${r.dep}@latest`);
    const result = installFromTarball({ packageDir: pkg.dir, alsoInstall: siblings });
    if (!result.installed) {
      findings.push({ pkg: pkg.manifest.name, problem: result.reason, detail: result.detail });
    } else if (result.duplicates.length) {
      // The silent failure: it installed, and the tree has two runtimes in it.
      for (const d of result.duplicates) {
        findings.push({ pkg: pkg.manifest.name, problem: `two copies of ${d.dep}`, detail: d.versions.join(" and ") });
      }
    }
  }
  report({
    title: "D) install the tarball as a consumer would",
    findings,
    note: "  Installed with npm, not pnpm: pnpm has defaulted strict-peer-dependencies to false since v8,\n  so a broken peer contract is only a warning there and this gate would pass on it.",
    columns: (f) => `${f.pkg.padEnd(28)} ${f.problem}${f.detail ? `\n      ${f.detail.replace(/\n/g, "\n      ")}` : ""}`,
  });
  return findings.length === 0 ? 0 : 1;
}

/**
 * The organisation-wide view: every package PUBLISHED under the scope, whether or not
 * a repository in this checkout owns it.
 *
 * The other commands read a repository, so a package with no repository is invisible
 * to all of them. That is not hypothetical — it is how five undeprecated packages
 * declaring peers on dead majors were found (usetheokit/.github#3). No repository's
 * CI could ever have caught those, because no repository contains them.
 */
async function commandAudit() {
  const names = await discoverEcosystemPackages();
  const latest = new Map();
  for (const n of names) latest.set(n, await latestVersion(n));

  const findings = [];
  for (const name of names) {
    const doc = await packument(name);
    const version = latest.get(name);
    const manifest = version ? doc?.versions?.[version] : null;
    if (!manifest) continue;
    for (const field of ["peerDependencies", "dependencies"]) {
      for (const [dep, range] of Object.entries(manifest[field] ?? {})) {
        if (!isSibling(dep)) continue;
        const drift = ceilingDrift({ range, latest: latest.get(dep) });
        if (drift) {
          findings.push({
            pkg: `${name}@${version}`,
            field,
            dep,
            ...drift,
            deprecated: Boolean(manifest.deprecated),
            severity: field === "peerDependencies" ? "contract" : "behind",
          });
        }
      }
    }
  }
  findings.sort((a, b) => b.majorsBehind - a.majorsBehind);
  report({
    title: "audit) every published package in the scope",
    findings,
    note: `  Swept ${names.length} published packages. \`deprecated\` means the registry already warns people.`,
    columns: (f) => `[${f.severity}]${f.deprecated ? "[deprecated]" : ""} ${f.pkg.padEnd(30)} ${f.field.padEnd(17)} ${f.dep.padEnd(20)} ${f.range.padEnd(16)} latest ${f.latest} (${f.majorsBehind} behind)`,
  });
  return 0;
}

const commands = {
  manifest: () => commandManifest(flags.root),
  floors: () => commandFloors(flags.root),
  registry: () => commandRegistry(flags.root),
  install: () => commandInstall(flags.root),
  consumers: () => commandConsumers(rest),
  audit: () => commandAudit(),
};

if (flags.help || !command || !commands[command]) {
  console.log(USAGE);
  process.exit(command && !commands[command] ? 2 : 0);
}
process.exit(await commands[command]());
