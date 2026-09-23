# DECISIONS

Every ambiguity resolved while building, with the reasoning, in the order it was
met. The working agreement is: *pick the interpretation most defensible in a
quasi-judicial proceeding, implement it, log it here.*

A decision marked **TODO(statute)** is not a decision. It is a gap the platform
refuses to fill by guessing; it is surfaced in the admin screen as unconfigured
and it awaits the department's law officer.

---

## D-0001 - The spec pack is the contract, and `CLAUDE.md` moves to the repo root

**Phase 0.** The build pack ships `CLAUDE.md` alongside `00`–`04`. A `CLAUDE.md`
belonging to an unrelated project (an LLM evaluation harness) was present in the
parent directory and was being loaded as project instructions.

**Decision.** The GST Intelligence `CLAUDE.md` is placed at this repository's root so
it governs every future session, and `01`–`04` live in `docs/`. The unrelated
file is left untouched and is not applied to this codebase.

---

## D-0002 - Python 3.11 is the deployment target; 3.12 is allowed locally

**Phase 0.** `docs/00` pins Python 3.11. The build machine has 3.12.7 and no
3.11.

**Decision.** `Dockerfile` and CI pin `3.11`, which is what runs in the State
Data Centre. `requires-python = ">=3.11"` so local development on 3.12 works.
Nothing in the codebase depends on behaviour that differs between the two, and
CI is the arbiter: a 3.11-only failure fails the build before it ships.

---

## D-0003 - `D()` refuses a `Cr` / `Dr` suffix instead of guessing its sign

**Phase 0.** Accounting exports write `1,000 Cr` and `500 Dr`. Whether `Cr`
means positive or negative depends on which ledger the column belongs to.

**Decision.** `D()` raises `MoneyCoercionError`. Ingestion turns that into a
quarantined row naming the reason, and the officer maps the column explicitly.

**Reasoning.** Guessing inverts a ledger balance silently, and a silently
inverted balance is exactly the class of error Law 5 exists to prevent. A
quarantined row costs an officer thirty seconds; a wrong sign in a demand costs
the order.

---

## D-0004 - An Assistant Commissioner lands on the Workbench

**Phase 0.** `docs/03` section 0 puts "STO, Asst. Commissioner, auditor" in the
Workbench column. Section 2 says the Dashboard is the "default landing for
DC/JC/AC and above".

**Decision.** Section 0 governs. "AC and above" in section 2 reads *Addl.*
Commissioner, which is consistent with section 0's Dashboard column
("Commissioner, Addl./Joint Commissioner"). An Assistant Commissioner therefore
lands on the Workbench.

**Reasoning.** Section 0 names the role by its full title in a table whose
purpose is precisely to assign roles to surfaces; section 2 uses an initialism
that is ambiguous between two ranks. Landing is not authorisation - every user
can navigate to either surface - so the cost of being wrong here is one click.

---

## D-0005 - Due dates the spec pack does not state are refused, not inferred

**Phase 0.** `docs/01` section A2 states the monthly cycle: GSTR-1 on the 11th,
GSTR-1A on the 13th, GSTR-3B on the 20th, GSTR-9/9C on 31 December of the
following FY. `docs/04`'s Phase 0 gate additionally fixes QRMP GSTR-3B for
Maharashtra at the 22nd. It states nothing for GSTR-4, 5, 6, 7, 8, CMP-08,
ITC-04, or for quarterly GSTR-1 under QRMP.

**Decision.** `due_date()` implements only the stated dates. Everything else
raises `UnconfiguredStatutoryParameterError`, and every gap is listed in
`app.canonical.UNCONFIGURED`, served at `GET /api/v1/admin/unconfigured`.

**Reasoning.** `docs/00`: *never invent a threshold, rate, due date or form
number.* A wrong due date propagates into `days_late`, into the late-fee
computation, into interest, and into a limitation clock. A missing feature is
visible; a wrong date is not.

**TODO(statute):** the nine entries in `UNCONFIGURED`.

---

## D-0006 - The QRMP 22nd/24th State table is a platform default, not policy

**Phase 0.** QRMP GSTR-3B falls on the 22nd for one group of States and the 24th
for the rest. `docs/04` fixes Maharashtra at the 22nd. The full categorisation
is not in the spec pack.

**Decision.** `_QRMP_22ND` holds the categorisation, Maharashtra included per
the gate. The table is registered in `UNCONFIGURED` as
`qrmp.state_category` so the admin screen shows it as awaiting sign-off, and
`due_date()` requires an explicit `state_code` rather than assuming one.

**Reasoning.** Maharashtra is the first deployment and its value is fixed by an
acceptance test, so it is not a guess. The other States are, and they are
labelled as such rather than presented as departmental policy.

---

## D-0007 - `TaxVector.total` exists, and is the only way to collapse the heads

**Phase 0.** Law 3 forbids summing the four heads into one scalar. Several
statutory tests are nevertheless written against a scalar - Rule 88C triggers on
a shortfall above ₹25 lakh, not on four separate head thresholds.

**Decision.** The collapse is available only through two explicitly named
properties, `total` and `abs_total`. There is no `__int__`, no `__float__`, no
implicit coercion and no arithmetic between a `TaxVector` and a `Decimal`.

**Reasoning.** Making the collapse impossible would make the statutory tests
unwritable. Making it *named* means every collapse is greppable and every one
appears in a code review as a deliberate act. `abs_total` exists so that the
honest size of an offsetting breach is as easy to reach as the misleading one.

---

## D-0008 - Money columns are `NUMERIC(18,2)`; parameter metrics are `NUMERIC(28,10)`

**Phase 0.** Gate G2 tests every column matching `igst|cgst|sgst|cess|value|
amount`. `param_result.value` matches, but holds a P-parameter metric that may
be a ratio such as `0.9921`.

**Decision.** Rupees are `NUMERIC(18,2)`. Ratios and parameter metrics are
`NUMERIC(28,10)`. `rule_parameter.value` is `TEXT` with a `value_type`
discriminator. All three are non-floating-point, so G2 holds; the two exceptions
to "money columns are `NUMERIC(18,2)`" are listed by name in the test, so adding
a third is a visible decision rather than a quiet one.

**Reasoning.** Rounding a cohort percentile to two decimal places before banding
it against `p97` would change a flag, and a flag changes an audit selection.

---

## D-0009 - The audit chain hashes a UTC *instant*, not a timestamp representation

**Phase 0.** SQLite returns a naive `datetime` for a column stored as UTC.
Hashing the representation broke the chain on rows nobody had touched.

**Decision.** `canonical_json` normalises every `datetime` to UTC at microsecond
precision before hashing, reading a naive value as UTC - the only thing this
application stores.

**Reasoning.** A tamper-evidence mechanism that reports tampering when the
driver changes is worse than none: it trains people to ignore it. The chain must
break for exactly one reason, which is that the data changed.

---

## D-0010 - The G1 lint has no suppression comment

**Phase 0.** `docs/04` requires a build-breaking check on float literals under
`app/engine/` and `app/ingestion/`.

**Decision.** `tools/lint_no_float.py` provides no `# noqa` escape, and a test
asserts that a comment cannot disarm it. It also rejects `float()`, the numpy
float constructors, and imports of `math`, `cmath`, `statistics` and `random`.

**Reasoning.** A rule that can be switched off at the point of violation is a
convention, not a guarantee. `numpy` itself is *not* banned, because `docs/02`
section 5 permits vectorising inside a rule over integer paise; what is banned
is the float constructor that would let a numpy float reach a `Finding`.

---

## D-0011 - `app/db/` is added to the repo layout

**Phase 0.** `docs/02` section 2 lists the module layout and does not name a
place for SQLAlchemy models or the declarative base.

**Decision.** `app/db/base.py` (declarative base, shared column types) and
`app/db/models.py` (every table in `docs/02` section 4). The table name `case`
is kept verbatim despite being a SQL reserved word; SQLAlchemy quotes it.

**Reasoning.** The layout in `docs/02` describes responsibilities, not an
exhaustive file list, and a `db` package is the least surprising home for the
canonical schema. Keeping `case` as the table name keeps the code and the spec
readable against each other.

---

## D-0012 - Ingestion tables are created in migration `0001`

**Phase 0.** `docs/04` asks Phase 0 for "every table in docs/02 section 4".
`upload`, `upload_sheet` and `quarantine_row` are implied by section 3 and by
the Phase 1 gate but are not named in the section 4 list.

**Decision.** They are included in `0001`.

**Reasoning.** Phase 1 cannot satisfy "every uploaded row lands in PARSED,
QUARANTINED or DUPLICATE, and the counts reconcile on screen" without them, and
settling the shape now avoids a schema churn against a migration that other
phases will already have applied.

---

## D-0013 - Placeholder screens show no numbers at all

**Phase 0.** The shell routes to all nine Dashboard screens and all seven
Workbench screens, none of which has its data layer yet.

**Decision.** Each route renders a `PhaseScreen` naming the screen, the phase
that delivers it, and what it will show - and renders no figures, no charts and
no sample rows.

**Reasoning.** `docs/00`: *no fabricated data anywhere, ever.* A placeholder
chart with plausible numbers is indistinguishable from a real one at a glance,
and the first officer who acts on one stops trusting the platform permanently.

---

## D-0014 - `make seed` and `make demo` exit non-zero until they are real

**Phase 0.** Both targets are named in `CLAUDE.md`.

**Decision.** They print which phase delivers them and exit 1.

**Reasoning.** A target that exits 0 having done nothing reads as success. The
synthetic dataset is a Phase 6 deliverable with an asserted
`expected_findings.json`; half of one would be fabricated data.

---

## D-0015 - R8's tolerance is zero, and materiality belongs to the rule

**Phase 2.** Identity R8 (3B tax payable = tax paid, head-wise) was written with
a ±₹1 tolerance, and it therefore missed a ₹1 discrepancy.

**Decision.** R8 compares exactly. The ₹1 materiality threshold lives in the
PAY-05 rule, where it is a parameter with an effective date.

**Reasoning.** An identity is arithmetic, not an estimate. If two figures that
must be equal are not, the reconciliation has failed and an officer should see
it; whether the department *acts* on a ₹1 difference is a policy question, and
policy questions belong in effective-dated parameters rather than in the
definition of addition.

---

## D-0016 - P12 is banded on a count, not a ratio

**Phase 3.** `docs/01` gives P12 a count-based action point and no denominator.

**Decision.** P12 bands on the count directly, with `BandingStrategy.COUNT`.

**Reasoning.** Inventing a denominator would invent a metric. The count is what
the source document states.

---

## D-0017 - Rule 88C's two limits are exclusive, and compared exactly

**Phase 3.** Rule 88C requires the difference to exceed **both** 20% and ₹25
lakh. Rendering the percentage for display rounded 20.000008% to 20.00%, and a
`>=` comparison on the rounded value would have fired the rule at exactly 20%.

