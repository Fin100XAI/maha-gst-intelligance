# 08 — The demo flow, and the two sections

The platform has twenty-eight routed screens across three surfaces. An officer
being shown it for the first time does not need twenty-eight screens; they need
to believe two things in ten minutes:

1. **The numbers are real** - they came from a spreadsheet the taxpayer filed,
   and you can get from a figure on screen to the cell it came from.
2. **The platform knows what it does not know** - it says so, by name, instead
   of showing a clean pass.

Everything below serves those two beliefs. Screens that do not are cut.

---

## 1. Two sections, and nothing else in the rail

```
SETUP & REFERENCE                      SCRUTINY
──────────────────                     ────────
Data          upload · what was read   Portfolio   who needs attention
Reference     thresholds · checks      Taxpayer    what is wrong here
                                       Report      show me the working
```

Five screens. The current twenty-eight collapse as follows:

| Today | Becomes |
|---|---|
| Ingestion, Alignment, SheetViewer | **Data** (one screen, three tabs) |
| Library, Admin, ThresholdRegister, Guide | **Reference** (one screen, three tabs) |
| Overview, Risk, Revenue, Funnel, Jurisdictions, Officers, Sectors, Filing | **Portfolio** (one screen; the eight become chart panels) |
| TaxpayerFile, Filings, FilingDetail, Insights, Worklist, Registry, Planner | **Taxpayer** (one screen, driven by a GSTIN) |
| Reconciliation, ParameterExplorer, Drill | **Report** (one screen per report, reached from a finding) |
| Cases, Notices | **Action** panel inside Taxpayer, not its own screen |
| Copilot | removed from the rail; it is a drawer |

**The rail holds two words.** `Setup` and `Scrutiny`. Everything else is
reached by clicking a number, never by navigating.

---

## 2. The one path, walked forwards

An officer only ever moves in one direction. There is no menu diving.

```
  PORTFOLIO                TAXPAYER                 REPORT              ACTION
  ─────────                ────────                 ──────              ──────
  Which of my      →   What is wrong with   →   Show me the     →   Issue the
  taxpayers need       this one, biggest        working and         notice
  looking at?          rupee first              the source rows

  click a bubble       click a finding          click a figure      click Draft
```

Back is always the browser back button. Each step adds context and never
replaces it: the GSTIN stays in the header from step 2 onward, the finding id
from step 3.

**The ninety-second test.** From the largest bubble on Portfolio to a cell in
the taxpayer's own spreadsheet: four clicks. If that path breaks, it is fixed
before anything else ships.

---

## 3. Screen by screen

### 3.1 Data (Setup)

*"What did the platform read, and what did it refuse?"*

One upload control, then the row ledger as a sentence, not a table:

> **12,449 rows in = 11,777 read + 593 held + 79 duplicates.** They reconcile.

Below it, three tabs:

