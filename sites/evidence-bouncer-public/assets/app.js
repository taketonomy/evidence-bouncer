const $ = (id) => document.getElementById(id);
let pack, currentRun, filter = 'all', running = false, lastRunLabel = '';
const element = (tag, className, text) => { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; };
async function api(path, options) { const response = await fetch(path, options); const value = await response.json(); if (!response.ok) throw new Error(value.error || 'Request failed.'); return value; }
function error(message) { $('error').textContent = message; $('error').hidden = !message; }
function counts(run) { const vs = run?.verdicts || []; return { supported: vs.filter(v => v.status === 'supported').length, bounced: vs.filter(v => ['unsupported', 'contradicted'].includes(v.status)).length, unknown: vs.filter(v => v.status === 'unknown').length }; }
function showSources(sources) { $('sources').replaceChildren(); $('source-count').textContent = `${sources.length} SOURCES`; for (const source of sources) { const details = element('details', 'source'); details.append(element('summary', '', source.file), element('p', 'authority', source.authority), element('pre', '', source.content)); $('sources').append(details); } }
function renderClaims() {
  const verdicts = currentRun?.verdicts || [], claims = currentRun?.claims || [];
  $('claims').replaceChildren();
  const visible = claims.filter(c => { const status = verdicts.find(v => v.claim_id === c.id)?.status; return filter === 'all' || (filter === 'bounced' ? ['unsupported', 'contradicted'].includes(status) : filter === status); });
  $('claim-count').textContent = `${visible.length} / ${claims.length} claims`;
  if (!visible.length) { $('claims').append(element('div', 'empty', currentRun ? 'No claims in this category.' : 'Run a check to see your claim verdicts.')); return; }
  for (const claim of visible) {
    const verdict = verdicts.find(v => v.claim_id === claim.id), status = verdict?.status || 'unknown';
    const details = element('details', `claim ${status}-card`), summary = element('summary');
    summary.append(element('span', 'claim-icon', status === 'supported' ? '✓' : status === 'unknown' ? '?' : '×'), element('span', 'claim-title', claim.text), element('span', 'claim-status', verdict?.status || 'not checked'));
    const body = element('div', 'claim-body'); body.append(element('p', '', verdict?.rationale || 'No verdict returned. This run is incomplete.'));
    for (const ref of verdict?.references || []) { const source = currentRun.evidence.find(s => s.id === ref.source_id); const line = source ? source.content.slice(0, source.content.indexOf(ref.quote)).split('\n').length : '?'; const citation = element('div', 'citation'); citation.append(element('strong', '', `${ref.source_id} · ${source?.file || ''}:${line}`), element('blockquote', '', ref.quote)); body.append(citation); }
    if (!verdict?.references?.length) body.append(element('p', '', 'No validated source citation.'));
    body.append(element('p', '', `Original draft: ${claim.draft_quote}`)); details.append(summary, body); $('claims').append(details);
  }
}
function render(run, recorded = false) {
  currentRun = run;
  const totals = counts(run); for (const key of Object.keys(totals)) $(`count-${key}`).textContent = totals[key];
  lastRunLabel = `${recorded ? 'RECORDED' : 'LIVE'} RUN · ${new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  $('run-kind').textContent = lastRunLabel;
  $('rewrite').textContent = run.rewrite || 'No grounded rewrite produced. Review the unresolved claims above.';
  $('trace').textContent = JSON.stringify({ id: run.id, execution_status: run.execution_status, approval_status: run.approval_status, model: run.model, references: run.references, trace: run.trace }, null, 2);
  $('copy').disabled = !run.rewrite; $('download').disabled = false;
  showSources(run.evidence || pack.sources); renderClaims();
  if (run.execution_status !== 'completed') error(`This check is incomplete: ${run.error || 'model or tool failure'}`);
}
function updateDraft() { $('char-count').textContent = `${$('draft').value.length.toLocaleString()} characters`; $('run').disabled = running || !$('draft').value.trim(); if (!running && currentRun) $('run-kind').textContent = $('draft').value === currentRun.original_draft ? lastRunLabel : 'DRAFT CHANGED · LAST RUN SHOWN'; }
$('draft').addEventListener('input', updateDraft);
$('reset').addEventListener('click', () => { $('draft').value = pack.draft; updateDraft(); });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); renderClaims(); }));
$('run').addEventListener('click', async () => {
  running = true; error(''); updateDraft(); $('draft').disabled = true; $('reset').disabled = true;
  $('run').textContent = 'Checking the evidence…'; $('progress').hidden = false; $('progress').classList.add('active'); $('progress').textContent = 'Starting a real AIAND run…';
  $('run-kind').textContent = 'LIVE CHECK RUNNING';
  currentRun = null; renderClaims();
  for (const key of ['supported', 'bounced', 'unknown']) $(`count-${key}`).textContent = '…';
  $('rewrite').textContent = 'Checking claims against the evidence pack…'; $('trace').textContent = 'Live run in progress.';
  $('copy').disabled = true; $('download').disabled = true;
  try {
    const draft = $('draft').value;
    $('progress').textContent = 'Extracting claims → checking evidence → selecting grounded rewrite…';
    const { run } = await api('/api/check', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Bouncer-Local': '1' }, body: JSON.stringify({ draft }) });
    sessionStorage.setItem('evidence-bouncer-run', JSON.stringify(run));
    $('progress').textContent = 'Complete · result saved in this browser session. Download JSON to keep it.';
    render(run);
  } catch (err) { error(err.message); $('run-kind').textContent = 'CHECK FAILED'; }
  finally { running = false; $('progress').classList.remove('active'); $('draft').disabled = false; $('reset').disabled = false; $('run').textContent = 'Check the evidence ↗'; updateDraft(); }
});
$('copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(currentRun.rewrite); $('copy').textContent = 'Copied ✓'; setTimeout(() => $('copy').textContent = 'Copy text ↗', 1800); } catch { error('Could not copy automatically. Select and copy the rewrite text.'); } });
$('download').addEventListener('click', () => { const url = URL.createObjectURL(new Blob([JSON.stringify(currentRun, null, 2)], { type: 'application/json' })); const anchor = element('a'); anchor.href = url; anchor.download = `evidence-bouncer-${currentRun.id}.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
try { pack = await api('/api/pack'); $('pack-label').textContent = pack.id; $('model-label').textContent = pack.model; $('draft').value = pack.draft; showSources(pack.sources); updateDraft(); const { run } = await api('/api/latest'); const saved = sessionStorage.getItem('evidence-bouncer-run'); const selected = saved ? JSON.parse(saved) : run; if (selected) { $('draft').value = selected.original_draft; updateDraft(); render(selected, true); if (saved) { lastRunLabel = 'SAVED BROWSER RUN'; $('run-kind').textContent = lastRunLabel; } } } catch (err) { error(err.message); }