**Decision.** The comparison is exact cross-multiplication on the underlying
Decimals - `shortfall * 100 > threshold * base` - and the rounded percentage is
carried only for display. Both limits must be exceeded, not met.

**Reasoning.** Display rounding must never decide a statutory trigger. A notice
issued at exactly 20% would be defended against the text of the rule, which says
*exceeds*.

---

## D-0018 - The tax period comes from the sheet name when the export omits it

**Phase 1.** The portal's GSTR-1 B2B export carries no period column; the period
is in the sheet name (`b2b_042025`).

**Decision.** `period_from_sheet_name()` reads it from the sheet name, and the
row records where the period came from. A sheet whose name yields no period
still quarantines its rows with `REQUIRED_FIELD_MISSING: period`.

**Reasoning.** Quarantining every row of a real portal export would make the
platform unusable on its primary input. Reading the sheet name is what a human
does, and the provenance records that it is what happened.

---

## D-0019 - A narrative carrying slot syntax is refused, not rendered

**Phase 6.** A drafted narrative containing `{{slot:demand.total}}` would either
be rendered as a second copy of the figure or left visible on a served notice.

**Decision.** `fill()` refuses the narrative outright.

**Reasoning.** The drafting model is never shown slot syntax, so a narrative
carrying it is either a bug or an injection attempt. Neither should reach a
document that creates legal liability. Rendering it would let prose introduce a
figure into a locked slot; leaving it visible would put `{{slot:...}}` on a
statutory notice.

---

## D-0020 - The s.128A amnesty is tested before limitation

**Phase 6.** For every year s.128A covers, the limitation clock has also run, so
both refusals apply and only one message is shown.

**Decision.** `draft()` tests the amnesty first.

**Reasoning.** The waiver is the substantive reason the notice must not issue.
An officer told only "limitation expired" would go looking for an extension that
does not exist.

---

## D-0021 - There is no PDF yet, and the endpoint says so

**Phase 6.** `docs/04` asks for slot filling → PDF → DIN → hash in the chain.
Devanagari cannot be rendered with the base PDF fonts, so a Marathi ASMT-10
would silently lose its text.

**Decision.** `GET /notices/{id}/pdf` returns 501 with `roadmap_ref: RM-08` and
names what is available instead. The document text and its hash are served by
`GET /notices/{id}`, and it is that hash which enters the audit chain at
approval, so approval is already provable.

**Reasoning.** `docs/00`: no fabricated data, ever. An English-only PDF
presented as *the* PDF would be a half-feature that fails in Marathi - the
language of the deployment State - without saying so.

---

## D-0022 - An unverified bearer token is refused, not trusted

**Phase 6.** OIDC against the State SSO has no identity provider configured in
this build.

**Decision.** A request carrying an `Authorization` header is refused with 501.
Outside development there is no other path, so the API returns 401. In
development the caller is read from explicit `X-Officer-*` headers.

**Reasoning.** Accepting an unverified token would make the authentication layer
decorative while looking complete. Refusing is the honest failure, and it cannot
be left switched on by accident in a deployment that issues notices.

---

## D-0023 - Dates and pseudonyms are identifiers, not figures

**Phase 6.** The numeric-fidelity middleware rejected `06/2025` (a tax period)
and `TP-0001` (a pseudonymous reference) as ungrounded numbers.

**Decision.** A number inside a date or tax-period pattern, and a number in
`TP-nnnn`, passes without grounding. Every other number still requires a tool
result or a `calc_id`.

**Reasoning.** A point in time is not a quantity an officer can act on. Refusing
them would have made the agent layer unusable while adding no protection -
and an unusable check gets switched off, which is how these guarantees die.

---

## D-0024 - A ten-digit run after a decimal point is not a telephone number

**Phase 6.** The leak detector matched `6470588235` inside the P-Score
`0.6470588235` and refused the prompt.

**Decision.** The mobile-number pattern requires the digits to stand alone; the
bank-account pattern requires a banking word beside it.

**Reasoning.** A detector that fires on a ratio blocks legitimate work, and one
that fires on every twelve-digit run blocks discussion of e-way bill numbers.
Both would be switched off in a week. Shape alone still catches an unmasked
GSTIN, PAN or email, which are the identifiers that actually leak.

---

## D-0025 - A rate is not computed from a denominator that counts only failures

**Phase 4 (D2, D7).** `fact_filing_period` is built from triggered REG-07
findings, so it holds periods that were **not** filed. Computing
`filed / expected` over it yields a compliance rate of 0% for every division,
which reads as total non-compliance and means nothing of the kind.

**Decision.** The compliance and on-time rates are reported only when the
filing-status register (filed returns with ARN and filing date) is present.
Without it the screen returns `NOT_EVALUATED` naming that register, and the
counts it does hold - not filed, barred, near bar - are shown as themselves.

**Reasoning.** Law 5. The alternative was a number that a Commissioner would
have acted on and that no officer could have defended. Note also that showing
one division a computed 0% while six show "not evaluated" reads as blame
attaching to that division, so the gate is applied uniformly rather than
per-row.

---

## D-0026 - An aggregate carries provenance by drill, not by `calc_id`

**Phase 4.** Law 2 requires every number, including every bar on every chart,
to carry a `calc_id`. A portfolio aggregate - a division's revenue at risk, a
band's total - is not one computation and has no single `calc_id`, so every
figure on the new dashboards rendered the `<Money>` "no provenance" warning.

**Decision.** `<Money>` accepts a `drill` handler as an alternative provenance
route. An aggregate renders as a handle to the taxpayer list it was summed
from; each of those taxpayers' findings carries its own `calc_id`. A figure
with neither a `calc_id` nor a drill still renders the warning.

**Reasoning.** The chain is unbroken - the figure resolves to its constituents
and they resolve to spreadsheet cells - so Law 2 is satisfied in substance. And
a screen where every number wears a ⚠ teaches officers to ignore the ⚠ on the
screens where it means a real bug, which would cost more than it protects.

---

## D-0027 - The filer's GSTIN is read from the title block, and only from a sparse row

**Phase 6 (S1).** A GSTR-1 export carries the **recipient's** GSTIN on every
row; the filer's own appears once, in the banner the portal writes above the
header. Uploading a real export therefore quarantined every row for a missing
`gstin`, with a reason that told an officer nothing about what to fix.

**Decision.** The upload endpoint accepts an explicit `?gstin=`, and otherwise
reads the filer from the title block. Which of the two it was is recorded as
`owner_gstin_source`. Only rows with at most three populated cells are scanned,
and only a checksum-valid GSTIN is accepted.

**Reasoning.** The sparse-row rule is the load-bearing part. Scanning far enough
down to reach a data row would have read the *recipient's* GSTIN and silently
attributed the return to them - the wrong taxpayer's name on a notice, from a
bug that looks like a convenience feature. A banner holds a cell or two; a
header or transaction row holds many, and that is a reliable difference. Where
neither source yields a filer, the response says so and names the remedy rather
than leaving an officer with a wholly quarantined file.

---

## D-0028 - A worklist is ordered by what can be acted on, not by severity alone

**Phase 5 (W1).** Ordering the officer's queue by severity put a CRITICAL but
ADVISORY finding above a HIGH and CERTAIN one.

**Decision.** The first sort key is whether the finding may populate a notice at
all. Advisory items stay on the list - that is what a worklist is for - but
below everything that can be taken forward today. Severity, confidence and
amount break ties within each group.

**Reasoning.** An ADVISORY finding cannot support a notice however severe it
is, so heading the queue with one sends an officer to the thing they cannot
act on. The ordering should answer "what can I do next", not "what is most
alarming".

---

## D-0029 - De-identification is derived from the role, never set by the caller

**Phase 6.** `Principal.deidentified` was a field defaulting to `False`, and
nothing set it for the Analytics role, so an analytics caller could have reached
the agent endpoint.

**Decision.** `deidentified` is a property computed from the role, with a
`force_deidentified` override for roles that need it applied specially.

**Reasoning.** A security property that depends on every construction site
remembering to pass a flag is a property that will eventually not hold. It was
already not holding.

---

## D-0030 - Identity results are stored, and carry their own status

**Phase 5.** The eleven reconciliation identities were computed on every run
and thrown away: only their traces reached the database, and the demo seeder
ran with `with_identities=False`, so the matrix the Reconciliation Workbench
renders had nothing behind it.

**Decision.** A new `identity_check` table records one row per taxpayer,
period and identity, carrying `status`, the head-wise delta, the missing
inputs and the `calc_id`. The demo runs identities on.

**Reasoning.** Status is the engine's judgement - only the engine knows each
identity's tolerance, and R8's is exactly zero while others' are not. Deriving
"does it hold?" downstream from the delta would produce a screen that
eventually disagrees with the engine about the same row. Storing rather than
recomputing also means the matrix shows what the run concluded, not what a
recomputation would conclude against data that has since changed.

The cost is one migration and about twenty-six seconds on a twelve-taxpayer
run. Both are worth paying for a screen an officer signs a reconciliation
from.

---

## D-0031 - The reconciliation matrix has three states and no blanks

**Phase 5.** An identity holds, is breached, or could not be evaluated.

**Decision.** All three render as distinct cells. NOT_EVALUATED is a cell
carrying the dataset it waited for, never an empty square.

**Reasoning.** An officer reading a matrix of ticks and gaps reads the gaps as
ticks. The reconciliation they then sign is over data that was never tested,
and that is the precise failure this screen exists to prevent. The head-wise
split is likewise not optional: an identity breached by +1,00,000 IGST and
−1,00,000 CGST nets to zero, and a net view would report a clean
reconciliation over two real errors.

---

## D-0032 - A document's direction is its type; its amount is a magnitude

**Evaluation.** A credit note written in accountancy parentheses was stored
negative, and `OutwardRecord.signed_tax` negated it again. The note was
therefore **added** to outward liability: a demand overstated by twice the
note, on the one document whose purpose is to reduce a liability. Walking a
realistic workbook end to end put ₹86,000 where ₹50,000 was owed.

**Decision.** Ingestion normalises a credit note's money fields to their
magnitude. The sign is applied exactly once, in the engine, from `doc_type`.

**Reasoning.** Both conventions arrive in real files - the portal's CDNR table
writes a positive amount and carries direction in "Note Type = C"; an
accountant's export writes parentheses. Normalising at the boundary means the
engine has one rule instead of two, and the rule it has is stated in one place.

---

## D-0033 - A period with no return is not a period that declared nil

**Evaluation.** R1 read `ctx.return_3b(period)` and, when no 3B existed for
that period, compared GSTR-1 against a zero vector. The whole month's liability
was reported as undeclared and OUT-01 routed an ASMT-10 for it.

**Decision.** R1 reports `NOT_EVALUATED` for that period, naming
`gstr3b for <period>`. The reconciliation matrix shows the gap per period.

