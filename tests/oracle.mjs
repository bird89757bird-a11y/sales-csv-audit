import assert from 'node:assert/strict';

export function assertKnownSample(result) {
  assert.equal(result.status, 'PARTIAL', 'fixture with issues must remain PARTIAL');
  assert.deepEqual([result.input_rows, result.accepted, result.duplicates, result.rejected], [9, 5, 2, 2]);
  assert.deepEqual(result.totals, { quantity: 11, sales: 10126, cost: 5734, profit: 4392 });
  assert.equal(result.daily.length, 3);
  assert.deepEqual(result.daily.map(day => [day.sale_date, day.record_count, day.quantity, day.sales, day.cost, day.profit]), [
    ['2026-09-01', 1, 3, 5997, 2475, 3522],
    ['2026-09-02', 1, 2, 2000, 2400, -400],
    ['2026-09-03', 3, 6, 2129, 859, 1270],
  ]);
  assert.deepEqual(result.issues.map(issue => issue.code),
    ['MISSING_FIELDS:currency', 'DUPLICATE_LINE', 'DUPLICATE_LINE', 'MISSING_FIELDS:unit_cost']);
}
