# 03 — UI SPEC
### One engine, two surfaces: the Dashboard and the Workbench

## 0. Position

Two audiences with genuinely different jobs:

| | **Dashboard** — decision makers | **Workbench** — officers |
|---|---|---|
| Who | Commissioner, Addl./Joint Commissioner | STO, Asst. Commissioner, auditor |
| Question | *Where is my jurisdiction leaking, and who is doing something about it?* | *What can I demand from this taxpayer, and on what evidence?* |
| Grain | Tens of thousands of filings, aggregated | One taxpayer, one financial year |
| Primary metric | P-Score distribution, revenue at risk, enforcement funnel | F-Score findings, head-wise demand |
| Output | A decision about where to deploy people | A notice |

**They are not two products.** Same engine, same numbers, same provenance. A
Commissioner clicks a bar and lands in the officer's world; an officer clicks up and
sees where their case sits in the portfolio. The role decides which surface you land
on at login, not what you are allowed to understand.

This is a **quasi-judicial instrument**, not a BI report. Dense, quiet, confident,
obsessively traceable. Every figure is clickable. Nothing is decorative.

---

## 1. Design system

**Type.** `system-ui, -apple-system, "Segoe UI", sans-serif` throughout — no display
face. Noto Sans Devanagari for Marathi and Hindi. Scale 12/13/14/16/20/24/32,
line-height 1.45. `font-variant-numeric: tabular-nums` on table columns and axis
ticks only; hero figures and stat-tile values use proportional figures.

**Grid.** 4px base, 8px rhythm. Tables full-bleed. Dashboard canvas is a 12-column
responsive grid; a chart card is never narrower than 320px.

**Surfaces.** Light `#fcfcfb` chart surface on `#f9f9f7` page plane. Dark `#1a1a19`
on `#0d0d0d`. Dark mode is **selected, not auto-inverted** — declare the dark values
under both `@media (prefers-color-scheme: dark)` (guarded with
`:root:where(:not([data-theme="light"]))`) and `:root[data-theme="dark"]`, so the
user's toggle wins both ways.

**Ink.** Primary `#0b0b0b` / `#ffffff` · Secondary `#52514e` / `#c3c2b7` · Muted
axis/label `#898781` both modes · Gridline `#e1e0d9` / `#2c2c2a` · Baseline
`#c3c2b7` / `#383835`.

**Categorical series** — fixed order, never cycled:

| Slot | Light | Dark |
|---|---|---|
| 1 blue | `#2a78d6` | `#3987e5` |
| 2 orange | `#eb6834` | `#d95926` |
| 3 aqua | `#1baf7a` | `#199e70` |
| 4 yellow | `#eda100` | `#c98500` |

Validated: light worst adjacent CVD ΔE 9.1, normal-vision 22.9; dark 8.4 / 19.8.
Aqua and yellow sit below 3:1 on the light surface, so **the relief rule applies** —
those series ship visible direct labels or a table view, never color alone. Beyond
four series: fold into "Other", facet into small multiples, or switch to a table.
Scatter and small-multiple forms cap at **three** slots.

**Status — reserved, never reused as a series color.** These carry Flag levels 1–4,
risk bands, and finding severity:

| Role | Hex | Used for |
|---|---|---|
| good | `#0ca30c` | Flag 0 · LOW band · CLEAR finding |
| warning | `#fab219` | Flag 1–2 · MODERATE · MEDIUM |
| serious | `#ec835a` | Flag 3 · HIGH · HIGH |
| critical | `#d03b3b` | Flag 4 · SEVERE · CRITICAL |

`warning` and `serious` are sub-3:1 on the light surface by design — **every status
mark ships with an icon and a label**, so meaning is never carried by hue alone. This
also happens to be the right call politically: a Commissioner should never have to
squint at a shade to know whether something is serious.

**Sequential** (heatmaps, choropleths, the parameter matrix): one blue hue,
`#cde2fb → #0d366b`. **Ordinal** ramps (funnel stages, flag tiers) start no lighter
than `#86b6ef` on light and no darker than `#184f95` on dark.

