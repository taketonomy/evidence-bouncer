import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from './dist/server/index.js';

const recorded = JSON.parse(await readFile('data/recorded-run.json', 'utf8'));
const originalFetch = globalThis.fetch;
const checker = recorded.trace.find(event => event.tool === 'check_claims');
const responses = [
  { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ claims: recorded.claims }) } }] },
  { choices: [{ finish_reason: 'tool_calls', message: { role: 'assistant', content: null, tool_calls: [{ id: 'test-tool', type: 'function', function: { name: 'check_claims', arguments: JSON.stringify({ claim_ids: recorded.claims.map(c => c.id) }) } }] } }] },
  { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ verdicts: checker.raw_checker_verdicts }) } }] },
  { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ selected_claim_ids: recorded.selected_claim_ids }) } }] },
];
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'https://api.aiand.com/v1/chat/completions');
  assert.equal(options.headers.Authorization, 'Bearer test-secret-not-real');
  const value = responses.shift();
  assert.ok(value, 'Unexpected extra model call');
  return Response.json({ id: 'test-response', ...value });
};
try {
  assert.equal((await worker.fetch(new Request('https://demo.test/'), {})).status, 200);
  const invalid = await worker.fetch(new Request('https://demo.test/api/check', { method: 'POST', headers: { Origin: 'https://wrong.test' } }), {});
  assert.equal(invalid.status, 403);
  const result = await worker.fetch(new Request('https://demo.test/api/check', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://demo.test', 'X-Bouncer-Local': '1' }, body: JSON.stringify({ draft: recorded.original_draft }) }), { AIAND_API_KEY: 'test-secret-not-real' });
  const body = await result.json();
  assert.equal(body.run.execution_status, 'completed', body.run.error);
  assert.equal(body.run.approval_status, 'pending');
  assert.equal(body.run.rewrite, recorded.rewrite);
  assert.equal(body.run.claims.length, body.run.verdicts.length);
  assert.ok(body.run.scoreboard_markdown.includes('Evidence Bouncer'));
  assert.equal(JSON.stringify(body).includes('test-secret-not-real'), false);
  assert.equal(responses.length, 0);
  console.log('Worker verification passed: static routes, origin protection, four-call checker loop, exact rewrite, pending approval, no credential leakage.');
} finally { globalThis.fetch = originalFetch; }
