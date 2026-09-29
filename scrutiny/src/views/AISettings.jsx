import React, { useEffect, useMemo, useState } from 'react';
import { PageHead, Seg } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { AI_MODELS, AI_DEFAULTS, aiStatus, taxpayerFacts } from '../lib/ai.js';

export default function AISettings({ data, ai, setAi, toast }) {
  const [status, setStatus] = useState(undefined);
  const [keyDraft, setKeyDraft] = useState('');
  const [models, setModels] = useState(AI_MODELS.map((m) => ({ id: m.id, name: `${m.label}: ${m.note}` })));
  const [loadingModels, setLoadingModels] = useState(false);
  const [test, setTest] = useState(null);
  useEffect(() => { aiStatus().then(setStatus); }, []);

  const set = (k, v) => setAi((s) => ({ ...s, [k]: v }));
  const source = ai.key ? 'browser' : status?.envKey ? 'env' : null;
  const sample = useMemo(() => taxpayerFacts(data.taxpayers[0], data.catalog, ai.mask).facts, [data, ai.mask]);
  const headers = () => ({ 'content-type': 'application/json', ...(ai.key ? { 'x-together-key': ai.key } : {}) });

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const r = await fetch('/__ai/models', { headers: headers() });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      const known = new Set(AI_MODELS.map((m) => m.id));
      setModels([...AI_MODELS.map((m) => ({ id: m.id, name: `${m.label}: ${m.note}` })), ...b.models.filter((m) => !known.has(m.id)).map((m) => ({ id: m.id, name: m.name }))]);
      toast(`Loaded ${b.models.length} chat models from your AI account`);
    } catch (e) {
      toast(`Could not load models: ${e.message}`);
    } finally {
      setLoadingModels(false);
    }
  };

  const runTest = async () => {
    setTest({ state: 'running' });
    const t0 = performance.now();
    try {
      const r = await fetch('/__ai/chat', { method: 'POST', headers: headers(), body: JSON.stringify({ model: ai.model, temperature: 0, max_tokens: 64, json: true, messages: [{ role: 'system', content: 'Reply with JSON only.' }, { role: 'user', content: 'Return {"ok": true, "model": "<your model name>"}' }] }) });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      setTest({ state: 'ok', text: `Connected · ${b.model} · ${Math.round(performance.now() - t0)} ms` });
    } catch (e) {
      setTest({ state: 'fail', text: e.message });
    }
  };

  return (
    <div className="page">
      <PageHead title="AI assistant" path="PUT /api/ai · insight summaries">
        <button className="btn" onClick={() => setAi((s) => ({ ...AI_DEFAULTS, key: s.key }))}>Reset defaults</button>
      </PageHead>

      <div className="grid g-main-side">
        <div className="stack">
          <section className="card">
            <div className="card-head"><div><h3>Insight mode</h3><p>Used by the Key insights panels on the Dashboard, Taxpayer 360° and in reports. Officers can still switch per panel.</p></div></div>
            <div className="grid g-2">
              {[['deterministic', 'Deterministic', 'Rule-based insights computed locally from the checks and signals. Same input → same output. No data leaves the machine.'],
                ['ai', 'AI', 'A large language model summarises the same facts in plain language and ranks what matters. Output can vary; always shown with its model and time.']].map(([v, t, d]) => (
                <button key={v} className="panel" onClick={() => set('mode', v)} style={{ textAlign: 'left', cursor: 'pointer', outline: ai.mode === v ? '2px solid var(--gold)' : 'none', background: ai.mode === v ? '#fffdf3' : undefined }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className={`switch ${ai.mode === v ? 'on' : ''}`} aria-hidden /> <b>{t}</b></div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.5 }}>{d}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-head"><div><h3>AI connection</h3><p>Calls go through the local dev server, so the key is never placed in the page code or sent anywhere except the AI service.</p></div>
              <div className="actions">{source ? <span className="chip good"><Icon name="check" size={13} stroke={2.6} /> {source === 'env' ? 'key from .env.local' : 'key saved in this browser'}</span> : <span className="chip bad">not connected</span>}</div></div>
            {status === null && <div className="note" style={{ marginBottom: 12 }}>The AI proxy is only available when running <code>npm run dev</code>.</div>}
            <div className="form-grid">
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="ai-key">api_key</label>
                <input id="ai-key" type="password" className="mono-in" autoComplete="off" placeholder={ai.key ? '•••••••• saved in this browser' : 'Paste your AI API key'} value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} />
                <span className="help">Stored only in this browser's local storage. Preferred: put <code>AI_API_KEY=…</code> in <code>.env.local</code> in the project folder and restart <code>npm run dev</code>.</span>
              </div>
              <div className="field" style={{ alignContent: 'start' }}>
                <label>&nbsp;</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn primary" disabled={!keyDraft.trim()} onClick={() => { set('key', keyDraft.trim()); setKeyDraft(''); setTest(null); toast('API key saved in this browser'); }}>Save key</button>
                  {ai.key && <button className="btn danger" onClick={() => { set('key', ''); setTest(null); toast('API key removed from this browser'); }}>Remove</button>}
                </div>
              </div>
            </div>
            <div className="form-grid mt">
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="ai-model">model</label>
                <select id="ai-model" value={ai.model} onChange={(e) => set('model', e.target.value)}>
                  {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  {!models.some((m) => m.id === ai.model) && <option value={ai.model}>{ai.model}</option>}
                </select>
                <span className="help mono">{ai.model}</span>
              </div>
              <div className="field">
                <label>&nbsp;</label>
                <button className="btn" onClick={loadModels} disabled={!source || loadingModels}>{loadingModels ? 'Loading…' : 'Load from my account'}</button>
              </div>
              <div className="field">
                <label htmlFor="ai-temp">temperature · {ai.temperature.toFixed(2)}</label>
                <input id="ai-temp" type="range" min="0" max="1" step="0.05" value={ai.temperature} onChange={(e) => set('temperature', +e.target.value)} />
                <span className="help">Lower = more consistent summaries (0.1–0.3 recommended).</span>
              </div>
              <div className="field">
                <label htmlFor="ai-max">max_tokens</label>
                <input id="ai-max" type="number" min="300" max="4000" step="100" className="mono-in" value={ai.maxTokens} onChange={(e) => set('maxTokens', Math.max(300, Math.min(4000, +e.target.value || 1400)))} />
              </div>
              <div className="field">
                <label>&nbsp;</label>
                <button className="btn navy" onClick={runTest} disabled={!source || test?.state === 'running'}>{test?.state === 'running' ? 'Testing…' : 'Test connection'}</button>
              </div>
            </div>
            {test && test.state !== 'running' && <div className={`chip ${test.state === 'ok' ? 'good' : 'bad'}`} style={{ marginTop: 12, whiteSpace: 'normal' }}>{test.text}</div>}
          </section>

          <section className="card">
            <div className="card-head"><div><h3>What is sent to the AI</h3><p>A compact fact sheet built from the findings: never raw invoices, ledgers or the uploaded workbook. Preview for {ai.mask ? 'a masked' : 'an unmasked'} taxpayer:</p></div>
              <div className="actions"><Seg value={ai.mask ? 'on' : 'off'} onChange={(v) => set('mask', v === 'on')} options={[{ value: 'on', label: 'Mask identities' }, { value: 'off', label: 'Send names' }]} /></div></div>
            <pre className="formula" style={{ maxHeight: 320, overflow: 'auto', fontSize: 11.5 }}>{JSON.stringify(sample, null, 2)}</pre>
            <div className="card-foot">With masking on, taxpayer, supplier and customer names and GSTINs are replaced by aliases (e.g. “Taxpayer A”, “Supplier 2”) before sending and swapped back locally in the reply.</div>
          </section>
        </div>

        <div className="stack">
          <div className="callout">
            <Icon name="alert" size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>AI mode sends taxpayer findings to an external AI service. Confirm this is permitted for your office before enabling it on live cases. Keep <b>Mask identities</b> on unless names are required.</div>
          </div>
          <section className="card">
            <div className="eyebrow">How AI output is controlled</div>
            <ul style={{ margin: '12px 0 0', paddingLeft: 18, lineHeight: 1.7, color: 'var(--ink-2)', fontSize: 13.5 }}>
              <li>The model is told to use only the supplied facts and to cite rule IDs.</li>
              <li>Replies must be JSON; anything else is rejected.</li>
              <li>Rule references not present in the facts are removed and counted.</li>
              <li>Every AI panel shows model, time and token use, and is cached so the same facts give the same text until you regenerate.</li>
              <li>Deterministic mode never calls the network.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
