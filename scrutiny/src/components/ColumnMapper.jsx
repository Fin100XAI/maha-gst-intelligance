// Data in another layout (a CSV from accounting software, a GSTR-2B downloaded on its own): say what the file holds,
// check which of its columns is which, see what the conversion gives and what it leaves out, then add the sheet to the
// taxpayer's stored returns or download it in the template's form. The conversion rules are in src/engine/mapping.js.
import React, { useMemo, useState } from 'react';
import { TARGETS, findHeaderRow, suggestMapping, convertRows, templateAoa, signature } from '../engine/mapping.js';
import { usePersistent } from '../lib/store.js';
import { int } from '../lib/format.js';

const PREVIEW = 6;

export default function ColumnMapper({ data, canUpload, onAdd, toast }) {
  const [file, setFile] = useState(null); // { name, sheets: { [name]: grid } }
  const [sheetName, setSheetName] = useState('');
  const [headerRow, setHeaderRow] = useState(0);
  const [target, setTarget] = useState('GSTR2B_B2B');
  const [mapping, setMapping] = useState({});
  const [taxpayer, setTaxpayer] = useState('');
  const [fy, setFy] = useState('');
  const [busy, setBusy] = useState(false);
  // Mappings remembered in this browser for files of the same layout (same column names)
  const [remembered, setRemembered] = usePersistent('gst.columnMappings', {});

  const grid = file?.sheets[sheetName] || [];
  const headers = (grid[headerRow] || []).map((h) => (h === null || h === undefined ? '' : String(h)));
  const sig = headers.length ? signature(headers) : '';
  const t = TARGETS[target];
  const years = useMemo(() => [...new Set((data.baselines?.[taxpayer] || []).map((b) => b.fy))].sort().reverse(), [data.baselines, taxpayer]);
  const fyStart = Number(String(fy).slice(0, 4));
  const converted = useMemo(() => (file && fyStart ? convertRows(t, grid, { headerRow, mapping, fyStart }) : null), [file, t, grid, headerRow, mapping, fyStart]);

  const mappingFor = (tgt, hdrs) => {
    const saved = remembered[signature(hdrs)];
    if (saved?.target === tgt) return Object.fromEntries(TARGETS[tgt].fields.map((f) => [f.key, saved.byHeader[f.key] !== undefined && hdrs.indexOf(saved.byHeader[f.key]) >= 0 ? hdrs.indexOf(saved.byHeader[f.key]) : null]));
    return suggestMapping(TARGETS[tgt], hdrs);
  };
  const choose = (tgt, g = grid, hr = headerRow) => { setTarget(tgt); setMapping(mappingFor(tgt, (g[hr] || []).map((h) => (h == null ? '' : String(h))))); };

  const pick = async (f) => {
    if (!f) return;
    setBusy(true);
    try {
      const XLSX = await import('xlsx');
      const csv = /\.(csv|txt)$/i.test(f.name);
      // CSV cells are kept as written (no automatic dates); the conversion reads them
      const wb = csv ? XLSX.read(await f.text(), { type: 'string', raw: true }) : XLSX.read(await f.arrayBuffer(), { type: 'array' });
      const sheets = Object.fromEntries(wb.SheetNames.map((n) => [n, XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null, blankrows: false })]));
      const first = wb.SheetNames.find((n) => sheets[n].length > 1) || wb.SheetNames[0];
      const hr = findHeaderRow(sheets[first]);
      setFile({ name: f.name, sheets }); setSheetName(first); setHeaderRow(hr);
      const hdrs = (sheets[first][hr] || []).map((h) => (h == null ? '' : String(h)));
      const saved = remembered[signature(hdrs)];
      choose(saved?.target || target, sheets[first], hr);
      if (saved) toast(`Columns matched as last time for files laid out like ${f.name}`);
    } catch (e) { toast(`Could not read ${f.name}: ${e.message}`); } finally { setBusy(false); }
  };

  const aoa = () => templateAoa(t, converted, { gstin: taxpayer, fyStart, name: data.taxpayers.find((a) => a.gstin === taxpayer)?.name || '' });
  const remember = () => setRemembered((r) => ({ ...r, [sig]: { target, byHeader: Object.fromEntries(Object.entries(mapping).filter(([, i]) => i !== null).map(([k, i]) => [k, headers[i]])) } }));
  const download = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa()), target);
    XLSX.writeFile(wb, `${target}_${taxpayer || 'GSTIN'}_${fy || 'FY'}.xlsx`);
    remember();
  };
  const add = async () => {
    setBusy(true);
    const r = await onAdd({ gstin: taxpayer, fy, sheet: target, name: file.name, rows: aoa() });
    setBusy(false);
    if (r?.ok) { remember(); setFile(null); }
  };

  const ready = converted && converted.read > 0 && taxpayer && /^\d{4}-\d{4}$/.test(fy);
  return (
    <div className="mapper">
      <div className="mapper-row">
        <label className="field"><span>File (CSV or Excel)</span><input type="file" accept=".csv,.txt,.xlsx,.xls" disabled={busy} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} /></label>
        {file && Object.keys(file.sheets).length > 1 && (
          <label className="field"><span>Sheet</span><select value={sheetName} onChange={(e) => { const g = file.sheets[e.target.value]; const hr = findHeaderRow(g); setSheetName(e.target.value); setHeaderRow(hr); choose(target, g, hr); }}>{Object.keys(file.sheets).map((n) => <option key={n}>{n}</option>)}</select></label>
        )}
        {file && <label className="field"><span>Header row</span><input type="number" min={1} max={20} value={headerRow + 1} onChange={(e) => { const hr = Math.max(0, Math.min(19, Number(e.target.value) - 1)); setHeaderRow(hr); choose(target, grid, hr); }} style={{ width: 70 }} /></label>}
      </div>
      {file && (<>
        <div className="mapper-row">
          <label className="field"><span>The file holds</span><select value={target} onChange={(e) => choose(e.target.value)}>{Object.entries(TARGETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
          <label className="field"><span>Taxpayer</span><select value={taxpayer} onChange={(e) => { setTaxpayer(e.target.value); const y = [...new Set((data.baselines?.[e.target.value] || []).map((b) => b.fy))].sort().pop(); if (y) setFy(y); }}>
            <option value="">Choose…</option>{[...data.taxpayers].sort((x, y) => x.name.localeCompare(y.name)).map((a) => <option key={a.gstin} value={a.gstin}>{a.name} · {a.gstin}</option>)}</select></label>
          <label className="field"><span>Financial year</span>{years.length ? <select value={fy} onChange={(e) => setFy(e.target.value)}>{years.map((y) => <option key={y}>{y}</option>)}</select> : <input value={fy} onChange={(e) => setFy(e.target.value)} placeholder="2025-2026" style={{ width: 110 }} />}</label>
        </div>
        <table className="tbl mapper-tbl">
          <thead><tr><th>Template column</th><th>Column in {file.name}</th><th>First value</th></tr></thead>
          <tbody>{t.fields.map((f) => {
            const i = mapping[f.key];
            const sample = i !== null && i !== undefined ? grid.slice(headerRow + 1).find((r) => r?.[i] !== null && r?.[i] !== undefined && r?.[i] !== '')?.[i] : null;
            return (
              <tr key={f.key}>
                <td>{f.label}{f.required && <span className="req" title="Required">*</span>}{f.key === 'Month' && t.monthFrom && <div className="muted small">or taken from the {t.fields.find((x) => x.key === t.monthFrom).label.toLowerCase()}</div>}</td>
                <td><select value={i ?? ''} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value === '' ? null : Number(e.target.value) })}>
                  <option value="">(none)</option>{headers.map((h, j) => <option key={j} value={j}>{h || `Column ${j + 1}`}</option>)}</select></td>
                <td className="mono small">{sample === null || sample === undefined ? '' : String(sample).slice(0, 40)}</td>
              </tr>
            );
          })}</tbody>
        </table>
        {!fyStart && <div className="note">Choose the taxpayer and financial year to see the conversion.</div>}
        {converted && (
          <div className="mapper-result">
            <b>{int(converted.read)} row{converted.read === 1 ? '' : 's'} converted</b>{Object.keys(converted.months).length > 0 && <span className="muted"> · {Object.entries(converted.months).map(([m, n]) => `${m.slice(0, 3)} ${n}`).join(' · ')}</span>}
            {converted.problems.map((p) => <div key={p} className="demo-warn">{p}</div>)}
            {converted.read > 0 && (
              <div className="tbl-wrap" style={{ maxHeight: 220 }}><table className="tbl"><thead><tr>{converted.header.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>{converted.rows.slice(0, PREVIEW).map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j} className="small">{c === null ? '' : String(c)}</td>)}</tr>)}</tbody></table></div>
            )}
          </div>
        )}
        <div className="mapper-row">
          {canUpload && <button className="btn small primary" disabled={!ready || busy} onClick={add}>{busy ? 'Working…' : `Replace this sheet in the stored returns${taxpayer ? ` of ${taxpayer}` : ''}${fy ? `, FY ${fy}` : ''}`}</button>}
          <button className="btn small" disabled={!ready} onClick={download}>Download in the template's form</button>
          <span className="muted small">The file should hold the whole return for the year: it replaces that sheet of the stored workbook (the previous workbook is kept) and the analysis runs again.</span>
        </div>
      </>)}
    </div>
  );
}
