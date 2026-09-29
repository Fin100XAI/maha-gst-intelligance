// Server plugin: the shared case record.
//   GET  /__cases          { cases, notices, seq }   current state, replayed from the event log
//   POST /__cases/events   { events: [...] }         validated, appended to store/events.jsonl, applied
// Local only (like report saving) unless GST_ALLOW_REMOTE=1. There is no login yet, so "by" is the name the
// officer signed in with in the browser; the log records it together with the server's receive time.
import path from 'node:path';
import { openCaseLog } from './lib/caseLog.mjs';

const MAX_BYTES = 2 * 1024 * 1024;

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
        let body = '';
        req.on('data', (c) => { body += c; if (body.length > MAX_BYTES) req.destroy(); });
        req.on('end', () => {
          try {
            const { events } = JSON.parse(body || '{}');
            const { seq } = log.append(events);
            json(res, 200, { ok: true, seq });
          } catch (e) {
            json(res, e.status || 400, { ok: false, error: e.message });
          }
        });
      });
      // The audit trail as stored, newest first, with the hash-chain check made when the log was opened.
      server.middlewares.use('/__cases/log', (req, res, next) => {
        if (req.method !== 'GET') return next();
        if (!local(req)) return json(res, 403, { ok: false, error: 'The audit log is available from this computer only' });
        const limit = Math.min(2000, Number(new URL(req.url || '/', 'http://x').searchParams.get('limit')) || 500);
        json(res, 200, { ok: true, chain: log.chain, problems: log.problems, seq: log.seq, events: log.events({ limit }) });
      });
      server.middlewares.use('/__cases', (req, res, next) => {
        if (req.method !== 'GET' || (req.url && req.url !== '/' && !req.url.startsWith('/?'))) return next();
        json(res, 200, { ...log.state, seq: log.seq });
      });
    },
  };
}
