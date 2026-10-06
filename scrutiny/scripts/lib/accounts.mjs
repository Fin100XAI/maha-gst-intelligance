// Officer accounts (AUTH_MODE=accounts): password hashing, the account file, signed session tokens, sign-in
// throttling and the access log. Node only; the rules on roles and jurisdictions are in src/lib/access.js.
//
// Storage, all under STORE_DIR (store/ by default, never committed):
//   accounts.json       the accounts; passwords only as scrypt hashes. Written whole, atomically.
//   access-log.jsonl    append-only: sign-ins (and failures), sign-outs, account and password changes. No secrets.
//   session.key         the key that signs session tokens, made on first use (or SESSION_SECRET in the environment).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROLES, validateAccount, passwordProblem } from '../../src/lib/access.js';

// ------------------------------------------------------------------ passwords
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt:${SCRYPT.N}:${SCRYPT.r}:${SCRYPT.p}:${salt.toString('base64')}:${hash.toString('base64')}`;
}

export function verifyPassword(pw, stored) {
  const [kind, N, r, p, salt, hash] = String(stored || '').split(':');
  if (kind !== 'scrypt' || !salt || !hash || typeof pw !== 'string') return false;
  const want = Buffer.from(hash, 'base64');
  const got = crypto.scryptSync(pw, Buffer.from(salt, 'base64'), want.length, { N: Number(N), r: Number(r), p: Number(p) });
  return crypto.timingSafeEqual(want, got);
}

// Unambiguous letters and digits (no 0/O, 1/l/I), grouped for reading aloud or copying.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function temporaryPassword() {
  const bytes = crypto.randomBytes(15);
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('');
  return `${chars.slice(0, 5)}-${chars.slice(5, 10)}-${chars.slice(10)}`;
}

// ------------------------------------------------------------------ session tokens
const b64url = (buf) => Buffer.from(buf).toString('base64url');
export const SESSION_HOURS = 12;

/** A token is the account id, its token version and an expiry, signed with HMAC-SHA256. */
export function issueToken(account, secret, now = Date.now(), hours = SESSION_HOURS) {
  const body = b64url(JSON.stringify({ sub: account.id, v: account.tokenVersion || 0, exp: now + hours * 3600000 }));
  return `${body}.${b64url(crypto.createHmac('sha256', secret).update(body).digest())}`;
}

/** @returns {{ sub: string, v: number, exp: number } | null} the token's claims, if it is genuine and unexpired */
export function readToken(token, secret, now = Date.now()) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const want = crypto.createHmac('sha256', secret).update(body).digest();
  const got = Buffer.from(sig, 'base64url');
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return claims && typeof claims.sub === 'string' && Number(claims.exp) > now ? claims : null;
  } catch { return null; }
}

export function sessionSecret(dir) {
  if (process.env.SESSION_SECRET) {
    if (process.env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
    return process.env.SESSION_SECRET;
  }
  const file = path.join(dir, 'session.key');
  if (!fs.existsSync(file)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, crypto.randomBytes(48).toString('base64'), { mode: 0o600, flag: 'wx' });
  }
  return fs.readFileSync(file, 'utf8').trim();
}

// ------------------------------------------------------------------ sign-in throttling
/** Failed sign-ins per key (email, and separately address): after `max` failures, locked for `lockMs`. In memory. */
export function throttle({ max = 5, lockMs = 5 * 60000 } = {}) {
  const seen = new Map(); // key -> { fails, until }
  return {
    lockedFor(key, now = Date.now()) { const s = seen.get(key); return s && s.until > now ? s.until - now : 0; },
    fail(key, now = Date.now()) {
      const s = seen.get(key) || { fails: 0, until: 0 };
      s.fails += 1;
      if (s.fails >= max) { s.until = now + lockMs; s.fails = 0; }
      seen.set(key, s);
      if (seen.size > 10000) seen.delete(seen.keys().next().value); // bounded
    },
    clear(key) { seen.delete(key); },
  };
}

// ------------------------------------------------------------------ the account file
const norm = (email) => String(email || '').trim().toLowerCase();
const clean = (a) => ({
  email: norm(a.email), name: String(a.name || '').trim(), designation: String(a.designation || '').trim(),
  role: a.role, jurisdictions: [...new Set((a.jurisdictions || []).map((j) => String(j).trim()).filter(Boolean))],
});
/** An account as it may leave the server: never the password hash. */
export const publicAccount = (a) => a && ({
  id: a.id, email: a.email, name: a.name, designation: a.designation, role: a.role, roleLabel: ROLES[a.role]?.label,
  jurisdictions: a.jurisdictions, active: a.active, mustChange: !!a.mustChange,
  createdAt: a.createdAt, createdBy: a.createdBy, updatedAt: a.updatedAt, lastSignIn: a.lastSignIn || null,
});
const fail = (status, message) => Object.assign(new Error(message), { status });

export function openAccounts(dir) {
  const file = path.join(dir, 'accounts.json');
  const logFile = path.join(dir, 'access-log.jsonl');
  const read = () => { try { const j = JSON.parse(fs.readFileSync(file, 'utf8')); return Array.isArray(j.accounts) ? j.accounts : []; } catch { return []; } };
  let accounts = read();
  let mtime = fs.existsSync(file) ? fs.statSync(file).mtimeMs : 0;
  // the command-line tool may change the file while the server runs: re-read it when it changes
  const fresh = () => { const m = fs.existsSync(file) ? fs.statSync(file).mtimeMs : 0; if (m !== mtime) { accounts = read(); mtime = m; } return accounts; };
  const write = (next) => {
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ accounts: next }, null, 1), { mode: 0o600 });
    fs.renameSync(tmp, file);
    accounts = next;
    mtime = fs.statSync(file).mtimeMs;
  };
  const audit = (entry, now = new Date()) => {
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(logFile, `${JSON.stringify({ at: now.toISOString(), ...entry })}\n`);
  };

  return {
    file, audit,
    list: () => fresh(),
    byId: (id) => fresh().find((a) => a.id === id) || null,
    byEmail: (email) => fresh().find((a) => a.email === norm(email)) || null,

    /** @returns {{ account: object, password: string }} the new account and its one-time temporary password */
    create(input, { by = 'system', now = new Date() } = {}) {
      const a = clean(input);
      const errors = validateAccount(a);
      if (errors.length) throw fail(400, errors.join('; '));
      if (fresh().some((x) => x.email === a.email)) throw fail(409, `an account for ${a.email} already exists`);
      const password = input.password ?? temporaryPassword();
      if (input.password) { const why = passwordProblem(password, a); if (why) throw fail(400, `password: ${why}`); }
      const account = { id: crypto.randomUUID(), ...a, active: true, mustChange: !input.password, tokenVersion: 0, passwordHash: hashPassword(password), createdAt: now.toISOString(), createdBy: by, updatedAt: now.toISOString() };
      write([...fresh(), account]);
      audit({ action: 'account-create', by, target: a.email, detail: { role: a.role, jurisdictions: a.jurisdictions } }, now);
      return { account, password };
    },

    /** Change details, role, jurisdictions or status; resetPassword issues a new temporary password. */
    update(id, patch, { by = 'system', now = new Date() } = {}) {
      const all = fresh();
      const cur = all.find((x) => x.id === id);
      if (!cur) throw fail(404, 'no such account');
      const given = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)); // absent = unchanged
      const next = { ...cur, ...clean({ ...cur, ...given, email: cur.email }) };
      const errors = validateAccount(next);
      if (errors.length) throw fail(400, errors.join('; '));
      if (given.active !== undefined) next.active = !!given.active;
      let password = null;
      if (given.resetPassword) { password = temporaryPassword(); next.passwordHash = hashPassword(password); next.mustChange = true; }
      // anything that changes what the account may see or do ends its open sessions
      if (password || next.active !== cur.active || next.role !== cur.role || next.jurisdictions.join('|') !== cur.jurisdictions.join('|')) next.tokenVersion = (cur.tokenVersion || 0) + 1;
      next.updatedAt = now.toISOString();
      write(all.map((x) => (x.id === id ? next : x)));
      const changed = ['name', 'designation', 'role', 'jurisdictions', 'active'].filter((k) => JSON.stringify(next[k]) !== JSON.stringify(cur[k]));
      audit({ action: password ? 'password-reset' : 'account-update', by, target: cur.email, detail: { changed } }, now);
      return { account: next, password };
    },

    /** The officer's own change: the current password must be right; ends their other sessions. */
    changePassword(id, current, next, { now = new Date() } = {}) {
      const all = fresh();
      const cur = all.find((x) => x.id === id);
      if (!cur) throw fail(404, 'no such account');
      if (!verifyPassword(current, cur.passwordHash)) throw fail(403, 'the current password is not correct');
      const why = passwordProblem(next, cur);
      if (why) throw fail(400, `new password: ${why}`);
      if (verifyPassword(next, cur.passwordHash)) throw fail(400, 'new password: choose one different from the current password');
      const updated = { ...cur, passwordHash: hashPassword(next), mustChange: false, tokenVersion: (cur.tokenVersion || 0) + 1, updatedAt: now.toISOString() };
      write(all.map((x) => (x.id === id ? updated : x)));
      audit({ action: 'password-change', by: cur.email, target: cur.email }, now);
      return updated;
    },

    signedIn(id, now = new Date()) {
      write(fresh().map((x) => (x.id === id ? { ...x, lastSignIn: now.toISOString() } : x)));
    },
  };
}