**Reasoning.** We do not know the return was not filed; we know we do not have
it. If it genuinely was not filed, that is a filing finding - REG-07, BEH-02 -
not a Rule 88C discrepancy. Issuing a discrepancy notice for a return nobody
has looked at is the failure this platform exists to prevent, and it was one
`if` away from happening.

---

## D-0034 - A taxpayer known only from a return may be analysed, not served

**Evaluation.** Ingestion created no taxpayer record, so an uploaded return was
invisible to every screen. Creating one raised the opposite question: a GSTR-1
carries no legal name, so the stub's name is its GSTIN - and the first notice
drafted read "To 27AAGCS4521P1ZX".

**Decision.** Ingestion registers a stub with `status = FROM_RETURN`, carrying
only what the GSTIN encodes. `POST /notices/draft` refuses a taxpayer still in
that state with `REGISTRATION_NOT_LOADED`.

**Reasoning.** A stub is enough to analyse a taxpayer and not enough to serve
one: a notice addressed to a number rather than to a person is defective on its
face. Note also that a stub has no division, so no field officer has
jurisdiction over it - the register must be loaded before anyone can work the
case, which is the right order.

---

## D-0035 - GSTR-3B is read as a summary table, not as a register

**Evaluation.** Every other return is one row per document. A 3B is one row per
*line of the return* and one column per tax head. The row-per-record pipeline
quarantined every row of a 3B with "unrecognised period", and 21 of the 57
rules need a 3B.

**Decision.** `app/ingestion/three_b.py` reads the transposed table into one
canonical record whose cells carry the portal's own numbering (`t31a_igst`).
A line whose label matches nothing is quarantined individually and named.

**Reasoning.** So that a formula in a notice can cite "3B Table 3.1(a)" and an
officer can find the column it came from. Quarantining an unreadable line
rather than skipping it keeps the claim that a 3B was read whole an honest one.

---

## D-0036 - The banner reader belongs to ingestion, not to the API

**Evaluation.** `owner_gstin_from` lived in the upload endpoint, so the filer's
GSTIN was read from the title block over HTTP and nowhere else. A test calling
`ingest_sheets` directly got every row quarantined for a missing GSTIN.

**Decision.** Moved to `app/ingestion/banner.py` and called by `ingest_sheets`
whenever the caller supplies no owner.

**Reasoning.** Where the filer's GSTIN is written is a property of the file,
not of the transport. A seam that makes the HTTP path behave differently from
every other path is a seam in the wrong place, and it hides bugs exactly where
tests would otherwise find them.

---

## D-0037 - A threshold has three states, and they are never one state

**Evaluation.** The admin screen said "All 106 statutory thresholds are
provisional" and offered no way to stop saying it. The department can decide a
value; it cannot conjure a notification. Collapsing those two into "configured"
would let a departmental working value be quoted in a notice as though a
notification stood behind it.

**Decision.** `app/admin/parameters.py` derives three statuses from the row's
own evidence, never from a stored label:

* `PROVISIONAL` - a value the platform shipped with. Nobody has adopted it.
* `DEPARTMENT` - `approved_by` and `approved_at` name who adopted it and when.
* `NOTIFIED` - `notification_ref` cites the notification.

`POST /admin/parameters/adopt` moves provisional rows to `DEPARTMENT` under a
recorded acknowledgement, leaving notified rows alone. `PUT` writes a *new*
effective-dated row and closes the previous one at `effective_from - 1 day`.

**Reasoning.** Adoption changes the authority, never the number - the test
asserts the figures are byte-identical across it, because a screen that
silently moved a threshold while claiming to record ownership would be worse
than the banner it replaced. Editing never overwrites, because the engine
resolves as at the tax period under scrutiny: re-running FY 2019-20 must apply
the FY 2019-20 value whatever the department has decided since. Verified: with
`OUT-01.pct_threshold` set to 25 from 2025-10-01, July 2025 still resolves 20.

The file lives under `app/admin/` and not `app/engine/` because administration
needs the clock and a session, and the engine purity test forbids both.

---

## D-0038 - SQLite is the supported database, and it is a real one

**Evaluation.** The default `database_url` pointed at PostgreSQL, which nothing
in the repository had ever been run against. The tests, the demo and every
end-to-end walk used SQLite. The documentation named a database the platform
had not been exercised on.

**Decision.** `sqlite:///./drishti.db` is the default and the supported
configuration. Four PRAGMAs are set on every connection in `app/api/deps.py`:
`foreign_keys=ON`, `journal_mode=WAL`, `synchronous=NORMAL`,
`busy_timeout=10000`. The JSONB column variant keeps PostgreSQL a URL change
rather than a port.

**Reasoning.** A supported database is one the suite runs against. Claiming
PostgreSQL support on the strength of an unused dialect setting is the kind of
claim this platform is built not to make; `docs/VERIFICATION.md` now says
PostgreSQL is untested rather than implying otherwise.

Enabling `foreign_keys=ON` immediately exposed a latent bug: `persist_report`
added a `QuarantineRow` before its parent upload had been flushed, which SQLite
had been silently tolerating with foreign keys off. The parents are now flushed
first. The constraint was doing its job within a minute of being switched on,
which is the argument for switching it on.

---

## D-0039 - The workbook is shown as the officer's own file has it

**Evaluation.** The provenance drawer could say "row 8 of sheet B2B_072025" and
be believed, but not checked. The ninety-second test ends at a spreadsheet
cell, and the platform had no way to show one.

**Decision.** `GET /ingestion/uploads/{id}/sheets` and `.../cells` read the
cells back from the stored file. `SheetViewer` renders the grid with
spreadsheet column letters, marks the detected header row, flags held rows with
their reason, and offers the derived mapping as an overlay. When the stored
bytes have passed retention the endpoint returns 410 `FILE_NOT_RETAINED` and
the screen says the canonical rows and their provenance survive - only the
original file is gone.

**Reasoning.** The cells are read from the file, never rebuilt from the
canonical rows, because a reconstruction would show what the platform
*understood*, and what the platform understood is precisely what a disputing
officer is checking. The same reason governs rendering: the file's own mixed
date formats - `2025-07-04`, `05-07-2025`, the serial `45845` - are shown
verbatim. The one exception is a date cell, which openpyxl hands back as a
midnight datetime; the `T00:00:00` is the reader's artefact and not the file's
content, so it is dropped.

---

## D-0040 - Every heavy word keeps its ⓘ, and the term itself stays

**Evaluation.** The platform read as an instrument for people who already work
here. "Enforcement Funnel", "Parameter Explorer", "P-Score" and "coverage" are
labels for things you have already been told about.

**Decision.** Two layers. Nav labels and screen headings are written for
somebody who does not work here - "From flag to recovery", "The 34 risk flags",
"Who should we look at?" - and every heavy term on a screen carries an ⓘ that
opens a plain-language explanation from `lib/glossary.ts`. A `/guide` screen
explains the whole platform step by step, including the file formats it reads.

**Reasoning.** The department's vocabulary is not optional: a notice cites
"section 74A", not "the rule about deliberate under-declaration". So the terms
stay and an explanation sits beside them, rather than the terms being replaced
by approximations that would then be wrong in a quasi-judicial setting. The ⓘ
is a button and not a hover tooltip, because a hover explanation does not exist
on a touchscreen or a keyboard, and the people who most need it are the least
likely to find it by accident.

---

## D-0041 - Three named officers, and a refused action says who can

**Evaluation.** The shell offered a list of nine role names. Nobody outside the
department can answer "am I an Addl. Commissioner (Enforcement)?".

**Decision.** Three named demonstration officers - a Tax Officer, a Deputy
Commissioner and the Commissioner - chosen to cover the whole platform between
them. Every screen is open to all three. Where an action is not available to
the signed-in person, the control stays on screen, disabled, with `NeedsRole`
naming who can do it and offering to switch.

**Reasoning.** Hiding the control teaches the reader the feature does not exist
and leaves them no idea who to take the work to. And the difference between the
three is not a configuration accident: the officer who drafts a notice may not
approve it, and that rule is what keeps a notice defensible. A screen that
quietly hid the approval button would be hiding the most important thing about
how the platform works.

---

## D-0042 - The 34 flags are checked against the circular, and counted

**Evaluation.** The platform implements 34 audit risk parameters and the
department's circular defines 34 risk flags. Those two numbers matching proves
nothing at all.

**Decision.** `app/reference/risk_flags.py` stores the circular's own text,
verbatim, and `/alignment` puts it beside what the platform computes for each
flag - the metric, the return it reads, how the flag is set, the action point.
Choosing an engine run adds the column that cannot be argued with: how many
businesses each flag was actually evaluated for, and, where it was not, the
dataset that was missing.

**Reasoning.** A parameter that is implemented, documented and never evaluated
is doing no work. On the demonstration data the screen reports 3 of 34
evaluated, which is the screen working rather than the screen broken. The
circular's text is stored word for word and a test asserts two distinctive
phrases survive, because if somebody tidies it the screen stops being a
comparison and becomes two paraphrases agreeing with each other.

---

## D-0043 - The risk-band chart showed bands multiplied by divisions

**Evaluation.** `FactRiskSnapshot` is keyed on (jurisdiction, fy, band_kind,
band), which is what the per-office screens need. The State-wide overview
iterated those rows directly, so six divisions drew six bars all labelled LOW.

**Decision.** `_collapse_bands` sums per band across every jurisdiction in
scope, weights the means by taxpayer count, and orders the bands as a ladder
rather than alphabetically.

**Reasoning.** Read as a chart claiming to show four risk bands it was wrong
twice: the reader saw six bands where there were two, and no bar showed how
many taxpayers were in a band. The means are weighted because each stored mean
is already an average over that many taxpayers - averaging the averages gives a
two-taxpayer division the same say as a ten-taxpayer one, which on the test
fixture moves a band mean from 18.33 to 35.00.

---

## D-0044 - A one-cell banner beat a fifteen-column header

**Evaluation.** Every term in the header-detection score was a ratio, and a
ratio ignores width. A banner line reading `GSTIN 27AAJ...  Aurangabad Auto`
scores 100 on every component - wholly non-null, wholly textual, its single
label fuzzy-matches "gstin", one column of text below it is perfectly
type-consistent - and tied the real header underneath. Ties keep the first
candidate, so the banner won and every row of the file was held for a missing
period and a missing taxable value.

**Decision.** A `breadth` term counting how many labels name a canonical field,
saturating at six, weighted 3 of 11.

**Reasoning.** It surfaced on a CSV, because a CSV has no sheet structure to
fall back on, but nothing about it was CSV-specific - any file with a one-line
banner was exposed. Found by running ten differently-shaped files through
ingestion rather than by reading the scorer.

---

## D-0045 - A CSV upload never reached the CSV reader

