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
console.log(`${passed} intake tests passed`);