**Diverging** (variance vs peer median, YoY change): blue ↔ red with a gray midpoint
(`#f0efec` light, `#383835` dark). Never a rainbow, never a hue at the midpoint.

**Hard chart rules.** One y-axis — **never a dual-axis chart**; two measures of
different scale become two charts, small multiples, or an index to a common base.
Color follows the entity, never its rank — a filter that changes the series count
must not repaint the survivors. Thin marks, 2px lines, ≥8px markers, 4px rounded
data-ends anchored to the baseline, 2px surface gaps between adjacent and stacked
fills. Legend present for ≥2 series (none for one — the title names it), with
selective direct labels, never a number on every point. Recessive grid and axes.
Values and labels wear text tokens, never the series color.

**Interaction.** Every chart ships a hover layer by default: crosshair + tooltip on
line and area, per-mark tooltip on bar, dot and cell. Filters in one row above the
charts. Motion 120–180ms ease-out — **numbers never animate**; a counting-up demand
figure looks like a game.

**Accessibility is procurement, not polish.** WCAG 2.1 AA: 4.5:1 text, keyboard path
to every action, visible focus rings, correct ARIA on tables and drawers. Every chart
has a table view. Texture fill (45°/135° hand-drawn lines) available for CVD, print
and forced-colors. Bilingual English/Marathi from day one, including statutory form
templates — a Maharashtra deployment that ships English-only reads as a pilot.

---

## 2. Information architecture

```
DASHBOARD (default landing for DC/JC/AC and above)
  D1 Overview            D2 Filing Compliance     D3 Revenue & Liability
  D4 Risk Landscape      D5 Parameter Explorer    D6 Enforcement Funnel
  D7 Jurisdictions       D8 Officers              D9 Sectors

WORKBENCH (default landing for Inspector/STO/auditor)
  W1 My Queue            W2 Audit Planner         W3 Taxpayer Registry
  W4 Taxpayer File  ├ Overview ├ Risk Profile (P01–P34) ├ Reconciliation
                    ├ Findings ├ Ledgers ├ Movement ├ Network ├ Documents
  W5 Cases               W6 Notices               W7 Copilot

SHARED
  Ingestion · Rule & Parameter Library · Administration · Roadmap
```

---

## 3. THE DRILL CONTRACT

**Every visual element on every dashboard resolves to the taxpayers behind it.**

```
chart element → GET /dashboard/drill?metric=M-K03&bucket=P14:flag4&jurisdiction=...
              → taxpayer list (the Registry component, pre-filtered)
              → taxpayer file
              → finding or parameter row
              → provenance drawer
              → the row in the uploaded spreadsheet
```

No exceptions, no dead ends. A bar a Commissioner cannot click is a bar a
Commissioner cannot act on, and it will be the first thing they try. Implement the
drill endpoint in Phase 4, before styling a single chart, and make "is it drillable"
a checklist item on every chart card in code review.

---

## 4. DASHBOARD

### D1 — Overview

**KPI strip** — six tiles, each a hero number with a 12-period sparkline, a YoY delta
and a `◉ calc` handle:

```
┌ Taxpayers ─┬ Filing compliance ┬ Revenue at risk ┬ Cash ratio ┬ Cases near limit ┬ Returns barred ┐
│   48,217   │      91.4%        │   ₹ 1,284 Cr    │   12.8%    │  173 within 90d  │  412 periods   │
│   ▁▂▃▄▅▆   │   ▇▇▆▇▇▆  −1.2pp  │  ▃▄▅▆▇▇  +8.4%  │ ▆▅▅▄▄▃ −2pp│  ⚠ 31 within 30d │  ⛔ 96 taxpayers│
└────────────┴───────────────────┴─────────────────┴────────────┴──────────────────┴────────────────┘
```

`M-R03` cash-to-liability is the department's single most-watched number, and
`M-E08` time-barred is the one nobody wants on a screen and everybody needs. Put them
both in the strip on day one.

