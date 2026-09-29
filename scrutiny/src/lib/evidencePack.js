// Evidence pack: one downloadable, tamper-evident file per rule finding. The record is embedded as JSON and
// fingerprinted with SHA-256; the file's Verify button recomputes the hash so any edit shows up as a mismatch.
import { sha256Hex } from './sha256.js';
import { PRELIMINARY, verifyStep, routeIfConfirmed, DISPOSITION_LABEL } from '../engine/verify.js';

export const PACK_VERSION = 'evidence-pack/1';
export const ENGINE_VERSION = 'gst-intelligence-engine/2026.09-p2';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function buildEvidencePack({ a, rule, result, caseInfo, user, generatedAt, dataGeneratedAt }) {
  const disp = caseInfo.dispositions?.[result.id] || null;
  const record = {
    pack: PACK_VERSION,
    engine: ENGINE_VERSION,
    rule_definition_sha256: await sha256Hex(JSON.stringify(rule || {})),
    generated_at: generatedAt,
    generated_by: { name: user.name, role: user.role, workspace: user.workspace },
    taxpayer: { name: a.name, gstin: a.gstin, state: a.state, fy: a.fy, filing: a.filing },
    source: { file: a.fileName, extract_date: a.asOf, extract_date_source: a.asOfSource, data_refreshed_at: dataGeneratedAt },
    rule: { id: result.id, check: rule?.check, module: rule?.module, legal_provision: rule?.legal, severity: rule?.severity, test: rule?.logic, threshold: rule?.threshold, exposure_basis: rule?.basis, route_if_confirmed: routeIfConfirmed(result, rule?.action) },
    result: { status: result.status, finding: result.finding, metric: result.metric, computed_amount: result.exposure, rag: result.rag || null, deadlines: result.deadlines || null, summary: result.summary || null },
    verification: { step: verifyStep(result.id)[0], evidence_required: verifyStep(result.id)[1] },
    exception_rows: result.evidence ? { columns: result.evidence.columns, rows: result.evidence.rows, total: result.evidence.total, included: result.evidence.rows.length } : null,
    officer: {
      outcome: disp ? { ...disp, label: DISPOSITION_LABEL[disp.code] } : null,
      notes: caseInfo.notes || [],
      taxpayer_responses: caseInfo.responses || [],
      readiness_checklist: caseInfo.readiness || {},
      closure: caseInfo.closure || null,
      history: caseInfo.history || [],
    },
    disclaimer: PRELIMINARY,
  };
  // Hash exactly the text embedded in the file (with < escaped) so the in-file Verify recomputes the same value.
  const json = JSON.stringify(record).replace(/</g, '\\u003c');
  const hash = await sha256Hex(json);
  const r = record;
  const rows = r.exception_rows;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Evidence pack ${esc(r.rule.id)} · ${esc(a.gstin)}</title>
<style>
body{font-family:'IBM Plex Sans',system-ui,sans-serif;color:#1a2233;background:#f2f4f7;margin:0;padding:28px 18px}main{max-width:1100px;margin:0 auto;background:#fff;border:1px solid #e7ebf3;border-radius:14px;padding:26px 30px}
h1{font-family:'IBM Plex Serif',Georgia,serif;font-size:24px;margin:0 0 4px}h2{font-size:15px;margin:22px 0 8px;color:#1a2e5e}.sub{font-family:'Roboto Mono',monospace;font-size:12px;color:#8d98ae}
.fp{font-family:'Roboto Mono',monospace;font-size:12px;background:#f7f8fb;border:1px solid #e7ebf3;border-radius:8px;padding:10px 12px;word-break:break-all;margin-top:12px}
.warn{background:#f7f8fb;border-left:3px solid #9e541a;padding:9px 12px;border-radius:6px;font-size:13px;color:#54607a}
table{border-collapse:collapse;width:100%;font-size:12.5px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #eef1f6;vertical-align:top}th{background:#f7f8fb;font-weight:600}
dl{display:grid;grid-template-columns:200px 1fr;gap:6px 14px;font-size:13.5px;margin:0}dt{color:#54607a}dd{margin:0}
button{font:inherit;border:1px solid #1a2e5e;background:#1a2e5e;color:#fff;border-radius:8px;padding:6px 14px;cursor:pointer}#vr{margin-left:10px;font-weight:600}
.scroll{overflow-x:auto}@media print{button{display:none}body{background:#fff;padding:0}main{border:0}}
</style></head><body><main>
<h1>Evidence pack: ${esc(r.rule.id)} ${esc(r.rule.check || '')}</h1>
<div class="sub">${esc(a.name)} · ${esc(a.gstin)} · FY ${esc(a.fy)} · generated ${esc(r.generated_at)} by ${esc(user.name)}, ${esc(user.role)}</div>
<div class="fp"><b>SHA-256 fingerprint of the embedded record</b><br>${hash}<br><br><button type="button" onclick="verifyPack()">Verify this file</button><span id="vr"></span></div>
<p class="warn">${esc(r.disclaimer)}</p>
<h2>Rule</h2><dl>
<dt>Rule ID</dt><dd>${esc(r.rule.id)} (${esc(r.engine)}; rule definition ${esc(r.rule_definition_sha256.slice(0, 16))}…)</dd>
<dt>Legal provision</dt><dd>${esc(r.rule.legal_provision)}</dd><dt>Test</dt><dd>${esc(r.rule.test)}</dd><dt>Threshold</dt><dd>${esc(r.rule.threshold)}</dd>
<dt>Exposure basis</dt><dd>${esc(r.rule.exposure_basis)}</dd><dt>Route only if confirmed</dt><dd>${esc(r.rule.route_if_confirmed)}</dd></dl>
<h2>Source data</h2><dl><dt>File</dt><dd>${esc(r.source.file)}</dd><dt>Extract date</dt><dd>${esc(r.source.extract_date)} (${esc(r.source.extract_date_source)})</dd><dt>Data refreshed</dt><dd>${esc(r.source.data_refreshed_at)}</dd></dl>
<h2>System result (preliminary)</h2><dl><dt>Status</dt><dd>${esc(r.result.status)}${r.result.rag ? ` · ${esc(r.result.rag)}` : ''}</dd><dt>Finding</dt><dd>${esc(r.result.finding)}</dd>
<dt>Computed amount</dt><dd>₹${Math.round(r.result.computed_amount || 0).toLocaleString('en-IN')}</dd><dt>Verify</dt><dd><b>${esc(r.verification.step)}.</b> ${esc(r.verification.evidence_required)}</dd></dl>
<h2>Exception rows ${rows ? `(${rows.included} of ${rows.total})` : ''}</h2>
${rows ? `<div class="scroll"><table><thead><tr>${rows.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.rows.map((row) => `<tr>${row.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p>No line-level rows for this check.</p>'}
<h2>Officer record</h2><dl>
<dt>Outcome</dt><dd>${r.officer.outcome ? `${esc(r.officer.outcome.label)}: ${esc(r.officer.outcome.note)} (${esc(r.officer.outcome.at)}, ${esc(r.officer.outcome.by)})` : 'Not yet recorded'}</dd>
<dt>Taxpayer responses</dt><dd>${r.officer.taxpayer_responses.map((x) => `${esc(x.received)}${x.ref ? ` · ${esc(x.ref)}` : ''}: ${esc(x.text)}`).join('<br>') || 'None recorded'}</dd>
<dt>Checklist steps recorded</dt><dd>${Object.keys(r.officer.readiness_checklist).length} of 10</dd>
<dt>Closure</dt><dd>${r.officer.closure ? `${esc(r.officer.closure.label)}: ${esc(r.officer.closure.reason)}` : 'Open'}</dd></dl>
<h2>Case history</h2><table><tbody>${r.officer.history.map((h) => `<tr><td style="white-space:nowrap">${esc(h.at)}</td><td>${esc(h.by)}</td><td>${esc(h.text)}</td></tr>`).join('') || '<tr><td>No history</td></tr>'}</tbody></table>
<script type="application/json" id="pack">${json}</script>
<script>
async function verifyPack(){var t=document.getElementById('pack').textContent,out=document.getElementById('vr');
try{var b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));var h=[...new Uint8Array(b)].map(function(x){return x.toString(16).padStart(2,'0')}).join('');
out.textContent=h==='${hash}'?'Verified: the record matches its fingerprint.':'Mismatch: the record has been altered.';out.style.color=h==='${hash}'?'#0c6a4a':'#b02222';}
catch(e){out.textContent='Cannot verify in this browser: compute SHA-256 of the #pack JSON manually.';}}
</script></main></body></html>`;
  return { html, hash, fileName: `evidence-pack_${a.gstin}_${result.id}_${generatedAt.replace(/[^0-9]/g, '').slice(0, 12)}.html` };
}

export function downloadFile(name, content, type = 'text/html;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const el = document.createElement('a'); el.href = url; el.download = name; el.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
