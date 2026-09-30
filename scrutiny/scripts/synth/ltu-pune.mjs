// Large Taxpayer Unit "LTU-PUNE": nine fictional corporate groups (18 registrations) over three financial years
// (FY 2023-24 to 2025-26), ₹40,000 to ₹49,000 crore of turnover a year including intra-group supplies. Each group carries a different set of problems, so
// that together with LTU-MUMBAI (corporates.mjs) and the ward (ward.mjs) every check the returns can support is hit
// somewhere: import ITC against bills of entry, e-commerce TCS against turnover, government TDS, time-barred ITC,
// credit notes after the s.34(2) deadline, supplier credit notes not netted, RCM credit above RCM paid, ITC blocked by
// place of supply, retrospective cancellation, duplicate and round-figure invoices, unfiled returns and more.
//
//   node scripts/synth/ltu-pune.mjs               -> data/ workbooks (…_GEN <name>.xlsx) + test-data/ltu-pune/
//   node scripts/synth/ltu-pune.mjs --if-missing  -> does nothing when this version's workbooks are already there
//   node scripts/synth/ltu-pune.mjs --registers   -> also merges the LTU-PUNE rows into data/registers/*.json
//   node scripts/synth/ltu-pune.mjs --remove      -> takes LTU-PUNE out again (workbooks to data/superseded/, its e-way
//                                                    bills and register rows removed): resets a live upload demo
//
// The unit is not part of the build: it is the data shown being uploaded (scripts/synth/pack-ltu-pune.mjs makes the pack).
//
// Every name, PAN and figure is invented; PANs start with "ZZ" (the project's marker for generated data). Ledger-first
// like corporates.mjs: an invoice between two generated taxpayers exists once and is projected into the seller's
// GSTR-1 and the buyer's GSTR-2A/2B. Deterministic (seed 27183); the workbooks are generated at build time.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { MONTHS, r2, gstin, makeRng, heads, taxOf, calOf, iso, checkDigit } from './lib.mjs';
import { writeReturns } from './workbook.mjs';
import { P, rateOf, STATE_NAME } from './products.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'data');
const KEY_DIR = path.join(ROOT, 'test-data', 'ltu-pune');
export const VERSION = 'ltu-pune-v1';
export const JURISDICTION = 'LTU-PUNE';
export const FYS = [2023, 2024, 2025];
const EXTRACT = { 2023: '2024-11-25', 2024: '2025-11-20', 2025: '2026-09-26' };
const CR = 1e7; // ₹ one crore
const Y = (fy) => FYS.indexOf(fy);

// ------------------------------------------------------------------ the groups
// turnover: ₹ crore of external sales in FY 2023-24 for the whole group; growth: multiplier per year (FY 23, 24, 25).
// share splits turnover across registrations; inv: invoices per month; buy: products bought ([product, weight] or a
// product); buyRatio: domestic purchases as a share of sales; imports: bills of entry as a share of sales;
// eco: share of sales made to consumers through e-commerce marketplaces; govt: share of sales to government
// departments that deduct TDS; from: first month of registration (FY, month) when after April 2023.
const E = (key, name, state, pan, o) => ({ key, name, state: String(state).padStart(2, '0'), pan, ...o });
export const GROUPS = [
  // ---------------------------------------------------------------- clean
  { key: 'G31', kind: 'clean', short: 'Indrayani Home Appliances', sector: 'Consumer durables', turnover: 7200, growth: [1, 1.09, 1.13], season: 'summer', officer: 'N. Gokhale', range: 'LTU Pune Range 1',
    entities: [
      E('G31A', 'INDRAYANI HOME APPLIANCES LIMITED', 27, 'ZZICI5131A', { role: 'Plant and head office (Chakan)', share: 0.6, inv: 150, sell: [P.ac, P.fridge], buy: [[P.crm, 5], [P.copper, 3], [P.pcba, 2], [P.carton, 1]], buyRatio: 0.52, imports: { share: 0.11, prod: P.compressor, port: 'INNSA1' }, custStates: [27, 27, 27, 30, 23, 24], supStates: [27, 24, 33] }),
      E('G31B', 'INDRAYANI HOME APPLIANCES LIMITED', 24, 'ZZICI5131A', { role: 'Depot and assembly (Sanand)', share: 0.24, inv: 90, sell: [P.ac, P.fridge], buy: [P.carton], buyRatio: 0.04, custStates: [24, 24, 8, 23], supStates: [24] }),
      E('G31C', 'INDRAYANI HOME APPLIANCES LIMITED', 29, 'ZZICI5131A', { role: 'Depot (Bengaluru)', share: 0.16, inv: 80, sell: [P.ac, P.fridge], buy: [P.carton], buyRatio: 0.04, custStates: [29, 29, 33, 32], supStates: [29] }),
    ] },
  { key: 'G39', kind: 'clean', short: 'Krishnai Sugar', sector: 'Sugar and ethanol', turnover: 2800, growth: [1, 1.07, 0.97], season: 'crushing', officer: 'H. Patil', range: 'LTU Pune Range 3',
    entities: [
      E('G39A', 'KRISHNAI SUGAR AND DISTILLERIES LIMITED', 27, 'ZZKCK5939L', { role: 'Sugar mill (Baramati taluka)', share: 0.62, inv: 70, sell: [P.sugar], buy: [[P.bags, 3], [P.coal, 2], [P.chem, 1]], buyRatio: 0.16, custStates: [27, 27, 24, 29, 9], supStates: [27] }),
      E('G39B', 'KRISHNAI BIO-ENERGY LIMITED', 27, 'ZZKCK5940M', { role: 'Subsidiary: ethanol distillery', share: 0.38, inv: 40, sell: [P.ethanol], buy: [[P.chem, 2], [P.coal, 1]], buyRatio: 0.2, custStates: [27, 27, 24], supStates: [27], loses: { fy: 2025, factor: 0.08 } }),
    ] },

  // ---------------------------------------------------------------- complex but mostly legitimate
  { key: 'G32', kind: 'tricky', short: 'Chandrabhaga Edible Oils', sector: 'Edible oil refining (importer)', turnover: 11000, growth: [1, 1.06, 1.1], season: 'festive', officer: 'N. Gokhale', range: 'LTU Pune Range 1',
    entities: [
      E('G32A', 'CHANDRABHAGA EDIBLE OILS LIMITED', 24, 'ZZCCC5232B', { role: 'Port refinery (Kandla)', share: 0.62, inv: 110, sell: [P.palmolein, P.oil], buy: [[P.bags, 3], [P.gta, 1]], buyRatio: 0.035, imports: { share: 0.84, prod: P.cpo, alt: P.soyoil, port: 'INIXY1' }, custStates: [24, 24, 27, 8, 23], supStates: [24] }),
      E('G32B', 'CHANDRABHAGA EDIBLE OILS LIMITED', 27, 'ZZCCC5232B', { role: 'Packing unit and depot (Pune)', share: 0.38, inv: 140, sell: [P.palmolein, P.oil], buy: [[P.bags, 2], [P.carton, 1]], buyRatio: 0.04, imports: { share: 0.22, prod: P.soyoil, port: 'INNSA1' }, custStates: [27, 27, 27, 30], supStates: [27] }),
    ] },
  { key: 'G34', kind: 'tricky', short: 'Lenyadri Infra', sector: 'Infrastructure (EPC, government contracts)', turnover: 5200, growth: [1, 1.14, 1.08], season: 'construction', officer: 'F. Qureshi', range: 'LTU Pune Range 2',
    entities: [
      E('G34A', 'LENYADRI INFRA PROJECTS LIMITED', 27, 'ZZLCL5434D', { role: 'Parent EPC contractor (Pune)', share: 0.64, inv: 40, sell: [P.works], buy: [[P.tmt, 4], [P.cement, 4], [P.bitumen, 2], [P.subcon, 5], [P.legal, 0.3]], buyRatio: 0.72, govt: 0.8, milestones: true, custStates: [27], supStates: [27, 27, 24] }),
      E('G34B', 'LENYADRI RING ROAD INFRA PROJECTS PRIVATE LIMITED', 27, 'ZZLCL5435E', { role: 'SPV: ring-road project', share: 0.22, inv: 20, sell: [P.works], buy: [P.subcon], buyRatio: 0.2, govt: 1, milestones: true, custStates: [27], supStates: [27] }),
      E('G34C', 'LENYADRI INFRA PROJECTS LIMITED', 29, 'ZZLCL5434D', { role: 'Branch: metro package (Bengaluru)', share: 0.14, inv: 18, sell: [P.works], buy: [[P.tmt, 3], [P.cement, 3], [P.subcon, 4]], buyRatio: 0.68, govt: 1, milestones: true, custStates: [29], supStates: [29] }),
    ] },

  // ---------------------------------------------------------------- high risk
  { key: 'G33', kind: 'risky', short: 'Shivneri E-Retail', sector: 'Online retail (marketplace seller)', turnover: 1200, growth: [1, 1.75, 2.8], season: 'festive', officer: 'F. Qureshi', range: 'LTU Pune Range 2',
    entities: [
      E('G33A', 'SHIVNERI E-RETAIL PRIVATE LIMITED', 27, 'ZZSCS5333C', { role: 'Fulfilment centre (Bhiwandi)', share: 0.62, inv: 70, sell: [P.phone, P.earbuds, P.apparel, P.footwear], buy: [[P.phone, 4], [P.earbuds, 2], [P.apparel, 2], [P.footwear, 1]], buyRatio: 0.88, eco: 0.85, custStates: [27, 27, 24], supStates: [27, 33, 29, 7] }),
      E('G33B', 'SHIVNERI E-RETAIL PRIVATE LIMITED', 29, 'ZZSCS5333C', { role: 'Fulfilment centre (Bengaluru)', share: 0.38, inv: 45, sell: [P.phone, P.earbuds, P.apparel, P.footwear], buy: [[P.phone, 4], [P.earbuds, 2], [P.apparel, 2], [P.footwear, 1]], buyRatio: 0.88, eco: 0.85, custStates: [29, 33, 36], supStates: [29, 33] }),
    ] },
  { key: 'G35', kind: 'risky', short: 'Sinhagad Consumer', sector: 'FMCG distribution (super-stockist)', turnover: 2400, growth: [1, 1.03, 0.92], season: 'fmcg', officer: 'H. Patil', range: 'LTU Pune Range 3',
    entities: [
      E('G35A', 'SINHAGAD CONSUMER DISTRIBUTORS PRIVATE LIMITED', 27, 'ZZSCS5535F', { role: 'Head office and warehouse (Pune)', share: 0.72, inv: 160, sell: [P.soap, P.detergent, P.biscuits, P.tea], buy: [[P.soap, 3], [P.detergent, 3], [P.biscuits, 3], [P.tea, 2]], buyRatio: 0.9, custStates: [27, 27, 27], supStates: [27, 24] }),
      E('G35B', 'SINHAGAD CONSUMER DISTRIBUTORS PRIVATE LIMITED', 30, 'ZZSCS5535F', { role: 'Depot (Verna, Goa)', share: 0.28, inv: 90, sell: [P.soap, P.biscuits, P.tea], buy: [[P.soap, 2], [P.biscuits, 2]], buyRatio: 0.9, custStates: [30, 30], supStates: [27, 30] }),
    ] },
  { key: 'G36', kind: 'risky', short: 'Rajgad Steel', sector: 'Steel re-rolling', turnover: 3100, growth: [1, 1.08, 0.86], season: 'construction', officer: 'F. Qureshi', range: 'LTU Pune Range 2',
    entities: [E('G36A', 'RAJGAD STEEL RE-ROLLERS PRIVATE LIMITED', 27, 'ZZRCR5636G', { role: 'Rolling mill (Jalna)', share: 1, inv: 110, sell: [P.tmt], buy: [[P.billet, 10], [P.scrap, 6], [P.coal, 1.5], [P.gtaRcm, 0.8]], buyRatio: 0.86, custStates: [27, 27, 27, 23], supStates: [27, 27, 24, 22] })] },
  { key: 'G37', kind: 'risky', short: 'Torna Commodity', sector: 'Commodity trading (metals and polymers)', turnover: 80, growth: [1, 7.8, 20], season: 'flat', officer: 'H. Patil', range: 'LTU Pune Range 3',
    entities: [
      E('G37A', 'TORNA COMMODITY TRADERS PRIVATE LIMITED', 27, 'ZZTCT5737H', { role: 'Trading office (Vashi, Navi Mumbai)', share: 0.8, inv: 60, sell: [P.cuscrap, P.aluscrap, P.pp], buy: [P.cuscrap, P.aluscrap, P.pp], buyRatio: 0.985, ramp: true, custStates: [27, 27, 24], supStates: [27, 27, 24], registered: '2023-01-10' }),
      E('G37B', 'TORNA IMPEX LLP', 24, 'ZZTFT5738J', { role: 'Related party (common partners)', share: 0.2, inv: 30, sell: [P.cuscrap, P.pp], buy: [P.cuscrap, P.pp], buyRatio: 0.99, ramp: true, custStates: [24, 27], supStates: [24], from: { fy: 2024, m: 1 }, registered: '2024-05-02' }),
    ] },
  { key: 'G38', kind: 'risky', short: 'Purandar Metals', sector: 'Non-ferrous scrap trading', turnover: 1600, growth: [1, 1.12, 1.2], season: 'flat', officer: 'N. Gokhale', range: 'LTU Pune Range 1',
    entities: [E('G38A', 'PURANDAR METALS AND ALLOYS PRIVATE LIMITED', 27, 'ZZPCP5838K', { role: 'Scrap yard (Kurkumbh)', share: 1, inv: 130, sell: [P.cuscrap, P.aluscrap, P.scrap], buy: [P.cuscrap, P.aluscrap, P.scrap], buyRatio: 0.92, custStates: [27, 27, 24], supStates: [27, 27] })] },
];
const ALL = GROUPS.flatMap((grp) => grp.entities.map((e) => Object.assign(e, { group: grp, gstin: gstin(e.state, e.pan), generated: true })));
const byKey = Object.fromEntries(ALL.map((e) => [e.key, e]));
const activeIn = (e, fy) => !e.from || fy >= e.from.fy;

