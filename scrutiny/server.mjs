// Production server for GST Intelligence (no extra dependencies).
// Serves the built app from ./dist and mounts the same middleware the Vite dev server uses:
//   /__ai/*      AI proxy (scripts/ai-proxy.js)
//   /__reports/* and /reports/*   report library (scripts/report-library.js)
//   /__data/upload and /data.json   uploaded workbooks kept in data/ (scripts/data-store.js)
//   /__cases                        shared case record, append-only event log in store/ (scripts/case-store.js)
//   /__registers                    EIU signals, targets, demands in data/registers/ (scripts/register-store.js)
//   /__ewb                          e-way bill connection: status, fetch, export upload (scripts/ewb-store.js)
//
// Environment:
//   PORT (8080) · HOST (127.0.0.1) · AI_API_KEY · BASIC_AUTH_USER / BASIC_AUTH_PASS (optional HTTP basic auth)
//   GST_ALLOW_REMOTE=1  allow AI calls / report saving / uploads from other machines (required behind Docker or a proxy)
//   CHROME_PATH         Chromium/Edge binary for PDF export · CHROME_NO_SANDBOX=1 inside containers
//   PLATFORM_DIST       platform mode: also serve the Maha GST Intelligence platform (its built dist/) at "/",
//                       with this app under SCRUTINY_BASE (default /scrutiny/, build with `npm run build:platform`).
//                       The app calls the services above under SCRUTINY_BASE too (/scrutiny/__cases ...),
//                       exactly as it does behind a proxy that forwards /scrutiny/ here with the prefix removed.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import reportLibrary from './scripts/report-library.js';
import aiProxy from './scripts/ai-proxy.js';
import dataStore from './scripts/data-store.js';
import caseStore from './scripts/case-store.js';
import registerStore from './scripts/register-store.js';
import docStore from './scripts/doc-store.js';
import governance from './scripts/governance.js';
import ewbStore from './scripts/ewb-store.js';
import alertStore from './scripts/alert-store.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');

// .env.local / .env (KEY=VALUE lines) for runs outside Docker; real environment variables win.
for (const f of ['.env.local', '.env']) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '127.0.0.1';
const AUTH_USER = process.env.BASIC_AUTH_USER || '';
const AUTH_PASS = process.env.BASIC_AUTH_PASS || '';

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/ not found. Run "npm run build" first.');
  process.exit(1);
}

// Platform mode: one server, one address for the platform and this app, so the
// platform can frame it under the same-origin rule set below.
const PLATFORM = process.env.PLATFORM_DIST ? path.resolve(root, process.env.PLATFORM_DIST) : null;
const BASE = PLATFORM ? `/${(process.env.SCRUTINY_BASE || 'scrutiny').replace(/^\/+|\/+$/g, '')}/` : '/';
if (PLATFORM && !fs.existsSync(path.join(PLATFORM, 'index.html'))) {
  console.error(`PLATFORM_DIST (${PLATFORM}) has no index.html. Build the platform first.`);
  process.exit(1);
}

// Minimal connect-style stack so the Vite plugins can be reused unchanged.
const stack = [];
const fakeServer = { middlewares: { use: (prefix, fn) => stack.push([prefix, fn]) }, config: { root } };
dataStore().configureServer(fakeServer);
caseStore().configureServer(fakeServer);
registerStore().configureServer(fakeServer);
docStore().configureServer(fakeServer);
governance().configureServer(fakeServer);
ewbStore().configureServer(fakeServer);
alertStore().configureServer(fakeServer);
reportLibrary().configureServer(fakeServer);
aiProxy(process.env).configureServer(fakeServer);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};
const safeEqual = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };

function serveStatic(dir, urlPath, res) {
  let file = path.resolve(dir, `.${urlPath}`);
  if (!file.startsWith(dir)) { res.statusCode = 400; return res.end('Bad request'); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dir, 'index.html'); // SPA fallback (hash routing)
  const ext = path.extname(file);
  res.setHeader('content-type', TYPES[ext] || 'application/octet-stream');
  res.setHeader('cache-control', file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache');
  fs.createReadStream(file).pipe(res);
}

// Files: this app's own (stand-alone, or under BASE in platform mode), else the platform's.
function route(req, res, mine) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  return serveStatic(mine ? dist : PLATFORM, urlPath, res);
}

const server = http.createServer((req, res) => {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'same-origin');
  res.setHeader('x-frame-options', 'SAMEORIGIN');

  if (AUTH_USER && AUTH_PASS) {
    const [, b64 = ''] = String(req.headers.authorization || '').split(' ');
    const [u = '', p = ''] = Buffer.from(b64, 'base64').toString().split(/:(.*)/s);
    if (!(safeEqual(u, AUTH_USER) && safeEqual(p, AUTH_PASS))) {
      res.statusCode = 401;
      res.setHeader('www-authenticate', 'Basic realm="GST Intelligence", charset="UTF-8"');
      return res.end('Authentication required');
    }
  }

  // Platform mode: everything under BASE is this app, services included (the app calls
  // /scrutiny/__cases, /scrutiny/data.json ...). Strip the prefix, as a proxy in front would.
  let url = req.url || '/';
  let mine = !PLATFORM;
  if (PLATFORM) {
    const p = url.split('?')[0];
    if (p === BASE.slice(0, -1)) { res.statusCode = 308; res.setHeader('location', BASE + url.slice(p.length)); return res.end(); }
    if (url.startsWith(BASE)) { url = url.slice(BASE.length - 1); mine = true; }
  }
  const layers = stack.filter(([prefix]) => url === prefix || url.startsWith(`${prefix}/`) || url.startsWith(`${prefix}?`));
  let i = 0;
  const next = () => {
    const layer = layers[i++];
    if (!layer) { req.url = url; return route(req, res, mine); }
    const [prefix, fn] = layer;
    req.url = url.slice(prefix.length) || '/'; // strip mount path like connect does
    try { fn(req, res, next); } catch (e) { res.statusCode = 500; res.end('Server error'); console.error(e); }
  };
  next();
});

server.listen(PORT, HOST, () => {
  console.log(`GST Intelligence on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`  AI key: ${process.env.AI_API_KEY || process.env.TOGETHER_API_KEY ? 'configured' : 'not set (deterministic insights only)'}`);
  console.log(`  platform: ${PLATFORM ? `at /, GST Scrutiny at ${BASE}` : 'off (stand-alone)'}`);
  console.log(`  basic auth: ${AUTH_USER && AUTH_PASS ? 'on' : 'off'} · remote AI/report saving: ${process.env.GST_ALLOW_REMOTE === '1' ? 'allowed' : 'this machine only'}`);
});
