# 04 — UI SPEC
### Two surfaces, one engine. Trimmed to what earns its place.

| | **Dashboard** — decision makers | **Workbench** — officers |
|---|---|---|
| Question | *Where is my jurisdiction leaking?* | *What can I demand, and on what evidence?* |
| Grain | Tens of thousands of filings | One filing |
| Primary artefact | P-Score distribution, enforcement funnel | The **filing scorecard grid** |

Five dashboard screens and five workbench screens. The cuts are listed in
`CHANGELOG.md` with the reason for each.

---

## 1. Design system

**Type** `system-ui, -apple-system, "Segoe UI", sans-serif`; Noto Sans Devanagari for
Marathi. Scale 12/13/14/16/20/24/32, line-height 1.45. `tabular-nums` on table columns
and axis ticks only.

**Surfaces** light `#fcfcfb` on `#f9f9f7`; dark `#1a1a19` on `#0d0d0d`. Dark mode is
**selected, not auto-inverted** — declare the dark values under both
`@media (prefers-color-scheme: dark)` (guarded with
`:root:where(:not([data-theme="light"]))`) and `:root[data-theme="dark"]`.

**Ink** primary `#0b0b0b`/`#ffffff` · secondary `#52514e`/`#c3c2b7` · muted `#898781` ·
gridline `#e1e0d9`/`#2c2c2a` · baseline `#c3c2b7`/`#383835`.

**Categorical series**, fixed order, never cycled — blue `#2a78d6`/`#3987e5`, orange
`#eb6834`/`#d95926`, aqua `#1baf7a`/`#199e70`, yellow `#eda100`/`#c98500`. Validated:
light worst-adjacent CVD ΔE 9.1, normal-vision 22.9; dark 8.4 / 19.8. Aqua and yellow
fall below 3:1 on the light surface, so those series carry visible direct labels or the
table view — never colour alone. Beyond four series: fold to "Other", facet, or table.

**Status — reserved, never a series colour.** Carries flag levels, bands and severity:
good `#0ca30c` · warning `#fab219` · serious `#ec835a` · critical `#d03b3b`. Warning and
serious are sub-3:1 on light **by design** — every status mark ships with an icon and a
label, so meaning is never carried by hue.

**Sequential** one blue hue `#cde2fb → #0d366b`. **Ordinal** ramps start no lighter than
`#86b6ef` on light, no darker than `#184f95` on dark. **Diverging** blue↔red with a grey
midpoint (`#f0efec` / `#383835`).

**Hard chart rules.** One y-axis — **never dual-axis**. Colour follows the entity, not
its rank. Thin marks, 2px lines, ≥8px markers, 4px rounded data-ends on the baseline,
2px surface gaps between adjacent and stacked fills. Legend for ≥2 series (none for
one), selective direct labels, recessive grid. Values and labels wear text tokens, never
the series colour. Hover layer by default; a table view on every chart. Motion
120–180 ms; **numbers never animate.**

**Accessibility is procurement.** WCAG 2.1 AA, keyboard path to every action, ARIA on
tables and drawers, texture fill available for CVD/print/forced-colors. English ships;
Marathi keys are in place from day one and the locale lands in Phase 6.

---

## 2. WORKBENCH

### W1 — Filing Scorecard Grid ★ the hero screen

Twelve periods across, check families down, every cell a status glyph. One screenful is
an entire financial year's compliance posture.