// ------------------------------------------------------------------ calendar helpers
const g = makeRng(27183);
const lastDay = (fy, m) => { const { y, cm } = calOf(fy, m); return new Date(Date.UTC(y, cm, 0)).getUTCDate(); };
const dateIn = (fy, m, day) => { const { y, cm } = calOf(fy, m); return iso(y, cm, Math.min(day, lastDay(fy, m))); };
const dow = (d) => new Date(`${d}T00:00:00Z`).getUTCDay();
const workday = (fy, m) => { for (;;) { const d = dateIn(fy, m, g.ri(1, lastDay(fy, m))); if (dow(d) !== 0) return d; } };
const sunday = (fy, m) => { for (;;) { const d = dateIn(fy, m, g.ri(1, lastDay(fy, m))); if (dow(d) === 0) return d; } };
const laterInMonth = (fy, m, date, k) => dateIn(fy, m, Math.min(Number(date.slice(8)) + k, lastDay(fy, m)));
const SEASON = {
  flat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  fmcg: [0.95, 0.96, 0.98, 1, 1.02, 1.05, 1.12, 1.08, 0.98, 0.94, 0.95, 0.97],
  festive: [0.8, 0.82, 0.85, 0.9, 1, 1.15, 1.45, 1.3, 0.95, 0.88, 0.9, 1.0],
  construction: [1.1, 1.05, 0.7, 0.6, 0.75, 0.95, 1.05, 1.1, 1.15, 1.2, 1.2, 1.35],
  summer: [1.45, 1.4, 1.1, 0.8, 0.75, 0.8, 0.95, 0.85, 0.75, 0.8, 1.05, 1.3], // air conditioners and refrigerators
  crushing: [1.15, 0.85, 0.75, 0.7, 0.7, 0.75, 0.95, 1.2, 1.3, 1.25, 1.2, 1.2], // cane crushing November to April
};
const RAMP = Array.from({ length: 12 }, (_, m) => 0.55 + (0.9 * m) / 11); // a trader growing through the year

