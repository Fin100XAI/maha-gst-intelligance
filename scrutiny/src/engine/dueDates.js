// GSTR-3B due dates (rule 61(5) CGST Rules, proviso for QRMP filers), with the department's register of notified
// extensions on top. Pure and dependency-free.
//
//   monthly filer            20th of the following month
//   QRMP, Category I state   22nd of the month after the quarter
//   QRMP, Category II state  24th of the month after the quarter
//
// Holidays do not move a GST due date by themselves; a date moves only when an extension is notified, which the
// department records in the "Due-date extensions" register.

// Category II (24th): Himachal Pradesh, Punjab, Uttarakhand, Haryana, Rajasthan, Uttar Pradesh, Bihar, Sikkim,
// Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura, Meghalaya, Assam, West Bengal, Jharkhand, Odisha, Jammu and
// Kashmir, Ladakh, Chandigarh, Delhi. Every other State and Union territory is Category I (22nd).
export const QRMP_DAY_24 = new Set(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '38']);

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

/** Statutory day of the month for a filer: 20, 22 or 24. */
export const statutoryDay = ({ quarterly, stateCode }) => (!quarterly ? 20 : QRMP_DAY_24.has(pad(stateCode)) ? 24 : 22);

/** Does an extension row (a "Due-date extensions" register record) apply to this return? */
function applies(ext, { fy, month, quarterly, stateCode }) {
  if (ext.fy !== fy || ext.month !== month) return false;
  if (ext.filing === 'Monthly' && quarterly) return false;
  if (ext.filing === 'QRMP' && !quarterly) return false;
  return ext.states === 'All' || String(ext.states).split(',').includes(pad(stateCode));
}

/**
 * Due date of the GSTR-3B for a tax period.
 * @param {{ year: number, month: number, quarterly: boolean, stateCode: string|number, extensions?: object[] }} p
 *   year / month: calendar year and month (1-12) of the period's last month
 * @returns {{ due: string, statutory: string, extension: object|null }}  ISO dates; `extension` is the row applied
 */
export function returnDueDate({ year, month, quarterly, stateCode, extensions = [] }) {
  const ny = month === 12 ? year + 1 : year, nm = month === 12 ? 1 : month + 1;
  const statutory = `${ny}-${pad(nm)}-${pad(statutoryDay({ quarterly, stateCode }))}`;
  const fyStart = month >= 4 ? year : year - 1;
  const key = { fy: `${fyStart}-${String(fyStart + 1).slice(2)}`, month: MON[month - 1], quarterly, stateCode };
  // the latest notified date wins (a later notification can extend an extension); never earlier than the statute
  const ext = extensions.filter((e) => applies(e, key)).sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1))[0] || null;
  return ext && ext.dueDate > statutory ? { due: ext.dueDate, statutory, extension: ext } : { due: statutory, statutory, extension: null };
}