**Evaluation.** The upload allow-list admits `.csv` and the file input offers
it, but `app/api/v1/ingestion.py` called `read_workbook` directly rather than
`read_bytes`. A CSV failed with a message about a ZIP container.

**Decision.** Both call sites dispatch on the extension through `read_bytes`.

**Reasoning.** A dispatcher that exists and is not called is worse than one
that does not exist: the allow-list promised something the reader could not
deliver, and the error named an implementation detail rather than the file.

---

## D-0046 - Ten sample filing sets, no two shaped alike

**Evaluation.** The department asked for public GST filing data to test with.
There is none: filed returns are confidential under section 158 of the CGST
Act, and anybody offering a corpus is offering something they should not have.

**Decision.** `app/seed/datasets.py` builds ten complete sets - ten businesses,
twelve months each, GSTR-1 and GSTR-3B - in ten different shapes: the portal's
export, Tally, ClearTax, Busy, Marathi headings, Hindi headings, a flat CSV, a
merged two-row header with the columns in an unhelpful order, a consultant's
file with rupee signs typed into the cells, and one with only the mandatory
columns. `MANIFEST.json` declares the expected shortfall for each.

**Reasoning.** What makes them worth having is not the numbers but the shapes:
a platform that reads only the portal's own export is a platform that works in
a demonstration. They are a fixture as well as a sample - `test_dialects.py`
asserts every dialect yields every data row, and the money survives the round
trip whether the file wrote it as `4200000.00`, `42,00,000.00` or
`Rs 42,00,000.00`.

The first run of that test found two real defects (D-0044, D-0045) and one
fault in the test data: the invented GSTINs had wrong check digits, so
ingestion refused them - correctly - and the whole file read as a platform bug.
Every GSTIN in the set now carries a real check digit, and a test asserts it.

---

## D-0047 - The InQAI design system, minus its colours for data

**Evaluation.** The department asked for the platform to carry the InQAI design
system: sovereign navy, gold and saffron, a Fraunces display face over Inter,
spring easings, glass surfaces.

**Decision.** Adopted for surfaces, type, elevation and motion. Three things
were not adopted: the status palette stays the reserved green/amber/orange/red,
the categorical series stays the validated four, and numbers still never
animate. Glass is applied to chrome - header, sidebar, popovers - and never to
a surface carrying figures.

**Reasoning.** Gold and saffron are brand colours; if a reader has to work out
whether a gold means "brand" or "serious", the palette has failed, and a test
now asserts no brand colour appears as a status or a categorical slot. A figure
read through a blur is a figure an officer will mistrust, and rightly. The dark
status values are lifted in lightness because `#d03b3b` on `#13234c` passes a
glance and fails a reading.

---

## D-0048 - The hosted model needed a User-Agent, and a failure that explains itself

**Evaluation.** Pointing the provider at Together AI returned `HTTP 403
Forbidden`, which reads as a bad key. The key was fine: the gateway rejects
urllib's default `User-Agent`. It was undiagnosable from the platform because
the error handler discarded the response body, so the message said only that
the endpoint "did not answer" - when it had answered, at length, explaining the
problem.

**Decision.** Every request identifies itself. An `HTTPError` now carries the
status and the endpoint's own words into the exception message, with anything
key-shaped replaced by `[redacted]`.

**Reasoning.** The classification is still the exception class and never the
text - the retry rule does not read the message. But "model not serverless" and
"bad key" are both 4xx and mean opposite things, and an afternoon of guessing
is the cost of throwing that away. Law 12 applies to an error message like any
other artefact: some gateways quote the offending credential straight back, and
a better diagnostic must not be the thing that writes a live key into a log.

**Note on sovereignty.** Together AI is hosted outside India. Prompts are
pseudonymised before they leave - verified: the stored prompt for a live call
contained no GSTIN and no trade name, and the business name on the officer's
screen was restored afterwards by `masker.restore()`. A production deployment
should still point `DRISHTI_LLM_BASE_URL` at a model inside the State network;
the code path is identical and only three lines of configuration change.

---

## D-0049 - Law 4 is asserted, not trusted

**Evaluation.** "The LLM is a scribe and a librarian, never a calculator" was
true and enforced only by the fidelity middleware and by everyone remembering.
That is the class of property which survives review and then quietly stops
being true three refactors later, because nothing is watching.

**Decision.** `tests/unit/test_no_llm_arithmetic.py` asserts four separate
things structurally. No agent tool contains an arithmetic AST node or
constructs a `Decimal` (parsed from `catalogue.py`, so a new tool is covered
the moment it is registered). No module outside `app/agents/` reads a
completion. The fidelity checker parses the model's numbers only to refuse
them - verified including the case one paisa out. A notice slot resolves
against the demand, and the drafting model never sees slot syntax.

**Reasoning.** The audit found the invariant already holding: the only
`Decimal()` on model text is in the checker, and nothing downstream of the
agent layer touches a completion. That is worth very little as an observation
and quite a lot as a test.

---

## D-0050 - shadcn/ui, copied in rather than depended on

**Evaluation.** The stack in CLAUDE.md names shadcn/ui, Recharts and TanStack
Table. Recharts and TanStack were installed and unused; the charts were
hand-rolled divs and there were no shared primitives at all.

**Decision.** Adopted, in the way shadcn/ui is meant to be adopted: the
components live in `src/components/ui/` and read this platform's tokens, so
`tokens.css` stays the single source of colour truth rather than a second
palette arriving with a library. Recharts draws the bars. Radix supplies the
primitives; lucide supplies the icons.

**Reasoning.** Copy-in suits a codebase whose palette is a documented,
tested contract. Three constraints survive the library: one y-axis ever,
status colour stays reserved, and `isAnimationActive` is off because a demand
figure that counts up looks like a game. There is deliberately no
`destructive` button variant - status red carries a Flag level and nothing
else, and an irreversible action is marked by its words and its confirmation
step.

---

## D-0051 - The screens fill the screen

**Evaluation.** Every page was wrapped in `max-w-6xl`. On a 1920px desk that
left two thirds of the display empty and pushed the risk distributions below
the fold, so the first thing a Commissioner saw on the landing screen was a
column of tiles and a lot of nothing.

**Decision.** Data screens are `w-full` and lay out across the width. The
landing screen leads with the money, then four stats spread across the rest of
the row, then the two score distributions and the confidence split side by
side, then the coverage caveat. Prose keeps a reading measure: the Guide is
still ~4xl, because a 1900px line of body text is not modern, it is unreadable.

**Reasoning.** The order is an argument rather than a grid fill. Money first
because that is what the screen is for; the caveat stays on the first screen
rather than moving to a footnote, since a dashboard that omits what it could
not see is claiming a completeness it does not have.

---

## D-0052 - Standard words in the sidebar, plain words on the screen

**Evaluation.** The nav had been rewritten into plain English - "From flag to
recovery" for the enforcement funnel. The department asked for the standard
terms back.

**Decision.** The sidebar carries the department's own vocabulary. The
plain-language explanation lives on each screen, in its heading and behind its
ⓘ. Twenty-two destinations are grouped into three collapsible sections, and
only the group holding the current route is open.

**Reasoning.** The department is right. An officer who works here every day
needs the term the circular uses, because that is what the training says and
what a colleague will say on the phone; being made to translate from a
friendlier name first is a cost paid every day to save a newcomer a cost paid
once. A sidebar is for navigating, not for teaching. Collapsing rather than
cutting keeps every screen one click away - nothing was removed.

---

## D-0053 - A filing is the unit an officer actually works

**Evaluation.** The platform had a screen for the year (the taxpayer file) and
a screen for the portfolio (the dashboard), and nothing for the thing on the
desk. An officer could see that a business had thirty findings across a year
but had nowhere to stand and ask "what about July?" - and July is the question,
because a notice is issued for a period.

**Decision.** W8. A list of every filing the platform holds, one row per
business per period, with its own risk profile, ordered worst first and
largest first. A detail screen putting one filing against everything known:
what the return declares, every rule that fired, **every rule that did not and
why**, and the 34 risk flags for the year - labelled as the year's, because a
flag is not evidence about July. Plus `FilingReview`: what the officer
concluded, including "nothing to do".

**Reasoning.** Three things on that screen are there because of what an officer
is asked two years later. The rules that came back clear are shown, because
justifying *not* pursuing something needs the same evidence as pursuing it and
is the harder question. "Could not be tested" is counted separately from
"nothing found", because a filing with untested rules is neither clean nor
examined. And "nothing to do" is a first-class disposition, because a platform
that records only the cases somebody opened cannot answer why they did not
open one.

A review is kept out of the audit chain and in its own table. The chain records
that an officer looked and what they did; a review records what they thought.
Both exist; conflating them would make a note look tamper-evident when it is
not.

A notice is still raised from a case, and the filing screen says so rather than
offering a shortcut: the figures in a notice are filled from a case's demand
build-up, which is what keeps them from being typed.

---

## D-0054 - A score is said in words before it is said as a number

**Evaluation.** "P-Score 0.6470588235" is not information. It is a number an
officer has to be trained to read, and the training is the thing nobody has
time for. Ten decimal places implies a precision the data does not have.

**Decision.** `ScoreMeter` leads with the plain sentence in the size that gets
read - "Some concerns", "Nothing found" - with a four-segment band bar, the
figure as *n* of 100, and the exact value small underneath and clickable for
its working. For the P-Score the coverage is inside the same component, not a
neighbouring tile.

**Reasoning.** Four segments rather than a continuous bar, because a continuous
bar invites a reader to compare two scores by eye more finely than the
underlying data supports. Coverage is inseparable because "0.65 over 3 of 34"
and "0.65 over 34 of 34" are different claims, and an officer must not have to
remember to go and check which one they are reading. The two scores remain on
separate cards and are never placed on one axis.

---

## D-0055 - GSTR-2B, and the four bugs it found

**Evaluation.** The samples carried GSTR-1 and GSTR-3B only, so the platform
had never been exercised on the credit side at all. Twelve of the fifty-seven
rules and three of the thirty-four flags read GSTR-2B, and none of them had
ever run on data.

**Decision.** `app/seed/datasets.py` now emits a GSTR-2B for each of the ten
businesses - six documents a month, twelve months, in that business's dialect -
and the GSTR-3B gained Table 4 so there is something to compare it against.
Four of the ten over-claim credit by a declared amount; six agree to the paisa.
Two documents a quarter are blocked under s.17(5), and one supplier files a
month late, because both are ordinary and both are things a rule must cope
with.

**Reasoning.** Running thirty files through the chain found four defects, and
every one of them was invisible to the unit tests because every one produced a
figure that was well-formed and wrong:

1. **A GSTR-2B was classified as a GSTR-1.** Both fingerprints scored a capped
   100 and the tie went to declaration order. The supplier GSTIN on each row
   was then read as the *filer's* own, so every supplier was registered as a
   taxpayer and ten businesses became fourteen. Fixed by giving a fingerprint
   *decisive* tokens - only an inward statement says whether ITC is available,
   only an outward return names a recipient - and comparing on an uncapped
   strength rather than on the displayed confidence.
