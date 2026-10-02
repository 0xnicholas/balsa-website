# 调研:Astro 营销站技术方案——balsa landing 站

> **报告**:`docs/research/astro-tech.md` @ 分支 `research/astro-tech`(本仓库)。
> **研究方**:wayfinder 研究票 [#10 Astro 营销站技术方案](https://github.com/0xnicholas/balsats-website/issues/10);地图 [#1 Wayfinder map: balsa 营销站 spec](https://github.com/0xnicholas/balsats-website/issues/1)。
> **抓取日期**:**2026-10-02**。全程**只读**:未安装依赖、未初始化任何工程、未部署、未创建任何账号。
> **一手来源**:npm registry(全部版本事实)、Astro 官方文档、Tailwind 官方文档、Shiki 官方文档、Expressive Code 官方文档与 GitHub issue、Cloudflare Workers 官方文档;另加本机实测的 `../balsats-docs`(Astro 7.3.5 在跑)与 `../balsats-framework`。
> **本文只呈现事实与候选,不替 owner 拍板**;需要拍的点集中在各节 ➡️ 与 §13。

## 0. 口径

**参照系**:mastra.ai = Next.js + Vercel + 动态 OG + 自托管字体 + SVG sprite 图标。目标是用 Astro 实现等效能力且更轻。

**已锁约束(来自地图与各票,本报告不得与之冲突)**

- 结构以 mastra.ai 为模板尽可能贴近;信息架构见 [页面清单与首页 section 序列](https://github.com/0xnicholas/balsats-website/issues/2)。
- 首页代码示例 = **形式 A「file tabs」(复刻 mastra)** —— 见 [首页代码示例](https://github.com/0xnicholas/balsats-website/issues/6);五 feature tab 各 ≤10 行 TS 段。
- 视觉 = 逐字继承 balsats-docs 品牌 token(琥珀 hue 36° + 暖中性 + 系统字体 + 亮暗双主题),见 [品牌方向](https://github.com/0xnicholas/balsats-website/issues/3)。
- **部署目标保持 TBD**;包名一律 `@balsats/*`;`0.5.0` 发布前全站不出现 install 类命令。
- 站点英文优先;内部讨论中文。

**证据强度**

| 证据 | 覆盖 | 强度 |
| --- | --- | --- |
| npm registry `version` / `dependencies` / `peerDependencies` | 全部版本与依赖关系 | **强**——发布者自己声明的元数据 |
| 官方文档原文(Astro / Tailwind / Shiki / Expressive Code / Cloudflare) | 配置形态与官方立场 | **强** |
| 官方 GitHub issue 的 state 字段 | 某个特性是否落地 | 中——见 §11 的两处保留 |
| 本机仓库实测(`../balsats-docs`) | 对齐成本 | **强**——已在跑的实例 |
| 第三方博客/教程 | 仅作路线佐证,不单独支撑结论 | 弱 |

## 1. TL;DR

| # | 问题 | 结论 | 节 |
| --- | --- | --- | --- |
| 1 | Astro 版本与骨架 | 钉 **`astro@7.3.5`**(与 docs 站同版本);内容用 **build-time content collections**(`src/content.config.ts`),不用 live collections | §2 §3 |
| 2 | 样式 | **Tailwind v4 via `@tailwindcss/vite` 4.3.3**,CSS-first;`@astrojs/tailwind` 是 legacy,不能用 | §5 |
| 3 | 暗色主题 | 默认 `prefers-color-scheme` 即可;要手动切换则一行 `@custom-variant dark (&:where(.dark, .dark *))` | §5 |
| 4 | 代码高亮 | Shiki 4 内置(`markdown.shikiConfig.themes` 双主题 + `.astro-code` CSS 变量) | §4 |
| 5 | **file tabs** | **官方没有现成的交互式 tab 组** —— tab 切换必须自己实现(或引社区件);Expressive Code 只给「单张标签外观」外壳 | §4 |
| 6 | OG 图 | **构建时生成**,不是运行时;最小形态 = 一张静态 1200×630(即 [#3](https://github.com/0xnicholas/balsats-website/issues/3) 已定的「docs 形态默认 OG」) | §6 |
| 7 | sitemap / RSS / llms.txt | `@astrojs/sitemap` 要装;`@astrojs/rss` 本期**不装**(无 blog);`llms.txt` 走 `public/` 静态文件 | §7 |
| 8 | i18n 预留 | `i18n` 配置写进骨架但 `locales: ['en']`,英文在根路径;中文页以后加在 `src/pages/zh/**` | §8 |
| 9 | 部署适配 | **`output: 'static'` + 不装任何 adapter** —— 静态站不需要 adapter,这正是「部署目标 TBD」成立的前提 | §9 |
| 10 | 与 docs 站对齐 | 可复用 = 版本、Tailwind 路线、token 单点、origin 单点、静态资产形态;不可复用 = Starlight 及其插件链 | §10 |

## 2. 版本底稿(2026-10-02,npm registry)

| 包 | 版本 | 备注 |
| --- | --- | --- |
| `astro` | **7.3.5** | 最新稳定(2026-09-24 发布);`7.4.0-beta.0` 已于 2026-10-01 发布,**不采用 beta** |
| `@astrojs/markdown-satteri` | 0.4.2 | **Astro 7 起 Markdown 的默认处理器** |
| `@astrojs/markdown-remark` | 7.3.1 | unified 处理器(备选) |
| `@astrojs/mdx` | 8.0.2 | peer `astro ^7.2.10` |
| `@astrojs/sitemap` | 3.7.4 | 要装 |
| `@astrojs/rss` | 4.0.19 | 存在且官方,本期不装 |
| `tailwindcss` / `@tailwindcss/vite` | **4.3.3** | peer `vite: ^5.2.0 \|\| ^6 \|\| ^7 \|\| ^8` |
| `shiki` | 4.5.0 | `astro@7.3.5` 自带 `shiki ^4.0.2`(不必单独装) |
| `astro-expressive-code` | 0.44.2 | 可选(§4) |
| `astro-og-canvas` | 0.13.2 | 可选(§6) |
| `satori` / `@resvg/resvg-js` | 0.34.0 / 2.6.2 | 可选(§6) |
| `@astrojs/cloudflare` / `@astrojs/vercel` / `@astrojs/netlify` | 14.3.3 / 11.0.11 / 8.2.6 | 静态站**都不需要**(§9) |

**运行环境**:`astro@7.3.5` 声明 `engines: { node: ">=22.12.0", npm: ">=9.6.5", pnpm: ">=7.1.0" }`,依赖 `vite ^8.0.13`。
`../balsats-docs` 实测为 `astro 7.3.5` + `tailwindcss ^4.3.3` + `@tailwindcss/vite ^4.3.3` + `node >=22.12.0` + `pnpm@10.33.2`。

➡️ **钉 `astro@7.3.5` 精确版本**(与 docs 站同一枚),Node ≥ 22.12.0,pnpm。不用 `astro add` 隐式取版本(见 §5 的坑)。

## 3. 工程骨架与内容组织

### 3.1 页面组织

Astro 是文件路由:`src/pages/**` 的目录结构即 URL 结构。营销站的页面量级(首页 + `/about` + 两个法务页 + 3 用例页 + 4 关键词页)直接落成 `src/pages/` 下的静态文件即可,**不需要动态路由**;唯一的结构性建议是布局层:

```
src/
├── layouts/          BaseLayout.astro(html/head/OG/meta)、MarketingLayout.astro(header+footer)
├── components/       Header / Footer / FeatureTabs / FaqList / CodeTabs / ScenarioCard …
├── content/          由 ticket 锁定的文案数据(见 3.2)
├── content.config.ts 集合定义
├── styles/global.css 品牌 token 层 + Tailwind 入口
└── pages/            index / about / privacy-policy / terms-of-service / 3 用例页 / 4 关键词页
```

### 3.2 内容集合(build-time content collections)

官方形态(**Astro 7 现行**):集合定义在 `src/content.config.ts`,用 `defineCollection()` 的 `loader` + `schema`,导出单个 `collections` 对象;查询用 `getCollection()` / `getEntry()`。内置 loader 两个:`glob({ base, pattern })` 与 `file(...)`,来自 `astro/loaders`;schema 用 `astro/zod` 的 Zod。

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const faq = defineCollection({
  loader: glob({ base: './src/content/faq', pattern: '**/*.json' }),
  schema: z.object({ q: z.string(), a: z.string(), scope: z.enum(['global', 'page']), page: z.string().optional() }),
});
export const collections = { faq };
```

同一份文档里还有 **live collections**(`src/live.config.ts` + `defineLiveCollection()`,请求时取数)。它**必须配一个 adapter** 才能按需渲染 —— 与 §9 的「无 adapter」直接冲突,**不采用**。

➡️ **用 build-time collections 承载各 ticket 已锁定的文案**(全局 9 题 FAQ、页内 FAQ、五 feature tab 的 claim/支撑项、use-case 卡、场景卡),让 SPEC 里锁定的英文正文变成**带 schema 的数据**,而不是散在 `.astro` 里。页面本身仍用 `.astro` 手写布局(营销版式是定制的,不值得数据驱动)。

### 3.3 Markdown 处理器(影响可用插件)

Astro **v7 起 Sätteri 是 Markdown 的默认处理器**(`@astrojs/markdown-satteri`,Astro 6.4 引入、7.0 转正);官方同时保留 unified 处理器(`@astrojs/markdown-remark`)并由 `markdown.processor` 选择。**后果**:remark / rehype 插件在 Sätteri 下**不会运行**,需要等价的 HAST 插件(Expressive Code 就是为此同时提供两条路径)。

➡️ 若要装任何 remark/rehype 生态插件,先在 SPEC 里钉处理器(或显式钉回 unified);否则用默认 Sätteri。

## 4. 代码高亮:Shiki 与 file tabs 的真实现状

### 4.1 Shiki(Astro 内置,无需额外依赖)

`astro@7.3.5` 自带 `shiki ^4.0.2`。配置在 `markdown.shikiConfig`:

```js
// astro.config.mjs
markdown: {
  shikiConfig: {
    themes: { light: 'github-light', dark: 'github-dark' },   // 双主题
  },
},
```

双主题需要站点侧补 CSS 变量,且**类名要替换**:用 `.astro-code` 而非 Shiki 文档里的 `.shiki`,自定义属性前缀是 `--astro-code-`。`@media (prefers-color-scheme: dark)` 或 class 切换二选一。

`.astro` / `.mdx` 里另有 `<Code />` 组件(`astro:components`),props = `theme` / `lang` / `embeddedLangs` / `transformers` / `defaultColor` / `wrap` / `inline`。
**注意**:`<Code />` **不继承** `shikiConfig`。

### 4.2 file tabs —— 本报告最需要 owner 注意的一条

地图已锁 **形式 A「file tabs」(复刻 mastra)**。核实结果:

1. **Astro 内置高亮没有任何 tab 形态。** `<Code />` 的 prop 列表里没有 tab,也没有分组概念。
2. **Expressive Code(`astro-expressive-code@0.44.2`)的 frames 插件**会把 `title="..."` 渲染成编辑器窗口里的**一张「已打开文件」标签**——这是**外观**(单张、装饰性),并配套暴露了 `editorTabBarBackground` / `editorActiveTabBackground` / `editorActiveTabIndicatorTopColor` 等标签栏样式项。
3. **交互式多标签分组没有可用的官方特性页面。** 相关请求 Issue #22 现为 `CLOSED / COMPLETED`(2025-12-10 关闭,**无关联 PR**),Issue #310 为 `CLOSED / DUPLICATE` 并被指向另一处合并讨论;而官方文档站的 `key-features/code-block-groups/` 返回 **404**,0.44.2 的 release notes 里也没有该特性的条目。证据相互矛盾 —— 见 §11。

➡️ **把 tab 切换当成站点自己的 UI 来做,不要在计划里假定 Expressive Code 提供它。** 两条路线:

- **A. 自己写(推荐)**:一个 `CodeTabs.astro` 组件 —— 标签按钮 + 若干个 `<Code />`(或 Expressive Code 的 `<Code>`),切换用一小段 vanilla `<script>`,无框架依赖;切页无闪烁,产物是纯静态 HTML + 一个 JS 文件。这与 [#6](https://github.com/0xnicholas/balsats-website/issues/6) 原型里实际渲染出来的形态一致。
- **B. 引 Expressive Code 拿外壳**:`astro-expressive-code` 提供编辑器/终端外壳、复制按钮、行标记、折叠段,能省掉「窗口外观」这层手写;**但 tab 切换仍要自己接**(frames 的分组 hook 只用于**样式化**分组)。代价是多一个构建期依赖与一套需要覆盖的品牌样式。

## 5. 样式:Tailwind v4 与暗色主题

**官方路线(不是可选项)**:Tailwind 4 走 `@tailwindcss/vite` 这个 Vite 插件;`@astrojs/tailwind` 是 **legacy,只服务 Tailwind 3**,升到 4 必须卸掉它并从 `astro.config.mjs` 的 `integrations` 里移除。自 Astro ≥ 5.2.0 有 `astro add tailwind` 命令,但它做的就是装 Vite 插件(`../balsats-docs` 的手写形态即 `vite: { plugins: [tailwindcss()] }`)。

```js
// astro.config.mjs
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ vite: { plugins: [tailwindcss()] } });
```

```css
/* src/styles/global.css —— 同时也是品牌 token 层 */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));   /* 只有需要手动切换时才加 */
```

**Tailwind v4 没有 `tailwind.config.js`**:主题走 CSS 的 `@theme`,变体走 `@custom-variant`,一切在 CSS 里。暗色默认吃 `prefers-color-scheme`;要手动切换就覆盖 `dark` 变体(上面那行),然后在 `documentElement` 上切 `.dark`。

**已知坑(实测记录)**:`astro add tailwind` 曾出现 Vite 版本被 hoist 上来导致构建失败的事故(`@tailwindcss/vite` 的 peer 允许 `^5.2 || ^6 || ^7 || ^8`,npm 扁平安装会挑最新,压过 Astro 自己要求的 Vite 版本)。当前 `astro@7.3.5` 依赖 `vite ^8.0.13`、`@tailwindcss/vite@4.3.3` 的 peer 含 `^8`,两边相容 —— **但结论是显式钉版本,别让 `astro add` 替你决定**。

➡️ **`@tailwindcss/vite@4.3.3` + `tailwindcss@4.3.3` + 显式钉 `vite`**;`global.css` 同时当品牌 token 层(与 docs 站同构,见 §10)。暗色:**先只做 `prefers-color-scheme`** —— docs 站的「亮暗双主题」也是系统级,不引入切换按钮就少一个可访问性与状态持久化问题。

## 6. OG 图

三条路线,本质区别在**什么时候画图**:

| 路线 | 形态 | 运行时成本 | 适用 |
| --- | --- | --- | --- |
| ① 单张静态图 | 一个 1200×630 PNG 进 `public/` | 无 | 全站共用一个默认 OG |
| ② **构建时生成** | `astro build` 期间跑 Node 脚本,逐页 PNG 进 `dist/` | 无 | 每页一张、文案不同 |
| ③ 运行时生成 | edge/API route 按请求出图 | 有(冷启动 + 计费) | mastra 走的这条(Next.js API route) |

②的两种实现:`astro-og-canvas`(0.13.2,集成式)或 `satori`(0.34.0,JSX→SVG)+ `@resvg/resvg-js`(2.6.2,SVG→PNG)自己接。**两者都在构建期跑,不需要 adapter**,与 §9 的静态站形态相容。

**现状对照**:`../balsats-docs` 走的是①—— `astro.config.mjs` 里 `site` 派生的一个默认 OG,配 `og:image:width/height` = 1200×630。而 [#3](https://github.com/0xnicholas/balsats-website/issues/3) 已为 landing 定了「**docs 形态默认 OG**」(文字 wordmark),即起点已经是①。

➡️ **本期起步 = ①(已由 #3 决定,SPEC 只需确认)。** 逐页生成(②)属于 SEO fog 里的「OG 图策略」,不进本期;真要上,用构建期方案,**不要**走 mastra 的③——那是 balsa 刻意避免的运行时形态。

## 7. sitemap / RSS / llms.txt / robots

- **sitemap**:`@astrojs/sitemap@3.7.4`,官方集成,构建时爬静态路由(含 `getStaticPaths` 生成的动态路由)。它依赖配置里的 `site`;**`site` 同时也是 canonical 的来源** —— 所以 origin 必须只有一个来源(docs 站的做法是 `src/lib/site.ts` 一处派生 canonical / sitemap / llms / robots)。地图已裁 apex = `balsats.com`,landing 站 = `https://balsats.com`。
- **RSS**:`@astrojs/rss@4.0.19` 是官方集成,但本期**没有 blog**(地图 Out of scope)→ **不装**。票面「为后续 blog 预留」的正确做法是不装依赖、把它记在 fog 里。
- **llms.txt**:最省事的形态是 `public/llms.txt` —— `public/` 会被**原样拷进 `dist/`**、不做处理,零配置即在 `/llms.txt` 可达。docs 站出于体量与多产物考虑用了生成式脚本(+ `llms-manifest.json`);landing 只有十来个页面,**静态文件足够**,不必搬那套管线。
- **robots.txt**:同为 `public/` 静态文件(或构建尾脚本生成);注意 sitemap 的 URL 要与 `site` 一致。

➡️ 装 `@astrojs/sitemap`;`site` = 单一常量(照 docs 站模式);`llms.txt` / `robots.txt` 放 `public/`;RSS 留到有 blog 的那期。

## 8. i18n-ready 目录结构

Astro 内置 i18n 路由(官方配置项):`i18n.locales` + `i18n.defaultLocale` + `i18n.routing`。关键开关是 `routing.prefixDefaultLocale`:

- `prefixDefaultLocale: false`(**默认**):默认语言**不带**前缀,文件放在 `src/pages/` 根;其它语言带前缀(`src/pages/zh/about.astro` → `/zh/about/`)。
- `prefixDefaultLocale: true`:所有语言都带前缀,默认语言文件也要放进 `src/pages/en/`。
- 另有 `routing: 'manual'` 与 `i18n.domains`(后者要求 `output: 'server'` + adapter,**与 §9 冲突**)。

**硬约束**:文件结构与 URL 结构必须一致 —— 选哪种,决定了将来加中文时页面文件往哪儿放。

➡️ **预留但不启用**:写 `i18n: { locales: ['en'], defaultLocale: 'en', routing: { prefixDefaultLocale: false } }`,英文页留在 `src/pages/` 根;**不建 `zh/` 目录、不装翻译依赖**。这样将来加中文 = 新增 `src/pages/zh/**`,现有 URL 一个都不动(`prefixDefaultLocale: true` 会在那天把全站 URL 改一遍,是更贵的预留)。

## 9. 输出模式与部署适配(目标保持 TBD)

- Astro 的 `output` 默认就是 `'static'`:构建期预渲染所有页面。
- **官方原话**:"If you're using Astro as a static site builder, you don't need an adapter." adapter 的作用是产出一个能在某个 runtime 上跑的**服务端脚本**(on-demand 渲染),静态站用不到。存在 `AdapterSupportOutputMismatch` 这类报错也说明 adapter 与 output 是配套概念。
- **Cloudflare 官方文档**同样给了静态 Astro 的无 adapter 配置:只需 `wrangler.jsonc` 里 `assets: { directory: "./dist" }`(**没有 `main` = 没有 Worker 脚本**)。`../balsats-docs` 正是这个形态(注释写明:只有 Worker 脚本才按请求计费,站点不需要)。
- Vercel / Netlify 对静态 Astro 都是零配置。三个目标都能直接吃 `dist/`,**前提是产物不掺 adapter**。

➡️ **`output: 'static'` + 不装 adapter**。这不只是「更轻」——它是「部署目标 TBD」能继续成立的技术前提:一旦为了某个功能装了 adapter,`dist/` 就不再是可移植的静态产物,部署目标事实上就被锁死了。SPEC 里把「产物 = `dist/` 静态目录」写成一条硬约束。

## 10. 与 balsats-docs 的对齐:可复用 vs 不可复用

**可复用(建议对齐)**

| 项 | docs 站现状 | landing 的用法 |
| --- | --- | --- |
| Astro 版本 | `7.3.5` 精确钉 | 同版本 —— 一次升级跑两站 |
| Tailwind | `4.3.3` + `@tailwindcss/vite` 4.3.3,`vite.plugins` 注入 | 同一路线(§5) |
| 品牌 token | `src/styles/global.css` 是**被构建期解析**的 token 层(`parseTokenCss`),解析失败直接让 config 报错 | 同一形态;并可照 [#3](https://github.com/0xnicholas/balsats-website/issues/3) 的裁决加两站 CI 色值对比 |
| origin 单点 | `src/lib/site.ts` 一处派生 canonical / sitemap / llms / robots | 照抄这个模式(§7) |
| 部署形态 | 静态资产、无 adapter、无 Worker 脚本 | 同形态(§9) |
| 质量门 | `pnpm verify` 串起 check-telemetry / check-links / check-brand / check-origin 等 | 按需挑(check-telemetry 与零遥测口径尤其可复用) |

**不可复用**

- **Starlight 本身**(`@astrojs/starlight`):文档框架,提供侧边栏/搜索/版本化;营销站要的是定制版式,套 Starlight 只会背上一套与 IA 冲突的默认结构。
- `starlight-typedoc` / API tree 生成链、`starlight-dot-md`(页面 `.md` 孪生)、`redirects.json` 账本、sidebar/IA 配置、`check-content` / `check-ledger` / `regen-api` 这类与 docs 内容绑定的门。

**代价(记账)**

1. 两站同钉一个 Astro 版本 = 升级同步跑两站(好处),但 landing 会被 docs 的升级节奏绑定;若哪天 docs 先动,landing 要跟。
2. 品牌 token 若只靠「复制 + CI 对比」,漂移是**事后发现**的;要事前一致就得把 token 层抽成共享文件或一个极小的包 —— 这是 [#3](https://github.com/0xnicholas/balsats-website/issues/3) 已记的取舍,本报告不替它升级结论。
3. 两站是**独立工程、不同源**(营销站非 `docs.<apex>` 子路径),所以复用的是栈与约定,**不是** origin 或构建产物。

## 11. 未验证 / 证据强度不足

- **Expressive Code 的交互式 tab 组(§4.2)**:证据自相矛盾 —— Issue #22 的 state 是 `CLOSED/COMPLETED`(2025-12-10)但没有关联 PR;#310 为 `CLOSED/DUPLICATE` 并指向一处合并讨论;然而官方文档站**没有** tab 组页面(`/key-features/code-block-groups/` → 404),0.44.2 的 release notes 里也找不到该特性条目。**结论按「没有」准备**,构建前用 §12 的命令复核一次。
- **被指向的合并讨论本身未取到**:抓取工具两次都返回了 #22 的正文,`#388` 在该仓库的 issue 编号空间里不存在(可能是 Discussion,编号空间不同)。
- **Astro 7.4**:`7.4.0-beta.0` 已于 2026-10-01 发布,未评估其变更;本报告的结论都基于 **7.3.5**。
- **Sätteri 生态兼容面**:只确认了「remark/rehype 插件在 Sätteri 下不运行」与「Expressive Code 为此提供了 Sätteri HAST 路径」;没有逐个核对 landing 可能用到的插件清单。
- **字体与图标**:参照系里 mastra 用自托管字体 + SVG sprite;docs 站用**系统字体**,故 landing 的字体结论已由品牌继承决定(系统字体栈),未另做调研。图标方案(是否 sprite、用哪套图标)未调研。
- **第三方博客佐证**在 §6 只用于说明路线存在,不用于支撑版本或配置结论。

## 12. 复现法

```bash
# ① 版本底稿(全部来自 registry,不经过聚合站)
for p in astro @astrojs/markdown-satteri @astrojs/mdx @astrojs/sitemap @astrojs/rss \
         tailwindcss @tailwindcss/vite shiki astro-expressive-code \
         astro-og-canvas satori @resvg/resvg-js \
         @astrojs/cloudflare @astrojs/vercel @astrojs/netlify; do
  printf "%-30s " "$p"; npm view "$p" version
done

# ② Astro 7 的运行环境与 Vite 依赖
npm view astro@7.3.5 engines dependencies.vite

# ③ Tailwind Vite 插件的 peer 区间(判断与 Astro 自带 Vite 是否相容)
npm view @tailwindcss/vite@4.3.3 peerDependencies

# ④ 静态站是否需要 adapter(官方原话)
#    https://docs.astro.build/en/guides/on-demand-rendering/
#    → "If you're using Astro as a static site builder, you don't need an adapter."

# ⑤ file tabs 特性复核(构建前跑一次;§11 的保留项)
gh issue view 22  --repo expressive-code/expressive-code --json state,stateReason
npm view astro-expressive-code version
curl -sSI https://expressive-code.com/key-features/code-block-groups/ | head -n1   # 期望:仍 404

# ⑥ docs 站的对齐基线(本机)
grep -E '"(astro|tailwindcss|@tailwindcss/vite)"' ../balsats-docs/package.json
cat ../balsats-docs/wrangler.jsonc
```

## 13. 行动清单(给 [整合营销站 SPEC.md](https://github.com/0xnicholas/balsats-website/issues/11) 的输入)

**已在 SPEC 里可以写死的**

1. 依赖钉版本:`astro@7.3.5`、`tailwindcss@4.3.3`、`@tailwindcss/vite@4.3.3`、`@astrojs/sitemap@3.7.4`;Node ≥ 22.12.0。**不用 `astro add` 取版本。**
2. `output: 'static'`,**不装 adapter**;交付物 = `dist/` 静态目录(部署目标继续 TBD)。
3. `site` = 单一常量(= `https://balsats.com`),canonical / sitemap / robots 都从它派生。
4. 各 ticket 锁定的英文正文(9 题 FAQ、页内 FAQ、五 tab、卡片、场景卡)落进 `src/content/` 作为带 schema 的数据。
5. i18n 配置按 §8 写进骨架;不建 `zh/` 目录。
6. `llms.txt` / `robots.txt` 走 `public/`;OG 起步 = 单张静态 1200×630。
7. 暗色先只做 `prefers-color-scheme`(不引入切换按钮)。

**需要 owner 拍的(本报告不代拍)**

| # | 分叉 | 选项 | 代价 |
| --- | --- | --- | --- |
| A | **file tabs 怎么实现**(必须拍,它是已锁的「形式 A」) | ① 自写 `CodeTabs.astro`(纯 Shiki)② 引 `astro-expressive-code` 拿外壳 + 自接切换 | ①零新依赖、外观要自己调;②外壳/复制按钮/行标记白拿,但多一个构建期依赖且要覆盖品牌样式 |
| B | **Markdown 处理器** | ① 默认 Sätteri ② 显式钉回 unified(`@astrojs/markdown-remark`) | ②能用整个 remark/rehype 生态,①更轻但插件面窄;只有在确实要装 remark 系插件时才需要拍 |
| C | 逐页 OG 生成是否进本期 | ① 不进(fog 里继续挂着)② 进(构建期 satori/resvg) | ②要写模板与字体加载,首期收益只体现在社交分享卡 |
| D | 字体/图标方案 | ① 系统字体栈 + 内联 SVG ② 自托管字体 + 图标 sprite | ①与 docs 站一致、零请求;②更接近 mastra,但多一批静态资产与授权事项 |
