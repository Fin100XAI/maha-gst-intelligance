// Synthetic ward "SYN-PUNE-01": 16 interlinked taxpayers over three financial years, with planted revenue-change
// drivers, network patterns and registers, plus an answer key measured from the generated data.
//
//   node scripts/synth/ward.mjs            -> test-data/ward/  (workbooks, registers/*.csv, answer-key.json)
//
// Everything is synthetic and labelled so: names end in [SYN], every PAN starts with "ZZ", the jurisdiction is
// SYN-PUNE-01. Transactions are generated ledger-first: an invoice between two ward taxpayers exists once and is
// projected into the seller's GSTR-1 and the buyer's GSTR-2A/2B, so the network is internally consistent.
// Deterministic: a fixed seed always writes the same files.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { MONTHS, r2, gstin, makeRng, heads, taxOf, calOf, iso } from './lib.mjs';
import { writeReturns } from './workbook.mjs';
import { buildCaseLog } from './cases.mjs';
import { pdf as pdfDoc, docx as docxDoc } from './docs.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'test-data', 'ward');
export const JURISDICTION = 'SYN-PUNE-01';
export const FYS = [2023, 2024, 2025];
const EXTRACT = { 2023: '2024-11-20', 2024: '2025-11-20', 2025: '2026-09-26' }; // when each year's download was taken
const RATE_CUT_FROM = '2025-09-22'; // modelled on the September 2025 rate rationalisation (12% -> 5% for listed goods)
const g = makeRng(2718);

// ------------------------------------------------------------------ calendar helpers
const lastDay = (fy, m) => { const { y, cm } = calOf(fy, m); return new Date(Date.UTC(y, cm, 0)).getUTCDate(); };
const dateIn = (fy, m, day) => { const { y, cm } = calOf(fy, m); return iso(y, cm, Math.min(day, lastDay(fy, m))); };
const workday = (fy, m) => { for (;;) { const d = dateIn(fy, m, g.ri(1, lastDay(fy, m))); if (new Date(`${d}T00:00:00Z`).getUTCDay() !== 0) return d; } };
// A date k days later, kept inside the same month (a pass-through sale books in the month the goods arrived).
const laterInMonth = (fy, m, date, k) => dateIn(fy, m, Math.min(Number(date.slice(8)) + k, lastDay(fy, m)));
const nextDue = (fy, p, day) => { const { y, cm } = calOf(fy, p); return cm === 12 ? iso(y + 1, 1, day) : iso(y, cm + 1, day); };

// ------------------------------------------------------------------ products (HSN tuple: code, description, UQC, unit price)
const P = {
  shaft: { hsn: ['8483', 'Transmission shafts and cranks', 'NOS-NUMBERS', 4200], rate: 18 },
  steel: { hsn: ['7214', 'Bars and rods of iron', 'MTS-METRIC TON', 58000], rate: 18 },
  sheet: { hsn: ['7208', 'Hot-rolled flat products', 'MTS-METRIC TON', 62000], rate: 18 },
  carton: { hsn: ['4819', 'Cartons and boxes of paper', 'NOS-NUMBERS', 38], rate: 18 },
  cereal: { hsn: ['1904', 'Breakfast cereals', 'KGS-KILOGRAMS', 160], rate: 12, cutTo: 5 },
  namkeen: { hsn: ['2106', 'Food preparations n.e.s.', 'KGS-KILOGRAMS', 240], rate: 12, cutTo: 5 },
  spices: { hsn: ['0910', 'Spices', 'KGS-KILOGRAMS', 320], rate: 5 },
  phone: { hsn: ['8517', 'Telephone sets and smartphones', 'NOS-NUMBERS', 14000], rate: 18 },
  laptop: { hsn: ['8471', 'Computers', 'NOS-NUMBERS', 52000], rate: 18 },
  fabric: { hsn: ['5208', 'Woven cotton fabrics', 'MTR-METERS', 140], rate: 5 },
  works: { hsn: ['995411', 'Construction services (works contract)', 'OTH-OTHERS', 1], rate: 18 },
  scrap: { hsn: ['7204', 'Ferrous waste and scrap', 'MTS-METRIC TON', 34000], rate: 18 },
  rice: { hsn: ['1006', 'Rice', 'KGS-KILOGRAMS', 48], rate: 5 },
  gta: { hsn: ['996511', 'Road transport of goods (GTA)', 'OTH-OTHERS', 1], rate: 12 },
  chem: { hsn: ['3824', 'Chemical preparations', 'KGS-KILOGRAMS', 210], rate: 18 },
  jewel: { hsn: ['7113', 'Articles of jewellery', 'GMS-GRAMMES', 6800], rate: 3 },
  screw: { hsn: ['7318', 'Screws, bolts and nuts', 'KGS-KILOGRAMS', 190], rate: 18 },
};
const rateOf = (prod, date) => (prod.cutTo && date >= RATE_CUT_FROM ? prod.cutTo : prod.rate);

