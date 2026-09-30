// Large Taxpayer Unit "LTU-MUMBAI": 25 fictional corporate groups (about 50 registrations) over two financial years,
// with subsidiaries, same-PAN branches in other states, intra-group and cross-group supply chains, and planted
// behaviour for three kinds of taxpayer: clean, high-risk and complex-but-legitimate conglomerates.
//
//   node scripts/synth/corporates.mjs               -> data/ workbooks (…_GEN <name>.xlsx) + test-data/corporates/
//   node scripts/synth/corporates.mjs --if-missing  -> does nothing when this version's workbooks are already there
//   node scripts/synth/corporates.mjs --registers   -> also merges the LTU rows into data/registers/*.json
//
// Every name, PAN and figure is invented. PANs start with "ZZ" (the project's marker for generated data); the groups
// only resemble types of real businesses in behaviour, never a real company. Transactions are generated ledger-first:
// an invoice between two generated taxpayers exists once and is projected into the seller's GSTR-1 and the buyer's
// GSTR-2A/2B. Deterministic: a fixed seed always writes the same files, so the workbooks are generated at build time
// rather than committed (they run to hundreds of MB).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { MONTHS, r2, gstin, makeRng, heads, taxOf, calOf, iso } from './lib.mjs';
import { writeReturns } from './workbook.mjs';
import { P, rateOf, STATE_NAME } from './products.mjs';

export { P };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'data');
const KEY_DIR = path.join(ROOT, 'test-data', 'corporates');
export const VERSION = 'corporates-v6';
export const JURISDICTION = 'LTU-MUMBAI';
export const FYS = [2024, 2025];
const EXTRACT = { 2024: '2025-11-20', 2025: '2026-09-26' };
const CR = 1e7; // ₹ one crore

