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
const tampered = sample.replace('19.99', '20.00');
let red;
try { assertKnownSample(audit.analyzeCsv(tampered)); }
catch (error) { red = error.message; console.log(`EXPECTED_RED ${red}`); }
assert.ok(red, 'tampered fixture must fail the frozen oracle');
assertKnownSample(audit.analyzeCsv(sample));
console.log('RESTORED_GREEN known sample matches frozen oracle');
const evidence = { status: 'PASS', negative_case: 'DEMO-1 unit_sale changed from 19.99 to 20.00',
  red_detected: red, restored_green: true };
fs.mkdirSync(path.join(root, 'verification'), { recursive: true });
fs.writeFileSync(path.join(root, 'verification', 'adversarial.json'), JSON.stringify(evidence, null, 2) + '\n');