// ------------------------------------------------------------------ external counterparties
const PLACE = ['Sahyadri', 'Deccan', 'Konkan', 'Narmada', 'Krishna', 'Kaveri', 'Shivshakti', 'Mahalaxmi', 'Siddhivinayak', 'Om Sai', 'Shree Ganesh', 'Jai Ambe', 'Navjeevan', 'Pragati', 'Unnati', 'Samarth', 'Vishal', 'Bharat', 'Hindustan', 'Rashtriya', 'Suvarna', 'Rajlaxmi', 'Kamdhenu', 'Anand', 'Vijay', 'Parshwa', 'Mahavir', 'Tirupati', 'Balaji', 'Annapurna', 'Gurukrupa', 'Vaishnavi', 'Dhanlaxmi', 'Saraswati', 'Kohinoor', 'Everest', 'Sunrise', 'Pioneer', 'Apex', 'Supreme', 'Prime', 'Royal', 'Classic', 'Metro', 'Galaxy', 'Orient', 'Western', 'Eastern', 'Southern', 'Central', 'Yashoda', 'Sahyog', 'Omkar', 'Gajanan', 'Shubham', 'Nandi', 'Tapi', 'Godavari', 'Bhairavnath', 'Jyotiba'];
const FORM = [['Private Limited', 'C', 5], ['Limited', 'C', 2], ['LLP', 'F', 2], ['Enterprises', 'P', 2], ['Traders', 'F', 2], ['Agencies', 'F', 1], ['Distributors', 'F', 2], ['Industries', 'C', 1], ['& Co', 'F', 1]];
const TRADE_WORD = (prod) => ({ '8415': 'Cooling Systems', '8418': 'Appliances', '8414': 'Engineering', '7209': 'Steel', '7408': 'Metals', '8473': 'Electronics', '4819': 'Packaging', '996311': 'Hotels and Resorts',
  '1511': 'Oils', '1507': 'Oils', '1512': 'Oils', '6305': 'Packaging', '996511': 'Roadways', '8517': 'Mobiles', '8518': 'Mobiles', '6109': 'Fashions', '6404': 'Footwear', '995421': 'Infra Projects', '995428': 'Infra Projects',
  '7214': 'Steel', '2523': 'Buildcon', '2713': 'Petroleum', '998212': 'Legal Associates', '3401': 'Retail', '3402': 'Marketing', '1905': 'Foods', '0902': 'Foods', '7207': 'Steel', '7204': 'Metals', '2701': 'Coal Traders',
  '7404': 'Metals', '7602': 'Metals', '3902': 'Polymers', '1701': 'Foods', '2207': 'Petroleum', '2902': 'Petrochem', '1703': 'Agro' }[prod.hsn[0]] || 'Traders');
const externals = [];
const usedNames = new Set();
const makeExternal = (state, prod, opts = {}) => {
  let name;
  for (let i = 0; ; i++) {
    const [form, type] = (() => { const tot = FORM.reduce((s, f) => s + f[2], 0); let r = g.rnd() * tot; for (const f of FORM) { r -= f[2]; if (r < 0) return f; } return FORM[0]; })();
    name = `${g.pick(PLACE)} ${TRADE_WORD(prod)} ${form}`.toUpperCase();
    if (!usedNames.has(name) || i > 20) { opts.type ||= type; break; }
  }
  usedNames.add(name);
  const x = { key: `X${externals.length + 1}`, name, state: String(state).padStart(2, '0'), generated: false, weight: 1, ...opts };
  x.gstin = gstin(state, g.pan(x.type), '1', !opts.invalid);
  externals.push(x);
  return x;
};
const counts = (e) => ({ c: Math.round(18 + Math.sqrt(e.group.turnover * e.share) * 0.9), s: Math.round(12 + Math.sqrt(e.group.turnover * e.share) * 0.5) });
const prodOf = (item) => (Array.isArray(item) ? item[0] : item);
const pickBuy = (list) => { const w = list.map((x) => (Array.isArray(x) ? x[1] : 1)); let r = g.rnd() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < list.length; i++) { r -= w[i]; if (r < 0) return prodOf(list[i]); } return prodOf(list[list.length - 1]); };
for (const e of ALL) {
  const { c, s } = counts(e);
  e.customers = Array.from({ length: Math.min(Math.max(c, 30), 110) }, (_, i) => makeExternal(e.custStates[i % e.custStates.length], e.sell[0], { weight: 1 / (i + 1) ** 0.85 }));
  e.suppliers = Array.from({ length: Math.min(s, 70) }, (_, i) => makeExternal(e.supStates[i % e.supStates.length], pickBuy(e.buy), { weight: 1 / (i + 1) ** 0.8 }));
}
const pickWeighted = (list) => { const tot = list.reduce((a, x) => a + x.weight, 0); let r = g.rnd() * tot; for (const x of list) { r -= x.weight; if (r <= 0) return x; } return list[list.length - 1]; };

// Government departments deducting TDS (s.51): GSTINs issued on their TAN, so the 13th character is "D"
const tanGstin = (state, tan) => { const b = `${String(state).padStart(2, '0')}${tan}1D`; return b + checkDigit(b); };
const DEDUCTORS = {
  G34A: [['EXECUTIVE ENGINEER, PUBLIC WORKS DIVISION NO. 2, PUNE', 'ZZPN04512K', 0.45], ['EXECUTIVE ENGINEER, NATIONAL HIGHWAY DIVISION, PUNE', 'ZZPN07731M', 0.35], ['CHIEF ENGINEER, WATER RESOURCES REGION, PUNE', 'ZZPN02209B', 0.2]],
  G34B: [['DIVISIONAL ENGINEER, RING ROAD PROJECT DIVISION, PUNE', 'ZZPN09914R', 1]],
  G34C: [['CHIEF PROJECT MANAGER, METRO RAIL PACKAGE 2, BENGALURU', 'ZZBL03318T', 1]],
};
for (const [k, list] of Object.entries(DEDUCTORS)) byKey[k].govtCustomers = list.map(([name, tan, weight]) => ({ key: `D-${tan}`, name, state: byKey[k].state, gstin: tanGstin(byKey[k].state, tan), weight, generated: false, deductor: true }));

// E-commerce operators collecting TCS (s.52) on the marketplace sales of G33
export const ECOS = [{ name: 'BAZAARKART INTERNET PRIVATE LIMITED', pan: 'ZZBCB6101Q', share: 0.58 }, { name: 'SHOPNEST ONLINE SERVICES PRIVATE LIMITED', pan: 'ZZSCS6102W', share: 0.42 }];
const ecoGstin = (state, eco) => gstin(state, eco.pan);

// Planted counterparties
const shell = (state, prod, fromFy, fromM, note) => makeExternal(state, prod, { shell: true, activeFrom: { fy: fromFy, m: fromM }, filesNo3B: true, type: 'P', note, registered: dateIn(fromFy, fromM, 3) });
const G37shells = [shell(27, P.cuscrap, 2025, 1, 'registered May 2025, no GSTR-3B'), shell(27, P.aluscrap, 2025, 3, 'registered Jul 2025, no GSTR-3B'), shell(24, P.cuscrap, 2025, 5, 'registered Sep 2025, no GSTR-3B')];
const G37retro = makeExternal(27, P.cuscrap, { type: 'C', cancelledOn: '2025-08-31', cancelOrder: '2026-02-17', registered: '2021-03-15', note: 'registration cancelled with effect from 31-08-2025 (order of 17-02-2026)' });
const G37badCustomer = makeExternal(27, P.pp, { invalid: true, type: 'F', note: 'GSTIN fails its check digit' });
const G34subcon = makeExternal(27, P.subcon, { type: 'C', note: 'sub-contractor that filed its FY 2024-25 GSTR-1 for February and March only in December 2025' });
const G31hotel = makeExternal(30, P.hotel, { type: 'C', note: 'resort in Goa that hosted the January 2026 dealer conference' });
const G36mills = byKey.G36A.suppliers.slice(0, 5); // its largest suppliers: steel mills that give quarterly price-protection credit notes

// ------------------------------------------------------------------ the ledger
const ledger = []; // { fy, m, seller, buyer, date, prod, rate, taxable, tags[] }
const add = (fy, m, seller, buyer, date, prod, taxable, tags = [], extra = {}) => ledger.push({ fy, m, seller, buyer, date, prod, rate: rateOf(prod, date), taxable: r2(taxable), tags: [...tags], ...extra });
const split = (amount, n) => {
  if (amount <= 0) return [];
  const w = Array.from({ length: Math.max(1, n) }, () => g.logU(0.1, 10)); // two full decades: first digits follow Benford's law
  const tot = w.reduce((a, b) => a + b, 0);
  return w.map((x) => (amount * x) / tot);
};
const isActive = (x, fy, m) => !x.activeFrom || fy > x.activeFrom.fy || (fy === x.activeFrom.fy && m >= x.activeFrom.m);
const entityActive = (e, fy, m) => !e.from || fy > e.from.fy || (fy === e.from.fy && m >= e.from.m);
const annual = (e) => e.group.turnover * e.share * CR; // FY 2023-24 sales of the registration, ₹
const monthly = (e, fy, m) => (annual(e) / 12) * e.group.growth[Y(fy)] * SEASON[e.group.season][m] * (e.ramp && fy === 2025 ? RAMP[m] : 1) * (0.95 + g.rnd() * 0.1);
const b2cLedger = []; // G33 marketplace sales: { fy, m, e, eco, state, prod, taxable, returned }
const imports = []; // { fy, m, e, date, port, boe, prod, taxable, igst }
const boeSeq = { INNSA1: 4100000, INIXY1: 7300000 };
const B2C_STATES = [['27', 0.2], ['29', 0.14], ['07', 0.12], ['09', 0.1], ['24', 0.09], ['33', 0.09], ['36', 0.07], ['19', 0.07], ['23', 0.06], ['32', 0.06]];