**Body — four cards:**

1. **Risk landscape** — stacked bar of taxpayer count by P-Score band across the last
   six quarters (ordinal blue ramp, four stages). Beside it a **P-coverage meter**:
   *"P-Score computed over an average of 24 of 34 parameters — 10 await ICEGATE, ITD
   and DGARM feeds."* That sentence, with a number on it, is the integration business
   case, and it belongs on the Commissioner's first screen rather than in a slide.
2. **Enforcement funnel** — horizontal ordinal funnel: flagged → selected → notices
   issued → replies → demand raised → confirmed → collected, with the conversion
   percentage between stages and the rupee value at each.
3. **Jurisdiction heat** — divisions down, the last 12 periods across, cells shaded on
   the sequential blue ramp by revenue at risk. Click a cell → D7 filtered.
4. **Attention list** — the ten items needing a decision today: cases within 30 days of
   limitation, notices awaiting approval, divisions whose filing compliance fell more
   than 3pp, ingestion failures.

### D2 — Filing Compliance

M-F01–F09. A **filing calendar heatmap** (periods × jurisdiction, sequential ramp on
compliance rate) is the anchor. Below: on-time vs late vs not-filed as a stacked bar
by period; the mean-delay distribution; the non-filer register with turnover exposure;
and the **three-year bar countdown** — barred / <90 / <180 days, with taxpayer counts
and the aggregate liability at stake in each bucket. That last panel is the single
most defensible ROI story the platform has; give it room.

### D3 — Revenue & Liability

M-R01–R09. Turnover and liability trend (two charts, never two axes). Cash vs ITC
split as a 100% stacked bar by period. ITC-to-turnover distribution against the sector
band. Credit-ledger overhang in months of cover, by division. Effective-rate
distribution with the **GST 2.0 boundary of 22 Sep 2025 marked on the time axis** —
the rate structure changed mid-year and the chart must say so, or every reader will
misinterpret the step.

### D4 — Risk Landscape

P-Score and F-Score distributions **side by side, never fused**, with the band legend
and a migration matrix (band this quarter × band last quarter, sequential shading on
taxpayer count). Findings by family as a bar. Revenue at risk by confidence tier —
CERTAIN / STRONG / ADVISORY as separate bars, because a Commissioner reading a single
"revenue at risk" number needs to know how much of it would survive a reply.

### D5 — Parameter Explorer ★ the P01–P34 surface

The screen that makes the department's own risk framework legible at scale.

**Top — the incidence matrix.** 34 parameters down, flag levels 0–4 across, cells
carrying taxpayer counts on the sequential blue ramp, with a fifth column for
NOT_EVALUATED in muted gray.

```
        Flag0   Flag1   Flag2   Flag3   Flag4   Not eval.
P01     31,204   8,112   4,918   2,401   1,582        0
P02          —       —       —       —       —   48,217   ⟵ awaits ICEGATE
P03     38,441   5,220   2,905   1,104     547        0
...
P28          —       —       —       —       —   48,217   ⟵ awaits DGARM
```

Click any cell → the taxpayer list behind it. **The NOT_EVALUATED column is not an
embarrassment to hide** — it is the roadmap, priced. Show it at the same visual weight
as the rest.

**Middle — parameter detail.** Select a parameter: its formula, its GSTR table
references, its banding strategy, the cohort percentile cut-offs currently in force
with their approval status, the auditor action point verbatim from the departmental
document, and the distribution of values across the jurisdiction with the four flag
thresholds drawn as reference lines.

**Bottom — co-occurrence.** Which parameters fire together. A taxpayer flagged on
P07 (high ITC utilisation), P14 (ITC exceeds 2B) and P16 (low RCM payment) is a
different proposition from one flagged on P09 alone, and the officer selecting cases
needs to see that pattern rather than reconstruct it.

### D6 — Enforcement Funnel