// ------------------------------------------------------------------ the groups
// turnover: ₹ crore of external sales in FY 2024-25 for the whole group; share splits it across registrations.
// inv: invoices per month for the registration (volume); buyRatio: purchases as a share of its sales.
// custStates / supStates: where its external customers and suppliers are.
const E = (key, name, state, pan, o) => ({ key, name, state: String(state).padStart(2, '0'), pan, ...o });
export const GROUPS = [
  // ---------------------------------------------------------------- clean
  { key: 'G01', kind: 'clean', short: 'Sahyadri Infotech', sector: 'IT services', turnover: 9400, growth: 1.09, officer: 'S. Kulkarni', range: 'LTU Range 1',
    entities: [
      E('G01A', 'SAHYADRI INFOTECH SERVICES LIMITED', 27, 'ZZSCS2101K', { role: 'Head office (Pune)', share: 0.52, inv: 110, sell: [P.itsvc], buy: [P.itsvc, P.legal], buyRatio: 0.24, custStates: [27, 27, 29, 7, 33, 36], supStates: [27, 29, 36] }),
      E('G01B', 'SAHYADRI INFOTECH SERVICES LIMITED', 29, 'ZZSCS2101K', { role: 'Branch (Bengaluru)', share: 0.3, inv: 70, sell: [P.itsvc], buy: [P.itsvc], buyRatio: 0.2, custStates: [29, 29, 33, 36], supStates: [29] }),
      E('G01C', 'SAHYADRI INFOTECH SERVICES LIMITED', 36, 'ZZSCS2101K', { role: 'Branch (Hyderabad)', share: 0.18, inv: 45, sell: [P.itsvc], buy: [P.itsvc], buyRatio: 0.2, custStates: [36, 36, 29], supStates: [36] }),
    ] },
  { key: 'G02', kind: 'clean', short: 'Godavari Consumer', sector: 'FMCG (home and personal care)', turnover: 6200, growth: 1.07, officer: 'S. Kulkarni', range: 'LTU Range 1',
    entities: [
      E('G02A', 'GODAVARI CONSUMER PRODUCTS LIMITED', 27, 'ZZGCG2202L', { role: 'Plant and head office (Nashik)', share: 0.46, inv: 160, sell: [P.soap, P.detergent], buy: [P.chem, P.carton, P.oil], buyRatio: 0.58, custStates: [27, 27, 27, 30], supStates: [27, 24] }),
      E('G02B', 'GODAVARI CONSUMER PRODUCTS LIMITED', 24, 'ZZGCG2202L', { role: 'Depot (Ahmedabad)', share: 0.2, inv: 90, sell: [P.soap, P.detergent], buy: [P.carton], buyRatio: 0.05, custStates: [24, 24, 23], supStates: [24] }),
      E('G02C', 'GODAVARI CONSUMER PRODUCTS LIMITED', 29, 'ZZGCG2202L', { role: 'Depot (Bengaluru)', share: 0.18, inv: 80, sell: [P.soap, P.detergent], buy: [P.carton], buyRatio: 0.05, custStates: [29, 29], supStates: [29] }),
      E('G02D', 'GODAVARI CONSUMER PRODUCTS LIMITED', 33, 'ZZGCG2202L', { role: 'Depot (Chennai)', share: 0.16, inv: 70, sell: [P.soap, P.detergent], buy: [P.carton], buyRatio: 0.05, custStates: [33, 33], supStates: [33] }),
    ] },
  { key: 'G03', kind: 'clean', short: 'Deccan Precision', sector: 'Auto components', turnover: 3800, growth: 1.11, officer: 'A. Deshpande', range: 'LTU Range 2',
    entities: [
      E('G03A', 'DECCAN PRECISION FORGINGS LIMITED', 27, 'ZZDCD2303M', { role: 'Forging plant (Chakan)', share: 0.72, inv: 95, sell: [P.forging], buy: [P.hrc, P.casting], buyRatio: 0.55, custStates: [27, 27, 33, 7, 24], supStates: [27, 24] }),
      E('G03B', 'DECCAN PRECISION CASTINGS PRIVATE LIMITED', 27, 'ZZDCD2304N', { role: 'Subsidiary: foundry (Satara)', share: 0.28, inv: 60, sell: [P.casting], buy: [P.scrap, P.coal], buyRatio: 0.52, custStates: [27, 27], supStates: [27] }),
    ] },
  { key: 'G04', kind: 'clean', short: 'Konkan Life Sciences', sector: 'Pharmaceuticals', turnover: 5400, growth: 1.1, officer: 'A. Deshpande', range: 'LTU Range 2',
    entities: [
      E('G04A', 'KONKAN LIFE SCIENCES LIMITED', 27, 'ZZKCK2405P', { role: 'Formulations plant (Tarapur)', share: 0.64, inv: 120, sell: [P.pharma], buy: [P.api, P.carton], buyRatio: 0.45, custStates: [27, 27, 7, 9, 33, 19], supStates: [27, 24, 36] }),
      E('G04B', 'KONKAN LIFE SCIENCES LIMITED', 24, 'ZZKCK2405P', { role: 'API plant (Ankleshwar)', share: 0.36, inv: 55, sell: [P.api], buy: [P.chem], buyRatio: 0.5, custStates: [24, 36, 27], supStates: [24] }),
    ] },
  { key: 'G05', kind: 'clean', short: 'Triveni Cement', sector: 'Cement', turnover: 4100, growth: 1.06, officer: 'R. Pawar', range: 'LTU Range 3',
    entities: [
      E('G05A', 'TRIVENI CEMENT LIMITED', 27, 'ZZTCT2506Q', { role: 'Integrated plant (Chandrapur)', share: 0.62, inv: 140, sell: [P.cement], buy: [P.coal, P.gta], buyRatio: 0.48, custStates: [27, 27, 27, 23], supStates: [27, 22] }),
      E('G05B', 'TRIVENI CEMENT LIMITED', 23, 'ZZTCT2506Q', { role: 'Grinding unit (Satna)', share: 0.38, inv: 100, sell: [P.cement], buy: [P.coal], buyRatio: 0.44, custStates: [23, 23, 9], supStates: [23, 22] }),
    ] },
  { key: 'G16', kind: 'clean', short: 'Unnati Paper', sector: 'Paper', turnover: 1400, growth: 1.05, officer: 'R. Pawar', range: 'LTU Range 3',
    entities: [E('G16A', 'UNNATI PAPER MILLS LIMITED', 27, 'ZZUCU2616R', { role: 'Mill (Ballarpur)', share: 1, inv: 85, sell: [P.paper], buy: [P.pulp, P.coal], buyRatio: 0.6, custStates: [27, 27, 24, 7], supStates: [27, 33] })] },
  { key: 'G19', kind: 'clean', short: 'Tejas Electronics', sector: 'Electronics manufacturing services', turnover: 6800, growth: 1.18, officer: 'S. Kulkarni', range: 'LTU Range 1',
    entities: [
      E('G19A', 'TEJAS ELECTRONICS MANUFACTURING LIMITED', 33, 'ZZTCT2619S', { role: 'EMS plant (Sriperumbudur)', share: 0.58, inv: 100, sell: [P.tv, P.pcba], buy: [P.pcba], buyRatio: 0.78, custStates: [33, 27, 7, 29], supStates: [33, 29] }),
      E('G19B', 'TEJAS ELECTRONICS MANUFACTURING LIMITED', 27, 'ZZTCT2619S', { role: 'Assembly unit (Pune)', share: 0.42, inv: 80, sell: [P.tv], buy: [P.pcba], buyRatio: 0.74, custStates: [27, 27, 24], supStates: [27] }),
    ] },
  { key: 'G21', kind: 'clean', short: 'Keshav Dairy', sector: 'Dairy products', turnover: 2300, growth: 1.08, officer: 'A. Deshpande', range: 'LTU Range 2',
    entities: [E('G21A', 'KESHAV DAIRY PRODUCTS LIMITED', 27, 'ZZKCK2621T', { role: 'Dairy plant (Baramati)', share: 1, inv: 150, sell: [P.milkpowder, P.ghee], buy: [P.carton, P.gta], buyRatio: 0.22, custStates: [27, 27, 27, 30, 24], supStates: [27] })] },

  // ---------------------------------------------------------------- high risk
  { key: 'G06', kind: 'risky', short: 'Swarnamukhi Bullion', sector: 'Bullion and jewellery trading', turnover: 48000, growth: 1.14, officer: 'M. Shaikh', range: 'LTU Range 4',
    entities: [
      E('G06A', 'SWARNAMUKHI BULLION AND JEWELS LIMITED', 27, 'ZZSCS2606U', { role: 'Head office (Zaveri Bazaar, Mumbai)', share: 0.55, inv: 140, sell: [P.gold, P.jewel], buy: [P.gold], buyRatio: 0.996, custStates: [27, 27, 24, 7], supStates: [27, 7] }),
      E('G06B', 'SWARNAMUKHI BULLION AND JEWELS LIMITED', 24, 'ZZSCS2606U', { role: 'Manufacturing unit (Surat SEZ area)', share: 0.3, inv: 90, sell: [P.jewel], buy: [P.gold], buyRatio: 0.995, custStates: [24, 27], supStates: [24] }),
      E('G06C', 'SWARNAMUKHI GOLD TRADING LLP', 24, 'ZZSFS2607V', { role: 'Related party (common partners)', share: 0.1, inv: 40, sell: [P.gold], buy: [P.gold], buyRatio: 0.999, custStates: [24], supStates: [24] }),
      E('G06D', 'NAVKAR BULLION PRIVATE LIMITED', 27, 'ZZNCN2608W', { role: 'Associate (common director)', share: 0.05, inv: 30, sell: [P.gold], buy: [P.gold], buyRatio: 0.999, custStates: [27], supStates: [27] }),
    ] },
  { key: 'G07', kind: 'risky', short: 'Vidarbha Steel', sector: 'Steel trading', turnover: 2600, growth: 1.35, officer: 'M. Shaikh', range: 'LTU Range 4',
    entities: [E('G07A', 'VIDARBHA STEEL AND ALLOYS PRIVATE LIMITED', 27, 'ZZVCV2709X', { role: 'Trading office (Nagpur)', share: 1, inv: 110, sell: [P.hrc, P.tmt], buy: [P.hrc, P.tmt], buyRatio: 0.985, backToBack: true, custStates: [27, 27, 23, 22], supStates: [27, 22] })] },
  { key: 'G08', kind: 'risky', short: 'Pratham Mobile', sector: 'Mobile phone distribution', turnover: 1800, growth: 1.12, officer: 'M. Shaikh', range: 'LTU Range 4',
    entities: [E('G08A', 'PRATHAM MOBILE DISTRIBUTION PRIVATE LIMITED', 27, 'ZZPCP2810Y', { role: 'Distribution hub (Bhiwandi)', share: 1, inv: 70, sell: [P.phone], buy: [P.phone], buyRatio: 0.95, custStates: [27, 27, 27, 30], supStates: [27, 33] })] },
  { key: 'G09', kind: 'risky', short: 'Omkar Metal Scrap', sector: 'Metal scrap trading', turnover: 1200, growth: 1.05, officer: 'V. Jadhav', range: 'LTU Range 4',
    entities: [E('G09A', 'OMKAR METAL SCRAP PRIVATE LIMITED', 27, 'ZZOCO2911Z', { role: 'Yard (Taloja)', share: 1, inv: 90, sell: [P.scrap], buy: [P.scrap], buyRatio: 0.93, custStates: [27, 27, 24], supStates: [27, 27] })] },
  { key: 'G10', kind: 'risky', short: 'Nirmal Agro', sector: 'Agro commodities', turnover: 3200, growth: 1.04, officer: 'V. Jadhav', range: 'LTU Range 4',
    entities: [
      E('G10A', 'NIRMAL AGRO COMMODITIES LIMITED', 27, 'ZZNCN3012A', { role: 'Head office (Latur)', share: 0.7, inv: 120, sell: [P.pulses, P.oil], buy: [P.pulses, P.oil, P.pulses, P.oil, P.legal], buyRatio: 0.9, custStates: [27, 27, 7, 24], supStates: [27, 23, 8] }),
      E('G10B', 'NIRMAL AGRO COMMODITIES LIMITED', 23, 'ZZNCN3012A', { role: 'Procurement branch (Indore)', share: 0.3, inv: 60, sell: [P.pulses], buy: [P.pulses], buyRatio: 0.92, custStates: [23, 27], supStates: [23] }),
    ] },
  { key: 'G23', kind: 'risky', short: 'Navkar Polymers', sector: 'Polymer trading', turnover: 900, growth: 1.42, officer: 'V. Jadhav', range: 'LTU Range 4',
    entities: [E('G23A', 'NAVKAR POLYMERS PRIVATE LIMITED', 27, 'ZZNCN3123B', { role: 'Trading office (Bhiwandi)', share: 1, inv: 60, sell: [P.polymer, P.pp], buy: [P.polymer, P.pp], buyRatio: 0.97, custStates: [27, 27, 24], supStates: [27] })] },
  { key: 'G24', kind: 'risky', short: 'Akshay Pharma Distributors', sector: 'Pharma distribution', turnover: 1300, growth: 1.06, officer: 'V. Jadhav', range: 'LTU Range 4',
    entities: [E('G24A', 'AKSHAY PHARMA DISTRIBUTORS PRIVATE LIMITED', 27, 'ZZACA3224C', { role: 'C&F agent (Mumbai)', share: 1, inv: 130, sell: [P.pharma], buy: [P.pharma], buyRatio: 0.9, custStates: [27, 27, 27], supStates: [27] })] },

  // ---------------------------------------------------------------- complex but mostly legitimate
  { key: 'G11', kind: 'tricky', short: 'Vardhan Industries', sector: 'Diversified conglomerate', turnover: 62000, growth: 1.08, officer: 'P. Iyer', range: 'LTU Range 5',
    entities: [
      E('G11A', 'VARDHAN INDUSTRIES LIMITED', 27, 'ZZVCV3301D', { role: 'Parent: polymers and head office (Mumbai)', share: 0.34, inv: 170, sell: [P.polymer, P.pp], buy: [P.crude, P.legal, P.gta], buyRatio: 0.66, custStates: [27, 27, 24, 29, 7, 33], supStates: [27, 24] }),
      E('G11B', 'VARDHAN PETROCHEMICALS LIMITED', 24, 'ZZVCV3302E', { role: 'Subsidiary: refinery-chemicals (Jamnagar)', share: 0.3, inv: 110, sell: [P.chem, P.crude], buy: [P.crude], buyRatio: 0.7, custStates: [24, 27, 24], supStates: [24] }),
      E('G11C', 'VARDHAN RETAIL VENTURES LIMITED', 27, 'ZZVCV3303F', { role: 'Subsidiary: retail sourcing (Mumbai)', share: 0.16, inv: 160, sell: [P.apparel, P.pulses, P.oil], buy: [P.apparel, P.pulses, P.oil], buyRatio: 0.82, custStates: [27, 27, 29, 36], supStates: [27, 24, 33] }),
      E('G11D', 'VARDHAN RETAIL VENTURES LIMITED', 29, 'ZZVCV3303F', { role: 'Retail sourcing branch (Bengaluru)', share: 0.06, inv: 90, sell: [P.apparel, P.pulses], buy: [P.apparel], buyRatio: 0.8, custStates: [29, 33], supStates: [29] }),
      E('G11E', 'VARDHAN DIGITAL SERVICES LIMITED', 27, 'ZZVCV3304G', { role: 'Subsidiary: broadband and digital (Navi Mumbai)', share: 0.1, inv: 120, sell: [P.digital], buy: [P.pcba, P.legal], buyRatio: 0.4, custStates: [27, 27, 29, 7], supStates: [27, 33] }),
      E('G11F', 'VARDHAN LOGISTICS PRIVATE LIMITED', 27, 'ZZVCV3305H', { role: 'Subsidiary: group logistics (Navi Mumbai)', share: 0.02, inv: 60, sell: [P.gta], buy: [P.gta], buyRatio: 0.55, custStates: [27], supStates: [27, 24] }),
      E('G11G', 'VARDHAN SOLAR ENERGY LIMITED', 24, 'ZZVCV3306J', { role: 'Subsidiary: solar modules (Dholera)', share: 0.02, inv: 45, sell: [P.module], buy: [P.pcba], buyRatio: 0.7, custStates: [24, 27], supStates: [24] }),
    ] },
  { key: 'G12', kind: 'tricky', short: 'Mahabal Infrastructure', sector: 'Infrastructure (EPC)', turnover: 12000, growth: 1.16, officer: 'P. Iyer', range: 'LTU Range 5',
    entities: [
      E('G12A', 'MAHABAL INFRASTRUCTURE LIMITED', 27, 'ZZMCM3407K', { role: 'Parent EPC contractor (Thane)', share: 0.62, inv: 55, sell: [P.works], buy: [P.cement, P.tmt, P.legal], buyRatio: 0.72, custStates: [27, 27], supStates: [27, 27, 23], milestones: true }),
      E('G12B', 'MAHABAL EXPRESSWAY PRIVATE LIMITED', 27, 'ZZMCM3408L', { role: 'SPV: expressway project', share: 0.24, inv: 30, sell: [P.works], buy: [P.works], buyRatio: 0.9, custStates: [27], supStates: [27], milestones: true }),
      E('G12C', 'MAHABAL POWER PROJECTS PRIVATE LIMITED', 23, 'ZZMCM3409M', { role: 'SPV: transmission project (Madhya Pradesh)', share: 0.14, inv: 25, sell: [P.works], buy: [P.cable, P.cement], buyRatio: 0.78, custStates: [23], supStates: [23, 27], milestones: true }),
    ] },
  { key: 'G13', kind: 'tricky', short: 'Sangam Motors', sector: 'Two-wheeler manufacturing', turnover: 22000, growth: 1.09, officer: 'P. Iyer', range: 'LTU Range 5',
    entities: [
      E('G13A', 'SANGAM MOTORS LIMITED', 27, 'ZZSCS3510N', { role: 'Parent: vehicle plant (Aurangabad)', share: 0.78, inv: 180, sell: [P.bike], buy: [P.forging, P.tyre, P.hrc], buyRatio: 0.7, custStates: [27, 27, 24, 7, 9, 29, 33], supStates: [27, 33] }),
      E('G13B', 'SANGAM AUTO PARTS LIMITED', 27, 'ZZSCS3511P', { role: 'Subsidiary: spares distribution (Aurangabad)', share: 0.15, inv: 150, sell: [P.forging], buy: [P.forging], buyRatio: 0.8, custStates: [27, 24, 29], supStates: [27] }),
      E('G13C', 'SANGAM MOTORS LIMITED', 33, 'ZZSCS3510N', { role: 'Branch plant (Hosur)', share: 0.07, inv: 70, sell: [P.bike], buy: [P.forging, P.tyre], buyRatio: 0.72, custStates: [33, 29], supStates: [33] }),
    ] },
  { key: 'G14', kind: 'tricky', short: 'Aarambh Textiles', sector: 'Textiles (spinning to garments)', turnover: 4500, growth: 1.03, officer: 'S. Kulkarni', range: 'LTU Range 1',
    entities: [
      E('G14A', 'AARAMBH TEXTILES LIMITED', 24, 'ZZACA3612Q', { role: 'Spinning (Rajkot)', share: 0.38, inv: 90, sell: [P.yarn], buy: [P.yarn], buyRatio: 0.62, custStates: [24, 27, 33], supStates: [24] }),
      E('G14B', 'AARAMBH TEXTILES LIMITED', 27, 'ZZACA3612Q', { role: 'Weaving (Bhiwandi)', share: 0.34, inv: 90, sell: [P.fabric], buy: [P.yarn], buyRatio: 0.66, custStates: [27, 24], supStates: [27] }),
      E('G14C', 'AARAMBH APPARELS PRIVATE LIMITED', 33, 'ZZACA3613R', { role: 'Subsidiary: garments (Tiruppur)', share: 0.28, inv: 110, sell: [P.garment], buy: [P.fabric], buyRatio: 0.64, custStates: [33, 29, 27], supStates: [33] }),
    ] },
  { key: 'G15', kind: 'tricky', short: 'Kalpataru Chemicals', sector: 'Chemicals and fertilisers', turnover: 7800, growth: 1.05, officer: 'R. Pawar', range: 'LTU Range 3',
    entities: [
      E('G15A', 'KALPATARU CHEMICALS AND FERTILISERS LIMITED', 27, 'ZZKCK3714S', { role: 'Chemicals complex (Thal)', share: 0.58, inv: 100, sell: [P.chem, P.ammonia], buy: [P.crude, P.chem], buyRatio: 0.7, custStates: [27, 24, 29], supStates: [27, 24] }),
      E('G15B', 'KALPATARU FERTILISERS LIMITED', 27, 'ZZKCK3715T', { role: 'Subsidiary: fertilisers (Thal)', share: 0.42, inv: 110, sell: [P.fert], buy: [P.ammonia, P.chem], buyRatio: 0.84, custStates: [27, 27, 23, 9], supStates: [27] }),
    ] },
  { key: 'G17', kind: 'tricky', short: 'Suryoday Cables', sector: 'Cables and wires', turnover: 2900, growth: 1.13, officer: 'R. Pawar', range: 'LTU Range 3',
    entities: [
      E('G17A', 'SURYODAY CABLES LIMITED', 24, 'ZZSCS3816U', { role: 'Plant (Halol)', share: 0.6, inv: 90, sell: [P.cable], buy: [P.copper, P.pp], buyRatio: 0.76, custStates: [24, 27, 23], supStates: [24, 27] }),
      E('G17B', 'SURYODAY CABLES LIMITED', 27, 'ZZSCS3816U', { role: 'Plant (Silvassa-Vapi belt, Maharashtra side)', share: 0.4, inv: 70, sell: [P.cable], buy: [P.copper], buyRatio: 0.74, custStates: [27, 27], supStates: [27] }),
    ] },
  { key: 'G18', kind: 'clean', short: 'Padma Packaging', sector: 'Packaging', turnover: 1100, growth: 1.07, officer: 'A. Deshpande', range: 'LTU Range 2',
    entities: [E('G18A', 'PADMA PACKAGING INDUSTRIES LIMITED', 27, 'ZZPCP3918V', { role: 'Plant (Ambernath)', share: 1, inv: 120, sell: [P.carton], buy: [P.paper, P.pulp], buyRatio: 0.63, custStates: [27, 27, 24], supStates: [27] })] },
  { key: 'G20', kind: 'clean', short: 'Meghdoot Logistics', sector: 'Logistics (3PL and GTA)', turnover: 1600, growth: 1.1, officer: 'A. Deshpande', range: 'LTU Range 2',
    entities: [E('G20A', 'MEGHDOOT LOGISTICS LIMITED', 27, 'ZZMCM4020W', { role: 'Head office (Bhiwandi)', share: 1, inv: 140, sell: [P.gta], buy: [P.gta, P.legal], buyRatio: 0.62, custStates: [27, 27, 24, 29], supStates: [27, 24] })] },
  { key: 'G22', kind: 'tricky', short: 'Vishwa Tyres', sector: 'Tyres', turnover: 5600, growth: 1.06, officer: 'P. Iyer', range: 'LTU Range 5',
    entities: [
      E('G22A', 'VISHWA TYRES LIMITED', 27, 'ZZVCV4122X', { role: 'Plant (Ranjangaon)', share: 0.6, inv: 110, sell: [P.tyre], buy: [P.rubber, P.chem], buyRatio: 0.6, custStates: [27, 27, 24, 33, 7], supStates: [27, 32] }),
      E('G22B', 'VISHWA TYRES LIMITED', 24, 'ZZVCV4122X', { role: 'Plant (Sanand)', share: 0.4, inv: 90, sell: [P.tyre], buy: [P.rubber], buyRatio: 0.6, custStates: [24, 8, 7], supStates: [24, 32] }),
    ] },
  { key: 'G25', kind: 'tricky', short: 'Lakshya Solar EPC', sector: 'Solar EPC', turnover: 800, growth: 1.55, officer: 'P. Iyer', range: 'LTU Range 5',
    entities: [E('G25A', 'LAKSHYA SOLAR EPC PRIVATE LIMITED', 27, 'ZZLCL4225Y', { role: 'EPC contractor (Pune)', share: 1, inv: 30, sell: [P.works], buy: [P.module, P.cable], buyRatio: 0.82, custStates: [27, 27], supStates: [24, 27], milestones: true })] },
];
const ALL = GROUPS.flatMap((grp) => grp.entities.map((e) => Object.assign(e, { group: grp, gstin: gstin(e.state, e.pan, entityNo(grp, e)), generated: true })));
function entityNo(grp, e) { // same PAN in the same state never happens here, so the entity number is 1 (Z ... 1)
  return '1';
}
const byKey = Object.fromEntries(ALL.map((e) => [e.key, e]));

