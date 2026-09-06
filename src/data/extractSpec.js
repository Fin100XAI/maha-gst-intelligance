/* ---------------------------------------------------------------------------
 * FIELD-LEVEL EXTRACT SPECIFICATION
 *
 * The column list to hand to GSTN, NIC and the divisions for the 500-case
 * pilot. Every field states its format, its source, whether it is mandatory,
 * and which engine it unlocks — so a data owner can see what their column is
 * for rather than being asked for "whatever you have".
 *
 * THE TRAP TO AVOID: 500 CASES IS NOT 500 TAXPAYERS
 *
 * Every graph engine needs the counterparties of the case taxpayers, and the
 * counterparties of those. An extract of exactly 500 GSTINs truncates every
 * network at the sample boundary, so every chain appears to end and no
 * circular pattern can close. The pilot needs the case taxpayers plus at least
 * one hop of counterparties — realistically several thousand GSTINs — with
 * full return and registration detail on the first hop and identity fields at
 * minimum on the second.
 *
 * Requesting 500 rows and expecting network intelligence is the single most
 * likely way for this pilot to produce a null result for the wrong reason.
 *
 * FIELD NAMES AND FORMATS
 *
 * Where a field corresponds to a published GST form the form is named. Where a
 * name is a convention proposed for this extract rather than an official
 * schema field, it is marked as such — the department should map it to
 * whatever the source system actually calls it rather than assume the name
 * below exists.
 * ------------------------------------------------------------------------- */

export const CONVENTIONS = [
  { id: 'dates', rule: 'All dates ISO 8601 (YYYY-MM-DD), no times, no timezone offsets.', why: 'Limitation is computed in UTC. A local-midnight timestamp serialises to the previous day and moves every statutory deadline back by one, which is the kind of error that is only found in appeal.' },
  { id: 'nulls', rule: 'Distinguish null, zero and not-applicable. Use empty for unknown, 0 only for a true zero.', why: 'The anomaly engine uses median absolute deviation. Nulls delivered as zeros collapse the peer median and make genuinely extreme entities look ordinary.' },
  { id: 'amounts', rule: 'Amounts in rupees as integers, no formatting, no lakh/crore abbreviation.', why: 'Mixed units across divisions is the most common cause of a figure being wrong by a factor of one hundred.' },
  { id: 'gstin', rule: 'GSTIN as the 15-character identifier, uppercase, unpadded.', why: 'It is the join key across every file in the extract.' },
  { id: 'periods', rule: 'Tax period as YYYY-MM for monthly and YYYY-YY for the financial year.', why: 'Limitation attaches to the financial year, not the month, and mixing the two silently misassigns deadlines.' },
  { id: 'encoding', rule: 'UTF-8, comma-separated or Parquet, one file per entity type, header row required.', why: 'Devanagari trade names are common and a non-UTF-8 export corrupts them irrecoverably.' }
]

const F = (name, type, example, mandatory, source, unlocks, note, official) =>
  ({ name, type, example, mandatory, source, unlocks, note, official })

