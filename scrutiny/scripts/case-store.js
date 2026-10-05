// Server plugin: the shared case record.
//   GET  /__cases          { cases, notices, seq }   current state, replayed from the event log
//   POST /__cases/events   { events: [...] }         validated, appended to store/events.jsonl, applied
// Local only (like report saving) unless GST_ALLOW_REMOTE=1.
// Who did it: with accounts (AUTH_MODE=accounts) every event is stamped here with the signed-in account (by, byId),
// whatever the browser sent, and an officer can read and change only the cases of their jurisdictions. Without
// accounts, "by" is the name typed at sign-in, recorded as given together with the server's receive time.
import path from 'node:path';
import { openCaseLog } from './lib/caseLog.mjs';
import { accessOf, forbid } from './lib/request-access.mjs';

const MAX_BYTES = 2 * 1024 * 1024;

/** Cases and notices limited to what the officer may see. */
export const scopeCases = (state, inScope) => ({
  cases: Object.fromEntries(Object.entries(state.cases).filter(([id]) => inScope(id))),
  notices: Object.fromEntries(Object.entries(state.notices).filter(([id]) => inScope(id))),
});

/** @returns {string|null} why this officer may not record these events */
export function refuseEvents(acc, events) {
  if (acc.mode !== 'accounts') return null;
  for (const ev of events) {
    if (ev?.type === 'import') return 'Importing browser records is not available with accounts';
    if (!acc.inScope(ev?.caseId)) return `${String(ev?.caseId).slice(0, 20)} is outside your jurisdiction`;
    if (ev?.type === 'approval-decide' ? !acc.can('approve') : !acc.can('work')) return ev?.type === 'approval-decide' ? 'Approving needs the approve permission (supervisor or above)' : 'Your role does not include case work';
  }
  return null;
}

export default function caseStore() {
  return {
    name: 'case-store',
    configureServer(server) {
      const dir = process.env.STORE_DIR ? path.resolve(process.env.STORE_DIR) : path.join(server.config.root, 'store');
      const log = openCaseLog(dir);
      for (const p of log.problems) console.warn(`[case-store] ${p}`);
      const local = (req) => process.env.GST_ALLOW_REMOTE === '1' || ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      const json = (res, code, body) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(body)); };

      server.middlewares.use('/__cases/events', (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        if (!local(req)) return json(res, 403, { ok: false, error: 'Case changes are allowed from this computer only' });
        const acc = accessOf(req);
        let body = '';
        req.on('data', (c) => { body += c; if (body.length > MAX_BYTES) req.destroy(); });
        req.on('end', () => {
          try {
            let { events } = JSON.parse(body || '{}');
            if (!Array.isArray(events)) throw Object.assign(new Error('events must be a list'), { status: 400 });
            const refused = refuseEvents(acc, events);
            if (refused) return forbid(res, refused);
            if (acc.account) events = events.map((ev) => ({ ...ev, by: acc.account.name, byId: acc.account.id }));
            const { seq } = log.append(events);
            return json(res, 200, { ok: true, seq });
          } catch (e) {
            return json(res, e.status || 400, { ok: false, error: e.message });
          }
        });
      });
      // The audit trail as stored, newest first, with the hash-chain check made when the log was opened.
      server.middlewares.use('/__cases/log', (req, res, next) => {
        if (req.method !== 'GET') return next();
        if (!local(req)) return json(res, 403, { ok: false, error: 'The audit log is available from this computer only' });
        const acc = accessOf(req);
        const limit = Math.min(2000, Number(new URL(req.url || '/', 'http://x').searchParams.get('limit')) || 500);
        const events = acc.all ? log.events({ limit }) : log.events({ limit: 100000 }).filter((ev) => ev.caseId && acc.inScope(ev.caseId)).slice(0, limit);
        return json(res, 200, { ok: true, chain: log.chain, problems: log.problems, seq: log.seq, events });
      });
      server.middlewares.use('/__cases', (req, res, next) => {
        if (req.method !== 'GET' || (req.url && req.url !== '/' && !req.url.startsWith('/?'))) return next();
        const acc = accessOf(req);
        return json(res, 200, { ...(acc.all ? log.state : scopeCases(log.state, acc.inScope)), seq: log.seq });
      });
    },
  };
}