2. **The filer's State was used as the supplier's on an inward line.** Right
   for a GSTR-1, where the filer is the supplier; exactly wrong for a GSTR-2B,
   where the filer is the buyer. Every genuine inter-State purchase was
   quarantined as "IGST charged on an intra-State supply" - 529 rows of the
   sample. The direction matters: credit vanished from view, so a demand built
   on what remained would read higher than it should. A row that names its own
   supplier is now judged on that supplier.
3. **Table 4 was read on Table 3.1's columns.** A 3B holds several tables and
   they are not the same shape - 3.1 carries a taxable-value column, 4 does
   not. Everything in Table 4 shifted one column left, putting credit under the
   wrong head. The column map is now re-read whenever a row is itself a header.
4. **Eligibility was dropped between the database and the engine.**
   `load.py` rebuilt the inward record without `itc_available`, `ims_action` or
   the supplier's filing details, so `counts_toward_2b_available` was False for
   every line and the whole 2B counted as nil credit. P14 - "ITC claimed in
   excess of GSTR-2B" - degenerated into "ITC claimed" and fired at Flag 4 on
   ten businesses out of ten. A parameter that flags everybody has stopped
   being a parameter, and this one did it while looking like a working screen.

Two further faults were in the test data rather than the platform, and the
platform caught both: CGST and SGST differing by a paisa on an intra-State
supply (each head is now rounded on its own, as the portal does), and a line
marked inter-State going to a counterparty in the same State.

---

## D-0056 - The ten datasets are a test, not a demonstration

**Evaluation.** "Validated across dummy datasets" is the kind of claim that is
true on the afternoon somebody checks and unfalsifiable afterwards.

**Decision.** `tests/integration/test_ten_datasets.py` ingests all thirty files
into one snapshot, runs the engine, and asserts the result against the
manifest: P14 must find exactly the four businesses built to over-claim, at
exactly the declared amounts, and read zero for the other six. It also asserts
that ten taxpayers are registered and not fourteen, and that nothing but the
twelve portal totals rows is held.

**Reasoning.** Each of those assertions is one of the four defects above, in
the form that would have caught it. The test that matters is not "the run
completes" - it completed throughout, with the wrong answers - but "what comes
out is what was built in".

A note on the snapshot: a taxpayer's GSTR-1, GSTR-3B and GSTR-2B must be
uploaded into the *same* snapshot or the engine never sees them together. The
upload endpoint has always accepted a `snapshot_id` for this; nothing in the
workflow said so, which is the gap the department's "returns in this case"
screen closes.

---

## D-0057 - A form name outranks a section name

**Evaluation.** Nine real filed workbooks produced **631 taxpayers from nine
filers**. The cause: a sheet called `GSTR2A_B2B` classified as a GSTR-1,
because "b2b" appears in its name and B2B is a section that exists in GSTR-1,
GSTR-2A and GSTR-2B alike. With the sheet read as an outward return, its
`GSTIN of supplier` column was taken for the filer's own, so every supplier on
every purchase register was registered as a taxpayer in its own right.

**Decision.** A fingerprint now carries `form_hints` separately from
`name_hints`. A sheet name that names the *form* - `gstr1`, `gstr2a`,
`gstr2b`, `gstr3b` - is decisive and weighted like a decisive column token. A
name that names a *section* still scores, but cannot settle the question.

**Reasoning.** This is the third instance of one defect class and the second
in a week: a tie broken by declaration order rather than by evidence. Header
breadth (D-0051) and GSTR-2B read as GSTR-1 (D-0055) were the first two. What
they share is that the wrong answer was well-formed - the run completed, the
rows balanced, the screens rendered. Six hundred phantom filers each arrive
with one return and no counterpart, so the reconciliation rules score them as
non-filers, the portfolio figures are computed over a population twenty times
too large, and the nine real taxpayers are buried among them.

GSTR-2A is read as an inward statement, which is what it is. It carries no ITC
availability column, so its lines record availability as *unstated* rather
than as available - see D-0059.

---

## D-0058 - The filer's name, when the workbook states it

**Evaluation.** The registration stub was labelled with the GSTIN, on the
stated grounds that "a GSTR-1 does not carry the filer's legal name". True of
the portal's own monthly export. Not true of the whole-year exports the
department actually receives, every one of which opens with
`Company Name : RALGAN LIFE SCIENCES PRIVATE LIMITED`.

**Decision.** `banner.legal_name_from` reads the name from the title block
under the same two rules that keep `owner_gstin_from` honest: only sparse rows
are read, never a data row; and the value must sit beside a name label. A
workbook naming several filers gives its name to none of them, because the
banner names one company and no row can be matched to it with confidence. A
value that is itself a GSTIN is refused.

**Reasoning.** Reading a name the file states is not inventing one. The
alternative - nine taxpayers named after their own GSTINs in every worklist
and in the address block of anything drafted - is honest and unusable, and
unusable is its own kind of dishonest on a screen an officer has to act from.

---

## D-0059 - Descriptive insight, and the line it must not cross

**Evaluation.** The department asked what else the filed data could show. The
34 flags answer *who should we audit*; the 57 rules answer *what can we
demand*. Neither answers the question an officer actually asks first, which is
*what does this business look like* - where the purchases come from, what
rates are declared, when credit notes are issued.

**Decision.** A new W9 screen, six panels, all descriptive: supplier
concentration, counterparties appearing on both sides, rate mix, credit-note
intensity by month, where the credit is evidenced, and declared outward value
by month. Each panel states on screen what it is and what it does not mean. No
figure is compared against a threshold, because the department has published
none for any of these shapes.

**Reasoning, and the line.** A descriptive number placed beside a demand
screen will be read as a finding unless the screen refuses that reading out
loud. Concentration in one supplier is not an offence; a single-supplier
business is ordinary. Ten counterparties who are both customer and supplier is
not circular trading; a manufacturer buys from its own distributor. So these
panels carry no `calc_id`: there is no rule behind them to resolve to, and
minting one would dress a description as an adjudication.

Provenance holds by the other route. Every figure is a sum of ingested rows
and every figure drills to exactly those rows, each carrying its `prov_id` -
file, sheet, row, original cells. The ninety-second path is unchanged.

Two details are load-bearing. A share with no denominator is absent rather
than zero: "nothing was purchased" is not "nothing came from this supplier".
And a rate is printed as stored - 0.25% is a real GST rate, and a chart
rounding it to 0% would describe supplies that do not exist.

**On GSTR-2A.** A 2A has no ITC-availability column at all. Its lines are
reported as *availability not stated*, never as available. Reporting them as
available would manufacture an assurance the file never gave.

---

## D-0060 - Unused sections are marked, not deleted

**Evaluation.** The department asked for the unused sections to be commented
out. Against nine filed workbooks, roughly half the destinations have nothing
to show: no officer allocation extract, no cases, no notices, no sector
classification.

**Decision.** `/coverage/screens` reports, per screen, whether the canonical
table it reads holds any row, and the sidebar marks an unsupported screen with
a "no data" chip and the dataset it is waiting for. Nothing is removed and
nothing is hidden.

**Reasoning.** Taking them out of the code would be the wrong reading of the
request. The same platform run against a full departmental extract needs every
one of them, and a screen deleted today is a capability nobody can ask for
tomorrow. What the department was actually objecting to is a nav that gives
twenty-three destinations equal weight when the data supports nine - which is
a marking problem, not a deletion problem.

The check is a count, never an inference from zeros. "Every figure is zero"
and "the dataset was never supplied" look identical on a chart and mean
opposite things (Law 5). A screen with no hard dependency - the Guide, the
upload screen, the rule library, the alignment table - is absent from the list
rather than declared available, because listing it would make the flag
meaningless.

---

## D-0061 - A serial number is not a figure

**Evaluation.** Table 4 of a GSTR-3B is built out of headings and subtotals as
well as lines. The reader already knew a row with nothing numeric on it is
structural and skipped it - D-0035. On the portal's own monthly export that
works. On a whole-year export it does not, because those carry a running
serial number in the first column:

    ['7', 'April', 'Total ITC Available (A)']

The "7" reads as money, so a subtotal heading looked like a line carrying
figures and was reported as an unreadable 3B line. Five such rows a month is
sixty a year per filer - and they crowd out the real failures, which is
exactly what the structural-row rule exists to prevent.

**Decision.** `_carries_a_figure` now asks the question of the tax-head
columns only, never of the serial number or the month beside the label.

**Reasoning.** The generosity within those columns is kept deliberately: a
line showing only zeros is a real line of the return that happens to be nil,
and must read as nil rather than be skipped. Only a row with nothing numeric
*under a head* is structural.

---

## D-0062 - "We have not built this" is not "we could not read your file"

**Evaluation.** A filed workbook carries thirty-two sheets. The platform has a
canonical table for most of them. For four it does not: GSTR-1 Table 13 (the
document-series register), the HSN summary, the challan register, and the
GSTR-7 TDS/TCS statements. Those sheets fell through to whichever fingerprint
scored highest, and their rows then failed one field at a time.
`GSTR1_DocIssued` was read as a transaction sheet and every row was held with
**"not a numeric literal after cleaning"**, because `Sr. No. From` is
`ST/2526/0000001` - an invoice series, not a number. Four hundred and three
rows of one workbook, each reported as though the department's file were
malformed.

**Decision.** An `OUT_OF_SCOPE` list, checked *before* scoring, returning
family `NOT_INGESTED`. Its rows are held under a new reason code
`SHEET_NOT_INGESTED` naming the form and saying the gap is ours.

**Reasoning.** It had to be an exclusion rather than a fingerprint, because a
fingerprint could not win: `GSTR1_DocIssued` genuinely *is* a GSTR-1 sheet and
scores as one, so any evidence-weighing contest is lost before it starts. The
sheet is out of scope for a reason that has nothing to do with which return it
belongs to.

Law 5 is unchanged - every row still lands somewhere with a reason, and the
counts still reconcile. What changed is that the reason is now true. "We could
not read your file" and "we have not built this yet" are different statements,
and only one of them tells an officer what to do next.

---

## D-0063 - An opening balance is not a transaction

**Evaluation.** The electronic cash ledger opens and closes every month with a
marker row carrying no date, because there is no date: it is the state of the
account before anything happened, not something that happened. The platform
required `as_on` of it and held 192 rows across the nine workbooks as
"required field(s) absent: as_on".

A second fault sat beside it: `Transaction Type (Debit/Credit)` matched the
money synonym `credited`, so the word "Credit" was read as an amount and every
real movement failed too.

**Decision.** `transaction_type` claims that header; `as_on` learns the
spellings the department's exports use; and a ledger row whose description
cell reads "Opening Balance" or "Closing Balance" is held as a marker, named
as one, rather than as a row with a missing field.

