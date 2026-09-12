import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { assertKnownSample } from './oracle.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const audit = require(path.join(root, 'app.js'));
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const manifest = JSON.parse(read('release-manifest.json'));
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }

test('release manifest paths exist, hashes match and temporary profiles are excluded', () => {
  assert.ok(manifest.files.length >= 13);
  for (const entry of manifest.files) {
    assert.doesNotMatch(entry.path, /edge-(?:profile|headless)/i);
    const content = fs.readFileSync(path.join(root, entry.path));
    assert.equal(crypto.createHash('sha256').update(content).digest('hex'), entry.sha256, entry.path);
  }
});

test('frozen sample and calculations remain unchanged', () => {
  assertKnownSample(audit.analyzeCsv(read('sample.csv')));
});

test('published runtime remains local-only and contains no obvious secret', () => {
  const html = read('index.html'), js = read('app.js');
  assert.doesNotMatch(html, /<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i);
  const textFiles = manifest.files.filter(item => !item.binary).map(item => read(item.path)).join('\n');
  assert.doesNotMatch(textFiles, /C:\\Users\\|\/Users\//);
  assert.doesNotMatch(textFiles, /gh[pousr]_[A-Za-z0-9]{20,}|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|(?:api[_-]?key|secret|token)\s*[:=]\s*["'][^"']{8,}/i);
  assert.ok(js.includes('SalesAudit'));
});

test('README and launch kit keep evidence and commercial boundaries explicit', () => {
  assert.ok(['UNPUBLISHED', 'PUBLISHING', 'PUBLISHED'].includes(manifest.release_state));
  assert.match(read('LICENSE'), /^MIT License/);
  assert.ok(manifest.files.some(entry => entry.path === 'LICENSE'));
  for (const file of ['README.md', 'launch-kit.md']) {
    const text = read(file);
    assert.ok(text.includes(`发布状态：**${manifest.release_state}**`), `${file}: release state`);
    for (const marker of ['SYNTHETIC', 'PARTIAL', 'CSV ONLY']) assert.ok(text.includes(marker), `${file}: ${marker}`);
    assert.match(text, /没有真实客户/); assert.match(text, /收入证明/);
    if (manifest.release_state === 'PUBLISHED') {
      assert.equal(manifest.site_url, 'https://bird89757bird-a11y.github.io/sales-csv-audit/');
      assert.ok(text.includes(manifest.site_url));
      assert.ok(manifest.verified_at && !Number.isNaN(Date.parse(manifest.verified_at)));
    }
  }
});

test('three outbound copies avoid unsupported capability claims', () => {
  const text = read('launch-kit.md');
  const copies = [...text.matchAll(/<!-- COPY_START ([a-z]+) -->([\s\S]*?)<!-- COPY_END \1 -->/g)];
  assert.deepEqual(copies.map(match => match[1]), ['github', 'chinese', 'english']);
  const banned = /live connectors|XLSX delivery|11-source complete|customer case|production-ready|proven revenue/i;
  for (const copy of copies) assert.doesNotMatch(copy[2], banned, copy[1]);
});

test('tracking ledger starts with five honest zero-or-unknown result rows', () => {
  const lines = read('tracking.csv').trim().split(/\r?\n/).map(line => line.split(','));
  assert.deepEqual(lines[0], ['opportunity','date','channel','variant','view_or_reply','qualified','sample_received','paid_pilot','revenue','next_action','evidence']);
  assert.equal(lines.length, 6);
  for (const row of lines.slice(1)) {
    assert.equal(row.length, 11); assert.equal(row[1], 'UNKNOWN'); assert.equal(row[2], 'UNKNOWN');
    assert.equal(row[4], 'UNKNOWN'); assert.deepEqual(row.slice(5, 9), ['0','0','0','0']); assert.equal(row[10], 'UNKNOWN');
  }
});

console.log(`${passed} launch preflight tests passed`);
