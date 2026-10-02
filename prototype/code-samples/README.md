# prototype/code-samples — THROWAWAY

**Question (balsa-website #6)**: 首页代码示例的**选材**（hero 一段 + feature tabs 五段 + observability 一段）
与**展示形式**（mastra 用 tabbed code blocks + 语法高亮）。

This is a **landing-page slice** — nav → hero (#4 的 D 复刻 Mastra) → feature tabs ×5 → observability —
so the forms are judged in situ, not in a vacuum. The hero structure is fixed by #4; what is under
review here is the code presentation, the hero snippet's content, and the trace waterfall's provenance.

## Run

```sh
open index.html          # or: python3 -m http.server 4175 then http://localhost:4175/prototype/code-samples/
```

- Floating bottom bar switches **form** (a/b/c/d), **hero snippet** (h1/h2/h3), **trace provenance**
  (static mock / real run), and theme. `←` / `→` cycle forms. URL params are reload-stable.
- Every code card has a working `⧉ copy`; the hero's `⧉ Copy quick start` copies the hero candidate.

## Axes

**Form** — how a snippet is presented (`?variant=`):

| key | name | structure |
| --- | --- | --- |
| `a` | 文件 tabs（复刻 mastra） | per-card file tab row (`server.ts` / `client.ts`), one file at a time, copy per card |
| `b` | 单段 + 编号注解 | one snippet per section; numbered markers on the lines that matter + a note list under the card |
| `c` | import-first | import paths lifted into chips above the card (`@balsats/*` accented, external dimmed), import lines dimmed in the block — "compose only what you use" as the visual subject |
| `d` | 代码 + 输出双栏 | code left, that code's runtime output right |

**Hero snippet** (`?hero=`): `h1` full quick start (agent + tool + stream, ~15 lines) · `h2` core surface only (no tool) · `h3` minimal (fields + `generate()`).

**Trace waterfall provenance** (`?trace=`): `mock` hand-drawn values · `real` a captured run (ids, durations, token counts), because the visible difference *is* the decision.

## Snippet candidates (content)

All snippets are grounded in `../balsa-framework` (README + the 10 examples, facts verified 2026-10-02):
`@balsats/*` scope · no install commands (0.5.0 red line) · ≤10 lines per tab snippet · 1–2 comments ·
subpath composition visible at import level · no RAG / evals · no competitor names.

| slot | candidate |
| --- | --- |
| hero | `Agent` + `createTool` + `stream()` loop (h1); alternates h2/h3 |
| Agents | a processor object (three optional hooks) + agent wiring |
| Workflows | fluent builder (`foreach` / `parallel` / `then` / gate) + `resume.ts` second file |
| Harness | durable approval gate; second file = `@balsats/croner` schedule |
| Memory | `Memory` over the in-memory port + per-call thread/resource; second file = `@balsats/sqlite` |
| MCP | `server.ts` (fetch/stdio) + `client.ts` (remote tools as plain tools) |
| Observability | `createApp` + tracer with console + OTLP exporters |

## Verdict (fills on close)

Pending HITL discussion — winner form, hero candidate, trace provenance, and the final snippets land
here and in the #6 resolution comment.