**Reasoning.** The marker is matched on a cell's whole value, never on a
substring of the row, because the word "balance" appears in the balance
columns of every real movement - matching loosely would have skipped the
ledger entirely, which is the failure mode this fix exists to avoid.

**Open, and needing a departmental decision.** The real cash ledger carries
**head-wise** amount and balance columns - `Amount (Dr/Cr) Integrated Tax`,
`Central Tax`, `State Tax`, `Cess` - while the canonical `ledger_movement`
model holds `credited` / `debited` / `opening` / `closing` as scalars. That
model collapses the heads, which Law 3 forbids. Reshaping a canonical table is
not a bug fix and is not mine to make: flagged here, not worked around. Until
it is decided, the ledger is read for its movement rows and the head-wise
detail is not stored.

---

## D-0064 - A bill of entry has no supplier GSTIN

**Evaluation.** GSTR-2B sections IMPG and IMPGSEZ, and the GSTR-2A equivalent
IMPGOS, record import of goods. The credit arises on a bill of entry filed
with Customs; the counterparty is not a registered person under the Act, so
the line names a port code and a bill number where a supplier GSTIN would be.
The platform required `supplier_gstin` on every inward line and therefore held
all of them - 43 lines in the first workbook alone, one of them carrying
Rs 4,87,604 of integrated tax.

**Decision.** `_missing_required` drops `supplier_gstin` from the requirement
for import sections only, matched on the sheet name. A B2B line with no
supplier is still held.

**Reasoning.** The direction of the error is what makes this a correctness
defect rather than an untidiness. P14 compares ITC *claimed* in the GSTR-3B
against ITC *available* in the GSTR-2B. Losing available credit makes the gap
look **larger** than it is, so the flag reads higher than the facts support
and a demand built on it would overstate. That is the same shape as the
eligibility defect in D-0055: credit vanishing silently, in the direction that
harms the taxpayer.

The exemption is deliberately narrow. An ordinary inward line with no supplier
is a real defect - there is no way to tell whose compliance the credit rests
on - and a test pins that it is still held.

---

## D-0065 — The v3 build pack is installed, and the v2 pack is archived not deleted

**Evaluation.** The v3 pack renumbers: its `01` is the RULEBOOK where v2's `01`
was DOMAIN_AND_RISK, its `03` is the PLATFORM_SPEC where v2's `03` was the UI
spec. Installing it over the top would have left a docs directory where half
the cross-references pointed at the wrong document.

**Decision.** v2's numbered files move to `docs/v2/`; v3 installs at `docs/`.
`DECISIONS.md` and `VERIFICATION.md` stay where they are - they are this
repository's own running record, not part of either pack.

**Reasoning.** The v2 pack is the provenance of everything built so far. Sixty
four decisions in this file cite it by section number, and deleting it would
turn every one of those citations into a dead reference.

---

## D-0066 — The product keeps the name it was given, not the pack's

**Evaluation.** The v3 pack's `CLAUDE.md` is titled GST DRISHTI. The platform
was renamed to GST Intelligence one session earlier, on instruction.

**Decision.** The pack's constitution is installed with its content intact and
its name replaced.

**Reasoning.** A spec's cover page is not its content. Undoing an explicit
instruction because a later document happened to use the earlier name would be
following the wrong authority.

---

## D-0067 — GSTIN position 14 accepts Z, D and C

**Evaluation.** The validator required the literal `Z`. `Z` is the ordinary
taxpayer; `D` is a s.51 deductor and `C` is a s.52 collector, so the validator
rejected every government department in India. `docs/07` Part C3 records it
flagging two BSF units on the real workbook.

**Decision.** `GSTIN_RE` accepts `[ZDC]` at position 14, and
`REGISTRATION_CLASS` names what each one is. The refusal message now names all
three rather than asserting that the character must be `Z`.

**Reasoning, and what it recovered.** This is a Phase 0 gate in `docs/05` and
it was failing. On the real data it releases 12 held rows carrying four
deductor registrations - including **`09AAATI7021F1D5`, IWAI's own**, which is
the third-party corroboration `docs/07` Finding 1 rests on: GSTR-7 shows TDS
deducted on payments of Rs 3,66,75,640 in December and again in March, which
is how the engine knows the supply was performed and paid for and only its
characterisation changed. Rejecting the GSTIN discarded the evidence.

The widening is exactly three characters. A test asserts every other letter is
still refused, because "accept anything at position 14" would lose the
checksum's whole purpose.

---

## D-0068 — The date transposition is detected, and ambiguity is refused

**Evaluation.** A producing tool wrote `dd-mm-yyyy` into a sheet an `mm-dd`
locale opened. Excel parsed the cells it could - day 12 or less - and silently
swapped day and month; it left the rest as strings. The column looks fine.

**Decision.** `app/ingestion/transposition.py`, pure, returning `CERTAIN`,
`ABSENT` or `AMBIGUOUS`. `CERTAIN` only when every string cell has day > 12
**and** every datetime cell has day <= 12, in both directions.

**Reasoning.** One datetime with day > 12 proves Excel did not swap that cell;
one string with day <= 12 proves Excel could have parsed it and did not.
Either breaks the explanation, and a broken explanation may not be acted on -
so the column is quarantined for a human instead. A wrong correction here is
worse than a refusal because it is silent.

**Verified against the fixture.** On SSR Marine's IRN Date column: 1,408
strings with days 13-31, 635 datetimes with days 1-12, verdict `CERTAIN`.
Reading it naively produces 314 negative IRN lags - an acknowledgement before
its own invoice - and 250 breaches of the Rule 48(4) thirty-day window.
Corrected: **0 and 0**. `docs/07` Part C1 states 314 to 0 and 250 to 0. It
reproduces to the row.

**Not yet load-bearing, and the order matters.** No synonym maps the IRN
*date*, so the column is dropped at mapping and the platform cannot currently
produce those 250 notices - nor run `G-03`/`G-04`, which need it. The detector
must be wired before `irn_date` is mapped, or the 250 arrive with the mapping.
Recorded in `docs/GAP_V3.md` rather than left to be rediscovered.

---

## D-0069 — The ten invariants are gates, not rules

**Evaluation.** Law 4 of the pack puts `I-01` to `I-10` before every check. The
distinction that matters is what an invariant is *for*: it asserts a fact that
cannot be false in a well-formed document, not a fact about whether the
taxpayer complied.

**Decision.** `app/ingestion/invariants.py`. A row failing one is quarantined
and is invisible to every check, parameter and join.

**Reasoning, and the line drawn in the module docstring.** An IRN dated
before its own invoice is impossible; an IRN dated ninety days late is a
`G-04` finding. The first is quarantined, the second must reach an officer.
Quarantining the second would make a real breach invisible, which is the
opposite of what this layer is for - so every invariant has a test asserting
it stays quiet on data that is merely unusual, and `I-04` skips nil-rated
lines entirely rather than asserting `0 x 0 == 0` on every exempt supply.

The cost of a wrong invariant is not a wrong finding. It is a *missing* one,
and nobody notices a missing finding.

---

## D-0070 — The match ladder refuses to cross counterparties

**Evaluation.** `docs/02` Part B specifies five rungs from exact to fuzzy.
The failure mode that matters is not matching too little - unmatched rows sit
in their own bucket where an officer sees them - it is matching too much,
because a confident pairing between two unrelated documents is wrong in a way
nothing on screen reveals.

**Decision.** The counterparty must agree on every rung, including L3 and L4.
Two documents from different suppliers are never the same document however
identical their number, date and value.

**Reasoning.** L3 matches on value and a fifteen-day window with no document
number to lean on. Without the counterparty constraint that rung would pair
invoices across suppliers on value alone, which is exactly how a
reconciliation tool produces confident nonsense. Two rows with no counterparty
at all - import lines, which have none by nature - do not match each other
either, or every bill of entry would pair with every other.

`normalise_doc_no` strips leading zeros; `digits_of` reads the **original**
string. X-02 ties credit note `CNM118` to invoice `1118` by digit
containment, and a normaliser applied to both sides would destroy the only
link between them.

---

## D-0071 — X-01's exposure is every later line, not the two that contradict

**Evaluation.** The detection is the contradiction; the question is what the
contradiction is worth.

**Decision.** The exposure is every line to that counterparty at the lower
rate for the whole year.

**Reasoning, with the arithmetic.** Restricting it to the two contradicting
invoices gives Rs 47.7 lakh. The correct base is Rs 14,67,02,560 at 5%, and
the differential at 18% is **Rs 1,90,71,332.80**. `docs/07` Finding 1 states
Rs 1,90,71,333, which is that to the rupee.

Verified twice: against the live ingestion of the workbook, which returned
19071332.80 on a base of 146702560.00, and by
`tests/engine/test_worked_case_x01.py`, which transcribes the sequence from
the document so the assertion commits without taxpayer data.

**And what it is not.** X-01 identifies a rate *dispute*. The taxpayer
classified the supply themselves, twice, four days apart, and may be able to
justify the second. The card says so and the finding routes to **ASMT-10 for
the contract**, never to a DRC-01A. The strongest family in the rulebook is
the one that must be most careful about what it claims.

---

## D-0072 — A proviso not implemented is a wrong rule, not a cautious one

**Evaluation.** `docs/07` Part C2: Rule 86B fired on two months with zero cash
against seven crore of turnover, and a demand of Rs 2,61,545. Clause (d) of
the first proviso exempts anyone already above 1% *cumulative* cash for the
year; April's payment put them at 12.99% and the figure never fell below
3.5%. Rule 86B does not bite in any month of that file.

**Decision.** `app/engine/exemptions.py`. A TESTABLE exemption suppresses the
finding and records the arithmetic that settled it. An UNTESTABLE one leaves
the figure standing but drops it to ADVISORY with the question attached.

**Reasoning.** Never silently ignore an exemption, and never silently apply
one. A suppression an officer cannot see is indistinguishable from a rule
that did not run, so the suppression carries its own observed figures and
renders as its own card.

---

## D-0073 — Netting keeps the exposure-direction finding, not the larger one

**Evaluation.** `docs/07` Part D: April under-claimed Rs 22.67 lakh, May
over-claimed Rs 22.01 lakh. One carry-forward event, net Rs 66,222.

**Decision.** `app/engine/netting.py` collapses opposing same-rule deltas
inside a three-period window, and the finding that survives is the one with
the largest **signed** delta - the exposure direction.

**Reasoning.** April's under-claim is larger in magnitude, so a
largest-absolute rule would keep it. But an under-claim is the taxpayer
claiming less than they were entitled to: it is not a demand and no officer
would open it. The over-claim is the finding; the under-claim is what reduces
it. Both figures stay on the card with the periods named, because an officer
asked why Rs 22 lakh became Rs 66,000 must see the arithmetic.