* **Held rows** - every quarantined row with the reason in words ("the
  acknowledgement is dated before the invoice it acknowledges"), and the source
  cells beside it. This is the screen that wins trust: a platform that shows
  you what it threw away is a platform you can argue with.
* **Corrections** - what was changed and why. The date-transposition report
  lives here: *"1,832 cells in six sheets had their day and month swapped by
  the spreadsheet. Corrected. Without this, 250 notices would have been issued
  for late e-invoice reporting that never happened."*
* **Sheets** - the workbook rendered as a grid, header row tinted, held rows
  flagged.

**Chart:** one horizontal stacked bar - read / held / duplicate. It drills to
the held-rows tab.

### 3.2 Reference (Setup)

*"Where do the numbers in the rules come from?"*

Three tabs, all read-only in the demo:

* **Thresholds** - every figure the engine uses, with its notification, the
  date it took effect, and who adopted it. An officer asking *"why 30 days?"*
  gets an answer with a citation.
* **Checks** - the catalogue. Each check shows its legal basis, its tier, and
  what it needs to run.
* **Coverage** - which checks can run on the data uploaded, and which cannot,
  and what sheet each dark one is waiting for.

**Chart:** a donut of checks by state - runs / needs a document / dark - with
the dark slice drilling to the list of missing sheets.

### 3.3 Portfolio (Scrutiny)

*"Who needs attention?"*

The screen opens with **one sentence and one picture**.

> **Nine taxpayers scanned. Rs 4.2 crore of exposure found on three of them.**
> Two are within their reversal deadline; one closes in 38 days.

Then a single bubble chart: **audit risk across, money at stake up, bubble
size = turnover, colour = deadline urgency.** An officer reads it in three
seconds: top-right and red means look now.

Below it, three small panels, each one chart, each drilling:

| Panel | Chart | Question it answers |
|---|---|---|
| Where the money is | treemap by finding family | Is this an ITC problem or an outward problem? |
| When it closes | timeline of deadlines | What expires first? |
| What we could not check | stacked bar by missing dataset | What should we ask for? |

**Nothing on this screen is a table.** Tables are for step 2.

### 3.4 Taxpayer (Scrutiny)

*"What is wrong with this one?"*

Header: trade name, GSTIN, and the two scores side by side with their coverage,
each with a one-line explanation in plain words:

> **Audit risk 62 / 100** — computed from 4 of 34 parameters. 30 need data we
> do not have yet.
> **Findings Rs 3.41 crore** — what we can demand, and the evidence for it.

Then **the scorecard grid**: 12 periods across, check families down, one cell
per intersection, four colours with an icon and a label each - pass, fail,
needs a document, could not check. This is the single most useful object on the
platform: an officer sees a whole year of a taxpayer's compliance in one glance
and clicks the red cell.

Below it, findings ranked by rupee, each as a sentence a non-accountant reads:

> **Rs 98.5 lakh** — Credit claimed from 29 suppliers who never paid the tax
> over to the government. Rule 37A. *Certain.* → **Show the working**

**Charts:** the scorecard grid (heatmap), a waterfall of what makes up the
findings total, and a 12-month line of declared vs claimed.

### 3.5 Report (Scrutiny)

*"Show me the working."*

One screen per report. Every one has the same three bands:

1. **The answer**, in one sentence with the figure.
2. **The comparison**, as one chart - always one y-axis, always drillable.
3. **The rows**, as a table you can export to Excel, because officers live in
   Excel and will not adopt a tool that cannot hand a working file back.

Reports in the demo, in the order they will be shown:

| Report | Chart | Data it needs |
|---|---|---|
| GSTR-3B vs GSTR-1 | grouped bar per period, one y-axis | both, ingested |
| GSTR-3B vs GSTR-2B ITC | grouped bar per period | both, ingested |
| Supplier return filing status | stacked bar by supplier, sorted by exposure | GSTR-2A, ingested |
| GSTR-2A supplier-wise | horizontal bar, top 20 by value | ingested |
| GSTR-1 customer-wise | horizontal bar, top 20 by value | ingested |
| Rate-wise purchase and sales | side-by-side bars by rate | ingested |
| Filing status and lateness | calendar heatmap | filing dates, ingested |

Reports that are asked for and **cannot** be built honestly yet get a real
routed screen, a status chip, the sheet they are waiting for, and a `501` from
the API - never a fabricated number:

* Single-click e-Invoice and e-Waybill download - needs the e-invoice register
* PAN-based reports - needs the PAN-to-GSTIN map
* Cost Audit Report - needs the cost records
* ICEGATE report - needs the customs feed
* Interest and late fee calculator - the case engine has the arithmetic; the
  screen is not wired yet

---

## 4. Making it readable by someone who is not in finance

Six rules, applied everywhere:

1. **Every figure carries its sentence.** Not `IGST 98,47,287.78` but
   *"Rs 98.5 lakh of credit was claimed from suppliers who never paid the tax."*
   The head-wise split is one click away, never the first thing shown.
2. **Rupees in Indian format, always.** `Rs 1,90,71,332.80`, lakh and crore in
   prose.
3. **Colour never carries meaning alone.** Every status ships an icon and a
   word. A red cell says `FAIL`, not just red.
4. **One y-axis. Ever.** A dual-axis chart is a way to make two unrelated
   numbers look correlated.
5. **"We could not check" is a first-class answer** and looks different from
   "we checked and it was fine". Grey with a dashed border, and the sentence
   says which sheet would answer it.
6. **No acronym without a hover.** ITC, 2B, DRC-01A, Rule 37A each expand on
   hover to one plain sentence.

---

## 5. The demo, step by step

Twelve minutes. The taxpayer is **SSR Marine Services Pvt Ltd,
`27AAPCS8928R1Z1`** - a real filed workbook, already in the database, and the
one `docs/06` and `docs/07` dissect. Nothing is seeded, nothing is faked.

| # | Time | Screen | What you do | What they should say |
|---|---|---|---|---|
| 1 | 0:00 | Data | Upload the taxpayer's own `All Report` workbook. Let it run in front of them. | *"It read our actual portal download."* |
| 2 | 1:30 | Data → Corrections | Point at the date-transposition line. | *"It caught something Excel did to our file."* |
| 3 | 2:30 | Data → Held rows | Open one held row, show the source cells. | *"It shows what it refused, not just what it kept."* |
| 4 | 3:30 | Portfolio | The bubble chart. Click the top-right bubble. | *"I can see who to look at."* |
| 5 | 4:30 | Taxpayer | The scorecard grid - a year in one glance. | *"That is our compliance, all of it."* |
| 6 | 5:30 | Taxpayer | Read the top finding's sentence aloud. Rs 98.5 lakh, Rule 37A, 29 suppliers. | *"How do you know?"* — which is the question you want. |
| 7 | 6:30 | Report | Supplier filing status. Show SSR Shipyard at Rs 77,99,266.80. | *"That is our own supplier."* |
| 8 | 8:00 | Report → rows | Click the figure. Provenance drawer: the formula as executed, the rule, the source rows. | *"It can prove it."* |
| 9 | 9:00 | Report → export | Download the working to Excel. | *"I can send this to the taxpayer."* |
| 10 | 10:00 | Taxpayer | Scroll to the dark checks. Read one aloud: *"Cannot check rate contradictions - we do not have your HSN summary."* | *"It admits what it cannot do."* |
| 11 | 11:00 | Reference | Thresholds. Show `30 days` with its notification and adoption date. | *"The rules are not hard-coded by a programmer."* |
| 12 | 11:30 | Taxpayer → Action | Draft the DRC-01A. Stop before approving. | *"It ends in a notice."* |

**Three things to say out loud during the demo**, because they are the
argument:

* At step 2: *"Read naively, this file produces 250 notices for late e-invoice
  reporting. Every one of them would be wrong, and the department would lose
  every one on reply. The platform found the cause and corrected it."*
* At step 6: *"This is Rule 37A. The supplier filed their GSTR-1 so the credit
  appeared in this taxpayer's 2B and was claimed, and then never filed their
  3B, so the tax never reached the exchequer. One join, one column."*
* At step 10: *"Five of the twelve contradiction checks cannot run on this
  file, and four of the five want the same sheet. That is a procurement
  decision the platform just made for you."*

**Do not demo:** the copilot, the notice PDF (501), anything with a
coming-soon chip. A demo that shows an unfinished thing spends the credibility
the finished things earned.

---

## 6. What this flow needs that does not exist yet

Stated here so it is not discovered on the day.

| Needed | State |
|---|---|
| `Data`, `Reference`, `Portfolio`, `Taxpayer`, `Report` as five screens | the 28 exist; the consolidation is not written |
| The scorecard grid as a component | `FilingScorecard` is computed and returned by the runner; nothing renders it |
| Report endpoints | none of the seven exist |
| Export to Excel | not built |
| Plain-sentence layer over every finding | `narrative` exists on findings; the UI shows the figure |
| Deadline urgency for the bubble colour | `app/cases/limitation.py` computes it; not exposed |