for (const fy of FYS) {
  for (const e of ALL) if (e.loses?.fy === fy) e.customers[0].weight *= e.loses.factor; // lost most of a major customer's business
  for (let m = 0; m < 12; m++) {
    for (const e of ALL) {
      if (!entityActive(e, fy, m)) continue;
      let sales = monthly(e, fy, m);
      if (e.milestones) sales *= [0.35, 0.45, 2.2][m % 3]; // EPC: most of a quarter certified in its last month
      const b2b = sales * (1 - (e.eco || 0));
      const n = Math.max(6, Math.round(e.inv * (sales / (annual(e) / 12)) ** 0.5));
      for (const v of split(b2b, n)) {
        const buyer = e.govt && g.rnd() < e.govt ? pickWeighted(e.govtCustomers) : pickWeighted(e.customers);
        add(fy, m, e, buyer, workday(fy, m), g.pick(e.sell), v);
      }
      if (e.eco) { // marketplace sales to consumers, by state and operator; returns come back the same month
        for (const eco of ECOS) for (const [st, w] of B2C_STATES) {
          const prod = g.pick(e.sell);
          const taxable = sales * e.eco * eco.share * w * (0.9 + g.rnd() * 0.2);
          b2cLedger.push({ fy, m, e, eco, state: st, prod, rate: rateOf(prod, dateIn(fy, m, 15)), taxable: r2(taxable), returned: r2(taxable * (0.05 + g.rnd() * 0.05)) });
        }
      }
      if (e.imports) { // bills of entry for the imported raw material
        const value = sales * e.imports.share * (0.97 + g.rnd() * 0.06);
        for (const v of split(value, g.ri(3, 7))) {
          const prod = e.imports.alt && g.rnd() < 0.3 ? e.imports.alt : e.imports.prod;
          imports.push({ fy, m, e, date: workday(fy, m), port: e.imports.port, boe: String(++boeSeq[e.imports.port]), prod, taxable: r2(v), igst: r2((v * rateOf(prod, dateIn(fy, m, 15))) / 100) });
        }
      }
      const buy = sales * e.buyRatio * (0.97 + g.rnd() * 0.06);
      const pool = e.suppliers.filter((s) => isActive(s, fy, m));
      for (const v of split(buy, Math.max(4, Math.round(n * 0.8)))) {
        const prod = pickBuy(e.buy);
        add(fy, m, pickWeighted(pool), e, workday(fy, m), prod, v, prod.rc ? ['rcm'] : []);
      }
    }
  }
}

// ---- intra-group and cross-group flows: [from, to, ₹ crore per year (FY 23, 24, 25), product, tags]
const FLOWS = [
  ['G31A', 'G31B', [1100, 1200, 1250], P.ac, ['stock-transfer']], ['G31A', 'G31C', [700, 760, 800], P.fridge, ['stock-transfer']],
  ['G32A', 'G32B', [2600, 2750, 2900], P.palmolein, ['stock-transfer']], ['G32B', 'G35A', [180, 190, 170], P.palmolein, ['supply-chain']],
  ['G34A', 'G34B', [600, 680, 720], P.works, ['intra-group']],
  ['G36A', 'G34A', [240, 260, 230], P.tmt, ['supply-chain']], ['G36A', 'G34C', [90, 100, 95], P.tmt, ['supply-chain']],
  ['G38A', 'G36A', [300, 330, 290], P.scrap, ['supply-chain']], ['G37A', 'G38A', [20, 140, 380], P.cuscrap, ['supply-chain']],
  ['G37A', 'G37B', [0, 120, 380], P.cuscrap, ['reciprocal']], ['G37B', 'G37A', [0, 110, 360], P.pp, ['reciprocal']],
  ['G39A', 'G39B', [420, 450, 430], P.molasses, ['intra-group']], ['G39A', 'G35A', [40, 42, 38], P.sugar, ['supply-chain']],
];
for (const fy of FYS) {
  for (let m = 0; m < 12; m++) {
    for (const [from, to, crs, prod, tags] of FLOWS) {
      const s = byKey[from], b = byKey[to];
      if (!entityActive(s, fy, m) || !entityActive(b, fy, m) || !crs[Y(fy)]) continue;
      const amount = (crs[Y(fy)] * CR / 12) * (s.ramp && fy === 2025 ? RAMP[m] : 1) * (0.9 + g.rnd() * 0.2);
      for (const v of split(amount, Math.max(4, Math.round(Math.sqrt(crs[Y(fy)]) / 2)))) add(fy, m, s, b, workday(fy, m), prod, v, tags);
      // a trader buys what it sells, including what it supplies to other groups
      if (s.buyRatio >= 0.95) for (const v of split(amount * s.buyRatio, Math.max(4, Math.round(Math.sqrt(crs[Y(fy)]) / 2)))) add(fy, m, pickWeighted(s.suppliers.filter((x) => isActive(x, fy, m))), s, workday(fy, m), prod, v);
    }
  }
}

// ---- G31: January 2026 dealer conference at a Goa resort: place of supply Goa, so the ITC is not available (2B reason)
for (const v of split(6.8 * CR, 5)) add(2025, 9, G31hotel, byKey.G31A, dateIn(2025, 9, g.ri(16, 20)), P.hotel, v, ['pos-blocked'], { posState: '30' });
// ---- G34: FY 2024-25 sub-contractor invoices reaching GSTR-2B only in January 2026, claimed then: time-barred (s.16(4))
for (const v of split(23 * CR, 9)) add(2025, 9, G34subcon, byKey.G34A, dateIn(2024, g.ri(10, 11), g.ri(3, 27)), P.subcon, v, ['time-barred'], { noFy: 2024 });
// ---- G36: Rajgad files its February and March 2026 GSTR-1 after the cut-off: Lenyadri's GSTR-2B does not show them
for (const x of ledger.filter((t) => t.seller === byKey.G36A && t.buyer === byKey.G34A && t.fy === 2025 && t.m >= 10)) x.tags.push('late-gstr1');
// ---- G37: shells feeding the trader, sold on within days at under 1% (round lakh amounts), plus the retrospectively
// cancelled supplier and a customer whose GSTIN fails its check digit
const roundL = (v) => Math.max(1e5, Math.round(v / 1e5) * 1e5);
for (let m = 0; m < 12; m++) {
  for (const s of G37shells.filter((x) => isActive(x, 2025, m))) {
    for (const v of split(34 * CR * RAMP[m], 10)) {
      const d = workday(2025, m);
      const t = roundL(v);
      add(2025, m, s, byKey.G37A, d, P.cuscrap, t, ['shell-supplier', 'pass-through-in', 'round']);
      add(2025, m, byKey.G37A, pickWeighted(byKey.G37A.customers), laterInMonth(2025, m, d, g.ri(1, 3)), P.cuscrap, roundL(t * 1.008), ['pass-through-out', 'round']);
    }
  }
  if (m <= 8) for (const v of split(9 * CR, 6)) add(2025, m, G37retro, byKey.G37A, workday(2025, m), P.cuscrap, v, ['retro-cancelled']);
  if (m >= 6) for (const v of split(2.2 * CR, 3)) add(2025, m, byKey.G37A, G37badCustomer, workday(2025, m), P.pp, v, ['invalid-gstin']);
}
for (const fy of [2023, 2024]) for (let m = 0; m < 12; m++) for (const v of split(G37retro.weight * 2.5 * CR * (fy === 2024 ? 3 : 1), 3)) add(fy, m, G37retro, byKey.G37A, workday(fy, m), P.cuscrap, v, ['retro-cancelled']);
// ...a tenth of its sales invoices charge tax on less than the taxable value (short-charged), and six shell invoices
// appear twice in GSTR-2B (uploaded twice by the supplier)
for (const x of ledger.filter((t) => t.seller === byKey.G37A && t.fy === 2025 && !t.tags.includes('pass-through-out')).filter((_, i) => i % 9 === 0)) x.tags.push('short-tax');
const dupes = new Set(ledger.filter((t) => t.buyer === byKey.G37A && t.tags.includes('shell-supplier')).filter((_, i) => i % 23 === 5).slice(0, 6));
for (const x of dupes) x.tags.push('duplicate-2b');
for (const x of ledger.filter((t) => t.seller === byKey.G37A && t.fy === 2025).filter((_, i) => i % 8 === 3)) x.noIrn = true;
// ---- G38: consignments to Gujarat buyers split just under the ₹50,000 inter-state e-way bill limit, and a fifth of its
// invoices dated on Sundays
{
  const gj = byKey.G38A.customers.filter((c) => c.state === '24');
  for (const fy of FYS) for (let m = 0; m < 12; m++) for (let i = 0; i < (fy === 2025 ? 70 : 45); i++) add(fy, m, byKey.G38A, g.pick(gj), workday(fy, m), P.aluscrap, g.ri(44000, 49900) / 1.18, ['below-ewb-threshold']);
}
for (const x of ledger.filter((t) => t.seller === byKey.G38A && t.buyer.generated === false)) if (g.rnd() < 0.21) { x.date = sunday(x.fy, x.m); x.tags.push('sunday'); }
// ---- G37: from FY 2024-25 a third of its invoices, both sides, are in round thousands
for (const x of ledger.filter((t) => (t.seller.group?.key === 'G37' || t.buyer.group?.key === 'G37') && t.fy >= 2024 && !t.tags.includes('round'))) if (g.rnd() < 0.35) { x.taxable = Math.max(1000, Math.round(x.taxable / 1000) * 1000); x.tags.push('round'); }