// ------------------------------------------------------------------ calendar helpers
const g = makeRng(31415);
const lastDay = (fy, m) => { const { y, cm } = calOf(fy, m); return new Date(Date.UTC(y, cm, 0)).getUTCDate(); };
const dateIn = (fy, m, day) => { const { y, cm } = calOf(fy, m); return iso(y, cm, Math.min(day, lastDay(fy, m))); };
const workday = (fy, m) => { for (;;) { const d = dateIn(fy, m, g.ri(1, lastDay(fy, m))); if (new Date(`${d}T00:00:00Z`).getUTCDay() !== 0) return d; } };
const laterInMonth = (fy, m, date, k) => dateIn(fy, m, Math.min(Number(date.slice(8)) + k, lastDay(fy, m)));
const SEASON = { flat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], fmcg: [0.95, 0.96, 0.98, 1, 1.02, 1.05, 1.12, 1.08, 0.98, 0.94, 0.95, 0.97], festive: [0.8, 0.82, 0.85, 0.9, 1, 1.15, 1.45, 1.3, 0.95, 0.88, 0.9, 1.0], construction: [1.1, 1.05, 0.7, 0.6, 0.75, 0.95, 1.05, 1.1, 1.15, 1.2, 1.2, 1.35], agri: [0.9, 0.85, 0.8, 0.85, 1.0, 1.2, 1.25, 1.2, 1.0, 0.95, 1.0, 1.0] };
const seasonOf = (e) => (e.milestones ? 'construction' : /FMCG|Dairy/.test(e.group.sector) ? 'fmcg' : /Bullion|Two-wheeler|Mobile|Textiles/.test(e.group.sector) ? 'festive' : /Agro|fertiliser/i.test(e.group.sector) ? 'agri' : 'flat');

