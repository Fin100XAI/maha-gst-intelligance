// E-way bills (s.68 CGST Act, rule 138 CGST Rules): the movement record behind a supply of goods. The returns do not
// carry them; they come from the e-way bill system, fetched through the E-way bills screen (simulated in this build,
// pending NIC/GSP credentials) or uploaded as the portal's export. Pure and dependency-free: browser and server.

// ------------------------------------------------------------------ when a movement needs an e-way bill
// Inter-state: consignment value above ₹50,000. Intra-state limits are set by each state; these states notified ₹1 lakh.
const INTRA_LIMIT = { '07': 100000, 19: 100000, 27: 100000, 33: 100000 };
export const ewbLimit = (fromState, toState) => (String(fromState) === String(toState) ? INTRA_LIMIT[String(fromState)] || INTRA_LIMIT[Number(fromState)] || 50000 : 50000);
// Annexure to rule 138(14): jewellery, goldsmiths' and silversmiths' wares, precious stones and metals (Chapter 71)
// move without an e-way bill.
export const ewbExempt = (hsn) => /^71/.test(String(hsn ?? ''));
// The returns carry no HSN per invoice, so the supplier's line of business decides goods vs services and exemption.
const SERVICE_NAME = /INFOTECH|DIGITAL SERVICES|LOGISTICS|ROADWAYS|ROADLINES|TRANSPORT|LEGAL|TECHNOLOGIES|CONSULT|INFRASTRUCTURE|INFRA PROJECTS|EXPRESSWAY|POWER PROJECTS|SOLAR EPC|HOTELS|RESORTS/;
const EXEMPT_NAME = /BULLION|JEWEL|GOLD TRADING/;
export const likelyServices = (name) => SERVICE_NAME.test(String(name ?? '').toUpperCase());
export const likelyExempt = (name) => EXEMPT_NAME.test(String(name ?? '').toUpperCase());
/** Does a supply of this value by this supplier (of goods under this HSN, when known) need an e-way bill? */
export const needsEwb = ({ supplierName, value, fromState, toState, hsn }) => !likelyServices(supplierName) && !likelyExempt(supplierName) && !ewbExempt(hsn) && value > ewbLimit(fromState, toState);

// HSN of the goods on a bill. Outward: the taxpayer's main goods line that month (GSTR-1 HSN summary). Inward: the
// supplier's trade where its name says it, else the taxpayer's own main line (a jeweller buys jewellery). One
// definition for the simulator and the checks, so both sides decide the same way.
const HSN_BY_WORD = [[/STEEL|IRON|ALLOY/, '7208'], [/SCRAP|METAL/, '7204'], [/CHEMICAL|PETROCHEM/, '2902'], [/PHARMA/, '3004'], [/POLYMER|PLASTIC/, '3901'], [/TYRE/, '4011'], [/RUBBER/, '4001'],
  [/PAPER|STATIONERY/, '4802'], [/PULP/, '4703'], [/CEMENT|BUILDCON/, '2523'], [/COAL/, '2701'], [/TEXTILE|FABRIC/, '5208'], [/SPINNER|YARN/, '5205'], [/GARMENT|FASHION/, '6205'], [/ELECTRONIC/, '8473'],
  [/ELECTRICAL|CABLE/, '8544'], [/AUTO|MOTOR/, '8708'], [/PACKAGING|CARTON/, '4819'], [/FOOD|AGRO/, '0713'], [/OIL/, '1512'], [/DAIRY|MILK/, '0402'], [/MOBILE/, '8517'], [/SOLAR/, '8541'], [/GAS/, '2814'],
  [/JEWEL|BULLION|GOLD/, '7113']];
/** (month) => main goods HSN of the taxpayer's outward supplies that month, else of the year. */
export function mainHsnOf(tp) {
  const goods = (tp.hsn || []).filter((h) => !/^99/.test(String(h.hsn)));
  const byMonth = new Map();
  for (const h of goods) { const cur = byMonth.get(h.m); if (!cur || h.taxable > cur.taxable) byMonth.set(h.m, h); }
  const year = new Map();
  for (const h of goods) year.set(h.hsn, (year.get(h.hsn) || 0) + h.taxable);
  const top = [...year].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  return (m) => (m == null ? top : byMonth.get(m)?.hsn || top);
}
export const inwardHsn = (supplierName, fallback) => (HSN_BY_WORD.find(([re]) => re.test(String(supplierName ?? '').toUpperCase())) || [null, fallback])[1];

