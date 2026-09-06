/* ---------------------------------------------------------------------------
 * PROJECT RESOURCES
 *
 * Everything this platform is built on, in one place: the law it encodes, the
 * published figures it cites, the statistical methods it applies, the software
 * it runs on, and — stated as plainly as the rest — what is simulated.
 *
 * A platform that asks a Commissioner to act on its figures should be able to
 * show where every one of them comes from. This is that page.
 * ------------------------------------------------------------------------- */

import { STATUTORY_SOURCES } from './statutory.js'
import { OFFICIAL_FIGURES, DATASET_POINTERS, OFFICIAL_RETRIEVED_ON } from './official.js'
import { AUTHORITIES } from './precedent.js'

export const CATEGORIES = {
  legal: { id: 'legal', label: 'Statute & subordinate legislation', note: 'Encoded as computation, not summarised. The limitation engine computes from these rather than from a model.' },
  judicial: { id: 'judicial', label: 'Judicial authority', note: 'Verified against published reports. Where only a holding could be confirmed, the case name is left blank rather than invented.' },
  official: { id: 'official', label: 'Official published data', note: 'Real figures from government sources, kept strictly separate from the simulated operational records.' },
  method: { id: 'method', label: 'Statistical & algorithmic methods', note: 'Each chosen for a stated reason, and each with a known failure mode that is named on the screen that uses it.' },
  software: { id: 'software', label: 'Software', note: 'Runs entirely within the department’s own infrastructure. No call is made to the open internet for figures, models or maps.' }
}

/* --- Law, drawn from the statutory engine so the two cannot diverge --- */
export const LEGAL_SOURCES = Object.entries(STATUTORY_SOURCES).map(([id, s]) => ({
  id, category: 'legal', name: s.label, detail: s.note, url: s.url, usedBy: 'Statutory Time Intelligence'
})).concat([
  {
    id: 'rule99',
    category: 'legal',
    name: 'Rule 99, CGST Rules',
    detail: 'Scrutiny of returns. Prescribes the 30-day period for a reply in FORM GST ASMT-11 — the notice drafting originally stated 15 days and was corrected against this.',
    url: 'https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter11/rule99_v1.00.html',
    usedBy: 'Audit & Scrutiny Engine'
  },
  {
    id: 'fa2024',
    category: 'legal',
    name: 'Finance (No. 2) Act, 2024',
    detail: 'Inserted Section 74A, which applies from FY 2024-25 and removes the fraud / non-fraud split in limitation periods.',
    url: 'https://taxinformation.cbic.gov.in/',
    usedBy: 'Statutory Time Intelligence'
  }
])

/* --- Judicial authority, from the precedent engine --- */
export const JUDICIAL_SOURCES = AUTHORITIES.map(a => ({
  id: a.id,
  category: 'judicial',
  name: a.caseName || `${a.court} — case name not established`,
  detail: `${a.court}. ${a.holding}`,
  url: a.source,
  verified: a.verified,
  usedBy: 'Precedent Intelligence'
}))

/* --- Official published figures --- */
export const OFFICIAL_SOURCES = [
  {
    id: 'mahagst',
    category: 'official',
    name: 'Maharashtra GST Department — dealer statistics',
    detail: 'Registered dealer counts and departmental statistics. Provides the scale context against which the modelled population is stated.',
    url: 'https://mahagst.gov.in/',
    usedBy: 'Official Statistics'
  },
  {
    id: 'pib',
    category: 'official',
    name: 'Press Information Bureau — monthly GST collection releases',
    detail: 'National gross GST collection figures, published monthly.',
    url: 'https://pib.gov.in/',
    usedBy: 'Official Statistics'
  },
  {
    id: 'cbic',
    category: 'official',
    name: 'CBIC — GST tax information portal',
    detail: 'The authoritative text of the Act, Rules and notifications. Every statutory computation in this platform traces here.',
    url: 'https://taxinformation.cbic.gov.in/',
    usedBy: 'Statutory Time Intelligence, Audit & Scrutiny Engine'
  },
  {
    id: 'datagov',
    category: 'official',
    name: 'data.gov.in — GST datasets',
    detail: 'Dataset pointers are recorded with no values attached: the endpoints returned HTTP 403 when fetched, so nothing was inferred from them. Listing them without values is deliberate.',
    url: 'https://data.gov.in/',
    usedBy: 'Official Statistics'
  }
]