// ------------------------------------------------------------------ the ward (annual external sales in FY 2023-24, ₹)
const FLAT = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const MILD = [0.92, 0.95, 0.97, 0.98, 1, 1.02, 1.05, 1.04, 1, 0.98, 1.02, 1.07];
const DIWALI = { 2023: [0.8, 0.8, 0.8, 0.85, 0.9, 0.95, 1.1, 2.4, 1.1, 0.8, 0.8, 0.9], 2024: [0.8, 0.8, 0.8, 0.85, 0.9, 1.0, 1.9, 1.7, 0.95, 0.8, 0.8, 0.9], 2025: [0.8, 0.8, 0.8, 0.85, 0.9, 1.05, 2.5, 1.0, 0.95, 0.8, 0.8, 0.9] };
const W = [
  { key: 'E01', short: 'Pune Auto', name: 'PUNE AUTO COMPONENTS PRIVATE LIMITED [SYN]', pan: 'ZZPCA1101K', sector: 'Auto components manufacturing', officer: 'Priya M.', range: 'Range 1', base: 900e6, growth: { 2023: 1, 2024: 1.08, 2025: 1.23 }, sell: [P.shaft], buy: [P.steel, P.sheet, P.carton], buyRatio: 0.52, custStates: [27, 27, 29, 33, 24, '07'], supStates: [27, 27, 24], season: MILD },
  { key: 'E02', short: 'Bhosari Steel', name: 'BHOSARI STEEL TRADERS [SYN]', pan: 'ZZBFB2202L', sector: 'Steel trading', officer: 'Priya M.', range: 'Range 1', base: 450e6, growth: { 2023: 1, 2024: 1.05, 2025: 1.1 }, sell: [P.steel, P.sheet], buy: [P.steel, P.sheet], buyRatio: 0.88, custStates: [27, 27, 27, 24], supStates: [27, 24, 29], season: MILD },
  { key: 'E03', short: 'Chakan Packaging', name: 'CHAKAN PACKAGING INDUSTRIES [SYN]', pan: 'ZZCFC3303M', sector: 'Packaging', officer: 'Rahul K.', range: 'Range 1', base: 60e6, growth: { 2023: 1, 2024: 1.06, 2025: 1.09 }, sell: [P.carton], buy: [P.carton], buyRatio: 0.6, custStates: [27, 27, 29], supStates: [27, 24], season: MILD },
  { key: 'E04', short: 'Hinjewadi Foods', name: 'HINJEWADI FOODS PRIVATE LIMITED [SYN]', pan: 'ZZHCH4404N', sector: 'Packaged food', officer: 'Rahul K.', range: 'Range 2', base: 450e6, growth: { 2023: 1, 2024: 1.04, 2025: 1.06 }, sell: [P.cereal, P.namkeen, P.spices], buy: [P.carton, P.rice, P.spices], buyRatio: 0.5, custStates: [27, 27, 27, 30, 23, 29], supStates: [27, 27], season: MILD },
  { key: 'E05', short: 'Kharadi Electronics', name: 'KHARADI ELECTRONICS DISTRIBUTION [SYN]', pan: 'ZZKCK5505P', sector: 'Electronics distribution', officer: 'Rahul K.', range: 'Range 2', base: 300e6, growth: { 2023: 1, 2024: 1.05, 2025: 1.05 }, sell: [P.phone, P.laptop], buy: [P.phone, P.laptop], buyRatio: 0.86, custStates: [27, 27, 27, 29, 29], supStates: [27, 29, '07'], season: MILD },
  { key: 'E06', short: 'Wakad Textiles', name: 'WAKAD TEXTILES [SYN]', pan: 'ZZWFW6606Q', sector: 'Textiles', officer: 'Anita S.', range: 'Range 2', base: 180e6, growth: { 2023: 1, 2024: 1.03, 2025: 1.03 }, sell: [P.fabric], buy: [P.fabric], buyRatio: 0.62, custStates: [27, 24, 27, 33], supStates: [27, 24], season: MILD },
  { key: 'E07', short: 'Talegaon Infra', name: 'TALEGAON INFRA PROJECTS PRIVATE LIMITED [SYN]', pan: 'ZZTCT7707R', sector: 'Construction (works contract)', officer: 'Anita S.', range: 'Range 3', base: 400e6, growth: { 2023: 1, 2024: 1.04, 2025: 1.05 }, sell: [P.works], buy: [P.steel, P.sheet], buyRatio: 0.42, custStates: [27, 27, 27], supStates: [27, 24], season: MILD },
  { key: 'E08', short: 'Swift Trade Links', name: 'SWIFT TRADE LINKS [SYN]', pan: 'ZZSFS8808S', sector: 'Scrap trading', officer: 'Anita S.', range: 'Range 3', base: 0, growth: {}, sell: [P.scrap], buy: [P.scrap], buyRatio: 0, custStates: [27], supStates: [27], season: FLAT },
  { key: 'E09', short: 'Shree Balaji', name: 'SHREE BALAJI ENTERPRISES [SYN]', pan: 'ZZSPS9909T', sector: 'Scrap trading', officer: 'Anita S.', range: 'Range 3', base: 40e6, growth: { 2023: 1, 2024: 1, 2025: 1 }, sell: [P.scrap], buy: [P.scrap], buyRatio: 0.9, custStates: [27, 27], supStates: [27], season: FLAT },
  { key: 'E10', short: 'Omkar Metals', name: 'OMKAR METALS [SYN]', pan: 'ZZOFO1010U', sector: 'Metal trading', officer: 'Anita S.', range: 'Range 3', base: 70e6, growth: { 2023: 1, 2024: 1.02, 2025: 1.03 }, sell: [P.scrap, P.steel], buy: [P.scrap], buyRatio: 0.8, custStates: [27, 27, 24], supStates: [27], season: FLAT },
  { key: 'E11', short: 'Nashik Agro', name: 'NASHIK AGRO TRADERS [SYN]', pan: 'ZZNFN1111V', sector: 'Agro trading', officer: 'Rahul K.', range: 'Range 2', base: 200e6, growth: { 2023: 1, 2024: 1.05, 2025: 1.07 }, sell: [P.rice], buy: [P.rice], buyRatio: 0.84, custStates: [27, 27, 30], supStates: [27], season: [1.2, 1.1, 0.9, 0.8, 0.8, 0.9, 1.2, 1.3, 1.1, 0.9, 0.9, 0.9] },
  { key: 'E12', short: 'Sai Logistics', name: 'SAI LOGISTICS [SYN]', pan: 'ZZSPS1212W', sector: 'Goods transport (GTA)', officer: 'Rahul K.', range: 'Range 1', filing: 'qrmp', base: 24e6, growth: { 2023: 1, 2024: 1.06, 2025: 1.08 }, sell: [P.gta], buy: [P.screw], buyRatio: 0.25, custStates: [27, 27], supStates: [27], season: FLAT },
  { key: 'E13', short: 'Deccan Chemicals', name: 'DECCAN CHEMICALS DISTRIBUTORS [SYN]', pan: 'ZZDFD1313X', sector: 'Chemicals distribution', officer: 'Priya M.', range: 'Range 2', base: 350e6, growth: { 2023: 1, 2024: 1.05, 2025: 1.06 }, sell: [P.chem], buy: [P.chem], buyRatio: 0.82, custStates: [27, 27, 24, 29], supStates: [27, 24], season: MILD },
  { key: 'E14', short: 'Mahalaxmi Jewellers', name: 'MAHALAXMI JEWELLERS [SYN]', pan: 'ZZMFM1414Y', sector: 'Jewellery retail', officer: 'Priya M.', range: 'Range 1', base: 280e6, growth: { 2023: 1, 2024: 1.06, 2025: 1.07 }, sell: [P.jewel], buy: [P.jewel], buyRatio: 0.88, custStates: [27, 27, 27], supStates: [27, 24], season: null },
  { key: 'E15', short: 'Ganesh Hardware', name: 'GANESH HARDWARE MART [SYN]', pan: 'ZZGPG1515Z', sector: 'Hardware retail', officer: 'Priya M.', range: 'Range 1', filing: 'qrmp', base: 30e6, growth: { 2023: 1, 2024: 1.04, 2025: 1.05 }, sell: [P.screw], buy: [P.screw], buyRatio: 0.74, custStates: [27, 27], supStates: [27], season: FLAT },
  { key: 'E16', short: 'Vista Trading', name: 'VISTA TRADING CO [SYN]', pan: 'ZZVFV1616A', sector: 'Scrap trading', officer: 'Anita S.', range: 'Range 3', base: 0, growth: {}, sell: [P.scrap], buy: [P.scrap], buyRatio: 0, custStates: [27], supStates: [27], season: FLAT, activeFrom: { fy: 2025, m: 3 } },
];
const E = Object.fromEntries(W.map((e) => [e.key, e]));
for (const e of W) { e.state = '27'; e.gstin = gstin(27, e.pan); e.inWard = true; e.filing ||= 'monthly'; e.prefix = e.key; }

