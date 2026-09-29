// Server plugin: what produced the numbers, and how fresh the inputs are.
//   GET /__governance   SHA-256 fingerprints of the analytical code and the rule matrix, the dataset build time, the
//                       registers as stored (file, rows, upload time, hash) and the stored reply documents.
// Fingerprints are taken at request time, so they describe the code actually running. Local only.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

export function fingerprints(root) {
  const list = (dir, re) => (fs.existsSync(path.join(root, dir)) ? fs.readdirSync(path.join(root, dir)).filter((f) => re.test(f)).map((f) => path.join(dir, f)) : []);
  const files = [...list('src/engine', /\.js$/), 'src/lib/caseEvents.js', ...list('scripts/lib', /\.mjs$/), ...list('data', /rule_matrix.*\.xlsx$/i)];
  return files.filter((f) => fs.existsSync(path.join(root, f))).map((f) => { const st = fs.statSync(path.join(root, f)); return { file: f.split(path.sep).join('/'), sha256: sha(path.join(root, f)), bytes: st.size, modified: st.mtime.toISOString() }; });
}

export default function governance() {
  return {
    name: 'governance',
    configureServer(server) {
      const root = server.config.root;
      const local = (req) => process.env.GST_ALLOW_REMOTE === '1' || ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      server.middlewares.use('/__governance', (req, res, next) => {
        if (req.method !== 'GET') return next();
        const json = (code, body) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(body)); };
        if (!local(req)) return json(403, { ok: false, error: 'Available from this computer only' });
        try {
          const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(root, 'data');
          const regDir = path.join(dataDir, 'registers');
          const registers = fs.existsSync(regDir) ? fs.readdirSync(regDir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(regDir, f), 'utf8')).meta) : [];
          const outFile = process.env.OUT_FILE ? path.resolve(process.env.OUT_FILE) : path.join(root, 'public', 'data.json');
          const docsDir = path.join(process.env.STORE_DIR ? path.resolve(process.env.STORE_DIR) : path.join(root, 'store'), 'docs');
          const docs = fs.existsSync(docsDir) ? fs.readdirSync(docsDir).filter((f) => f.endsWith('.json')).length : 0;
          json(200, { ok: true, at: new Date().toISOString(), code: fingerprints(root), dataset: fs.existsSync(outFile) ? { sha256: sha(outFile), bytes: fs.statSync(outFile).size, built: fs.statSync(outFile).mtime.toISOString() } : null, registers, docs });
        } catch (e) { json(500, { ok: false, error: e.message }); }
      });
    },
  };
}
