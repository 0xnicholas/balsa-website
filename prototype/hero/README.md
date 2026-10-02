# prototype/hero — THROWAWAY

**Question (balsats-website #4)**: hero 区的 headline / sub-headline 文案 + 右侧视觉形式。

Three structurally different hero variants on the decided brand direction
(A 继承暖纸 tokens, inherited verbatim from balsa-docs §2.2 via `prototype/brand-direction`):

| key | name | structure | copy axis (default) |
| --- | --- | --- | --- |
| `a` | 代码卡 | split: text → editor card w/ README quick start, annotated ("one import per subsystem", "a tool is four fields") | H2 `Compose only what you use.` |
| `b` | 终端 | stacked: centered headline → terminal card (`npm install` → run), amber `0.5.0 not yet on npm` tension badge | H3 `Agents without the runtime baggage.` |
| `c` | 清单卡 | mirrored: import-map manifest (subpath-export chips, ghosted = not imported) → text | H1 `Ultralight TypeScript agent framework.` |
| `d` | 复刻 Mastra ★winner | centered stack + wide product window: code pane + trace-waterfall pane (`input → tool-call → tool-result → text-delta → finish`); CTA = GitHub + **Copy quick start** | H5 `Build ultralight AI agents.` |

All variants carry clickable **headline alternates** (H1–H6, README-grounded) so copy can be mixed
across forms — click a chip to swap headline + sub live, per variant. H6 (`Build AI agents.`) is a
literal mastra-sentence replica, flagged 慎用.

## Run

Open `index.html` (double-click), or:

```sh
cd prototype/hero && python3 -m http.server 4174
```

- Floating bottom bar or `←`/`→` keys switch variants (URL param, reload-stable over http).
- `◐ theme` toggles light/dark on the same A tokens.
- CTA = GitHub (primary) + Docs `coming soon` (ghost), per map. Nav/section-hint are context only.

Copy constraints honored: absolute facts only (`0 runtime dependencies`, CI byte budget);
no KB / test numbers (ADR-0001); no competitor names; no RAG/evals claims.

## Verdict (2026-10-02, closes #4)

**D 复刻 Mastra + H5 + 仿 Copy quick start.** 主 CTA GitHub；次 CTA「Copy quick start」（复制 README quick start，复制内容终稿随 #6）；0.5.0 发布前全站不出现 install 类命令（含 git clone）。

Not production code. The floating bar never ships. Do not fold into the real site.