// ------------------------------------------------------------------ external counterparties (outside the ward)
const FIRST = ['Shree', 'Om', 'Sai', 'Jai', 'Laxmi', 'Siddhi', 'Mangal', 'Vighnaharta', 'Surya', 'Krishna', 'Datta', 'Mauli', 'Ganga', 'Tulja', 'Vishwa', 'Navkar'];
const LAST = ['Enterprises', 'Traders', 'Industries', 'Distributors', 'Agencies', 'Corporation', 'Udyog', 'Suppliers', 'Marketing', 'Sales'];
const externals = [];
const makeExternal = (state, hint) => {
  const x = { key: `X${externals.length + 1}`, name: `${g.pick(FIRST)} ${hint} ${g.pick(LAST)} [SYN]`, state: String(state).padStart(2, '0'), inWard: false };
  x.gstin = gstin(state, g.pan(g.pick(['C', 'F', 'P'])));
  externals.push(x);
  return x;
};
for (const e of W) {
  e.customers = e.custStates.map((s) => makeExternal(s, e.sector.split(' ')[0]));
  e.suppliers = e.supStates.map((s) => makeExternal(s, e.sell[0].hsn[1].split(' ')[0]));
}
// Kharadi's Karnataka branch: another registration of the same PAN (a distinct person under GST).
const kaBranch = { key: 'X_KA', name: 'KHARADI ELECTRONICS DISTRIBUTION - KARNATAKA [SYN]', state: '29', inWard: false, gstin: gstin(29, E.E05.pan), sameAs: 'E05' };
externals.push(kaBranch);
// A supplier to Bhosari Steel whose registration is cancelled on 31-01-2025, yet invoices keep coming.
const cancelled = { key: 'X_NIM', name: 'NAGPUR IRON MART [SYN]', state: '27', inWard: false, gstin: gstin(27, 'ZZNPN4040B'), cancelledOn: '2025-01-31' };
externals.push(cancelled);

// ------------------------------------------------------------------ the ledger
const ledger = []; // { fy, m, seller, buyer, date, prod, rate, taxable, tags[] }
const add = (fy, m, seller, buyer, date, prod, taxable, tags = []) => {
  const rate = rateOf(prod, date);
  ledger.push({ fy, m, seller, buyer, date, prod, rate, taxable: r2(taxable), tags });
};
// Split a monthly amount into invoices spanning two decades (so first digits follow Benford's law).
const split = (amount, typical) => {
  const out = [];
  let left = amount;
  while (left > typical * 0.2) { const v = Math.min(left, g.logU(typical / 10, typical * 10) / 2.15); out.push(v); left -= v; }
  if (left > 0 && out.length) out[out.length - 1] += left;
  return out;
};
const seasonOf = (e, fy, m) => (e.season ? e.season[m] : DIWALI[fy][m]);

