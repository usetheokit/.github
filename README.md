# `.github` — organisation defaults for Theokit

You are probably looking for [the organisation page](https://github.com/usetheokit) or
[usetheo.dev](https://usetheo.dev). This repository holds what GitHub serves *around* the
code in every other repository.

| Path | What it does |
| --- | --- |
| `profile/README.md` | The page rendered at [github.com/usetheokit](https://github.com/usetheokit). Only read from the default branch. |
| `.github/ISSUE_TEMPLATE/` | Issue forms for repositories that ship none of their own. |
| `.github/PULL_REQUEST_TEMPLATE.md` | Default PR template. |
| `.github/workflows/validate.yml` | Reusable CI (`workflow_call`) — opt-in, for repositories with no pipeline yet. |
| `CODE_OF_CONDUCT.md` · `CONTRIBUTING.md` · `SECURITY.md` · `SUPPORT.md` | Community defaults. |

## How the defaults resolve

A file here applies to a repository **only when that repository has no file of its own with
the same name**. Nothing is merged and nothing is inherited field by field: the local copy
wins whole, or the default is used whole.

Today `theokit` and `theokit-sdk` carry their own community files, so they are unaffected by
everything here except the profile page. The defaults are what the smaller repositories get
without maintaining a copy each.

## Changing something here

Same flow as everywhere else in the org: commit to `workspace`, promote by pull request.
A change to `profile/README.md` is public the moment it reaches the default branch — there is
no preview environment, so read it once more before promoting.

Apache-2.0 — © 2026 usetheo.dev
