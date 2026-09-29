// Scale test: open the app with ?scale=8000 to see every screen with that many taxpayers. The loaded taxpayers are
// cloned in this browser only, with deterministic variation in score, turnover and credit use; nothing is saved.
// A clone keeps its original's id, so opening one shows the original's file.

export const scaleTarget = () => {
  const n = Number(new URLSearchParams(window.location.search).get('scale'));
  return Number.isFinite(n) && n > 0 ? Math.min(20000, Math.round(n)) : 0;
};

const jitter = (i, k) => { const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); }; // 0..1, deterministic

export function scaleUp(taxpayers, n, bands) {
  if (!n || n <= taxpayers.length) return taxpayers;
  const out = [...taxpayers];
  for (let i = taxpayers.length; i < n; i++) {
    const a = taxpayers[i % taxpayers.length];
    // Skew towards low scores, as a real jurisdiction would be.
    const score = Math.max(0, Math.min(100, Math.round(a.score * (0.3 + 1.1 * jitter(i, 1) ** 1.6) + (jitter(i, 2) - 0.5) * 8)));
    const band = score >= bands.Critical ? 'Critical' : score >= bands.High ? 'High' : score >= bands.Moderate ? 'Moderate' : 'Low';
    const size = 10 ** (jitter(i, 3) * 3 - 1.5); // 0.03x .. 30x
    out.push({
      ...a, uid: `${a.id}~${i}`, score, band, name: `${a.name} · copy ${i}`,
      profile: { ...a.profile, turnover: a.profile.turnover * size, itcToOutput: Math.max(0, (a.profile.itcToOutput ?? 0.8) * (0.7 + 0.6 * jitter(i, 4))) },
      exposure: { confirmed: a.exposure.confirmed * size, potential: a.exposure.potential * size },
    });
  }
  return out.sort((x, y) => y.score - x.score);
}
