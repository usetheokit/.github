## What this changes

<!-- One paragraph. What behaviour is different after this merges, from the point of
     view of someone using the package? -->

## Why

<!-- The reasoning, not the diff. This is the only place it survives.
     Link the issue or plan id if there is one: Closes #123 -->

## How it was verified

<!-- The commands you ran and what they said. "Tests pass" is not evidence; the output is. -->

```
pnpm validate
```

## Checklist

- [ ] Branched from and committing to `workspace` — never directly to `develop` or `main`.
- [ ] **The failing test came first.** A bug fix ships with the regression test that reproduced it.
- [ ] `pnpm validate` is green locally (or the touched package's `build` + `typecheck` + `test`).
- [ ] Public API changed? The exported types moved with it — they are the contract.
- [ ] User-visible change? A changeset (`pnpm changeset`) or a `CHANGELOG.md` entry written for the person consuming it.
- [ ] Docs and README updated where this makes them wrong.
- [ ] No credential, token or `.env` value anywhere in the diff.

## Anything reviewers should push back on

<!-- A trade-off you took, a threshold you were tempted to move, a case you did not cover.
     Saying it here is faster than a reviewer finding it. -->
