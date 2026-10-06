// Tax heads (IGST, CGST, SGST) of an amount. A notice must state the demand head by head: they are separate levies
// owed to different governments. Pure, dependency-free.

export const HEADS = ['igst', 'cgst', 'sgst'];

/** How a split was obtained, for the notice to say so. */
export const BASIS = {
  documents: 'from the invoices and return lines behind the finding',
  law: 'as the law places it (e.g. import IGST; late fee under the CGST and SGST Acts)',
  apportioned: "apportioned in the ratio of the taxpayer's own tax heads (the returns do not tie this amount to lines)",
};

/** Sum the heads of some rows. `sign` lets credit notes count negative. */
export function headsOf(rows, sign = () => 1) {
  const h = { igst: 0, cgst: 0, sgst: 0 };
  for (const x of rows) { const s = sign(x); for (const k of HEADS) h[k] += s * (Number(x[k]) || 0); }
  return h;
}

export const addHeads = (...hs) => { const h = { igst: 0, cgst: 0, sgst: 0 }; for (const x of hs) if (x) for (const k of HEADS) h[k] += x[k] || 0; return h; };
export const subHeads = (a, b) => ({ igst: (a?.igst || 0) - (b?.igst || 0), cgst: (a?.cgst || 0) - (b?.cgst || 0), sgst: (a?.sgst || 0) - (b?.sgst || 0) });

/**
 * Split a whole-rupee amount over the heads in proportion to the (positive part of the) weights, so that the heads add
 * up to the amount exactly (largest remainder). Null when no weight is positive.
 * @param {number} amount
 * @param {{igst?: number, cgst?: number, sgst?: number}} weights
 * @returns {{igst: number, cgst: number, sgst: number} | null}
 */
export function allocate(amount, weights) {
  const total = Math.round(amount);
  const w = HEADS.map((k) => Math.max(0, Number(weights?.[k]) || 0));
  const sum = w.reduce((a, b) => a + b, 0);
  if (!(sum > 0) || !(total > 0)) return null;
  const raw = w.map((x) => (total * x) / sum);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let j = 0; left > 0; j = (j + 1) % order.length, left--) out[order[j][1]]++;
  return Object.fromEntries(HEADS.map((k, i) => [k, out[i]]));
}
