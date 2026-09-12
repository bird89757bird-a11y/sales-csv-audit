(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SalesAudit = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const REQUIRED = ['line', 'day', 'item', 'currency', 'units', 'unit_sale', 'unit_cost'];
  const SUM_FIELDS = ['quantity', 'sales', 'cost', 'profit'];

  function readTable(text) {
    text = String(text || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const matrix = [];
    let row = [], cell = '', quoted = false, closed = false;
    const push = () => { row.push(cell); cell = ''; closed = false; };
    for (let index = 0; index < text.length; index++) {
      const char = text[index];
      if (quoted) {
        if (char === '"' && text[index + 1] === '"') { cell += '"'; index++; }
        else if (char === '"') { quoted = false; closed = true; }
        else cell += char;
      } else if (char === ',') push();
      else if (char === '\n') { push(); matrix.push(row); row = []; }
      else if (char === '"' && cell === '' && !closed) quoted = true;
      else {
        if (closed || char === '"') throw new Error('CSV_PARSE_FAILED');
        cell += char;
      }
    }
    if (quoted) throw new Error('CSV_PARSE_FAILED');
    if (cell !== '' || row.length || closed) { push(); matrix.push(row); }
    while (matrix.length && matrix.at(-1).every(value => value === '')) matrix.pop();
    if (matrix.length < 2) throw new Error('EMPTY_SOURCE');
    const header = matrix[0].map(value => value.trim());
    if (header.some(field => !field)) throw new Error('EMPTY_COLUMN_NAME');
    if (new Set(header).size !== header.length) throw new Error('DUPLICATE_COLUMNS');
    const data = matrix.slice(1).map((values, index) => {
      if (values.length !== header.length) throw new Error(`COLUMN_COUNT_MISMATCH:${index + 1}`);
      return values.map(value => value.trim());
    });
    return { header, data };
  }

  function parseCsv(text) {
    const { header, data } = readTable(text);
    const missing = REQUIRED.filter(field => !header.includes(field));
    if (missing.length) throw new Error(`MISSING_COLUMNS:${missing.join('|')}`);
    return data.map(values => Object.fromEntries(header.map((field, offset) => [field, values[offset]])));
  }

  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  function cents(value) {
    if (!/^(?:0|[1-9]\d*)\.\d{2}$/.test(value)) throw new Error('INVALID_AMOUNT');
    const [whole, fraction] = value.split('.').map(Number);
    const amount = whole * 100 + fraction;
    if (!Number.isSafeInteger(amount)) throw new Error('AMOUNT_OVERFLOW');
    return amount;
  }

  function normalize(raw) {
    const missing = REQUIRED.filter(field => raw[field] == null || String(raw[field]).trim() === '');
    if (missing.length) throw new Error(`MISSING_FIELDS:${missing.join('|')}`);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(raw.line) || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(raw.item)) {
      throw new Error('INVALID_IDENTIFIER');
    }
    if (!validDate(raw.day)) throw new Error('INVALID_DATE');
    if (raw.currency !== 'USD') throw new Error('UNSUPPORTED_CURRENCY');
    if (!/^[1-9]\d*$/.test(raw.units)) throw new Error('INVALID_QUANTITY');
    const quantity = Number(raw.units);
    const unitSale = cents(raw.unit_sale), unitCost = cents(raw.unit_cost);
    const sales = quantity * unitSale, cost = quantity * unitCost;
    if (![quantity, sales, cost].every(Number.isSafeInteger)) throw new Error('ROW_OVERFLOW');
    return { source: raw.source || 'uploaded_csv', line_id: raw.line, sale_date: raw.day,
      sku: raw.item, currency: raw.currency, quantity, sales, cost, profit: sales - cost };
  }

  function analyzeCsv(text) {
    let input;
    try { input = parseCsv(text); }
    catch (error) {
      return { status: 'FAILED', input_rows: 0, accepted: 0, duplicates: 0, rejected: 0,
        rows: [], daily: [], totals: null, issues: [{ row: 0, code: error.message }] };
    }
    const rows = [], issues = [], seen = new Map();
    const totals = { quantity: 0, sales: 0, cost: 0, profit: 0 };
    let duplicates = 0, rejected = 0;
    input.forEach((raw, offset) => {
      try {
        const row = normalize(raw);
        if (seen.has(row.line_id)) {
          const prior = seen.get(row.line_id);
          const identical = Object.keys(row).filter(key => key !== 'source').every(key => row[key] === prior[key]);
          duplicates++;
          issues.push({ row: offset + 1, source: row.source, line: row.line_id,
            code: identical ? 'DUPLICATE_LINE' : 'DUPLICATE_CONFLICT' });
          return;
        }
        if (SUM_FIELDS.some(field => !Number.isSafeInteger(totals[field] + row[field]))) throw new Error('TOTAL_OVERFLOW');
        seen.set(row.line_id, row); rows.push(row);
        SUM_FIELDS.forEach(field => { totals[field] += row[field]; });
      } catch (error) {
        rejected++;
        issues.push({ row: offset + 1, source: raw.source || 'uploaded_csv', line: raw.line || '', code: error.message });
      }
    });
    rows.sort((a, b) => a.sale_date.localeCompare(b.sale_date) || a.line_id.localeCompare(b.line_id));
    const dailyMap = new Map();
    rows.forEach(row => {
      if (!dailyMap.has(row.sale_date)) dailyMap.set(row.sale_date,
        { sale_date: row.sale_date, currency: 'USD', record_count: 0, quantity: 0, sales: 0, cost: 0, profit: 0 });
      const day = dailyMap.get(row.sale_date); day.record_count++;
      SUM_FIELDS.forEach(field => { day[field] += row[field]; });
    });
    const issueCount = duplicates + rejected;
    return { status: rows.length ? (issueCount ? 'PARTIAL' : 'PASS') : 'FAILED', input_rows: input.length,
      accepted: rows.length, duplicates, rejected, rows, daily: [...dailyMap.values()], totals: rows.length ? totals : null, issues };
  }

  function quote(value) { return `"${String(value == null ? '' : value).replace(/"/g, '""')}"`; }
  function money(value) { return (value / 100).toFixed(2); }
  function dailyCsv(result) {
    const columns = ['sale_date', 'currency', 'record_count', 'quantity', 'sales', 'cost', 'simplified_profit'];
    const rows = result.daily.map(day => [day.sale_date, day.currency, day.record_count, day.quantity,
      money(day.sales), money(day.cost), money(day.profit)]);
    return [columns, ...rows].map(row => row.map(quote).join(',')).join('\r\n') + '\r\n';
  }
  function issuesCsv(result) {
    const columns = ['row', 'source', 'line', 'code'];
    return [columns, ...result.issues.map(item => columns.map(key => item[key] || ''))]
      .map(row => row.map(quote).join(',')).join('\r\n') + '\r\n';
  }
  return { readTable, parseCsv, analyzeCsv, dailyCsv, issuesCsv, money };
});