What must not net is tested more heavily than what must: two shortfalls in
the same direction stay two, deltas six months apart stay two, and different
rules never net against each other however neatly the rupees cancel.

---

## D-0074 — The scorecard has five states and refuses an unexplained abstention

**Evaluation.** The officer's unit of work is a filing, not a taxpayer.

**Decision.** `app/engine/scorecard.py`, per (GSTIN, period), with the annual
roll-up computed separately. `Cell.__post_init__` raises if a
`NOT_EVALUATED` or `NEEDS_DOCUMENT` cell carries no reason.

**Reasoning.** The scorecard's entire value is that a reader can tell "I
looked and it is fine" from "I could not look". An unexplained abstention
reads as a pass to anyone scanning a twelve-column grid, so the object will
not let one be constructed at all - it is cheaper to fail at the point of
construction than to find out from a notice.

`is_the_sum_of_the_monthlies` returns False and is rendered on screen rather
than left as a comment, because a twelve-column grid with a thirteenth column
invites exactly that assumption. Netting, s.16(4), Rule 37A cut-offs and
annual true-ups are FY-level tests no monthly cell can see.

---

## D-0075 — GSTR-2A and GSTR-2B were conflated, and it was my doing

**Evaluation.** `docs/06` point 7: *"Ingest both, keep them separate, and never
reconcile 3B against 2A - 2B is the statutory gate under s.16(2)(aa). 2A is
for supplier behaviour (filing status, Rule 37A); 2B is for entitlement.
Conflating them is a defect that will be found on reply."*

They were conflated. D-0057 made `GSTR2A_*` sheets classify into the `GSTR2B`
**family** so a sheet named `GSTR2A_B2B` would stop being read as an outward
return. That fixed 631 phantom taxpayers and created this: `source_form` was
defaulted to `GSTR2B` rather than recorded, so every 2A row was stored as a 2B
row.

**What it cost.** On the ingested SSR Marine workbook:

    GSTR-2B   4,678 rows   Rs 14,72,18,156.94
    GSTR-2A   4,772 rows   Rs 14,11,52,211.94
    combined  9,450 rows   Rs 28,83,70,368.88   <- what the engine saw

Available ITC roughly doubled. P14 and B-01 ask whether ITC **claimed**
exceeds ITC **available**; against a doubled denominator they cannot fire. A
silent false negative across all nine taxpayers, and across every taxpayer
the platform would ever ingest.

That is the worst shape a defect can take. Nothing on screen was wrong -
there was simply nothing on screen, and no count anywhere reconciled to
something a reader could have questioned.

**Decision.** The family decision stands: 2A and 2B carry the same columns
and want the same mapping, and undoing it brings back 631 phantom taxpayers.
What was wrong was defaulting the **source form**. `_inward_source_form`
reads it from the sheet's own name, which is the only place the distinction
survives - nothing in the data itself says which statement a row came from.

A sheet naming neither defaults to `GSTR2B`, because that is the statutory
gate and treating an unknown inward row as entitlement is the conservative
direction: it can only reduce a claimed-versus-available gap, never invent
one.

**What this does not fix.** B-04 (Rule 37A) still cannot run. It needs the
supplier's **GSTR-3B filing status**, the column `docs/06` calls the most
valuable in the workbook, and there is no field for it on `inward_line` and
no synonym mapping it. `docs/07` Finding 2 is Rs 95,79,967 and `CERTAIN`,
and it stays dark until that column is carried. Recorded in `docs/GAP_V3.md`
rather than left implicit.

---

## D-0076 — The catalogue count is derived, not restated

**Evaluation.** Registering the X family broke four tests that asserted
`len(RULES) == 57`. They were right to break: the catalogue changed.

**Decision.** The tests now assert the v2 catalogue is intact
(`57` rules not starting with `X-`) and that the X family is registered
alongside it. The library API and the demo-dataset tests derive their counts
from `RULES` rather than restating a literal.

**Reasoning.** A literal count in two places is a count that will disagree
with itself. Deriving it means the library screen cannot silently list fewer
rules than the engine runs, which is the failure those tests existed to
catch in the first place.

`rules_x` is imported in `runner.py` alongside the others, so the registry no
longer depends on which test happened to import what. A registry that
reports different catalogues to different callers is not a registry.

---

## D-0077 — B-04 Rule 37A, and the column that makes it computable

**Evaluation.** `docs/07` calls Rule 37A the highest-yield rule per hour of
engineering: one join, one column, Rs 95,79,967, `CERTAIN`, and nothing asked
of the taxpayer. It was dark because `inward_line` had no field for the
supplier's own GSTR-3B filing status and no synonym mapped the column.

**Decision.** `supplier_3b_filed` on `inward_line` (migration 0006), the
synonym `gstr 3b filing status`, carried through coercion, persistence and
the loader, and `app/engine/rules_b.py` with the check itself.

**Three-valued, never two.** `True` and `False` are the supplier's status as
GSTR-2A records it. `None` means the column was absent - which is every
GSTR-2B row, because 2B does not carry it - and B-04 returns `NOT_EVALUATED`
naming what it needed. Defaulting an absent status to "filed" would silently
clear the highest-yield check in the rulebook on the majority of rows, and
nothing on screen would say so.

**Verified against the live workbook.**

    GSTR2A_B2B invoices, supplier 3B unfiled   Rs 95,79,967.02
    plus the B2BA amendment                    Rs  2,68,664.76
    less the credit note, correctly signed     Rs     -1,344.00
    = B-04 as the engine reports it            Rs 98,47,287.78

    29 suppliers - docs/07 says 29.
    SSR Shipyard 27ABQCS3690E1ZW: Rs 77,99,266.80
      - docs/07 says Rs 77,99,267. Exact to the paisa.

The B2B-only component is `docs/07`'s figure exactly. The engine's headline
differs because it also reads the amendment and the credit note, which the
document's table does not - and which is the more complete answer.

**A defect found while writing it.** The first version summed `row.tax` over
every defaulting row, which *added* credit notes to the exposure. Inward
credit notes are stored positive and signed at the identity layer, never at
the row layer, so a Rule 37A demand would have been inflated by the very
documents that reduce it. Signed explicitly, with the reason in the code.

**The figure is gross.** It must be reduced by any reversal already made, and
the engine cannot net the two: a Table 4(B)(2) total does not say which
invoices it covered. On this file the Rs 80.05 lakh August reversal cannot
cover October and November invoices, but that is a reading of dates rather
than arithmetic the engine can do in general. The card asks for the reversal
working and says why.

---

## D-0078 — The invariants are wired last in coercion, first before rules

**Evaluation.** Law 4 is about ordering, and the ordering is the whole
protection: a row that fails an invariant must be invisible to every rule,
not merely flagged for one.

**Decision.** `check_invariants` runs as the final gate in `ingest_sheet`,
after coercion and validation and before the canonical record exists. A
failure quarantines under a new `INVARIANT_FAILED` reason carrying the
invariant id and the contradicting fields.

**Reasoning.** Placing it earlier would test uncoerced strings; placing it in
the rules would mean every rule reading a transposed date column repeats the
same mistake the last one made. One gate, once, before anything downstream
can see the row.

The quarantine record carries `violation.observed` merged into the original
cells, so an officer sees the contradiction itself - `irn_date 2025-12-01`
against `doc_date 2026-01-12` - rather than an invariant number they would
have to look up.

---

## D-0079 — The transposition detector is wired, and `irn_date` lands after it

**Evaluation.** The detector was written, proven against the reference
workbook, and never called. `docs/GAP_V3.md` recorded why: `irn_date` was not
mapped, so the platform could not produce the 250 false Rule 48(4) notices -
and could not run `G-03` or `G-04` either. The mapping and the detector had to
land in that order or the capability would arrive with the defect.

**Decision.** `_column_verdicts` runs over every mapped date column before a
single row is coerced, `CERTAIN` columns are put back the way the taxpayer
wrote them, and only then is `irn_date` mapped (migration 0007).

**Why whole columns and not rows.** The signature - every text cell a day
above 12, every parsed cell a day of 12 or less - exists only in the column.
No row can show it. A row-by-row check would have been convenient and would
have diagnosed nothing.

**Measured on the reference workbook after wiring:**

    GSTR1_B2B    CERTAIN  635 cells      GSTR2B_B2B   CERTAIN  501 cells
    GSTR1_CDN    CERTAIN   71 cells      GSTR2B_CDNR  CERTAIN   14 cells
    GSTR2A_B2B   CERTAIN  597 cells      GSTR2A_CDN   CERTAIN   14 cells
                                         1,832 cells in all

    5,954 lines carry an IRN date.
    Acknowledgements dated before their own invoice:  0   (docs/07: 314 -> 0)
    This taxpayer's own documents reported late:      0   (docs/07: 250 -> 0)

    Rows in 12,449 = parsed 11,777 + held 593 + duplicates 79.

Both of `docs/07` part C1's figures reproduce exactly. The seven remaining
thirty-day breaches are all on inward sheets - other suppliers' e-invoices,
which is their obligation and not this taxpayer's, and is a finding about
counterparties rather than a false positive here.

**Held rows did not go up.** 593 before the column was mapped and 593 after.
Mapping it added a capability and cost nothing.

---

## D-0080 — A second signature: the row contradicts itself and the swap fixes it

**Evaluation.** The first version of this correction missed `GSTR2A_CDN`.
Fourteen credit notes, every date falling between the 4th and the 10th of its
month, so Excel parsed all fourteen, nothing was left as text, and the
partition had nothing to partition. The column read `ABSENT` - while every
value in it was still wrong.

Nine of the fourteen then failed `I-01` and were quarantined, which is Law 4
working: no fabricated finding was built on them. But the other five were
stored with a date the taxpayer never wrote, and nothing on screen said so.
A held row is a refusal an officer can see. A silently wrong date is not.

**Decision.** A second, independent signature. The row's own document date is
a witness - an acknowledgement cannot precede the document it acknowledges -
and if the naive reading contradicts it, and swapping every swappable cell in
the column leaves no contradiction anywhere, the swap is the explanation.

The two signatures must agree. Either alone can say `CERTAIN`; either alone
saying `AMBIGUOUS` overrules the other. The question is not whether there is
*an* explanation but whether any part of the column is left unexplained.

**The safety property is that silence is the default.** A clean column offers
no contradiction, so this route has no evidence, so it cannot correct
anything - however small the column. The signal only ever fires on data that
is already contradicting itself.

**A witness must prove itself first.** Either a parsed cell with a day above
12, which no swap could have produced, or no parsed cell at all, because
nothing was parsed and so nothing was swapped. A column of parsed cells that
all fall in the first twelve days cannot vouch for anything: that is exactly
the shape a fully transposed column has, and two swapped columns agree with
each other perfectly while both being wrong.