// ------------------------------------------------------------------ invoice numbers: sequential by date per seller and year
const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
const seqs = new Map();
for (const x of ledger) { const k = `${x.seller.gstin}|${x.noFy ?? x.fy}`; (seqs.get(k) || seqs.set(k, []).get(k)).push(x); }
const prefixOf = (e) => `${e.name.split(' ').filter((w) => !/^(AND|OF|THE|&)$/.test(w)).slice(0, 3).map((w) => w[0]).join('')}${e.state === '27' ? '' : `-${e.state}`}`;
for (const list of seqs.values()) {
  list.sort(byDate);
  list.forEach((x, i) => {
    const fyN = x.noFy ?? x.fy;
    x.seq = i + 1;
    const fyTag = `${String(fyN).slice(2)}-${String(fyN + 1).slice(2)}`;
    x.no = x.seller.generated ? `${prefixOf(x.seller)}/${fyTag}/${String(i + 1).padStart(6, '0')}` : `${x.seller.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}/${fyTag}/${1000 + i}`;
  });
}

// ------------------------------------------------------------------ filing behaviour and planted return defects
const PLAN = {
  G32A: { 2025: { excessImportItc: { 3: 8.4 * CR, 5: 11.2 * CR, 7: 6.9 * CR, 9: 7.8 * CR } } },
  G33A: { 2025: { filedOn: { 6: '2025-11-27', 7: '2025-12-29' }, interestPaid: { 6: 210000 } } },
  G36A: { 2024: { rcmDeclaredShare: 0.4, rcmItcShare: 1 }, 2025: { rcmDeclaredShare: 0.4, rcmItcShare: 1, ignoreSupplierCdns: true } },
  G37A: { 2023: { irn: false }, 2024: { irn: false, filedOn: { 9: '2025-02-24' } }, 2025: { filedOn: { 4: '2025-09-27', 8: '2026-01-26' } } },
  G37B: { 2024: { irn: false } },
  G38A: { 2024: { filedOn: { 3: '2024-09-18', 4: '2024-10-29', 7: '2025-01-31' } }, 2025: { unfiledPeriods: [10, 11], filedOn: { 5: '2025-11-14' } } },
  G35A: { 2025: { filedOn: { 11: '2026-04-24' }, interestPaid: { 11: 96000 } } },
};
const filed3B = (seller, date) => !seller.filesNo3B && !(seller.cancelledOn && date > seller.cancelledOn);

// ------------------------------------------------------------------ credit notes
// G35: credit notes grow year by year and bunch in March; in FY 2025-26 a quarter of their value is issued from
// December 2025 against FY 2024-25 invoices (after the s.34(2) deadline of 30 November) and a third carries no
// original invoice at all. The other groups issue a few volume discounts in the ordinary course.
const CN_PLAN = { G35A: { 2023: [0.02, 0.1], 2024: [0.05, 0.4], 2025: [0.095, 0.72] }, G35B: { 2023: [0.01, 0.1], 2024: [0.015, 0.2], 2025: [0.02, 0.3] }, G31A: { 2025: [0.012, 0.25] }, G32B: { 2024: [0.008, 0.2], 2025: [0.009, 0.2] } };
function creditNotesOf(e, fy) {
  const plan = CN_PLAN[e.key]?.[fy];
  if (!plan) return [];
  const [share, march] = plan;
  const invs = ledger.filter((t) => t.seller === e && t.fy === fy && t.buyer.generated === false && !t.buyer.deductor);
  const total = invs.reduce((s, x) => s + x.taxable, 0) * share;
  const out = [];
  let n = 0;
  const note = (m, x, amount, { orig = true, prior = false } = {}) => {
    const t = r2(amount);
    out.push({ m, c: { gstin: x.buyer.gstin, name: x.buyer.name, state: x.buyer.state }, hsn: x.prod.hsn, no: `${prefixOf(e)}/CN/${String(fy).slice(2)}-${String(fy + 1).slice(2)}/${String(++n).padStart(5, '0')}`,
      date: dateIn(fy, m, g.ri(5, 27)), origNo: orig ? x.no : null, origDate: orig ? x.date : null, rate: x.rate, taxable: t, ...heads(t, x.rate, x.buyer.state === e.state), prior });
  };
  const big = invs.filter((x) => e.customers.slice(0, 12).includes(x.buyer));
  const pickInv = (list) => list[Math.floor(g.rnd() * list.length)];
  let left = total;
  // FY 2025-26 (G35A): notes after 30 November 2025 against FY 2024-25 invoices, and notes with no invoice reference
  if (e.key === 'G35A' && fy === 2025) {
    const prior = ledger.filter((t) => t.seller === e && t.fy === 2024 && e.customers.slice(0, 12).includes(t.buyer));
    for (let i = 0; i < 40; i++) { const x = pickInv(prior); const a = (total * 0.25) / 40; note(g.pick([8, 9, 10, 11, 11, 11]), x, a, { prior: true }); left -= a; }
    for (let i = 0; i < 60; i++) { const x = pickInv(big); const a = (total * 0.33) / 60; note(g.rnd() < 0.8 ? 11 : 10, x, a, { orig: false }); left -= a; }
  }
  const k = Math.max(12, Math.round(left / 2e6));
  for (let i = 0; i < k; i++) {
    const x = pickInv(big.length ? big : invs);
    const m = g.rnd() < march ? 11 : Math.max(x.m, g.ri(0, 10));
    note(m, x, left / k);
  }
  return out;
}
// G36: quarterly price-protection credit notes from its steel mills (4.5% of the quarter's purchases from each)
function supplierCdnsOf(e, fy) {
  if (e.key !== 'G36A') return [];
  const out = [];
  for (const mill of G36mills) for (const q of [2, 5, 8, 11]) {
    const base = ledger.filter((t) => t.seller === mill && t.buyer === e && t.fy === fy && t.m <= q && t.m > q - 3);
    if (!base.length) continue;
    const t = r2(base.reduce((s, x) => s + x.taxable, 0) * 0.045);
    const rate = base[0].rate;
    out.push({ m: q, s: { gstin: mill.gstin, name: mill.name, state: mill.state }, no: `${mill.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}/CN/${String(fy).slice(2)}/${q}${out.length}`, date: dateIn(fy, q, g.ri(24, 28)), rate, taxable: t, ...heads(t, rate, mill.state === e.state) });
  }
  return out;
}