```
                 Apr May Jun Jul Aug Sep Oct Nov Dec Jan Feb Mar   FY
IDENTITIES R1-11  ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓    ✓
INVARIANTS        ✓   ✓   ✓   ✓   ✓   ⚠   ✓   ✓   ✓   ✓   ✓   ✓    ⚠
X  self-contra    ·   ·   ·   ·   ·   ·   ·   ●   ·   ·   ●   ●    ●
A  integrity      ✓   ✓   ✓   ✓   ✓   ▲   ✓   ✓   ✓   ✓   ✓   ✓    ▲
B  ITC s.16       ✓   ▲   ✓   ✓   ●   ✓   ●   ●   ✓   ✓   ✓   ✓    ●
C  RCM            ✓   ✓   ✓   ✓   ✓   ▲   ✓   ✓   ✓   ✓   ✓   ✓    ✓
D  place of supply✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓    ✓
F  reversals      ✓   ✓   ✓   ✓   ●   ✓   ✓   ✓   ✓   ✓   ✓   ✓    ●
G  outward        ✓   ✓   ✓   ✓   ✓   ✓   ✓   ▲   ▲   ✓   ✓   ▲    ▲
H  credit notes   ○   ○   ○   ○   ○   ○   ○   ●   ○   ○   ○   ○    ●
J  interest/fees  ✓   ✓   ✓   ✓   ✓   ●   ✓   ✓   ✓   ✓   ✓   ✓    ●
─────────────────────────────────────────────────────────────────────
 ✓ pass   ▲ material   ● critical   ○ not evaluated   ◇ needs document   ⊘ n/a
```

Beside it, a per-period strip: **coverage** (datasets present), **invariants** (rows
quarantined), **open documents**, and the period's own score contribution. Click any
cell → the checks behind it. Click any check → the finding card → the provenance drawer.

**The FY column is computed separately, not summed.** Netting, §16(4), Rule 37A cut-offs
and annual true-ups are FY-level tests no monthly cell can see — and the screen says so.

### W2 — Match Workbench ★ where cross-sheet evidence lives

All 21 joins listed with bucket counts. Select one, get the four buckets — **MATCHED ·
ONLY-LEFT · ONLY-RIGHT · VALUE-DIFFERS** — virtualised, sortable, Excel-exportable.
Each matched pair opens both source rows side by side with the **match level (L1–L4)**
shown, so an officer can see the strength of the link before relying on it.

The bridge waterfall renders above the buckets for the identity joins:

```
GSTR-1 outward tax        ₹ 1,24,50,000
  + debit notes              ₹  2,10,000
  − credit notes             ₹ 14,80,000
  + amendments (9A/9C)       ₹  1,05,000
  = net per GSTR-1          ₹ 1,12,85,000
GSTR-3B Table 3.1(a)+(b)    ₹ 98,40,000
  ───────────────────────────────────────
  SHORTFALL                  ₹ 14,45,000  IGST 9,20,000 · CGST 2,62,500 · SGST 2,62,500
  12.80% · Rule 88C needs >20% and >₹25 L → below threshold
                                           → ASMT-10 route, not DRC-01B      ◉ calc
```

**Showing why a rule did *not* fire matters as much as why it did.** It is how an
officer learns to trust the engine's silence — and silence is most of what it produces.

### W3 — Taxpayer File
**Overview** (profile, filing calendar, coverage, both scores) · **Risk Profile** — all
34 parameters as flag ladders:

```
P07  Tax paid through ITC ÷ total tax payable                       FLAG 4 ●
     Value 99.2%   Cohort n=412  p50 71.4%  p75 84.0%  p90 93.1%  p97 97.6%
     ├──────────┬──────────┬────────┬─────┬──▲──┤
     0         p50        p75      p90  p97  you
     Action  Verify ITC availment. Sample high-value and recurring supplies,
             sister-concern and dealer purchases. Check no ITC on exempt goods.
             Cross-check e-way bills, payment particulars, input-output ratio.
             Entire liability discharged through ITC → escalate scrutiny.
     Related  B-01 · F-06 · X-11                                      ◉ calc
```

The action point is the department's own words, rendered unedited. **Cohort size shows
on every peer-banded flag**; below `min_cohort` the ladder switches to self-history and
is badged `LOW CONFIDENCE`. `NOT_EVALUATED` parameters render greyed with the named
missing feed — never hidden, never defaulted to Flag 0.

Then **Checks** (faceted by family, tier, severity, status), **Ledgers** (daily balance
chart with the R8/R9 identity checks and the X-11 utilisation test), and **Documents**.

