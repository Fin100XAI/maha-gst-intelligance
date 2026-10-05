// Accounts: the officer's own account (password, sign-out) and, with the accounts permission, everyone's: create an
// account with a one-time temporary password, change role and jurisdictions, reset a password, disable an account.
// The server (scripts/auth.js) enforces all of it; this screen only offers what the officer may do.
import React, { useCallback, useEffect, useState } from 'react';
import { PageHead } from '../components/ui.jsx';
import { listAccounts, createAccount, updateAccount, changePassword } from '../lib/auth.js';
import { ROLES, PERMS, ALL, can, jurisdictionLabel, passwordProblem } from '../lib/access.js';

const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'never');
const BLANK = { email: '', name: '', designation: '', role: 'officer', jurisdictions: [] };

function Jurisdictions({ value, onChange, options, mine }) {
  const all = value.includes(ALL);
  const allowedAll = mine.includes(ALL);
  return (
    <div className="acc-jur">
      {allowedAll && <label><input type="checkbox" checked={all} onChange={(e) => onChange(e.target.checked ? [ALL] : [])} /> <b>All jurisdictions</b></label>}
      {!all && options.filter((o) => allowedAll || mine.includes(o.name)).map((o) => (
        <label key={o.name}><input type="checkbox" checked={value.includes(o.name)} onChange={(e) => onChange(e.target.checked ? [...value, o.name] : value.filter((j) => j !== o.name))} /> {o.name} <span className="muted small">({o.taxpayers})</span></label>
      ))}
    </div>
  );
}

