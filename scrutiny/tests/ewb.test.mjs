// E-way bills: when a bill is needed (rule 138), the reconciliation against the returns (G-05, B-03, D-05, vehicles),
// the simulated system's consistency between a seller's and a buyer's copy, and the export layout.
import test from 'node:test';
import assert from 'node:assert/strict';
import { needsEwb, ewbLimit, reconcileEwb, parseEwbRows, ewbToRow, EWB_COLUMNS, distanceKm } from '../src/engine/ewb.js';
import { stateCodeOf } from '../src/engine/parse.js';
import { simulate } from '../scripts/synth/ewb.mjs';
import { gstin } from '../scripts/synth/lib.mjs';

const S = gstin(27, 'ZZSCS1111A'), B = gstin(24, 'ZZBCB2222B'), C = gstin(27, 'ZZCCC3333C');

test('ewb: limits and exemptions under rule 138', () => {
  assert.equal(ewbLimit('27', '24'), 50000);
  assert.equal(ewbLimit('27', '27'), 100000, 'Maharashtra notified ₹1 lakh within the state');
  assert.equal(ewbLimit('24', '24'), 50000);
  assert.equal(needsEwb({ supplierName: 'ACME STEEL LIMITED', value: 60000, fromState: '27', toState: '24', hsn: '7208' }), true);
  assert.equal(needsEwb({ supplierName: 'ACME STEEL LIMITED', value: 80000, fromState: '27', toState: '27', hsn: '7208' }), false);
  assert.equal(needsEwb({ supplierName: 'ACME STEEL LIMITED', value: 120000, fromState: '27', toState: '27', hsn: '7208' }), true);
  assert.equal(needsEwb({ supplierName: 'ACME ROADWAYS', value: 900000, fromState: '27', toState: '24', hsn: '' }), false, 'services never move on a bill');
  assert.equal(needsEwb({ supplierName: 'ACME TRADERS', value: 900000, fromState: '27', toState: '24', hsn: '7113' }), false, 'jewellery is exempt');
  assert.ok(distanceKm('400002', '411001') > 120 && distanceKm('400002', '411001') < 250, 'Mumbai to Pune by road');
});

// A seller in Maharashtra with three invoices, and its bills.
const inv = (no, to, pos, value, heads) => ({ m: 5, gstin: to, party: 'BUYER', no, date: '2025-09-10', value, taxable: value / 1.18, ...heads, pos, rc: false });
const tp = {
  gstin: S, name: 'SELLER STEEL PRIVATE LIMITED', stateCode: '27', fyStart: 2025, hsn: [{ m: 5, hsn: '7208', taxable: 1e7 }],
  b2b: [
    inv('INV/1', B, 'Gujarat', 590000, { igst: 90000, cgst: 0, sgst: 0 }),
    inv('INV/2', C, 'Maharashtra', 1180000, { igst: 0, cgst: 90000, sgst: 90000 }),
    inv('INV/3', B, 'Gujarat', 590000, { igst: 0, cgst: 45000, sgst: 45000 }), // billed to Gujarat, charged as intra-state
  ],
  g2b: [
    { m: 5, gstin: C, party: 'OTHER STEEL TRADERS', no: 'P/9', date: '2025-09-02', value: 2360000, taxable: 2e6, igst: 0, cgst: 180000, sgst: 180000, rc: false },
  ],
};
const bill = (o) => ({ no: '1', at: '2025-09-10T10:00', doc: 'Tax Invoice', from: S, fromState: '27', fromPin: '400002', to: B, toState: '24', toPin: '380001', shipTo: '', total: 590000, igst: 90000, cgst: 0, sgst: 0, status: 'Active', vehicle: 'MH01AB1234', ...o });