**Independently reproduced.** On `GSTR1_B2B` the witness route alone, with no
reference to how cells are stored, finds 314 contradictions and resolves all
314 - the same number `docs/07` reports from the other signature entirely.
`GSTR2A_CDN` goes 9 to 0, and the nine `I-01` quarantines disappear because
they were a symptom of the same defect rather than nine bad documents.

Only one witness pair is declared, `irn_date` against `doc_date`, because it
is the only one the rulebook states. Inventing others is how a correct column
gets "corrected".

---

## D-0081 — Two defects found while threading `irn_date` through the loader

Neither is about dates. Both surfaced because adding a field to
`OutwardRecord` meant reading the loader line by line.

**The loader never read `is_amendment`.** `persist` writes it, the column
exists, and `_outward` in `app/engine/load.py` did not carry it - so every
outward line reached the engine with `is_amendment=False`. Two of the three
call sites survived it by testing `row.is_amendment or row.section ==
"AMENDMENT"`, and the section *was* carried. The third did not.

**`X-01` tested only the flag.** `rules_x.py` excluded amendments with `not
row.is_amendment` alone, so with the loader dropping the flag it excluded
nothing: an amendment would have been compared against the very line it
amends, and the rate difference between them read as a self-contradiction.

It did not fire on the reference workbook because that file has no outward
amendment sheet - `GSTR1_B2BA` is absent - so `X-01` still reproduces
`docs/07` Finding 1 to the paisa. The next file with a B2BA sheet would have
produced a fabricated finding, and the figure it produced would have looked
entirely reasonable.

Both fixed: the loader carries the column, and the test is factored into
`_amends_something`, which checks both spellings and says why.

---

## D-0082 — Correcting D-0075, and finishing the fix it started

**What D-0075 got right.** GSTR-2A rows were stored with `source_form` set to
`GSTR2B`, because the field was defaulted rather than read from the sheet
name. 13,501 rows across the portfolio carried the wrong label. That was real
and it is fixed.

**What D-0075 got wrong.** It said the conflation meant *"P14 and B-01 - ITC
claimed in excess of 2B - could not fire on any taxpayer"*, and gave
Rs 28,83,70,368.88 as the credit the engine believed was available. Measured
against the ingested data, that is not what happened:

    bucket ignoring the statement label   Rs 12,92,86,091.72
    bucket honouring it                   Rs 12,92,86,091.72

The two are identical, and ITC-01 fires on eight of twelve periods on the
reference taxpayer. The Rs 28.84 crore was the raw sum of every inward row
in both statements; it was never what the Rule 88D comparison used.

**Why not.** `counts_toward_2b_available` requires `itc_available is True`,
and that column is `ITC Availability`, which only GSTR-2B carries. A 2A
export has `GSTR-3B Filing Status` in its place. So all 4,772 2A rows arrived
with `itc_available` unset and were already failing the bucket test.

**Accident is not a control, so the fix stands and is now complete.** The
exclusion was a side effect of one vendor's column layout. A 2A export from a
tool that did emit an availability column would have doubled the credit the
comparison is made against, and nothing on screen would have said so.
`counts_toward_2b_available` now requires `source_form == "GSTR2B"` - one
line, at the single definition site every affected check reads.

**And `present_datasets` now reports by statement.** It added `gstr2b`
whenever any inward row existed, so a 2A-only upload satisfied
`requires=("gstr2b",)` and ITC-01 would have compared a 3B claim against a
bucket of zero and reported the whole of it as excess. It now reports `gstr2b`
and `gstr2a` separately, so such a file abstains - and `B-04`, which declares
`requires=("gstr2a",)`, can finally have that requirement met.

The correction is recorded rather than edited into D-0075 because the log is
append-only, and a reader following the reasoning is entitled to see that the
first diagnosis overstated its own consequence.

---

## D-0083 — Coverage is computed, not asserted

**Evaluation.** `Coverage` and its four states existed in the scorecard and
nothing produced them. A check that could not run and a check that ran and
found nothing both render as silence, and Law 5 turns on telling them apart.

**Decision.** `app/engine/coverage.py`, pure, one state per GSTR-1 section and
one per whole dataset, computed from the taxpayer's own data and handed to
`build_scorecard` by the runner. Twelve cards per taxpayer per year, built on
every run.

**`NIL_BY_IDENTITY` is the only one that is an inference**, and it is
narrow. 3B table 3.1 is auto-populated from GSTR-1, so if the sections present
sum head-wise and exactly to the 3.1 outward liability, nothing else was
filed: B2C, exports and advances are nil rather than unknown, and every check
over them is computable. Measured on the reference taxpayer, eight of twelve
months reconcile that way and four do not.

Four things it refuses to do, each with a test:

* **No tolerance.** A rupee out and nothing is nil. A tolerance here would be
  a threshold nobody voted for, applied to closing files.
* **Head-wise.** An IGST line declared as CGST plus SGST sums to the same
  scalar and is a different tax to a different government. `TaxVector`
  equality already refuses it; Law 3 requires that it does.
* **An empty return cannot prove itself nil.** Zero equals zero and proves
  nothing, and a file with no outward rows is exactly the file whose GSTR-1
  may never have been uploaded.
* **Only GSTR-1.** The same arithmetic on the inward side is not an identity,
  it is check B-01. Reading a match there as proof that the unseen sections
  are nil would use the answer to a question to decide whether the question
  may be asked.

`PRESENT_EMPTY` is reserved for a dataset held for the year but not for this
period. That distinction is not pedantry: `ABSENT` is a question for whoever
did the upload and `PRESENT_EMPTY` is a question for the taxpayer.

---

## D-0084 — The tier is on the registry, and the runner enforces it

**Evaluation.** `app/engine/tiers.py` defined AUTO / ASSISTED / MANUAL / CASE,
`DocumentCall` and `ChecklistItem`, and nothing produced any of them. A check
that cannot compute a rupee figure had two options, both bad: invent one, or
say nothing and be read as a clean pass.

**Decision.** `RuleSpec` carries `tier`, defaulting to `AUTO` because all 57
v2 rules compute a head-wise figure from the returns alone. A check function
may return `Finding`, `DocumentCall` or `ChecklistItem` - one registry, one
execution order, so "every check appears on the scorecard" stays true by
construction rather than by remembering.

**What the runner enforces, and what it does not.** The tier constrains what a
check may *assert*, never whether it may abstain. A `DocumentCall` goes to the
call book, a `ChecklistItem` to the checklist, and a **triggered** `Finding`
is refused unless the check is `AUTO` - that is the output which carries a
rupee figure to a notice. A `CLEAR` or `NOT_EVALUATED` finding is safe from
any tier and is exactly what keeps a dark check visible.

That distinction was found by getting it wrong. The first version rejected
every `Finding` from a non-AUTO check, which also rejected the engine's own
"ran and found nothing" row - so X-03 and X-04 produced two rule errors and
no scorecard rows at all. The synthetic `clear` is the engine's statement
about the check, not the check's output, and no tier forbids it.

`may_score` already excludes ASSISTED from the F-Score, and the unquantified
exposure is shown beside the score rather than inside it. A score that moved
with how much the engine could not see would be measuring the wrong thing.

---

## D-0085 — X-03 and X-04 ask; X-05 is X-01's complement

**X-03, ASSISTED, and the tier is the design.** `docs/01` states the test as
two rates on one HSN in one period **with no rate notification effective in
that period**. The first limb is arithmetic. The second needs an
effective-dated rate master, which the platform declares as a seam (`OUT-07`)
and does not hold.

The rate structure changed on **22 September 2025**, inside the year under
scrutiny, so the exclusion this check cannot apply is not hypothetical - for
September it is the likely explanation. A rupee finding emitted without it
would be a demand resting on a notification the engine never read. So it
computes the differential, shows it as `unquantified_exposure`, and asks for
the notification relied on. Law 5 expressed as a tier rather than as silence.

**X-04, ASSISTED, because goods or service is a contract question.** The
return carries an HSN and a value, not what was supplied. Two lines of
identical value to one counterparty under a goods chapter and a service SAC is
a real signal - and is also what a supply of goods plus its installation looks
like. A figure attached to that judgement would be a guess wearing a rupee
sign.

**Both abstain by name where the HSN is absent**, which on the reference
workbook is everywhere: the portal's B2B export has no HSN column, it is in
Table 12, and the platform recognises Table 12 without ingesting it. Returning
nothing would have read as a clean pass on every real file.

**X-05 double-counted X-01 and now cannot.** As first written it fired
Rs 95,35,666.40 against X-01's Rs 1,90,71,332.80 on the same taxpayer - same
counterparty (IWAI, `09AAATI7021F1ZW`), same two rates, and its evidence rows
were a strict subset of X-01's. An officer reading both cards would have seen
Rs 2.86 crore where there is Rs 1.91 crore.

The division of labour is the window, and it is structural rather than a
suppression. X-01 argues two lines are one supply because they are days apart;
X-05 argues it because they are the third and fourth identical milestone of a
contract, which needs no window. So X-05 takes exactly the breaks X-01's
window excludes, and the two figures can never overlap. On the reference file
X-05 is now `CLEAR` - correctly, because that break is four days wide and
belongs to X-01.

Same exposure rule as X-01: every milestone at the lower rate, not the pair
either side of the break. `docs/01` is explicit that confining it is what
turns Rs 1.91 crore into Rs 47.7 lakh.

**One cosmetic fix with a real edge.** Rates were rendered
`5.0000000000%` in the narrative that goes onto a notice. `_rate()` normalises
them. A trailing-zero decimal there reads as a machine's output rather than a
department's statement.

---

## D-0086 — A document call is a number too

**Evaluation.** `DocumentCall.unquantified_exposure` is a figure an officer
reads off a call-book entry and may quote in a letter asking for the document.
It had no `calc_id`, no formula and no way back to the rows it came from.

Law 2 does not have a tier exemption. "Unquantified" is a statement about what
the platform will do with the figure - it will not turn it into a demand - not
about whether anyone may ask where it came from.

**Decision.** `DocumentCall` carries a `CalcTrace` exactly as a `Finding`
does, and `X-03` builds one: the parameter it used, the count of lines at the
lower rate, the taxable base, the differential, and the formula as executed.

Found while writing `docs/VERIFICATION.md` - which is the argument for keeping
that file honest rather than flattering.

---

## D-0087 — G1 widened to `app/matching`

`CLAUDE.md` names three trees where a float literal fails the build:
`app/engine`, `app/ingestion` and `app/matching`. The lint guarded eight trees
and `app/matching` was not among them, because the lint predates the directory.

It matters more there than the omission suggests. The match ladder decides
which two rows are the same document, and a rounded value or an edit-distance
ratio computed in binary float would make that decision non-reproducible: the
same snapshot pairing differently on a different machine, and the paired
comparison every finding rests on quietly ceasing to be paired.

Clean on the first run across all nine trees.
