import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { assertKnownSample } from './oracle.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const audit = require(path.join(root, 'app.js'));
const sample = fs.readFileSync(path.join(root, 'sample.csv'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const result = audit.analyzeCsv(sample);
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }

test('known synthetic sample independently frozen in the acceptance oracle', () => assertKnownSample(result));
test('generated daily and issue downloads preserve reviewable values', () => {
  const daily = audit.dailyCsv(result), issues = audit.issuesCsv(result);
  assert.match(daily, /"2026-09-02","USD","1","2","20\.00","24\.00","-4\.00"/);
  assert.equal(daily.trim().split(/\r?\n/).length, 4);
  assert.equal(issues.trim().split(/\r?\n/).length, 5);
  assert.match(issues, /DUPLICATE_LINE/); assert.match(issues, /MISSING_FIELDS:unit_cost/);
});
test('page is local-only and exposes required user actions', () => {
  assert.doesNotMatch(html, /<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i);
  for (const id of ['csvFile', 'sampleButton', 'auditButton', 'downloadDaily', 'downloadIssues']) assert.match(html, new RegExp(`id="${id}"`));
  for (const phrase of ['数据不上传', 'PARTIAL', 'Simplified profit', '不是会计结论', '不生成 XLSX']) assert.ok(html.includes(phrase), phrase);
});
test('structural and amount failures do not contaminate totals', () => {
  const failed = audit.analyzeCsv('line,day\nA,2026-09-01\n');
  assert.equal(failed.status, 'FAILED'); assert.equal(failed.totals, null);
  const bad = audit.analyzeCsv(sample.replace('19.99', '19.999'));
  assert.equal(bad.rejected, 3); assert.equal(bad.totals.sales, 4129);
});
test('identical valid-only rows produce PASS and duplicate conflicts remain reviewable', () => {
  const header = sample.split(/\r?\n/)[0];
  const one = sample.split(/\r?\n/)[1];
  const pass = audit.analyzeCsv(`${header}\n${one}\n`);
  assert.equal(pass.status, 'PASS');
  const conflict = audit.analyzeCsv(`${header}\n${one}\n${one.replace('19.99','20.00')}\n`);
  assert.equal(conflict.status, 'PARTIAL'); assert.equal(conflict.issues[0].code, 'DUPLICATE_CONFLICT');
});
console.log(`${passed} acceptance tests passed`);
