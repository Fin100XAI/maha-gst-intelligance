// Server plugin: alert rules and the officers' alert queue.
//   GET  /__alerts?user=<name>     rules, current alerts (rules evaluated on the latest analysis, with their status),
//                                  alerts resolved by the latest analysis, and when this officer last looked
//   PUT  /__alerts/rules           { rules } replace the rule set (every rule validated; nothing saved if one is wrong)
//   POST /__alerts/action          { key, action: acknowledge|dismiss|reopen, note?, by? }  (dismiss needs a reason)
//   POST /__alerts/seen            { user }  marks the queue as looked at now (for "new since you last looked")
// Stored in <STORE_DIR or store>/alerts.json. An alert is identified by rule, GSTIN and year, so its status and the
// date it first appeared survive re-analysis; one that no longer meets its rule is marked resolved.
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_RULES, validateRule, evaluateAlerts } from '../src/engine/alerts.js';

const MAX_BODY = 256 * 1024;

export function readAlertStore(file) {
  try { const j = JSON.parse(fs.readFileSync(file, 'utf8')); return { rules: Array.isArray(j.rules) ? j.rules : DEFAULT_RULES, state: j.state || {}, seen: j.seen || {} }; } catch { return { rules: DEFAULT_RULES, state: {}, seen: {} }; }
}

/**
 * The queue: rules evaluated on the analysis, merged with what officers did (pure apart from the dataset passed in).
 * Returns the store as it should be saved (new alerts dated, vanished ones resolved) and what to show.
 */
export function buildQueue(store, dataset, master) {
  const state = { ...store.state };
  const now = dataset?.generatedAt || new Date().toISOString();
  const live = evaluateAlerts(store.rules, dataset?.taxpayers || [], { master });
  const liveKeys = new Set(live.map((a) => a.key));
  let changed = false;
  const alerts = live.map((a) => {
    let s = state[a.key];
    if (!s || s.status === 'resolved') { s = { firstSeen: now, status: 'open' }; state[a.key] = s; changed = true; }
    return { ...a, ...s };
  });
  for (const [key, s] of Object.entries(state)) {
    if (!liveKeys.has(key) && s.status !== 'resolved') { state[key] = { ...s, status: 'resolved', resolvedAt: now }; changed = true; }
  }
  const resolved = Object.entries(state).filter(([, s]) => s.status === 'resolved').map(([key, s]) => ({ key, ...s })).sort((x, y) => (x.resolvedAt < y.resolvedAt ? 1 : -1)).slice(0, 50);
  return { store: { ...store, state }, changed, alerts, resolved, generatedAt: now };
}

export default function alertStore() {
  return {
    name: 'alert-store',
    configureServer(server) {
      const root = server.config.root;
      const dir = process.env.STORE_DIR ? path.resolve(process.env.STORE_DIR) : path.join(root, 'store');
      const file = path.join(dir, 'alerts.json');
      const outFile = process.env.OUT_FILE ? path.resolve(process.env.OUT_FILE) : path.join(root, 'public', 'data.json');
      const regDir = process.env.REGISTER_DIR ? path.resolve(process.env.REGISTER_DIR) : path.join(root, 'data', 'registers');
      const local = (req) => process.env.GST_ALLOW_REMOTE === '1' || ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      const json = (res, code, body) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(body)); };
      const save = (s) => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(file, JSON.stringify(s, null, 1)); };
      const body = (req) => new Promise((resolve, reject) => {
        let size = 0; const chunks = [];
        req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(new Error('Request too large')); req.destroy(); } else chunks.push(c); });
        req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new Error('Not JSON')); } });
      });
      // the analysis runs to megabytes: parsed once per rebuild
      let cache = null; // { mtimeMs, dataset }
      const dataset = () => {
        try { const { mtimeMs } = fs.statSync(outFile); if (!cache || cache.mtimeMs !== mtimeMs) cache = { mtimeMs, dataset: JSON.parse(fs.readFileSync(outFile, 'utf8')) }; return cache.dataset; } catch { return null; }
      };
      const master = () => { try { return JSON.parse(fs.readFileSync(path.join(regDir, 'master.json'), 'utf8')).records || []; } catch { return []; } };

      server.middlewares.use('/__alerts', async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://x');
        const route = url.pathname.replace(/\/+$/, '') || '/';
        try {
          if (req.method === 'GET' && route === '/') {
            const q = buildQueue(readAlertStore(file), dataset(), master());
            if (q.changed) save(q.store);
            const user = String(url.searchParams.get('user') || '').slice(0, 120);
            return json(res, 200, { rules: q.store.rules, alerts: q.alerts, resolved: q.resolved, generatedAt: q.generatedAt, lastSeen: user ? q.store.seen[user] || null : null });
          }
          if (req.method === 'PUT' && route === '/rules') {
            if (!local(req)) return json(res, 403, { ok: false, error: 'Changing alert rules is allowed from this computer only' });
            const { rules } = await body(req);
            if (!Array.isArray(rules) || rules.length > 100) return json(res, 400, { ok: false, errors: ['rules must be a list (at most 100)'] });
            const errors = rules.flatMap((r, i) => validateRule(r).map((e) => `Rule ${i + 1}${r?.name ? ` (${r.name})` : ''}: ${e}`));
            if (new Set(rules.map((r) => r.id)).size !== rules.length) errors.push('Two rules share an id');
            if (errors.length) return json(res, 400, { ok: false, errors });
            const s = readAlertStore(file);
            save({ ...s, rules: rules.map((r) => ({ id: r.id, name: String(r.name).trim(), enabled: !!r.enabled, priority: r.priority, when: r.when, ...(r.jurisdiction ? { jurisdiction: String(r.jurisdiction).trim() } : {}) })) });
            return json(res, 200, { ok: true });
          }
          if (req.method === 'POST' && route === '/action') {
            if (!local(req)) return json(res, 403, { ok: false, error: 'Recording alert actions is allowed from this computer only' });
            const { key, action, note, by } = await body(req);
            const s = readAlertStore(file);
            if (!s.state[key]) return json(res, 404, { ok: false, error: 'No such alert' });
            if (!['acknowledge', 'dismiss', 'reopen'].includes(action)) return json(res, 400, { ok: false, error: 'action must be acknowledge, dismiss or reopen' });
            if (action === 'dismiss' && !String(note || '').trim()) return json(res, 400, { ok: false, error: 'Dismissing an alert needs a reason' });
            const status = { acknowledge: 'acknowledged', dismiss: 'dismissed', reopen: 'open' }[action];
            s.state[key] = { ...s.state[key], status, at: new Date().toISOString(), by: String(by || '').slice(0, 120), ...(note ? { note: String(note).slice(0, 1000) } : {}) };
            save(s);
            return json(res, 200, { ok: true, alert: { key, ...s.state[key] } });
          }
          if (req.method === 'POST' && route === '/seen') {
            const { user } = await body(req);
            if (!String(user || '').trim()) return json(res, 400, { ok: false, error: 'user is required' });
            const s = readAlertStore(file);
            s.seen = { ...s.seen, [String(user).slice(0, 120)]: new Date().toISOString() };
            save(s);
            return json(res, 200, { ok: true });
          }
          return next();
        } catch (e) {
          return json(res, 400, { ok: false, error: e.message });
        }
      });
    },
  };
}
