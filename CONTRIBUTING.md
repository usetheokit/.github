# Contributing to Theokit

This is the organisation-wide baseline. **The `CONTRIBUTING.md` in the repository you are
touching wins wherever it differs** — read it before your first commit there.

By taking part you agree to the [Code of Conduct](./CODE_OF_CONDUCT.md). Security problems
do not go in an issue — see [SECURITY.md](./SECURITY.md).

## Getting set up

Every repository in the org is TypeScript on pnpm workspaces, and they all start the same way:

```bash
nvm use                                   # Node 22.12+
corepack enable && corepack prepare pnpm@9.15.0 --activate
pnpm install
pnpm validate                             # build + typecheck + test + lint + quality gates
```

`pnpm validate` is what CI runs. Green locally is usually green in CI, with one caveat worth
knowing: turbo caches test results per package, and touching a **root** file (`package.json`,
the lockfile) does not invalidate that cache. After changing a root dependency, force a real
run:

```bash
npx turbo run test --filter='./packages/*' --force
```

## Branch model

```
workspace ──PR──> develop ──PR + semver tag──> main
 (all work)      (integration)                 (release)
```

- **Everything commits to `workspace`** — features, fixes, refactors, docs, chores alike. We
  do not open a branch per task. `workspace` is permanent: never deleted, never recreated.
- **`develop` integrates.** It advances only through a `workspace → develop` pull request.
- **`main` is release-only.** It receives `develop → main` release merges plus a semver tag,
  and nothing else. It is protected: PR required, force-push and deletion blocked, CI green
  before merge.
- Never `git checkout` (use `git switch` / `git restore`), never `git revert` (write an
  explicit reversing commit), never discard the working tree with a hard reset (stash it, or
  reset `--soft`), and never force-push `main`, `develop` or `workspace`.

## Commits

- Conventional prefixes: `feat` / `fix` / `docs` / `refactor` / `test` / `chore` / `style` /
  `ci` / `perf` / `build`. A breaking change is `feat!:` with a `BREAKING CHANGE:` footer.
- **No AI co-author trailers** — a git hook enforces this.
- Reference the issue or plan id when there is one.
- Say *why*, not only *what*. The reasoning survives nowhere else.

## Before you open a PR

- [ ] `pnpm validate` is green locally.
- [ ] **TDD** — the failing test came first, and a bug fix ships with its regression test.
- [ ] Public API changed? The exported types moved in the same PR. They are the contract.
- [ ] User-visible change? A changeset (`pnpm changeset`), written for the person consuming
      it — "fixed the compound-interest calculation", not "adjusted float precision in
      `calcInterest`".
- [ ] Lint and format clean.

## Quality gates

Each repository gates its own push locally and again in CI. The gates vary, the rule does
not: **fix the code, not the threshold.**

| Gate | Refuses |
| --- | --- |
| Lint / format | any linter finding |
| Types | any type error |
| Tests | a failing test, or a newly skipped one |
| Dead code | unreachable exports, dead private symbols |
| Cycles | any import cycle — the threshold is zero |
| Layering | a dependency pointing the wrong way |
| Cluster boundary | importing an extracted sibling repository |
| File size | a source file past its LoC budget |

Moving a threshold to make a gate pass is the one change that will not be merged. If a gate
is genuinely wrong for a case, say so in the PR and argue it — that conversation is welcome,
the silent bump is not.

## Design principles we review against

Not bureaucracy — shared vocabulary, so "this violates SRP" or "this is YAGNI" means the same
thing to everyone in the thread.

- **Don't reinvent the wheel.** Thirty minutes looking for a maintained library beats three
  days maintaining your own.
- **KISS.** The simplest thing that solves the problem. Readable beats clever.
- **YAGNI.** Build what this iteration needs. An abstraction with one implementer and no
  second case in sight is not extensibility.
- **DRY applies to knowledge, not to lines.** Duplicate code when it says different things;
  never duplicate a business rule.
- **SOLID where there is real complexity** — and nowhere else.
- **Tests are not overhead.** They are the only objective evidence the thing works.
- **Errors fail fast, loud and clear.** A swallowed exception is the most expensive bug there is.

## Good first contributions

- 🌱 [Good first issues](https://github.com/search?q=org%3Ausetheokit+is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22&type=issues) — scoped and safe to land in an afternoon.
- 🙋 [Help wanted](https://github.com/search?q=org%3Ausetheokit+is%3Aissue+is%3Aopen+label%3A%22help+wanted%22&type=issues) — larger pieces we would rather not build alone.
- 📚 Docs. A paragraph that unblocked you will unblock the next person.
- 🐛 A reproduction on an open bug is a real contribution, even without a fix attached.

Unsure whether something is wanted? Open the issue first and ask. A discarded PR costs you
more than it costs us, and we would rather spend the round-trip before you write the code.
