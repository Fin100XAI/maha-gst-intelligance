// Server plugin: officer accounts and the access check on every request. Registered before every other plugin.
//
//   AUTH_MODE=open (default)   no accounts; GET /__auth/me says so and nothing else changes.
//   AUTH_MODE=accounts         every service call and the analysis need a signed-in officer, and each officer is
//                              sent only their jurisdictions' taxpayers (scripts/lib/scope.mjs).
//
//   GET   /__auth/me                 { mode, account }
//   POST  /__auth/login              { email, password }        sets the session cookie
//   POST  /__auth/logout
//   POST  /__auth/password           { current, next }          the officer's own change (also ends a temporary one)
//   GET   /__auth/accounts           accounts, and the jurisdictions in the taxpayer master    ('accounts' permission)
//   POST  /__auth/accounts           { email, name, designation, role, jurisdictions } -> the account and a one-time
//                                    temporary password
//   PATCH /__auth/accounts/<id>      { name?, designation?, role?, jurisdictions?, active?, resetPassword? }
//
// The session is an HttpOnly, SameSite=Strict cookie holding a signed token (scripts/lib/accounts.mjs), so other
// sites cannot make requests with it. The first account is made on the server: npm run accounts -- add ...
import fs from 'node:fs';
import path from 'node:path';
import { openAccounts, sessionSecret, issueToken, readToken, verifyPassword, hashPassword, throttle, publicAccount, SESSION_HOURS } from './lib/accounts.mjs';
import { scopeFor } from './lib/scope.mjs';
import { ROLES, ALL, coversAll } from '../src/lib/access.js';

const COOKIE = 'gst_session';
const MAX_BODY = 64 * 1024;
const DUMMY_HASH = hashPassword('timing-equaliser-for-unknown-accounts'); // unknown emails take as long as wrong passwords

