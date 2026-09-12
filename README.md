# Sales CSV Audit｜免费销售数据审计

发布状态：**PUBLISHED**。版本：0.3.0。许可证：[MIT](LICENSE)。证据是 **SYNTHETIC / PARTIAL / CSV ONLY**；没有真实客户、客户案例、付款或收入证明。

网站：[打开工具](https://bird89757bird-a11y.github.io/sales-csv-audit/) · [自动加载合成演示](https://bird89757bird-a11y.github.io/sales-csv-audit/?demo=1&v=0.3.0)。本轮通过 18 项线上浏览器检查，覆盖试点范围、需求分流、下载及手机布局，详见 [0.3.0 验收](verification/iteration-03.json)。金额核心保持不变；[0.2.0 验收](verification/iteration-02.json) 保留为历史记录。

本次更新：

- 先选数据格式、每次人工耗时及样例准备情况，查看下一步建议；未确认的字段默认保持待确认。
- Excel、PDF、实时接入与双表比较明确进入范围评估，不被误认为已支持的交付。
- 提供 [试点范围与验收模板](pilot-scope.md)，说明结果文件、异常清单、执行说明和验收记录；价格、交期与维护范围待双方确认。

此前能力继续可用：

- 使用 [输入模板](template.csv) 开始；全部为合成数据。
- 自己的列名不同时，点击“对应我的表头”，核对单件售价 / 单件成本等含义，再执行审计。仅转换列名和顺序，金额、日期、币种及行唯一性规则保持不变。
- 下载或复制需求草稿；草稿不包含 CSV 文件名、表头、明细、金额或统计结果。
- [通过 GitHub 提交需求](https://github.com/bird89757bird-a11y/sales-csv-audit/issues/new?template=pilot.yml)：需要 GitHub 账号且内容公开，请仅填写合成描述。工具不会自动提交，也不收集邮箱。

一个无需账号、API 或云服务的浏览器工具。它在本地检查销售 CSV，展示接受行、重复行、拒绝行、销售额、成本、简化毛利和每日汇总，并下载 `daily.csv` 与 `issues.csv`。

直接双击 `index.html`，点击“加载合成示例”后“开始审计”。本地演示链接也可在文件名后加 `?demo=1` 自动展示结果。可以选择或粘贴自己的 CSV；数据不会由工具上传。必填列：`line, day, item, currency, units, unit_sale, unit_cost`，`source` 可选。当前只接受 USD、正整数数量和两位小数的非负单价/成本。

合成样例预期为 `PARTIAL`：9 行输入，5 接受、2 重复、2 缺字段拒绝；quantity 11，sales $101.26，cost $57.34，simplified profit $43.92。程序能运行不代表数据完整。

验证：

```powershell
node tests/acceptance.mjs
node tests/adversarial.mjs
node tests/intake.mjs
```

工具适合公开展示数据核对方法，并邀请潜在客户提供一份不含隐私的字段样例，定义一个代表性付费试点。当前工具没有实时网页/邮箱连接器、11 来源覆盖、云调度、通知或 XLSX；简化毛利也不是完整会计利润。

本项目通过公开 GitHub 仓库和 GitHub Pages 提供静态工具；发布不代表已获得合格曝光、客户样例或付款。GitHub 需求入口用于主动提交；推广实验尚未开始。

发布前请先读 `launch-kit.md` 和 `release-manifest.json`，再运行：

```powershell
node tests/launch-preflight.mjs
```