function OneTime({ shown, onClose }) {
  if (!shown) return null;
  return (
    <div className="card note acc-once" role="status">
      <b>Temporary password for {shown.email}</b>
      <div className="mono acc-pw">{shown.password}</div>
      <div className="small">Shown once. Give it to the officer in person or by a separate channel; they choose their own at the first sign-in.</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn small" onClick={() => navigator.clipboard?.writeText(shown.password)}>Copy</button>
        <button className="btn small" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

function MyAccount({ user, onSignOut, toast }) {
  const [f, setF] = useState({ current: '', next: '', again: '' });
  const [error, setError] = useState('');
  const save = async (e) => {
    e.preventDefault();
    const why = passwordProblem(f.next, { email: user.email });
    if (why) return setError(`New password: ${why}.`);
    if (f.next !== f.again) return setError('The two new passwords do not match.');
    const r = await changePassword(f.current, f.next);
    if (!r.ok) return setError(r.error || 'Not changed');
    setF({ current: '', next: '', again: '' }); setError(''); toast('Password changed: your other sessions are signed out');
    return undefined;
  };
  return (
    <section className="card">
      <div className="card-head"><div><h3>My account</h3><div className="sub">{user.email} · {ROLES[user.accountRole]?.label} · {user.workspace}</div></div>
        <button className="btn small" onClick={onSignOut}>Sign out</button></div>
      <div className="small muted" style={{ marginBottom: 8 }}>You may: {user.perms.map((p) => PERMS[p]).join('; ')}.</div>
      <form className="track-form" onSubmit={save} style={{ maxWidth: 420 }}>
        <b>Change password</b>
        <label>Current password<input type="password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} autoComplete="current-password" required /></label>
        <label>New password<input type="password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} autoComplete="new-password" required /></label>
        <label>New password again<input type="password" value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} autoComplete="new-password" required /></label>
        {error && <div className="err">{error}</div>}
        <button className="btn small primary">Change password</button>
      </form>
    </section>
  );
}

export default function Accounts({ mode, user, onSignOut, toast }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(BLANK);
  const [editing, setEditing] = useState(null); // { id, role, jurisdictions, designation }
  const [shown, setShown] = useState(null);
  const manager = mode === 'accounts' && can(user, 'accounts');
  const load = useCallback(() => listAccounts().then((r) => (r.ok ? setList(r) : setError(r.error || 'Could not load accounts'))), []);
  useEffect(() => { if (manager) load(); }, [manager, load]);

  if (mode !== 'accounts') {
    return (
      <div className="page">
        <PageHead title="Accounts" path="Open mode: no accounts" />
        <section className="card" style={{ maxWidth: 820 }}>
          <h3 style={{ marginTop: 0 }}>Officer accounts are switched off</h3>
          <p>In open mode the name typed at sign-in is recorded but not verified, and every officer sees every taxpayer. To give each officer their own account, limited to their jurisdictions, on the server:</p>
          <ol style={{ lineHeight: 1.8 }}>
            <li>Create the first account: <code>npm run accounts -- add --email you@dept.gov.in --name "Your Name" --role commissioner --jurisdictions "*"</code> (it prints a temporary password). For a demonstration, <code>npm run accounts -- demo</code> makes one account per role.</li>
            <li>Start the server with <code>AUTH_MODE=accounts</code> (in the environment or <code>.env.local</code>) and restart it.</li>
            <li>Sign in, choose your own password, and create the other accounts here.</li>
          </ol>
          <p className="muted small">Jurisdictions come from the taxpayer master register: an officer sees the taxpayers the master assigns to their jurisdictions. A taxpayer the master does not list is seen only by accounts covering all jurisdictions.</p>
        </section>
      </div>
    );
  }

  const add = async (e) => {
    e.preventDefault();
    const r = await createAccount(form);
    if (!r.ok) return setError(r.error);
    setShown({ email: r.account.email, password: r.password }); setForm(BLANK); setError(''); load();
    return undefined;
  };
  const patch = async (a, p, done) => {
    const r = await updateAccount(a.id, p);
    if (!r.ok) return setError(r.error);
    setError('');
    if (r.password) setShown({ email: a.email, password: r.password });
    if (done) toast(done);
    setEditing(null); load();
    return undefined;
  };
  const options = list?.jurisdictions || [];
  return (
    <div className="page">
      <PageHead title="Accounts" path={manager ? `${list?.accounts.length ?? '…'} accounts · sign-ins and changes are logged on the server` : 'Your account'} />
      <div className="stack">
        <MyAccount user={user} onSignOut={onSignOut} toast={toast} />
        <OneTime shown={shown} onClose={() => setShown(null)} />
        {error && <div className="card note err" role="alert">{error}</div>}
        {manager && list && (<>
          <section className="card">
            <div className="card-head"><div><h3>Officers</h3><div className="sub">Changing a role or jurisdictions, resetting a password or disabling an account signs that officer out at once.</div></div></div>
            <table className="tbl">
              <thead><tr><th>Officer</th><th>Role</th><th>Jurisdictions</th><th>Last sign-in</th><th /></tr></thead>
              <tbody>{list.accounts.map((a) => (editing?.id === a.id ? (
                <tr key={a.id}>
                  <td><b>{a.name}</b><div className="muted small">{a.email}</div><input value={editing.designation} onChange={(e) => setEditing({ ...editing, designation: e.target.value })} placeholder="Designation" /></td>
                  <td><select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></td>
                  <td><Jurisdictions value={editing.jurisdictions} onChange={(j) => setEditing({ ...editing, jurisdictions: j })} options={options} mine={user.jurisdictions} /></td>
                  <td />
                  <td style={{ whiteSpace: 'nowrap' }}><button className="btn small primary" onClick={() => patch(a, { role: editing.role, jurisdictions: editing.jurisdictions, designation: editing.designation }, 'Account updated')}>Save</button> <button className="btn small" onClick={() => setEditing(null)}>Cancel</button></td>
                </tr>
              ) : (
                <tr key={a.id} className={a.active ? '' : 'muted'}>
                  <td><b>{a.name}</b>{a.id === user.id && <span className="chip" style={{ marginLeft: 6 }}>you</span>}<div className="muted small">{a.email}{a.designation ? ` · ${a.designation}` : ''}</div></td>
                  <td>{a.roleLabel}{!a.active && <div className="chip bad">Disabled</div>}{a.mustChange && a.active && <div className="chip warn">Temporary password</div>}</td>
                  <td>{jurisdictionLabel(a.jurisdictions)}</td>
                  <td className="small">{when(a.lastSignIn)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn small" onClick={() => setEditing({ id: a.id, role: a.role, jurisdictions: a.jurisdictions, designation: a.designation || '' })}>Edit</button>{' '}
                    <button className="btn small" onClick={() => patch(a, { resetPassword: true })}>Reset password</button>{' '}
                    {a.id !== user.id && <button className="btn small" onClick={() => patch(a, { active: !a.active }, a.active ? 'Account disabled' : 'Account enabled')}>{a.active ? 'Disable' : 'Enable'}</button>}
                  </td>
                </tr>
              )))}</tbody>
            </table>
          </section>
          <section className="card">
            <div className="card-head"><div><h3>Add an officer</h3><div className="sub">The account gets a temporary password, shown once, which the officer changes at the first sign-in.</div></div></div>
            <form className="track-form acc-form" onSubmit={add}>
              <label>Official email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
              <label>Name (as it appears on records)<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
              <label>Designation (on notices)<input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. State Tax Officer" /></label>
              <label>Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
              <div className="small muted">{ROLES[form.role].perms.map((p) => PERMS[p]).join('; ')}.</div>
              <div><b className="small">Jurisdictions</b><Jurisdictions value={form.jurisdictions} onChange={(j) => setForm({ ...form, jurisdictions: j })} options={options} mine={user.jurisdictions} /></div>
              <button className="btn small primary" disabled={!form.jurisdictions.length}>Create account</button>
            </form>
          </section>
        </>)}
      </div>
    </div>
  );
}