// ------------------------------------------------------------------ external counterparties: realistic names, weighted by size
const PLACE = ['Sahyadri', 'Deccan', 'Konkan', 'Narmada', 'Krishna', 'Kaveri', 'Shivshakti', 'Mahalaxmi', 'Siddhivinayak', 'Om Sai', 'Shree Ganesh', 'Jai Ambe', 'Navjeevan', 'Pragati', 'Unnati', 'Samarth', 'Vishal', 'Bharat', 'Hindustan', 'Rashtriya', 'Suvarna', 'Rajlaxmi', 'Kamdhenu', 'Anand', 'Vijay', 'Parshwa', 'Mahavir', 'Tirupati', 'Balaji', 'Annapurna', 'Gurukrupa', 'Vaishnavi', 'Dhanlaxmi', 'Saraswati', 'Kohinoor', 'Everest', 'Sunrise', 'Pioneer', 'Apex', 'Supreme', 'Prime', 'Royal', 'Classic', 'Metro', 'Galaxy', 'Orient', 'Western', 'Eastern', 'Southern', 'Central'];
const FORM = [['Private Limited', 'C', 5], ['Limited', 'C', 2], ['LLP', 'F', 2], ['Enterprises', 'P', 2], ['Traders', 'F', 2], ['Agencies', 'F', 1], ['Distributors', 'F', 2], ['Industries', 'C', 1], ['& Co', 'F', 1]];
const TRADE_WORD = (prod) => ({ '998313': 'Technologies', '3401': 'Retail', '3402': 'Marketing', '8708': 'Auto', '7325': 'Engineering', '3004': 'Pharma', '2941': 'Chemicals', '2523': 'Buildcon', '2701': 'Coal Traders', '7108': 'Jewellers', '7113': 'Jewellers', '7208': 'Steel', '7214': 'Steel', '8517': 'Mobiles', '7204': 'Metals', '0713': 'Foods', '1512': 'Oils', '3901': 'Plastics', '3902': 'Polymers', '998422': 'Infotech', '6109': 'Fashions', '996511': 'Roadways', '8541': 'Solar', '995421': 'Infra Projects', '8711': 'Motors', '5205': 'Spinners', '5208': 'Textiles', '6205': 'Garments', '2902': 'Petrochem', '3105': 'Agro Services', '2814': 'Gases', '4802': 'Stationery', '4703': 'Pulp', '8544': 'Electricals', '7408': 'Metals', '4819': 'Packaging', '8473': 'Electronics', '8528': 'Electronics', '0402': 'Foods', '0405': 'Dairy', '0401': 'Dairy', '4011': 'Tyres', '4001': 'Rubber', '998212': 'Legal Associates', '2710': 'Petroleum' }[prod.hsn[0]] || 'Traders');
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
  x.gstin = gstin(state, g.pan(x.type));
  externals.push(x);
  return x;
};
// Customers and suppliers per registration; a few large ones take most of the business (Pareto weights).
const counts = (e) => ({ c: Math.round(18 + Math.sqrt(e.group.turnover * e.share) * 0.9), s: Math.round(12 + Math.sqrt(e.group.turnover * e.share) * 0.5) });
for (const e of ALL) {
  const { c, s } = counts(e);
  e.customers = Array.from({ length: Math.min(c, 110) }, (_, i) => makeExternal(e.custStates[i % e.custStates.length], e.sell[0], { weight: 1 / (i + 1) ** 0.85 }));
  e.suppliers = Array.from({ length: Math.min(s, 70) }, (_, i) => makeExternal(e.supStates[i % e.supStates.length], g.pick(e.buy), { weight: 1 / (i + 1) ** 0.8 }));
}
const pickWeighted = (list) => { const tot = list.reduce((a, x) => a + x.weight, 0); let r = g.rnd() * tot; for (const x of list) { r -= x.weight; if (r <= 0) return x; } return list[list.length - 1]; };