// ------------------------------------------------------------------ project the ledger into each registration-year's workbook
const party = (x) => ({ gstin: x.gstin, name: x.name, state: x.state });
const fileOf = (e, fy) => `Get Download All Report_${e.gstin}_${fy} - ${fy + 1}_GEN ${e.group.short}${e.group.entities.length > 1 ? ` ${e.key.slice(3)}` : ''}.xlsx`;
const years = (e) => FYS.filter((fy) => activeIn(e, fy));
export const expectedFiles = () => ALL.flatMap((e) => years(e).map((fy) => fileOf(e, fy)));
const stamp = path.join(DATA, '.ltu-pune.version');
const tcsRate = (fy, m) => (dateIn(fy, m, 15) >= '2024-07-10' ? 0.5 : 1); // % of net taxable value (s.52, from 10-07-2024)
const periodTag = (fy, m) => { const { y, cm } = calOf(fy, m); return `${String(cm).padStart(2, '0')}${y}`; };

export async function generate({ registers = false } = {}) {
  fs.mkdirSync(DATA, { recursive: true });
  const mine = new Set(ALL.map((e) => e.gstin));
  for (const f of fs.readdirSync(DATA)) if (/_GEN .*\.xlsx$/i.test(f) && mine.has(f.split('_')[1])) fs.rmSync(path.join(DATA, f)); // previous versions
  const written = [];
  for (const e of ALL) {
    for (const fy of years(e)) {
      const sales = ledger.filter((x) => x.seller === e && x.fy === fy).sort(byDate).map((x) => {
        const h = heads(x.taxable, x.rate, x.buyer.state === e.state);
        const tax = x.tags.includes('short-tax') ? Object.fromEntries(Object.entries(h).map(([k, v]) => [k, r2(v * 0.9)])) : h; // tax on 90% of the value
        return { m: x.m, c: party(x.buyer), no: x.no, seq: x.seq, date: x.date, rate: x.rate, taxable: x.taxable, ...tax, hsn: x.prod.hsn, noIrn: x.noIrn };
      });
      const purchases = ledger.filter((x) => x.buyer === e && x.fy === fy).sort(byDate).flatMap((x) => {
        const late = x.tags.includes('late-gstr1');
        const row = { m: x.m, s: party(x.seller), no: x.no, date: x.date, rate: x.rate, taxable: x.taxable, ...heads(x.taxable, x.rate, (x.posState || e.state) === x.seller.state), rc: !!x.prod.rc,
          filed3B: filed3B(x.seller, x.date), posState: x.posState, itcNo: x.tags.includes('pos-blocked'), ...(late ? { in2A: false, in2B: false } : {}) };
        return x.tags.includes('duplicate-2b') ? [row, { ...row }] : [row];
      });
      const b2cs = [];
      const tcs = [];
      if (e.eco) {
        const rows = b2cLedger.filter((x) => x.e === e && x.fy === fy);
        for (const x of rows) {
          const kept = fy === 2025 && x.m >= 3 ? 0.68 : 1; // FY 2025-26 from July: a third of marketplace sales left out of the returns
          const t = r2((x.taxable - x.returned) * kept);
          b2cs.push({ m: x.m, state: x.state, rate: x.rate, taxable: t, ...heads(t, x.rate, x.state === e.state), hsn: x.prod.hsn, eco: ecoGstin(e.state, x.eco) });
        }
        for (const eco of ECOS) for (let m = 0; m < 12; m++) {
          const mine2 = rows.filter((x) => x.eco === eco && x.m === m);
          if (!mine2.length) continue;
          const gross = r2(mine2.reduce((s, x) => s + x.taxable, 0)), returned = r2(mine2.reduce((s, x) => s + x.returned, 0)), net = r2(gross - returned);
          const intra = mine2.filter((x) => x.state === e.state).reduce((s, x) => s + x.taxable - x.returned, 0);
          const pct = tcsRate(fy, m) / 100;
          tcs.push({ m, eco: ecoGstin(e.state, eco), ecoName: eco.name, period: periodTag(fy, m), gross, returned, net, igst: r2((net - intra) * pct), cgst: r2((intra * pct) / 2), sgst: r2((intra * pct) / 2) });
        }
      }
      const tds = [];
      if (e.govtCustomers) {
        for (const x of ledger.filter((t) => t.seller === e && t.fy === fy && t.buyer.deductor)) {
          const m = Math.min(11, x.m + (g.rnd() < 0.6 ? 1 : 0)); // deducted when paid, usually the next month
          const base = x.taxable;
          tds.push({ m, deductor: x.buyer.gstin, base: r2(base), cgst: r2(base * 0.01), sgst: r2(base * 0.01), igst: 0 });
        }
      }
      const imps = imports.filter((x) => x.e === e && x.fy === fy).map((x) => ({ m: x.m, date: x.date, port: x.port, boe: x.boe, taxable: x.taxable, igst: x.igst }));
      const { irn = true, ...opts } = PLAN[e.key]?.[fy] || {};
      const lead = e.group.kind === 'clean' ? () => g.ri(2, 8) : e.group.kind === 'tricky' ? () => g.ri(0, 5) : () => g.ri(-1, 2);
      const { wb, stats } = writeReturns({
        name: e.name, gstin: e.gstin, state: Number(e.state), fy, filing: 'monthly', irn, extractDate: EXTRACT[fy], activeFrom: e.from?.fy === fy ? e.from.m : 0,
        title: `SYNTHETIC LARGE TAXPAYER ${JURISDICTION} - not a real taxpayer`, portalLateFee: true, sales, cdns: creditNotesOf(e, fy), purchases, supplierCdns: supplierCdnsOf(e, fy), b2cs, tcs, tds, imports: imps, stateNames: STATE_NAME, ...opts,
      }, { filingLead: lead });
      const file = fileOf(e, fy);
      fs.writeFileSync(path.join(DATA, file), XLSX.write(wb, { bookType: 'xlsx', type: 'buffer', compression: true }));
      written.push({ key: e.key, fy, file, ...stats, b2cs: b2cs.length, imports: imps.length, tds: tds.length, tcs: tcs.length });
    }
  }
  fs.writeFileSync(stamp, VERSION);
  writeKey(written);
  if (registers) await installRegisters();
  return written;
}