export const FILES = [
  {
    id: 'registration',
    file: 'registration.csv',
    label: 'Registration & identity',
    owner: 'GSTN — registration database',
    priority: 1,
    scope: 'Case taxpayers plus all counterparties to one hop, identity fields at minimum for the second hop.',
    why: 'This file is the spine. Without it no engine can traverse between registrations, and four of the fifteen engines cannot run at all.',
    fields: [
      F('gstin', 'char(15)', '27AAAPZ1234A1Z5', true, 'GSTN', 'All', 'Primary key across the extract.', true),
      F('pan', 'char(10)', 'AAAPZ1234A', true, 'GSTN', '1, 3, 6, 15', 'The highest-value field in this specification. Groups registrations to a common holder — the basis of every shell-network finding.', true),
      F('legal_name', 'text', 'Shivneri Textiles Private Limited', true, 'GSTN', '3, 8', '', true),
      F('trade_name', 'text', 'Shivneri Textiles', false, 'GSTN', '8', '', true),
      F('constitution', 'enum', 'Private Limited Company', true, 'GSTN', '3', 'Proprietorship, partnership, company, LLP, HUF, AOP.', true),
      F('registration_date', 'date', '2023-04-12', true, 'GSTN', '3, 5', 'Drives the new-registration indicator and cohort analysis.', true),
      F('status', 'enum', 'Active', true, 'GSTN', '3, 4', 'Active, suspended, cancelled, provisional.', true),
      F('cancellation_date', 'date', '', false, 'GSTN', '3', 'Required where status is cancelled. Links to the cancelled-registration PAN indicator.', true),
      F('principal_address', 'text', '', true, 'GSTN', '3, 6', 'Full address including PIN, not a district label.', true),
      F('address_pin', 'char(6)', '411001', true, 'GSTN', '3, 6', 'Separate column, not embedded in the address string — shared-premises detection joins on it.', false),
      F('promoter_pan', 'char(10) list', 'AAAPZ1234A;BBBPZ5678B', true, 'GSTN', '1, 3, 6, 15', 'Directors, partners or proprietor. Semicolon-separated where several. This is how connected registrations inherit exposure.', true),
      F('promoter_name', 'text list', '', true, 'GSTN', '3, 6', 'Aligned index-for-index with promoter_pan.', true),
      F('authorised_signatory_pan', 'char(10)', '', false, 'GSTN', '3, 6', 'Frequently the strongest linkage field in shell networks, because a single signatory serves many registrations.', true),
      F('contact_email', 'text', '', false, 'GSTN', '6', 'Value is in collisions across registrations, not in the address itself.', true),
      F('contact_mobile', 'char(10)', '', false, 'GSTN', '6', 'As above.', true),
      F('nature_of_business', 'text', '', false, 'GSTN', '6', '', true),
      F('hsn_declared', 'text list', '', false, 'GSTN', '2', 'Declared at registration. Supports the economic-substance test against what is actually invoiced.', true),
      F('jurisdiction_division', 'text', 'Pune Division', true, 'Departmental', '7', 'Must match the division names used in the officer establishment file exactly.', false),
      F('jurisdiction_range', 'text', '', false, 'Departmental', '7', '', false)
    ]
  },
  {
    id: 'returns',
    file: 'returns_period.csv',
    label: 'Returns — period level',
    owner: 'GSTN — returns',
    priority: 3,
    scope: 'All periods for the last 36 months for every GSTIN in the registration file.',
    why: 'One row per GSTIN per period. Thirty-six months turns a snapshot into a trajectory, which is the whole of engine 5 and materially improves 4 and 13.',
    fields: [
      F('gstin', 'char(15)', '', true, 'GSTN', 'All', '', true),
      F('tax_period', 'char(7)', '2025-06', true, 'GSTN', 'All', 'YYYY-MM.', true),
      F('financial_year', 'char(7)', '2025-26', true, 'GSTN', '12', 'Limitation attaches here, not to the month.', true),
      F('gstr1_filed_on', 'date', '', false, 'GSTN', '5', 'Null where not filed. Do not substitute a zero.', true),
      F('gstr3b_filed_on', 'date', '', false, 'GSTN', '5', 'Filing lateness is a trajectory feature, not a flag.', true),
      F('outward_taxable_value', 'integer', '4820000', true, 'GSTN', '4, 5, 6', 'GSTR-1.', true),
      F('output_tax', 'integer', '867600', true, 'GSTN', '4, 6', 'CGST + SGST + IGST combined, with the split below.', true),
      F('itc_availed', 'integer', '812000', true, 'GSTN', '1, 4, 6', 'GSTR-3B table 4A.', true),
      F('itc_reversed', 'integer', '0', false, 'GSTN', '1', 'Reversal behaviour distinguishes a correction from a pattern.', true),
      F('tax_paid_cash', 'integer', '55600', true, 'GSTN', '4, 6', 'The cash-versus-credit split is the strongest single ratio in the risk set.', true),
      F('tax_paid_credit', 'integer', '812000', true, 'GSTN', '4, 6', '', true),
      F('refund_claimed', 'integer', '0', false, 'GSTN', '4', '', true),
      F('itc_2b_available', 'integer', '', false, 'GSTN', '1', 'GSTR-2B auto-populated. The gap against itc_availed is the ineligible-credit signal.', true),
      F('nil_return_flag', 'boolean', 'false', false, 'GSTN', '5', '', true)
    ]
  },
  {
    id: 'invoice',
    file: 'invoice_flow.csv',
    label: 'Invoice-level supply flow',
    owner: 'GSTN — GSTR-1 / 2B',
    priority: 4,
    scope: 'All B2B invoices for the case taxpayers and their first-hop counterparties, last 24 months.',
    why: 'Propagation between GSTIN layers cannot be traced from period aggregates. This file is what turns cluster-level exposure into a credit chain with named hops.',
    fields: [
      F('supplier_gstin', 'char(15)', '', true, 'GSTN', '1, 2, 8', '', true),
      F('recipient_gstin', 'char(15)', '', true, 'GSTN', '1, 2, 8', 'The edge. Without both ends there is no graph.', true),
      F('invoice_number', 'text', '', true, 'GSTN', '8', 'Evidence must name a document, not a period.', true),
      F('invoice_date', 'date', '', true, 'GSTN', '1, 2, 8', '', true),
      F('taxable_value', 'integer', '', true, 'GSTN', '1, 2', '', true),
      F('tax_amount', 'integer', '', true, 'GSTN', '1', '', true),
      F('hsn_code', 'text', '', false, 'GSTN', '2', 'Economic substance: goods invoiced against goods the entity is registered to deal in.', true),
      F('place_of_supply', 'char(2)', '27', false, 'GSTN', '8', 'State code.', true),
      F('reverse_charge_flag', 'boolean', '', false, 'GSTN', '1', '', true),
      F('amended_flag', 'boolean', '', false, 'GSTN', '2', 'Amendment patterns distinguish error from construction.', true)
    ]
  },
  {
    id: 'proceedings',
    file: 'proceedings.csv',
    label: 'Notices, cases and proceedings',
    owner: 'GSTN Back Office / departmental',
    priority: 2,
    scope: 'Every proceeding against the 500 case taxpayers, open and closed, for the last 10 years.',
    why: 'Ten years, not the pilot window. The outcome tier needs history, and history cannot be collected retrospectively later.',
    fields: [
      F('case_id', 'text', '', true, 'Departmental', 'All', '', false),
      F('gstin', 'char(15)', '', true, 'GSTN', 'All', '', true),
      F('financial_year', 'char(7)', '2019-20', true, 'Departmental', '12', 'The period the demand relates to — drives limitation.', false),
      F('section', 'enum', '73', true, 'Departmental', '11, 12', '73, 74, 74A, or the relevant provision.', true),
      F('proceeding_type', 'enum', 'DRC-01', true, 'Departmental', '8, 12', 'ASMT-10, DRC-01, DRC-07, ADT-01 and so on. Use the form number.', true),
      F('issued_on', 'date', '', true, 'Departmental', '12', '', true),
      F('due_on', 'date', '', false, 'Departmental', '12', '', true),
      F('demand_amount', 'integer', '', true, 'Departmental', '4, 13', 'As raised, before any appellate variation.', true),
      F('notification_relied_on', 'text', '56/2023-CT', false, 'Departmental', '12', 'Where an extended limitation period was applied. Identifies exposure to the pending Supreme Court decision.', false),
      F('status', 'enum', '', true, 'Departmental', 'All', '', true),
      F('assigned_officer_id', 'text', '', false, 'Departmental', '7', 'Joins to the establishment file.', false)
    ]
  },
  {
    id: 'outcomes',
    file: 'outcomes.csv',
    label: 'Adjudication and appellate outcomes',
    owner: 'Departmental — adjudication, appeals, recovery',
    priority: 2,
    scope: 'Every concluded proceeding for the last 10 years, not only those against the 500.',
    why: 'This is the file that cannot be bought later. Four engines depend on it and none of them can be validated in the pilot without it. The three fields below marked critical are the ones that decide whether a model learns why demands hold up or merely who the taxpayer was.',
    fields: [
      F('case_id', 'text', '', true, 'Departmental', '9, 11, 13, 14', '', false),
      F('outcome', 'enum', 'Confirmed', true, 'Departmental', '9, 11, 14', 'Confirmed, reduced, set aside, remanded, dropped, withdrawn.', false),
      F('outcome_date', 'date', '', true, 'Departmental', '9, 13', '', false),
      F('ground_of_decision', 'enum', 'Merits', true, 'Departmental', '9, 11, 14', 'CRITICAL. Merits, limitation, procedural defect, jurisdiction, quantum. Mixing a case lost on limitation with one lost on merits trains a model on two different questions at once.', false),
      F('fraud_sustained', 'boolean', '', true, 'Departmental', '11', 'CRITICAL. Whether suppression or wilful misstatement was actually held, not whether Section 74 was invoked. Charging habits are not wins.', false),
      F('evidence_relied_on', 'text list', '', true, 'Departmental', '11, 14', 'CRITICAL. What was produced and accepted. This is the only field that describes why a demand held up — every other field describes the taxpayer.', false),
      F('demand_confirmed_amount', 'integer', '', true, 'Departmental', '13', 'As finally sustained, which is rarely the amount raised.', false),
      F('amount_recovered', 'integer', '', true, 'Departmental', '13', 'Actually collected. Turns the recovery curve from an assumption into an observation.', false),
      F('recovery_completed_on', 'date', '', false, 'Departmental', '13', 'The lag between order and collection is itself a finding.', false),
      F('appeal_filed', 'boolean', '', false, 'Departmental', '9, 14', '', false),
      F('appeal_forum', 'enum', '', false, 'Departmental', '9', 'Appellate Authority, Tribunal, High Court, Supreme Court.', false),
      F('appeal_outcome', 'enum', '', false, 'Departmental', '9, 14', '', false)
    ]
  },
  {
    id: 'eway',
    file: 'eway_bill.csv',
    label: 'E-way bill movement',
    owner: 'NIC',
    priority: 4,
    scope: 'All e-way bills for the case taxpayers and first-hop counterparties, last 24 months.',
    why: 'Goods movement against declared supply is one of the few economic-substance tests available without a physical visit.',
    fields: [
      F('ewb_number', 'char(12)', '', true, 'NIC', '2, 8', '', true),
      F('generated_on', 'date', '', true, 'NIC', '2', '', true),
      F('supplier_gstin', 'char(15)', '', true, 'NIC', '1, 2', '', true),
      F('recipient_gstin', 'char(15)', '', false, 'NIC', '1, 2', '', true),
      F('invoice_value', 'integer', '', true, 'NIC', '2', '', true),
      F('distance_km', 'integer', '', false, 'NIC', '2', 'Implausible distance against vehicle and time is a substance signal.', true),
      F('vehicle_number', 'text', '', false, 'NIC', '2, 6', 'Vehicle reuse across unrelated entities is a linkage signal.', true),
      F('cancelled_flag', 'boolean', '', false, 'NIC', '2', '', true)
    ]
  },
  {
    id: 'establishment',
    file: 'officers.csv',
    label: 'Officer establishment',
    owner: 'Departmental — establishment',
    priority: 3,
    scope: 'All field officers in the divisions covered by the pilot.',
    why: 'Capacity is modelled as a constrained assignment under territorial and role eligibility. Without the posting table the deployment findings cannot be computed at all.',
    fields: [
      F('officer_id', 'text', '', true, 'Departmental', '7', '', false),
      F('role', 'enum', 'Audit Officer', true, 'Departmental', '7', 'Determines which case types the officer may take.', false),
      F('division', 'text', '', true, 'Departmental', '7', 'Must match registration.jurisdiction_division exactly.', false),
      F('range', 'text', '', false, 'Departmental', '7', '', false),
      F('sanctioned_strength_flag', 'boolean', '', false, 'Departmental', '7', 'Distinguishes a vacant post from an absent one — a vacancy is a different decision from a deployment gap.', false)
    ]
  }
]

