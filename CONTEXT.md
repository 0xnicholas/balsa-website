# Balsa Website

The marketing site for the Balsa project. This repo's deliverable is a handoff-ready spec for that site; the site itself is built from the spec.

## Language

**营销站 (Marketing site)**:
The landing page group for Balsa — home page and closely related content pages. Does not include docs or a blog; those are separate efforts.
_Avoid_: docs site, website（泛指）

**Balsa**:
The ultralight TypeScript AI agent framework this site markets. Public tagline: "Ultralight TypeScript agent framework. Compose only what you use — run anywhere, no runtime baggage."

**Lightweight**:
Balsa's differentiating axis, with a precise two-part meaning: compose only what you use (every subsystem a separate subpath export; zero runtime dependencies) and no runtime burden (no required DB, queue, or long-running process; embeds in the host app).
_Avoid_: small, mini（泛化的"小"）

**core package**:
`@balsats/core`, the zero-runtime-dependency package; every subsystem is a subpath export.

**capability package**:
An optional add-on package `@balsats/<capability>` (e.g. `@balsats/mcp-server`).
_Avoid_: plugin, integration

**composition root**:
`createApp`, an optional thin assembly point.

**processor**:
Balsa's single cross-cutting extension point: ordered hooks `processInput` / `processOutputStep` / `processError`.

**as-tool composition**:
Balsa's multi-agent model: wrap an agent as a tool on another agent; delegation is an ordinary tool call.
_Avoid_: supervisor, sub-agent

**memory**:
Thread/resource identity plus message history, with opt-in resource-scoped working memory.
_Avoid_: session, short-term memory, long-term memory

**workflow snapshot**:
How workflows suspend/resume: JSON snapshots at step boundaries, resumable from another process.

**durable agent**:
An agent whose approval-listed tool calls suspend the run as a human approval gate; `resume({ approved })` continues.

**harness**:
A documentation category name, not a module: the trio of durable agents, signals, and schedules.

**用例页 (Use-case page)**:
首页 use-case 卡片的展开页,每卡一页(首发三页);讲单一应用场景的完整论证。
_Avoid_: 案例页、customers 页(balsa 无客户案例)

**关键词页 (Keyword page)**:
按搜索词建立的说明页,首发四页(`/ai-agent-framework`、`/ai-agents`、`/ai-workflows`、`/ai-agent-observability`),服务搜索与 LLM 收录;内容只讲 balsa 自身能力。
_Avoid_: SEO 页(泛指)、行业页
