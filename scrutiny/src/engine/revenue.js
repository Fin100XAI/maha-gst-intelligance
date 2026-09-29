// Revenue-change intelligence: "why did this taxpayer's revenue move?" (capabilities 3, 5, 6, 7, 8).
// Pure: works on two baselines of one GSTIN (src/engine/baseline.js), no I/O, no clock.
//
// The measure is GSTR-3B tax paid in cash (C). By the definitions the engine uses,
//     C = output tax (L) - ITC used (I) + other (reverse-charge tax paid in cash, rounding)
//     L = turnover (T) x effective rate (r)
// so the year-on-year change decomposes EXACTLY:
//     dC = r0 x dT            (volume: split by customer group, credit notes and the 3B-vs-GSTR-1 gap)
//        + T1 x (r1 - r0)     (rate and mix: split into rate changes on the same HSN and product-mix shift)
//        - dI                 (credit used instead of cash)
//        + d(other)
// Every driver carries its formula, inputs and a class. Nothing here is a finding of liability: it explains
// movement and says what remains unresolved for the officer.

export const CLASSES = {
  explained: { label: 'Explained', note: 'Traceable in the returns to a legitimate, named cause' },
  partial: { label: 'Partially explained', note: 'A cause is visible but needs verification' },
  unresolved: { label: 'Unresolved', note: 'Not explained by the returns data; needs examination' },
  insufficient: { label: 'Data insufficient', note: 'The returns data cannot tell' },
};

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const sum = (a, f = (x) => x) => a.reduce((s, x) => s + f(x), 0);
const byKey = (rows = []) => new Map(rows.map((r) => [r.key, r]));
const pct = (v) => `${(v * 100).toFixed(1)}%`;
const L = (v) => {
  const a = Math.abs(v), s = v <= -0.5 ? '−' : '';
  if (a >= 1e7) return `${s}₹${(a / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `${s}₹${(a / 1e5).toFixed(2)} L`;
  return `${s}₹${Math.round(a).toLocaleString('en-IN')}`;
};

// ------------------------------------------------------------------ customer groups (turnover split)
// Customers are matched across years by GSTIN. "Lost or sharply reduced": bought at least 1% of prior-year B2B value
// and less than half of it this year. Other registrations of the same PAN are kept apart (branch transfers).
function customerGroups(prev, cur) {
  const p = byKey(prev.mix.byCustomer), c = byKey(cur.mix.byCustomer);
  const priorTotal = sum(prev.mix.byCustomer, (x) => x.value);
  const groups = { continuing: [], lost: [], new: [], samePan: [] };
  for (const key of new Set([...p.keys(), ...c.keys()])) {
    const a = p.get(key)?.value || 0, b = c.get(key)?.value || 0;
    const row = { key, name: (c.get(key) || p.get(key)).name, prior: a, current: b, change: b - a };
    if (p.get(key)?.samePan || c.get(key)?.samePan) groups.samePan.push(row);
    else if (key === 'OTHER' || key === 'B2C') groups.continuing.push(row);
    else if (!a && b) groups.new.push(row);
    else if (a >= 0.01 * priorTotal && b < 0.5 * a) groups.lost.push(row);
    else groups.continuing.push(row);
  }
  for (const g of Object.values(groups)) g.sort((x, y) => x.change - y.change);
  return groups;
}

// ------------------------------------------------------------------ rate change on the same HSN
function rateChanges(prev, cur) {
  const p = new Map(prev.mix.byHsn.map((h) => [h.hsn, h]));
  return cur.mix.byHsn.map((h) => {
    const q = p.get(h.hsn);
    if (!q || !q.taxable || !h.taxable) return null;
    const r0 = q.tax / q.taxable, r1 = h.tax / h.taxable;
    if (Math.abs(r1 - r0) < 0.0025) return null; // under 0.25 percentage points: intra/inter-state noise, not a rate change
    return { hsn: h.hsn, desc: h.desc, taxable: h.taxable, ratePrior: r0, rateCurrent: r1, effect: h.taxable * (r1 - r0) };
  }).filter(Boolean).sort((x, y) => x.effect - y.effect);
}

// ------------------------------------------------------------------ ITC sources
function itcSources(prev, cur) {
  const p = byKey(prev.mix.bySupplier), c = byKey(cur.mix.bySupplier);
  const rows = [...new Set([...p.keys(), ...c.keys()])].map((key) => {
    const a = p.get(key), b = c.get(key);
    return { key, name: (b || a).name, prior: a?.tax || 0, current: b?.tax || 0, change: (b?.tax || 0) - (a?.tax || 0), isNew: !a && key !== 'OTHER', notFiled: !!b?.notFiled, invalidGstin: !!b?.invalidGstin };
  }).sort((x, y) => y.change - x.change);
  const rise = sum(rows.filter((r) => r.change > 0), (r) => r.change);
  return {
    rows,
    rise,
    newShare: rise ? sum(rows.filter((r) => r.change > 0 && r.isNew), (r) => r.change) / rise : 0,
    riskShare: rise ? sum(rows.filter((r) => r.change > 0 && (r.notFiled || r.invalidGstin)), (r) => r.change) / rise : 0,
  };
}

// ------------------------------------------------------------------ months without a filed GSTR-3B
const covered = (b) => new Set(b.periods.flatMap((p) => Array.from({ length: p.months }, (_, i) => p.p - i)));
function unfiledSales(b) {
  const c = covered(b);
  const months = b.months.filter((m, i) => !c.has(i) && m.outTaxable > 0).map((m) => m.m);
  return { months, taxable: sum(months, (m) => b.months[m].outTaxable), tax: sum(months, (m) => b.months[m].outTax) };
}

// ------------------------------------------------------------------ monthly deviation (capability 5)
const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };

/**
 * Month-by-month (capability 5). First looks for one sustained step (a "level shift": a rate change, a lost customer,
 * business moved to a branch) by splitting the year where the growth ratios differ most (least squares on log ratios,
 * each side at least three months; accepted when the split removes 65% of the variation and the step is 15% or more).
 * Then, within each side: expected = same month last year x the growth of that side's other months (leave-one-out),
 * with a tolerance band from the typical monthly noise (median absolute deviation of log ratios, at least 15%).
 * A month is flagged only when it is outside the band AND material; each flag gets a reason code.
 */
export function monthlyDeviation(prev, cur) {
  const a = prev.months.map((m) => m.outTax), b = cur.months.map((m) => m.outTax);
  const levelShift = findLevelShift(a, b);
  const segments = levelShift ? [[0, levelShift.m], [levelShift.m, 12]] : [[0, 12]];
  const expected = new Array(12).fill(0);
  for (const [s, e] of segments) {
    const totA = sum(a.slice(s, e)), totB = sum(b.slice(s, e));
    for (let m = s; m < e; m++) { const oa = totA - a[m], ob = totB - b[m]; expected[m] = oa > 0 ? a[m] * (ob / oa) : a[m]; }
  }
  const logs = b.map((v, m) => (v > 0 && expected[m] > 0 ? Math.log(v / expected[m]) : null)).filter((x) => x !== null);
  const mad = median(logs.map((x) => Math.abs(x - median(logs))));
  const tol = Math.max(0.15, 2.5 * mad);
  const material = Math.max(1e5, 0.05 * (sum(b) / 12));
  const delay = new Map(cur.periods.flatMap((p) => Array.from({ length: p.months }, (_, i) => [p.p - i, p.delay || 0])));
  const months = b.map((actual, m) => {
    const exp = expected[m];
    const low = exp * (1 - tol), high = exp * (1 + tol);
    const deviation = actual - exp;
    const out = (actual < low || actual > high) && Math.abs(deviation) >= material;
    let reason = null;
    if (out) {
      // Seasonal shift: a neighbouring month deviates the other way and the pair is back inside the band.
      const pair = [m - 1, m + 1].filter((n) => n >= 0 && n < 12).find((n) => Math.sign(b[n] - expected[n]) === -Math.sign(deviation) && Math.abs(actual + b[n] - exp - expected[n]) <= tol * (exp + expected[n]));
      if (pair !== undefined) reason = { code: 'seasonal-shift', text: `offset by ${MONTHS[pair]}: the peak moved between months` };
      else if ((delay.get(m) || 0) > 0) reason = { code: 'late-filing', text: `the return for this period was filed ${delay.get(m)} days late` };
      else if (deviation < 0 && (cur.months[m].cnValue || 0) > 0.25 * -deviation) reason = { code: 'credit-notes', text: `credit notes of ${L(cur.months[m].cnValue)} issued this month` };
      else reason = { code: 'unexplained', text: 'no seasonal, timing or credit-note explanation in the returns' };
    }
    return { m, label: MONTHS[m], prior: a[m], actual, expected: exp, low, high, deviation, direction: deviation < 0 ? 'below' : 'above', flagged: out, reason };
  });
  return { tolerance: tol, material, levelShift, months, flagged: months.filter((x) => x.flagged), unexplained: months.filter((x) => x.reason?.code === 'unexplained') };
}

/** One sustained step in the year-on-year growth of monthly tax, or null. */
function findLevelShift(a, b) {
  const r = a.map((v, m) => (v > 0 && b[m] > 0 ? Math.log(b[m] / v) : null));
  if (r.some((x) => x === null)) return null; // a missing month (unfiled, new registration) is not a level shift
  const mean = (xs) => sum(xs) / xs.length;
  const sse = (xs) => { const u = mean(xs); return sum(xs, (x) => (x - u) ** 2); };
  const total = sse(r);
  let best = null;
  for (let k = 3; k <= 9; k++) {
    const s = sse(r.slice(0, k)) + sse(r.slice(k));
    if (!best || s < best.s) best = { k, s };
  }
  const before = Math.exp(mean(r.slice(0, best.k))) - 1, after = Math.exp(mean(r.slice(best.k))) - 1;
  if (!(total > 0) || best.s > 0.35 * total || Math.abs(after - before) < 0.15) return null;
  return { m: best.k, label: MONTHS[best.k], before, after, text: `From ${MONTHS[best.k]} monthly tax ran ${pct(after)} against last year, after ${pct(before)} before it: a sustained change, not a one-month blip` };
}
// ------------------------------------------------------------------ the explanation (capabilities 6, 7, 8)
/**
 * @param {object} prev  baseline of the earlier year
 * @param {object} cur   baseline of the later year
 * @returns {object} { measure, prior, current, change, drivers[], reconciled, byClass, hypotheses[], deviation, verdict }
 */
export function explainRevenueChange(prev, cur) {
  const T0 = prev.totals.turnover, T1 = cur.totals.turnover;
  const L0 = prev.totals.outputTax, L1 = cur.totals.outputTax;
  const I0 = prev.mix.itcUsed, I1 = cur.mix.itcUsed;
  const C0 = prev.totals.cashPaid, C1 = cur.totals.cashPaid;
  const r0 = T0 ? L0 / T0 : 0, r1 = T1 ? L1 / T1 : 0;

  // Volume: dT = d(sales by customer group) - d(credit notes) + d(gap between 3B turnover and GSTR-1 net sales)
  const groups = customerGroups(prev, cur);
  const S0 = sum(prev.mix.byCustomer, (x) => x.value), S1 = sum(cur.mix.byCustomer, (x) => x.value);
  const CN0 = prev.mix.creditNotes.taxable, CN1 = cur.mix.creditNotes.taxable;
  const gap0 = T0 - (S0 - CN0), gap1 = T1 - (S1 - CN1);
  // Part of the gap: sales reported in GSTR-1 for months no filed GSTR-3B covers (tax declared to buyers, not to the department)
  const U0 = unfiledSales(prev), U1 = unfiledSales(cur);
  const dGroup = (g) => sum(groups[g], (x) => x.change);
  const rates = rateChanges(prev, cur);
  const rateEffect = sum(rates, (x) => x.effect);
  const rateMix = T1 * (r1 - r0);
  const itc = itcSources(prev, cur);
  // Cash not explained by (output tax - ITC used): liability above the declared tax, where credit notes pushed one tax head
  // below zero (a negative head is carried forward, not set off against the others), and reverse charge paid in cash.
  const aboveDeclared = (b) => sum(b.periods, (p) => p.liability - p.g3bTax);
  const N0 = aboveDeclared(prev), N1 = aboveDeclared(cur);
  const other0 = C0 - (L0 - I0) - N0, other1 = C1 - (L1 - I1) - N1;

  const vol = (key, label, dT, extra) => ({ key, label, amount: r0 * dT, formula: `prior effective rate ${pct(r0)} × change in ${extra.basis} ${L(dT)}`, inputs: extra.inputs, detail: extra.detail || [] });
  const drivers = [
    vol('continuing', 'Sales to continuing customers', dGroup('continuing'), { basis: 'taxable sales', inputs: [['Customers', groups.continuing.length]], detail: groups.continuing.slice(0, 8) }),
    vol('lost', 'Customers lost or sharply reduced', dGroup('lost'), { basis: 'taxable sales', inputs: [['Customers', groups.lost.length]], detail: groups.lost }),
    vol('new', 'New customers', dGroup('new'), { basis: 'taxable sales', inputs: [['Customers', groups.new.length]], detail: [...groups.new].reverse().slice(0, 8) }),
    vol('samePan', 'Transfers to other registrations of the same PAN', dGroup('samePan'), { basis: 'taxable transfers', inputs: [['Registrations', groups.samePan.length]], detail: groups.samePan }),
    vol('creditNotes', 'Credit notes', -(CN1 - CN0), { basis: 'credit notes (taxable, sign reversed)', inputs: [['Prior', L(CN0)], ['Current', L(CN1)], ['Linked to invoices', cur.mix.creditNotes.linkedShare == null ? '-' : pct(cur.mix.creditNotes.linkedShare)]] }),
    vol('unfiled', 'Sales in GSTR-1 for months with no GSTR-3B filed', -(U1.taxable - U0.taxable), { basis: 'GSTR-1 sales in months without a filed 3B (sign reversed)', inputs: [['Months without 3B', U1.months.map((m) => MONTHS[m]).join(', ') || 'none'], ['GSTR-1 tax in those months', L(U1.tax)]], detail: U1.months.map((m) => ({ key: MONTHS[m], name: MONTHS[m], prior: 0, current: cur.months[m].outTaxable, change: cur.months[m].outTaxable })) }),
    vol('gap', 'Declared in GSTR-3B vs GSTR-1 (timing and other differences)', (gap1 + U1.taxable) - (gap0 + U0.taxable), { basis: 'the remaining gap between 3B turnover and GSTR-1 net sales', inputs: [['Gap prior', L(gap0 + U0.taxable)], ['Gap current', L(gap1 + U1.taxable)]] }),
    { key: 'rate', label: 'Rate changes on the same goods (HSN)', amount: rateEffect, formula: 'Σ current taxable × (current − prior effective rate), for each HSN whose rate moved by 0.25 points or more', inputs: [['HSN codes with a rate change', rates.length]], detail: rates },
    { key: 'mix', label: 'Product and tax-rate mix', amount: rateMix - rateEffect, formula: `current turnover × change in effective rate (${pct(r0)} → ${pct(r1)}), less the rate-change effect`, inputs: [['Effective rate prior', pct(r0)], ['Effective rate current', pct(r1)]] },
    { key: 'itc', label: 'Credit (ITC) used instead of cash', amount: -(I1 - I0), formula: `−(ITC used ${L(I1)} − ${L(I0)})`, inputs: [['New suppliers in the rise', pct(itc.newShare)], ['Non-filing or invalid suppliers in the rise', pct(itc.riskShare)]], detail: itc.rows.filter((r) => r.change !== 0).slice(0, 8) },
    { key: 'negative', label: 'Liability above declared tax (a tax head pushed below zero)', amount: N1 - N0, formula: 'change in Σ (liability in the payment table − tax declared in 3.1)', inputs: [['Prior', L(N0)], ['Current', L(N1)]], detail: cur.periods.filter((p) => Math.abs(p.liability - p.g3bTax) >= 1).map((p) => ({ key: p.label, name: p.label, prior: p.g3bTax, current: p.liability, change: p.liability - p.g3bTax })) },
    { key: 'other', label: 'Reverse charge paid in cash, interest and rounding', amount: other1 - other0, formula: 'change in (cash paid − (liability − ITC used))', inputs: [['Prior', L(other0)], ['Current', L(other1)]] },
  ];
  const change = C1 - C0;
  const reconciled = Math.abs(sum(drivers, (d) => d.amount) - change) < 1;

  const deviation = monthlyDeviation(prev, cur);
  const hypotheses = testHypotheses({ prev, cur, groups, rates, rateEffect, itc, drivers, deviation, dL: L1 - L0, S0, S1 });
  const shift = deviation.levelShift;
  if (shift) for (const h of hypotheses) if (['rate', 'branch', 'customer-loss'].includes(h.key) && h.status === 'supported') h.evidenceFor.push(shift.text);
  const supported = new Set(hypotheses.filter((h) => h.status === 'supported').map((h) => h.key));

  // Classification (capability 7): only what the returns can show; immaterial amounts count as explained.
  const immaterial = (v) => Math.abs(v) < Math.max(1e4, 0.01 * Math.max(Math.abs(C0), Math.abs(L0)));
  const cls = {
    continuing: (d) => (immaterial(d.amount) || d.amount > 0 || supported.has('branch') || supported.has('genuine-decline') ? 'explained' : 'partial'),
    lost: () => 'explained',
    new: () => 'explained',
    samePan: () => 'explained',
    creditNotes: (d) => (immaterial(d.amount) ? 'explained' : cur.mix.creditNotes.linkedShare >= 0.9 ? 'explained' : cur.mix.creditNotes.linkedShare >= 0.5 ? 'partial' : 'unresolved'),
    unfiled: (d) => (immaterial(d.amount) || d.amount > 0 ? 'explained' : 'unresolved'),
    gap: (d) => (immaterial(d.amount) ? 'explained' : 'partial'),
    rate: () => 'explained',
    mix: (d) => (immaterial(d.amount) ? 'explained' : 'partial'),
    itc: (d) => (d.amount >= 0 || immaterial(d.amount) ? 'explained' : itc.newShare >= 0.5 || itc.riskShare >= 0.2 ? 'unresolved' : itc.newShare >= 0.2 ? 'partial' : 'explained'),
    negative: (d) => (immaterial(d.amount) ? 'explained' : 'partial'),
    other: (d) => (immaterial(d.amount) ? 'explained' : 'insufficient'),
  };
  for (const d of drivers) d.class = cls[d.key](d);
  const byClass = Object.fromEntries(Object.keys(CLASSES).map((k) => [k, sum(drivers.filter((d) => d.class === k), (d) => d.amount)]));

  const dL = L1 - L0;
  const lower = (t) => (/^[A-Z](?![A-Z0-9-])/.test(t) ? t[0].toLowerCase() + t.slice(1) : t); // keep acronyms such as GSTR-3B
  const labelOf = (k) => lower(hypotheses.find((h) => h.key === k).label);
  const named = [...supported].map(labelOf).join('; ');
  const concerns = hypotheses.filter((h) => h.status === 'concern').map((h) => lower(h.label)).join('; ');
  const unresolvedOut = -byClass.unresolved - byClass.insufficient; // positive when unresolved items reduce cash
  let verdict;
  if (Math.abs(change) < Math.max(1e5, 0.02 * Math.abs(C0))) {
    verdict = { code: 'stable', text: `${!C0 && !C1 ? 'No cash paid in either year' : `Cash paid moved ${L(change)} (${C0 ? pct(change / C0) : '-'})`}: no material change${concerns ? `, but note: ${concerns}` : ''}.` };
  } else if (change >= 0) {
    const head = `Cash paid ${change === 0 ? 'unchanged' : `rose ${L(change)}`}`;
    if (dL < -0.05 * L0) verdict = { code: 'tax-fell', text: `${head}, but output tax fell ${L(-dL)} (${pct(dL / L0)}): ${named ? `explained by ${named}` : 'no legitimate cause visible in the returns'}${concerns ? `; concern: ${concerns}` : ''}.${I1 < I0 ? ' Less credit was used, so cash held up.' : ''}` };
    else if (byClass.unresolved < 0) verdict = { code: 'itc-watch', text: `${head}, but ${L(-byClass.unresolved)} of extra credit use is unresolved: check the suppliers behind it.` };
    else verdict = { code: 'no-decline', text: `${head}. No revenue-drop examination needed.` };
  } else if (unresolvedOut > 0.1 * -change) {
    verdict = { code: 'examine', text: unresolvedOut > -change
      ? `Unresolved or undecidable drivers cut cash by ${L(unresolvedOut)}, more than the whole ${L(-change)} decline (other drivers added ${L(unresolvedOut + change)}): examine those drivers.`
      : `${L(unresolvedOut)} of the ${L(-change)} decline is unresolved or not decidable from the returns: examine those drivers.` };
  } else {
    verdict = { code: 'de-escalate', text: `The ${L(-change)} decline is explained by the returns data (${named || 'named drivers'}). Verify the listed evidence before closing.` };
  }

  return { measure: 'GSTR-3B tax paid in cash', prior: { fy: prev.fy, cash: C0, outputTax: L0, turnover: T0, itcUsed: I0 }, current: { fy: cur.fy, cash: C1, outputTax: L1, turnover: T1, itcUsed: I1 }, change, drivers, reconciled, byClass, hypotheses, deviation, verdict, classes: CLASSES };
}

// ------------------------------------------------------------------ competing explanations (capability 8)
function testHypotheses({ prev, cur, groups, rates, rateEffect, itc, drivers, deviation, dL, S0, S1 }) {
  const amount = (k) => drivers.find((d) => d.key === k).amount;
  const H = [];
  const push = (h) => H.push({ evidenceFor: [], evidenceAgainst: [], missing: [], questions: [], ...h });

  // Rate change
  push(rates.length && rateEffect < -1e5
    ? { key: 'rate', label: 'A tax-rate reduction on the goods sold', status: 'supported', effect: rateEffect,
      evidenceFor: rates.slice(0, 5).map((r) => `HSN ${r.hsn} ${r.desc}: effective rate ${pct(r.ratePrior)} → ${pct(r.rateCurrent)} on ${L(r.taxable)}`),
      missing: ['The rate notification and its effective date'], questions: ['From which date did invoices carry the new rate?'] }
    : { key: 'rate', label: 'A tax-rate reduction on the goods sold', status: 'not supported', effect: rateEffect, evidenceAgainst: ['No HSN shows a material change in its effective rate'] });

  // Branch redistribution to another registration of the same PAN
  const same = sum(groups.samePan, (x) => x.change), cont = sum(groups.continuing, (x) => x.change);
  push(same > 0 && cont < 0
    ? { key: 'branch', label: 'Business moved to another registration of the same PAN', status: 'supported', effect: amount('continuing') + amount('samePan'),
      evidenceFor: [...groups.samePan.map((x) => `Transfers to ${x.name} (${x.key}) rose ${L(x.prior)} → ${L(x.current)}`), `Sales to continuing customers fell ${L(cont)}`],
      missing: ['Where the other registration now buys its goods', 'Whether customers are now billed by the other registration'],
      questions: ['Which customers are now served from the other registration, and since when?'] }
    : { key: 'branch', label: 'Business moved to another registration of the same PAN', status: groups.samePan.length ? 'not supported' : 'not applicable', effect: 0,
      evidenceAgainst: groups.samePan.length ? ['Transfers to same-PAN registrations did not rise while other sales fell'] : ['No transfers to other registrations of the same PAN'] });

  // Loss of a major customer
  const lost = sum(groups.lost, (x) => x.change);
  push(lost < -0.05 * S0
    ? { key: 'customer-loss', label: 'Loss or sharp reduction of major customers', status: 'supported', effect: amount('lost'),
      evidenceFor: groups.lost.slice(0, 5).map((x) => `${x.name} (${x.key}): ${L(x.prior)} → ${L(x.current)}`),
      missing: ["The customers' own purchase records (their GSTR-2B)"], questions: ['Why did these customers stop or reduce buying?'] }
    : { key: 'customer-loss', label: 'Loss or sharp reduction of major customers', status: groups.lost.length ? 'partial' : 'not supported', effect: amount('lost'),
      evidenceAgainst: groups.lost.length ? [`Reduced customers account for only ${L(-lost)}`] : ['No major customer stopped or halved its purchases'] });

  // Credit notes
  const dCn = cur.mix.creditNotes.taxable - prev.mix.creditNotes.taxable;
  push(dCn > 0.02 * S0
    ? { key: 'credit-notes', label: 'Higher credit notes for returns and discounts', status: cur.mix.creditNotes.linkedShare >= 0.9 ? 'supported' : 'partial', effect: amount('creditNotes'),
      evidenceFor: [`Credit notes rose ${L(prev.mix.creditNotes.taxable)} → ${L(cur.mix.creditNotes.taxable)} (${cur.mix.creditNotes.count} notes)`, `${cur.mix.creditNotes.linkedShare == null ? '-' : pct(cur.mix.creditNotes.linkedShare)} linked to an original invoice`],
      missing: ['Reason for each note and proof of goods returned'], questions: ['Were the goods physically returned, or were these price adjustments?'] }
    : { key: 'credit-notes', label: 'Higher credit notes for returns and discounts', status: 'not supported', effect: amount('creditNotes'), evidenceAgainst: ['Credit notes did not rise materially'] });

  // Seasonality and timing
  const seasonal = deviation.flagged.filter((m) => m.reason.code === 'seasonal-shift' || m.reason.code === 'late-filing');
  push(seasonal.length
    ? { key: 'timing', label: 'Seasonality or filing timing', status: Math.abs(dL) < 0.05 * Math.max(1, prev.totals.outputTax) ? 'supported' : 'partial', effect: amount('gap'),
      evidenceFor: seasonal.map((m) => `${m.label}: ${L(m.deviation)} against expected, ${m.reason.text}`),
      evidenceAgainst: Math.abs(dL) >= 0.05 * prev.totals.outputTax ? ['The annual total also moved, so timing explains only part of it'] : [],
      questions: ['Was the peak season earlier or later this year?'] }
    : { key: 'timing', label: 'Seasonality or filing timing', status: 'not supported', effect: amount('gap'), evidenceAgainst: ['No monthly deviation is explained by a seasonal shift or a late return'] });

  // Genuine business decline: sales fall broadly and purchases fall with them
  const inA = sum(prev.months, (m) => m.inTaxable), inB = sum(cur.months, (m) => m.inTaxable);
  const salesChg = S0 ? (S1 - S0) / S0 : 0, buyChg = inA ? (inB - inA) / inA : 0;
  const broad = salesChg < -0.05 && !(same > 0 && cont < 0);
  push(broad
    ? { key: 'genuine-decline', label: 'Genuine fall in business', status: Math.abs(salesChg - buyChg) <= 0.1 ? 'supported' : 'partial', effect: amount('continuing'),
      evidenceFor: [`Sales ${pct(salesChg)}, purchases ${pct(buyChg)}: ${Math.abs(salesChg - buyChg) <= 0.1 ? 'they moved together' : 'purchases did not fall as much'}`],
      evidenceAgainst: Math.abs(salesChg - buyChg) > 0.1 ? ['Purchases kept up while sales fell: check stock and whether sales are recorded elsewhere'] : [],
      questions: ['What caused the fall in orders?'] }
    : { key: 'genuine-decline', label: 'Genuine fall in business', status: 'not supported', effect: 0, evidenceAgainst: [salesChg >= -0.05 ? `Sales moved ${pct(salesChg)}: no broad fall` : 'The fall is explained by a branch shift'] });

  // Credit replacing cash: a concern, not a legitimate explanation on its own
  const itcEff = amount('itc');
  push(itcEff < -1e5
    ? { key: 'itc-substitution', label: 'More credit (ITC) used instead of cash', status: itc.newShare >= 0.5 || itc.riskShare >= 0.2 ? 'concern' : 'supported', effect: itcEff,
      // The share of the rise from new or risky suppliers is what makes it a concern: it leads the evidence.
      evidenceFor: [`${pct(itc.newShare)} of the rise in credit comes from new suppliers and ${pct(itc.riskShare)} from non-filing or invalid ones`,
        ...itc.rows.filter((r) => r.change > 0).slice(0, 5).map((r) => `${r.name} (${r.key}): ITC ${L(r.prior)} → ${L(r.current)}${r.isNew ? ' · new supplier' : ''}${r.notFiled ? ' · has not filed GSTR-3B' : ''}${r.invalidGstin ? ' · invalid GSTIN' : ''}`)],
      missing: ['Proof of receipt of goods (e-way bills, stock register) from the suppliers behind the rise'], questions: ['What was bought from these suppliers, and where are the goods?'] }
    : { key: 'itc-substitution', label: 'More credit (ITC) used instead of cash', status: 'not supported', effect: itcEff, evidenceAgainst: ['Credit used did not rise materially'] });

  // Returns not filed: GSTR-1 shows sales for months with no GSTR-3B (the tax was charged to buyers but not declared)
  const un = amount('unfiled');
  const missing = cur.months.filter((m, i) => !covered(cur).has(i) && m.outTaxable > 0);
  push(un < -1e5
    ? { key: 'non-filing', label: 'GSTR-3B not filed for months with sales', status: 'concern', effect: un,
      evidenceFor: [`No GSTR-3B for ${missing.map((m) => MONTHS[m.m]).join(', ')}, while GSTR-1 reports ${L(sum(missing, (m) => m.outTaxable))} of sales and ${L(sum(missing, (m) => m.outTax))} of tax`],
      missing: ['Whether the returns were filed after the data extract date'], questions: ['Why were these GSTR-3B returns not filed, and when will the tax be paid?'] }
    : { key: 'non-filing', label: 'GSTR-3B not filed for months with sales', status: 'not supported', effect: un, evidenceAgainst: ['Every month with GSTR-1 sales is covered by a filed GSTR-3B'] });

  return H;
}

// ------------------------------------------------------------------ portfolio view (capabilities 3, 4)
/**
 * Contribution of each taxpayer to the change in cash paid across a portfolio (the latest two years of each).
 * Taxpayers with one year only count as new (prior 0). Rows reconcile to the portfolio total.
 */
export function portfolioMovement(baselines, gstins) {
  const rows = gstins.map((g) => baselines[g]).filter((b) => b && b.length).map((b) => {
    const cur = b[b.length - 1], prev = b.length > 1 ? b[b.length - 2] : null;
    const prior = prev ? prev.totals.cashPaid : 0, current = cur.totals.cashPaid;
    const change = current - prior;
    const status = !prev ? 'new' : change > 0.05 * prior ? 'growth' : change < -0.05 * prior ? 'decline' : 'stable';
    return { gstin: cur.gstin, name: cur.name, priorFy: prev?.fy || null, fy: cur.fy, prior, current, change, pct: prior ? change / prior : null, status, explanationRequired: status === 'decline' && -change >= 1e6 };
  });
  const total = { prior: sum(rows, (r) => r.prior), current: sum(rows, (r) => r.current) };
  total.change = total.current - total.prior;
  for (const r of rows) r.share = total.change ? r.change / Math.abs(total.change) : 0;
  return { rows: rows.sort((a, b) => a.change - b.change), total };
}
