import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const THRESHOLDS = {
  'backend-unit': { lines: 10, statements: 10, functions: 9, branches: 10 },
  'frontend-unit': { lines: 65, statements: 65, functions: 75, branches: 70 },
};

const root = resolve(process.cwd(), 'coverage');
let failed = false;

for (const [bucket, thresholds] of Object.entries(THRESHOLDS)) {
  const summaryPath = resolve(root, bucket, 'coverage-summary.json');
  if (!existsSync(summaryPath)) {
    console.warn(`[warn] ${bucket}: coverage-summary.json missing at ${summaryPath} — skipping`);
    continue;
  }
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
  const total = summary.total;
  if (!total) {
    console.error(`[fail] ${bucket}: malformed summary — no \"total\" key`);
    failed = true;
    continue;
  }
  for (const metric of Object.keys(thresholds)) {
    const actual = total[metric]?.pct ?? 0;
    const min = thresholds[metric];
    const ok = actual >= min;
    const badge = ok ? 'ok  ' : 'FAIL';
    console.log(`[${badge}] ${bucket} ${metric}: ${actual}% (min ${min}%)`);
    if (!ok) failed = true;
  }
}

if (failed) {
  console.error('\nCoverage gate failed.');
  process.exit(1);
}
console.log('\nCoverage gate passed.');
