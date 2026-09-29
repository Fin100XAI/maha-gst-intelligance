// Synthetic "Get Download All Report" workbooks for end-to-end testing.
// Every figure is generated: company names end in [TEST] and every PAN starts with "ZZ", so no real taxpayer or
// counterparty is represented. Each workbook plants specific issues; test-data/README.md lists what the engine
// should find. Deterministic: the same seed always writes the same workbooks.
//   node scripts/make-test-data.mjs            -> test-data/*.xlsx
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { r2, gstin, makeRng, dayIn, heads } from './synth/lib.mjs';
import { writeReturns } from './synth/workbook.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(root, 'test-data'); // OUT_DIR: tests write elsewhere
const EXTRACT_DATE = '2026-09-26'; // workbook creation date = date the extract was downloaded

// ------------------------------------------------------------------ one taxpayer: invent its documents, then write them
function build(cfg) {
  const g = makeRng(cfg.seed);
  const fy = cfg.fy;
  const own = String(cfg.state).padStart(2, '0');
  const party = (names, states, type = 'C') => names.map((n, i) => ({ name: n, state: String(states[i % states.length]).padStart(2, '0'), gstin: gstin(states[i % states.length], g.pan(type)) }));
  const customers = party(cfg.customers, cfg.customerStates);
  const suppliers = party(cfg.suppliers, cfg.supplierStates);

  // ---- outward invoices (GSTR-1 B2B)
  const sales = [];
  let seq = 0;
  for (let m = 0; m < 12; m++) {
    const n = Math.round(cfg.salesPerMonth * (cfg.salesShape?.[m] ?? 1));
    for (let k = 0; k < n; k++) {
      const c = cfg.pickCustomer ? cfg.pickCustomer(g, customers, m, k) : g.pick(customers);
      const rate = g.pick(cfg.salesRates);
      let taxable = r2(g.logU(cfg.saleMin, cfg.saleMax));
      seq += cfg.skipNumbers?.(g, m, k) ?? 1;
      const date = dayIn(g, fy, m, { sundays: cfg.sundays });
      const h = heads(taxable, rate, c.state === own);
      sales.push({ m, c, no: `${cfg.prefix}/${String(fy).slice(2)}-${String(fy + 1).slice(2)}/${String(seq).padStart(4, '0')}`, seq, date, rate, taxable, ...h, hsn: g.pick(cfg.hsn) });
    }
  }
  cfg.plantSales?.(g, sales, { customers, own, heads, fy });

  // ---- outward credit notes (GSTR-1 CDN)
  const cdns = cfg.creditNotes ? cfg.creditNotes(g, sales, { customers, own, heads, fy }) : [];

  // ---- inward invoices (2B / 2A)
  const purchases = [];
  const supSeq = {};
  for (let m = 0; m < 12; m++) {
    const n = Math.round(cfg.purchasesPerMonth * (cfg.purchaseShape?.[m] ?? 1));
    for (let k = 0; k < n; k++) {
      const s = cfg.pickSupplier ? cfg.pickSupplier(g, suppliers, m, k) : g.pick(suppliers);
      const rate = g.pick(cfg.purchaseRates);
      const taxable = r2(g.logU(cfg.buyMin, cfg.buyMax));
      supSeq[s.gstin] = (supSeq[s.gstin] || g.ri(100, 900)) + g.ri(1, 6);
      const date = dayIn(g, fy, m, { sundays: true });
      purchases.push({ m, s, no: `${s.name.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase()}${supSeq[s.gstin]}`, date, rate, taxable, ...heads(taxable, rate, s.state === own), rc: false, filed3B: true });
    }
  }
  cfg.plantPurchases?.(g, purchases, { suppliers, customers, own, heads, fy, gstin, pan: g.pan });
  const supplierCdns = cfg.supplierCreditNotes ? cfg.supplierCreditNotes(g, purchases) : [];

  return writeReturns({ ...cfg, extractDate: EXTRACT_DATE, sales, cdns, purchases, supplierCdns }, { filingLead: () => g.ri(1, 4) });
}