test('ewb: reconciliation finds each kind of problem', () => {
  const ewb = {
    source: 'test',
    outward: [
      bill({ no: '101', docNo: 'INV/1' }),
      bill({ no: '102', docNo: 'INV/2', to: C, toState: '27', toPin: '411001', total: 1180000, vehicle: 'MH01AB9999' }),
      bill({ no: '103', docNo: 'INV/3', shipTo: '27', toPin: '400601', vehicle: 'MH01AB5555' }), // bill-to Gujarat, delivered in Maharashtra
      bill({ no: '104', docNo: 'INV/77', to: 'URP', total: 300000, vehicle: 'MH01AB7777' }), // no invoice in GSTR-1
    ],
    inward: [bill({ no: '201', from: C, to: S, docNo: 'OTHER', fromPin: '440001', at: '2025-09-10T11:00', vehicle: 'MH01AB1234' })], // same truck, Nagpur, an hour later
  };
  const r = reconcileEwb(tp, ewb, stateCodeOf);
  assert.equal(r.outward.unmatched.count, 1, 'G-05: one bill with no invoice');
  assert.equal(r.outward.unmatched.rows[0].docNo, 'INV/77');
  assert.equal(r.inward.unsupported.count, 1, 'B-03: the purchase has no bill behind it');
  assert.equal(r.inward.unsupported.itc, 360000);
  assert.equal(r.shipTo.moves, 1);
  assert.equal(r.shipTo.wrongHead.count, 1, 'D-05: billed to Gujarat, so IGST, not CGST+SGST');
  assert.equal(r.vehicles.clashes, 1, 'one truck in Mumbai and Nagpur an hour apart');
  assert.equal(r.outward.missing.count, 0);
});

test('ewb: cancelled bills do not count as movement', () => {
  const r = reconcileEwb(tp, { outward: [bill({ no: '104', docNo: 'INV/77', status: 'Cancelled' })], inward: [] }, stateCodeOf);
  assert.equal(r.outward.unmatched.count, 0);
  assert.equal(r.outward.cancelled, 1);
});

test('ewb: simulated seller and buyer copies agree, including the planted gaps', () => {
  const seller = { gstin: S, name: 'SELLER STEEL PRIVATE LIMITED', stateCode: '27', fyStart: 2025, hsn: [{ m: 5, hsn: '7208', taxable: 1e7 }], g2b: [],
    b2b: Array.from({ length: 40 }, (_, i) => inv(`S/${i}`, B, 'Gujarat', 200000 + i * 1000, { igst: 30000, cgst: 0, sgst: 0 })) };
  const buyer = { gstin: B, name: 'BUYER FORGINGS LIMITED', stateCode: '24', fyStart: 2025, hsn: [{ m: 5, hsn: '8708', taxable: 1e7 }], b2b: [],
    g2b: seller.b2b.map((x) => ({ ...x, gstin: S, party: seller.name })) };
  const plan = { nm: new Map([[`${S}|${B}`, 0.5]]), suppressed: {}, vehicleClash: {}, cancel: {}, shipTo: {} };
  const out = simulate(seller, plan).outward.filter((b) => b.status === 'Active');
  const inw = simulate(buyer, plan).inward;
  assert.ok(out.length > 5 && out.length < 35, `about half never moved (${out.length} of 40 have bills)`);
  assert.deepEqual(out.map((b) => b.docNo).sort(), inw.map((b) => b.docNo).sort(), 'the same documents have bills on both sides');
  assert.deepEqual(out.map((b) => b.no).sort(), inw.map((b) => b.no).sort(), 'with the same bill numbers');
  assert.deepEqual(simulate(seller, plan).outward, simulate(seller, plan).outward, 'deterministic');
});

test('ewb: the export layout reads back', () => {
  const b = bill({ no: '331000000001', docNo: 'INV/1', docDate: '2025-09-10', hsn: '7208', taxable: 500000, cess: 0, mode: 'Road', transporter: '', km: 550, validUpto: '2025-09-13T23:59', supply: 'Outward', sub: 'Supply', fromName: 'A', toName: 'B' });
  const row = Object.fromEntries(EWB_COLUMNS.map((c, i) => [c, ewbToRow(b)[i]]));
  const { bills, errors } = parseEwbRows([row]);
  assert.deepEqual(errors, []);
  assert.equal(bills[0].no, '331000000001');
  assert.equal(bills[0].total, 590000);
  assert.equal(bills[0].docNo, 'INV/1');
});
