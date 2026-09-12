(function (root, factory) {
  const audit = typeof module === 'object' && module.exports ? require('./app.js') : root.SalesAudit;
  const api = factory(audit);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SalesIntake = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (audit) {
  'use strict';
  const fields = [
    ['line', '行唯一编号（不是多行共用的订单号）', ['line_id', 'row_id', '行号']],
    ['day', '销售日期（YYYY-MM-DD）', ['sale_date', 'date', '日期']],
    ['item', '商品编号 / SKU', ['sku', '商品编号']],
    ['currency', '币种（当前只接受 USD）', ['币种']],
    ['units', '数量（正整数）', ['quantity', 'qty', '数量']],
    ['unit_sale', '单件售价（不是订单总额）', ['unit_price', '单价']],
    ['unit_cost', '单件成本（不是总成本）', ['单位成本']],
    ['source', '来源（可不选）', ['来源']],
  ];
  const key = value => value.toLowerCase().replace(/[\s_-]/g, '');
  function inspect(text) {
    const table = audit.readTable(text);
    const suggested = Object.fromEntries(fields.map(([field,,aliases]) => {
      if (table.header.includes(field)) return [field, field];
      const names = new Set([field, ...aliases].map(key));
      const candidates = table.header.filter(name => names.has(key(name)));
      return [field, candidates.length === 1 ? candidates[0] : ''];
    }));
    return { columns: table.header, rows: table.data.length, suggested };
  }
  const quote = value => `"${String(value).replace(/"/g, '""')}"`;
  function mappedCsv(text, mapping) {
    const table = audit.readTable(text);
    const selected = [], used = new Set();
    for (const [field] of fields) {
      const source = mapping[field];
      if (!source && field === 'source') continue;
      if (!source) throw new Error(`MAPPING_REQUIRED:${field}`);
      if (!table.header.includes(source)) throw new Error(`MAPPING_UNKNOWN_COLUMN:${field}`);
      if (used.has(source)) throw new Error(`MAPPING_DUPLICATE_COLUMN:${field}`);
      used.add(source); selected.push([field, table.header.indexOf(source)]);
    }
    return [selected.map(([field]) => field), ...table.data.map(row => selected.map(([,index]) => row[index]))]
      .map(row => row.map(quote).join(',')).join('\r\n') + '\r\n';
  }
  const options = {
    need: ['每天重复整理报表', '检查一份 CSV', '比较两份报表的差异'],
    frequency: ['每天', '每周', '每月', '偶尔'],
    discovery: ['未选择', 'GitHub', 'X', '搜索', '朋友推荐', '其他'],
    format: ['待确认', 'CSV 销售导出', 'Excel / XLSX', 'PDF / 邮件', '系统实时接入'],
    effort: ['待确认', '少于 15 分钟', '15–30 分钟', '30–60 分钟', '超过 60 分钟'],
    sample: ['待确认', '可以准备合成样例', '需要先确认字段', '暂时无法提供样例'],
  };
  function pick(selection) {
    return Object.fromEntries(Object.entries(options).map(([key, values]) => [key, values.includes(selection[key]) ? selection[key] : values[0]]));
  }
  function nextStep(selection = {}) {
    const picked = pick(selection);
    if (picked.need === '比较两份报表的差异' || !['待确认', 'CSV 销售导出'].includes(picked.format)) {
      return '先评估范围：这个需求超出当前单份 CSV 工具。先说明来源、期望输出和业务口径，再判断是否适合另做试点。';
    }
    if (picked.format === '待确认' || picked.sample !== '可以准备合成样例') {
      return '先确认输入：准备一份表头、3–10 行合成数据和一个期望结果；不确定字段时，可以先用输入模板讨论。';
    }
    return '下一步核对样例：用模板说明一个正确结果和一个异常结果，再确认试点范围、价格与交期。当前演示不代表已接受交付。';
  }
  function brief(selection = {}) {
    const picked = pick(selection);
    return '# 销售数据自动化试点需求草稿\n\n' +
      '这是一份待补充的需求，不代表报价、已提交或已承诺交付。\n\n' +
      `- 希望解决：${picked.need}\n- 发生频率：${picked.frequency}\n- 从哪里发现工具：${picked.discovery}\n` +
      `- 数据格式：${picked.format}\n- 当前每次人工耗时：${picked.effort}\n- 样例准备情况：${picked.sample}\n` +
      '- 一个代表性来源：[例如某系统的销售导出]\n' +
      '- 希望输出：[日报 / 异常清单 / 差异解释]\n- 一个失败例子：[仅使用合成数据描述]\n' +
      '- 验收标准：[输入、预期金额口径、异常应如何处理]\n- 如涉及跨报表比较：[唯一键、同一日期范围、各自代表的业务口径]\n\n' +
      `建议下一步：${nextStep(picked)}\n\n` +
      '试点交付：约定范围的结果文件、异常清单、重复执行说明和验收记录。\n' +
      '验收由双方先约定样例与预期结果；不确定的数据进入复核，不静默计入汇总。\n' +
      '免费工具可直接使用；试点、扩展实施和持续维护分别确认范围及报价。\n' +
      '当前免费工具只做 USD 销售 CSV 预审；退款、费用、库存、实时接入和跨表对账需另行评估。\n\n' +
      '本草稿不包含上传文件的文件名、表头、明细、金额或统计结果。\n' +
      '可自行保存或交给已有联系人。GitHub 入口需要账号且内容公开，只提交合成描述。\n' +
      'https://github.com/bird89757bird-a11y/sales-csv-audit/issues/new?template=pilot.yml\n';
  }
  return { fields, inspect, mappedCsv, options, nextStep, brief };
});