// Planted counterparties for the high-risk groups
const shell = (state, prod, fromFy, fromM, note) => makeExternal(state, prod, { shell: true, activeFrom: { fy: fromFy, m: fromM }, filesNo3B: true, type: 'P', note });
const G07shells = [shell(27, P.hrc, 2024, 9, 'registered Jan 2025, no GSTR-3B'), shell(27, P.tmt, 2025, 0, 'registered Apr 2025, no GSTR-3B'), shell(22, P.hrc, 2025, 2, 'registered Jun 2025, no GSTR-3B'), shell(27, P.hrc, 2025, 4, 'registered Aug 2025, no GSTR-3B')];
const G06shells = [shell(27, P.gold, 2024, 6, 'registered Oct 2024, no GSTR-3B'), shell(24, P.gold, 2025, 1, 'registered May 2025, no GSTR-3B')];
const G23shells = [shell(27, P.polymer, 2025, 3, 'registered Jul 2025, no GSTR-3B')];
const G09cancelled = makeExternal(27, P.scrap, { cancelledOn: '2025-06-30', note: 'registration cancelled 30-06-2025' });

// ------------------------------------------------------------------ the ledger
const ledger = []; // { fy, m, seller, buyer, date, prod, rate, taxable, tags[], shipTo? }
// tags are copied: a flow's tag list is shared by all its invoices, and later tagging marks one invoice only
const add = (fy, m, seller, buyer, date, prod, taxable, tags = [], extra = {}) => ledger.push({ fy, m, seller, buyer, date, prod, rate: rateOf(prod, date), taxable: r2(taxable), tags: [...tags], ...extra });
// Split an amount into about n invoices, log-uniform over two decades (first digits then follow Benford's law, as in
// genuine trade; a narrower spread gives a first-digit profile the Benford indicator rightly calls unnatural).
const split = (amount, n) => {
  if (amount <= 0) return [];
  const w = Array.from({ length: Math.max(1, n) }, () => g.logU(0.1, 10)); // two full decades: first digits follow Benford's law
  const tot = w.reduce((a, b) => a + b, 0);
  return w.map((x) => (amount * x) / tot);
};
const isActive = (x, fy, m) => !x.activeFrom || fy > x.activeFrom.fy || (fy === x.activeFrom.fy && m >= x.activeFrom.m);
const annual = (e) => e.group.turnover * e.share * CR; // FY 2024-25 external sales of the registration, ₹
const monthly = (e, fy, m) => (annual(e) / 12) * (fy === 2025 ? e.group.growth : 1) * SEASON[seasonOf(e)][m] * (0.95 + g.rnd() * 0.1);

for (const fy of FYS) {
  for (let m = 0; m < 12; m++) {
    for (const e of ALL) {
      let sales = monthly(e, fy, m);
      // EPC: milestone billing: most of a quarter's value is certified in its last month
      if (e.milestones) sales *= [0.35, 0.45, 2.2][m % 3];
      const n = Math.max(6, Math.round(e.inv * (sales / (annual(e) / 12)) ** 0.5));
      const supplierPool = e.suppliers.filter((s) => isActive(s, fy, m));
      if (e.backToBack) { // a trader buying against orders: each sale bought from a supplier one to three days earlier
        for (const v of split(sales, n)) {
          const d = workday(fy, m), prod = g.pick(e.sell);
          add(fy, m, pickWeighted(supplierPool), e, dateIn(fy, m, Math.max(1, Number(d.slice(8)) - g.ri(1, 3))), prod, v * e.buyRatio);
          add(fy, m, e, pickWeighted(e.customers), d, prod, v);
        }
        continue;
      }
      for (const v of split(sales, n)) add(fy, m, e, pickWeighted(e.customers), workday(fy, m), g.pick(e.sell), v);
      const buy = sales * e.buyRatio * (0.97 + g.rnd() * 0.06);
      for (const v of split(buy, Math.round(n * 0.8))) {
        const prod = g.pick(e.buy);
        add(fy, m, pickWeighted(supplierPool), e, workday(fy, m), prod, v, prod.rc ? ['rcm'] : []);
      }
    }
  }
}

// ---- intra-group and cross-group flows (legitimate supply chains): [from, to, ₹ crore per year, product, tags]
const FLOWS = [
  ['G02A', 'G02B', 900, P.soap, ['stock-transfer']], ['G02A', 'G02C', 800, P.detergent, ['stock-transfer']], ['G02A', 'G02D', 700, P.soap, ['stock-transfer']],
  ['G03B', 'G03A', 520, P.casting, ['intra-group']], ['G04B', 'G04A', 780, P.api, ['stock-transfer']], ['G05A', 'G05B', 260, P.cement, ['stock-transfer']],
  ['G19A', 'G19B', 1400, P.pcba, ['stock-transfer']],
  ['G11B', 'G11A', 9800, P.crude, ['intra-group']], ['G11A', 'G11C', 1100, P.pp, ['intra-group']], ['G11C', 'G11D', 700, P.apparel, ['stock-transfer']],
  ['G11F', 'G11A', 380, P.gta, ['intra-group']], ['G11F', 'G11C', 240, P.gta, ['intra-group']], ['G11G', 'G11E', 90, P.module, ['intra-group']], ['G11A', 'G11B', 1300, P.polymer, ['intra-group']],
  ['G12A', 'G12B', 900, P.works, ['intra-group']], ['G12A', 'G12C', 520, P.works, ['intra-group']],
  ['G13B', 'G13A', 1300, P.forging, ['intra-group']], ['G13A', 'G13C', 700, P.forging, ['stock-transfer']],
  ['G14A', 'G14B', 780, P.yarn, ['stock-transfer']], ['G14B', 'G14C', 690, P.fabric, ['intra-group']],
  ['G15A', 'G15B', 1450, P.ammonia, ['intra-group']], ['G17A', 'G17B', 420, P.copper, ['stock-transfer']], ['G22A', 'G22B', 380, P.rubber, ['stock-transfer']],
  // cross-group supply chains
  ['G18A', 'G02A', 160, P.carton, ['supply-chain']], ['G18A', 'G21A', 90, P.carton, ['supply-chain']], ['G22A', 'G13A', 1250, P.tyre, ['supply-chain']], ['G03A', 'G13A', 980, P.forging, ['supply-chain']],
  ['G05A', 'G12A', 420, P.cement, ['supply-chain']], ['G07A', 'G12A', 360, P.tmt, ['supply-chain']], ['G11A', 'G18A', 140, P.polymer, ['supply-chain']], ['G11A', 'G23A', 310, P.polymer, ['supply-chain']],
  ['G04A', 'G24A', 520, P.pharma, ['supply-chain']], ['G11G', 'G25A', 260, P.module, ['supply-chain']], ['G17A', 'G12C', 170, P.cable, ['supply-chain']], ['G20A', 'G02A', 110, P.gta, ['supply-chain']],
  ['G20A', 'G05A', 140, P.gta, ['supply-chain']], ['G16A', 'G18A', 210, P.paper, ['supply-chain']], ['G19B', 'G11C', 240, P.tv, ['supply-chain']],
];
for (const fy of FYS) {
  for (let m = 0; m < 12; m++) {
    for (const [from, to, cr, prod, tags] of FLOWS) {
      const s = byKey[from], b = byKey[to];
      const amount = (cr * CR / 12) * (fy === 2025 ? s.group.growth : 1) * (0.9 + g.rnd() * 0.2);
      for (const v of split(amount, Math.max(4, Math.round(Math.sqrt(cr) / 2)))) add(fy, m, s, b, workday(fy, m), prod, v, tags);
      // a trader buys what it sells, including what it supplies to other groups
      if (s.buyRatio >= 0.95) for (const v of split(amount * s.buyRatio, Math.max(4, Math.round(Math.sqrt(cr) / 2)))) add(fy, m, pickWeighted(s.suppliers.filter((x) => isActive(x, fy, m))), s, workday(fy, m), prod, v);
    }
  }
}

// ---- planted: bill-to-ship-to (G11): billed to the Mumbai parent, goods shipped straight to a customer's plant in Gujarat
for (const x of ledger.filter((t) => t.seller === byKey.G11B && t.buyer === byKey.G11A)) if (g.rnd() < 0.3) { x.shipTo = '24'; x.tags.push('bill-to-ship-to'); }
// ...and five of them, delivered inside Gujarat, were wrongly charged CGST + SGST instead of IGST (a genuine D-05 error)
for (const x of ledger.filter((t) => t.tags.includes('bill-to-ship-to') && t.fy === 2025).slice(0, 5)) { x.wrongHead = true; x.tags.push('wrong-head'); }

