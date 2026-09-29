// The 20-minute Commissioner demonstration (InQAI master execution document, section 6), as a scripted path through
// the console. Each step opens a screen, points at one thing, and gives the presenter what to say. The figures quoted
// are those of the synthetic ward SYN-PUNE-01 as generated (seed 2718); they are not real departmental outcomes.

export const WARD = {
  jurisdiction: 'SYN-PUNE-01',
  talegaon: '27ZZTCT7707R1Z1', // E07: cash down, credit from a pass-through network
  hinjewadi: '27ZZHCH4404N1Z9', // E04: decline explained by a rate cut
  signal: 'EIU-2025-0107', // the EIU signal on Talegaon
};

export const CHAPTERS = [
  { key: 'problem', title: 'The problem', from: 0, to: 2 },
  { key: 'k1', title: 'Killer 1: why revenue dropped', from: 2, to: 7 },
  { key: 'k2', title: 'Killer 2: counterparty deep dive', from: 7, to: 12 },
  { key: 'k3', title: 'Killer 3: EIU signal to outcome', from: 12, to: 16 },
  { key: 'challenge', title: 'Officer challenge', from: 16, to: 18 },
  { key: 'rollup', title: 'Roll-up: action yield and trajectory', from: 18, to: 20 },
];

/** Steps: view / id / tab open a screen; target is the element to point at; say is what to tell the room. */
export const DEMO_STEPS = [
  { chapter: 'problem', view: 'revenue', title: 'Detect and report is not enough',
    say: ['Existing GST systems detect and report. This console explains why revenue moved, tests what reconciles, traces the counterparties behind it and measures what departmental action yields.',
      'Everything on screen is ward SYN-PUNE-01: 16 taxpayers, three years of returns, with the stories planted on purpose. None of it is a real departmental outcome.'] },
  { chapter: 'problem', view: 'revenue', target: '[data-tour="rev-contributors"]', title: 'Who moved the collection',
    say: ['Each bar is one taxpayer’s change in tax paid in cash, and together they add up to the jurisdiction’s change.', 'The largest fall is Talegaon Infra, about ₹2.1 Cr. Let us ask why.'] },

  { chapter: 'k1', view: 'taxpayer', id: WARD.talegaon, tab: 'revenue', target: '.revenue .verdict', requires: WARD.talegaon, title: '₹3.44 Cr became ₹1.34 Cr',
    say: ['Cash paid fell 61% while turnover and output tax were flat.', 'The verdict is Examine: most of the fall is not explained by anything legitimate in the returns.'] },
  { chapter: 'k1', view: 'taxpayer', id: WARD.talegaon, tab: 'revenue', target: '[data-tour="waterfall"]', requires: WARD.talegaon, title: 'Every rupee accounted for',
    say: ['Last year’s cash to this year’s, driver by driver; the drivers reconcile to the rupee.', 'Sales added about ₹7 L. Credit used instead of cash took ₹2.17 Cr, and it is unresolved (red).'] },
  { chapter: 'k1', view: 'taxpayer', id: WARD.talegaon, tab: 'revenue', target: '[data-tour="drivers"]', requires: WARD.talegaon, title: 'Down to the source',
    say: ['Open "Credit (ITC) used instead of cash": the formula, its inputs, and the suppliers behind it.', 'Vista Trading is new (₹0 to ₹1.64 Cr of credit); Swift Trade Links grew. 62% of the rise comes from new suppliers.'] },
  { chapter: 'k1', view: 'taxpayer', id: WARD.hinjewadi, tab: 'revenue', target: '.revenue .verdict', requires: WARD.hinjewadi, title: 'It can also de-escalate',
    say: ['Hinjewadi Foods also paid less, about ₹34 L.', 'But a rate cut on two HSN codes explains it (−₹1.16 Cr of tax), from September onwards. Explained, so no notice is needed: intelligence must be able to stand a concern down.'] },

  { chapter: 'k2', view: 'taxpayer', id: WARD.talegaon, tab: 'network', target: '[data-tour="counterparties"]', requires: WARD.talegaon, title: 'Material counterparties',
    say: ['Talegaon’s material buyers and suppliers, ordered by evidence state.', 'Vista and Swift require verification; established suppliers are consistent or simply not visible enough.'] },
  { chapter: 'k2', view: 'taxpayer', id: WARD.talegaon, tab: 'network', target: '.matrix', requires: WARD.talegaon, title: 'Evidence, not a verdict',
    say: ['For Vista: what supports the relationship, what contradicts it, what is missing, and the questions to ask.', 'It never says "fake". It says what the returns show and what the officer still needs: e-way bills, bank trail, stock records.'] },
  { chapter: 'k2', view: 'taxpayer', id: WARD.talegaon, tab: 'network', target: '[data-tour="paths"]', requires: WARD.talegaon, title: 'Several levels deep',
    say: ['Suppliers of suppliers, pruned to material links, with the pruned ones counted.', 'Talegaon ← Vista ← Shree Balaji, and Talegaon ← Swift ← Shree Balaji ← Omkar, which sells back to Swift: a loop.'] },
  { chapter: 'k2', view: 'network', target: '[data-tour="funnel"]', title: 'From all trade to what matters',
    say: ['About ₹749 Cr of trade touches the ward; about ₹57 Cr sits on anomalous relationships; ₹12.3 Cr is the unresolved exposure.', 'Each relationship is counted once: a buyer’s credit and its supplier’s unpaid tax on the same invoices are not added twice.'] },
  { chapter: 'k2', view: 'network', target: '.anomaly-list', title: 'Each anomaly shows its path',
    say: ['Circular trade Omkar → Shree Balaji → Swift → Omkar; pass-through at Swift and Vista (goods leave in 2 days at about 1% over cost, against 16 days and 39% typical); Shree Balaji invoicing without GSTR-3B from October.', 'Every one names the exact path, the value, the window and the baseline it is compared with.'] },

  { chapter: 'k3', view: 'eiu', target: '[data-tour="eiu-ledger"]', title: 'EIU signals, revalidated',
    say: ['Seven EIU signals, kept exactly as received (file hash shown), each recomputed on the latest returns.', 'Four are now resolved or explained; two have grown. The ledger keeps reconciled, unresolved and untestable amounts apart.'] },
  { chapter: 'k3', view: 'eiu', id: WARD.signal, target: '.eiu-bench .verdict', title: 'The signal on Talegaon',
    say: ['Signalled ₹1.66 Cr in November 2025; on the latest returns ₹3.02 Cr is open: increased.', 'The components are the credit from Swift and from Vista.'] },
  { chapter: 'k3', view: 'eiu', id: WARD.signal, target: '[data-tour="eiu-claims"]', title: 'The CA’s reply, claim by claim',
    say: ['The CA’s letter (PDF) is read, kept as received with its hash, and split into claims tested against the returns. If none is recorded yet, attach test-data/ward/replies/EIU-2025-0107.pdf in "Record a reply".', '"All suppliers filed GSTR-3B": partly supported. True, but filing is not the issue, both are pass-throughs. E-way bills and bank payments cannot be tested from returns, so they are listed as missing proof.'] },
  { chapter: 'k3', view: 'recovery', target: '[data-tour="recovery-list"]', title: 'And where outcomes stand',
    say: ['Established demands, split into recoverable now, not yet (appeal), and settled, ranked by a published rule.', 'Top: Shree Balaji, ₹1.38 Cr recoverable but the proprietor is untraceable and the registration suspended. Then Deccan’s instalments, stalled since August 2025. Nothing is started automatically.'] },

  { chapter: 'challenge', view: 'eiu', id: WARD.signal, target: '[data-tour="eiu-challenge"]', title: 'Challenge it live',
    say: ['Tick Exclude on the credit from Vista, as if its deliveries were verified on site.', 'The result recalculates at once, Increased to Reduced, and the excluded amount stays visible. "What would change the conclusion" lists each such lever. Discard, or save with a reason for the case history.'] },
  { chapter: 'challenge', view: 'taxpayer', id: WARD.talegaon, tab: 'revenue', target: '[data-tour="hypotheses"]', requires: WARD.talegaon, title: 'Alternative explanations',
    say: ['Before escalating, the usual legitimate causes are tested: rate change, branch shift, lost customer, credit notes, seasonality, genuine decline.', 'Here they are ruled out, with the evidence against each; what remains is the concern about credit replacing cash.'] },

  { chapter: 'rollup', view: 'actions', id: 'yield', target: '[data-tour="yield"]', title: 'Action yield',
    say: ['For each cohort of cases: selected, still unresolved, established (orders and voluntary payments) and realised, with every numerator and denominator shown.', 'Risky-network cases: about ₹6.7 Cr established, nothing realised yet (all under appeal). Non-filing cases convert best. Demands and exposure never become "revenue" until paid.'] },
  { chapter: 'rollup', view: 'collections', target: '[data-tour="trajectory"]', title: 'Where the year is heading',
    say: ['A forecast made at the end of September, with its range and the target.', 'The dotted line is what then happened: 12% below, and the page names why (Shree Balaji stopped filing, the rate cut). Move the slider to December and the forecast picks both up. The year closed ₹4.17 Cr short of target.'] },
  { chapter: 'rollup', view: 'overview', id: 'commissioner', target: '[data-tour="role-bar"]', title: 'One evidence base, every role',
    say: ['The same numbers arranged for a field officer (who needs attention and why), a supervisor (gap, exposure, bottlenecks) and the Commissioner (trajectory, yield, recovery, learning).',
      'The question we set out to answer: can it tell a raw signal from an evidence-supported case, trace the network behind it, cut avoidable manual work, and measure what action achieves? That is what you have just seen.'] },
];