M-E01–E10 in full: stage-by-stage conversion with rupee values; demand raised vs
confirmed vs collected by month; appeal sustain rate by rule (which findings actually
survive); case-age distribution; and the limitation exposure waterfall — cases by days
remaining, with the demand value in each bucket.

### D7 — Jurisdictions

Ranked, sortable table: commissionerate → division → range, with taxpayer count,
filing compliance, cash ratio, mean P-Score, P-coverage, revenue at risk, notices
issued, collection efficiency. Sparkline per row. Expand to drill a level down. Small
multiples of the compliance trend across divisions for visual comparison.

### D8 — Officers

Workload and outcomes: cases open/closed, mean age, demand raised and collected,
sustain rate, notices pending approval, and a rule-precision view (M-Q01) per officer.

**Frame this as capacity and case-mix, not a league table.** An officer working ten
complex ITC-fraud cases will show worse disposal numbers than one working fifty
late-fee cases, and a screen that hides that will be used to make bad decisions about
people. Show case mix alongside every throughput number.

### D9 — Sectors

HSN sector bands for every ratio metric, with each sector's own peer distribution — so
a Commissioner can see that textiles runs at a structurally different ITC ratio from
construction before drawing a conclusion from a single taxpayer.

---

## 5. WORKBENCH

### W1 — My Queue
Ranked by `expected recovery × collectability ÷ days to limitation`. Each row: GSTIN,
trade name, P-band and F-band chips, the top finding, the demand estimate, days left.
Filters, saved views, bulk actions.

### W2 — Audit Planner ★ where P01–P34 becomes a decision
Select taxpayers for audit from P-Score. Filters on band, coverage, specific parameter
flags, sector, turnover, jurisdiction, and prior-cycle selection (P30). The selection
basket shows aggregate turnover and estimated exposure. Export the audit plan; record
the selection rationale (which parameters drove it) against each taxpayer, so that
next year P30 is populated from real data rather than from memory.

### W3 — Taxpayer Registry
Virtualised, 50k rows, server-side sort and filter. GSTIN · trade name · P-band ·
P-Score · coverage · F-band · F-Score · turnover · ITC ratio · cash ratio · open
findings · open cases · days to limitation · officer. Saved views, Excel export.

### W4 — Taxpayer File

**Overview** — profile, registration timeline, filing calendar (36 periods × return
type), data-coverage panel, both scores with their bands.

**Risk Profile (P01–P34)** — all 34 as **flag ladders**:

```
P07  Tax paid through ITC ÷ total tax payable                          FLAG 4 ●
     Value 99.2%          Cohort  p50 71.4%  p75 84.0%  p90 93.1%  p97 97.6%
     ├────────────┬────────────┬──────────┬──────┬──▲──┤
     0           p50          p75        p90   p97  you
     Action  Verify ITC availment. Sample high-value and recurring supplies,
             sister-concern and dealer purchases. Check no ITC on exempt goods.
             Cross-check e-way bills, payment particulars, input-output ratio.
             Entire liability discharged through ITC → escalate scrutiny.
     Related findings  ITC-10 · PAY-01 · NET-05                          ◉ calc
```

The ladder shows the value, where it sits in the cohort, which flag that produces, and
the departmental action point verbatim. NOT_EVALUATED parameters render greyed with
the named missing feed and its roadmap reference — never hidden, never defaulted to
Flag 0. Defaulting an unevaluable parameter to zero is the quiet failure that makes a
risk score a lie.

**Reconciliation** — the identity matrix (12 periods × R1–R11, status glyph per cell),
the bridge waterfall on cell select, and the four-bucket matcher (matched / only left /
only right / value differs), virtualised and Excel-exportable. Head-wise split is the
**default**; consolidated is the opt-in.

