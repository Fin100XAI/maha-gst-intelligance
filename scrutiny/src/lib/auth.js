// The browser side of officer accounts (server: scripts/auth.js). The session lives in an HttpOnly cookie the page
// cannot read; these calls only ask the server who is signed in, and sign in or out.
import { api } from './api.js';

const call = async (path, { method = 'GET', body } = {}) => {
  const r = await fetch(api(path), { method, cache: 'no-store', credentials: 'same-origin', headers: body ? { 'content-type': 'application/json' } : {}, body: body && JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok && j.ok !== false, status: r.status, ...j };
};

/** @returns {Promise<{ mode: 'open'|'accounts', account: object|null }>} open when there is no server (static hosting) */
export async function authStatus() {
  try {
    const r = await call('/__auth/me');
    return r.ok && r.mode ? { mode: r.mode, account: r.account || null } : { mode: 'open', account: null };
  } catch { return { mode: 'open', account: null }; }
}

export const signIn = (email, password) => call('/__auth/login', { method: 'POST', body: { email, password } });
export const signOut = () => call('/__auth/logout', { method: 'POST' }).catch(() => ({ ok: false }));
export const changePassword = (current, next) => call('/__auth/password', { method: 'POST', body: { current, next } });

export const listAccounts = () => call('/__auth/accounts');
export const createAccount = (a) => call('/__auth/accounts', { method: 'POST', body: a });
export const updateAccount = (id, patch) => call(`/__auth/accounts/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch });
