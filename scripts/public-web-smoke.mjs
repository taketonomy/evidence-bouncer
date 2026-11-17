import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.argv[2];
if (!origin?.startsWith('https://')) throw new Error('Provide the deployed HTTPS URL.');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  const response = await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 60000 });
  assert.equal(response.status(), 200);
  await page.waitForFunction(() => document.getElementById('run-kind')?.textContent.includes('RECORDED RUN'), null, { timeout: 60000 });
  assert.ok(await page.locator('.claim').count());
  await page.getByRole('button', { name: 'Check the evidence' }).click();
  await page.waitForFunction(() => !document.getElementById('run').disabled, null, { timeout: 240000 });
  if (await page.locator('#error').isVisible()) throw new Error(await page.locator('#error').textContent());
  const trace = JSON.parse(await page.locator('#trace').textContent());
  assert.equal(trace.execution_status, 'completed');
  assert.equal(trace.approval_status, 'pending');
  assert.ok(trace.trace.some(event => event.tool === 'check_claims'));
  assert.equal(errors.length, 0, errors.join('\n'));
  await mkdir('results/public-web', { recursive: true });
  await page.screenshot({ path: 'results/public-web/live.png', fullPage: true });
  await page.reload();
  await page.waitForFunction(() => document.getElementById('run-kind')?.textContent === 'SAVED BROWSER RUN', null, { timeout: 60000 });
  const saved = JSON.parse(await page.evaluate(() => sessionStorage.getItem('evidence-bouncer-run')));
  assert.equal(saved.id, trace.id);
  await writeFile('results/public-web/run.json', JSON.stringify(saved, null, 2));
  const report = { verified_at: new Date().toISOString(), url: origin, anonymous_access: true, browser_errors: errors, execution_status: trace.execution_status, approval_status: trace.approval_status, run_id: trace.id, supported: await page.locator('#count-supported').textContent(), bounced: await page.locator('#count-bounced').textContent(), unknown: await page.locator('#count-unknown').textContent(), session_restore: true };
  await writeFile('results/public-web/verification.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