// ------------------------------------------------------------------ registers and the answer key
const csvLine = (vals) => vals.map((v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',');
const dmy = (d) => d.split('-').reverse().join('-');
const fyLabel = (fy) => `${fy}-${String(fy + 1).slice(2)}`;
const outputTax = (e, fy, m) => ledger.filter((x) => x.seller === e && x.fy === fy && (m == null || x.m === m)).reduce((s, x) => s + taxOf(heads(x.taxable, x.rate, x.buyer.state === e.state)), 0)
  + b2cLedger.filter((x) => x.e === e && x.fy === fy && (m == null || x.m === m)).reduce((s, x) => s + ((x.taxable - x.returned) * x.rate) / 100, 0);
const inLtu = ALL.filter((e) => e.state === '27');
const REG_DATES = ['2017-07-01', '2017-07-01', '2018-04-01', '2017-07-01', '2019-10-01'];
const regDate = (e) => e.registered || REG_DATES[Number(e.key.slice(1, 3)) % REG_DATES.length];
const tax = (rows) => Math.round(rows.reduce((s, x) => s + taxOf(heads(x.taxable, x.rate, x.seller.state === x.buyer.state)), 0));
export const registerRows = () => ({
  master: [['gstin', 'legal_name', 'jurisdiction', 'range', 'officer', 'sector', 'registration_date', 'status', 'status_date'],
    ...ALL.map((e) => [e.gstin, e.name, e.state === '27' ? JURISDICTION : `External (${STATE_NAME[Number(e.state)] || e.state})`, e.state === '27' ? e.group.range : '', e.state === '27' ? e.group.officer : '', e.group.sector, dmy(regDate(e)), 'Active', '']),
    ...G37shells.map((s) => [s.gstin, s.name, 'External', '', '', 'Metal scrap trading', dmy(s.registered), 'Active', '']),
    [G37retro.gstin, G37retro.name, 'External', '', '', 'Metal scrap trading', dmy(G37retro.registered), 'Cancelled', dmy(G37retro.cancelledOn)],
  ],
  targets: [['jurisdiction', 'fy', 'month', 'target_amount', 'version', 'approved_on', 'basis'],
    ...FYS.flatMap((fy) => MONTHS.map((mn, m) => [JURISDICTION, fyLabel(fy), mn.slice(0, 3), Math.round((fy === FYS[0] ? inLtu.reduce((s, e) => s + outputTax(e, fy, m), 0) * 1.02 : inLtu.reduce((s, e) => s + outputTax(e, fy - 1, m), 0) * 1.1) / 1e5) * 1e5, 'v1', `01-04-${fy}`,
      fy === FYS[0] ? 'Opening year: 2% over the year' : 'Prior-year output tax for the month + 10%'])),
  ],
  eiu: [['signal_id', 'gstin', 'risk_parameter', 'rule_id', 'fy', 'amount', 'signal_date', 'priority', 'source', 'remarks'],
    ['EIU-2025-0301', byKey.G33A.gstin, 'E-commerce TCS value exceeds turnover declared', 'G-14', '2025-26', 0, '14-05-2026', 'High', 'EIU e-commerce analytics', 'GSTR-8 of two marketplaces against GSTR-3B'],
    ['EIU-2025-0302', byKey.G32A.gstin, 'Import IGST claimed in excess of ICEGATE bills of entry', 'B-09', '2025-26', Math.round((8.4 + 11.2 + 6.9 + 7.8) * CR), '22-04-2026', 'High', 'EIU customs data match', 'Bills of entry claimed twice'],
    ['EIU-2025-0303', byKey.G37A.gstin, 'ITC availed from suppliers not filing GSTR-3B', 'B-04', '2025-26', tax(ledger.filter((x) => x.buyer === byKey.G37A && x.tags.includes('shell-supplier'))), '09-01-2026', 'High', 'EIU network risk run', 'Three suppliers registered in 2025'],
    ['EIU-2025-0304', byKey.G37A.gstin, 'Invoices from a supplier after retrospective cancellation', '', '2025-26', tax(ledger.filter((x) => x.buyer === byKey.G37A && x.tags.includes('retro-cancelled') && x.fy === 2025 && x.date > G37retro.cancelledOn)), '03-03-2026', 'High', 'EIU network risk run', 'Registration cancelled with effect from 31-08-2025'],
    ['EIU-2025-0305', byKey.G36A.gstin, 'Reverse charge liability under-declared', 'C-01', '2025-26', 0, '18-02-2026', 'Medium', 'EIU monthly risk run', 'GTA services under reverse charge'],
    ['EIU-2025-0306', byKey.G35A.gstin, 'Credit notes issued after the time limit', 'H-01', '2025-26', 0, '11-05-2026', 'Medium', 'EIU monthly risk run', 'March 2026 credit notes against FY 2024-25 invoices'],
    ['EIU-2025-0307', byKey.G38A.gstin, 'GSTR-3B not filed while GSTR-1 filed', 'A-02', '2025-26', 0, '20-05-2026', 'High', 'EIU return filing run', 'February and March 2026'],
    ['EIU-2025-0308', byKey.G31A.gstin, 'ITC on supplies with place of supply outside the State', 'D-02', '2025-26', 0, '06-04-2026', 'Low', 'EIU monthly risk run', 'Conference services in Goa'],
  ],
});

// What every group is expected to trigger, per registration and year: the validator (scripts/synth/validate.mjs)
// checks the built data against it. rules: status per rule; flags: risk indicators raised; anomalies: network types.
export const EXPECT = [
  { key: 'G31A', fy: 2025, rules: { 'D-02': 'Review', 'B-09': 'Pass', 'B-01': 'Pass' } },
  { key: 'G31A', fy: 2024, rules: { 'B-09': 'Pass', 'D-02': 'Pass' } },
  { key: 'G32A', fy: 2025, rules: { 'B-09': 'Fail' } },
  { key: 'G32A', fy: 2024, rules: { 'B-09': 'Pass' } },
  { key: 'G33A', fy: 2025, rules: { 'G-14': 'Fail' } },
  { key: 'G33B', fy: 2025, rules: { 'G-14': 'Fail' } },
  { key: 'G33A', fy: 2024, rules: { 'G-14': 'Pass' } },
  { key: 'G34A', fy: 2025, rules: { 'B-07': 'Fail', 'G-14': 'Pass' } },
  { key: 'G34A', fy: 2024, rules: { 'B-07': 'Pass', 'G-14': 'Pass' } },
  { key: 'G35A', fy: 2025, rules: { 'H-01': 'Fail', 'H-02': 'Review' }, flags: ['cn'] },
  { key: 'G35A', fy: 2023, rules: { 'H-01': 'Pass', 'H-02': 'Pass' } },
  { key: 'G36A', fy: 2025, rules: { 'B-01': 'Fail', 'H-06': 'Fail', 'C-01': 'Fail', 'C-02': 'Fail' } },
  { key: 'G36A', fy: 2024, rules: { 'C-01': 'Fail', 'C-02': 'Fail', 'H-06': 'Pass', 'B-01': 'Pass' } },
  { key: 'G36A', fy: 2023, rules: { 'C-01': 'Pass', 'C-02': 'Pass' } },
  { key: 'G37A', fy: 2025, rules: { 'A-01': 'Fail', 'B-08': 'Fail', 'G-10': 'Fail', 'G-03': 'Fail', 'B-03': 'Fail', 'B-04': 'Review' }, flags: ['round', 'dup', 'arith', 'nonfiler'] },
  { key: 'G37A', fy: 2024, rules: { 'G-03': 'Review' } },
  { key: 'G38A', fy: 2025, rules: { 'A-02': 'Fail', 'G-05': 'Fail' }, flags: ['ewb'], prompts: ['sunday'] },
  { key: 'G38A', fy: 2024, rules: { 'J-01': 'Fail', 'J-03': 'Pass' } },
];
export const EXPECT_NETWORK = [
  { fy: '2025-2026', type: 'afterCancellation', from: () => G37retro.gstin, to: 'G37A' },
  { fy: '2025-2026', type: 'mismatch', from: 'G36A', to: 'G34A' },
  { fy: '2025-2026', type: 'nonFiler', from: () => G37shells[0].gstin, to: 'G37A' },
  { fy: '2024-2025', type: 'abrupt', via: 'G37B' },
];
export const gstinOf = (k) => (typeof k === 'function' ? k() : byKey[k]?.gstin);

const writeKey = (written) => {
  fs.mkdirSync(path.join(KEY_DIR, 'registers'), { recursive: true });
  for (const [name, rows] of Object.entries(registerRows())) fs.writeFileSync(path.join(KEY_DIR, 'registers', `${name}.csv`), rows.map(csvLine).join('\n') + '\n');
  const turnover = (e, fy) => ledger.filter((x) => x.seller === e && x.fy === fy).reduce((s, x) => s + x.taxable, 0) + b2cLedger.filter((x) => x.e === e && x.fy === fy).reduce((s, x) => s + x.taxable - x.returned, 0);
  const key = {
    generatedBy: `scripts/synth/ltu-pune.mjs (seed 27183, ${VERSION})`, jurisdiction: JURISDICTION, synthetic: true,
    note: 'Every name, PAN and figure is invented. The groups resemble kinds of businesses in behaviour only; none represents a real company.',
    groups: GROUPS.map((grp) => ({ key: grp.key, kind: grp.kind, sector: grp.sector, name: grp.entities[0].name,
      turnoverCrore: FYS.map((fy) => Math.round(grp.entities.reduce((s, e) => s + turnover(e, fy), 0) / CR)),
      registrations: grp.entities.map((e) => ({ key: e.key, gstin: e.gstin, name: e.name, state: e.state, role: e.role, years: years(e).map(fyLabel), samePanAsParent: e.pan === grp.entities[0].pan })) })),
    planted: {
      G31: 'Clean benchmark. Imports compressors (bills of entry match 3B 4A(1)). January 2026 dealer conference at a Goa resort: place of supply Goa, GSTR-2B marks the ITC not available and it is not disclosed in 4D(2) (D-02). Air-conditioner rate falls from 28% to 18% on 22-09-2025.',
      G32: 'Large importer of crude palm and soyabean oil. FY 2025-26: 3B 4A(1) import ITC exceeds the IGST on ICEGATE bills of entry by Rs 34.3 crore in four months (B-09). Same-PAN stock transfers Kandla -> Pune.',
      G33: 'Marketplace seller: 85% of sales to consumers through two e-commerce operators who collect TCS. From July 2025 a third of those sales is left out of GSTR-1 and GSTR-3B, so the operators\' TCS statements exceed the turnover declared for FY 2025-26 (G-14). Turnover nearly triples over three years.',
      G34: 'EPC contractor for government departments that deduct TDS (G-14 passes: TDS base within turnover). Milestone billing (turnover spike prompt). January 2026: FY 2024-25 sub-contractor invoices reach GSTR-2B late and are claimed after 30 November (B-07). Rajgad Steel files its Feb-Mar 2026 GSTR-1 late, so Lenyadri\'s GSTR-2B shows less than Rajgad reported (network: seller and buyer records differ).',
      G35: 'FMCG super-stockist. Credit notes rise from 2% to 9.5% of sales, bunched in March; in FY 2025-26 a quarter of them are issued after 30 November against FY 2024-25 invoices (H-01) and a third carry no invoice reference (H-02). Turnover falls in FY 2025-26.',
      G36: 'Steel re-roller. FY 2024-25 and 2025-26: reverse-charge GTA tax declared at 40% while RCM ITC is taken in full (C-01, C-02). FY 2025-26: quarterly price-protection credit notes from its mills (4.5%) not netted from ITC (B-01, H-06). Genuine fall in business in FY 2025-26.',
      G37: 'Commodity trader growing from about Rs 80 crore to about Rs 3,700 crore in three years. FY 2025-26: three shell suppliers (no GSTR-3B) resold within days at under 1% in round lakh amounts; goods never moved (no e-way bills); six shell invoices twice in GSTR-2B; a tenth of sales invoices charge tax on 90% of the value; sales to a customer whose GSTIN fails its check digit; a supplier cancelled retrospectively from 31-08-2025 whose later invoices are in GSTR-2B; related LLP in Gujarat registered May 2024 trading at full volume from its first month; no IRN in FY 2023-24 and 2024-25, and an eighth of invoices without IRN in FY 2025-26.',
      G38: 'Non-ferrous scrap dealer. A fifth of sales invoices dated on Sundays; consignments to Gujarat split just under the Rs 50,000 inter-state e-way bill limit; e-way bills for goods moved with no invoice in GSTR-1 (G-05); three late returns in FY 2024-25 with the late fee but no interest (J-01); GSTR-3B for February and March 2026 not filed though GSTR-1 was (A-02).',
      G39: 'Clean benchmark with seasonal (crushing) sales. Molasses rate falls from 28% to 5% on 07-10-2023. The distillery loses most of its largest ethanol customer\'s allocation in FY 2025-26.',
    },
    expectations: EXPECT.map((x) => ({ ...x, gstin: byKey[x.key].gstin, fy: fyLabel(x.fy) })),
    workbooks: written.map((w) => ({ key: w.key, fy: fyLabel(w.fy), file: w.file, sales: w.sales, purchases: w.purchases, cdns: w.cdns, b2cs: w.b2cs, imports: w.imports, tds: w.tds, tcs: w.tcs })),
  };
  // What the simulated e-way bill system (scripts/synth/ewb.mjs) needs to know about these groups
  const ewbPlan = {
    version: VERSION,
    noMovement: [...G37shells.map((s) => [s.gstin, byKey.G37A.gstin, 0.85])],
    suppressed: { [byKey.G38A.gstin]: 0.05, [byKey.G37A.gstin]: 0.03 },
    vehicleClash: { [byKey.G38A.gstin]: 3, [byKey.G37A.gstin]: 4 },
    cancel: Object.fromEntries(ALL.filter((e) => e.group.kind === 'risky').map((e) => [e.gstin, 0.06])),
    shipTo: {},
  };
  fs.writeFileSync(path.join(KEY_DIR, 'ewb-plan.json'), JSON.stringify(ewbPlan));
  key.ewb = { noMovement: 'G37 purchases from its three shell suppliers (85%) have no e-way bill: the goods never moved (B-03).', suppressed: 'G38 5% and G37 3% of bills move goods to unregistered buyers with no invoice in GSTR-1 (G-05).', vehicleClash: 'G38: 3, G37: 4 impossible journeys.' };
  fs.writeFileSync(path.join(KEY_DIR, 'answer-key.json'), JSON.stringify(key, null, 1));
};

// Merge the LTU-PUNE rows into the stored registers (master, targets, eiu), replacing any earlier LTU-PUNE rows.
async function installRegisters() {
  const { parseRegister } = await import('../../src/engine/registers.js');
  const dir = path.join(DATA, 'registers');
  for (const [type, rows] of Object.entries(registerRows())) {
    const file = path.join(dir, `${type}.json`);
    const current = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { meta: { type }, records: [] };
    const header = rows[0];
    const parsed = parseRegister(type, rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]]))));
    if (parsed.errors?.length) throw new Error(`${type}: ${parsed.errors.slice(0, 3).join('; ')}`);
    const ours = new Set(parsed.records.map((r) => r.gstin || r.signalId || `${r.jurisdiction}|${r.fy}|${r.month}`));
    const keep = current.records.filter((r) => !ours.has(r.gstin || r.signalId || `${r.jurisdiction}|${r.fy}|${r.month}`) && r.jurisdiction !== JURISDICTION);
    const records = [...keep, ...parsed.records];
    const meta = { ...current.meta, rows: records.length, mergedBy: VERSION, sha256: crypto.createHash('sha256').update(JSON.stringify(records)).digest('hex') };
    fs.writeFileSync(file, JSON.stringify({ meta, records }));
  }
}