const json = (res, code, body) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise((resolve, reject) => {
  let size = 0; const chunks = [];
  req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(Object.assign(new Error('Request too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
  req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(Object.assign(new Error('Not JSON'), { status: 400 })); } });
});
const cookieOf = (req) => (String(req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`)) || '').slice(COOKIE.length + 1);
const secure = (req) => process.env.COOKIE_SECURE === '1' || req.headers['x-forwarded-proto'] === 'https' || !!req.socket?.encrypted;
const setCookie = (req, res, token) => res.setHeader('set-cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token ? SESSION_HOURS * 3600 : 0}${secure(req) ? '; Secure' : ''}`);
const addressOf = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();

/** Paths that need a signed-in officer in accounts mode: every service, the analysis and saved reports. */
export const isProtected = (url) => url.startsWith('/__') || url === '/data.json' || url === '/reports' || url.startsWith('/reports/');

/** Whether `actor` may give `target` this role and these jurisdictions: never more than the actor has. */
export function mayGrant(actor, target) {
  if (coversAll(actor.jurisdictions)) return null;
  if (coversAll(target.jurisdictions)) return 'only an officer covering all jurisdictions can grant all jurisdictions';
  const outside = target.jurisdictions.filter((j) => !actor.jurisdictions.includes(j));
  if (outside.length) return `you cannot grant jurisdictions outside your own (${outside.join(', ')})`;
  return null;
}

export default function auth() {
  return {
    name: 'auth',
    configureServer(server) {
      const mode = process.env.AUTH_MODE === 'accounts' ? 'accounts' : 'open';
      const root = server.config.root;
      const dir = process.env.STORE_DIR ? path.resolve(process.env.STORE_DIR) : path.join(root, 'store');
      const regDir = process.env.REGISTER_DIR ? path.resolve(process.env.REGISTER_DIR) : path.join(root, 'data', 'registers');
      const accounts = mode === 'accounts' ? openAccounts(dir) : null;
      const secret = mode === 'accounts' ? sessionSecret(dir) : null;
      const tries = throttle();
      if (mode === 'accounts' && !accounts.list().some((a) => a.active)) console.warn('[auth] AUTH_MODE=accounts but no active account: create one with  npm run accounts -- add --email ... --role commissioner --jurisdictions "*"');

      // the taxpayer master decides jurisdictions: read once per change
      let master = { mtimeMs: -1, records: [] };
      const masterRecords = () => {
        const file = path.join(regDir, 'master.json');
        const m = fs.existsSync(file) ? fs.statSync(file).mtimeMs : 0;
        if (m !== master.mtimeMs) { try { master = { mtimeMs: m, records: m ? JSON.parse(fs.readFileSync(file, 'utf8')).records || [] : [] }; } catch { master = { mtimeMs: m, records: [] }; } }
        return master.records;
      };
      const accessFor = (account) => {
        const scope = scopeFor(account, masterRecords());
        const perms = ROLES[account.role]?.perms || [];
        return { mode, account, scope, all: scope.all, can: (p) => perms.includes(p), inScope: (g) => scope.all || scope.gstins.has(g) };
      };
      const current = (req) => {
        const claims = readToken(cookieOf(req), secret);
        const a = claims && accounts.byId(claims.sub);
        return a && a.active && (a.tokenVersion || 0) === claims.v ? a : null;
      };

      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || '/').split('?')[0];
        if (url.startsWith('/__auth/')) {
          try { return await authRoute(req, res, url.slice('/__auth'.length)); } catch (e) { return json(res, e.status || 500, { ok: false, error: e.message }); }
        }
        if (mode === 'open') return next();
        const account = current(req);
        if (account) req.access = accessFor(account);
        if (!isProtected(url)) return next();
        if (!account) return json(res, 401, { ok: false, error: 'Sign in first', signIn: true });
        if (account.mustChange) return json(res, 403, { ok: false, error: 'Change your temporary password first', mustChange: true });
        return next();
      });

      async function authRoute(req, res, route) {
        if (route === '/me' && req.method === 'GET') {
          const a = mode === 'accounts' ? current(req) : null;
          return json(res, 200, { ok: true, mode, account: publicAccount(a), roles: ROLES });
        }
        if (mode !== 'accounts') return json(res, 404, { ok: false, error: 'Accounts are not switched on (AUTH_MODE=accounts)' });

        if (route === '/login' && req.method === 'POST') {
          const { email = '', password = '' } = await readBody(req);
          const key = String(email).trim().toLowerCase().slice(0, 160);
          const ip = addressOf(req);
          const wait = Math.max(tries.lockedFor(`e:${key}`), tries.lockedFor(`a:${ip}`));
          if (wait) return json(res, 429, { ok: false, error: `Too many attempts. Try again in ${Math.ceil(wait / 60000)} minute(s).` });
          const a = accounts.byEmail(key);
          const ok = verifyPassword(String(password), a?.passwordHash || DUMMY_HASH) && !!a?.active;
          if (!ok) {
            tries.fail(`e:${key}`); tries.fail(`a:${ip}`);
            accounts.audit({ action: 'sign-in-failed', target: key, ip });
            return json(res, 401, { ok: false, error: 'Email or password is incorrect, or the account is not active' });
          }
          tries.clear(`e:${key}`);
          accounts.signedIn(a.id);
          accounts.audit({ action: 'sign-in', by: a.email, ip });
          setCookie(req, res, issueToken(a, secret));
          return json(res, 200, { ok: true, account: publicAccount(a) });
        }
        if (route === '/logout' && req.method === 'POST') {
          const a = current(req);
          if (a) accounts.audit({ action: 'sign-out', by: a.email });
          setCookie(req, res, '');
          return json(res, 200, { ok: true });
        }
        const me = current(req);
        if (!me) return json(res, 401, { ok: false, error: 'Sign in first', signIn: true });
        if (route === '/password' && req.method === 'POST') {
          const { current: cur, next } = await readBody(req);
          const updated = accounts.changePassword(me.id, String(cur || ''), next);
          setCookie(req, res, issueToken(updated, secret)); // the new token version ends every other session
          return json(res, 200, { ok: true, account: publicAccount(updated) });
        }
        if (me.mustChange) return json(res, 403, { ok: false, error: 'Change your temporary password first', mustChange: true });
        if (!(ROLES[me.role]?.perms || []).includes('accounts')) return json(res, 403, { ok: false, error: 'Managing accounts needs the accounts permission' });

        if (route === '/accounts' && req.method === 'GET') {
          const counts = {};
          for (const r of masterRecords()) counts[r.jurisdiction] = (counts[r.jurisdiction] || 0) + 1;
          const visible = accounts.list().filter((a) => coversAll(me.jurisdictions) || a.jurisdictions.every((j) => me.jurisdictions.includes(j)));
          return json(res, 200, { ok: true, accounts: visible.map(publicAccount), jurisdictions: Object.entries(counts).map(([name, taxpayers]) => ({ name, taxpayers })).sort((x, y) => x.name.localeCompare(y.name)), roles: ROLES, all: ALL });
        }
        if (route === '/accounts' && req.method === 'POST') {
          const input = await readBody(req);
          const why = mayGrant(me, { jurisdictions: Array.isArray(input.jurisdictions) ? input.jurisdictions : [] });
          if (why) return json(res, 403, { ok: false, error: why });
          const { account, password } = accounts.create({ ...input, password: undefined }, { by: me.email });
          return json(res, 200, { ok: true, account: publicAccount(account), password });
        }
        const m = route.match(/^\/accounts\/([\w-]{8,64})$/);
        if (m && req.method === 'PATCH') {
          const patch = await readBody(req);
          const target = accounts.byId(m[1]);
          if (!target) return json(res, 404, { ok: false, error: 'no such account' });
          const why = mayGrant(me, target) || (patch.jurisdictions && mayGrant(me, { jurisdictions: patch.jurisdictions }));
          if (why) return json(res, 403, { ok: false, error: why });
          if (target.id === me.id && (patch.active === false || (patch.role && !(ROLES[patch.role]?.perms || []).includes('accounts')))) return json(res, 400, { ok: false, error: 'You cannot deactivate your own account or remove your own accounts permission' });
          const { account, password } = accounts.update(target.id, { name: patch.name, designation: patch.designation, role: patch.role, jurisdictions: patch.jurisdictions, active: patch.active, resetPassword: !!patch.resetPassword }, { by: me.email });
          return json(res, 200, { ok: true, account: publicAccount(account), ...(password ? { password } : {}) });
        }
        return json(res, 404, { ok: false, error: 'Not found' });
      }
    },
  };
}
