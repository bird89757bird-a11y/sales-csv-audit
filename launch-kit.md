# Sales CSV Audit｜零付费发布与验证

发布状态：**PUBLISHED**。版本：0.2.0。证据状态：**SYNTHETIC / PARTIAL / CSV ONLY**。没有真实客户、客户案例、付款或收入证明。

0.2.0 增加列对应、合成输入模板、可下载的需求草稿和 GitHub 公开需求入口。原 CSV 金额与完整性验收不变；跨表比较仍为待评估需求，尚无该功能。上线不计作合格曝光或成交。

本次上线后的 13 项浏览器检查通过，记录在 `verification/iteration-02.json`。覆盖列对应确认、输入变化后撤销旧结果、四类下载、草稿不带出文件内容、手机布局和无上传请求；没有替用户提交测试 Issue。

许可证：MIT。网站：https://bird89757bird-a11y.github.io/sales-csv-audit/ 。2026-09-12 线上页面、样例、文件选择、两份 CSV 实际下载及手机布局验收通过，记录在 `verification/live.json`；以下外发文案仍为草稿，五次合格曝光尚未执行。

## 一句话定位

把一份销售 CSV 中的重复行、缺字段和金额问题先标出来，再生成可核对的每日销售、成本与简化毛利汇总；全部在浏览器本地运行。

## 可以公开的证据

- 固定合成样例 9 行：5 行接受、2 行重复、2 行缺字段拒绝，状态 PARTIAL。
- 接受行数量 11，销售额 $101.26、成本 $57.34、简化毛利 $43.92；其中一天为 -$4.00。
- 5 项验收测试通过；已证明金额篡改会让冻结验收失败，恢复后重新通过。
- 无账号、无上传、无 API、无服务器；当前只处理用户主动提供的本地 CSV。

## 首轮外发文案

### GitHub README 顶部短文

<!-- COPY_START github -->
Free, browser-local sales CSV audit. Paste or choose a CSV to surface duplicate lines, missing fields and amount issues, then download daily totals and an issue list. The included synthetic sample is deliberately PARTIAL: 9 input rows become 5 accepted, 2 duplicate and 2 rejected rows. No account, upload or backend is required. This is a bounded data-quality demonstration; real business rules must be agreed before automation.
<!-- COPY_END github -->

### 公众号 / 小红书短文

<!-- COPY_START chinese -->
我做了一个免费的销售 CSV 预审工具：不上传文件，直接在浏览器里找重复行、缺字段和金额问题，再下载每日汇总和异常清单。示例故意放了坏数据，9 行里只有 5 行进入合计，所以结果明确显示 PARTIAL。它适合先判断一份表为什么对不上；如果你每天都在手工合并同类表，可以拿一份去隐私的字段样例，我们先把一个代表性来源和验收口径说清楚。
<!-- COPY_END chinese -->

### 英文社区帖

<!-- COPY_START english -->
I built a free browser-local checker for sales CSV files. It flags duplicate IDs, missing required fields and invalid amounts, then exports daily totals and a review list. The demo stays honest about incomplete data: its synthetic fixture reports PARTIAL instead of treating a successful run as a complete reconciliation. If you maintain recurring sales exports, I would value a de-identified field sample and the one failure that costs you the most review time.
<!-- COPY_END english -->

## 唯一实验

首轮只测试定位，不改功能和报价：向 5 个确实需要重复整理销售 CSV 的目标展示同一版本，逐次记录到 `tracking.csv`。合格曝光必须有可核验的目标来源和对方确实存在相关流程；泛流量不计。

五次后只看漏斗：

- 0 次查看/回复：优先修渠道或首句，不加功能。
- 有查看/回复、0 个合格问题：检查受众是否真有重复销售表，或价值表达是否过宽。
- 有合格问题、0 份去隐私样例：缩小索取内容，只要表头、3–10 行合成/脱敏数据和一个失败例子。
- 收到样例：冻结一个代表性付费试点的字段、口径、输出、异常、交期和验收，再报价。
- `paid_pilot` 只有付款证据后写 1；`revenue` 只填实际确认金额。

统一 CTA：**请提供一份去隐私的表头/合成样例、期望日报和最常见的异常；先定义一个代表性来源的付费试点。**

## 禁止宣称

- 不说已经连接真实网页、邮箱或 11 个来源。
- 不说可以交付 XLSX、云调度、通知或完整会计利润。
- 不说已有客户案例、成交、收入或生产稳定性。
- 不把 $180 试点建议或 $1,050 草案写成客户已经接受的价格。

## GitHub Pages 发布检查

1. 本次已获授权：创建公开仓库 `sales-csv-audit`，采用 MIT License，启用免费 GitHub Pages。审查发布目录，确认只有合成数据。
2. 把 `release-manifest.json` 中列出的文件放在默认分支根目录；不要提交被 `.gitignore` 排除的 Edge profile。
3. 在 repository `Settings → Pages → Build and deployment` 选择 `Deploy from a branch`，默认分支和 `/(root)`，保存。
4. 等 Pages 构建后，用线上地址加载示例并下载两份 CSV；核对页面仍显示 PARTIAL 与 $101.26 / $57.34 / $43.92。
5. 验收后将发布状态改为 PUBLISHED。网站上线本身不计合格曝光；`tracking.csv` 仅在对应推广实际发生后记录结果与证据。

官方依据（2026-09-12 核验）：GitHub Free 对公开仓库提供 Pages；静态站可以从分支根目录发布，入口文件为 `index.html`；`.nojekyll` 可关闭默认 Jekyll 处理。参见 GitHub Docs：

- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
