# 调研:域名与 handle 可用性——balsa 营销站 + docs 子域

> **报告**:`docs/research/domain-and-handles.md` @ 分支 `research/domain-and-handles`(本仓库)。
> **研究方**:wayfinder 研究票 [#9 域名与 handle 可用性调研](https://github.com/0xnicholas/balsa-website/issues/9);地图 [#1](https://github.com/0xnicholas/balsa-website/issues/1)。
> **抓取日期**:**2026-10-01**(13:13–13:25 UTC,本机直连)。全程**只读**:未注册任何域名、未下单、未创建任何账号/org/scope、未登录 npm。
> **一手来源**:各 TLD **registry RDAP**(端点由 IANA 的 `rdap/dns.json` bootstrap 直取,不经过聚合站)、公共 DNS over HTTPS(dns.google 与 cloudflare-dns.com **两个独立递归**)、GitHub REST API(认证调用)、npm registry 公开端点(三端点交叉标定,见 §3.3)、X 公开页面、`hstspreload.org` API。
> **本文只呈现事实与候选,不替老板拍板**;需要人拍的点集中在 §4.1 的分叉与 §8 的行动清单。
> **修订(2026-10-01,双轴评审回改)**:① §7 的域名复现命令改为**按 IANA bootstrap 逐 TLD 取端点**(旧版统一打 Google Registry 端点,查 `.run`/`.codes` 会问到**错的 registry**——而问错 registry 同样回 404,会把结论读反);② §3.1 的「四绿」列改为**三面**并显式给出四绿集;③ §4.2 增第 3 条与 §4.4——把与 balsa-framework **ADR-0013** 的冲突显式记账、给 `balsa.ai`/`balsa.org` 单列处置;④ §1.2 / §2.2 的绝对化措辞收紧(最短、全线);⑤ 用词取消费商侧的术语表写法「docs 站」→「**文档站**」(balsa-docs `CONTEXT.md` 的定义),「escape-hatch 根」这个自造词一律换成自解释的「同名根」。

---

## 0. 口径

**本票要的**(#9 原文):候选清单 + 可用性 + 推荐。

- 域名候选(票面给定):`balsa.dev` / `balsa.sh` / `balsa.run` / `balsa-ai.dev` / `getbalsa.dev` / `balsajs.dev`;
- handle 候选(票面给定):GitHub org、X、npm org 的 `balsa` / `balsa-ai` / `balsajs` / `getbalsa`。

**两个消费方,要求不同**:

1. **营销站**(本仓库):apex 自持 + 品牌 handle 齐;
2. **文档站**(balsa-docs):[delivery §3.1 / §3.3 / §3.4](https://github.com/0xnicholas/balsa-docs/blob/main/docs/spec/delivery.md) 只要求交付**两样**——一个 `<apex>` + 一条 `<apex>` 内 `docs` 子域记录的控制权(形态固定 `docs.<apex>`,域落地由 docs 侧一行 PR 发起)。同节明写:`balsa.dev` **不是**默认前提(apex 是第三方个人站,`docs.balsa.dev` 落在其 zone 内)。

**判定法与证据强度**(每条结论都可由 §7 的命令重跑):

| 证据 | 覆盖 | 强度 |
| --- | --- | --- |
| **registry RDAP** `404`(ICANN RDAP Profile 响应体) | 在 IANA bootstrap 里的 TLD | **强**——registry 里没有该对象 |
| **registry RDAP** `200` | 同上 | **强**——附注册商、注册/到期日、状态、NS |
| 公共 DNS `NXDOMAIN`(两个独立递归一致) | 全部 | 中——与 RDAP 互证;TLD 不回 RDAP 时**是唯一证据** |
| 公共 DNS `NOERROR` + NS 记录 | 全部 | 中——存在委派 = 已被注册 |
| HTTP 探测(站点/停放页) | 全部 | 弱,仅作旁证 |

**读法**:RDAP 的 `404` 表示**查询时刻** registry 无该对象——不等于"能买到"是永久事实(见 §6 第 1 / 6 条:premium 档位与时效)。

---

## 1. TL;DR

1. **六个票面候选里,可注册的只有四个**:`balsa.run`、`balsa-ai.dev`、`getbalsa.dev`、`balsajs.dev`;**`balsa.dev` 与 `balsa.sh` 都已被占用**(§2.1)。
2. **「balsa」这个裸词在本次查的**每一类**公开面都有主**:十个主流 TLD 全部已注册(`balsa.com` / `.dev` / `.io` / `.sh` / `.app` / `.ai` / `.tools` / `.build` / `.org` / `.net`);GitHub org `balsa`(**verified**,2020 年);X `@balsa`;npm org `@balsa`。→ **本批查到的这些面上,裸 `balsa` 没有一个空着**(唯一例外 = `balsa.so`,只有 DNS 证据、后缀生态位也弱,见 §2.1 / §6)。
3. **npm org `@balsa` 已经存在**(名下 0 个包)——这与 balsa-framework[#45](https://github.com/0xnicholas/balsa-framework/issues/45) checklist 第 1 项「创建 npm org `@balsa`」的**票面假设相反**。判定经三端点标定(§3.3),签名是**组织**,不是个人 scope。→ 给框架侧的输入单列 §5。
4. **三个「同名根」在域名 + GitHub + X + npm scope 四面全绿**:`balsajs`(→ `balsajs.dev`)、`getbalsa`(→ `getbalsa.dev`)、`balsa-run`(→ `balsa.run`)(§2.1 / §3.1)。→ 建议就按**同名根**来选:四个公开面共用一个名字,别在第二个面上再撞一次。
5. **推荐序**(理由与代价见 §4):**① `balsajs.dev` → ② `getbalsa.dev` → ③ `balsa.run`**;`.com` 变体(`balsajs.com` / `getbalsa.com`)同样空着,可一并拿下做跳转/防抢注。
6. 一条与域名无关但**必须现在知道**的硬事实:**包 scope 的可选集是有限的,而 docs 侧的参考树、入口 shim、import-map 页与全部代码样例都已经按 `@balsa/core` 落地**(238 页生成树)——scope 若要改,现在改最便宜,发版之后改最贵(§5)。

---

## 2. 域名可用性

### 2.1 总表(2026-10-01 13:13–13:25 UTC)

| 候选 | RDAP(registry) | DNS(两递归) | 判定 | 占用 / 备注 |
| --- | --- | --- | --- | --- |
| `balsa.dev` | **200** · Namecheap Inc. · reg 2025-10-17 · exp 2030-10-17 · `clientTransferProhibited` | `NOERROR` · NS `etta`/`ryan.ns.cloudflare.com` | ✗ 已被占 | 第三方个人站:`https://balsa.dev/` → `https://luis.balsa.dev/en`;**`docs.balsa.dev` = HTTP 520**(与 balsa-docs delivery §3.1 的记载一致) |
| `balsa.sh` | *(该 TLD 不在 IANA RDAP bootstrap)* | `NOERROR` · NS `ns1`/`ns2.dyna-ns.net` | ✗ 已被占 | `https://balsa.sh/` → **410 Gone**(停放) |
| `balsa.run` | **404** | `NXDOMAIN` ×2 | ✓ **可注册** | 票面候选 |
| `balsa-ai.dev` | **404** | `NXDOMAIN` ×2 | ✓ **可注册** | 票面候选(`balsa-ai` 的 handle 另见 §3) |
| `getbalsa.dev` | **404** | `NXDOMAIN` ×2 | ✓ **可注册** | 票面候选 |
| `balsajs.dev` | **404** | `NXDOMAIN` ×2 | ✓ **可注册** | 票面候选 |
| `balsa.io` | *(不在 bootstrap)* | `NOERROR` · NS `ns1vwx`/`ns2kry`/`ns3dgr`/`ns4qxz.name.com` | ✗ 已被占 | `https://balsa.io/` → HTTP 436,未见站 |
| `balsa.so` | *(不在 bootstrap)* | `NXDOMAIN` ×2 | ✓ 可注册(证据较弱) | 仅 DNS 证据;`.so` 注册政策未核 |
| `balsa.app` | **200** · Porkbun LLC · reg 2022-07-12 | — | ✗ 已被占 | — |
| `balsa.build` | **200** · Cloudflare, Inc. · reg 2026-04-30 | — | ✗ 已被占 | 2026-04 刚被注册 |
| `balsa.tools` | **200** · Amazon Registrar, Inc. · reg 2020-07-14 | — | ✗ 已被占 | — |
| `balsa.codes` | **404** | `NXDOMAIN` ×2 | ✓ **可注册** | 附加候选 |
| `balsa.ai` | **200** · Atom.com Domains LLC · reg 2022-11-09 | NS `ns1`/`ns2.atom.com` | ✗ 已被占(**在售**) | `https://balsa.ai/` → `https://www.atom.com/name/Balsa.ai`——挂在 Atom 市场上待售,可谈,价格未知 |
| `balsa.org` | **200** · GoDaddy.com, LLC · reg 2004-10-08 · **exp 2026-10-08** | NS `connect1`/`connect2.squarespacedns.com` | ✗ 已被占 | "The Biotechnology and Life Science Advising Group"(同名非营利,BALSA 是缩写) |
| `balsa.com` | **200** · Cloudflare, Inc. · reg 1997-04-28 · exp 2031-04-29 | NS `etienne`/`nola.ns.cloudflare.com` | ✗ 已被占 | 一家叫 **Balsa** 的软件公司(见 §3.2) |
| `balsa.net` | **200** · Cloudflare, Inc. · reg 1998-07-23 | — | ✗ 已被占 | — |
| `getbalsa.com` | **404** | `NXDOMAIN` ×2 | ✓ **可注册** | 附加候选 |
| `balsajs.com` | **404** | `NXDOMAIN` ×2 | ✓ **可注册** | 附加候选 |

### 2.2 可注册集的形态

可注册的四类,**按"离原词有多远"排序**:

1. **同词换 TLD**:`balsa.run`(`.run` 与项目 tagline「run anywhere」同向)、`balsa.codes`、`balsa.so`(三个推荐里 `balsa.run` 最短,但这批里字符串最短的其实是 `balsa.so`——代价见 §6 第 2 条);
2. **加后缀保原词**:`getbalsa.dev` / `getbalsa.com`——"getX" 是原词被占后的标准兜底形态,检索词"balsa"不变;
3. **加生态后缀**:`balsajs.dev` / `balsajs.com`——JS/TS 生态的惯例形态(对照:Vue 用 `vuejs.org`),`.dev` 本身就适合开发者受众;
4. **连字符变体**:`balsa-ai.dev`(`balsa-ai` 的 GitHub handle 已被占,见 §3.1 → 不建议作为**统一根**)。

### 2.3 判定法与可复现证据

```bash
# ① registry RDAP —— 端点从 IANA bootstrap 取(不经过聚合站)
curl -s https://data.iana.org/rdap/dns.json | jq -r '.services[] | select(.[0][]=="dev") | .[1]'
#   → ["https://pubapi.registry.google/rdap/"]        (.dev / .app = Google Registry)
#   → ["https://rdap.identitydigital.services/rdap/"] (.run / .ai / .codes / .tools)
#   → ["https://rdap.verisign.com/com/v1/"]           (.com / .net)
#   → ["https://rdap.centralnic.com/build/"]          (.build)
# ⚠️ 端点必须与 TLD 对上:问错 registry 会回 404(实测:Identity Digital 的端点对 .dev 名同样 404)
#    ——错端的 404 不是可用性证据。§7 给了按 bootstrap 自动取端点的写法。

curl -sS -o /dev/null -w '%{http_code}\n' \
  -H 'Accept: application/rdap+json' https://pubapi.registry.google/rdap/domain/balsa-ai.dev
#   → 404 = registry 里没有该对象;200 = 已注册(响应体含注册商/日期/状态/NS)

# ② 公共 DNS 交叉验证(两个独立递归),TLD 不回 RDAP 时是唯一证据
curl -s 'https://dns.google/resolve?name=balsajs.dev&type=NS'          | jq '{Status,Answer}'
curl -s 'https://cloudflare-dns.com/dns-query?name=balsajs.dev&type=NS' \
     -H 'Accept: application/dns-json' | jq '{Status,Answer}'
#   → Status 3 = NXDOMAIN(未被注册);Status 0 + Answer = 已委派(已注册)
```

**标定样本**(证明上述判定不是自说自话):`dns.google` 与 `cloudflare-dns.com` 对 `balsa.dev` / `balsa.io` / `balsa.sh` 都回 `NOERROR` + NS;对 `example.com` 回 `NOERROR`;对构造域名 `zzqqxx-no-such-domain-4711.sh` / `.io` 回 `NXDOMAIN`。

---

## 3. handle 现状

### 3.1 总表(方法见 §3.3)

| 根 | GitHub | X | npm scope `@<根>` | 三面全绿? |
| --- | --- | --- | --- | --- |
| `balsa` | ✗ **org**(verified,2020) | ✗ **@balsa** | ✗ **org 已存在**(0 包) | ✗ |
| `balsa-ai` | ✗ user(2025-04-24,0 仓,无 bio) | ✓ 空 | ✓ 空 | ✗ |
| `balsa-lang` | ✗ org("The Balsa Programming Language",2023) | — | — | ✗ |
| `balsajs` | ✓ 空 | ✓ 空 | ✓ 空 | **✓** |
| `getbalsa` | ✓ 空 | ✓ 空 | ✓ 空 | **✓** |
| `balsa-run` | ✓ 空 | ✓ 空 | ✓ 空 | **✓** |
| `balsarun` | ✓ 空 | ✗ **@balsarun** | ✓ 空 | ✗ |
| `balsa-framework` | ✓ 空 | ✓ 空 | ✓ 空 | **✓** |
| `balsa-js` | ✓ 空 | ✓ 空 | ✓ 空 | **✓** |
| `balsa-core` | ✓ 空 | ✓ 空 | ✓ 空 | **✓** |

**四绿集**(三面全绿 **且** §2.1 / §2.2 里同名域可注册)= 只有三个:`balsajs` / `getbalsa` / `balsa-run`。表里 `balsa-framework` / `balsa-js` / `balsa-core` 三行只查了 handle 三面,**域名面未查**,不计入。

**npm 包名(scoped 之外)**:`balsa` 这个**包名**是别人的浏览器日志库(最新 `1.1.0`,maintainer `nickfrosty`)——这是 #9 背景里已知的一条;而 `balsa-ai` / `balsajs` / `getbalsa` / `balsa-core` 四个**未加 scope 的包名**都空着。scope 内的包名 `@balsa/core` / `@balsa/mcp-server` / `@balsa/croner` 也都是 `404`(空)——**卡住的不是包名,是 scope 本身**(§3.2)。

### 3.2 占用 `balsa` 的那一方是谁

四条独立证据指向**同一个实体**:

| 面 | 事实 |
| --- | --- |
| `https://balsa.com/`(HTTP 200) | `<title>Balsa • Docs for building software</title>`;自述 "Balsa is a new type of document for software teams to organize ideas, track projects, and collaborate with each other." |
| GitHub org [`balsa`](https://github.com/balsa) | `type=Organization`,`is_verified=**true**`,created **2020-05-02**,blog `https://balsa.com`,email `hello@balsa.com`,`twitter_username=balsa`,description "We're Balsa, and we're building tools for builders." |
| X [`@balsa`](https://x.com/balsa) | HTTP 200,`<title>Balsa (@balsa) / X</title>`,页面 description = "Docs for building software 💛✏️"(与 balsa.com 的 tagline 同句) |
| npm org `@balsa` | 存在,名下 0 个包(§3.3 标定) |

**能确证到哪一步**:GitHub org 与 X 是**读到的**(API / 页面原文);npm org 的**存在**是标定出来的(§3.3);npm org 与前三者是**同一实体**属于**推断**(品牌一致,且 `balsa.com` 的 NS 与 GitHub org 的 blog 同指一处)。npm 官网的 org 页在本机被 Cloudflare 拦(403),经代理只取回外壳(该页要 JS)→ **没能读到 npm org 页本身**(§6 第 3 条)。

另有一条历史线索:GitHub org [`balsa-lang`](https://github.com/balsa-lang)("The Balsa Programming Language",2023-06-09,0 仓)——说明"balsa"这个名字在开发工具邻域**被注册过至少三次**。

### 3.3 npm scope 的判定法(三端点标定)

npm 没有公开的"org 是否存在"接口,所以用一个**标定过的间接判定**:三个端点各查一批已知样本,再看候选落进哪一列。

| 样本 | `/-/org/<n>/package` | `/-/org/<n>/user` | `/-/org/<n>/team` | 签名 |
| --- | --- | --- | --- | --- |
| `sentry`(已知 **org**) | `200` + 150 个包的 access map | `200` `{}` | `401` `Missing "Bearer" header.` | org |
| `babel`(已知 org) | `200` + 包 map | `200` `{}` | — | org |
| `types`(已知 org) | `200` + 包 map | — | — | org |
| `sindresorhus`(已知**个人 scope**) | `200` + 包 map | `200` `{"sindresorhus":"owner"}` | `200` `[]` | 个人 |
| `antfu`(个人 scope) | `200` + 包 map | `200` `{"antfu":"owner"}` | — | 个人 |
| `zzqqxx4711nosuch`(构造名) | `404` `{"error":"Scope not found"}` | `404` 同左 | `404` 同左 | 不存在 |
| **`balsa`(候选)** | **`200` `{}`** | **`200` `{}`** | **`401` `Missing "Bearer" header.`** | **org(存在,0 包)** |

```bash
curl -s https://registry.npmjs.org/-/org/balsa/package   # → 200 {}
curl -s https://registry.npmjs.org/-/org/balsa/user      # → 200 {}            (个人 scope 会回 {"<n>":"owner"})
curl -s https://registry.npmjs.org/-/org/balsa/team      # → 401 Missing "Bearer" header.  (个人 scope 回 200 [])
```

**结论**:`@balsa` 这个 scope **已被一个组织占用**,不是空的;"名下 0 个包"正是它现在完全没用起来的样子。

---

## 4. 推荐

### 4.1 推荐序(需要老板拍板;本文只给排序与代价)

**① `balsajs.dev`(首选)** —— 四个面(`balsajs.dev` + GitHub `balsajs` + X `@balsajs` + npm `@balsajs`)全绿**且同名**;`.dev` 是开发者受众的本命 TLD(**整条 TLD 在 HSTS preload 表里**,实测 `https://hstspreload.org/api/v2/status?domain=dev` → `{"status":"preloaded","preloadedDomain":"dev"}`,即 `.dev` 站点天然 HTTPS-only,与本站取向一致);JS/TS 生态有成熟先例(Vue → `vuejs.org`);顺手拿下 `balsajs.com` 做 301/防抢注。docs 侧落 `docs.balsajs.dev`。
*代价*:`balsajs` 把"balsa"这个检索词拆开了(logotype 里会多一个 "js"),且框架虽是 TypeScript-first,但"js"后缀会让人以为只在 JS 生态可用。

**② `getbalsa.dev`(次选)** —— 保住原词,检索词"balsa"不变;四个面同样全绿(`getbalsa.dev` + GitHub `getbalsa` + X `@getbalsa` + npm `@getbalsa`);`getbalsa.com` 也空着。
*代价*:"getX" 是**原词被占后的通用兜底**,品牌信息量为零;`docs.getbalsa.dev` 读起来长。

**③ `balsa.run`(贴 tagline)** —— 三个推荐里 apex 最短(9 字符 vs 11 / 12),`.run` 与项目自述「run anywhere, no runtime baggage」同向;域本身 `404` 可注册;**handle 根要用连字符形态 `balsa-run`**(GH/X/npm 三绿)——因为 `@balsarun` 在 X 上已被占。
*代价*:在 JS 语境里 `balsa.run` 读起来像**方法调用**(`balsa.run()`),与"域名"的直觉有摩擦;`.run` 的开发者生态位弱于 `.dev`。

**不推荐作为统一根**:`balsa-ai.dev`(对应的 GitHub `balsa-ai` 已被 2025 年注册的账号占着,§3.1);`balsa.codes` / `balsa.so`(可用,但后缀与统一根一致性更差;`.so` 还只有 DNS 证据)。

### 4.2 与域名选择无关、但会一起决定的三条

1. **同名根**:不管选哪一个,建议**域名 / GitHub org / X / npm scope 用同一个根**。现状是裸 `balsa` 在被查的每一类面上都有主(§1.2)——再撞一次的成本,比现在多花五分钟选同名根要高。
2. **`.dev` 与 `.com` 成对拿**:`.dev` 做正站,`.com` 做 301 或至少防抢注;可注册的两对(`balsajs.*` / `getbalsa.*`)都还空着。
3. ⚠️ **「同名根」这条建议撞上 balsa-framework ADR-0013,必须显式记账**:该 ADR 的 Considered Options 明否「**新建 GitHub org 派生名**(`balsa-ai`/`balsafw` 等)」,并把 GitHub 归属定为「个人账号同名仓库(未来需要时仍可迁入 org)」;其 2026-09-30 的修订又把对外品牌定为伞形 **balsa**、子项目仓库名定为 `balsa-framework`。本文的「同名根」(尤其是**新建 org**)与该裁决的前提冲突——**本文不推翻它**:要么框架/品牌侧追加一条修订,要么沿用「个人账号 + 仓库名」的现状。见 §5 第 4 条与 §8 第 3 行。

### 4.3 快速对照

| 方案 | apex | GitHub | X | npm scope | docs 落点 | 一句话代价 |
| --- | --- | --- | --- | --- | --- | --- |
| **① `balsajs.dev`** | ✓ | ✓ | ✓ | ✓ | `docs.balsajs.dev` | 原词被拆开 |
| **② `getbalsa.dev`** | ✓ | ✓ | ✓ | ✓ | `docs.getbalsa.dev` | 通用兜底形态,域名较长 |
| **③ `balsa.run`** | ✓ | ✓ `balsa-run` | ✓ `@balsa-run` | ✓ `@balsa-run` | `docs.balsa.run` | 读起来像方法调用;根带连字符 |
| `balsa.dev`(原意) | ✗ | ✗ | ✗ | ✗ | — | 四面全占,不可得 |
| `balsa-ai.dev` | ✓ | ✗ | ✓ | ✓ | `docs.balsa-ai.dev` | GitHub handle 已占,同名根破 |

### 4.4 已被占、但要单独记账的两条

| 域 | 状态 | 处置 |
| --- | --- | --- |
| `balsa.ai` | 挂在 [Atom](https://www.atom.com/name/Balsa.ai) 市场上**待售**(registrar = Atom.com Domains LLC,NS `ns1`/`ns2.atom.com`) | **唯一能把裸 `balsa` 拿到手**的可谈路径(另一条 = npm/GitHub 的名字争议,§5 第 3 条)。价格未公开、**本文未核**。不进推荐序——它不是「可注册」,是一条「可谈」;要买先询价 |
| `balsa.org` | 同名**非营利**在运("The Biotechnology and Life Science Advising Group",Squarespace 托管) | **不可谈**(同名缩写组织),不再考虑。RDAP 的 `expiration = 2026-10-08` 只作记账,**不当作会掉签**(§6 第 5 条) |

---

## 5. 给 balsa-framework 的输入(事实与代价,不替它裁决)

> 这一节不属于 #9 的交付面(域名/handle),但同批查到的**硬事实**会改变框架侧发布票的前提,故一并记录。

1. **事实**:npm org `@balsa` **已存在**(§3.2 / §3.3)。balsa-framework[#45](https://github.com/0xnicholas/balsa-framework/issues/45) checklist 第 1 项「创建 npm org `@balsa`」按现状**无法直接完成**;`@balsa/core` 本身空着,但**空包名 ≠ 能发**——发布者必须是该 scope 的持有者。ADR-0013 的 Consequences 原文写的是「截至 2026-09-28,该 scope 名下无任何已发布包,**可申领**」——本批证据反驳的正是「**可申领**」这一步:**名下 0 个包 ≠ 未被注册**。
2. **若 scope 必须改**(例如改成 `@balsajs`,与 §4.1 的①同名),**现在改最便宜**:
   - 框架侧:尚未发布(#45 未做),包名/子路径导出/examples 是仓库内一致性改动;
   - docs 侧:参考树已经按 `@balsa/core` 生成并入库——**238 页生成树 + 10 个入口 shim**(入口 shim 文件名承载模块组名,`api-reference §4 F9` 明写"入口一挪全树哈希变")+ `import-map` 页 + 全站代码样例都要跟着重生成,`pnpm regen:api` / `pnpm verify:api` 能承担机械部分,但是一次全量返工。
3. **若想留在 `@balsa`**:路径只有 npm 的名字争议/转让流程,需要商标或优先使用证据;而对手是一家 **2020 年**就在用这个名字、GitHub org **已被验证**、同持 `balsa.com` 与 X `@balsa` 的公司(§3.2)。成功率与时效本文**未核**。
4. **不替裁决**:决策属 balsa-framework 的 [ADR-0013](https://github.com/0xnicholas/balsa-framework/blob/main/docs/adr/0013-naming-and-branding.md) / #45;本文只提供证据、代价与时序(发布前 / 发布后)。**GitHub 归属那一半同样有既有裁决**(ADR-0013 明否「新建派生 org」)——冲突与处置见 §4.2 第 3 条,本文只记不裁。

**给 balsa-docs 的输入**:docs 侧只依赖 `<apex>`,与 scope 决策**解耦**——`docs.<apex>` 与包名是不是 `@balsa/*` 无关。故 [#29 上域](https://github.com/0xnicholas/balsa-docs/issues/29) 可以**在 scope 决策之前**落地(改一行 `src/lib/site.ts`);被 scope 决策影响的是 [#30 npm 0.1.0 切换](https://github.com/0xnicholas/balsa-docs/issues/30)。

---

## 6. 未验证 / 证据强度不足

1. **价格与 premium 档位未核**:RDAP 只回答"注册状态",不回答价格。构造词(如 `balsajs`)通常是标准价,但**字典词**在个别 TLD 可能落在 premium 表里——`balsa` 是西/葡语常用词("筏")。**唯一可靠处是 registrar 的下单结算页**(本机取不到报价:Cloudflare 的域名页是 JS 应用、静态抓取无价目表;`.dev` 的 registry 营销页 `get.dev` 同样列不出价)。
2. **`.sh` / `.io` / `.so` 只有 DNS 证据**:这三个 TLD **不在 IANA RDAP bootstrap** 里,本机 whois(43 端口)被网络策略挡掉——"已被占"由两递归的 NS 记录判定(`balsa.sh` → `dyna-ns.net`、`balsa.io` → `name.com`),另有 HTTP 旁证(410 / 436)。
3. **npm org `balsa` 的持有者身份是推断**:`https://www.npmjs.com/org/balsa` 在本机被 Cloudflare 拦(403),经代理只取回页面外壳(要 JS);本文只确证**该 org 存在**与**名下 0 个包**,至于它是否就是 §3.2 的 Balsa 公司、以及**能否转让、转让成本**,均未核。
4. **X 的判定语义**:只按 HTTP 状态码 + `<title>` 判定(200 = 存在,404 = 空)。**被封禁/注销账号是否回 404 未核**;结论对营销站够用,但对"这个名字是否真的能用"要留一线。
5. **`balsa.org` 的到期字段**:RDAP 报 `expiration = 2026-10-08`(查询时距今 7 天),但这是 registry 字段,**注册商是否自动续期未知**。本文**不**把"即将掉签"当作可规划的事实。
6. **时效**:RDAP `404` 只代表**查询时刻**的状态。任何结论在动手前用 §2.3 的命令重跑一次即可刷新。
7. **`.dev` 的保留字表未逐条核**:Google Registry 的 policy 页可取,但"`balsa*` 是否在保留名单"本文**未取得证据**——按下单页为准(同第 1 条)。
8. **`balsa-lang` / `balsa-ai` 两个占用者的意图未核**(都 0 仓、无活动):是抢注、是弃用、还是有人在做同名项目,无从判断。

---

## 7. 复现法

```bash
# ---- 域名:registry RDAP —— 端点**按 TLD 从 IANA bootstrap 取**,再查对象(404 = 可注册) ----
# ⚠️ 端点必须与 TLD 对上:问错 registry 也会回 404(实测:Identity Digital 的端点对 .dev 名同样 404)
#    ——错端的 404 **不是**可用性证据。
BOOT=$(mktemp); curl -sS https://data.iana.org/rdap/dns.json -o "$BOOT"
ep() { python3 -c "
import json,sys
t=sys.argv[1].rsplit('.',1)[1]
b=json.load(open(sys.argv[2]))
for s in b['services']:
    if t in s[0]: print(s[1][0]); break
" "$1" "$BOOT"; }
for d in balsajs.dev getbalsa.dev balsa-ai.dev balsa.run balsa.codes getbalsa.com; do
  base=$(ep "$d")
  if [ -z "$base" ]; then printf '%-14s no RDAP in IANA bootstrap → 只走 DNS\n' "$d"; continue; fi
  printf '%-14s %-46s ' "$d" "$base"
  curl -sS -o /dev/null -w '%{http_code}\n' -H 'Accept: application/rdap+json' "${base}domain/$d"
done
# 实测（2026-10-01）：.dev/.app → pubapi.registry.google；.run/.ai/.codes/.tools → rdap.identitydigital.services；
#                      .com/.net → rdap.verisign.com；.sh/.io/.so 不在 bootstrap（无 RDAP，只走 DNS）

# ---- 域名:两个独立递归交叉验证(NXDOMAIN = 未注册) ----
for res in https://dns.google/resolve https://cloudflare-dns.com/dns-query; do
  curl -s "$res?name=balsajs.dev&type=NS" -H 'Accept: application/dns-json' | jq -c '{Status,Answer}'
done

# ---- handle:GitHub(404 = 空)/ npm / X ----
gh api users/balsajs --jq '.type' 2>/dev/null || echo "GitHub AVAILABLE"
curl -s https://registry.npmjs.org/-/org/balsajs/user  | jq -c .   # → {"error":"Scope not found"} = 空
curl -s https://registry.npmjs.org/-/org/balsa/user    | jq -c .   # → {}                            = 已占(org)
curl -s -o /dev/null -w '%{http_code}\n' -A 'Mozilla/5.0' https://x.com/balsajs   # → 404 = 空

# ---- TLD 级事实 ----
curl -s 'https://hstspreload.org/api/v2/status?domain=dev' | jq -c .   # → preloaded
```

---

## 8. 行动清单

| # | 谁 | 动作 |
| --- | --- | --- |
| 1 | **老板**(本票的裁决点) | 拍板统一根:§4.1 的 ① / ② / ③;拍板是否连 `.com` 一起拿 |
| 2 | **老板** | 在 registrar 下单(结算页验价,注意 premium 档),得 apex 控制权 |
| 3 | **老板** | 建同名 **X 与 npm org**;GitHub 归属**先拍再动**——现状(个人账号,ADR-0013 原裁)还是新建同名 org(与该 ADR 的 Considered Options 冲突,§4.2 第 3 条) |
| 3b | **老板**(可选) | 想拿**裸 `balsa`** 就先给 `balsa.ai` 询价(§4.4)——不进推荐序,是一条「可谈」路线 |
| 4 | **老板** | DNS:把 apex 放进 Cloudflare zone,给 docs 留一条 `docs.<apex>` 的 CNAME/自动记录;**CAA 不得阻断证书签发**(balsa-docs delivery §3.3) |
| 5 | balsa-docs | [#29 上域 PR](https://github.com/0xnicholas/balsa-docs/issues/29):改 `src/lib/site.ts` 一处 → canonical / sitemap / `llms.txt` 绝对链接 / manifest 同批更新,再按 delivery §13.4 验收 |
| 6 | balsa-framework | [#45](https://github.com/0xnicholas/balsa-framework/issues/45) checklist 第 1 项(「创建 npm org `@balsa`」)按 §5 复核后再动;发布前给 ADR-0013 **追加一条修订**(该 ADR 惯例:正文保留当时的记录,新事实以修订块追加),更新「scope 可申领」与「GitHub 归属」两条前提 |

---

_产出方:[#9 域名与 handle 可用性调研](https://github.com/0xnicholas/balsa-website/issues/9)(wayfinder 研究票);消费方:本仓库的[地图 #1](https://github.com/0xnicholas/balsa-website/issues/1) 与 balsa-docs 的 [#29](https://github.com/0xnicholas/balsa-docs/issues/29) / [#30](https://github.com/0xnicholas/balsa-docs/issues/30)。_