// ---- planted: bullion round-trip (G06): A -> D -> C -> B -> A at a fraction of a percent, within days
for (const fy of FYS) {
  for (let m = 0; m < 12; m++) {
    const base = { 2024: 380, 2025: 520 }[fy] * CR * (0.85 + g.rnd() * 0.3);
    for (const v of split(base, 14)) {
      const d0 = workday(fy, m);
      const d1 = laterInMonth(fy, m, d0, g.ri(1, 2)), d2 = laterInMonth(fy, m, d1, g.ri(1, 2)), d3 = laterInMonth(fy, m, d2, g.ri(1, 3));
      add(fy, m, byKey.G06A, byKey.G06D, d0, P.gold, v, ['cycle']);
      add(fy, m, byKey.G06D, byKey.G06C, d1, P.gold, v * 1.0008, ['cycle']);
      add(fy, m, byKey.G06C, byKey.G06B, d2, P.gold, v * 1.0015, ['cycle']);
      add(fy, m, byKey.G06B, byKey.G06A, d3, P.gold, v * 1.002, ['cycle', 'stock-transfer']);
    }
    // the associate is both customer and supplier of the Mumbai office (reciprocal trade at near-zero margin)
    for (const v of split(185 * CR * (0.85 + g.rnd() * 0.3), 8)) {
      const d = workday(fy, m);
      add(fy, m, byKey.G06D, byKey.G06A, d, P.gold, v, ['cycle', 'reciprocal']);
      add(fy, m, byKey.G06A, byKey.G06D, laterInMonth(fy, m, d, g.ri(1, 3)), P.gold, v * 1.0006, ['cycle', 'reciprocal']);
    }
    // shell suppliers (no GSTR-3B) feeding the Mumbai office once they are registered
    for (const s of G06shells.filter((x) => isActive(x, fy, m))) for (const v of split(135 * CR * (0.8 + g.rnd() * 0.4), 6)) add(fy, m, s, byKey.G06A, workday(fy, m), P.gold, v, ['shell-supplier']);
  }
}

// ---- planted: steel pass-through (G07): shells -> G07 -> customers within 1-3 days at about 1%, volume rising fast
for (const fy of FYS) {
  for (let m = 0; m < 12; m++) {
    for (const s of G07shells.filter((x) => isActive(x, fy, m))) {
      for (const v of split(26 * CR * (fy === 2025 ? 1.6 : 1) * (0.8 + g.rnd() * 0.4), 8)) {
        const d = workday(fy, m);
        add(fy, m, s, byKey.G07A, d, P.hrc, v, ['shell-supplier', 'pass-through-in']);
        add(fy, m, byKey.G07A, pickWeighted(byKey.G07A.customers), laterInMonth(fy, m, d, g.ri(1, 3)), P.hrc, v * 1.01, ['pass-through-out']);
      }
    }
  }
}
// ---- planted: polymer trader (G23) buying from a shell from July 2025
for (let m = 3; m < 12; m++) for (const v of split(18 * CR * (0.8 + g.rnd() * 0.4), 5)) add(2025, m, G23shells[0], byKey.G23A, workday(2025, m), P.polymer, v, ['shell-supplier']);
// ---- planted: scrap dealer (G09) keeps buying from a supplier after its registration was cancelled (not in 2A/2B)
for (let m = 3; m < 9; m++) for (const v of split(6 * CR, 4)) add(2025, m, G09cancelled, byKey.G09A, workday(2025, m), P.scrap, v, ['cancelled-supplier']);
// ---- planted: mobile distributor (G08) splits retail invoices just under the ₹50,000 e-way bill threshold
for (const fy of FYS) for (let m = 0; m < 12; m++) {
  const retailers = byKey.G08A.customers.slice(20);
  const k = fy === 2025 ? 420 : 300;
  for (let i = 0; i < k; i++) {
    const total = g.ri(44000, 49900); // invoice value including 18% tax
    add(fy, m, byKey.G08A, g.pick(retailers), workday(fy, m), P.phone, total / 1.18, ['below-ewb-threshold']);
  }
}

// ------------------------------------------------------------------ invoice numbers: sequential by date per seller and year
const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
const seqs = new Map();
for (const x of ledger) { const k = `${x.seller.gstin}|${x.fy}`; (seqs.get(k) || seqs.set(k, []).get(k)).push(x); }
const prefixOf = (e) => `${e.name.split(' ').filter((w) => !/^(AND|OF|THE|&)$/.test(w)).slice(0, 3).map((w) => w[0]).join('')}${e.state === '27' ? '' : `-${e.state}`}`;
for (const list of seqs.values()) {
  list.sort(byDate);
  list.forEach((x, i) => {
    x.seq = i + 1;
    const fyTag = `${String(x.fy).slice(2)}-${String(x.fy + 1).slice(2)}`;
    x.no = x.seller.generated ? `${prefixOf(x.seller)}/${fyTag}/${String(i + 1).padStart(6, '0')}` : `${x.seller.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}/${fyTag}/${1000 + i}`;
  });
}

// ------------------------------------------------------------------ filing behaviour and planted return defects
const PLAN = {
  G06A: { 2024: { filedOn: { 7: '2024-12-18', 10: '2025-03-29' } },
    2025: { excessItc: { 4: 32 * CR, 5: 28 * CR, 6: 41 * CR, 8: 36 * CR, 9: 44 * CR, 10: 29 * CR }, underDeclare: { 7: { taxable: 460 * CR, tax: 13.8 * CR }, 11: { taxable: 520 * CR, tax: 15.6 * CR } }, filedOn: { 6: '2025-12-02' } } },
  G06C: { 2025: { unfiledPeriods: [9, 10, 11] } },
  G07A: { 2025: { excessItc: { 5: 6.5 * CR, 6: 7.2 * CR, 7: 8.1 * CR, 9: 6.9 * CR, 10: 7.7 * CR }, underDeclare: { 11: { taxable: 38 * CR, tax: 6.84 * CR } }, filedOn: { 2: '2025-08-05', 8: '2026-01-10' } } },
  G08A: { 2025: { underDeclare: { 6: { taxable: 21 * CR, tax: 3.78 * CR }, 7: { taxable: 24 * CR, tax: 4.32 * CR } } } },
  G09A: { 2024: { underDeclare: { 5: { taxable: 9 * CR, tax: 1.62 * CR } } }, 2025: { filedOn: { 3: '2025-09-12', 4: '2025-10-15' } } },
  G10A: { 2024: { underDeclare: { 2: { taxable: 14 * CR, tax: 0.7 * CR }, 4: { taxable: -14 * CR, tax: -0.7 * CR } } }, 2025: { rcmDeclaredShare: 0.35 } },
  G23A: { 2025: { excessItc: { 8: 0.9 * CR, 10: 1.2 * CR } } },
  G24A: { 2025: { underDeclare: { 7: { taxable: 11 * CR, tax: 0.55 * CR }, 8: { taxable: 9 * CR, tax: 0.45 * CR } } } },
  G17A: { 2025: { filedOn: { 1: '2025-07-02', 2: '2025-07-29' }, interestPaid: { 1: 184000, 2: 91000 } } },
};
// G09 claims ITC on the cancelled supplier's invoices, which never reach GSTR-2B.
for (const x of ledger.filter((t) => t.tags.includes('cancelled-supplier'))) {
  const ex = (((PLAN.G09A ||= {})[2025] ||= {}).excessItc ||= {});
  ex[x.m] = r2((ex[x.m] || 0) + taxOf(heads(x.taxable, x.rate, true)));
}
// shells: their buyers still see the invoices in 2A/2B (GSTR-1 filed), but GSTR-3B is not filed
const filed3B = (seller) => !seller.filesNo3B;

// ------------------------------------------------------------------ project the ledger into each registration-year's workbook
const party = (x) => ({ gstin: x.gstin, name: x.name, state: x.state });
const fileOf = (e, fy) => `Get Download All Report_${e.gstin}_${fy} - ${fy + 1}_GEN ${e.group.short}${e.group.entities.length > 1 ? ` ${e.key.slice(3)}` : ''}.xlsx`;
export const expectedFiles = () => ALL.flatMap((e) => FYS.map((fy) => fileOf(e, fy)));
const stamp = path.join(DATA, '.corporates.version');

