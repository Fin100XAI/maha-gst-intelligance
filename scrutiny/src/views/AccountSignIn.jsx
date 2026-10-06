// Sign-in with an officer account (AUTH_MODE=accounts), and the password change a temporary password requires.
// The server checks the password and sets the session; nothing secret is kept in the browser.
import React, { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { SiteHeader } from '../components/SiteHeader.jsx';
import { signIn, changePassword } from '../lib/auth.js';
import { passwordProblem, MIN_PASSWORD } from '../lib/access.js';

function Frame({ embedded, go, children }) {
  return (
    <div className="login-bg">
      {!embedded && <SiteHeader view="login" go={go} />}
      <div className="login" style={embedded ? { gridTemplateColumns: '1fr' } : undefined}>
        {!embedded && (
          <div className="login-left">
            <div className="lp-eyebrow left" style={{ color: '#e9c84a' }}>GST Intelligence</div>
            <h2>Your jurisdiction, <em>your account.</em></h2>
            <p>Each officer signs in with their own account. You see the taxpayers of your jurisdictions, everything you record carries your name, and notices are issued or escalated only with a second officer's approval.</p>
          </div>
        )}
        <div className="login-right">{children}</div>
      </div>
    </div>
  );
}

export default function AccountSignIn({ embedded, go, onSignedIn, mustChange = null }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const r = await signIn(email.trim(), password).catch(() => ({ ok: false, error: 'The server could not be reached' }));
    setBusy(false);
    if (!r.ok) { setPassword(''); return setError(r.error || 'Sign-in failed'); }
    onSignedIn(r.account);
  };
  const submitChange = async (e) => {
    e.preventDefault();
    const why = passwordProblem(next, { email: mustChange.email });
    if (why) return setError(`New password: ${why}.`);
    if (next !== again) return setError('The two new passwords do not match.');
    setBusy(true);
    const r = await changePassword(password, next).catch(() => ({ ok: false, error: 'The server could not be reached' }));
    setBusy(false);
    if (!r.ok) return setError(r.error || 'The password was not changed');
    onSignedIn(r.account);
  };

  if (mustChange) {
    return (
      <Frame embedded={embedded} go={go}>
        <form className="login-form" onSubmit={submitChange} noValidate>
          <div>
            <div className="lp-eyebrow left">Signed in as {mustChange.email}</div>
            <h1 style={{ marginTop: 8 }}>Choose your password</h1>
            <div className="lead">You signed in with a temporary password. Choose your own ({MIN_PASSWORD} characters or more) to continue. It ends every other session of this account.</div>
          </div>
          <div className="field"><label htmlFor="cp-cur">Temporary password</label><input id="cp-cur" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
          <div className="field"><label htmlFor="cp-new">New password</label><input id="cp-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" /></div>
          <div className="field"><label htmlFor="cp-again">New password again</label><input id="cp-again" type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" /></div>
          {error && <div className="err" role="alert">{error}</div>}
          <button className="btn primary big lp-btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save and continue'} <Icon name="arrow" size={16} stroke={2.4} /></button>
        </form>
      </Frame>
    );
  }
  return (
    <Frame embedded={embedded} go={go}>
      <form className="login-form" onSubmit={submit} noValidate>
        <div>
          <div className="lp-eyebrow left">Authorised officers only</div>
          <h1 style={{ marginTop: 8 }}>Sign in</h1>
          <div className="lead">Use the official email and password of your account. Your administrator creates accounts and assigns jurisdictions.</div>
        </div>
        <div className="field"><label htmlFor="si-em">Official email</label><input id="si-em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" placeholder="name@department.example" /></div>
        <div className="field"><label htmlFor="si-pw">Password</label><input id="si-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
        {error && <div className="err" role="alert">{error}</div>}
        <button className="btn primary big lp-btn" type="submit" disabled={busy || !email || !password}>{busy ? 'Checking…' : 'Sign in'} <Icon name="arrow" size={16} stroke={2.4} /></button>
        <div className="fine">Forgotten password: ask your administrator to reset it. After five wrong attempts sign-in pauses for five minutes.</div>
      </form>
    </Frame>
  );
}
