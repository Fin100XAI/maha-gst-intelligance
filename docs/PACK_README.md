# GST DRISHTI - Claude Code build pack (v2)

Instructions for building a GST compliance intelligence platform for State GST
officers **and** decision makers. Five documents. No code - this is what you hand to
Claude Code.

```
mkdir gst-drishti && cd gst-drishti && mkdir docs
# 00–04 → docs/ ,  CLAUDE.md → repo root
claude
```

Paste **`docs/00_MASTER_PROMPT.md` → THE PROMPT** as your first message, then work
through `docs/04_BUILD_PHASES.md` one phase at a time.

## The pack

| File | What it is | Words |
|---|---|---|
| `00_MASTER_PROMPT.md` | Kickoff prompt, the five laws, the two-score model | ~900 |
| `01_DOMAIN_AND_RISK.md` | GST lifecycle · 11 reconciliation identities · **the 34 CBIC/DGARM audit risk parameters with a full flag model** · 57 detection rules · scoring | ~5,600 |
| `02_PLATFORM_SPEC.md` | Architecture · canonical data model · ingestion · engine · **aggregation and the 40-metric catalogue** · API · agents · security | ~3,000 |
| `03_UI_SPEC.md` | **Dashboard (9 screens) + Workbench (7 screens)** · validated chart palette · the drill contract · coming-soon | ~3,400 |
| `04_BUILD_PHASES.md` | Seven phases, each with its acceptance gate · synthetic dataset · the demo test | ~2,700 |
| `CLAUDE.md` | Repo constitution. Root, not `docs/` | ~750 |

## What changed from v1

**Halved in length.** Nine documents to five; detection rules cut from 95 to the 57
that carry weight, because P01–P34 now covers the audit-selection surface the extras
were duplicating.

**P01–P34 added as a first-class layer.** Each parameter carries its deterministic
metric in GSTR table references, a banding strategy, flag levels 0–4, the departmental
action point verbatim, and its data dependency. Ten of the thirty-four need external
feeds (ICEGATE, ITD, DGARM, refunds) - those are implemented, return `NOT_EVALUATED`,
and are excluded from both sides of the score so that **coverage falls rather than the
score quietly understating risk**.

**Rebuilt around two audiences.** A portfolio dashboard for Commissioners and a case
workbench for officers, off one engine with one set of numbers. Nightly rollup fact
tables make a 48,000-taxpayer dashboard load in under 500 ms, and every chart element
drills through to the spreadsheet cell behind it.

**Charts specified properly.** Validated categorical palette (light worst-adjacent CVD
ΔE 9.1 / normal-vision 22.9; dark 8.4 / 19.8), reserved status colours for flags and
bands always paired with an icon and a label, one y-axis ever, dark mode selected
rather than inverted, a table view on every chart.

## The platform in one paragraph

Excel in (GSTR-1, 2B, 3B, 9/9C, ledgers, e-way bills, e-invoices) → sniffed, mapped,
normalised, canonicalised → **34 audit risk parameters** produce a P-Score with
coverage, and **57 detection rules** produce head-wise quantified findings with an
F-Score → eleven reconciliation identities → a case with a limitation clock → a
slot-filled statutory notice with maker-checker approval and a DIN → reply triage. An
LLM layer handles mapping, narration, legal research and conversation, and is
architecturally prevented from touching a number.

## The decision everything follows from

Determinism with provenance. A Commissioner points at a bar and asks where it came
from; the answer is the rule or parameter, the provision, the formula with its actual
values, the thresholds with their notification references, and the row in the uploaded
workbook. Build that path in Phase 2, before the first chart is styled.

## Before production

Statutory thresholds in `01_DOMAIN_AND_RISK.md` are cited from secondary sources -
adequate for engineering, not for issuing notices. The **flag cut-offs for P01–P34 are
platform defaults, not departmental policy**: the source document defines flags 1–4 as
increasing risk without prescribing numbers, so the defaults are peer-cohort
percentiles awaiting approval. The parameter table exists so that sign-off is a data
entry by the law officer, not a code change.