const truth = { drivers: {}, network: {}, filing: {} };
for (const fy of FYS) {
  for (let m = 0; m < 12; m++) {
    for (const e of W) {
      if (e.activeFrom && (fy < e.activeFrom.fy || (fy === e.activeFrom.fy && m < e.activeFrom.m))) continue;
      if (!e.base) continue;
      let monthly = (e.base / 12) * (e.growth[fy] || 1) * seasonOf(e, fy, m) * (0.96 + g.rnd() * 0.08);
      const typical = monthly / 12;
      let customers = e.customers;
      // E05: from July 2025, 40% of sales move to the Karnataka branch (same PAN). The branch buys most of its stock
      // directly; only a quarter of the moved sales still goes out of Pune as stock transfers (a taxable supply).
      if (e.key === 'E05' && fy === 2025 && m >= 3) {
        const shifted = monthly * 0.4;
        (truth.drivers.E05 ||= { branchShiftedSales: 0, transfersToBranch: 0 }).branchShiftedSales += shifted;
        monthly -= shifted;
        for (const v of split(shifted * 0.25, typical)) { add(fy, m, e, kaBranch, workday(fy, m), g.pick(e.sell), v, ['branch-transfer']); truth.drivers.E05.transfersToBranch += r2(v); }
      }
      // E06: its largest customer (about 30% of sales) stops buying from August 2025; the volume goes with it.
      if (e.key === 'E06' && fy === 2025 && m >= 4) { customers = e.customers.slice(1); monthly *= 0.7; }
      for (const v of split(monthly, typical)) {
        const c = e.key === 'E06' && customers === e.customers ? (g.rnd() < 0.3 ? e.customers[0] : g.pick(e.customers.slice(1))) : g.pick(customers);
        add(fy, m, e, c, workday(fy, m), g.pick(e.sell), v, c === e.customers[0] && e.key === 'E06' ? ['lost-customer'] : []);
      }
      // external purchases
      const buy = monthly * e.buyRatio * (0.95 + g.rnd() * 0.1);
      for (const v of split(buy, typical)) add(fy, m, g.pick(e.suppliers), e, workday(fy, m), g.pick(e.buy), v);
    }

    // ---- supply chain inside the ward (legitimate)
    const flow = (from, to, amount, prod, tags = []) => { for (const v of split(amount, amount / 4)) add(fy, m, E[from], E[to], workday(fy, m), prod, v, tags); };
    const gr = (k) => E[k].growth[fy] || 1;
    flow('E02', 'E01', 12.5e6 * gr('E01'), P.steel, ['supply-chain']);
    flow('E03', 'E01', 2.5e6 * gr('E01'), P.carton, ['supply-chain']);
    flow('E03', 'E04', 2.0e6 * gr('E04'), P.carton, ['supply-chain']);
    flow('E10', 'E02', 3.3e6, P.steel, ['supply-chain']);
    flow('E11', 'E04', 1.7e6 * gr('E04'), P.rice, ['supply-chain']);
    flow('E12', 'E01', 0.8e6 * gr('E12'), P.gta, ['supply-chain']);
    flow('E12', 'E04', 0.45e6 * gr('E12'), P.gta, ['supply-chain']);
    flow('E15', 'E07', 0.25e6, P.screw, ['supply-chain']);

    // ---- the cycle and the pass-through: E09 -> E08 -> (E07, E10); E10 -> E09 closes the loop
    const v98 = { 2023: 5e6, 2024: 7.5e6, 2025: 11.5e6 }[fy];
    for (const v of split(v98, v98 / 4)) {
      const d = workday(fy, m);
      add(fy, m, E.E09, E.E08, d, P.scrap, v, ['cycle', 'pass-through-in']);
      add(fy, m, E.E08, E.E07, laterInMonth(fy, m, d, g.ri(1, 3)), P.scrap, v * 0.55 * 1.01, ['pass-through-out']);
      const w = v * 0.45 * 1.01;
      const d2 = laterInMonth(fy, m, d, g.ri(1, 3));
      add(fy, m, E.E08, E.E10, d2, P.scrap, w, ['cycle', 'pass-through-out']);
      add(fy, m, E.E10, E.E09, laterInMonth(fy, m, d2, g.ri(2, 4)), P.scrap, w * 1.005, ['cycle']);
    }
    flow('E10', 'E08', 1.0e6, P.scrap, ['reciprocal']);
    // ---- a new registrant (July 2025) that immediately trades large values: E09 -> E16 -> E07
    if (fy === 2025 && m >= 3) {
      for (const v of split(10e6, 2.5e6)) {
        const d = workday(fy, m);
        add(fy, m, E.E09, E.E16, d, P.scrap, v, ['new-network']);
        add(fy, m, E.E16, E.E07, laterInMonth(fy, m, d, 2), P.scrap, v * 1.01, ['new-network', 'pass-through-out']);
      }
    }
    // ---- purchases from a supplier after its registration was cancelled (31-01-2025): not in 2A/2B
    if (fy === 2024 && m >= 10) for (const v of split(4e6, 1e6)) add(fy, m, cancelled, E.E02, workday(fy, m), P.steel, v, ['cancelled-supplier']);
  }
}

// ------------------------------------------------------------------ invoice numbers: sequential by date per seller and year
const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
const groups = new Map();
for (const x of ledger) { const k = `${x.seller.gstin}|${x.fy}`; (groups.get(k) || groups.set(k, []).get(k)).push(x); }
for (const list of groups.values()) {
  list.sort(byDate);
  list.forEach((x, i) => {
    x.seq = i + 1;
    x.no = x.seller.inWard ? `${x.seller.prefix}/${String(x.fy).slice(2)}-${String(x.fy + 1).slice(2)}/${String(i + 1).padStart(5, '0')}` : `${x.seller.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}${x.fy % 100}${String(1000 + i)}`;
  });
}

// ------------------------------------------------------------------ filing behaviour and planted defects per taxpayer-year
const qEnds = [2, 5, 8, 11];
const plan = {
  E09: { 2025: { unfiledPeriods: [6, 7, 8, 9, 10, 11] }, 2024: { filedOn: { 8: '2025-02-01' } } },     // stops filing 3B from Oct 2025
  E12: { 2024: { filedOn: { 11: '2025-05-30' } }, 2023: { filedOn: { 5: '2023-10-27' } } },            // Q4 FY24-25 filed 38 days late
  E06: { 2025: { filedOn: { 7: '2026-01-05' } } },                                                     // Nov 2025 filed 16 days late
  E13: { 2024: { underDeclare: { 3: { taxable: 4.2e6, tax: 756000 }, 5: { taxable: -4.2e6, tax: -756000 } } } }, // July short, caught up in September
  E15: { 2023: { excessItc: { 8: 64000, 11: -64000 } } },                                              // Q3 excess ITC, reversed in Q4
};
// E02 claims ITC on the cancelled supplier's invoices, which never reach GSTR-2B.
for (const x of ledger.filter((t) => t.tags.includes('cancelled-supplier'))) {
  const p = x.m;
  const ex = (((plan.E02 ||= {})[2024] ||= {}).excessItc ||= {});
  ex[p] = r2((ex[p] || 0) + taxOf(heads(x.taxable, x.rate, true)));
}

