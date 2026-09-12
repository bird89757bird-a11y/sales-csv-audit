import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { assertKnownSample } from './oracle.mjs';
const require = createRequire(import.meta.url);
const intake = require('../intake.js'), audit = require('../app.js');
const sample = fs.readFileSync(new URL('../sample.csv', import.meta.url), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }

test('renamed and reordered columns preserve the independently frozen business result', () => {
  const table = audit.readTable(sample);
  const order = [4, 6, 2, 7, 5, 3, 1, 0];
  const names = ['币种', '单价', '日期', '单位成本', 'Qty', 'SKU', 'Row ID', '来源'];
  const quote = v => `"${v.replace(/"/g, '""')}"`;
  const renamed = [names, ...table.data.map(row => order.map(i => row[i]))].map(row => row.map(quote).join(',')).join('\n');
  const inspected = intake.inspect(renamed);
  assert.equal(inspected.rows, 9);
  assertKnownSample(audit.analyzeCsv(intake.mappedCsv(renamed, inspected.suggested)));
});

test('ambiguous quantity and order totals never receive speculative mappings', () => {
  const inspected = intake.inspect('Order ID,date,SKU,currency,Qty,Quantity,Total,Cost\nA,2026-09-01,B,USD,2,2,30.00,10.00\n');
  for (const field of ['line', 'units', 'unit_sale', 'unit_cost']) assert.equal(inspected.suggested[field], '');
});

test('missing, duplicate, unknown and duplicate-header mappings fail visibly', () => {
  const valid = intake.inspect(sample).suggested;
  assert.throws(() => intake.mappedCsv(sample, {...valid, units:''}), /MAPPING_REQUIRED:units/);
  assert.throws(() => intake.mappedCsv(sample, {...valid, item:'line'}), /MAPPING_DUPLICATE_COLUMN:item/);
  assert.throws(() => intake.mappedCsv(sample, {...valid, item:'absent'}), /MAPPING_UNKNOWN_COLUMN:item/);
  assert.throws(() => intake.inspect('a,a\n1,2\n'), /DUPLICATE_COLUMNS/);
  assert.throws(() => intake.inspect('a,b\n1\n'), /COLUMN_COUNT_MISMATCH/);
});

test('mapping does not convert currency, dates, totals or invalid precision', () => {
  const bad = sample.replace('2026-09-01', '09/01/2026').replace('19.99', '19.999');
  const result = audit.analyzeCsv(intake.mappedCsv(bad, intake.inspect(bad).suggested));
  assert.equal(result.rejected, 3);
  assert.equal(result.totals.sales, 4129);
  const euro = sample.replace('ITEM-A,USD', 'ITEM-A,EUR');
  assert.equal(audit.analyzeCsv(intake.mappedCsv(euro, intake.inspect(euro).suggested)).rejected, 3);
});

test('quoted extra fields cannot leak into the normalized audit or public brief', () => {
  const text = 'line,day,item,currency,units,unit_sale,unit_cost,Private Note\nA,2026-09-01,B,USD,2,1.00,0.50,"PRIVATE-CANARY, secret\nsecond line"\n';
  const normalized = intake.mappedCsv(text, intake.inspect(text).suggested);
  assert.doesNotMatch(normalized, /PRIVATE-CANARY|Private Note|second line/);
  assert.equal(audit.analyzeCsv(normalized).totals.sales, 200);
  const brief = intake.brief({need:'PRIVATE-CANARY',discovery:text,frequency:'每周',data:text});
  assert.doesNotMatch(brief, /PRIVATE-CANARY|Private Note|0\.50/);
  assert.match(brief, /每周/);
  assert.match(brief, /不包含上传文件/);
});

test('downloadable input template is a valid synthetic CSV with fixed totals', () => {
  const result = audit.analyzeCsv(fs.readFileSync(new URL('../template.csv', import.meta.url), 'utf8'));
  assert.equal(result.status, 'PASS'); assert.equal(result.accepted, 1);
  assert.deepEqual(result.totals, {quantity:2,sales:200,cost:100,profit:100});
});
test('scope guidance does not turn unsupported formats or comparisons into accepted work', () => {
  const ready = {format:'CSV 销售导出',sample:'可以准备合成样例'};
  assert.match(intake.nextStep(), /先确认输入/);
  assert.match(intake.nextStep(ready), /不代表已接受交付/);
  for (const format of ['Excel / XLSX','PDF / 邮件','系统实时接入']) {
    assert.match(intake.nextStep({...ready,format}), /超出当前/);
  }
  assert.match(intake.nextStep({...ready,need:'比较两份报表的差异'}), /超出当前/);
  assert.match(intake.nextStep({...ready,sample:'暂时无法提供样例'}), /先确认输入/);
});
test('business choices survive in the brief while arbitrary values and CSV content stay out', () => {
  const brief = intake.brief({format:'CSV 销售导出',effort:'30–60 分钟',sample:'可以准备合成样例'});
  assert.match(brief, /当前每次人工耗时：30–60 分钟/);
  assert.match(brief, /样例准备情况：可以准备合成样例/);
  assert.match(brief, /异常清单、重复执行说明和验收记录/);
  const malicious = Object.fromEntries(Object.keys(intake.options).map(key=>[key,'PRIVATE-CANARY <script>alert(1)</script>']));
  assert.doesNotMatch(intake.brief({...malicious,data:sample}), /PRIVATE-CANARY|<script>|DEMO-1/);
  assert.match(intake.brief(malicious), /数据格式：待确认/);
});
console.log(`${passed} intake tests passed`);
