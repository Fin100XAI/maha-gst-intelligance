// Who may do what, shared by the browser (to show only what an officer can use) and the server (which enforces it).
// Pure and dependency-free.
//
// Two modes, chosen on the server with AUTH_MODE:
//   open      (default) no accounts: the name typed at sign-in is recorded but not verified, everything is allowed.
//   accounts  officers sign in with their own account; the server checks every request, stamps every case event with
//             the account, and sends each officer only the taxpayers of their jurisdictions.

/** Jurisdiction value that covers the whole state. */
export const ALL = '*';

export const PERMS = {
  work: 'Case work: reviews, outcomes, notices, replies',
  approve: 'Approve another officer\'s notice issue or escalation (maker-checker)',
  upload: 'Upload returns and e-way bill data',
  configure: 'Change alert rules',
  accounts: 'Create and manage officer accounts',
};

export const ROLES = {
  officer: { label: 'Field officer', perms: ['work'] },
  supervisor: { label: 'Supervisor (DC / JC)', perms: ['work', 'approve', 'upload', 'configure'] },
  commissioner: { label: 'Commissioner', perms: ['work', 'approve', 'upload', 'configure', 'accounts'] },
  admin: { label: 'System administrator', perms: ['upload', 'configure', 'accounts'] },
};

/** In open mode an officer carries no permission list, and nothing is restricted. */
export const can = (user, perm) => !user?.perms || user.perms.includes(perm);

export const coversAll = (jurisdictions = []) => jurisdictions.includes(ALL);
export const jurisdictionLabel = (jurisdictions = []) => (coversAll(jurisdictions) ? 'All jurisdictions' : jurisdictions.join(', '));

export const MIN_PASSWORD = 10;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** @returns {string[]} what is wrong with an account's details (empty when valid) */
export function validateAccount(a) {
  const errors = [];
  if (!EMAIL.test(String(a.email || '')) || String(a.email).length > 160) errors.push('a valid official email is required');
  if (!String(a.name || '').trim() || String(a.name).length > 80) errors.push('a name (up to 80 characters) is required');
  if (String(a.designation || '').length > 80) errors.push('the designation is longer than 80 characters');
  if (!ROLES[a.role]) errors.push(`role must be one of ${Object.keys(ROLES).join(', ')}`);
  if (!Array.isArray(a.jurisdictions) || !a.jurisdictions.length) errors.push('at least one jurisdiction is required (or * for all)');
  else if (!a.jurisdictions.every((j) => typeof j === 'string' && j.trim() && j.length <= 80)) errors.push('jurisdictions must be names of up to 80 characters');
  return errors;
}

/** @returns {string|null} why a new password is not acceptable */
export function passwordProblem(pw, { email = '' } = {}) {
  if (typeof pw !== 'string' || pw.length < MIN_PASSWORD) return `use at least ${MIN_PASSWORD} characters`;
  if (pw.length > 200) return 'use at most 200 characters';
  const local = String(email).split('@')[0].toLowerCase();
  if (local.length >= 4 && pw.toLowerCase().includes(local)) return 'do not use your email name in the password';
  if (new Set(pw).size < 5) return 'use more varied characters';
  return null;
}

/** The officer as the app uses it, from the account the server returns. */
export function userFromAccount(a) {
  return {
    id: a.id, name: a.name, email: a.email, role: a.designation || ROLES[a.role]?.label || a.role, accountRole: a.role,
    perms: ROLES[a.role]?.perms || [], jurisdictions: a.jurisdictions, workspace: jurisdictionLabel(a.jurisdictions),
    mustChange: !!a.mustChange, admin: 'state', since: new Date().toISOString(), verified: true,
  };
}