// ------------------------------------------------------------------ places (pincode, coordinates) for distances
export const CITIES = [
  ['27', 'Mumbai', '400002', 18.95, 72.83], ['27', 'Pune', '411001', 18.52, 73.86], ['27', 'Nagpur', '440001', 21.15, 79.09], ['27', 'Nashik', '422001', 20.0, 73.79],
  ['27', 'Aurangabad', '431001', 19.88, 75.34], ['27', 'Thane', '400601', 19.2, 72.97], ['27', 'Bhiwandi', '421302', 19.3, 73.06], ['27', 'Chandrapur', '442401', 19.96, 79.3],
  ['27', 'Latur', '413512', 18.4, 76.56], ['27', 'Kolhapur', '416001', 16.7, 74.24], ['27', 'Satara', '415001', 17.68, 74.02], ['27', 'Navi Mumbai', '400703', 19.03, 73.03],
  ['24', 'Ahmedabad', '380001', 23.03, 72.58], ['24', 'Surat', '395003', 21.17, 72.83], ['24', 'Vadodara', '390001', 22.31, 73.18], ['24', 'Rajkot', '360001', 22.3, 70.8], ['24', 'Jamnagar', '361001', 22.47, 70.06],
  ['29', 'Bengaluru', '560001', 12.97, 77.59], ['29', 'Mysuru', '570001', 12.3, 76.64], ['29', 'Hubballi', '580020', 15.36, 75.12],
  ['33', 'Chennai', '600001', 13.08, 80.27], ['33', 'Coimbatore', '641001', 11.02, 76.96], ['33', 'Tiruppur', '641601', 11.11, 77.34], ['33', 'Hosur', '635109', 12.74, 77.83],
  ['36', 'Hyderabad', '500001', 17.39, 78.49], ['36', 'Warangal', '506002', 17.97, 79.59],
  ['07', 'New Delhi', '110001', 28.63, 77.22], ['08', 'Jaipur', '302001', 26.91, 75.79], ['09', 'Lucknow', '226001', 26.85, 80.95], ['09', 'Kanpur', '208001', 26.45, 80.33],
  ['19', 'Kolkata', '700001', 22.57, 88.36], ['22', 'Raipur', '492001', 21.25, 81.63], ['23', 'Indore', '452001', 22.72, 75.86], ['23', 'Bhopal', '462001', 23.26, 77.41], ['23', 'Satna', '485001', 24.58, 80.83],
  ['30', 'Panaji', '403001', 15.49, 73.83], ['32', 'Kochi', '682001', 9.93, 76.27],
];
const PIN = Object.fromEntries(CITIES.map((c) => [c[2], c]));
export const cityOfPin = (pin) => PIN[String(pin)] || null;
/** Road distance estimate between two pincodes (great-circle × 1.25), or null when either place is unknown. */
export function distanceKm(pinA, pinB) {
  const a = PIN[String(pinA)], b = PIN[String(pinB)];
  if (!a || !b) return null;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b[3] - a[3]), dLon = rad(b[4] - a[4]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[3])) * Math.cos(rad(b[3])) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(x)) * 1.25);
}

// ------------------------------------------------------------------ the portal's export layout
export const EWB_COLUMNS = ['EWB No', 'EWB Date', 'Supply Type', 'Sub Supply Type', 'Document Type', 'Document No', 'Document Date', 'From GSTIN', 'From Trade Name', 'From State', 'From Pincode',
  'To GSTIN', 'To Trade Name', 'To State', 'To Pincode', 'Ship To State', 'HSN Code', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Cess', 'Total Invoice Value', 'Transport Mode', 'Vehicle No',
  'Transporter ID', 'Approx Distance (km)', 'Valid Upto', 'Status'];
const KEYS = ['no', 'at', 'supply', 'sub', 'doc', 'docNo', 'docDate', 'from', 'fromName', 'fromState', 'fromPin', 'to', 'toName', 'toState', 'toPin', 'shipTo', 'hsn', 'taxable', 'igst', 'cgst', 'sgst', 'cess',
  'total', 'mode', 'vehicle', 'transporter', 'km', 'validUpto', 'status'];
