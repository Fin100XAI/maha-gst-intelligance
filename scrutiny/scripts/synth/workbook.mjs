// Writes one taxpayer-year in the exact "Get Download All Report" layout (29 sheets, 4-line banner, same headers),
// from a list of outward and inward documents. Everything else in the export (GSTR-3B, payment of tax, ledgers,
// challans, HSN and document summaries, 2A/2B) is derived from those documents, so the workbook is internally
// consistent unless a planted defect says otherwise.
import * as XLSX from 'xlsx';
import { MONTHS, STATES, r2, serial, addDays, calOf, nextMonthDay, taxOf } from './lib.mjs';

// ------------------------------------------------------------------ sheet layout (exact headers of the real export)
// ------------------------------------------------------------------ sheet layout (exact headers of the real export)
export const H = {
  GSTR3B_Supplies: ['Sr. #', 'Month', 'Nature of Supplies', 'Total Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess'],
  GSTR3B_ITC: ['Sr. #', 'Month', 'Details', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess'],
  GSTR3B_Nil: ['Sr. #', 'Month', 'Nature of Supply', 'Inter State Supplies', 'Intra State Supplies'],
  GSTR3B_PaymentofTax: ['Description', 'Month', 'Other than reverse charge Tax payable', 'Integrated Tax', 'Centarl Tax', 'State/UT Tax', 'Cess', 'Other than reverse charge Tax to be paid in Cash', 'Reverse charge Tax payable', 'Reverse charge Tax to be paid in Cash', 'Interest Payable', 'Interest to be paid in cash', 'Late Fee Payable', 'Late Fee to be paid in cash', 'Utilizable Cash Balance', 'Additional Cash Required'],
  GSTR3B_InterestLateFees: ['Description', 'Month', 'Integrated Tax', 'Centarl Tax', 'State/UT Tax', 'Cess'],
  GSTR1_B2B: ['Sr. #', 'Month', 'GSTIN/UIN', 'Party Name', 'Invoice No', 'Invoice Date', 'Invoice Value', 'Rate', 'Total Taxable Value', 'IGST Amount', 'CGST Amount', 'SGST Amount', 'CESS Amount', 'Place Of Supply', 'Reverse Charge', 'Invoice Type', 'E-Commerce GSTIN', 'Source', 'IRN No', 'IRN Date'],
  GSTR1_CDN: ['Sr. #', 'Month', 'GSTIN/UIN of Recipient', 'Party Name', 'Type of note (Debit/ Credit)', 'Pre GST Regime Dr./ Cr. Notes', 'Debit Note/ credit note/ Refund voucher No.', 'Debit Note/ credit note/ Refund voucher Date', 'Original Invoice No', 'Original Invoice Date', 'Note/Refund Voucher Value', 'Rate', 'Taxable Value', 'IGST Amount', 'CGST Amount', 'SGST Amount', 'CESS Amount', 'Place of supply', 'Source', 'IRN No', 'IRN Date'],
  GSTR1_HSNSummary: ['Sr. #', 'Month', 'HSN', 'Description', 'UQC', 'Total Quantity', 'Total Value', 'Total Taxable Value', 'Rate', 'IGST Amount', 'CGST Amount', 'SGST Amount', 'Cess Amount'],
  GSTR1_DocIssued: ['Sr. #', 'Month', 'Nature of Document', 'Sr. No. From', 'Sr. No. To', 'Total Number', 'Cancelled', 'Net Issued'],
  GSTR2B_B2B: ['Month', 'GSTIN of supplier', 'Trade/Legal name', 'Invoice number', 'Invoice type', 'Invoice Date', 'Invoice Value', 'Place of supply', 'Supply Attract Reverse Charge', 'Rate', 'Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess', 'GSTR-1/5 Period', 'GSTR-1/5 Filing Date', 'ITC Availability', 'Reason', 'Applicable % of Tax Rate', 'Source', 'IRN No', 'IRN Date'],
  GSTR2B_B2BA: ['Month', 'Invoice number', 'Invoice Date', 'GSTIN of supplier', 'Trade/Legal name', 'Invoice number', 'Invoice type', 'Invoice date', 'Invoice Value', 'Place of supply', 'Supply Attract Reverse Charge', 'Rate', 'Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess', 'GSTR-1/5 Period', 'GSTR-1/5 Filing Date', 'ITC Availability', 'Reason', 'Applicable % of Tax Rate'],
  GSTR2B_CDNR: ['Month', 'GSTIN of supplier', 'Trade/Legal name', 'Note number', 'Note type', 'Note Supply type', 'Note date', 'Note Value', 'Place of supply', 'Supply Attract Reverse Charge', 'Rate', 'Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess', 'GSTR-1/5 Period', 'GSTR-1/5 Filing Date', 'ITC Availability', 'Reason', 'Applicable % of Tax Rate', 'Source', 'IRN No', 'IRN Date'],
  GSTR2B_CDNRA: ['Month', 'Original Details Note type', 'Original Details Note number', 'Original Details Note date', 'GSTIN of supplier', 'Trade/Legal name', 'Credit note/Debit note details Note number', 'Credit note/Debit note details Note type', 'Credit note/Debit note details Note Supply type', 'Credit note/Debit note details Note date', 'Credit note/Debit note details Note Value', 'Place of supply', 'Supply Attract Reverse Charge', 'Rate', 'Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess', 'GSTR-1/5 Period', 'GSTR-1/5 Filing Date', 'ITC Availability', 'Reason', 'Applicable % of Tax Rate'],
  GSTR2B_ISD: ['Month', 'GSTIN of ISD', 'Trade/Legal name', 'ISD Document type', 'ISD Document number', 'ISD Document date', 'Original Invoice Number', 'Original invoice date', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess', 'ISD GSTR-6 Period', 'ISD GSTR-6 Filing Date', 'Eligibility of ITC'],
  GSTR2B_ISDA: ['Month', 'ISD Document type', 'Document Number', 'Document date', 'GSTIN of ISD', 'Trade/Legal name', 'ISD Document type', 'ISD Document number', 'ISD Document date', 'Original Invoice Number', 'Original invoice date', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess', 'ISD GSTR-6 Period', 'ISD GSTR-6 Filing Date', 'Eligibility of ITC'],
  GSTR2B_IMPG: ['Month', 'Icegate Reference Date', 'Port Code', 'Number', 'Date', 'Taxable Value', 'Integrated Tax', 'Cess', 'Amended (Yes)'],
  GSTR2B_IMPGSEZ: ['Month', 'GSTIN of supplier', 'Trade/Legal name', 'Icegate Reference Date', 'Port Code', 'Number', 'Date', 'Taxable Value', 'Integrated Tax', 'Cess', 'Amended (Yes)'],
  GSTR2A_B2B: ['Sr. #', 'Month', 'GSTIN of supplier', 'Name of Party', 'Invoice No.', 'Invoice Date', 'Invoice Value', 'Rate', 'Taxable Value', 'Integrated Tax Amount', 'Central Tax Amount', 'State/ UT Tax Amount', 'Cess Tax Amount', 'Place of supply (Name of State)', 'Reverse Charge', 'Invoice Type', 'GSTR-1/5 Filing Status', 'GSTR-1/5 Filing Date', 'GSTR-1/5 Filing Period', 'GSTR-3B Filing Status', 'Submitted', 'Source', 'IRN No', 'IRN Date'],
  GSTR2A_CDN: ['Sr. #', 'Month', 'GSTIN/UIN of Recipient', 'Party Name', 'Type of note (Debit/ Credit)', 'Debit Note/ credit note/ Refund voucher No.', 'Debit Note/ credit note/ Refund voucher Date', 'Original Invoice No', 'Place of supply', 'Supply Type', 'Supply type reverse charge', 'Pre GST Regime Dr./ Cr. Notes', 'Reason for issuing note Dr./ Cr. Notes', 'Note/Refund Voucher Value', 'Original Invoice Date', 'Rate', 'Taxable Value', 'IGST Amount', 'CGST Amount', 'SGST Amount', 'CESS Amount', 'GSTR-1/5 Filing Status', 'GSTR-1/5 Filing Date', 'GSTR-1/5 Filing Period', 'GSTR-3B Filing Status', 'Submitted', 'Source', 'IRN No', 'IRN Date'],
  GSTR2A_B2BA: ['Sr. #', 'Month', 'GSTIN of supplier', 'Name of Party', 'Original Invoice Number', 'Original Invoice Date', 'Invoice Type', 'Invoice Number', 'Invoice Date', 'Place Of Supply', 'Supply attract Reverse Charge', 'Applicable Percentage (%)', 'Total Invoice Value', 'Rate', 'Total Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'CESS', 'GSTR-1/5 Filing Status', 'GSTR-1/5 Filing Date', 'GSTR-1/5 Filing Period', 'GSTR-3B Filing Status'],
  GSTR2A_TDS: ['Sr. #', 'Month', 'GSTIN of Debuctor', 'Amount paid to deductee on which tax is deducted', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Submitted'],
  GSTR2A_IMPGOS: ['Sr. #', 'Reference Date', 'Port Code', 'Number', 'Date', 'Taxable Value', 'IGST', 'CESS', 'Month'],
  LiabilityLedger: ['Sr. #', 'Month', 'Date', 'Reference No.', 'Larger Used For discharging liability', 'Description', 'Transaction Type (Debit/Credit)', 'Amount (Dr/Cr) Integrated Tax', 'Amount (Dr/Cr) Central Tax', 'Amount (Dr/Cr) State Tax', 'Amount (Dr/Cr) Cess', 'Total', 'Balance Integrated Tax', 'Balance Central Tax', 'Balance State Tax', 'Balance Cess', 'Total'],
  CashLedger: ['Sr. #', 'Month', 'Date of Deposit/Debit', 'Time of Deposit', 'Repoting Date (by bank)', 'Reference No.', 'Tax Preiod if Applicable', 'Description', 'Transaction Type (Debit/Credit)', 'Amount (Dr/Cr) Integrated Tax', 'Amount (Dr/Cr) Central Tax', 'Amount (Dr/Cr) State Tax', 'Amount (Dr/Cr) Cess', 'Total', 'Balance Integrated Tax', 'Balance Central Tax', 'Balance State Tax', 'Balance Cess', 'Total'],
  CreditLedger: ['Sr. #', 'Month', 'Date of Deposit/Debit', 'Reference No.', 'Tax Preiod if Applicable', 'Description', 'Transaction Type (Debit/Credit)', 'Amount (Dr/Cr) Integrated Tax', 'Amount (Dr/Cr) Central Tax', 'Amount (Dr/Cr) State Tax', 'Amount (Dr/Cr) Cess', 'Total', 'Balance Integrated Tax', 'Balance Central Tax', 'Balance State Tax', 'Balance Cess', 'Total'],
  Challan: ['Sr. #', 'Month', 'CPIN', 'Created On', 'Amount', 'Mode', 'Expiry Date', 'Deposit Date', 'Deposit Status'],
  'GSTR-7 TDS': ['Sr. #', 'GSTIN of Deductee', 'Party Name of Deductee', 'Amount Paid To Deductee on Which Tax is Deducted', 'IGST', 'CGST', 'SGST', 'Month'],
  'GSTR-7 TCS': ['Sr. #', 'Month', 'GSTIN of Collector', 'Name of Collector', 'Tax period of GSTR-8', 'Gross value', 'Supplies returned', 'Net value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Action'],
  'GSTR-7 TDSA': ['Sr. #', 'Month', 'GSTIN of Deductee', 'Party Name of Deductee', 'Amount Paid To Deductee on Which Tax is Deducted', 'IGST', 'CGST', 'SGST'],
};
export const ITC_ROWS = ['(A) ITC Available (Whether in full or part)', '   (1) Import of goods', '   (2) Import of Services', '   (3) Inward Supplies liable to reverse charge(other than 1 & 2 above)', '   (4) Inward supplies from ISD', '   (5) All other ITC', 'Total ITC Available (A)', '(B) ITC Reversed', '   (1) As per rules 38,42 & 43 of CGST Rules and section 17(5)', '   (2) Others ITC Reversed', 'Total ITC Reversed (B)', '(C) Net ITC Available (A) – (B)', '(D) Ineligible ITC', '   (1) ITC reclaimed which was reversed under Table 4(B)(2) in earlier tax period', '   (2) Ineligible ITC under section 16(4) & ITC restricted due to PoS rules'];
export const SUPPLY_ROWS = ['(a) Outward Taxable Supplies (other than Zero rated,nil rated and exemted)', '(b) Outward Taxable Supplies (Zero rated)', '(c) Other outward Supplies(Nil rated, exemted)', '(d) Inward Supplies(liable to reverse charge)', '(e) Non-GST outward supplies'];

/**
 * @param {object} r  one taxpayer-year
 *   name, gstin, state, fy (start year), filing ('monthly' | 'qrmp'), irn (bool), extractDate (ISO), title?
 *   sales[]        { m, c:{gstin,name,state}, no, seq, date, rate, taxable, igst, cgst, sgst, hsn:[code,desc,uqc,unitPrice], posState?, rc? }
 *   cdns[]         outward credit notes { m, c, no, date, origNo?, origDate?, rate, taxable, igst, cgst, sgst, hsn }
 *   purchases[]    { m, s:{gstin,name,state}, no, date, rate, taxable, igst, cgst, sgst, rc, filed3B, m2b?, in2B?, in2A? }
 *   supplierCdns[] inward credit notes { m, s, no, date, rate, taxable, igst, cgst, sgst }
 *   filedOn{p: ISO}, interestPaid{p: ₹}, lateFeePaid{p: ₹}                 optional overrides per 3B period
 *   underDeclare{p: {taxable, tax}}, excessItc{p: ₹}, rcmDeclaredShare     optional planted defects
 *                  (a negative underDeclare declares more than GSTR-1: a later-period catch-up)
 *   activeFrom     first FY month the GSTIN was registered (default 0 = April): no returns before it
 *   unfiledPeriods GSTR-3B periods never filed: GSTR-1 is still reported, 3B, payment and ledgers are not
 * @param {{ filingLead: () => number }} opts  days before the due date a return was filed, when not overridden
 * @returns {{ wb: object, stats: object }}
 */
export function writeReturns(r, { filingLead }) {
  const { fy, sales, cdns = [], purchases, supplierCdns = [] } = r;
  const own = String(r.state).padStart(2, '0');
  const pos = (sc) => STATES[sc] || STATES[Number(sc)] || 'Maharashtra';
  const qrmp = r.filing === 'qrmp';
  const allPeriods = (qrmp ? [2, 5, 8, 11] : MONTHS.map((_, i) => i)).filter((p) => p >= (r.activeFrom ?? 0));
  const unfiled = new Set(r.unfiledPeriods || []);
  const periods = allPeriods.filter((p) => !unfiled.has(p)); // periods with a filed GSTR-3B
  const periodOf = (m) => allPeriods.find((p) => p >= m);
  const in2B = purchases.filter((p) => p.in2B !== false);

  // ---- 3B per period
  const sumBy = (rows, f) => rows.reduce((a, x) => a + f(x), 0);
  const in_ = (x, p) => periodOf(x.m) === p;
  const tb = {};
  let credit = { igst: 0, cgst: 0, sgst: 0 };
  for (const p of periods) {
    const inv = sales.filter((x) => in_(x, p) && !x.rc);
    const cn = cdns.filter((x) => in_(x, p));
    const out = { taxable: sumBy(inv, (x) => x.taxable) - sumBy(cn, (x) => x.taxable), igst: sumBy(inv, (x) => x.igst) - sumBy(cn, (x) => x.igst), cgst: sumBy(inv, (x) => x.cgst) - sumBy(cn, (x) => x.cgst), sgst: sumBy(inv, (x) => x.sgst) - sumBy(cn, (x) => x.sgst) };
    const hold = r.underDeclare?.[p]; // planted: part of GSTR-1 not declared in 3B
    if (hold) { out.taxable -= hold.taxable; out.cgst -= hold.tax / 2; out.sgst -= hold.tax / 2; }
    const pin = in2B.filter((x) => in_(x, p) && !x.rc);
    const pcn = supplierCdns.filter((x) => in_(x, p));
    const itc = { igst: sumBy(pin, (x) => x.igst) - sumBy(pcn, (x) => x.igst), cgst: sumBy(pin, (x) => x.cgst) - sumBy(pcn, (x) => x.cgst), sgst: sumBy(pin, (x) => x.sgst) - sumBy(pcn, (x) => x.sgst) };
    const extra = r.excessItc?.[p] || 0; // planted: ITC claimed beyond 2B
    itc.cgst += extra / 2; itc.sgst += extra / 2;
    const rcmIn = purchases.filter((x) => in_(x, p) && x.rc);
    const rcmTax = { igst: sumBy(rcmIn, (x) => x.igst), cgst: sumBy(rcmIn, (x) => x.cgst), sgst: sumBy(rcmIn, (x) => x.sgst) };
    const rcmFactor = r.rcmDeclaredShare ?? 1; // planted: RCM liability under-declared
    const rcm = { taxable: sumBy(rcmIn, (x) => x.taxable) * rcmFactor, igst: rcmTax.igst * rcmFactor, cgst: rcmTax.cgst * rcmFactor, sgst: rcmTax.sgst * rcmFactor };
    // utilisation (IGST credit first, then own head), carried forward
    for (const k of ['igst', 'cgst', 'sgst']) credit[k] += itc[k];
    const use = { igst: {}, cgst: {}, sgst: {} };
    const liab = { igst: Math.max(0, out.igst), cgst: Math.max(0, out.cgst), sgst: Math.max(0, out.sgst) };
    const take = (head, from) => { const v = Math.max(0, Math.min(liab[head] - sumBy(Object.values(use[head]), (x) => x), credit[from])); use[head][from] = (use[head][from] || 0) + v; credit[from] -= v; };
    // s.49(5) / rule 88A: IGST credit first (IGST, then CGST, SGST); CGST credit for CGST then IGST; SGST credit for SGST then IGST
    take('igst', 'igst'); take('cgst', 'igst'); take('sgst', 'igst'); take('cgst', 'cgst'); take('igst', 'cgst'); take('sgst', 'sgst'); take('igst', 'sgst');
    const cash = Object.fromEntries(['igst', 'cgst', 'sgst'].map((k) => [k, r2(liab[k] - sumBy(Object.values(use[k]), (x) => x))]));
    const { y, cm } = calOf(fy, p);
    const due = qrmp ? nextMonthDay(fy, p, 22) : nextMonthDay(fy, p, 20);
    const filed = r.filedOn?.[p] || addDays(due, -filingLead());
    tb[p] = { out, itc, rcm, rcmTax, liab, use, cash, due, filed, interest: r.interestPaid?.[p] || 0, lateFee: r.lateFeePaid?.[p] || 0, y, cm };
  }

  // ------------------------------------------------------------------ rows per sheet
  const S = Object.fromEntries(Object.keys(H).map((k) => [k, []]));
  const monthOf = (m) => MONTHS[m];
  const g1Filed = (m) => serial(nextMonthDay(fy, m, 11));
  const periodCode = (m) => { const { y, cm } = calOf(fy, m); return Number(`${cm}${y}`); };
  const irn = (x) => (r.irn ? [`${x.no.replace(/\W/g, '')}${String(x.seq).padStart(6, '0')}`.slice(0, 20), '01-' + String(calOf(fy, x.m).cm).padStart(2, '0') + '-' + calOf(fy, x.m).y] : [null, null]);

  sales.forEach((x, i) => S.GSTR1_B2B.push([i + 1, monthOf(x.m), x.c.gstin, x.c.name, x.no, serial(x.date), r2(x.taxable + taxOf(x)), x.rate, x.taxable, x.igst, x.cgst, x.sgst, 0, pos(x.posState || x.c.state), 'No', 'Regular', null, r.irn ? 'E-Invoice' : null, ...irn(x)]));
  cdns.forEach((x, i) => S.GSTR1_CDN.push([i + 1, monthOf(x.m), x.c.gstin, x.c.name, 'Credit Note', 'No', x.no, serial(x.date), x.origNo || null, x.origDate ? serial(x.origDate) : null, r2(x.taxable + taxOf(x)), x.rate, x.taxable, x.igst, x.cgst, x.sgst, 0, pos(x.c.state), null, null, null]));
  // HSN summary: per month, HSN and rate
  const hsnAgg = {};
  for (const x of sales) { const k = `${x.m}|${x.hsn[0]}|${x.rate}`; const a = (hsnAgg[k] ||= { m: x.m, hsn: x.hsn, rate: x.rate, qty: 0, value: 0, taxable: 0, igst: 0, cgst: 0, sgst: 0 }); a.qty += Math.round(x.taxable / x.hsn[3]); a.value += x.taxable + taxOf(x); a.taxable += x.taxable; a.igst += x.igst; a.cgst += x.cgst; a.sgst += x.sgst; }
  for (const c of cdns) { const a = hsnAgg[`${c.m}|${c.hsn[0]}|${c.rate}`] ||= { m: c.m, hsn: c.hsn, rate: c.rate, qty: 0, value: 0, taxable: 0, igst: 0, cgst: 0, sgst: 0 }; a.qty -= Math.round(c.taxable / c.hsn[3]); a.value -= c.taxable + taxOf(c); a.taxable -= c.taxable; a.igst -= c.igst; a.cgst -= c.cgst; a.sgst -= c.sgst; }
  Object.values(hsnAgg).forEach((a, i) => S.GSTR1_HSNSummary.push([i + 1, monthOf(a.m), a.hsn[0], a.hsn[1], a.hsn[2], a.qty, r2(a.value), r2(a.taxable), a.rate, r2(a.igst), r2(a.cgst), r2(a.sgst), 0]));
  // document summary: the series as issued (gaps are not reported as cancelled)
  for (let m = 0; m < 12; m++) {
    const inv = sales.filter((x) => x.m === m).sort((a, b) => a.seq - b.seq);
    if (!inv.length) continue;
    S.GSTR1_DocIssued.push([S.GSTR1_DocIssued.length + 1, monthOf(m), 'Invoice for outward supply', inv[0].no, inv[inv.length - 1].no, inv.length, 0, inv.length]);
    const cn = cdns.filter((x) => x.m === m);
    if (cn.length) S.GSTR1_DocIssued.push([S.GSTR1_DocIssued.length + 1, monthOf(m), 'Credit Note', cn[0].no, cn[cn.length - 1].no, cn.length, 0, cn.length]);
  }
  // 2B and 2A
  let n2a = 0;
  for (const x of purchases) {
    const m2b = x.m2b ?? x.m;
    const row = [x.s.gstin, x.s.name, x.no];
    if (x.in2B !== false) S.GSTR2B_B2B.push([monthOf(m2b), ...row, 'Regular', serial(x.date), r2(x.taxable + taxOf(x)), pos(own), x.rc ? 'Yes' : 'No', x.rate, x.taxable, x.igst, x.cgst, x.sgst, 0, periodCode(x.m), g1Filed(x.m), 'Yes', null, null, null, null, null]);
    if (x.in2A !== false) S.GSTR2A_B2B.push([++n2a, monthOf(x.m), x.s.gstin, x.s.name, x.no, serial(x.date), r2(x.taxable + taxOf(x)), x.rate, x.taxable, x.igst, x.cgst, x.sgst, 0, pos(own), x.rc ? 'Yes' : 'No', 'Regular', 'Yes', g1Filed(x.m), periodCode(x.m), x.filed3B ? 'Yes' : 'No', 'Yes', null, null, null]);
  }
  supplierCdns.forEach((x) => S.GSTR2B_CDNR.push([monthOf(x.m), x.s.gstin, x.s.name, x.no, 'Credit Note', 'Regular', serial(x.date), r2(x.taxable + taxOf(x)), pos(own), 'No', x.rate, x.taxable, x.igst, x.cgst, x.sgst, 0, periodCode(x.m), g1Filed(x.m), 'Yes', null, null, null, null, null]));

  // 3B sheets, ledgers, challans
  let sr = 0, lsr = 0, csr = 0, crsr = 0, chsr = 0;
  const bal = { cash: 0 };
  for (const p of periods) {
    const t = tb[p]; const M = monthOf(p);
    const sup = [[t.out.taxable, t.out.igst, t.out.cgst, t.out.sgst], [0, 0, 0, 0], [0, 0, 0, 0], [t.rcm.taxable, t.rcm.igst, t.rcm.cgst, t.rcm.sgst], [0, 0, 0, 0]];
    SUPPLY_ROWS.forEach((lbl, i) => S.GSTR3B_Supplies.push([++sr, M, lbl, ...sup[i].map(r2), 0]));
    const a3 = [t.rcm.igst, t.rcm.cgst, t.rcm.sgst];
    const a5 = [t.itc.igst, t.itc.cgst, t.itc.sgst];
    const totA = a3.map((v, i) => v + a5[i]);
    const itcVals = { '   (3) Inward Supplies liable to reverse charge(other than 1 & 2 above)': a3, '   (5) All other ITC': a5, 'Total ITC Available (A)': totA, '(C) Net ITC Available (A) – (B)': totA };
    ITC_ROWS.forEach((lbl) => S.GSTR3B_ITC.push([S.GSTR3B_ITC.length + 1, M, lbl, ...(itcVals[lbl] || [0, 0, 0]).map(r2), 0]));
    S.GSTR3B_Nil.push([S.GSTR3B_Nil.length + 1, M, 'From a supplier under composition scheme, Exempt and Nil rated Supply', 0, 0], [S.GSTR3B_Nil.length + 2, M, 'Non GST Supply', 0, 0]);
    const rcmCash = { igst: t.rcm.igst, cgst: t.rcm.cgst, sgst: t.rcm.sgst };
    for (const [lbl, k] of [['Integrated Tax', 'igst'], ['Central Tax', 'cgst'], ['State/UT Tax', 'sgst'], ['Cess', null]]) {
      const u = k ? t.use[k] : {};
      S.GSTR3B_PaymentofTax.push([lbl, M, r2(k ? t.liab[k] : 0), r2(u.igst || 0), r2(u.cgst || 0), r2(u.sgst || 0), 0, r2(k ? t.cash[k] : 0), r2(k ? rcmCash[k] : 0), r2(k ? rcmCash[k] : 0),
        k === 'cgst' ? r2(t.interest / 2) : k === 'sgst' ? r2(t.interest / 2) : 0, k === 'cgst' ? r2(t.interest / 2) : k === 'sgst' ? r2(t.interest / 2) : 0,
        k === 'cgst' ? r2(t.lateFee / 2) : k === 'sgst' ? r2(t.lateFee / 2) : 0, k === 'cgst' ? r2(t.lateFee / 2) : k === 'sgst' ? r2(t.lateFee / 2) : 0, null, null]);
    }
    S.GSTR3B_InterestLateFees.push(['Interest', M, 0, r2(t.interest / 2), r2(t.interest / 2), 0], ['Late Fees', M, 0, r2(t.lateFee / 2), r2(t.lateFee / 2), 0]);
    // liability ledger: debit on filing, then credits by credit and cash
    const fd = serial(t.filed);
    const L3 = [t.liab.igst, t.liab.cgst, t.liab.sgst].map(r2);
    const usedBy = ['igst', 'cgst', 'sgst'].map((k) => r2(Object.values(t.use[k]).reduce((a, b) => a + b, 0)));
    const cashBy = ['igst', 'cgst', 'sgst'].map((k) => t.cash[k]);
    const led = (arr, used, desc, type, total) => [++lsr, M, fd, `DC${t.y}${String(t.cm).padStart(2, '0')}${String(lsr).padStart(4, '0')}`, used, desc, type, ...arr, 0, r2(total), 0, 0, 0, 0, 0];
    S.LiabilityLedger.push(led(L3, null, 'Other than reverse charge', 'Debit', L3.reduce((a, b) => a + b, 0)));
    if (a3.some((v) => v)) S.LiabilityLedger.push(led(a3.map(r2), null, 'Reverse charge and supplies made u/s 9(5)', 'Debit', a3.reduce((a, b) => a + b, 0)));
    S.LiabilityLedger.push(led(usedBy, 'Credit', 'Other than reverse charge', 'Credit', usedBy.reduce((a, b) => a + b, 0)));
    S.LiabilityLedger.push(led(cashBy, 'Cash', 'Other than reverse charge', 'Credit', cashBy.reduce((a, b) => a + b, 0)));
    if (a3.some((v) => v)) S.LiabilityLedger.push(led(a3.map(r2), 'Cash', 'Reverse charge and supplies made u/s 9(5)', 'Credit', a3.reduce((a, b) => a + b, 0)));
    // cash ledger: deposit a day before filing, then debits
    const cashNeed = cashBy.reduce((a, b) => a + b, 0) + a3.reduce((a, b) => a + b, 0) + t.interest + t.lateFee;
    const dep = serial(addDays(t.filed, -1));
    const cl = (date, desc, type, arr) => [++csr, M, date, type === 'Credit' ? '11:42:10' : null, type === 'Credit' ? date : null, type === 'Credit' ? `CPIN${String(csr).padStart(10, '0')}` : `DC${String(csr).padStart(8, '0')}`, `${String(t.cm).padStart(2, '0')}-${t.y}`, desc, type, ...arr.map(r2), 0, r2(arr.reduce((a, b) => a + b, 0)), 0, 0, 0, 0, r2(bal.cash)];
    if (cashNeed > 0) {
      const depArr = [cashBy[0] + a3[0], cashBy[1] + a3[1] + (t.interest + t.lateFee) / 2, cashBy[2] + a3[2] + (t.interest + t.lateFee) / 2];
      S.CashLedger.push(cl(dep, 'Amount deposited', 'Credit', depArr));
      S.CashLedger.push(cl(fd, 'Other than reverse charge', 'Debit', cashBy));
      if (a3.some((v) => v)) S.CashLedger.push(cl(fd, 'Reverse charge', 'Debit', a3));
      if (t.interest) S.CashLedger.push(cl(fd, 'Interest', 'Debit', [0, t.interest / 2, t.interest / 2]));
      S.Challan.push([++chsr, M, `${t.y}${String(t.cm).padStart(2, '0')}${String(10000000 + chsr * 7919).slice(-8)}`, dep, r2(cashNeed), 'E-Payment', dep + 15, dep, 'PAID']);
    }
    // credit ledger: accrual and utilisation
    const cr = (desc, type, arr) => [++crsr, M, fd, `IT${String(crsr).padStart(8, '0')}`, `${String(t.cm).padStart(2, '0')}-${t.y}`, desc, type, ...arr.map(r2), 0, r2(arr.reduce((a, b) => a + b, 0)), 0, 0, 0, 0, 0];
    S.CreditLedger.push(cr('ITC accrued through - Inputs', 'Credit', totA));
    S.CreditLedger.push(cr('Other than reverse charge', 'Debit', ['igst', 'cgst', 'sgst'].map((k) => Object.entries(t.use).reduce((a, [, u]) => a + (u[k] || 0), 0))));
  }

  // ------------------------------------------------------------------ workbook
  const wb = XLSX.utils.book_new();
  const fyLabel = `${fy} - ${fy + 1}`;
  for (const [name, header] of Object.entries(H)) {
    const banner = [[null, 'Company Name : ', r.name], [null, 'Company GSTN : ', r.gstin], [null, 'Return Period : ', fyLabel, 'http://www.microvistatech.com'], [null, 'Report Name : ', name.replace(/_/g, '-')], []];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...banner, header, ...S[name]]), name);
  }
  wb.Props = { Title: r.title || 'SYNTHETIC TEST DATA - not a real taxpayer', Author: 'GST Intelligence test-data generator', CreatedDate: new Date(`${r.extractDate}T10:30:00Z`) };
  return { wb, stats: { sales: sales.length, cdns: cdns.length, purchases: purchases.length, periods: periods.length } };
}
