/**
 * Every heavy word on this platform, said plainly.
 *
 * The department's vocabulary is not optional - a notice cites "section 74A",
 * not "the rule about deliberate under-declaration". But a screen that uses
 * only that vocabulary is readable by the people who already know it, which is
 * the smaller half of the room. So both appear: the term stays, and an ⓘ
 * beside it says what it means in ordinary words.
 *
 * `short` is the tooltip: one sentence, no jargon inside it.
 * `more` is the paragraph behind the ⓘ, and may say why the thing matters.
 * `also` lists the other terms worth reading next.
 *
 * Adding a term here is how a screen gets an explanation. Writing the
 * explanation inline in a component is how it gets out of date.
 */

export interface GlossaryEntry {
  /** How the term is written on screen. */
  readonly term: string
  /** One plain sentence. */
  readonly short: string
  /** The fuller answer, in ordinary language. */
  readonly more?: string
  /** Related terms, by key. */
  readonly also?: readonly string[]
}

export const GLOSSARY = {
  // ---------------------------------------------------------------- scores
  pScore: {
    term: 'P-Score',
    short: 'A 0-to-1 score answering one question: how much does this business need a closer look?',
    more:
      'It is built from the 34 risk flags the department set out. Each flag is scored 0 to 4 - ' +
      '0 means tested and clear, 4 means seriously adverse - and the P-Score is the weighted ' +
      'average of the flags that could actually be tested. It is a sorting tool, not evidence: ' +
      'a high P-Score says "look here first", never "this business owes money".',
    also: ['fScore', 'flag', 'coverage'],
  },
  fScore: {
    term: 'F-Score',
    short: 'What the returns actually show is wrong, and how much money is behind it.',
    more:
      'Where the P-Score asks who to look at, the F-Score asks what can be demanded. It comes ' +
      'from the 57 detection rules, each of which compares one figure with another and reports ' +
      'a difference in rupees, head by head, with the source rows attached. An F-Score finding ' +
      'can go into a notice. A P-Score cannot.',
    also: ['pScore', 'finding'],
  },
  twoScores: {
    term: 'Two scores, never added together',
    short: 'One says who to audit. The other says what can be demanded. They answer different questions.',
    more:
      'Adding them would produce a single number that means neither thing. A business can score ' +
      'high on risk and owe nothing; another can owe a great deal through a clerical error and ' +
      'be no risk at all. The two are always shown side by side and never combined.',
    also: ['pScore', 'fScore'],
  },
  flag: {
    term: 'Flag 0–4',
    short: 'How adverse one risk test came out: 0 is clear, 4 is seriously adverse.',
    more:
      'The department’s circular sets out flags 1 to 4, rising with risk. This platform adds ' +
      '0 for "tested, nothing adverse found", because a screen has to distinguish that from ' +
      '"not tested at all", which is shown separately as not evaluated.',
    also: ['notEvaluated', 'pScore'],
  },
  coverage: {
    term: 'Coverage',
    short: 'How many of the 34 risk flags could actually be tested for this business.',
    more:
      'Ten of the 34 need data the State does not yet receive - customs, income tax, refunds, ' +
      'central analytics. Those are left out of the score entirely rather than counted as clear, ' +
      'so the score stays honest and the coverage figure falls instead. A P-Score of 0.7 over 3 ' +
      'flags and a P-Score of 0.7 over 30 are not the same claim, so coverage is printed beside ' +
      'the score every time.',
    also: ['notEvaluated', 'pScore'],
  },

  // ------------------------------------------------------------- evidence
  notEvaluated: {
    term: 'Not evaluated',
    short: 'The test could not be run, and the screen says which data was missing.',
    more:
      'This is not the same as "no problem found". A rule that cannot run reports what it needed ' +
      '- a GSTR-3B for July, the customs feed, a peer group big enough to compare against - and ' +
      'is left out of the score on both sides. Treating an untested flag as clear is the quiet ' +
      'failure that turns a risk score into a fiction.',
    also: ['coverage', 'flag'],
  },
  provenance: {
    term: 'Provenance',
    short: 'Every figure can be traced back to the exact cell of the spreadsheet it came from.',
    more:
      'Click any number and the drawer opens: the rule that produced it, the formula as it was ' +
      'actually executed, each intermediate step, and the source rows. The chain ends at the ' +
      'uploaded workbook, which can be opened on screen. A figure that cannot do this is treated ' +
      'as a bug, not as a number.',
    also: ['calcId', 'drill'],
  },
  calcId: {
    term: 'calc_id',
    short: 'The receipt number for one calculation. Same inputs, same receipt, forever.',
    more:
      'It is a fingerprint of the rule, the data snapshot and the inputs. It is not random and ' +
      'it does not involve the clock, so re-running the same data next year produces the same ' +
      'calc_id - which is what makes a figure in a notice defensible two years later.',
    also: ['provenance'],
  },
  drill: {
    term: 'Drill',
    short: 'Click a bar or a total to see the individual businesses it was added up from.',
    also: ['provenance'],
  },
  finding: {
    term: 'Finding',
    short: 'One rule, applied to one business for one period, with the money it found.',
    more:
      'A finding carries its severity, how confident the platform is in it, the tax split head ' +
      'by head, and the rows behind it. Findings are what a case and then a demand are built ' +
      'from.',
    also: ['fScore', 'confidence'],
  },
  confidence: {
    term: 'Confidence',
    short: 'How likely this finding is to survive the business’s reply.',
    more:
      'A figure that is arithmetic on the returns is near-certain. One that depends on an ' +
      'assumption about intent is not. Advisory findings - worth mentioning, not worth ' +
      'demanding - are excluded from the headline money figure and the screen says so.',
    also: ['finding'],
  },
  headWise: {
    term: 'Head-wise',
    short: 'Tax kept split into IGST, CGST, SGST and Cess - never added into one number.',
    more:
      'They go to different governments and are demanded under different columns of the notice. ' +
      'A single total would have to be split again later, and the split would be guessed. The ' +
      'platform makes adding them together structurally impossible.',
  },

  // ---------------------------------------------------------------- data
  gstin: {
    term: 'GSTIN',
    short: 'The 15-character registration number that identifies a business under GST.',
    more:
      'The first two digits are the State, the next ten the PAN. The last character is a check ' +
      'digit, so a mistyped GSTIN can be caught before it reaches a notice.',
  },
  gstr1: {
    term: 'GSTR-1',
    short: 'The monthly return of sales, invoice by invoice.',
    also: ['gstr3b', 'gstr2b'],
  },
  gstr3b: {
    term: 'GSTR-3B',
    short: 'The monthly summary return: what was sold, what credit was claimed, what tax was paid.',
    more:
      'It is a summary, so it is one row per line of the return rather than one row per invoice. ' +
      'Twenty-one of the 57 rules need it - without a GSTR-3B most of the platform cannot say ' +
      'anything at all.',
    also: ['gstr1', 'itc'],
  },
  gstr2b: {
    term: 'GSTR-2B',
    short: 'What the suppliers said they sold to this business - the credit it is entitled to.',
    also: ['itc', 'gstr3b'],
  },
  itc: {
    term: 'Input tax credit (ITC)',
    short: 'Tax already paid on purchases, set off against tax owed on sales.',
    more:
      'Credit is money. A claim for credit on an invoice that does not exist is the single ' +
      'largest category of GST fraud, which is why several of the 34 flags test the claimed ' +
      'credit against what the suppliers themselves declared.',
    also: ['gstr2b'],
  },
  rcm: {
    term: 'Reverse charge',
    short: 'Cases where the buyer pays the tax instead of the seller.',
    more:
      'Imported services and some notified supplies work this way. The buyer pays the tax and ' +
      'claims it back as credit in the same breath - so claiming the credit without having paid ' +
      'the tax is a thing worth testing for.',
    also: ['itc'],
  },
  zeroRated: {
    term: 'Zero-rated',
    short: 'Exports and supplies to an SEZ: no tax charged, and credit still allowed.',
    more:
      'Exempt supplies are different - no tax, and no credit either. The distinction matters ' +
      'because a zero-rated claim usually comes with a refund attached, so the goods have to ' +
      'have actually left.',
    also: ['exempt'],
  },
  exempt: {
    term: 'Exempt supply',
    short: 'Goods or services on which no GST is charged, and no credit may be claimed.',
    also: ['zeroRated'],
  },
  snapshot: {
    term: 'Snapshot',
    short: 'One batch of uploaded returns, frozen as at the moment it was read.',
    more:
      'Every result names the snapshot it was computed from, so a figure can be reproduced from ' +
      'exactly the data that produced it, even after more returns have been loaded.',
  },
  engineRun: {
    term: 'Engine run',
    short: 'One pass of all 34 risk flags and 57 rules over a snapshot.',
    more:
      'A run records the date it evaluated as at, the version of the rules, and the version of ' +
      'the thresholds. Change any of those and you get a different run, not an edited one.',
    also: ['snapshot'],
  },
  held: {
    term: 'Held row',
    short: 'A row the platform could not read with confidence, kept aside with the reason.',
    more:
      'Held is not deleted. Every uploaded row lands in exactly one of three places - read, ' +
      'held, or duplicate - and the three are added up on screen against the number of rows in ' +
      'the file. If they do not balance, nothing is saved at all.',
    also: ['reconciles'],
  },
  reconciles: {
    term: 'Rows balance',
    short: 'Rows in the file = rows read + rows held + duplicates. Shown before anything is saved.',
    more:
      'A row that is neither read nor accounted for becomes a wrong figure in a notice six ' +
      'screens later. So the arithmetic is done in front of the officer, and a file that does ' +
      'not balance is refused.',
    also: ['held'],
  },

  // -------------------------------------------------------------- process
  asmt10: {
    term: 'ASMT-10',
    short: 'A scrutiny notice: "we found a discrepancy, please explain".',
    more: 'It asks for an explanation. It does not yet demand money.',
    also: ['drc01a'],
  },
  drc01a: {
    term: 'DRC-01A',
    short: 'An intimation before a formal demand - the chance to pay or explain first.',
    also: ['asmt10', 'section74a'],
  },
  section74a: {
    term: 'Section 74A',
    short: 'The provision used to demand tax that was not paid, from the 2024-25 year onwards.',
    more:
      'It replaced the older split between section 73 (an honest mistake) and section 74 ' +
      '(deliberate). The time limits and the penalty still depend on which of those it was.',
  },
  din: {
    term: 'DIN',
    short: 'The document identification number every notice must carry to be valid.',
    more:
      'It is minted when the notice is approved, never before. A notice without one can be ' +
      'disowned by the department and ignored by the business.',
  },
  limitation: {
    term: 'Limitation',
    short: 'The legal deadline after which a demand can no longer be raised.',
    more:
      'Once it passes, the money is gone whatever the evidence shows. The platform counts down ' +
      'to it on every case and puts the ones running out first.',
  },
  auditChain: {
    term: 'Audit chain',
    short: 'A tamper-evident log: every entry carries the fingerprint of the one before it.',
    more:
      'Change or remove any entry and every later fingerprint stops matching. It records who ' +
      'looked at what and who approved what - including, deliberately, the things nobody enjoys ' +
      'recording.',
  },
  threshold: {
    term: 'Threshold',
    short: 'A number a rule compares against - a percentage, a limit, a number of days.',
    more:
      'Each one is either provisional (a working value nobody has signed), departmental (the ' +
      'department adopted it, and the register names who and when), or notified (a notification ' +
      'backs it, so a notice can quote it). The three are never blurred.',
    also: ['provisional'],
  },
  provisional: {
    term: 'Provisional',
    short: 'A working value the platform shipped with. Correct arithmetic on an unsigned number.',
    more:
      'Findings computed from a provisional threshold are perfectly good arithmetic - but the ' +
      'number they compare against is one nobody has adopted. Adopting them changes nothing ' +
      'about the figures and everything about who owns them.',
    also: ['threshold'],
  },
  peerGroup: {
    term: 'Peer group',
    short: 'Businesses of similar size, trade and location, used as the comparison.',
    more:
      'Several flags have no fixed threshold - "a high share of exempt sales" only means ' +
      'anything relative to similar businesses. If the group is too small to compare against, ' +
      'the flag reports not evaluated rather than inventing a number.',
    also: ['notEvaluated'],
  },
} as const satisfies Record<string, GlossaryEntry>

export type GlossaryKey = keyof typeof GLOSSARY

export function glossary(key: GlossaryKey): GlossaryEntry {
  return GLOSSARY[key]
}
