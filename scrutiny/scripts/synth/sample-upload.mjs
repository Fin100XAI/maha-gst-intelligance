// A small upload sample: four fictional taxpayers, two financial years each (8 returns workbooks), each with one
// plain story, so an upload can be checked at a glance: one clean, three with a clear problem.
//
//   node scripts/synth/sample-upload.mjs [out-dir]     default: upload-pack/sample/ (git-ignored)
//
// Every name, GSTIN (PAN starting "ZZ") and figure is invented. Deterministic (seed 4242).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { r2, gstin, makeRng, heads, calOf, iso } from './lib.mjs';
import { writeReturns } from './workbook.mjs';
import { P, rateOf, STATE_NAME } from './products.mjs';
import { parseWorkbook } from '../../src/engine/parse.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CR = 1e7;
const FYS = [2024, 2025];
const EXTRACT = { 2024: '2025-11-20', 2025: '2026-09-26' };
const g = makeRng(4242);

// story: what the sample shows; turnover: ₹ crore a year; plan: planted return defects per FY (workbook.mjs options)
export const SAMPLE = [
  { key: 'S1', name: 'KONDHWA PRECISION TOOLS PRIVATE LIMITED', pan: 'ZZKCK7101A', turnover: 140, sell: [P.forging, P.casting], buy: [P.hrc, P.scrap], buyRatio: 0.6,
    story: 'Clean: returns agree with each other, filed on time. Expect Low risk.', plan: {} },
  { key: 'S2', name: 'VAIBHAV STEEL TRADERS', pan: 'ZZVFV7102B', type: 'F', turnover: 310, sell: [P.hrc, P.tmt], buy: [P.hrc, P.tmt], buyRatio: 0.97,
    story: 'ITC claimed in GSTR-3B above GSTR-2B (B-01) and tax declared in GSTR-1 not paid in GSTR-3B (G-02), with late returns. Expect High risk.',
    plan: { 2025: { excessItc: { 4: 1.1 * CR, 6: 1.4 * CR, 8: 0.9 * CR, 10: 1.6 * CR }, underDeclare: { 9: { taxable: 6 * CR, tax: 1.08 * CR } }, filedOn: { 3: '2025-09-02', 7: '2026-01-12' } } } },
  { key: 'S3', name: 'GIRIRAJ POLYMERS LLP', pan: 'ZZGFG7103C', type: 'F', turnover: 95, sell: [P.polymer, P.pp], buy: [P.polymer, P.pp], buyRatio: 0.96,
    story: 'A third of its ITC comes from suppliers that have not filed GSTR-3B (B-04, non-filer indicator), invoices in round lakhs. Expect Moderate to High risk.',
    plan: {}, shellShare: 0.35, round: true },
  { key: 'S4', name: 'SHRAVANI FASHIONS PRIVATE LIMITED', pan: 'ZZSCS7104D', turnover: 180, sell: [P.apparel, P.footwear], buy: [P.apparel, P.fabric], buyRatio: 0.7, eco: 0.8,
    story: 'Marketplace seller: in FY 2025-26 the marketplaces\' TCS statements show more sales than the turnover it declared (G-14). Expect a failed G-14.',
    plan: {} },
];
for (const t of SAMPLE) t.gstin = gstin(27, t.pan);

const lastDay = (fy, m) => { const { y, cm } = calOf(fy, m); return new Date(Date.UTC(y, cm, 0)).getUTCDate(); };
const day = (fy, m) => { for (;;) { const { y, cm } = calOf(fy, m); const d = iso(y, cm, g.ri(1, lastDay(fy, m))); if (new Date(`${d}T00:00:00Z`).getUTCDay() !== 0) return d; } };
const PLACE = ['Sahyadri', 'Deccan', 'Narmada', 'Kaveri', 'Mahalaxmi', 'Siddhivinayak', 'Om Sai', 'Pragati', 'Samarth', 'Vishal', 'Suvarna', 'Anand', 'Mahavir', 'Tirupati', 'Balaji', 'Gurukrupa', 'Saraswati', 'Everest', 'Sunrise', 'Pioneer', 'Supreme', 'Royal', 'Metro', 'Galaxy', 'Western'];
const FORM = [['Private Limited', 'C'], ['Enterprises', 'P'], ['Traders', 'F'], ['LLP', 'F'], ['Distributors', 'F'], ['Industries', 'C']];
const used = new Set();
const party = (state, word, extra = {}) => {
  let name;
  do { const [f] = g.pick(FORM); name = `${g.pick(PLACE)} ${word} ${f}`.toUpperCase(); } while (used.has(name));
  used.add(name);
  const [, type] = FORM.find(([f]) => name.endsWith(f.toUpperCase())) || FORM[0];
  return { name, state: String(state).padStart(2, '0'), gstin: gstin(state, g.pan(type)), weight: 1, ...extra };
};
const pickW = (list) => { const tot = list.reduce((s, x) => s + x.weight, 0); let r = g.rnd() * tot; for (const x of list) { r -= x.weight; if (r <= 0) return x; } return list[list.length - 1]; };
const split = (amount, n) => { const w = Array.from({ length: n }, () => g.logU(0.1, 10)); const tot = w.reduce((a, b) => a + b, 0); return w.map((x) => (amount * x) / tot); };
const ECOS = [{ name: 'BAZAARKART INTERNET PRIVATE LIMITED', pan: 'ZZBCB6101Q' }, { name: 'SHOPNEST ONLINE SERVICES PRIVATE LIMITED', pan: 'ZZSCS6102W' }];

