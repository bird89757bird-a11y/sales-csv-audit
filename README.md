# Sales CSV Audit｜免费销售数据审计

发布状态：**PUBLISHED**。许可证：[MIT](LICENSE)。证据是 **SYNTHETIC / PARTIAL / CSV ONLY**；没有真实客户、客户案例、付款或收入证明。

网站：[打开工具](https://bird89757bird-a11y.github.io/sales-csv-audit/) · [自动加载合成演示](https://bird89757bird-a11y.github.io/sales-csv-audit/?demo=1)。2026-09-12 已完成线上验收：HTTP 200、固定样例、文件选择、两份 CSV 实际下载及手机布局通过，浏览器无脚本异常，未观察到文件上传请求。详见 [验收记录](verification/live.json)。

一个无需账号、API 或云服务的浏览器工具。它在本地检查销售 CSV，展示接受行、重复行、拒绝行、销售额、成本、简化毛利和每日汇总，并下载 `daily.csv` 与 `issues.csv`。

直接双击 `index.html`，点击“加载合成示例”后“开始审计”。本地演示链接也可在文件名后加 `?demo=1` 自动展示结果。可以选择或粘贴自己的 CSV；数据不会由工具上传。必填列：`line, day, item, currency, units, unit_sale, unit_cost`，`source` 可选。当前只接受 USD、正整数数量和两位小数的非负单价/成本。

合成样例预期为 `PARTIAL`：9 行输入，5 接受、2 重复、2 缺字段拒绝；quantity 11，sales $101.26，cost $57.34，simplified profit $43.92。程序能运行不代表数据完整。

验证：

```powershell
node tests/acceptance.mjs
node tests/adversarial.mjs
```

工具适合公开展示数据核对方法，并邀请潜在客户提供一份不含隐私的字段样例，定义一个代表性付费试点。当前工具没有实时网页/邮箱连接器、11 来源覆盖、云调度、通知或 XLSX；简化毛利也不是完整会计利润。

本项目通过公开 GitHub 仓库和 GitHub Pages 提供静态工具；发布不代表已获得合格曝光、客户样例或付款。工具不收集邮箱，推广实验尚未开始。

发布前请先读 `launch-kit.md` 和 `release-manifest.json`，再运行：

```powershell
node tests/launch-preflight.mjs
```