const NUM = new Set(['taxable', 'igst', 'cgst', 'sgst', 'cess', 'total', 'km']);
const norm = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
/** One row of the export per record: array in EWB_COLUMNS order. */
export const ewbToRow = (b) => KEYS.map((k) => b[k] ?? null);
/**
 * Read the export (rows as objects keyed by header text, e.g. from sheet_to_json). Returns the records and the problems.
 * @returns {{ bills: object[], errors: string[] }}
 */
export function parseEwbRows(rows) {
  const errors = [];
  const byNorm = Object.fromEntries(EWB_COLUMNS.map((c, i) => [norm(c), KEYS[i]]));
  const bills = [];
  rows.forEach((raw, i) => {
    const b = {};
    for (const [h, v] of Object.entries(raw)) { const k = byNorm[norm(h)]; if (k) b[k] = NUM.has(k) ? Number(String(v).replace(/[,₹\s]/g, '')) || 0 : v == null ? '' : String(v).trim(); }
    if (!b.no && !b.docNo) return;
    if (!b.no || !b.docNo || !b.from) { errors.push(`Row ${i + 2}: EWB No, Document No and From GSTIN are required`); return; }
    b.from = String(b.from).toUpperCase(); b.to = String(b.to || 'URP').toUpperCase();
    b.status ||= 'Active';
    bills.push(b);
  });
  return { bills, errors };
}

// ------------------------------------------------------------------ reconciliation against the returns
const docKey = (gstin, no) => `${String(gstin).toUpperCase()}|${String(no ?? '').toUpperCase().replace(/\s+/g, '')}`;
const r2 = (v) => Math.round(v * 100) / 100;
const taxOf = (x) => (x.igst || 0) + (x.cgst || 0) + (x.sgst || 0);
const hoursBetween = (a, b) => Math.abs(new Date(a) - new Date(b)) / 36e5;
const CAP = 40; // exception rows kept per list (the counts and values cover all)

/**
 * @param {object} tp    parsed taxpayer-year (b2b, cdn, g2b, gstin, stateCode, name)
 * @param {{ outward: object[], inward: object[], source?: string, fetchedAt?: string }} ewb
 * @param {(name: string) => string|null} stateCodeOf  place-of-supply name -> state code
 */