// Take the unit out of a data folder: every LTU-PUNE workbook (any file name) to superseded/, its e-way bills deleted,
// its rows removed from the registers. Nothing else is touched.
export function removeUnit(dataDir = DATA) {
  const ours = new Set([...ALL.map((e) => e.gstin), ...G37shells.map((s) => s.gstin), G37retro.gstin]);
  const stampNow = new Date().toISOString().replace(/[:.]/g, '-');
  const moved = [];
  fs.mkdirSync(path.join(dataDir, 'superseded'), { recursive: true });
  for (const f of fs.readdirSync(dataDir)) {
    if (!/\.xlsx$/i.test(f) || !ALL.some((e) => f.toUpperCase().includes(e.gstin))) continue;
    fs.renameSync(path.join(dataDir, f), path.join(dataDir, 'superseded', `${stampNow}_${f}`));
    moved.push(f);
  }
  const ewbDir = path.join(dataDir, 'ewb');
  if (fs.existsSync(ewbDir)) for (const f of fs.readdirSync(ewbDir)) if (ALL.some((e) => f.startsWith(`${e.gstin}_`))) fs.rmSync(path.join(ewbDir, f));
  const signals = new Set(registerRows().eiu.slice(1).map((r) => r[0]));
  const rows = {};
  for (const type of ['master', 'targets', 'eiu']) {
    const file = path.join(dataDir, 'registers', `${type}.json`);
    if (!fs.existsSync(file)) continue;
    const cur = JSON.parse(fs.readFileSync(file, 'utf8'));
    const records = cur.records.filter((r) => r.jurisdiction !== JURISDICTION && !(type === 'master' && ours.has(r.gstin)) && !(type === 'eiu' && signals.has(r.signalId)));
    rows[type] = cur.records.length - records.length;
    fs.writeFileSync(file, JSON.stringify({ meta: { ...cur.meta, rows: records.length, sha256: crypto.createHash('sha256').update(JSON.stringify(records)).digest('hex') }, records }));
  }
  fs.rmSync(path.join(dataDir, '.ltu-pune.version'), { force: true });
  return { moved, rows };
}

// ------------------------------------------------------------------ command line
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = new Set(process.argv.slice(2));
  if (args.has('--remove')) {
    const { moved, rows } = removeUnit();
    console.log(`LTU-PUNE removed: ${moved.length} workbooks moved to ${path.relative(ROOT, path.join(DATA, 'superseded'))}; register rows removed: ${Object.entries(rows).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}. Rebuild with: node scripts/build-data.mjs`);
    process.exit(0);
  }
  const have = fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8') === VERSION && expectedFiles().every((f) => fs.existsSync(path.join(DATA, f)));
  if (args.has('--if-missing') && have) {
    console.log(`LTU-PUNE workbooks (${VERSION}) already present: ${expectedFiles().length} files.`);
  } else {
    const t0 = Date.now();
    const written = await generate({ registers: args.has('--registers') });
    console.log(`Wrote ${written.length} LTU-PUNE workbooks (${GROUPS.length} groups, ${ALL.length} registrations, FY ${FYS[0]}-${String(FYS[FYS.length - 1] + 1).slice(2)}) to ${path.relative(ROOT, DATA)} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
}
