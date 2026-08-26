# dep-check

The ecosystem dependency gate. It answers four questions about how a package declares its siblings,
and refuses to answer any of them by guessing.

## Why four commands and not one

They differ in what they need in order to be answered, and therefore in whether they may fail a
build. Collapsing them would mean either blocking on someone else's release schedule, or not
blocking at all.

| Command | Question | Needs the network | Blocks |
| --- | --- | --- | --- |
| `manifest` | does the declared range admit the version the lockfile installs? | no | **yes** |
| `floors` | which published version is the bottom of each range? | yes | no — feeds a CI matrix leg |
| `registry` | does the range still admit the sibling's published `latest`? | yes | **no** |
| `install` | does the tarball install as a consumer, with one copy of each sibling? | yes | **yes**, at release |
| `consumers` | who in the ecosystem breaks if this package publishes version X? | yes | no |
| `audit` | the same as `registry`, over every package published in the scope | yes | no |

`registry` is the one that catches a range going stale, and it is exactly the one that must not gate
a push. On the day a sibling cuts a major, every repository in the organisation would go red without
anyone having touched anything — and a build that breaks on someone else's release schedule teaches
a team to ignore red, after which none of the others mean anything either.

## What it was built from

Two defects, found on the same afternoon, both in packages that had passed every existing gate:

- `@theokit/di-agent@0.3.0` declared `peer @theokit/sdk: ^1.3.0` while importing `@theokit/sdk/workflow`
  at runtime, three majors after the SDK moved on. `npm i` ended in `ERESOLVE`.
- `@theokit/studio@0.2.0` declared `peer @theokit/agents: ^7.6.0` against a published 11.1.0. This
  one did **not** fail: npm installed two copies of the runtime and hoisted the old one to the root,
  where application code resolved it first.

Both were internally coherent — the peer and the devDependency agreed with each other perfectly, and
both were wrong. That is the reason `manifest` alone is not enough: a repository closed over itself
cannot see this class of defect, by construction.

`test/checks.test.mjs` pins all three historical ranges, including the one `@theokit/studio@0.2.0`
had already corrected by hand once. A detector that cannot detect is worse than none, because green
then means nothing.

## Usage

```bash
node index.mjs manifest --root ../..        # offline, exits 1 on drift
node index.mjs registry --root ../..        # reports, never exits 1
node index.mjs install  --root ../..        # packs and installs; exits 1 on ERESOLVE or a duplicate
node index.mjs consumers @theokit/sdk 5.0.0 # who breaks if the SDK cuts a major
node index.mjs audit                        # every published package in the scope
```

`--json` on any of them, for a workflow to read.

## What it does not do

It does not open pull requests to move a range forward. That is Renovate's job, configured per
repository with `matchDepTypes: ["peerDependencies"]` — Dependabot does not look at peerDependencies
for npm at all ([dependabot-core#1242](https://github.com/dependabot/dependabot-core/issues/1242)),
which is why the organisation's existing Dependabot configuration could not have caught either defect.