export function reconcileEwb(tp, ewb, stateCodeOf) {
  const own = String(tp.stateCode);
  const outward = (ewb.outward || []).filter((b) => b.status !== 'Cancelled');
  const inward = (ewb.inward || []).filter((b) => b.status !== 'Cancelled');
  const cancelled = (ewb.outward || []).filter((b) => b.status === 'Cancelled').length;

  // outward: every invoice that needed a bill, and every bill that should have an invoice
  const invByDoc = new Map([...tp.b2b, ...(tp.b2cl || [])].map((x) => [docKey(tp.gstin, x.no), x]));
  const billByDoc = new Map(outward.map((b) => [docKey(b.from, b.docNo), b]));
  const posState = (x) => stateCodeOf(x.pos) || own;
  const hsnOf = mainHsnOf(tp);
  const needing = tp.b2b.filter((x) => needsEwb({ supplierName: tp.name, value: x.value, fromState: own, toState: posState(x), hsn: hsnOf(x.m) }));
  const missing = needing.filter((x) => !billByDoc.has(docKey(tp.gstin, x.no)));
  const unmatched = outward.filter((b) => b.doc !== 'Delivery Challan' && !invByDoc.has(docKey(b.from, b.docNo)));
  const mismatch = outward.map((b) => [b, invByDoc.get(docKey(b.from, b.docNo))]).filter(([b, x]) => x && Math.abs(b.total - x.value) > Math.max(100, x.value * 0.005));

  // bill-to-ship-to: goods delivered in another state than the bill-to party's. The place of supply stays the
  // bill-to party's (IGST Act s.10(1)(b)), so the tax head follows supplier state vs bill-to state.
  const shipMoves = outward.filter((b) => b.shipTo && String(b.shipTo) !== String(b.toState)).map((b) => [b, invByDoc.get(docKey(b.from, b.docNo))]).filter(([, x]) => x);
  const wrongHead = shipMoves.filter(([, x]) => { const inter = posState(x) !== own; return inter ? x.cgst + x.sgst > 0 : x.igst > 0; });

  // inward: goods credit taken on documents with no e-way bill behind them
  const inBill = new Map(inward.map((b) => [docKey(b.from, b.docNo), b]));
  const goodsIn = tp.g2b.filter((x) => !x.rc && needsEwb({ supplierName: x.party, value: x.value, fromState: String(x.gstin).slice(0, 2), toState: own, hsn: inwardHsn(x.party, hsnOf(null)) }));
  const unsupported = goodsIn.filter((x) => !inBill.has(docKey(x.gstin, x.no)));

  // vehicles: the same vehicle cannot start two journeys hundreds of kilometres apart within a few hours
  const clashes = [];
  const byVehicle = new Map();
  for (const b of [...outward, ...inward]) if (b.vehicle) (byVehicle.get(b.vehicle) || byVehicle.set(b.vehicle, []).get(b.vehicle)).push(b);
  for (const list of byVehicle.values()) {
    list.sort((a, b) => (a.at < b.at ? -1 : 1));
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1], b = list[i];
      if (a.no === b.no) continue;
      const km = distanceKm(a.fromPin, b.fromPin);
      if (km != null && km > 250 && hoursBetween(a.at, b.at) < 6) clashes.push([a, b, km]);
    }
  }

  const sumTax = (rows) => r2(rows.reduce((s, x) => s + taxOf(x), 0));
  const sumHeads = (rows) => ({ igst: r2(rows.reduce((s, x) => s + (x.igst || 0), 0)), cgst: r2(rows.reduce((s, x) => s + (x.cgst || 0), 0)), sgst: r2(rows.reduce((s, x) => s + (x.sgst || 0), 0)) });
  const sumVal = (rows, f = (x) => x.value) => r2(rows.reduce((s, x) => s + f(x), 0));
  return {
    source: ewb.source || 'unknown', fetchedAt: ewb.fetchedAt || null,
    outward: { bills: outward.length, value: sumVal(outward, (b) => b.total), cancelled, needing: needing.length, covered: needing.length - missing.length,
      missing: { count: missing.length, value: sumVal(missing), rows: missing.slice(0, CAP).map((x) => ({ no: x.no, date: x.date, to: x.gstin, party: x.party, value: x.value })) },
      unmatched: { count: unmatched.length, value: sumVal(unmatched, (b) => b.total), tax: sumTax(unmatched), heads: sumHeads(unmatched), rows: unmatched.slice(0, CAP).map((b) => ({ no: b.no, at: b.at, docNo: b.docNo, to: b.to, toName: b.toName, total: b.total, vehicle: b.vehicle })) },
      mismatch: { count: mismatch.length, rows: mismatch.slice(0, CAP).map(([b, x]) => ({ no: b.no, docNo: b.docNo, ewbValue: b.total, invoiceValue: x.value })) } },
    inward: { bills: inward.length, needing: goodsIn.length, covered: goodsIn.length - unsupported.length,
      unsupported: { count: unsupported.length, value: sumVal(unsupported), itc: sumTax(unsupported), heads: sumHeads(unsupported), rows: unsupported.slice(0, CAP).map((x) => ({ no: x.no, date: x.date, from: x.gstin, party: x.party, value: x.value, itc: r2(taxOf(x)) })) } },
    goodsItc: sumTax(goodsIn),
    shipTo: { moves: shipMoves.length, wrongHead: { count: wrongHead.length, tax: sumTax(wrongHead.map(([, x]) => x)), rows: wrongHead.slice(0, CAP).map(([b, x]) => ({ no: b.no, docNo: b.docNo, billTo: b.toState, shipTo: b.shipTo, igst: x.igst, cgst: x.cgst, sgst: x.sgst })) } },
    vehicles: { clashes: clashes.length, rows: clashes.slice(0, CAP).map(([a, b, km]) => ({ vehicle: a.vehicle, first: a.no, firstAt: a.at, firstFrom: a.fromPin, second: b.no, secondAt: b.at, secondFrom: b.fromPin, km })) },
  };
}
