import { registerMessages } from '../locale.js'

/**
 * Marathi — closed data vocabularies not already covered elsewhere.
 *
 * Most of the department's closed vocabularies were already translated in the
 * screen catalogues that own them: districts, divisions, sectors and filing
 * status in shell.js; audit and litigation stages and questions of law in
 * auditAndLitigation.js; alert types in copilotAndEarlyWarning.js; risk rules in
 * itcAndFakeInvoice.js; notice status in shared.js; refund triage in
 * ewayAndRefund.js. Registering them again here would only risk overriding a
 * better reading with a worse one, since a later registration wins.
 *
 * What remains are the three vocabularies no screen catalogue claimed, because
 * they are produced by the data layer rather than written on a screen: the
 * notice types in NOTICE_TYPES, the compliance histories in
 * COMPLIANCE_HISTORIES, and the node roles assigned inside a network cluster.
 *
 * Form codes stay in Latin — GSTR-3A, RFD-08, ASMT-10, REG-17, DRC-01 are the
 * citation an officer quotes, not words to be translated.
 */
registerMessages('mr', {
  /* == Notice types — mockData.NOTICE_TYPES =============================== */
  'GSTR-3A Non-Filer Notice': 'GSTR-3A विवरणपत्र न भरल्याची नोटीस',
  'RFD-08 Refund Rejection Notice': 'RFD-08 परतावा नाकारल्याची नोटीस',
  'ASMT-10 Scrutiny Notice': 'ASMT-10 तपासणी नोटीस',
  'REG-17 Registration Cancellation Notice': 'REG-17 नोंदणी रद्द करण्याची नोटीस',
  'DRC-01 Show Cause Notice': 'DRC-01 कारणे दाखवा नोटीस',

  /* == Compliance history — mockData.COMPLIANCE_HISTORIES ================= */
  'Consistently Compliant': 'सातत्याने नियमपालन',
  'Minor Irregularities': 'किरकोळ अनियमितता',
  'Repeated Defaults': 'वारंवार कसूर',
  'Under Investigation': 'तपासाधीन',

  /* == Role within a network cluster ====================================== */
  'Hub Entity': 'केंद्रस्थ घटक',
  'Pass-Through': 'मध्यस्थ घटक',
  Counterparty: 'प्रतिपक्ष'
})
