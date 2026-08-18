# Security Policy

**Do not open a public issue for a security problem.**

Report it through GitHub's private vulnerability reporting on the repository that owns the
code. That form opens a private thread visible only to the maintainers — it is the only
channel we can promise to read for this. A DM, or a comment on an unrelated issue, will be
missed.

| Repository | Report privately |
| --- | --- |
| `theokit` | [Report a vulnerability](https://github.com/usetheokit/theokit/security/advisories/new) |
| `theokit-sdk` | [Report a vulnerability](https://github.com/usetheokit/theokit-sdk/security/advisories/new) |
| `theokit-ui` | [Report a vulnerability](https://github.com/usetheokit/theokit-ui/security/advisories/new) |
| `theokit-tui` | [Report a vulnerability](https://github.com/usetheokit/theokit-tui/security/advisories/new) |
| `theokit-gateways` | [Report a vulnerability](https://github.com/usetheokit/theokit-gateways/security/advisories/new) |
| `theokit-plugins` | [Report a vulnerability](https://github.com/usetheokit/theokit-plugins/security/advisories/new) |
| `theokit-di` | [Report a vulnerability](https://github.com/usetheokit/theokit-di/security/advisories/new) |
| `theokit-skill` | [Report a vulnerability](https://github.com/usetheokit/theokit-skill/security/advisories/new) |

Not sure which one? Use [`theokit-sdk`](https://github.com/usetheokit/theokit-sdk/security/advisories/new)
and say so — we will route it. If you cannot use the form at all, open a public issue
containing **only** the sentence "requesting a private channel for a security report",
with nothing about the finding itself, and a maintainer will open the private thread.

## What to include

The same things any bug report needs, plus the reach of the problem:

- **Affected package and version** — the resolved number, and whether sibling `@theokit/*`
  packages share the code path.
- **What an attacker can do**, stated concretely: read a file outside the workspace, reach
  the network from a sandboxed tool, recover a credential from a log, hijack a session.
- **The smallest reproduction you have.** A failing test is ideal; exact steps are fine.
- **Whether it needs a specific configuration** — a provider, a tool, a sandbox mode, an MCP
  server, a gateway channel — or reproduces on defaults.
- **What you are unsure of.** An honest "I could reach X but could not prove Y" is more
  useful than a guess in either direction.

**Never include a real credential in the report.** If a key of yours leaked, rotate it
first, then report the code path that leaked it.

## What to expect

- **Acknowledgement within 3 business days.** If you hear nothing, the report did not reach
  us — please ping the thread.
- An assessment of severity and affected versions, shared with you rather than announced at you.
- A fix, a released version, and a GitHub Security Advisory with a CVE where one applies.
- **Credit in the advisory** under the name you choose, unless you would rather stay anonymous.

We will not take legal action against anyone who reports in good faith through this
channel, stays within their own accounts and data, and gives us reasonable time to ship
a fix before going public.

## Supported versions

Fixes land on the latest minor of each package. Older lines are patched only when the
vulnerability is severe and the upgrade path is genuinely blocked — say so in the report if
that is your situation.

## Out of scope

Reports we will close without a fix: findings from an automated scanner with no working
reproduction, missing headers on a page that serves no authenticated content, vulnerabilities
in a dependency already fixed upstream and pending a routine bump, and anything requiring an
attacker who already has code execution as your user.
