# Comparison sources

One row per cell of the comparison table in [`README.md`](README.md). Each carries the URL
consulted, the date it was read, and a verbatim quote or a registry fact.

## Why this file exists

The table shipped on 2026-08-18 with **four cells wrong, all of them in our favour**
(`usetheokit/.github#1`, fixed in `0ab70db`). The cause was method rather than bad luck: cells were
filled from a single documentation page, and *"not mentioned on this page"* was recorded as *"the
competitor does not have it"*. Searching **for** the feature instead of reading **one page** found
all four in minutes.

Re-verifying on 2026-09-02 found **two more of the same shape**, still live, plus one number about
ourselves that had drifted. That is the argument for a file: without a source per cell, nobody —
including whoever wrote it — can tell a verified cell from an inferred one.

## The rule for adding a cell

**A claim about another project needs a link.** A cell whose only evidence is "their docs did not
mention it" is written as **"Not in its docs"**, never as **"—"**. The two say different things: one
is a statement about our search, the other about their product.

A cell nobody can source honestly is a row worth deleting. A shorter true table beats a longer one
that needs a caveat.

## Re-verification

Every entry carries a date. **Re-read the table every four months** — that is long enough for any of
these projects to ship the thing we said they lacked, and a comparison table with a stale date is a
liability rather than marketing.

| Last full re-verification | Next due |
| --- | --- |
| 2026-09-02 | 2027-01-02 |

## Row: Chat / agent UI

| Project | Cell | Source | Read | Evidence |
| --- | --- | --- | --- | --- |
| Mastra | Dev playground (`mastra dev`) | https://mastra.ai/en/docs/local-dev/mastra-dev | 2026-09-02 | "Mastra dev is your local playground for experimenting with agents, tools, and workflows in one place." Runs at `localhost:4111`; it is a local development tool, not a component library an app embeds. Mastra separately documents third-party UIs (Assistant UI, AI SDK UI) rather than shipping its own. |
| Vercel AI SDK | AI Elements — official, shadcn-based | https://github.com/vercel/ai-elements | 2026-08-18 | Official `vercel/` repository; shadcn-based component library. One of the four cells corrected in `0ab70db`. |
| LangGraph | Agent Chat UI — official app | https://github.com/langchain-ai/agent-chat-ui | 2026-08-18 | Official `langchain-ai/` repository; a chat application. One of the four corrected in `0ab70db`. |
| OpenAI Agents SDK | ChatKit — official embed | https://developers.openai.com/api/docs/guides/chatkit | 2026-09-02 | **Was `—`, and that was wrong.** "ChatKit provides a customizable chat embed to handle all user experience details", and the guide states developers can "connect to any agentic service, including one built with the Agents SDK." First-party, embedded by the developer in their own product. |

## Row: Messaging channels

| Project | Cell | Source | Read | Evidence |
| --- | --- | --- | --- | --- |
| Theokit | 10 first-party gateways | `usetheokit/theokit-gateways` | 2026-09-02 | **Was 11, counting the core package as a channel.** `packages/` holds eleven packages; `@theokit/gateway` is the transport-agnostic core ("Multi-platform messaging gateway core … BasePlatformAdapter, MessageEvent, SessionRouter"). The channels are discord, email, line, matrix, mattermost, slack, sms, teams, telegram, whatsapp — ten. |
| Mastra | Via Vercel's `@chat-adapter/*` | https://mastra.ai/docs/agents/channels | 2026-09-02 | "Channels connect agents to messaging and collaboration platforms like Slack, Microsoft Teams, Discord, Telegram, WhatsApp, GitHub, and Linear." The same page states "Mastra uses Chat SDK for this channel layer" — the adapters are `@chat-adapter/*`, not Mastra's own. |
| Vercel AI SDK | `@chat-adapter/*` — official | https://www.npmjs.com/org/chat-adapter · https://github.com/vercel/chat | 2026-08-18 | Published by Vercel, MIT. "A unified TypeScript SDK for building chat bots across Slack, Microsoft Teams, Google Chat, Discord, and more." One of the four corrected in `0ab70db`. |
| LangGraph | langgraph-messaging-integrations — official, Slack | https://github.com/langchain-ai/langgraph-messaging-integrations | 2026-09-02 | **Was "Not in its docs", and that understated it.** Official `langchain-ai/` repository, MIT, not archived. Description, verbatim: "Event server integrations with Slack and other messaging platforms." Scope today is Slack, which is why the cell names it rather than claiming parity. |
| OpenAI Agents SDK | Not in its docs | — | 2026-09-02 | Searched for a first-party OpenAI messaging-channel adapter and found none. What exists is third-party: CopilotKit's Channels SDK, Composio's Slack toolkit, community Bolt integrations. Phrased as a statement about our search, per the rule above. |

## Row: LLM providers

| Project | Cell | Source | Read | Evidence |
| --- | --- | --- | --- | --- |
| Theokit | **43**, the prefix of the model id | `packages/sdk/src/internal/providers/provider-catalog.json` | 2026-09-02 | 43 entries in the catalog the `theokit-sdk` README cites, and the two agree. `Provider.builtins()` returns **45**, which is not a second count of the same thing: it adds `gemini` and `google` as alternate names for the Google family the catalog holds once as `google-gemini`, and `openai-chatgpt`, a first-class provider with its own OAuth that the catalog does not list. So 45 double-counts and 43 undercounts by one. **The table keeps 43** — it is the number its cited source supports; reconciling the two is `usetheokit/theokit-sdk`'s to do, and picking a third number here would be the inference this file exists to stop. |
| Mastra | Multi-provider | https://mastra.ai/docs | 2026-08-18 | Documented multi-provider support; no count claimed, so none is stated. |
| Vercel AI SDK | First-party + community | https://ai-sdk.dev/providers | 2026-08-18 | Provider list is split between first-party and community-maintained. |
| LangGraph | Through LangChain | https://python.langchain.com/docs/integrations/chat/ | 2026-08-18 | Model access is LangChain's integration surface, not LangGraph's own. |
| OpenAI Agents SDK | OpenAI-first, others via adapters | https://openai.github.io/openai-agents-python/models/ | 2026-08-18 | OpenAI models are native; others arrive through model adapters. |

## Rows carried without a per-cell source, and why

Three rows state category facts rather than capability claims, and a link per cell would be
ceremony:

- **What it is** — each project's own one-line self-description, from its landing page.
- **Pages, file routing, SSR** — none of the four presents itself as a web framework; Vercel's AI
  SDK explicitly pairs with Next.js. A cell here would cite the same landing page as the row above.
- **An agent becomes an endpoint** — restates each project's documented quickstart.
- **Human-in-the-loop** — every cell is ✅, so no cell claims an advantage. The API name in each
  (`interrupt`, `needsApproval`) comes from that project's own docs.
- **Runtime licence** — read from each repository's `LICENSE`.

If any of these ever becomes a cell that claims an advantage, it needs a source like the rest.