```
GSTR-1 outward tax        ₹ 1,24,50,000
  + debit notes              ₹  2,10,000
  − credit notes             ₹ 14,80,000
  + amendments (9A/9C)       ₹  1,05,000
  = net per GSTR-1          ₹ 1,12,85,000
GSTR-3B Table 3.1(a)+(b)    ₹ 98,40,000
  ─────────────────────────────────────────
  SHORTFALL                  ₹ 14,45,000   IGST 9,20,000 · CGST 2,62,500 · SGST 2,62,500
  12.80% of liability · Rule 88C needs >20% and >₹25 L → below threshold
                                           → ASMT-10 route, not DRC-01B        ◉ calc
```

**Showing why a rule did *not* fire is as important as showing why it did.** It is how
an officer learns to trust the engine's silence, and silence is most of what the engine
produces.

**Findings** — faceted list of cards:

```
┌──────────────────────────────────────────────────────────────────────┐
│ ITC-02   HIGH   CERTAIN   CREDIT                  Jun 2025 · Jul 2025│
│ ITC availed from suppliers who did not discharge tax                 │
│ Rule 37A CGST Rules · s.16(2)(c) CGST Act        ⟷ P14              │
│                                                                      │
│ Required reversal  ₹ 38,42,110  IGST 22,10,000 · CGST 8,16,055 · SGST 8,16,055
│ Reversal made      ₹        0                                        │
│ Shortfall          ₹ 38,42,110  + interest u/s 50(1) from 01-Dec-2026│
│                                                                      │
│ 14 suppliers · 212 invoices      [Evidence] [Formula ◉] [Excel]      │
│ Suggested: DRC-01A               [Accept][Reject][Defer][→ Case]     │
└──────────────────────────────────────────────────────────────────────┘
```

NOT_EVALUATED findings sit in a separate muted section headed **"Could not be
evaluated — missing data"**, each naming the exact dataset and offering an upload link.

**Ledgers** — credit and cash movement with the R8 identity check per period per head,
the R9 utilisation-order check, the interest calculator showing its day-count working,
and the Rule 86B cash meter with its exemption checklist.

**Movement** — EWB list with implied-speed and distance columns, the EWB↔GSTR-1
four-bucket matcher, vehicle-reuse conflicts on a timeline, and the e-invoice
reporting-lag histogram with the 30-day line drawn on it.

**Network** — force-directed graph, subject at centre, two hops. Node size = turnover,
node color = risk band (status palette, with labels), edge width = value. Cycles
highlighted with a ring inset.

> **Mandatory banner, always visible:** *"Network patterns are investigative leads, not
> findings. No notice may be issued on the basis of this screen alone."*

Write those words. An officer misled once by a graph never trusts the platform again.

### W5 — Cases
Kanban: Identified → Under scrutiny → Intimation issued → Reply received → SCN issued →
Adjudication → Closed. Each card carries the demand, both bands and the limitation
clock. The case file shows the demand build-up — head-wise tax, interest with its
day-count working, penalty with the section applied — the finding set, the document
timeline and officer notes.

### W6 — Notices
Split view: statutory form left, evidence annexure right. **Numeric slots are locked
and visibly chained to their `calc_id`.** The narrative paragraph is editable and may
be agent-drafted, badged `AI-DRAFTED — OFFICER RESPONSIBLE`. Then maker-checker
approval, DIN minting, PDF preview, service mode and date, reply clock, and reply
triage mapping each paragraph of the taxpayer's reply to the finding it addresses —
and listing the findings it does not.

### W7 — Copilot
Right-docked, context-aware.

> *"Why is this taxpayer flagged on P07 and P14 together?"*
> *"Every supplier of this GSTIN who hasn't filed 3B for FY 2025-26."*
> *"Draft the ASMT-10 narrative for the June and July ITC findings."*
> *"Which of my cases go time-barred this quarter?"*

Every figure renders as a chip carrying its `calc_id`. Tool calls shown collapsed.
A refusal to answer without data is a correct answer and is displayed as one.

---

## 6. Shared components

