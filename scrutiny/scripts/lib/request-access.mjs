// What the signed-in officer may do, as the server plugins read it from a request. scripts/auth.js attaches it to
// every request; without it (open mode, or a plugin used on its own) everything is allowed, as before accounts.

const OPEN = Object.freeze({ mode: 'open', account: null, all: true, scope: null, can: () => true, inScope: () => true });

/** @returns {{ mode: 'open'|'accounts', account: object|null, all: boolean, scope: object|null, can: (perm: string) => boolean, inScope: (gstin: string) => boolean }} */
export const accessOf = (req) => req.access || OPEN;

export const forbid = (res, error, code = 403) => {
  res.statusCode = code;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify({ ok: false, error }));
};

/** The GSTIN an alert key (rule|gstin|fy) or a report file (scrutiny-report_<gstin>.html) is about. */
export const gstinOfAlertKey = (key) => String(key || '').split('|')[1] || '';
export const gstinOfReportFile = (name) => (String(name || '').match(/scrutiny-report_([0-9A-Z]{15})\./) || [])[1] || '';
