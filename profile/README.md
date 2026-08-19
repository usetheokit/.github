<div align="center">

<img src="https://raw.githubusercontent.com/usetheokit/.github/HEAD/profile/assets/hero.png" alt="Theokit — the full stack your agent needs: framework, agent runtime, web and terminal UI, channels, auth, database, workflows and deploy. Already speaks to 43 model providers, 11 messaging channels, Postgres, Redis, Drizzle, OAuth, Stripe, and the MCP, ACP and A2A protocols." width="900" />

[![License](https://img.shields.io/badge/license-Apache--2.0-DE2329?style=flat-square)](https://www.apache.org/licenses/LICENSE-2.0)
[![npm theokit](https://img.shields.io/npm/v/theokit?style=flat-square&label=theokit&color=CB3837&logo=npm&logoColor=white)](https://www.npmjs.com/package/theokit)
[![npm @theokit/sdk](https://img.shields.io/npm/v/@theokit/sdk?style=flat-square&label=%40theokit%2Fsdk&color=CB3837&logo=npm&logoColor=white)](https://www.npmjs.com/package/@theokit/sdk)
[![downloads](https://img.shields.io/npm/dm/@theokit/sdk?style=flat-square&label=downloads&color=DE2329)](https://www.npmjs.com/package/@theokit/sdk)
[![LLM providers](https://img.shields.io/badge/LLM%20providers-43-DE2329?style=flat-square)](https://github.com/usetheokit/theokit-sdk#configuration-reference)
[![Discord](https://img.shields.io/badge/Discord-join-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.usetheo.dev/)

**Framework · agent runtime · web UI · terminal UI · channels · auth · database · workflows · deploy.**

One stack. One `pnpm dev`. One deploy. Apache-2.0 all the way down, on your own provider keys.

[**Quickstart**](#here-is-the-whole-thing) · [**What you can build**](#what-you-can-actually-build) · [**Everything in the box**](#everything-in-the-box) · [**Compare**](#so-how-is-this-different-from-what-you-already-use) · [**Repositories**](#the-repositories) · [**Contribute**](#come-build-it-with-us)

[**theokit.dev**](https://theokit.dev) · [usetheo.dev](https://usetheo.dev) · [Docs](https://usetheo.dev/docs) · [Discord](https://discord.usetheo.dev/) · [Good first issues](https://github.com/search?q=org%3Ausetheokit+is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22&type=issues)

</div>

---

## Here is the whole thing

This is a complete agent endpoint. Not the interesting part of one — the file, entire:

```ts
// agents/support.ts
import { AgentBuilder } from '@theokit/agents'
import { z } from 'zod'

import { refundTool } from './tools/refund.js'

export default AgentBuilder.create()
  .input(z.object({ message: z.string() }))
  .model('openai/gpt-4o-mini')
  .system('You are the support agent for an online store.')
  .tool(refundTool)
  .approval('refund', { question: 'Issue this refund?' })
  .build()
```

Save it. It is live at `POST /api/agents/support`.

Nothing was registered. No router was touched, no server file edited, no config updated. And the
front end binds by the same name:

```tsx
const { thread, send, status } = useAgent<{ message: string }>('/api/agents/support')
```

That `.approval('refund', …)` line is the loop you would otherwise wire by hand: pause the run
before the tool fires, get the question to the browser, resume on the answer without losing the
thread. One line here.

```bash
npx create-theokit my-app
```

**That is the aha — and it is the small half.** The agent is a file; so is the page that renders
it, the WebSocket beside it and the route your client imports with its types. One project, one
`pnpm dev`, one deploy.

The other half is what stands behind that file: an Apache-2.0 agent runtime with a kernel sandbox,
a React library and a terminal library, eleven messaging channels, OAuth and encrypted sessions,
Postgres and an ORM, workflows, evals and nine deploy targets. Each of those exists somewhere else
as a separate product you would have integrated yourself. **Nobody in the comparison further down
ships all of it as one stack** — that is the whole bet of this project.

---

## What you didn't write

The list of things that already work, because the framework owns them and not you:

| The thing | Who writes it |
| --- | --- |
| The route for every agent | **Nobody.** The file's path is the route |
| Token streaming, browser to model | **Nobody.** `useAgent` is already streaming |
| Pause, ask a human, resume | One line: `.approval(…)` |
| Input validation, typed end to end | Your Zod schema — one definition, server and client |
| Auth, sessions, OAuth, magic links | Framework primitives and `@theokit/auth-*` |
| WebSockets, cron, webhooks | `defineWebSocket`, `defineCron`, `defineWebhook` |
| The chat UI itself | `@theokit/ui` — a themeable component library with a shadcn-compatible registry |
| Slack, WhatsApp, Discord, email, SMS | A gateway package each, eleven of them |

You write the system prompt, the tools, and your product. That was always the interesting part.

---

## What you can actually build

Three shapes, all of them shipping code today. None of this is a roadmap section.

### 1 · Your own coding agent — the whole one

The file tools, the patch tool, the git tools, the test runner and the shell are a package. The
shell runs **inside a kernel sandbox**: bubblewrap plus a seccomp filter, so a command cannot write
outside the workspace, cannot reach the network, and cannot `ptrace`. Secrets are scrubbed from the
child environment by default — anything matching `*KEY*`, `*SECRET*`, `*TOKEN*`, `*PASSWORD*`.

```ts
import { Agent } from '@theokit/sdk'
import { LinuxSandbox } from '@theokit/sdk/sandbox'
import {
  createApplyPatchTool, createEditFileTool, createGlobTool,
  createReadFileTool, createSearchTextTool, createShellTool,
} from '@theokit/sdk-tools'

const projectRoot = process.cwd()

const agent = await Agent.create({
  apiKey: process.env.THEOKIT_API_KEY!,
  model: { id: 'openai/gpt-4o' },
  local: { cwd: projectRoot },
  tools: [
    createReadFileTool({ projectRoot }),
    createEditFileTool({ projectRoot }),
    createApplyPatchTool({ projectRoot }),
    createGlobTool({ projectRoot }),
    createSearchTextTool({ projectRoot }),
    createShellTool({
      projectRoot,
      sandbox: new LinuxSandbox({ workDir: projectRoot }, { mode: 'workspace-write' }),
    }),
  ],
})
```

That agent already plans (`plan_mode`, `update_plan`, `todolist`), reasons out loud (`think`,
`analyze`), reads images, searches the web, drives an interactive shell over a real PTY, and runs
your vitest suite.

And it does not get to run whatever it likes. Four gates stand between the model asking for a tool
and the command executing — all four in the package, none of them yours to build:

<div align="center">

<img src="https://raw.githubusercontent.com/usetheokit/.github/HEAD/profile/assets/security-gates.png" alt="Four gates before a tool runs: trust posture, permission engine, approval policy, kernel sandbox." width="920" />

</div>

The kernel gate is the one that is hard to fake. Ten integration tests prove the confinement against
a real kernel in CI — and a mutation run proved the tests: swap the seccomp filter for one that
denies nothing and they go red.

Then give it a face: `@theokit/tui` renders the streaming turn, the tool-call cards and the diffs
in the terminal. Or skip the UI entirely — `@theokit/acp` speaks
[Agent Client Protocol](https://agentclientprotocol.com) over stdio, so your agent shows up inside
an editor that already talks ACP.

**That is your own Claude Code, and you own every layer of it.**

### 2 · A product, not a chat demo

The part most agent stacks hand back to you. Here it is files:

```
app/page.tsx                    →  /
app/(marketing)/pricing/page.tsx →  /pricing        route groups, no URL noise
agents/support.ts               →  POST /api/agents/support
server/ws/chat.ts               →  ws://…/ws/chat
```

Around that: encrypted, `httpOnly` session cookies with dual-key rotation and one
`requireAuth(ctx.user)` that narrows the type; GitHub, Google and magic-link providers; Postgres,
Redis, MySQL, SQLite and 20+ KV drivers behind `usePostgres` / `useDatabase` / `useUnstorage`;
Drizzle with `@Transactional` and `@InjectRepository`; Stripe and AbacatePay; Resend for mail; Yjs
for live collaboration; rate limiting, CSRF, OpenAPI generated from your Zod schemas; NestJS-style
`@Controller` / `@UseGuards` decorators when a route deserves a pipeline. **Nine deploy targets** —
node, Vercel, Cloudflare, Netlify, Bun, Deno Deploy, AWS Lambda, static, TheoCloud.

Auth, a database and a real deploy are what separate an agentic product from an agentic demo.

### 3 · Work that runs without you watching

```ts
import { Workflow, agentStep, fn } from '@theokit/sdk/workflow'

const triage = Workflow.create({ name: 'triage' })
  .then(fn('validate', (i: { id: string }) => { if (!i.id) throw new Error('missing id'); return i }))
  .then(agentStep('classify', classifier, (i) => `Classify: ${JSON.stringify(i)}`))
  .commit()
```

Branching, parallel and foreach steps come with it. `createSquad` chains a team of agents in order,
subagents and `@theokit/sdk-handoff` cover manager-to-worker delegation, `defineCron` puts any of it
on a schedule, and `runUntil` keeps an agent going toward a goal with a judge and a token budget
deciding when it stops.

And you can prove it works instead of hoping:

```ts
import { Eval, Scorers } from '@theokit/sdk/eval'

const run = await Eval.create({
  name: 'qa-smoke',
  dataset: [{ input: 'Say ok', expected: 'ok' }],
  scorers: [Scorers.containsExpected()],
  agent: { apiKey: process.env.OPENROUTER_API_KEY, model: { id: 'openai/gpt-4o-mini' } },
}).run()

console.log(run.aggregate.meanScore)
```

`@theokit/sdk-budget` tracks spend in USD, `@theokit/sdk-cache` is a semantic response cache
(vector + full-text hybrid), transcript compaction keeps long runs inside the window, and memory is
either local markdown or Mem0, Honcho and Supermemory through adapters.

*One more number worth knowing: `@theokit/sdk` ships with **two** runtime dependencies —
`croner` and `jsonrepair`. Everything above is the package, not a dependency tree you inherit.*

---

## Everything in the box

<div align="center">

<img src="https://raw.githubusercontent.com/usetheokit/.github/HEAD/profile/assets/capabilities.png" alt="Capability map: 43 model providers, 11 channels, 20+ datastores, auth and payments, a 20+ tool agent toolkit, four safety gates, orchestration, evaluation, run economy, three protocols, the UI packages and nine deploy targets." width="900" />

</div>

**Every number there was counted in this repository, not estimated.** 43 entries in the provider
catalogue. 11 gateway packages. 10 kernel-confinement tests standing behind the four safety gates.
9 deploy targets. And 2 — the runtime dependencies `@theokit/sdk` installs, `croner` and
`jsonrepair`. Everything else on that wall is the package, not a tree you inherit.

Take one card and ignore the other eleven if that is what your project needs: they are separate
packages with separate versions. Names and logos above belong to their owners and appear only to
say what connects.

---

## So how is this different from what you already use

These are not the same kind of tool — an orchestration library and a full-stack framework do not
compete for the same slot. Only the rows below are ones we verified in each project's own docs
today; where a project's documentation does not cover something, the cell says so rather than
claiming a gap.

| | **Theokit** | Mastra | Vercel AI SDK | LangGraph | OpenAI Agents SDK |
| --- | --- | --- | --- | --- | --- |
| What it is | **Full-stack web framework** | Agent framework + server | Model & UI toolkit | Orchestration library | Agent library |
| Pages, file routing, SSR | **Yes — it *is* the web framework** | No — bring your own | No — pairs with Next.js | No | No |
| An agent becomes an endpoint | **The file's path is the route** | Register it in a `Mastra` instance | You write the handler | You serve the graph | You write the handler |
| Chat / agent UI | **`@theokit/ui` + `@theokit/tui`** — web and terminal | Dev playground | [AI Elements](https://github.com/vercel/ai-elements) — official, shadcn-based | [Agent Chat UI](https://github.com/langchain-ai/agent-chat-ui) — official app | — |
| Messaging channels | **11 first-party gateways** | Via Vercel's `@chat-adapter/*` | [`@chat-adapter/*`](https://www.npmjs.com/org/chat-adapter) — official | Not in its docs | Not in its docs |
| Human-in-the-loop | ✅ `.approval()` | ✅ | ✅ | ✅ `interrupt` | ✅ `needsApproval` |
| LLM providers | **43**, the prefix of the model id | Multi-provider | First-party + community | Through LangChain | OpenAI-first, others via adapters |
| Runtime licence | Apache-2.0 | Apache-2.0 | Apache-2.0 | MIT | MIT |

**Read that honestly.** Human-in-the-loop is table stakes — everyone has it. Vercel and LangChain
both ship an official chat UI, and Mastra reaches Slack and WhatsApp through Vercel's adapters, so
neither UI nor channels are ours alone. And they are far bigger: the AI SDK does around 81 million
downloads a month against our 19 thousand. If you want the largest ecosystem and the most answers
already written, that is where they are.

**What is genuinely ours is the span.** Every other row in that table is a piece of the problem:
an orchestrator, a model toolkit, an agent library, a framework-plus-server. Theokit is the app —
pages, file routing and SSR — *and* the agent runtime under it, *and* the React library that
renders the thread, *and* the terminal library, *and* the eleven channels, *and* the OAuth, *and*
the database layer, *and* the nine deploy targets. One `pnpm install`, one version, one repository
graph, Apache-2.0 throughout.

Pick any of the others and you are still choosing a web framework, a component library, a channel
layer, an auth provider and a deploy story — five decisions, five integrations, five things to keep
in step. That is the work this replaces.

*Verified against each project's published documentation and npm metadata on 2026-08-18, and this
table was wrong in four cells before that check. If a cell is still wrong, open a PR — we would
rather be corrected than flattering.*

---

## Pick your door

| You have | Start here | First command |
| --- | --- | --- |
| An idea and an empty folder | [`theokit`](https://github.com/usetheokit/theokit) | `npx create-theokit my-app` |
| A codebase that needs an agent in it | [`@theokit/sdk`](https://github.com/usetheokit/theokit-sdk) | `npm i @theokit/sdk` |
| An agent with no face | [`@theokit/ui`](https://github.com/usetheokit/theokit-ui) · [`@theokit/tui`](https://github.com/usetheokit/theokit-tui) | `npm i @theokit/ui` |
| Users who live in Slack, not in your app | [`theokit-gateways`](https://github.com/usetheokit/theokit-gateways) | `npm i @theokit/gateway-slack` |

Just the runtime, no framework, nothing of ours in the request path:

```ts
import { Agent } from '@theokit/sdk'
import { assistantText } from '@theokit/sdk/messages'

const agent = await Agent.create({
  apiKey: process.env.THEOKIT_API_KEY!,
  model: { id: 'google/gemini-2.0-flash-001' },  // the provider is the prefix
  local: { cwd: process.cwd() },                 // this key selects the local runtime
})

const run = await agent.send('Summarize what this repository does')

for await (const event of run.stream()) {
  process.stdout.write(assistantText(event))
}
```

Forty-three providers behind that model id. Swap `google/…` for `anthropic/…` and the code above
does not change.

---

## The part nobody asks until month six

**What happens the day you want out?**

Ask it about whatever executes your agents today. When the answer is a hosted runtime, the exit is
a rewrite — the thing running your code was never in your repository.

Here the runtime is Apache-2.0 and runs on your machine, on your provider keys. Fork it and every
agent you wrote keeps working: no licence call, no hosted backend, no notice period. Sessions land
on disk as native Claude Code `.jsonl`, so a run your agent produced reopens in a tool we do not
own. The managed cloud is a convenience you switch on, nothing depends on it, and the price of
walking away is a `git clone`.

Several libraries in the table above are open source too — that is table stakes, and we are not
pretending otherwise. The sharper question is how much of the path stays yours when you leave: the
runtime, the session format, the provider, the channel. Here it is all four.

---

## How the pieces fit

<div align="center">

<img src="https://raw.githubusercontent.com/usetheokit/.github/HEAD/profile/assets/how-the-pieces-fit.png" alt="How the pieces fit: you write agent files, tools and schemas; the @theokit/sdk runtime executes them behind four gates and a kernel sandbox; entry points are the web UI, terminal UI, eleven channels, your app, the typed client and webhooks; and the capabilities are auth, channels, database, workflows, evaluations, nine deploy targets and the MCP, ACP and A2A protocols." width="980" />

</div>

You write the left column. Everything else is installed, and every arrow between boxes is a
published npm dependency rather than a workspace link — take one box, ignore the rest, and nothing
breaks.

---

## The repositories

| Repository | What it is | npm |
| --- | --- | --- |
| **[theokit](https://github.com/usetheokit/theokit)** | The web framework. Routing, auth, real-time, deploy — already wired. An agent is a file. | [![v](https://img.shields.io/npm/v/theokit?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/theokit) |
| **[theokit-sdk](https://github.com/usetheokit/theokit-sdk)** | The runtime. `Agent.create` / `prompt` / `stream` / `resume`, MCP servers, subagents, memory, skills, cron. | [![v](https://img.shields.io/npm/v/@theokit/sdk?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/sdk) |
| **[theokit-ui](https://github.com/usetheokit/theokit-ui)** | The agent surface in React — threads, tool calls, cost meters, permission modals. Three runtime themes, shadcn-compatible registry. | [![v](https://img.shields.io/npm/v/@theokit/ui?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/ui) |
| **[theokit-tui](https://github.com/usetheokit/theokit-tui)** | The same, for the terminal, on Ink. Streaming chat, tool-call cards, diffs, token and cost metrics. | [![v](https://img.shields.io/npm/v/@theokit/tui?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/tui) |
| **[theokit-gateways](https://github.com/usetheokit/theokit-gateways)** | Eleven channels over one core: Telegram, Discord, Slack, WhatsApp, Teams, Email, SMS, LINE, Matrix, Mattermost. | [![v](https://img.shields.io/npm/v/@theokit/gateway?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/gateway) |
| **[theokit-plugins](https://github.com/usetheokit/theokit-plugins)** | First-party plugins — three auth providers plus canvas, copilot, realtime, drizzle, email, forms, payments, voice. | [11 packages ↓](#the-eleven-plugins) |
| **[theokit-di](https://github.com/usetheokit/theokit-di)** | A NestJS-flavoured IoC container, agent-aware DI, and a repository-pattern ORM over drizzle. Optional. | [![v](https://img.shields.io/npm/v/@theokit/di?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/di) |
| **[theokit-skill](https://github.com/usetheokit/theokit-skill)** | Teaches Claude Code the real SDK surface, so it writes correct code instead of plausible code. | [![v](https://img.shields.io/npm/v/@theokit/skill?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/skill) |

---

## The eleven plugins

Each one is its own package on its own version — install the one you need and the other ten stay
out of your tree. All eleven publish from CI through npm trusted publishing, so every release
carries a provenance attestation and no long-lived token exists to leak.

| Package | What it does | npm |
| --- | --- | --- |
| **[`@theokit/auth-github`](https://www.npmjs.com/package/@theokit/auth-github)** | GitHub OAuth 2.0. One line inside `defineAuth({ providers: [github(…)] })`. | [![v](https://img.shields.io/npm/v/%40theokit%2Fauth-github?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/auth-github) |
| **[`@theokit/auth-google`](https://www.npmjs.com/package/@theokit/auth-google)** | Google OAuth over OIDC, the same one-line shape. | [![v](https://img.shields.io/npm/v/%40theokit%2Fauth-google?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/auth-google) |
| **[`@theokit/auth-magic-link`](https://www.npmjs.com/package/@theokit/auth-magic-link)** | Passwordless email sign-in. Any transport, pluggable store. | [![v](https://img.shields.io/npm/v/%40theokit%2Fauth-magic-link?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/auth-magic-link) |
| **[`@theokit/plugin-canvas`](https://www.npmjs.com/package/@theokit/plugin-canvas)** | Artifacts beside the thread — markdown, code, svg, diff, whiteboard, slides, mermaid, html, images. Side panel plus an agent tool. | [![v](https://img.shields.io/npm/v/%40theokit%2Fplugin-canvas?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/plugin-canvas) |
| **[`@theokit/plugin-copilot`](https://www.npmjs.com/package/@theokit/plugin-copilot)** | A copilot the other people in the room can see. Presence-visible agent member, React hooks, `<CopilotChat />`. | [![v](https://img.shields.io/npm/v/%40theokit%2Fplugin-copilot?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/plugin-copilot) |
| **[`@theokit/plugin-db-drizzle`](https://www.npmjs.com/package/@theokit/plugin-db-drizzle)** | Drizzle as a plugin: a seven-verb `theokit db` CLI, `drizzle-kit studio` passthrough, devtools tab. | [![v](https://img.shields.io/npm/v/%40theokit%2Fplugin-db-drizzle?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/plugin-db-drizzle) |
| **[`@theokit/plugin-email`](https://www.npmjs.com/package/@theokit/plugin-email)** | An `EmailProvider` contract with Resend as the default, React Email opt-in, magic-link template included. | [![v](https://img.shields.io/npm/v/%40theokit%2Fplugin-email?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/plugin-email) |
| **[`@theokit/plugin-forms`](https://www.npmjs.com/package/@theokit/plugin-forms)** | `<TheoForm>` and `<TheoField>` over zod and react-hook-form — server-action errors land back on the right field. | [![v](https://img.shields.io/npm/v/%40theokit%2Fplugin-forms?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/plugin-forms) |
| **[`@theokit/plugin-payments`](https://www.npmjs.com/package/@theokit/plugin-payments)** | One neutral `PaymentProvider` contract, Stripe and AbacatePay behind subpath exports. Webhook signatures verified, dispatch idempotent, PIX a typed capability. | [![v](https://img.shields.io/npm/v/%40theokit%2Fplugin-payments?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/plugin-payments) |
| **[`@theokit/plugin-realtime`](https://www.npmjs.com/package/@theokit/plugin-realtime)** | Presence, rooms and broadcast, with Yjs CRDT when you opt in. Hooks at `/react`. | [![v](https://img.shields.io/npm/v/%40theokit%2Fplugin-realtime?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/plugin-realtime) |
| **[`@theokit/plugin-voice`](https://www.npmjs.com/package/@theokit/plugin-voice)** | STT and TTS bridge, a browser MediaRecorder helper, and the UI to go with it. | [![v](https://img.shields.io/npm/v/%40theokit%2Fplugin-voice?style=flat-square&label=&color=CB3837)](https://www.npmjs.com/package/@theokit/plugin-voice) |

```bash
npm i @theokit/plugin-payments        # or any single one of the eleven
```

Versions above come from npm, so this table cannot go stale. Source for all of them:
**[theokit-plugins](https://github.com/usetheokit/theokit-plugins)**.

---

## Come build it with us

The stack is young enough that one good PR still changes its shape. Nothing here is settled by a
committee you cannot join.

- 🌱 **[Good first issues](https://github.com/search?q=org%3Ausetheokit+is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22&type=issues)** — scoped, reviewed, landable in an afternoon.
- 🙋 **[Help wanted](https://github.com/search?q=org%3Ausetheokit+is%3Aissue+is%3Aopen+label%3A%22help+wanted%22&type=issues)** — the bigger pieces we would rather not build alone.
- 🐛 **A reproduction is a contribution.** Attach one to an open bug and you have already done the hard part.
- 📚 **Docs count double.** The paragraph that unblocked you will unblock the next person.

```
workspace ──PR──> develop ──PR + semver tag──> main
```

Everything commits to `workspace`. One command tells you whether CI will be green:

```bash
pnpm install && pnpm validate     # build + typecheck + test + lint + quality gates
```

The gates refuse a failing test, an import cycle, a dead export, a dependency pointing the wrong
way. The rule behind all of them: **fix the code, not the threshold.** Read the `CONTRIBUTING.md` of
the repository you are touching, and send security problems through `SECURITY.md` rather than a
public issue.

---

## Where this actually stands

You are deciding whether to build on this, so read it straight:

- **`@theokit/sdk`** is the mature piece. Everything else sits on it, and it is the most used package we ship.
- **`theokit`** is beta. The API is settling, breaking changes still happen, and every one lands in the changelog.
- **`@theokit/ui`, `@theokit/tui`, gateways, plugins, di** are published and moving fast.
- **TheoCloud** (managed deploy) and **Studio** (local agent builder) are pre-release. Nothing in the local stack depends on either.
- The docs and the site at **usetheo.dev** are built with TheoKit. When the framework breaks, that site breaks first, and we hear about it before you do.

Semver, changelogs written for the person consuming the change, Apache-2.0 on everything published.

<div align="center">

### `npx create-theokit my-app`

**[theokit.dev](https://theokit.dev)** · **[usetheo.dev](https://usetheo.dev)** · **[Discord](https://discord.usetheo.dev/)** · **[npm](https://www.npmjs.com/search?q=%40theokit)**

Apache-2.0 — © 2026 usetheo.dev

</div>