/* --- Methods, each with the reason it was chosen and how it fails --- */
export const METHODS = [
  {
    id: 'mad',
    category: 'method',
    name: 'Median absolute deviation, Iglewicz–Hoaglin modified z',
    detail: 'Peer-relative outlier detection at a threshold of 3.5.',
    why: 'Mean and standard deviation are dragged by the outliers being hunted — a handful of extreme entities inflate the spread until they no longer register. MAD does not have that failure.',
    failure: 'A zero MAD, where more than half a peer group share one value, makes the score undefined. Those cases are skipped rather than reported as infinite.',
    usedBy: 'Unknown Risk Discovery'
  },
  {
    id: 'cycle',
    category: 'method',
    name: 'Three-colour depth-first cycle detection',
    detail: 'Run once per node on the residual graph after removing it, to test whether circulation survives.',
    why: 'Centrality measures how important a node looks. It does not answer whether the chain keeps running without it, and on a chain with a bypass route those point at different entities.',
    failure: 'Only as good as the edges supplied. With cluster-level edges it cannot trace between GSTIN layers.',
    usedBy: 'Network Enforcement'
  },
  {
    id: 'jaccard',
    category: 'method',
    name: 'Jaccard index on triggered rule sets',
    detail: 'Overlap between the risk rules firing on two taxpayers.',
    why: 'Set overlap rather than count similarity — two taxpayers each firing three rules are not similar if the rules differ.',
    failure: 'Returns null where neither has rules, which is uninformative rather than a perfect match.',
    usedBy: 'Case Digital Twin'
  },
  {
    id: 'decay',
    category: 'method',
    name: 'Piecewise-linear recovery decay curve',
    detail: 'Interpolated between anchors at 0, 30, 90, 180, 365, 540 and 730 days.',
    why: 'A step function meant only band-crossers decayed, which made the ranking degenerate. Continuous interpolation fixed it.',
    failure: 'The anchors are a stated assumption, not an observed recovery rate. Turning it into a probability model needs observed recovery against demand.',
    usedBy: 'Revenue at Risk & Recovery, Counterfactual Case Intelligence'
  },
  {
    id: 'relaxation',
    category: 'method',
    name: 'Relaxed upper bound on generalised assignment',
    detail: 'Eligibility and integrality both relaxed to produce a bound the true optimum cannot exceed.',
    why: 'Generalised assignment is NP-hard. Rather than claim optimality, the greedy result is reported as a share of a bound that is unreachable by construction.',
    failure: 'The bound is loose. It brackets the optimum rather than locating it.',
    usedBy: 'Officer Capacity & Deployment'
  },
  {
    id: 'effect',
    category: 'method',
    name: 'Standardised mean difference (effect size)',
    detail: 'Separation between a positive class and the baseline, measured against the population spread.',
    why: 'Establishes whether a resemblance model is worth building before it is built. Below roughly 0.5 there is nothing to stand on.',
    failure: 'Small samples make any effect size unstable — which is itself part of the finding where the contrast class is two cases.',
    usedBy: 'Missed Revenue Discovery'
  },
  {
    id: 'strat',
    category: 'method',
    name: 'Stratified randomised trial design',
    detail: 'Strata on exposure decile crossed with risk band, with a rotating start arm per stratum.',
    why: 'Alternating on a global index sent every singleton stratum to the same arm, producing a 4x imbalance in the critical band.',
    failure: 'Needs a run long enough to conclude. Endpoints are pre-declared for that reason.',
    usedBy: 'Case Priority Engine'
  },
  {
    id: 'prng',
    category: 'method',
    name: 'mulberry32 seeded pseudo-random generator',
    detail: 'Every simulated record derives from a fixed seed.',
    why: 'The demonstration must be identical on every machine and every reload. A figure that moves between viewings cannot be discussed.',
    failure: 'Determinism is not realism. The distribution is a designed one, not an observed one.',
    usedBy: 'All simulated data'
  }
]

/* --- Software --- */
export const SOFTWARE = [
  { id: 'react', category: 'software', name: 'React', version: '18.3.1', role: 'User interface', licence: 'MIT' },
  { id: 'vite', category: 'software', name: 'Vite', version: '5.4.11', role: 'Build and development server', licence: 'MIT' },
  { id: 'tailwind', category: 'software', name: 'Tailwind CSS', version: '3.4.15', role: 'Styling, driven by CSS variables so themes switch without duplicate rules', licence: 'MIT' },
  { id: 'recharts', category: 'software', name: 'Recharts', version: '2.13.3', role: 'Charting', licence: 'MIT' },
  { id: 'lucide', category: 'software', name: 'lucide-react', version: '0.462.0', role: 'Icons', licence: 'ISC' },
  { id: 'postcss', category: 'software', name: 'PostCSS + Autoprefixer', version: '8.4.49 / 10.4.20', role: 'CSS processing', licence: 'MIT' }
]

export const SIMULATION_DECLARATION = {
  simulated: [
    'Every taxpayer, GSTIN, trade name, address and contact detail',
    'All returns, payments, ITC claims, refunds and e-way bill records',
    'All notices, audit cases, litigation cases and compliance alerts',
    'The officer establishment and every assignment',
    'All network clusters and their edges'
  ],
  real: [
    'Sections 73, 74 and 74A of the CGST/MGST Act, and Rule 99',
    'Notifications 09/2023-CT and 56/2023-CT, and their contested status',
    'The four judicial authorities on Section 168A, including SLP (C) 4240/2025',
    'Published collection and dealer figures from PIB and mahagst.gov.in'
  ],
  note: 'The division is absolute and stated on every screen that shows a figure. No simulated record is presented as an observation, and no real figure is mixed into a simulated aggregate. The scale ratio is roughly 1:6,484 — 156 modelled taxpayers against 10,11,501 registered SGST dealers — so no total on this platform should be read as a statewide figure.',
  retrievedOn: OFFICIAL_RETRIEVED_ON
}

export const RESOURCE_SUMMARY = {
  legal: LEGAL_SOURCES.length,
  judicial: JUDICIAL_SOURCES.length,
  official: OFFICIAL_SOURCES.length,
  methods: METHODS.length,
  software: SOFTWARE.length,
  datasetPointers: DATASET_POINTERS.length,
  total: LEGAL_SOURCES.length + JUDICIAL_SOURCES.length + OFFICIAL_SOURCES.length + METHODS.length + SOFTWARE.length
}

export const OFFICIAL_FIGURE_LIST = OFFICIAL_FIGURES
export const DATASET_POINTER_LIST = DATASET_POINTERS
