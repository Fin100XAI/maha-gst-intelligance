import React, { useRef, useState } from 'react';
import { Card } from './ui.jsx';
import Icon from './Icon.jsx';
import { REGISTERS, registerTemplate } from '../engine/registers.js';

const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// One register: status, template, upload, and the full list of problems when a file is rejected.
function RegisterRow({ type, loaded, onUpload }) {
  const def = REGISTERS[type];
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const pick = async (file) => {
    if (!file) return;
    setBusy(true);
    setResult(await onUpload(type, file));
    setBusy(false);
  };
  return (
    <div className="reg-row">
      <div className="reg-main">
        <div className="reg-title">{def.title}{loaded ? <span className="chip good" style={{ marginLeft: 8 }}>{loaded.meta.rows} rows</span> : <span className="chip" style={{ marginLeft: 8 }}>not loaded</span>}</div>
        <div className="reg-purpose">{def.purpose}</div>
        {loaded && <div className="reg-meta">{loaded.meta.file} · uploaded {when(loaded.meta.uploadedAt)} · SHA-256 {loaded.meta.sha256.slice(0, 12)}…</div>}
      </div>
      <div className="reg-actions">
        <button className="btn small" onClick={() => download(`${type}-register-template.csv`, registerTemplate(type))}><Icon name="download" size={14} /> Template</button>
        <button className="btn small primary" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Checking…' : loaded ? 'Add rows' : 'Upload'}</button>
        <input ref={input} type="file" accept=".csv,.xlsx" hidden onChange={(e) => { pick(e.target.files[0]); e.target.value = ''; }} />
      </div>
      {result && !result.ok && (
        <div className="reg-errors" role="alert">
          <b>File not loaded: {result.errors.length + (result.more || 0)} problem(s). Nothing was saved.</b>
          <ul>{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          {result.more > 0 && <div>…and {result.more} more.</div>}
        </div>
      )}
      {result?.ok && (
        <div className="reg-ok">
          {result.meta.mode === 'merge'
            ? `${result.meta.file}: ${result.meta.added} row${result.meta.added === 1 ? '' : 's'} added, ${result.meta.updated} updated, ${result.meta.kept} already saved kept (${result.meta.rows} in all).`
            : `Loaded ${result.meta.rows} rows from ${result.meta.file}.`}
          {result.replaced ? ' The previous version is kept in data/registers/superseded.' : ''}
        </div>
      )}
    </div>
  );
}

/** The registers as rows (status, template, upload), without a card around them. */
export function RegisterList({ registers, onUpload }) {
  if (registers === null) return <div className="muted">Registers need the server store (dev server or server.mjs).</div>;
  return registers ? Object.keys(REGISTERS).map((type) => <RegisterRow key={type} type={type} loaded={registers[type]} onUpload={onUpload} />) : null;
}

export default function RegistersCard({ registers, onUpload }) {
  return (
    <Card title="Registers" sub="Official registers the returns download does not contain. Each upload is checked in full: a file with any problem is rejected with the complete list, and nothing is saved.">
      {registers === null && <div className="muted">Registers need the server store (dev server or server.mjs).</div>}
      {registers && Object.keys(REGISTERS).map((type) => <RegisterRow key={type} type={type} loaded={registers[type]} onUpload={onUpload} />)}
    </Card>
  );
}