// E13: heavy credit notes in Q4 FY 2025-26 (sales returns and year-end discounts to two customers).
const cdnsByKey = {};
{
  const e = E.E13;
  const inv = ledger.filter((x) => x.seller === e && x.fy === 2025 && x.m <= 10 && (x.buyer === e.customers[0] || x.buyer === e.customers[1])).sort(byDate);
  let n = 0;
  for (const x of inv.filter((_, i) => i % 3 === 0)) {
    const m = 9 + (n % 3);
    const t = r2(x.taxable * (0.4 + g.rnd() * 0.2));
    (cdnsByKey['E13|2025'] ||= []).push({ m, c: x.buyer, hsn: x.prod.hsn, no: `E13/CN/25-26/${String(++n).padStart(4, '0')}`, date: dateIn(2025, m, 10 + (n % 15)), origNo: x.no, origDate: x.date, rate: x.rate, taxable: t, ...heads(t, x.rate, x.buyer.state === e.state) });
  }
}

// ------------------------------------------------------------------ project the ledger into each taxpayer-year's workbook
const filedByPeriod = (e, fy, m) => {
  const un = plan[e.key]?.[fy]?.unfiledPeriods || [];
  const periods = e.filing === 'qrmp' ? qEnds : MONTHS.map((_, i) => i);
  return !un.includes(periods.find((p) => p >= m));
};
const asParty = (x) => ({ gstin: x.gstin, name: x.name.replace(/ \[SYN\]$/, '').concat(x.inWard ? ' [SYN]' : ''), state: x.state });
// Start from a clean folder, but keep the hand-written README.md.
if (fs.existsSync(OUT)) for (const f of fs.readdirSync(OUT)) if (f !== 'README.md') fs.rmSync(path.join(OUT, f), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'registers'), { recursive: true });
const written = [];
for (const e of W) {
  for (const fy of FYS) {
    if (e.activeFrom && fy < e.activeFrom.fy) continue;
    const sales = ledger.filter((x) => x.seller === e && x.fy === fy).sort(byDate).map((x) => ({ m: x.m, c: asParty(x.buyer), no: x.no, seq: x.seq, date: x.date, rate: x.rate, taxable: x.taxable, ...heads(x.taxable, x.rate, x.buyer.state === e.state), hsn: x.prod.hsn }));
    const purchases = ledger.filter((x) => x.buyer === e && x.fy === fy).sort(byDate).map((x) => {
      const cancelledNow = x.seller.cancelledOn && x.date > x.seller.cancelledOn;
      return { m: x.m, s: asParty(x.seller), no: x.no, date: x.date, rate: x.rate, taxable: x.taxable, ...heads(x.taxable, x.rate, x.seller.state === e.state), rc: false,
        filed3B: x.seller.inWard ? filedByPeriod(x.seller, fy, x.m) : true, ...(cancelledNow ? { in2A: false, in2B: false } : {}) };
    });
    const opts = plan[e.key]?.[fy] || {};
    const { wb, stats } = writeReturns({
      name: e.name, gstin: e.gstin, state: 27, fy, filing: e.filing, irn: e.base * (e.growth[fy] || 1) > 5e7, extractDate: EXTRACT[fy],
      title: `SYNTHETIC WARD ${JURISDICTION} - not a real taxpayer`, sales, cdns: cdnsByKey[`${e.key}|${fy}`] || [], purchases,
      activeFrom: e.activeFrom?.fy === fy ? e.activeFrom.m : 0, ...opts,
    }, { filingLead: () => g.ri(1, 4) });
    const file = `Get Download All Report_${e.gstin}_${fy} - ${fy + 1}_SYN ${e.short}.xlsx`;
    fs.writeFileSync(path.join(OUT, file), XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));
    written.push({ key: e.key, fy, file, ...stats });
  }
}

