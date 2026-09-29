import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { SiteHeader } from '../components/SiteHeader.jsx';
import { sha256Hex } from '../lib/sha256.js';
import { ADMINS } from '../lib/officer.js';

// Workspace access password is checked against its SHA-256 hash (the plain password is not in the code).
// Client-side gate for a local POC — not a substitute for server-side authentication.
const PASSWORD_SHA256 = '7c76c5098ee1e9774f318c95c1d3f285c263db1a41afa8c15569b9fd6334812b';
const MAX_TRIES = 5;
const LOCK_MS = 30000;

export default function Login({ onLogin, stats, go }) {
  const [admin, setAdmin] = useState('state');
  const [workspace, setWorkspace] = useState('ward-27');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [tries, setTries] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [checking, setChecking] = useState(false);
  const locked = lockedUntil > now;
  useEffect(() => { if (!locked) return undefined; const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, [locked]);

  const submit = async (e) => {
    e?.preventDefault();
    if (locked) return;
    if (!workspace.trim()) return setError('Enter your jurisdiction workspace.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError('Enter a valid official email.');
    if (!password) return setError('Enter the workspace password.');
    setChecking(true);
    const ok = (await sha256Hex(password)) === PASSWORD_SHA256;
    setChecking(false);
    if (!ok) {
      const n = tries + 1;
      setTries(n);
      setPassword('');
      if (n >= MAX_TRIES) { setLockedUntil(Date.now() + LOCK_MS); setNow(Date.now()); setTries(0); return setError(`Too many incorrect attempts. Sign-in is locked for ${LOCK_MS / 1000} seconds.`); }
      return setError(`Incorrect password. ${MAX_TRIES - n} attempt${MAX_TRIES - n === 1 ? '' : 's'} left.`);
    }
    const local = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
    const parts = local.split(' ').filter(Boolean);
    const name = parts.length ? `${parts[0][0].toUpperCase()}${parts[0].slice(1)}${parts[1] ? ` ${parts[1][0].toUpperCase()}.` : ''}` : 'Officer';
    onLogin({ name, email, admin, role: ADMINS[admin].role, workspace: workspace.trim().toLowerCase(), since: new Date().toISOString() });
  };

  return (
    <div className="login-bg">
      <SiteHeader view="login" go={go} />
      <div className="login">
        <div className="login-left">
          <div className="lp-eyebrow left" style={{ color: '#e9c84a' }}>GST Intelligence</div>
          <h2>Every return in your jurisdiction, reconciled in <em>one console.</em></h2>
          <p>GSTR-1, 3B, 2A/2B and electronic ledgers matched period by period, tested against the scrutiny rule matrix, with evidence for every finding.</p>
          <div className="perk"><span className="ok"><Icon name="check" size={16} stroke={2.6} /></span>{stats.rules}-rule matrix with line-level evidence</div>
          <div className="perk"><span className="ok"><Icon name="check" size={16} stroke={2.6} /></span>Deterministic or AI key insights: your choice</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <button className="btn small" onClick={() => go('guide')}>Read the guide</button>
            <button className="btn small" onClick={() => go('howto')}>How to</button>
            <button className="btn small" onClick={() => go('catalog')}>All {stats.rules} rules</button>
          </div>
          <div className="foot">Engine · {stats.taxpayers} taxpayers loaded · FY {stats.fy} · runs locally</div>
        </div>

        <div className="login-right">
          <form className="login-form" onSubmit={submit} noValidate>
            <div>
              <div className="lp-eyebrow left">Authorised officers only</div>
              <h1 style={{ marginTop: 8 }}>Sign in</h1>
              <div className="lead">Choose your administration, then enter your jurisdiction, official email and the workspace password.</div>
            </div>
            <div className="field">
              <label id="adm-l">Administration</label>
              <div className="seg adm-seg" role="radiogroup" aria-labelledby="adm-l">
                {Object.entries(ADMINS).map(([k, v]) => (
                  <button key={k} type="button" role="radio" aria-checked={admin === k} className={admin === k ? 'on' : ''} onClick={() => setAdmin(k)}>{v.label}</button>
                ))}
              </div>
              <div className="adm-hint">You sign in as <b>{ADMINS[admin].role}</b>. This title appears on notices and reports.</div>
            </div>
            <div className="field">
              <label htmlFor="ws">Jurisdiction</label>
              <div className="suffix-input">
                <input id="ws" className="mono-in" value={workspace} onChange={(e) => setWorkspace(e.target.value)} autoComplete="organization" />
                <span>.scrutiny.local</span>
              </div>
            </div>
            <div className="field">
              <label htmlFor="em">Official email</label>
              <input id="em" type="email" placeholder="name@department.example" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </div>
            <div className="field">
              <label htmlFor="pw" style={{ justifyContent: 'space-between' }}>Password <a href="#forgot" onClick={(e) => { e.preventDefault(); setError('Ask your system administrator for the workspace password.'); }}>Forgot?</a></label>
              <div className="suffix-input">
                <input id="pw" type={show ? 'text' : 'password'} placeholder="Workspace password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" disabled={locked} />
                <button type="button" className="btn ghost small" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }} onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            {error && <div className="err" role="alert">{locked ? `Too many incorrect attempts. Try again in ${Math.ceil((lockedUntil - now) / 1000)} s.` : error}</div>}
            <button className="btn primary big lp-btn" type="submit" disabled={locked || checking}>{checking ? 'Checking…' : 'Enter scrutiny workspace'} <Icon name="arrow" size={16} stroke={2.4} /></button>
            <div className="fine">By signing in you accept the [YOUR DEPARTMENT] terms and confirm that taxpayer data is processed only on this device for the scrutiny period.</div>
            <div className="fine">New here? <a href="#/home" onClick={(e) => { e.preventDefault(); go('home'); }}>See what the console does</a></div>
          </form>
        </div>
      </div>
    </div>
  );
}