// ------------------------------------------------------------------ the four synthetic taxpayers
const HSN_FOOD = [['2008', 'Prepared fruits and nuts', 'KGS-KILOGRAMS', 180], ['2106', 'Food preparations n.e.s.', 'KGS-KILOGRAMS', 240], ['1904', 'Breakfast cereals', 'KGS-KILOGRAMS', 160]];
const HSN_STEEL = [['7214', 'Bars and rods of iron', 'MTS-METRIC TON', 58000], ['7208', 'Hot-rolled flat products', 'MTS-METRIC TON', 62000], ['7306', 'Tubes and pipes', 'MTS-METRIC TON', 71000]];
const HSN_SVC = [['996511', 'Road transport of goods (GTA)', 'OTH-OTHERS', 1], ['996729', 'Cargo handling and warehousing', 'OTH-OTHERS', 1]];
const HSN_TEX = [['5407', 'Woven fabrics of synthetic yarn', 'MTR-METERS', 95], ['5515', 'Woven fabrics of synthetic staple', 'MTR-METERS', 110]];

const TAXPAYERS = [
  {
    key: 'sahyadri', seed: 101, state: 27, fy: 2025, filing: 'monthly', irn: true, prefix: 'SAF',
    name: 'SAHYADRI AGRO FOODS PRIVATE LIMITED [TEST]', pan: 'ZZSCS4821K',
    customers: ['Metro Cash Retail LLP', 'Shree Samarth Distributors', 'Konkan Wholesale Mart', 'Annapurna Supermarkets', 'Deccan Food Traders', 'Goa Hospitality Supplies', 'Indore Grocery Hub'],
    customerStates: [27, 27, 27, 27, 27, 30, 23],
    suppliers: ['Nashik Fruit Growers Co-op', 'Vidarbha Grain Mills', 'Pune Packaging Industries', 'Kolhapur Sugar Works', 'Satara Cold Chain Services', 'Aurangabad Label Printers'],
    supplierStates: [27, 27, 27, 27, 27, 27],
    salesPerMonth: 60, saleMin: 10000, saleMax: 1000000, salesRates: [5, 12, 12], hsn: HSN_FOOD,
    purchasesPerMonth: 42, buyMin: 6000, buyMax: 600000, purchaseRates: [5, 12, 18],
    // clean: GTA services on reverse charge, declared and paid in cash
    plantPurchases: (g, P, { own, heads }) => { const gta = { name: 'Western Roadlines Transport', state: '27', gstin: gstin(27, g.pan('F')) }; for (let m = 0; m < 12; m++) { const t = r2(g.logU(40000, 120000)); P.push({ m, s: gta, no: `WRT${500 + m}`, date: `${m <= 8 ? 2025 : 2026}-${String(((m + 3) % 12) + 1).padStart(2, '0')}-15`, rate: 5, taxable: t, ...heads(t, 5, true), rc: true, filed3B: true }); } },
  },
  {
    key: 'konkan', seed: 202, state: 27, fy: 2024, filing: 'monthly', irn: true, prefix: 'KST',
    name: 'KONKAN STEEL TRADERS [TEST]', pan: 'ZZKPK7730D',
    customers: ['Raigad Fabricators', 'Thane Infra Builders', 'Bhiwandi Engineering Works', 'Vapi Structural Pvt Ltd', 'Hubli Steel Structures'],
    customerStates: [27, 27, 27, 24, 29],
    suppliers: ['Jindal Coils Distributors', 'Mahalaxmi Ispat', 'Bharat Metal Corporation', 'Sri Balaji Iron Traders', 'Sangli Steel Rolling Mills'],
    supplierStates: [27, 27, 27, 27, 27],
    salesPerMonth: 40, saleMin: 20000, saleMax: 2000000, salesRates: [18], hsn: HSN_STEEL,
    purchasesPerMonth: 36, buyMin: 18000, buyMax: 1800000, purchaseRates: [18],
    pickSupplier: (g, S, m) => (m >= 5 && m <= 8 && g.rnd() < 0.2 ? S[2 + Math.floor(g.rnd() * 2)] : g.pick([S[0], S[1], S[4]])),
    plantPurchases: (g, P) => {
      // suppliers 3 and 4 never filed GSTR-3B for their Sep-Dec invoices (FY 2024-25 -> Rule 37A Red)
      for (const x of P) if (/Bharat Metal|Sri Balaji/.test(x.s.name)) x.filed3B = false;
      // an exact duplicate: the same supplier invoice appears again in the next month's 2B
      const d = P.find((x) => x.m === 4 && /Jindal/.test(x.s.name)); if (d) P.push({ ...d, m2b: 5 });
    },
    excessItc: { 3: 210000, 4: 245000, 5: 185000 },             // ITC claimed beyond 2B in Jul-Sep (₹6.4 L)
    underDeclare: { 7: { taxable: 3000000, tax: 540000 } },      // Nov: ₹30 L of GSTR-1 sales left out of 3B
    filedOn: { 6: '2024-12-15', 9: '2025-02-21' },               // Oct filed 25 days late; Jan filed 1 day late
  },
  {
    key: 'deccan', seed: 303, state: 29, fy: 2025, filing: 'qrmp', irn: false, prefix: 'DFL',
    name: 'DECCAN FREIGHT LOGISTICS LLP [TEST]', pan: 'ZZDFD5512Q',
    customers: ['Vega Retail India', 'Mysore Silk Emporium', 'Nandi Transport Co', 'Chennai Auto Components', 'Hosur Electricals'],
    customerStates: [29, 29, 29, 33, 33],
    suppliers: ['Bharath Fuel Stations', 'Nandi Transport Co', 'Karnataka Tyre House', 'Bengaluru Legal Associates'],
    supplierStates: [29, 29, 29, 29],
    salesPerMonth: 26, saleMin: 4000, saleMax: 400000, salesRates: [12, 18], hsn: HSN_SVC,
    purchasesPerMonth: 14, buyMin: 2000, buyMax: 200000, purchaseRates: [18, 28],
    pickCustomer: (g, C, m, k) => (k % 9 === 0 ? C[2] : g.pick(C)),
    plantSales: (g, S, { heads }) => {
      // Chennai customer billed with CGST + SGST: wrong head for an inter-state supply
      let n = 0; for (const x of S) if (x.c.state === '33' && n < 6) { Object.assign(x, heads(x.taxable, x.rate, true)); n++; }
    },
    plantPurchases: (g, P, { suppliers, customers, heads }) => {
      // the same party both buys and sells (circular trading pattern)
      const nandi = suppliers[1]; nandi.gstin = customers.find((c) => /Nandi/.test(c.name)).gstin; for (let m = 0; m < 12; m++) { const t = r2(g.logU(150000, 400000)); P.push({ m, s: nandi, no: `NTC${800 + m}`, date: `${m <= 8 ? 2025 : 2026}-${String(((m + 3) % 12) + 1).padStart(2, '0')}-12`, rate: 12, taxable: t, ...heads(t, 12, true), rc: false, filed3B: true }); }
      // legal services and GTA on reverse charge
      const legal = suppliers[3]; for (let m = 1; m < 12; m += 2) { const t = r2(g.logU(60000, 180000)); P.push({ m, s: legal, no: `BLA${20 + m}`, date: `${m <= 8 ? 2025 : 2026}-${String(((m + 3) % 12) + 1).padStart(2, '0')}-08`, rate: 18, taxable: t, ...heads(t, 18, true), rc: true, filed3B: true }); }
    },
    rcmDeclaredShare: 0.2,                                        // only 20% of reverse-charge tax declared in 3.1(d)
    creditNotes: (g, S) => {
      const vega = S.filter((x) => /Vega/.test(x.c.name)); const out = []; let n = 0;
      for (const [i, x] of vega.entries()) {
        if (i % 2) continue;
        const march = n < 16; const m = march ? 11 : x.m; const t = r2(x.taxable * 0.85);
        out.push({ m, c: x.c, hsn: x.hsn, no: `DFL/CN/${String(++n).padStart(3, '0')}`, date: m === 11 ? `2026-03-${String(10 + (n % 18)).padStart(2, '0')}` : x.date, origNo: n % 5 === 0 ? null : x.no, origDate: n % 5 === 0 ? null : x.date, rate: x.rate, taxable: t, igst: 0, cgst: r2((t * x.rate) / 200), sgst: r2((t * x.rate) / 200) });
      }
      return out.sort((a, b) => a.m - b.m);
    },
  },
  {
    key: 'narmada', seed: 404, state: 24, fy: 2025, filing: 'monthly', irn: true, prefix: 'NSY',
    name: 'NARMADA SYNTHETICS PRIVATE LIMITED [TEST]', pan: 'ZZNCN3309H',
    customers: ['Surat Saree Kendra', 'Ahmedabad Garment Park', 'Rajkot Fashion House', 'Bhilwara Textile Traders', 'Mumbai Apparel Exports', 'Ichalkaranji Weavers'],
    customerStates: [24, 24, 24, '08', 27, 27],
    suppliers: ['Reliance Yarn Agencies', 'Silvassa Polyester Mills', 'Vapi Dyes and Chemicals', 'Gujarat Filament Traders', 'Navsari Yarn Suppliers'],
    supplierStates: [24, 24, 24, 24, 24],
    salesPerMonth: 70, saleMin: 7000, saleMax: 700000, salesRates: [5], hsn: HSN_TEX,
    purchasesPerMonth: 40, buyMin: 9000, buyMax: 900000, purchaseRates: [12, 18],
    salesShape: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3.6],             // March spike
    skipNumbers: (g, m, k) => (m === 6 && k % 7 === 3 ? 4 : 1),     // invoice numbers skipped in October
    plantSales: (g, S, { heads }) => {
      // many invoices kept just under the ₹50,000 e-way bill limit, and round-figure values
      S.filter((x) => x.m >= 3 && x.m <= 8).slice(0, 48).forEach((x) => { x.taxable = r2(g.ri(42900, 47500)); Object.assign(x, heads(x.taxable, x.rate, x.c.state === '24')); });
      S.filter((_, i) => i % 3 === 1).forEach((x) => { x.taxable = Math.max(10000, Math.round(x.taxable / 1000) * 1000); Object.assign(x, heads(x.taxable, x.rate, x.c.state === '24')); });
      // 15 invoices charged 2.5% instead of 5%
      S.filter((x) => x.m === 2).slice(0, 15).forEach((x) => { Object.assign(x, heads(x.taxable, 2.5, x.c.state === '24')); });
    },
    plantPurchases: (g, P) => {
      // two suppliers quote GSTINs that fail the check digit
      const bad = [{ name: 'Shiv Shakti Yarn House', state: '24', gstin: gstin(24, 'ZZSPS1188L', '1', false) }, { name: 'Maa Ambe Fibres', state: '24', gstin: gstin(24, 'ZZMPM6641C', '1', false) }];
      P.filter((_, i) => i % 23 === 5).forEach((x, i) => { x.s = bad[i % 2]; });
    },
  },
];

// ------------------------------------------------------------------ write
fs.mkdirSync(OUT, { recursive: true });
for (const cfg of TAXPAYERS) {
  cfg.gstin = gstin(cfg.state, cfg.pan);
  const { wb, stats } = build(cfg);
  const short = cfg.name.replace(/\s*\[TEST\]/, '').split(' ').slice(0, 2).map((w) => w[0] + w.slice(1).toLowerCase()).join(' ');
  const file = `Get Download All Report_${cfg.gstin}_${cfg.fy} - ${cfg.fy + 1}_TEST ${short}.xlsx`;
  fs.writeFileSync(path.join(OUT, file), XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));
  console.log(`${file}  ·  ${stats.sales} sales, ${stats.cdns} credit notes, ${stats.purchases} purchases, ${stats.periods} 3B periods`);
}