export async function generate({ registers = false } = {}) {
  fs.mkdirSync(DATA, { recursive: true });
  const mine = new Set(ALL.map((e) => e.gstin));
  for (const f of fs.readdirSync(DATA)) if (/_GEN .*\.xlsx$/i.test(f) && mine.has(f.split('_')[1])) fs.rmSync(path.join(DATA, f)); // previous versions (not other units')
  const written = [];
  for (const e of ALL) {
    for (const fy of FYS) {
      const intraOf = (x, other) => (other.state === e.state) !== Boolean(x.wrongHead);
      const sales = ledger.filter((x) => x.seller === e && x.fy === fy).sort(byDate).map((x) => ({ m: x.m, c: party(x.buyer), no: x.no, seq: x.seq, date: x.date, rate: x.rate, taxable: x.taxable, ...heads(x.taxable, x.rate, intraOf(x, x.buyer)), hsn: x.prod.hsn }));
      const purchases = ledger.filter((x) => x.buyer === e && x.fy === fy).sort(byDate).map((x) => {
        const cancelledNow = x.seller.cancelledOn && x.date > x.seller.cancelledOn;
        const rc = !!x.prod.rc;
        return { m: x.m, s: party(x.seller), no: x.no, date: x.date, rate: x.rate, taxable: x.taxable, ...heads(x.taxable, x.rate, intraOf(x, x.seller)), rc, filed3B: filed3B(x.seller), ...(cancelledNow ? { in2A: false, in2B: false } : {}) };
      });
      const cdns = []; // conglomerates: volume discounts to their largest customers in Q4
      if (e.group.kind === 'tricky' && fy === 2025) {
        const big = e.customers.slice(0, 3);
        let n = 0;
        for (const x of ledger.filter((t) => t.seller === e && t.fy === 2025 && big.includes(t.buyer) && t.m <= 10).filter((_, i) => i % 5 === 0)) {
          const mm = 9 + (n % 3); const t = r2(x.taxable * (0.03 + g.rnd() * 0.04));
          cdns.push({ m: mm, c: party(x.buyer), hsn: x.prod.hsn, no: `${prefixOf(e)}/CN/25-26/${String(++n).padStart(5, '0')}`, date: dateIn(2025, mm, 8 + (n % 18)), origNo: x.no, origDate: x.date, rate: x.rate, taxable: t, ...heads(t, x.rate, x.buyer.state === e.state) });
        }
      }
      const opts = PLAN[e.key]?.[fy] || {};
      const lead = e.group.kind === 'clean' ? () => g.ri(2, 8) : e.group.kind === 'tricky' ? () => g.ri(0, 5) : () => g.ri(-1, 2);
      const { wb, stats } = writeReturns({
        name: e.name, gstin: e.gstin, state: Number(e.state), fy, filing: 'monthly', irn: !(e.key === 'G09A' && fy === 2024), extractDate: EXTRACT[fy],
        title: `SYNTHETIC LARGE TAXPAYER ${JURISDICTION} - not a real taxpayer`, portalLateFee: true, sales, cdns, purchases, stateNames: STATE_NAME, ...opts,
      }, { filingLead: lead });
      const file = fileOf(e, fy);
      fs.writeFileSync(path.join(DATA, file), XLSX.write(wb, { bookType: 'xlsx', type: 'buffer', compression: true }));
      written.push({ key: e.key, fy, file, ...stats });
    }
  }
  fs.writeFileSync(stamp, VERSION);
  writeKey(written);
  if (registers) await installRegisters();
  return written;
}

