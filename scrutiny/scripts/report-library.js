// Dev-server plugin: saves generated scrutiny reports to public/reports/ (HTML + PDF via headless Edge/Chrome)
// and keeps an index page at /reports/index.html. Local only: requests must come from this machine.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { accessOf, forbid, gstinOfReportFile } from './lib/request-access.mjs';
// With accounts: an officer lists, opens and saves reports of their jurisdictions only; the library's index page
// lists every taxpayer, so it is for accounts covering all jurisdictions.

const BROWSERS = [
  process.env.CHROME_PATH,
  '/usr/bin/chromium-browser', '/usr/bin/chromium',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const inr = (v) => {
  const a = Math.abs(v || 0);
  if (a >= 1e7) return `₹${(a / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `₹${(a / 1e5).toFixed(2)} L`;
  return `₹${Math.round(a).toLocaleString('en-IN')}`;
};

function toPdf(htmlFile, pdfFile) {
  const exe = BROWSERS.find((p) => p && fs.existsSync(p));
  if (!exe) return Promise.resolve(false);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'gst-pdf-'));
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-pdf-header-footer', `--user-data-dir=${profile}`, ...(process.env.CHROME_NO_SANDBOX === '1' ? ['--no-sandbox', '--disable-dev-shm-usage'] : []),
    '--run-all-compositor-stages-before-draw', '--virtual-time-budget=8000', `--print-to-pdf=${pdfFile}`, pathToFileURL(htmlFile).href];
  return new Promise((resolve) => {
    execFile(exe, args, { timeout: 90000 }, () => {
      fs.rm(profile, { recursive: true, force: true }, () => {});
      resolve(fs.existsSync(pdfFile) && fs.statSync(pdfFile).size > 1000);
    });
  });
}

const BAND = { Low: '#0ca30c', Moderate: '#fab219', High: '#ec835a', Critical: '#d03b3b' };

function writeIndexPage(dir, idx) {
  const rows = Object.values(idx).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const total = rows.reduce((s, r) => s + (r.confirmed || 0), 0);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Report library · GST Intelligence</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@500;600&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--brand:#1a2e5e;--ink:#1a2233;--ink2:#54607a;--ink3:#8d98ae;--lav:#eef1f8;--line:#e7ebf3;font-family:'IBM Plex Sans',system-ui,sans-serif;color:var(--ink);background:#f2f4f7}
body{margin:0;padding:40px 24px}main{max-width:1100px;margin:0 auto}
h1{font-family:'IBM Plex Serif',serif;font-size:32px;letter-spacing:-.02em;margin:0}.path{font-family:'Roboto Mono',monospace;font-size:12px;color:var(--ink3);margin-top:6px}
.top{display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:22px}.top a.btn{margin-left:auto}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:18px}
.kpi{background:#fff;border-radius:16px;border:1px solid #e7ebf3;padding:20px 22px;box-shadow:0 10px 30px -18px rgba(34,50,89,.16)}
.kpi .l{font-weight:600;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:#9e541a}
.kpi .v{font-family:'IBM Plex Serif',serif;font-size:28px;font-weight:600;margin-top:8px;letter-spacing:-.02em}
.card{background:#fff;border-radius:16px;border:1px solid #e7ebf3;box-shadow:0 10px 30px -18px rgba(34,50,89,.16);overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:14px}th{text-align:left;font-family:'Roboto Mono',monospace;font-weight:400;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink2);padding:16px 20px;background:#f7f8fb;border-bottom:1px solid var(--line)}
td{padding:16px 20px;border-bottom:1px solid #f2f1f7;vertical-align:middle}tr:last-child td{border-bottom:0}
.who{font-weight:600}.sub{font-family:'Roboto Mono',monospace;font-size:11.5px;color:var(--ink2);margin-top:3px}
.band{display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:999px;font-weight:600;font-size:12.5px}
.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
a.btn{display:inline-block;text-decoration:none;border-radius:8px;padding:8px 16px;font-weight:600;font-size:13px;border:1px solid var(--line);color:var(--ink);margin-left:6px}
a.btn.primary{background:#c0a20c;border-color:#c0a20c;color:#0d1834}
.empty{padding:40px;text-align:center;color:var(--ink3)}.foot{font-family:'Roboto Mono',monospace;font-size:12px;color:var(--ink3);margin-top:18px}
</style></head><body><main>
<div class="top"><div><h1>Report library</h1><div class="path">GET /reports · ${rows.length} saved scrutiny report${rows.length === 1 ? '' : 's'} · stored on this computer</div></div>
<a class="btn" href="/#/report">Open console</a></div>
<div class="kpis"><div class="kpi"><div class="l">Reports saved</div><div class="v">${rows.length}</div></div>
<div class="kpi"><div class="l">High · critical</div><div class="v">${rows.filter((r) => r.band === 'High' || r.band === 'Critical').length}</div></div>
<div class="kpi"><div class="l">Quantified exposure</div><div class="v">${inr(total)}</div></div>
<div class="kpi"><div class="l">Last saved</div><div class="v" style="font-size:18px">${rows.length ? esc(new Date(Math.max(...rows.map((r) => Date.parse(r.savedAt)))).toLocaleString('en-IN')) : '-'}</div></div></div>
<div class="card">${rows.length ? `<table><thead><tr><th>Taxpayer</th><th>Risk</th><th class="num">Quantified</th><th class="num">Potential</th><th>Saved</th><th style="text-align:right">Report</th></tr></thead><tbody>
${rows.map((r) => `<tr><td><div class="who">${esc(r.name)}</div><div class="sub">${esc(r.gstin)} · ${esc(r.state)} · FY ${esc(r.fy)}</div></td>
<td><span class="band" style="background:${BAND[r.band] || '#999'}22"><i style="width:8px;height:8px;border-radius:50%;background:${BAND[r.band] || '#999'};display:inline-block"></i>${esc(r.band)} <span style="opacity:.6;font-family:'Roboto Mono',monospace">${r.score}</span></span></td>
<td class="num">${inr(r.confirmed)}</td><td class="num">${inr(r.potential)}</td><td class="sub">${esc(new Date(r.savedAt).toLocaleString('en-IN'))}<br>by ${esc(r.by)}</td>
<td style="text-align:right;white-space:nowrap"><a class="btn primary" href="${esc(r.html)}">View</a>${r.pdf ? `<a class="btn" href="${esc(r.pdf)}">PDF</a>` : ''}</td></tr>`).join('\n')}
</tbody></table>` : '<div class="empty">No reports saved yet. Open a report in the console and choose “Save to library”.</div>'}</div>
<div class="foot">Files: public/reports/ in the project folder. Amounts are indicative tax from returns data only.</div>
</main></body></html>`;
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

export default function reportLibrary() {
  return {
    name: 'report-library',
    configureServer(server) {
      const dir = path.resolve(server.config.root, 'public', 'reports');
      const indexFile = path.join(dir, 'index.json');
      const readIndex = () => { try { return JSON.parse(fs.readFileSync(indexFile, 'utf8')); } catch { return {}; } };
      // GST_ALLOW_REMOTE=1 is needed behind Docker / a reverse proxy (pair it with BASIC_AUTH_* or network controls).
      const local = (req) => process.env.GST_ALLOW_REMOTE === '1' || ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      const json = (res, code, body) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(body)); };
      fs.mkdirSync(dir, { recursive: true });
      if (!fs.existsSync(path.join(dir, 'index.html'))) writeIndexPage(dir, readIndex());

      // Serve the library ourselves: Vite's HTML fallback would otherwise answer /reports/index.html with the SPA.
      const TYPES = { '.html': 'text/html; charset=utf-8', '.pdf': 'application/pdf', '.json': 'application/json' };
      server.middlewares.use('/reports', (req, res, next) => {
        const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '') || 'index.html';
        const file = path.resolve(dir, rel);
        if (!file.startsWith(dir + path.sep) || !TYPES[path.extname(file)] || !fs.existsSync(file)) return next();
        const acc = accessOf(req);
        const g = gstinOfReportFile(rel);
        if (g ? !acc.inScope(g) : !acc.all) return forbid(res, 'This report is outside your jurisdiction');
        res.setHeader('content-type', TYPES[path.extname(file)]);
        res.setHeader('cache-control', 'no-store');
        fs.createReadStream(file).pipe(res);
      });
      server.middlewares.use('/__reports/list', (req, res) => {
        const acc = accessOf(req);
        json(res, 200, acc.all ? readIndex() : Object.fromEntries(Object.entries(readIndex()).filter(([g]) => acc.inScope(g))));
      });
      server.middlewares.use('/__reports/save', (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        if (!local(req)) return json(res, 403, { ok: false, error: 'Saving is allowed from this computer only' });
        let body = '';
        req.on('data', (c) => { body += c; if (body.length > 25e6) req.destroy(); });
        req.on('end', async () => {
          try {
            const { gstin, html, meta = {}, pdf = true } = JSON.parse(body);
            if (!/^[0-9A-Z]{15}$/.test(gstin)) throw new Error('invalid GSTIN');
            if (!accessOf(req).inScope(gstin)) return forbid(res, `${gstin} is not in your jurisdiction`);
            if (typeof html !== 'string' || !html.startsWith('<!doctype html>')) throw new Error('invalid report');
            const base = `scrutiny-report_${gstin}`;
            const htmlFile = path.join(dir, `${base}.html`);
            fs.writeFileSync(htmlFile, html);
            const pdfOk = pdf ? await toPdf(htmlFile, path.join(dir, `${base}.pdf`)) : false;
            const idx = readIndex();
            idx[gstin] = { ...meta, gstin, html: `${base}.html`, pdf: pdfOk ? `${base}.pdf` : null, savedAt: new Date().toISOString() };
            fs.writeFileSync(indexFile, JSON.stringify(idx, null, 2));
            writeIndexPage(dir, idx);
            json(res, 200, { ok: true, html: `/reports/${base}.html`, pdf: pdfOk ? `/reports/${base}.pdf` : null });
          } catch (e) {
            json(res, 400, { ok: false, error: e.message });
          }
        });
      });
    },
  };
}
