const reply = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
const parseJSON = content => JSON.parse(content.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, ''));
const limits = new Map();

async function modelCall(env, input, trace, phase) {
  const response = await fetch('https://api.aiand.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.AIAND_API_KEY}` },
    body: JSON.stringify({ model: PACK.model, temperature: 0, max_tokens: 4000, ...input }), signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`AIAND request failed (HTTP ${response.status}). Try again later.`);
  const result = await response.json();
  if (!result.choices?.[0]) throw new Error('Model returned no choices.');
  trace.push({ phase, response_id: result.id, finish_reason: result.choices[0].finish_reason });
  return result;
}

async function jsonModel(env, prompt, input, trace, phase) {
  const response = await modelCall(env, { messages: [{ role: 'system', content: prompt }, { role: 'user', content: JSON.stringify(input) }], response_format: { type: 'json_object' } }, trace, phase);
  if (response.choices[0].finish_reason !== 'stop') throw new Error(`Incomplete model response during ${phase}.`);
  return parseJSON(response.choices[0].message.content);
}

async function checkDraft(env, draft) {
  const run = { id: `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID().slice(0, 8)}`, created_at: new Date().toISOString(), pack_id: PACK.id, model: PACK.model, original_draft: draft, evidence: PACK.sources, prompts: PACK.prompts, execution_status: 'running', approval_status: 'pending', claims: [], verdicts: [], references: [], trace: [], configuration: { max_tool_iterations: 3, temperature: 0, storage: 'visitor browser session and JSON download' } };
  try {
    run.claims = validateClaims(await jsonModel(env, PACK.prompts.generator, { draft }, run.trace, 'generator'), draft);
    const messages = [{ role: 'system', content: PACK.prompts.loop }, { role: 'user', content: JSON.stringify({ draft, claims: run.claims }) }];
    const tool = { type: 'function', function: { name: 'check_claims', description: 'Check draft claims against the selected evidence pack and save verdicts to run memory.', parameters: { type: 'object', properties: { claim_ids: { type: 'array', items: { type: 'string' } } }, required: ['claim_ids'], additionalProperties: false } } };
    for (let iteration = 1; iteration <= 3 && run.verdicts.length < run.claims.length; iteration++) {
      const response = await modelCall(env, { messages, tools: [tool], tool_choice: { type: 'function', function: { name: 'check_claims' } }, max_tokens: 1000 }, run.trace, 'tool-selection');
      const message = response.choices[0].message;
      if (response.choices[0].finish_reason !== 'tool_calls' || !message.tool_calls?.length) throw new Error('Model did not complete the required checker tool call.');
      messages.push(message);
      for (const call of message.tool_calls) {
        if (call.function.name !== 'check_claims') throw new Error('Unknown tool requested.');
        const args = parseJSON(call.function.arguments);
        if (!Array.isArray(args.claim_ids) || !args.claim_ids.length || new Set(args.claim_ids).size !== args.claim_ids.length || args.claim_ids.some(id => !run.claims.some(c => c.id === id))) throw new Error('Invalid checker tool arguments.');
        const selected = run.claims.filter(c => args.claim_ids.includes(c.id) && !run.verdicts.some(v => v.claim_id === c.id));
        if (!selected.length) throw new Error('Checker tool made no progress.');
        const raw = await jsonModel(env, PACK.prompts.checker, { claims: selected, sources: PACK.sources }, run.trace, 'checker');
        const verdicts = validateVerdicts(raw, selected, PACK.sources);
        run.verdicts.push(...verdicts);
        run.trace.push({ iteration, tool: 'check_claims', arguments: args, raw_checker_verdicts: raw.verdicts, verdicts });
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ verdicts, remaining_claim_ids: run.claims.filter(c => !run.verdicts.some(v => v.claim_id === c.id)).map(c => c.id) }) });
      }
    }
    if (run.verdicts.length !== run.claims.length) throw new Error('Iteration limit reached before all claims were checked.');
    run.selected_claim_ids = [];
    run.rewrite = '';
    if (run.verdicts.some(v => v.status === 'supported')) {
      messages.push({ role: 'user', content: PACK.prompts.rewrite });
      const response = await modelCall(env, { messages, response_format: { type: 'json_object' }, max_tokens: 1500 }, run.trace, 'rewrite');
      if (response.choices[0].finish_reason !== 'stop') throw new Error('Rewrite response incomplete.');
      run.selected_claim_ids = parseJSON(response.choices[0].message.content).selected_claim_ids;
      run.rewrite = groundedRewrite(run.selected_claim_ids, run.claims, run.verdicts);
    }
    run.execution_status = 'completed';
  } catch (error) {
    run.execution_status = 'failed';
    run.error = String(error.message || 'The check failed.').split(env.AIAND_API_KEY).join('[REDACTED]');
  }
  run.finished_at = new Date().toISOString();
  run.references = run.verdicts.flatMap(v => v.references.map(ref => ({ claim_id: v.claim_id, ...ref })));
  run.scoreboard_markdown = scoreboard(run);
  return run;
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const assetName = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      if (request.method === 'GET' && Object.hasOwn(ASSETS, assetName)) return new Response(ASSETS[assetName], { headers: { 'Content-Type': assetName.endsWith('.html') ? 'text/html; charset=utf-8' : assetName.endsWith('.css') ? 'text/css' : 'text/javascript', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'" } });
      if (request.method === 'GET' && url.pathname === '/api/pack') return reply({ id: PACK.id, model: PACK.model, draft: PACK.draft, sources: PACK.sources });
      if (request.method === 'GET' && url.pathname === '/api/latest') return reply({ run: RECORDED_RUN });
      if (request.method === 'POST' && url.pathname === '/api/check') {
        if (request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) return reply({ error: 'Cross-origin request denied.' }, 403);
        if (request.headers.get('X-Bouncer-Local') !== '1' || !request.headers.get('Content-Type')?.startsWith('application/json')) return reply({ error: 'Use the demo app to start a check.' }, 403);
        if (!env.AIAND_API_KEY) return reply({ error: 'Live checker is not configured. The recorded demo remains available.' }, 503);
        const ip = request.headers.get('CF-Connecting-IP') || 'shared-demo';
        const previous = limits.get(ip) || 0;
        if (Date.now() - previous < 20000) return reply({ error: 'Please wait 20 seconds between checks.' }, 429);
        const raw = await request.text();
        if (raw.length > 25000) return reply({ error: 'Draft is too large.' }, 413);
        let input; try { input = JSON.parse(raw); } catch { return reply({ error: 'Invalid JSON.' }, 400); }
        if (typeof input.draft !== 'string' || !input.draft.trim() || input.draft.length > 6000) return reply({ error: 'Enter a draft between 1 and 6,000 characters for this public demo.' }, 400);
        if (limits.size > 10000) limits.clear();
        limits.set(ip, Date.now());
        return reply({ run: await checkDraft(env, input.draft) });
      }
      return reply({ error: 'Not found.' }, 404);
    } catch { return reply({ error: 'The hosted checker could not complete this request. Try again.' }, 500); }
  },
};