| Component | Contract |
|---|---|
| `<Money value calcId>` | **The only way a figure is ever rendered.** Indian formatting, tabular figures, head-wise split on toggle, opens the provenance drawer |
| `<ProvenanceDrawer>` | rule/param · legal basis · formula template · formula with substituted values · every step · every parameter with its effective date and notification ref · source rows with a download |
| `<FlagLadder>` | value · cohort percentiles · flag band · action point · related findings |
| `<ChartCard>` | title · filter row · hover layer · legend · **table-view toggle** · `◉ calc` · drill handler. A ChartCard without a drill handler fails code review |
| `<DrillTable>` | virtualised registry, reused everywhere a chart drills |
| `<StatusChip>` | icon + label + status color. Never color alone |
| `<LimitationClock>` | days remaining, banded, with the section applied |
| `<ComingSoon>` | status chip · capability · data dependency · roadmap ref · **no data** |

### The provenance drawer

```
ITC-02  ·  calc_id 7f3a…c91  ·  engine v1.4.2  ·  params v2026-04-01

LEGAL BASIS  Rule 37A CGST Rules, 2017 r/w s.16(2)(c) CGST Act, 2017
FORMULA      shortfall = Σ{L ∈ 2B : supplier filed GSTR-1 and not GSTR-3B
                          by 30-Sep-2026} tax(L) − reversal declared in 4B(2)
AS EXECUTED  38,42,110.00 = 38,42,110.00 − 0.00
STEPS        1 qualifying suppliers 14 [list] · 2 invoices 212 [list]
             3 Σ tax 38,42,110.00 (IGST/CGST/SGST split) · 4 4B(2) 0.00
PARAMETERS   supplier_3b_cutoff 30-09 (eff. 01-10-2022, Notif. 26/2022-CT)
             reversal_cutoff    30-11 (eff. 01-10-2022, Notif. 26/2022-CT)
SOURCES      GSTR2B_Jun2025.xlsx → "B2B" → rows 44, 51, 78, 91 … (212) [Download]
             GSTR3B_Jun2025.xlsx → "Table 4" → row 12
```

**This drawer is the product. Everything else is navigation to it.**

---

## 7. Coming-soon modules

Real routes, designed screens, status chips, stated dependencies, roadmap refs, APIs
returning 501 — and **no fabricated data, ever**. Each names the parameters it unlocks,
which is what turns a roadmap slide into a budget conversation.

| Module | Status | Unlocks |
|---|---|---|
| GSTN back-office API | `IN DEVELOPMENT · Q2` | Replaces Excel upload entirely |
| ICEGATE customs | `PLANNED · Q3` | **P02, P15, P20, P23** · ITC-11 |
| ITD / AIS turnover | `PLANNED · Q3` | **P33, P34** |
| DGARM red-flag feed | `PLANNED · Q3` | **P28** |
| Refund module | `PLANNED · Q3` | **P25, P26, P27** |
| MCA / ROC directors | `PLANNED · Q4` | REG-04 at scale |
| VAHAN vehicles | `PLANNED · Q4` | EWB-07 |
| Mobile field verification | `IN DESIGN · Q3` | Geo-tagged premises verification |
| Taxpayer self-service | `PLANNED · Q4` | Pre-notice self-correction — highest ROI on this list |
| Appellate outcome analytics | `PLANNED` | Feeds M-Q01 back into rule weights |
| Predictive default model | `RESEARCH` | Explains why it is *not* in the score yet |

---

## 8. Performance budgets

| Interaction | Budget |
|---|---|
| First contentful paint | < 1.2 s |
| Dashboard overview, 48k taxpayers | < 500 ms (served from rollups, never live) |
| Parameter incidence matrix (34 × 6) | < 400 ms |
| Drill from a chart to the taxpayer list | < 400 ms |
| Registry, 50k rows, filtered | < 400 ms server + virtualised render |
| Reconciliation matrix, 12 × 11 | < 600 ms, one request |
| Provenance drawer | < 250 ms |
| Excel export, 100k rows | streamed, < 15 s |

Budget for a State network at 4 Mbps and a 2019 i3 — not for your laptop.