export function build(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const files = [];
  for (const t of SAMPLE) {
    const word = { S1: 'Engineering', S2: 'Steel', S3: 'Plastics', S4: 'Fashions' }[t.key];
    const customers = Array.from({ length: 24 }, (_, i) => party(i % 4 === 3 ? 24 : 27, word, { weight: 1 / (i + 1) ** 0.85 }));
    const suppliers = Array.from({ length: 14 }, (_, i) => party(i % 5 === 4 ? 24 : 27, word, { weight: 1 / (i + 1) ** 0.8 }));
    const shells = t.shellShare ? [party(27, word, { shell: true }), party(27, word, { shell: true })] : [];
    for (const fy of FYS) {
      const sales = [], purchases = [], b2cs = [], tcs = [];
      let seq = 0;
      const round = (v) => (t.round ? Math.max(1e5, Math.round(v / 1e5) * 1e5) : r2(v));
      for (let m = 0; m < 12; m++) {
        const month = (t.turnover * CR / 12) * (fy === 2025 ? 1.08 : 1) * (0.9 + g.rnd() * 0.2);
        for (const v of split(month * (1 - (t.eco || 0)), 18)) {
          const c = pickW(customers), prod = g.pick(t.sell), date = day(fy, m), rate = rateOf(prod, date), taxable = round(v);
          sales.push({ m, c: { gstin: c.gstin, name: c.name, state: c.state }, no: `${t.key}/${String(fy).slice(2)}-${String(fy + 1).slice(2)}/${String(++seq).padStart(5, '0')}`, seq, date, rate, taxable, ...heads(taxable, rate, c.state === '27'), hsn: prod.hsn });
        }
        for (const v of split(month * t.buyRatio, 14)) {
          const shell = shells.length && g.rnd() < t.shellShare;
          const s = shell ? g.pick(shells) : pickW(suppliers), prod = g.pick(t.buy), date = day(fy, m), rate = rateOf(prod, date), taxable = round(v);
          purchases.push({ m, s: { gstin: s.gstin, name: s.name, state: s.state }, no: `${s.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}/${fy}/${g.ri(1000, 9999)}`, date, rate, taxable, ...heads(taxable, rate, s.state === '27'), rc: false, filed3B: !shell });
        }
        if (t.eco) { // marketplace sales; FY 2025-26 from July: a third left out of the returns, the marketplaces' TCS shows them all
          const actual = month * t.eco, kept = fy === 2025 && m >= 3 ? 0.66 : 1;
          for (const [st, w] of [['27', 0.35], ['29', 0.2], ['07', 0.2], ['24', 0.25]]) {
            const prod = g.pick(t.sell), rate = rateOf(prod, day(fy, m)), taxable = r2(actual * w * kept);
            b2cs.push({ m, state: st, rate, taxable, ...heads(taxable, rate, st === '27'), hsn: prod.hsn, eco: gstin(27, ECOS[0].pan) });
          }
          ECOS.forEach((eco, i) => {
            const net = r2(actual * (i ? 0.45 : 0.55)), pct = 0.005;
            tcs.push({ m, eco: gstin(27, eco.pan), ecoName: eco.name, period: `${String(calOf(fy, m).cm).padStart(2, '0')}${calOf(fy, m).y}`, gross: r2(net * 1.07), returned: r2(net * 0.07), net, igst: r2(net * pct * 0.65), cgst: r2(net * pct * 0.175), sgst: r2(net * pct * 0.175) });
          });
        }
      }
      const risky = t.key !== 'S1';
      const { wb } = writeReturns({
        name: t.name, gstin: t.gstin, state: 27, fy, filing: 'monthly', irn: true, extractDate: EXTRACT[fy], portalLateFee: true,
        title: 'SYNTHETIC SAMPLE - not a real taxpayer', sales, purchases, b2cs, tcs, stateNames: STATE_NAME, ...(t.plan[fy] || {}),
      }, { filingLead: risky ? () => g.ri(-1, 3) : () => g.ri(3, 8) });
      const file = `Get Download All Report_${t.gstin}_${fy} - ${fy + 1}_${t.name.split(' ').slice(0, 2).map((w) => w[0] + w.slice(1).toLowerCase()).join(' ')}.xlsx`;
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer', compression: true });
      const tp = parseWorkbook(XLSX.read(buf, { type: 'buffer' }), file);
      if (!tp.gstin || !tp.periods.length) throw new Error(`${file}: not a returns export`);
      fs.writeFileSync(path.join(outDir, file), buf);
      files.push(file);
    }
  }
  fs.writeFileSync(path.join(outDir, '00 READ ME.txt'), [
    'GST SCRUTINY - QUICK UPLOAD SAMPLE',
    '==================================',
    '',
    'Fictional test data: every name, GSTIN (PAN starting "ZZ") and figure is invented.',
    `${SAMPLE.length} taxpayers, FY 2024-25 and FY 2025-26: ${files.length} returns workbooks.`,
    '',
    'HOW TO USE',
    '1. GST Scrutiny > Configure > Upload data.',
    '2. Step 1, Returns files: "Choose files" and select all the .xlsx files in this folder.',
    '3. Wait for "Analysing returns" to finish (well under a minute). The "Latest upload" report',
    '   below the drop box then shows each step (received, checked and saved, analysed) and one row',
    '   per taxpayer with its risk, failed checks and main findings. "Open" goes to Taxpayer 360.',
    '4. The Dashboard shows the same upload as "Latest upload", with a link back to the report.',
    '',
    'WHAT EACH TAXPAYER SHOWS',
    ...SAMPLE.map((t) => `${t.name} (${t.gstin})\n    ${t.story}`),
    '',
  ].join('\r\n'));
  return files;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.resolve(process.argv[2] || path.join(ROOT, 'upload-pack', 'sample'));
  const files = build(out);
  console.log(`Wrote ${files.length} sample workbooks to ${out}`);
}