export const LEGAL_CONSTRAINTS = [
  {
    id: 'bank',
    item: 'Bank and account signals',
    position: 'Deliberately excluded from this specification.',
    note: 'The brief lists bank signals "where lawfully available". That qualifier does the work: access is constrained and varies by instrument. It should be scoped separately with the Legal Branch and only then added, rather than assumed into a data request and discovered to be unavailable after the extract is built.'
  },
  {
    id: 'pii',
    item: 'Promoter PAN and personal identifiers',
    position: 'Required, and to be handled as personal data.',
    note: 'Promoter PAN and name identify natural persons. They belong in the extract because the linkage capability depends on them, but access should be role-restricted, logged, and the retention period fixed in advance rather than left open.'
  },
  {
    id: 'purpose',
    item: 'Purpose limitation',
    position: 'State it in the request.',
    note: 'The extract is for building and validating risk intelligence for the department. Saying so in the request is what allows a data owner to approve it quickly instead of escalating.'
  }
]

export const SCOPE_NOTE =
  'The 500 cases define the sample, not the extract. Every graph engine needs the counterparties of the case taxpayers and, for anything closing a circular pattern, the counterparties of those. An extract of exactly 500 GSTINs truncates every network at the sample boundary — every chain appears to end and no cycle can close, so the engines return nothing for a reason that has nothing to do with the taxpayers. Registration and returns detail is needed for the case taxpayers and their first hop; identity fields alone suffice for the second. Expect several thousand GSTINs rather than five hundred.'

const allFields = FILES.flatMap(f => f.fields)

export const SPEC_SUMMARY = {
  fileCount: FILES.length,
  fieldCount: allFields.length,
  mandatoryCount: allFields.filter(f => f.mandatory).length,
  criticalCount: allFields.filter(f => (f.note || '').startsWith('CRITICAL')).length,
  byOwner: [...new Set(allFields.map(f => f.source))].map(o => ({ owner: o, count: allFields.filter(f => f.source === o).length }))
}