### W4 — Call Book (new)
Every `ASSISTED` check that needs a document, grouped by document rather than by rule —
so one letter asks for the fixed-asset register once and cites the four checks it
unblocks, instead of four letters asking four times. Shows the partial figure the
returns already support and the unquantified exposure behind it.

### W5 — Cases & Notices
Case board (Identified → Scrutiny → Intimation → Reply → SCN → Adjudication → Closed)
with the module-K outputs on every card: section applied, nature, penalty %, interest,
and the **limitation countdown**. Notices: ASMT-10, DRC-01A, DRC-01B, DRC-01C only.
Numeric slots locked and chained to their `calc_id`; the narrative may be agent-drafted
and is badged `AI-DRAFTED — OFFICER RESPONSIBLE`; maker-checker approval mints the DIN.

---

## 3. DASHBOARD

**D1 Overview** — six KPI tiles (taxpayers · filing compliance · revenue at risk ·
cash-to-liability ratio · cases near limitation · returns barred), each with a
12-period sparkline and a `◉ calc`. Below: risk landscape by band, the **P-coverage
meter** stating how many parameters are dark and naming the feeds, the enforcement
funnel, and today's attention list.

**D2 Filing Compliance** — filing calendar heatmap, on-time/late/not-filed by period,
non-filer register with turnover exposure, and the **three-year-bar countdown** (barred
/ <90 / <180 days) with the liability at stake in each bucket. That panel is the most
defensible ROI story the platform has.

**D3 Risk Landscape** — P-Score and F-Score distributions **side by side, never fused**,
with a band-migration matrix and revenue at risk split by confidence tier, because a
Commissioner reading one "revenue at risk" number needs to know how much survives a
reply.

**D4 Parameter Explorer** — the 34 × (flag 0–4 + NOT_EVALUATED) incidence matrix, every
cell drillable. Parameter detail shows the formula, the GSTR table references, the
cut-offs in force with their approval status, the action point verbatim, and the
jurisdiction's value distribution with the four thresholds as reference lines. Plus
**co-occurrence**: a taxpayer flagged on P07 + P14 + P16 together is a different
proposition from P09 alone.

**D5 Enforcement Funnel** — stage conversion with rupee values, demand raised vs
confirmed vs collected, limitation exposure waterfall, and **rule precision**
(accepted ÷ disposed, per check) — the feedback loop that keeps the catalogue honest. A
check at 12% precision needs its threshold revisited, and this screen should say so.

---

## 4. The drill contract

**Every visual element resolves to the filings behind it.**

```
chart element → GET /dashboard/drill?metric=&bucket=
              → taxpayer list → filing scorecard → check → match pair
              → provenance drawer → the row in the uploaded spreadsheet
```

No exceptions. A `<ChartCard>` without a drill handler fails code review.

## 5. Shared components

`<Money value calcId>` is **the only way a figure is ever rendered** ·
`<ProvenanceDrawer>` (check, legal basis, formula template, formula with substituted
values, every step, every parameter with its effective date and notification reference,
source rows with download) · `<FlagLadder>` · `<ScorecardGrid>` · `<MatchBuckets>` ·
`<ChartCard>` (title, filters, hover, legend, **table-view toggle**, `◉ calc`, drill) ·
`<StatusChip>` (icon + label + colour) · `<LimitationClock>` · `<ComingSoon>`.

**The provenance drawer is the product. Everything else is navigation to it.**

## 6. Performance budgets

| | Budget |
|---|---|
| First contentful paint | < 1.2 s |
| Dashboard overview, 48k taxpayers | < 500 ms, from rollups, never live |
| Scorecard grid, 12 × 11 | < 600 ms, one request |
| Match bucket, 5,000 rows | < 400 ms server + virtualised render |
| Provenance drawer | < 250 ms |
| Excel export, 100k rows | streamed, < 15 s |

Budget for a State network at 4 Mbps and a 2019 i3.
