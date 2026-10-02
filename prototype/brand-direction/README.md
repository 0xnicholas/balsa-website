# prototype/brand-direction — THROWAWAY

**Question (balsats-website #3)**: landing 继承 balsa-docs 的琥珀 token（A），还是差异化（B / C）？
Three landing brand-direction variants on one page, switchable via `?variant=a|b|c`.

| key | name | premise | default theme |
| --- | --- | --- | --- |
| `a` | 继承暖纸 | inherits balsa-docs §2.2 tokens verbatim (amber `#9e630a`/`#efd29f` + warm neutrals + system fonts) — landing as sibling of docs | light (dark toggle) |
| `b` | 深木 | differentiation: engineering dark wood (`hsl(26,16%,7%)`) + amber glow; "docs = 暖纸, landing = 深木" layering | dark (light alt = docs paper) |
| `c` | 单色工程 | mastra referent: neutral near-black monochrome, amber as single accent point, mono/dense typography | dark (cool light alt) |

## Run

Open `index.html` (double-click), or:

```sh
cd prototype/brand-direction && python3 -m http.server 4173
```

- Floating bottom bar or `←`/`→` keys switch variants (URL param, reload-stable over http).
- In-page `◐ theme` button toggles light/dark per variant.
- "tokens in play" strip surfaces the live swatches being judged.
- Copy is real (CONTEXT.md tagline, framework quick start); structure follows closed #2
  (hero → feature tabs → final CTA); social proof deliberately absent (placeholder per map).

Not production code. The floating bar never ships. Do not fold into the real site.
