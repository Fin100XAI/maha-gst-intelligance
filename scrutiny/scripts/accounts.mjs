#!/usr/bin/env node
// Officer accounts from the command line, on the server (the first account has to be made here; after that a
// Commissioner or administrator can manage accounts in the app, under Configure → Accounts).
//
//   npm run accounts -- list
//   npm run accounts -- add   --email a@dept.gov.in --name "A. Officer" --role officer --jurisdictions PUNE-WARD-01 [--designation "State Tax Officer"]
//   npm run accounts -- set   --email a@dept.gov.in [--role supervisor] [--jurisdictions "PUNE-WARD-01,PUNE-WARD-02"] [--name ...] [--designation ...]
//   npm run accounts -- reset --email a@dept.gov.in        new temporary password (changed at the next sign-in)
//   npm run accounts -- disable|enable --email a@dept.gov.in
//   npm run accounts -- demo                               one account per role for a demonstration (prints the passwords)
//
// Roles: officer, supervisor, commissioner, admin (src/lib/access.js). --jurisdictions "*" covers every jurisdiction.
// Temporary passwords are printed once and never stored in plain text. STORE_DIR as for the server (store/).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openAccounts, publicAccount } from './lib/accounts.mjs';
import { ROLES, jurisdictionLabel } from '../src/lib/access.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.env.STORE_DIR ? path.resolve(process.env.STORE_DIR) : path.join(root, 'store');
const store = openAccounts(dir);

const [cmd, ...rest] = process.argv.slice(2);
const opts = {};
for (let i = 0; i < rest.length; i += 1) if (rest[i].startsWith('--')) { opts[rest[i].slice(2)] = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true; }
const list = (v) => (v === undefined ? undefined : String(v).split(',').map((s) => s.trim()).filter(Boolean));
const by = `cli:${process.env.USERNAME || process.env.USER || 'server'}`;
const need = () => { const x = store.byEmail(opts.email); if (!x) throw new Error(`no account for ${opts.email}`); return x; };
const show = (a, password) => {
  console.log(`${a.email}  ${a.name}  ${ROLES[a.role]?.label || a.role}  ${jurisdictionLabel(a.jurisdictions)}${a.active ? '' : '  (disabled)'}`);
  if (password) console.log(`  temporary password: ${password}   (shown once; it must be changed at the first sign-in)`);
};

const DEMO = [
  { email: 'commissioner@demo.gst', name: 'Commissioner (demo)', designation: 'Commissioner of State Tax', role: 'commissioner', jurisdictions: ['*'] },
  { email: 'jc.pune@demo.gst', name: 'Joint Commissioner Pune (demo)', designation: 'Joint Commissioner', role: 'supervisor', jurisdictions: ['PUNE-WARD-01'] },
  { email: 'priya.m@demo.gst', name: 'Priya M.', designation: 'State Tax Officer', role: 'officer', jurisdictions: ['PUNE-WARD-01'] },
  { email: 'officer.ltu@demo.gst', name: 'LTU Mumbai officer (demo)', designation: 'State Tax Officer', role: 'officer', jurisdictions: ['LTU-MUMBAI'] },
];

try {
  switch (cmd) {
    case 'list':
      if (!store.list().length) console.log('No accounts yet.');
      store.list().map(publicAccount).forEach((a) => show(a));
      break;
    case 'add': {
      const { account, password } = store.create({ email: opts.email, name: opts.name, designation: opts.designation, role: opts.role, jurisdictions: list(opts.jurisdictions) }, { by });
      show(account, password);
      break;
    }
    case 'set': {
      const { account } = store.update(need().id, { name: opts.name, designation: opts.designation, role: opts.role, jurisdictions: list(opts.jurisdictions) }, { by });
      show(account);
      break;
    }
    case 'reset': { const { account, password } = store.update(need().id, { resetPassword: true }, { by }); show(account, password); break; }
    case 'disable': case 'enable': { const { account } = store.update(need().id, { active: cmd === 'enable' }, { by }); show(account); break; }
    case 'demo':
      for (const d of DEMO) {
        const cur = store.byEmail(d.email);
        const { account, password } = cur ? store.update(cur.id, { resetPassword: true, active: true }, { by }) : store.create(d, { by });
        show(account, password);
      }
      console.log('\nDemo accounts: officers see only their jurisdiction; the supervisor approves what an officer asks (maker-checker).');
      break;
    default:
      console.log('Usage: npm run accounts -- list | add | set | reset | disable | enable | demo   (see scripts/accounts.mjs)');
      process.exitCode = cmd ? 1 : 0;
  }
} catch (e) {
  console.error(`accounts: ${e.message}`);
  process.exitCode = 1;
}
