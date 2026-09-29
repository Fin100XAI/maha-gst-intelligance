import { embedRequested } from './embed.js';

// Palette: validated reference instance (dataviz skill, light mode).
// Brand palette (navy · orange · teal · gold …) stepped into the validated band — dataviz validator: all checks pass
// (light, #fff surface; worst adjacent CVD ΔE 9.1; first three pass all-pairs). Gold/orange < 3:1 → table view provides relief.
export const SERIES = ['#3b62c0', '#e07b2a', '#1b98a8', '#c9a40a', '#b04b80', '#3f9142', '#7b5fcf', '#a8652a'];
// Inside the Maha GST Intelligence shell, charts take the shell's blue and neutrals (as src/embed.css does for the page).
const SHELL = embedRequested;
export const BRAND = SHELL ? '#1a3faf' : '#1a2e5e';
export const BRAND_SOFT = SHELL ? '#eef4ff' : '#eef1f8';
export const GOLD = SHELL ? '#cda629' : '#c0a20c';
export const STATUS = { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b', neutral: '#b9b8b0' };
export const INK = SHELL
  ? { primary: '#0a1830', secondary: '#545c71', muted: '#8791a3', grid: '#e8eaee', axis: '#d3d7de', surface: '#ffffff' }
  : { primary: '#1a2233', secondary: '#54607a', muted: '#8d98ae', grid: '#e7ebf3', axis: '#d6dce8', surface: '#ffffff' };

export const RULE_STATUS = {
  Fail: { color: STATUS.critical, glyph: '✕', label: 'Fail' },
  Review: { color: STATUS.warning, glyph: '!', label: 'Review' },
  Pass: { color: STATUS.good, glyph: '✓', label: 'Pass' },
  Info: { color: '#8aa9d6', glyph: 'i', label: 'Info' },
  NA: { color: STATUS.neutral, glyph: '–', label: 'N/A' },
  NT: { color: '#dedcd4', glyph: '·', label: 'Needs books' },
};
export const BAND = {
  Low: { color: STATUS.good, glyph: '●' },
  Moderate: { color: STATUS.warning, glyph: '▲' },
  High: { color: STATUS.serious, glyph: '◆' },
  Critical: { color: STATUS.critical, glyph: '■' },
};

// Diverging blue <-> gray <-> red for correlation (-1..1)
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * t)).join(',')})`; };
export const diverging = (r) => {
  if (r === null || r === undefined) return '#f3f2ee';
  return r >= 0 ? mix('#f0efec', '#c23a3a', Math.min(1, r)) : mix('#f0efec', '#1c5cab', Math.min(1, -r));
};