// ------------------------------------------------------------------ registers (CSV in the templates' layout) and the answer key
const csvLine = (vals) => vals.map((v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',');
const dmy = (d) => d.split('-').reverse().join('-');
const fyLabel = (fy) => `${fy}-${String(fy + 1).slice(2)}`;
const outputTax = (e, fy, m) => ledger.filter((x) => x.seller === e && x.fy === fy && (m == null || x.m === m)).reduce((s, x) => s + taxOf(heads(x.taxable, x.rate, x.buyer.state === e.state)), 0);
const inLtu = ALL.filter((e) => e.state === '27');
const REG_DATES = ['2017-07-01', '2017-07-01', '2017-07-01', '2018-04-01', '2019-10-01'];
export const registerRows = () => ({
  master: [['gstin', 'legal_name', 'jurisdiction', 'range', 'officer', 'sector', 'registration_date', 'status', 'status_date'],
    ...ALL.map((e) => [e.gstin, e.name, e.state === '27' ? JURISDICTION : `External (${STATE_NAME[Number(e.state)] || e.state})`, e.state === '27' ? e.group.range : '', e.state === '27' ? e.group.officer : '', e.group.sector,
      dmy(e.key === 'G23A' ? '2021-02-15' : e.key === 'G07A' ? '2020-11-09' : REG_DATES[Number(e.key.slice(1, 3)) % REG_DATES.length]), e.key === 'G06C' ? 'Suspended' : 'Active', e.key === 'G06C' ? '18-04-2026' : '']),
    [G09cancelled.gstin, G09cancelled.name, 'External', '', '', 'Metal scrap trading', '01-07-2019', 'Cancelled', dmy(G09cancelled.cancelledOn)],
  ],
  targets: [['jurisdiction', 'fy', 'month', 'target_amount', 'version', 'approved_on', 'basis'],
    ...FYS.flatMap((fy) => MONTHS.map((mn, m) => [JURISDICTION, fyLabel(fy), mn.slice(0, 3), Math.round((fy === 2024 ? inLtu.reduce((s, e) => s + outputTax(e, fy, m), 0) * 1.02 : inLtu.reduce((s, e) => s + outputTax(e, fy - 1, m), 0) * 1.1) / 1e5) * 1e5, 'v1', `01-04-${fy}`,
      fy === 2024 ? 'Opening year: 2% over the year' : 'Prior-year output tax for the month + 10%'])),
  ],
  eiu: [['signal_id', 'gstin', 'risk_parameter', 'rule_id', 'fy', 'amount', 'signal_date', 'priority', 'source', 'remarks'],
    ['EIU-2025-0201', byKey.G06A.gstin, 'Circular trading among related parties at negligible margin', '', '2025-26', Math.round(ledger.filter((x) => x.tags.includes('cycle') && x.fy === 2025).reduce((s, x) => s + taxOf(heads(x.taxable, x.rate, x.seller.state === x.buyer.state)), 0) / 4), '12-12-2025', 'High', 'EIU network risk run', 'Four registrations, common directors and partners'],
    ['EIU-2025-0202', byKey.G06A.gstin, 'ITC claimed in excess of GSTR-2B', 'B-01', '2025-26', Math.round((32 + 28 + 41 + 36 + 44 + 29) * CR), '15-02-2026', 'High', 'EIU monthly risk run', 'Aug to Feb returns, not reversed'],
    ['EIU-2025-0203', byKey.G07A.gstin, 'ITC availed from suppliers not filing GSTR-3B', 'A-02', '2025-26', Math.round(ledger.filter((x) => x.buyer === byKey.G07A && x.tags.includes('shell-supplier') && x.fy === 2025).reduce((s, x) => s + taxOf(heads(x.taxable, x.rate, x.seller.state === '27')), 0)), '20-11-2025', 'High', 'EIU network risk run', 'Four recently registered suppliers'],
    ['EIU-2025-0204', byKey.G08A.gstin, 'Invoice values bunched below the e-way bill threshold', '', '2025-26', 0, '05-10-2025', 'Medium', 'EIU e-way bill analytics', 'Retail invoices of ₹44,000 to ₹49,900'],
    ['EIU-2025-0205', byKey.G24A.gstin, 'GSTR-1 tax exceeds GSTR-3B tax', 'G-02', '2025-26', Math.round((0.55 + 0.45) * CR), '18-01-2026', 'Medium', 'EIU monthly risk run', 'November and December 2025'],
    ['EIU-2025-0206', byKey.G11A.gstin, 'Place of supply on bill-to-ship-to movements', 'D-05', '2025-26', 0, '02-02-2026', 'Low', 'EIU e-way bill analytics', 'Refinery shipments delivered in Gujarat, billed to Mumbai'],
    ['EIU-2025-0207', byKey.G10A.gstin, 'Reverse charge liability under-declared', '', '2025-26', 0, '10-03-2026', 'Medium', 'EIU monthly risk run', 'Legal services received under reverse charge'],
  ],
});
// What the planted behaviour must trigger, per registration and year: checked end to end by scripts/synth/validate.mjs.
export const EXPECT = [
  { key: 'G06A', fy: 2025, rules: { 'B-01': 'Fail', 'G-02': 'Fail', 'B-04': 'Review' }, flags: ['nonfiler', 'circular'] },
  { key: 'G06C', fy: 2025, rules: { 'A-02': 'Fail' } },
  { key: 'G07A', fy: 2025, rules: { 'B-01': 'Fail', 'G-02': 'Fail', 'B-03': 'Fail', 'G-05': 'Fail', 'B-04': 'Review' }, flags: ['nonfiler', 'vehicle'] },
  { key: 'G08A', fy: 2025, rules: { 'G-02': 'Fail', 'G-05': 'Fail' }, flags: ['ewb'] },
  { key: 'G09A', fy: 2025, rules: { 'B-01': 'Fail', 'G-05': 'Fail' } },
  { key: 'G09A', fy: 2024, rules: { 'G-02': 'Fail', 'G-03': 'Review' } },
  { key: 'G10A', fy: 2025, rules: { 'C-01': 'Fail' } },
  { key: 'G11B', fy: 2025, rules: { 'D-05': 'Fail' } },
  { key: 'G23A', fy: 2025, rules: { 'B-03': 'Fail', 'B-04': 'Review' }, flags: ['nonfiler', 'vehicle'] },
  { key: 'G24A', fy: 2025, rules: { 'G-02': 'Fail', 'G-05': 'Fail' } },
  { key: 'G17A', fy: 2025, rules: { 'J-03': 'Pass' } },
  { key: 'G12A', fy: 2025, prompts: ['spike'] },
];
export const EXPECT_NETWORK = [
  { fy: '2025-2026', type: 'cycle', via: null, from: 'G06A', to: 'G06D' },
  { fy: '2025-2026', type: 'passThrough', via: 'G07A' },
  { fy: '2025-2026', type: 'nonFiler', from: () => G07shells[1].gstin, to: 'G07A' },
];

const writeKey = (written) => {
  fs.mkdirSync(path.join(KEY_DIR, 'registers'), { recursive: true });
  for (const [name, rows] of Object.entries(registerRows())) fs.writeFileSync(path.join(KEY_DIR, 'registers', `${name}.csv`), rows.map(csvLine).join('\n') + '\n');
  const turnover = (e, fy) => ledger.filter((x) => x.seller === e && x.fy === fy).reduce((s, x) => s + x.taxable, 0);
  const key = {
    generatedBy: `scripts/synth/corporates.mjs (seed 31415, ${VERSION})`, jurisdiction: JURISDICTION, synthetic: true,
    note: 'Every name, PAN and figure is invented. The groups resemble kinds of businesses in behaviour only; none represents a real company.',
    groups: GROUPS.map((grp) => ({ key: grp.key, kind: grp.kind, sector: grp.sector, name: grp.entities[0].name,
      turnoverCrore: FYS.map((fy) => Math.round(grp.entities.reduce((s, e) => s + turnover(e, fy), 0) / CR)),
      registrations: grp.entities.map((e) => ({ key: e.key, gstin: e.gstin, name: e.name, state: e.state, role: e.role, samePanAsParent: e.pan === grp.entities[0].pan })) })),
    planted: {
      G06: 'Bullion round-trip A -> D -> C -> B -> A within days at 0.08-0.2% mark-ups, plus reciprocal trade with the associate (D); two shell suppliers without GSTR-3B; ITC above GSTR-2B in six months of FY 2025-26 (about Rs 210 crore, not reversed); 3B short of GSTR-1 in Nov 2025 and Mar 2026; late returns; related LLP stops filing from Jan 2026. Gold and jewellery are exempt from e-way bills.',
      G07: 'Pass-through steel trading: four recently registered suppliers (no GSTR-3B) -> G07 -> customers within 1-3 days at ~1%; ITC above GSTR-2B in five months of FY 2025-26; 3B short in Mar 2026; late returns.',
      G08: 'Retail invoices bunched at ₹44,000-49,900, just under the ₹50,000 e-way bill threshold; 3B short of GSTR-1 in Oct and Nov 2025.',
      G09: 'IRN not generated in FY 2024-25; 3B short of GSTR-1 in Sep 2024; purchases from a supplier after its registration was cancelled (30-06-2025), which never reach 2A/2B.',
      G10: '3B short in Jun 2024, caught up in Aug 2024; RCM on GTA declared at 35% in FY 2025-26.',
      G23: 'New shell supplier from Jul 2025; excess ITC in Dec 2025 and Feb 2026.',
      G24: '3B short of GSTR-1 in Nov and Dec 2025.',
      G11: 'Legitimate but noisy: seven registrations, heavy intra-group trade, same-PAN stock transfers, bill-to-ship-to deliveries in Gujarat billed to Mumbai, Q4 volume discounts.',
      G12: 'Legitimate but spiky: milestone billing concentrated in quarter-end months; SPVs billed by the parent.',
      G13: 'Legitimate: two-wheeler and parts rates fall from 28% to 18% on 22-09-2025, so tax falls while turnover grows.',
      G17: 'Two returns filed late in FY 2025-26, with interest paid.',
    },
    workbooks: written.map((w) => ({ key: w.key, fy: fyLabel(w.fy), file: w.file, sales: w.sales, purchases: w.purchases, cdns: w.cdns })),
  };
  fs.writeFileSync(path.join(KEY_DIR, 'answer-key.json'), JSON.stringify(key, null, 1));
  // What the simulated e-way bill system (scripts/synth/ewb.mjs) needs to know about these groups: both the seller's
  // and the buyer's copy are simulated separately, so every planted movement problem is stated here once.
  const ewbPlan = {
    version: VERSION,
    noMovement: [...G07shells.map((s) => [s.gstin, byKey.G07A.gstin, 0.8]), [G23shells[0].gstin, byKey.G23A.gstin, 0.9], [G09cancelled.gstin, byKey.G09A.gstin, 1]],
    suppressed: { [byKey.G07A.gstin]: 0.04, [byKey.G09A.gstin]: 0.05, [byKey.G08A.gstin]: 0.02, [byKey.G24A.gstin]: 0.02 },
    vehicleClash: { [byKey.G07A.gstin]: 6, [byKey.G23A.gstin]: 3 },
    cancel: Object.fromEntries(ALL.filter((e) => e.group.kind === 'risky').map((e) => [e.gstin, 0.06])),
    shipTo: Object.fromEntries(ledger.filter((x) => x.shipTo).map((x) => [`${x.seller.gstin}|${x.no}`, x.shipTo])),
  };
  fs.writeFileSync(path.join(KEY_DIR, 'ewb-plan.json'), JSON.stringify(ewbPlan));
  key.ewb = { noMovement: 'G07 purchases from its four shell suppliers (80%) and G23 from its shell (90%) have no e-way bill: the goods never moved (B-03).', suppressed: 'G07 4%, G09 5%, G08 2%, G24 2% of bills move goods to unregistered buyers with no invoice in GSTR-1 (G-05).', vehicleClash: 'G07: 6, G23: 3 impossible journeys.', shipTo: `${Object.keys(ewbPlan.shipTo).length} G11B -> G11A invoices delivered in Gujarat; five of FY 2025-26 charged CGST + SGST instead of IGST (D-05).`, exempt: 'G06 deals in gold and jewellery: no e-way bills at all, and none are expected.' };
  fs.writeFileSync(path.join(KEY_DIR, 'answer-key.json'), JSON.stringify(key, null, 1));
};

// Merge the LTU rows into the stored registers (master, targets, eiu), replacing any earlier LTU rows.
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

// ------------------------------------------------------------------ command line
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = new Set(process.argv.slice(2));
  const have = fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8') === VERSION && expectedFiles().every((f) => fs.existsSync(path.join(DATA, f)));
  if (args.has('--if-missing') && have) {
    console.log(`Large-taxpayer workbooks (${VERSION}) already present: ${expectedFiles().length} files.`);
  } else {
    const t0 = Date.now();
    const written = await generate({ registers: args.has('--registers') });
    console.log(`Wrote ${written.length} large-taxpayer workbooks (${GROUPS.length} groups, ${ALL.length} registrations) to ${path.relative(ROOT, DATA)} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
}
