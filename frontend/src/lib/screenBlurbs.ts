/**
 * One line per screen — what an officer actually finds there.
 *
 * Ported in shape from maha-gst-intelligance's `MODULE_DESCRIPTIONS`, and the
 * rule it was written under is worth keeping: a blurb states what the screen
 * shows, never a restatement of its own name. "Jurisdictions — shows
 * jurisdictions" teaches a reader nothing and costs them a click to find out.
 *
 * These are copy, not data. Nothing here is computed and nothing here is a
 * figure; the screens themselves carry the numbers, each with its provenance.
 */
export const SCREEN_BLURB: Readonly<Record<string, string>> = {
  // Dashboard — the whole State.
  D1: 'The portfolio on one screen: how much was filed, how much is at risk, and what moved since the last run.',
  D2: 'Who filed, who filed late and who has not filed at all, by period and by division.',
  D3: 'Declared liability against what the rules say was due, head by head, never summed into one figure.',
  D4: 'The risk bands across the portfolio, with the number of taxpayers in each and the coverage behind the score.',
  D5: 'All 34 risk parameters, how often each fired, and which could not run for want of a dataset.',
  D6: 'Findings through to cases, notices and recovery — where work enters the funnel and where it stops.',
  D7: 'Every division ranked on revenue at risk rather than on a mean score, because the two do not compare.',
  D8: 'Officer capacity and case mix. Deliberately not a league table, and deliberately not sortable into one.',
  D9: 'Compliance patterns by sector, with any cohort too small to band marked as unusable rather than banded anyway.',

  // Casework — one taxpayer at a time.
  W1: 'What is in front of you today, ordered by what stops being recoverable first.',
  W8: 'Every filed return, with its P-Score and F-Score side by side and a disposition you can set.',
  W9: 'Six descriptive views of one taxpayer’s year — purchases, rates, credit notes. Not findings, and the screen says so.',
  W2: 'Build an audit plan from the findings, with the selection criteria recorded rather than remembered.',
  W3: 'The taxpayer register, filtered and sorted in the database rather than in the browser.',
  W4: 'One taxpayer assembled whole: registration, returns, findings, cases and every figure’s source.',
  W5: 'Open cases sorted by how little time is left, not by how much money is in them.',
  W6: 'What has been drafted, approved and served, and which figures in each form are locked to a finding.',
  W7: 'A read-only assistant over results the engine already computed. It performs no arithmetic and can issue nothing.',

  // Setup and reference.
  S0: 'How the platform works, step by step, and exactly what a file has to contain to be read.',
  S1: 'Upload returns. Rows in must equal rows read plus rows held plus duplicates, and it says so on screen.',
  S2: 'All 57 detection rules with the statute behind each, its formula and the datasets it needs.',
  S5: 'The department’s 34-flag circular against what the platform actually runs, flag by flag.',
  S3: 'Every threshold, rate and day-count the rules use, versioned by the date it took effect.',
  S4: 'What is built, what is next, and which parameters each step unlocks.',
}