// ------------------------------------------------------------------ registers (CSV, in the templates' column layout)
const csvLine = (vals) => vals.map((v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',');
const writeCsv = (name, header, rows) => fs.writeFileSync(path.join(OUT, 'registers', name), [csvLine(header), ...rows.map(csvLine)].join('\n') + '\n');
const dmy = (d) => d.split('-').reverse().join('-');
const fyLabel = (fy) => `${fy}-${String(fy + 1).slice(2)}`;

writeCsv('master.csv', ['gstin', 'legal_name', 'jurisdiction', 'range', 'officer', 'sector', 'registration_date', 'status', 'status_date'], [
  ...W.map((e) => [e.gstin, e.name, JURISDICTION, e.range, e.officer, e.sector, e.activeFrom ? '01-07-2025' : dmy(`20${17 + (Number(e.key.slice(1)) % 5)}-07-01`),
    e.key === 'E09' ? 'Suspended' : 'Active', e.key === 'E09' ? '10-04-2026' : '']),
  [kaBranch.gstin, kaBranch.name, 'External (Karnataka)', '', '', 'Electronics distribution', '15-06-2025', 'Active', ''],
  [cancelled.gstin, cancelled.name, 'External', '', '', 'Steel trading', '01-07-2019', 'Cancelled', dmy(cancelled.cancelledOn)],
]);

// Per-period tax paid in cash, from the ledger and the filing plan (used for targets and the answer key).
const outputTax = (e, fy) => ledger.filter((x) => x.seller === e && x.fy === fy).reduce((s, x) => s + taxOf(heads(x.taxable, x.rate, x.buyer.state === e.state)), 0) - (cdnsByKey[`${e.key}|${fy}`] || []).reduce((s, c) => s + taxOf(c), 0);
const turnover = (e, fy) => ledger.filter((x) => x.seller === e && x.fy === fy).reduce((s, x) => s + x.taxable, 0) - (cdnsByKey[`${e.key}|${fy}`] || []).reduce((s, c) => s + c.taxable, 0);
const monthTax = (fy, m) => W.reduce((s, e) => s + ledger.filter((x) => x.seller === e && x.fy === fy && x.m === m).reduce((t, x) => t + taxOf(heads(x.taxable, x.rate, x.buyer.state === e.state)), 0), 0);
writeCsv('targets.csv', ['jurisdiction', 'fy', 'month', 'target_amount', 'version', 'approved_on', 'basis'],
  FYS.flatMap((fy) => MONTHS.map((mn, m) => [JURISDICTION, fyLabel(fy), mn.slice(0, 3), Math.round((fy === 2023 ? monthTax(fy, m) * 1.03 : monthTax(fy - 1, m) * 1.12) / 1000) * 1000, 'v1', `01-04-${fy}`,
    fy === 2023 ? 'Opening year: 3% over the year' : 'Prior-year output tax for the month + 12%'])));

const sumTags = (tag, fy, key) => ledger.filter((x) => x.tags.includes(tag) && x.fy === fy && (!key || x.buyer.key === key || x.seller.key === key)).reduce((s, x) => s + taxOf(heads(x.taxable, x.rate, x.seller.state === x.buyer.state)), 0);
const itcFrom = (buyerKey, sellerKeys, fy) => ledger.filter((x) => x.buyer.key === buyerKey && sellerKeys.includes(x.seller.key) && x.fy === fy).reduce((s, x) => s + taxOf(heads(x.taxable, x.rate, true)), 0);
const r0 = (v) => Math.round(v);
const eiu = [
  ['EIU-2025-0107', E.E07.gstin, 'ITC availed from high-risk suppliers (pass-through network)', '', '2025-26', r0(itcFrom('E07', ['E08', 'E16'], 2025) * 0.55), '14-11-2025', 'High', 'EIU network risk run', 'Suppliers E08 and E16 buy from a supplier that stopped filing GSTR-3B'],
  ['EIU-2025-0112', E.E13.gstin, 'GSTR-1 tax exceeds GSTR-3B tax', 'G-02', '2024-25', 756000, '05-09-2024', 'Medium', 'EIU monthly risk run', 'Signal raised on the July 2024 return'],
  ['EIU-2026-0115', E.E09.gstin, 'Supplier not filing GSTR-3B while GSTR-1 continues', 'A-02', '2025-26', r0(ledger.filter((x) => x.seller === E.E09 && x.fy === 2025 && x.m >= 6 && x.m <= 8).reduce((s, x) => s + taxOf(heads(x.taxable, x.rate, true)), 0)), '12-01-2026', 'High', 'EIU non-filer run', 'Oct-Dec 2025 unfiled at signal date'],
  ['EIU-2025-0121', E.E05.gstin, 'Sharp decline in tax paid compared with last year', '', '2025-26', r0(truth.drivers.E05.branchShiftedSales * 0.18 * 0.5), '20-10-2025', 'Medium', 'EIU revenue monitor', 'H1 decline versus H1 of FY 2024-25'],
  ['EIU-2025-0126', E.E08.gstin, 'Low value addition: liability discharged almost entirely through ITC', '', '2024-25', r0(itcFrom('E08', ['E09', 'E10'], 2024)), '18-06-2025', 'High', 'EIU value-addition run', ''],
  ['EIU-2024-0098', E.E15.gstin, 'ITC claimed in excess of GSTR-2B', 'B-01', '2023-24', 64000, '10-02-2024', 'Low', 'EIU monthly risk run', 'Q3 FY 2023-24 return'],
  ['EIU-2025-0131', E.E01.gstin, 'E-invoice (IRN) not generated on B2B invoices', 'G-03', '2025-26', 0, '02-12-2025', 'Low', 'EIU e-invoice run', 'IRN coverage check'],
];
writeCsv('eiu.csv', ['signal_id', 'gstin', 'risk_parameter', 'rule_id', 'fy', 'amount', 'signal_date', 'priority', 'source', 'remarks'], eiu);
// Case action register and the DRC-07 demands it leads to (scripts/synth/cases.mjs).
const caseLog = buildCaseLog({ E, W });
writeCsv('caselog.csv', caseLog.header, caseLog.rows);
const demands = caseLog.demands;
writeCsv('demands.csv', ['demand_id', 'gstin', 'case_ref', 'fy', 'section', 'order_date', 'demand_tax', 'demand_interest', 'demand_penalty', 'paid_to_date', 'last_payment_date', 'stage', 'blocker'], demands);

// ------------------------------------------------------------------ taxpayer / CA replies to the EIU signals
// Written as a practitioner would: some claims true, some contradicted by the returns, some not provable from returns.
const replies = [
  { signalId: 'EIU-2025-0112', gstin: E.E13.gstin, received: '2025-12-10', from: 'CA', ref: 'SKA/GST/2025/118', text: 'The shortfall of ₹7,56,000 in the July 2024 GSTR-3B arose from invoices booked late in the accounts. The entire amount was declared and paid in the September 2024 return. Interest on the delayed payment has also been paid.' },
  { signalId: 'EIU-2024-0098', gstin: E.E15.gstin, received: '2024-03-05', from: 'Taxpayer', ref: '', text: 'Excess ITC of Rs. 64,000 taken in Q3 was reversed in the Q4 return.' },
  { signalId: 'EIU-2026-0115', gstin: E.E09.gstin, received: '2026-03-02', from: 'Taxpayer', ref: 'SBE/2026/02', text: 'GSTR-3B for October to December 2025 was filed in February 2026 along with the tax. The business has since been wound down.' },
  { signalId: 'EIU-2025-0121', gstin: E.E05.gstin, received: '2025-11-18', from: 'CA', ref: 'MPC/KED/2025/41', text: 'From July 2025 our Karnataka branch (same PAN) started billing the southern customers directly, so sales from Maharashtra fell. Overall business has not declined.' },
  { signalId: 'EIU-2025-0126', gstin: E.E08.gstin, received: '2025-07-15', from: 'Taxpayer', ref: '', text: 'We trade scrap on a margin of about 5%. All purchases are from registered dealers who have filed their returns. Goods move under e-way bills.' },
  { signalId: 'EIU-2025-0107', gstin: E.E07.gstin, received: '2025-12-20', from: 'CA', ref: 'RJA/TIP/2025/77', text: 'All suppliers are registered and have filed their GSTR-3B. Goods were received at our project sites against e-way bills. Payments were made through banking channels.' },
  { signalId: 'EIU-2025-0131', gstin: E.E01.gstin, received: '2025-12-15', from: 'Taxpayer', ref: '', text: 'E-invoices have been generated for all B2B supplies since April 2025.' },
];
fs.writeFileSync(path.join(OUT, 'replies.json'), JSON.stringify(replies, null, 1));
// The same replies as the letters an officer actually receives (PDF or Word), for the document upload.
const LETTERS = {
  'EIU-2025-0112': { format: 'pdf', firm: ['S. K. Apte & Associates', 'Chartered Accountants', 'Shivajinagar, Pune 411005'], sign: ['For S. K. Apte & Associates', 'CA S. K. Apte, Partner (M. No. 1XXXXX, synthetic)'] },
  'EIU-2025-0107': { format: 'pdf', firm: ['R. Joshi & Associates', 'Chartered Accountants', 'Chinchwad, Pune 411033'], sign: ['For R. Joshi & Associates', 'CA R. Joshi, Partner (synthetic)'] },
  'EIU-2025-0121': { format: 'docx', firm: ['M. Patil & Co.', 'Chartered Accountants', 'Kharadi, Pune 411014'], sign: ['For M. Patil & Co.', 'CA M. Patil, Partner (synthetic)'] },
  'EIU-2025-0126': { format: 'docx', firm: ['SWIFT TRADE LINKS [SYN]', 'Bhosari MIDC, Pune 411026'], sign: ['For SWIFT TRADE LINKS', 'Proprietor (synthetic)'] },
};
fs.mkdirSync(path.join(OUT, 'replies'), { recursive: true });
for (const r of replies) {
  const L = LETTERS[r.signalId];
  if (!L) continue;
  const lines = [...L.firm, '', `Date: ${dmy(r.received)}`, ...(r.ref ? [`Ref: ${r.ref}`] : []), '', 'To,', 'The GST Officer,', `${JURISDICTION} (synthetic ward), Pune`, '',
    `Subject: Reply to risk signal ${r.signalId} in respect of GSTIN ${r.gstin}`, '', 'Respected Sir / Madam,', '',
    'With reference to the above, we submit as follows on behalf of our client.', '', ...r.text.replace(/₹/g, 'Rs. ').split(/(?<=\.)\s+/), '',
    'We request that the matter be closed.', '', 'Yours faithfully,', ...L.sign, '', 'SYNTHETIC DOCUMENT FOR TESTING: NOT A REAL REPLY'];
  fs.writeFileSync(path.join(OUT, 'replies', `${r.signalId}.${L.format}`), L.format === 'pdf' ? pdfDoc(lines) : docxDoc(lines));
}

// ------------------------------------------------------------------ answer key: what is planted, measured from the data
const yoy = (e) => ({ turnover: [r0(turnover(e, 2024)), r0(turnover(e, 2025))], outputTax: [r0(outputTax(e, 2024)), r0(outputTax(e, 2025))] });
const rateCut = ledger.filter((x) => x.seller === E.E04 && x.fy === 2025 && x.prod.cutTo && x.date >= RATE_CUT_FROM).reduce((s, x) => s + x.taxable * (x.prod.rate - x.prod.cutTo) / 100, 0);
const lostCust = E.E06.customers[0];
const lostPrior = ledger.filter((x) => x.seller === E.E06 && x.buyer === lostCust && x.fy === 2024 && x.m >= 4).reduce((s, x) => s + x.taxable, 0);
const cnE13 = cdnsByKey['E13|2025'];
const cycleValue = (fy) => ['E09>E08', 'E08>E10', 'E10>E09'].map((edge) => { const [a, b] = edge.split('>'); return [edge, r0(ledger.filter((x) => x.seller.key === a && x.buyer.key === b && x.fy === fy && x.tags.includes('cycle')).reduce((s, x) => s + x.taxable, 0))]; });
const key = {
  generatedBy: 'scripts/synth/ward.mjs (seed 2718)', jurisdiction: JURISDICTION, synthetic: true,
  note: 'All figures are synthetic and must never be presented as actual departmental outcomes.',
  extractDates: EXTRACT,
  taxpayers: W.map((e) => ({ key: e.key, gstin: e.gstin, name: e.name, sector: e.sector, filing: e.filing, officer: e.officer, years: FYS.filter((fy) => !(e.activeFrom && fy < e.activeFrom.fy)).map(fyLabel) })),
  workbooks: written.map((w) => ({ key: w.key, fy: fyLabel(w.fy), file: w.file, sales: w.sales, purchases: w.purchases, cdns: w.cdns, periods: w.periods })),
  revenueDrivers: {
    E01: { driver: 'genuine growth', ...yoy(E.E01), expected: 'top positive contributor; no concern' },
    E04: { driver: 'rate reduction 12% -> 5% on cereals and namkeen from 22-09-2025 (modelled on the Sept 2025 rate rationalisation)', ...yoy(E.E04), rateEffectOnOutputTax: -r0(rateCut), expected: 'tax falls while turnover grows; explained by the rate change, not suppression' },
    E05: { driver: 'branch redistribution: 40% of sales moved to the Karnataka registration of the same PAN from July 2025', ...yoy(E.E05), shiftedSales: r0(truth.drivers.E05.branchShiftedSales), stockTransfersToBranch: r0(truth.drivers.E05.transfersToBranch), branchGstin: kaBranch.gstin, expected: 'turnover decline explained by branch shift; transfers to the same-PAN GSTIN visible in GSTR-1' },
    E06: { driver: 'loss of its largest customer from August 2025', ...yoy(E.E06), lostCustomer: lostCust.gstin, priorYearSalesToLostCustomerAugMar: r0(lostPrior), expected: 'genuine decline explained by customer loss' },
    E07: { driver: 'cash paid falls as ITC rises; the extra ITC comes from a pass-through intermediary (E08) and a new registrant (E16)', ...yoy(E.E07), itcFromE08E16: [r0(itcFrom('E07', ['E08', 'E16'], 2024)), r0(itcFrom('E07', ['E08', 'E16'], 2025))], expected: 'cash-vs-ITC driver explains the cash drop; the ITC source remains unresolved and needs verification' },
    E13: { driver: 'credit notes in Q4 FY 2025-26 (sales returns and discounts to two customers)', ...yoy(E.E13), creditNotes: { count: cnE13.length, taxable: r0(cnE13.reduce((s, c) => s + c.taxable, 0)), tax: r0(cnE13.reduce((s, c) => s + taxOf(c), 0)) }, expected: 'decline explained by credit notes; check their linkage to original invoices' },
    E14: { driver: 'festival timing: the Diwali peak moved from November (2023) to October/November (2024) to October (2025)', ...yoy(E.E14), expected: 'monthly deviations are seasonal; the year is broadly flat' },
    E12: { driver: 'filing delay: Q4 FY 2024-25 return filed on 30-05-2025, 38 days late', expected: 'timing, with interest; not a revenue loss' },
  },
  network: {
    cycle: { members: ['E09', 'E08', 'E10'], valueByYear: Object.fromEntries(FYS.map((fy) => [fyLabel(fy), cycleValue(fy)])), expected: '3-party cycle E09 -> E08 -> E10 -> E09 with near-equal values and short lags' },
    passThrough: { intermediary: 'E08', buysFrom: ['E09'], sellsTo: ['E07', 'E10'], lagDays: '1-3', markUp: '1%', expected: 'rapid pass-through with minimal value addition' },
    reciprocal: { pair: ['E08', 'E10'], expected: 'E10 is both a customer and a supplier of E08' },
    nonFiler: { key: 'E09', unfiledGstr3b: ['Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26', 'Mar-26'], gstr1Continues: true, status: 'Suspended from 10-04-2026 (taxpayer master)', affectedBuyers: ['E08', 'E16'], expected: 'buyers show Rule 37A Amber (extract 26-09-2026, before the 30-09-2026 deadline)' },
    newNetwork: { key: 'E16', registered: '01-07-2025', buysFrom: 'E09', sellsTo: 'E07', monthlyValue: 10e6, expected: 'abrupt network formation: large values from the first month' },
    samePan: { gstins: [E.E05.gstin, kaBranch.gstin], expected: 'distinct-person transfers; explains E05 decline' },
    cancelledSupplier: { supplier: cancelled.gstin, cancelledOn: dmy(cancelled.cancelledOn), buyer: 'E02', invoicesAfterCancellation: ledger.filter((x) => x.tags.includes('cancelled-supplier')).length, itcClaimed: r0(sumTags('cancelled-supplier', 2024)), expected: 'E02 FY 2024-25: ITC claimed beyond 2B (B-01) on invoices from a cancelled GSTIN' },
  },
  eiuExpectations: {
    'EIU-2025-0107': 'unchanged or increased: the ITC source network is still active (network capability)',
    'EIU-2025-0112': 'resolved: the July 2024 shortfall was declared in September 2024; no annual gap (G-02 Review, not Fail)',
    'EIU-2026-0115': 'increased: GSTR-3B still unfiled for Oct 2025 - Mar 2026, beyond the signal window',
    'EIU-2025-0121': 'explained: branch redistribution to the same-PAN Karnataka GSTIN',
    'EIU-2025-0126': 'unchanged: pass-through with minimal cash payment persists',
    'EIU-2024-0098': 'resolved: the Q3 excess was reversed in Q4 (B-01 Review, not Fail)',
    'EIU-2025-0131': 'resolved: every B2B invoice carries an IRN',
  },
  caseLog: caseLog.expect,
  replyExpectations: {
    'EIU-2025-0112': [['declared-later', 'supported'], ['interest-paid', 'contradicted']],
    'EIU-2024-0098': [['reversed', 'supported']],
    'EIU-2026-0115': [['filed', 'contradicted'], ['general', 'unverifiable']],
    'EIU-2025-0121': [['branch', 'supported'], ['general', 'unverifiable']],
    'EIU-2025-0126': [['margin', 'contradicted'], ['suppliers-compliant', 'supported'], ['goods-moved', 'unverifiable']],
    'EIU-2025-0107': [['suppliers-compliant', 'partial'], ['goods-moved', 'unverifiable'], ['paid-by-bank', 'unverifiable']],
    'EIU-2025-0131': [['irn', 'supported']],
  },
  knownEngineLimitations: {
    E16: 'Registered on 01-07-2025. The engine assumes returns start in April, so it treats the first return as covering Apr-Jul and labels the filing pattern "Mixed (Monthly → QRMP)". The taxpayer master register holds the registration date needed to correct this.',
  },
};
fs.writeFileSync(path.join(OUT, 'answer-key.json'), JSON.stringify(key, null, 1));
console.log(`Wrote ${written.length} workbooks, 5 registers, replies.json and answer-key.json to ${path.relative(ROOT, OUT)}`);
