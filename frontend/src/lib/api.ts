/**
 * The API client.
 *
 * Every monetary value arrives as a string and stays one. No response is
 * passed through `JSON.parse` into a `number` for a rupee field, and nothing
 * here does arithmetic — if a total is needed, the server computes it and
 * attaches a `calc_id`.
 */

const BASE = import.meta.env.VITE_API_BASE ?? '/api/v1'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * The development identity.
 *
 * Until OIDC is wired to the State SSO, the server reads the caller from these
 * headers — and refuses to do so outside development. Nothing here is a
 * security control: authorisation is enforced at the query layer on the
 * server, and an out-of-scope GSTIN comes back 404 whatever this says.
 */
function identityHeaders(): Record<string, string> {
  try {
    const role = window.localStorage.getItem('drishti.role') ?? 'STO'
    const divisions = window.localStorage.getItem('drishti.divisions') ?? ''
    return {
      'X-Officer-Id': window.localStorage.getItem('drishti.officer') ?? 'dev.officer',
      'X-Officer-Role': BACKEND_ROLE[role] ?? role,
      ...(divisions === '' ? {} : { 'X-Officer-Divisions': divisions }),
    }
  } catch {
    return { 'X-Officer-Id': 'dev.officer', 'X-Officer-Role': 'STO' }
  }
}

/** The UI's role names, mapped to the server's. */
const BACKEND_ROLE: Record<string, string> = {
  JOINT_COMMISSIONER: 'DEPUTY_JOINT_COMMISSIONER',
  ADDL_COMMISSIONER: 'ADDL_COMMISSIONER_ENFORCEMENT',
}

type Init = Omit<RequestInit, 'headers'> & { headers?: Record<string, string> }

async function request<T>(path: string, init?: Init): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...identityHeaders(), ...(init?.headers ?? {}) },
  })
  if (!response.ok) {
    let code = `HTTP_${String(response.status)}`
    let message = response.statusText
    try {
      const body = (await response.json()) as { detail?: { code?: string; message?: string } }
      code = body.detail?.code ?? code
      message = body.detail?.message ?? message
    } catch {
      // A non-JSON error body: the status line is all we have.
    }
    throw new ApiError(response.status, code, message)
  }
  return (await response.json()) as T
}

// ---------------------------------------------------------------------------
// shapes
// ---------------------------------------------------------------------------

export interface KpiTile {
  metric: string
  title: string
  /** Money and ratios are strings. */
  value: string
  unit: 'count' | 'money' | 'ratio' | 'percent' | 'days' | 'months'
  note?: string
  drill: string
}

export interface BandRow {
  band: string
  taxpayer_count: number
  p_score_mean?: string | null
  p_coverage_mean?: string | null
  f_score_mean?: string | null
  drill: string
}

export interface Coverage {
  evaluated: number
  total: number
  coverage: string
  dark_parameters: string[]
  awaiting_feeds: string[]
  taxpayers: number
  sentence: string
}

export interface Overview {
  engine_run_id: string
  as_of: string
  fy: string | null
  jurisdiction: string | null
  kpi: KpiTile[]
  risk_landscape: { p_bands: BandRow[]; f_bands: BandRow[]; note: string }
  revenue_at_risk_by_confidence: {
    confidence: string
    value: string
    drill: string
    note?: string
  }[]
  coverage: Coverage
  expected_filings: number
}

export interface ParameterRow {
  param_id: string
  title: string
  banding: string
  direction: string
  weight: string
  action_point: string
  metric: string
  external_feed: string | null
  roadmap_ref: string | null
  related_rules: string[]
  flags: Record<string, number>
  not_evaluated: number
  drill: Record<string, string>
}

export interface ParameterMatrix {
  engine_run_id: string
  jurisdiction: string | null
  items: ParameterRow[]
  note: string
}

export interface MetricSpec {
  id: string
  title: string
  group: string
  formula: string
  grain: string
  unit: string
  source: string
  drill_dimension: string
  head_wise: boolean
  note: string | null
}

export interface DrillRow {
  gstin: string
  legal_name: string | null
  trade_name: string | null
  division: string | null
  officer_id: string | null
  p_score: string | null
  p_coverage: string | null
  p_band: string | null
  f_score: string | null
  f_band: string | null
  p_calc_id: string | null
  f_calc_id: string | null
  href: string
}

export interface DrillResult {
  metric: MetricSpec
  bucket: string
  engine_run_id: string
  total: number
  page: number
  size: number
  items: DrillRow[]
}

export interface TraceStep {
  label: string
  expression: string
  inputs: Record<string, unknown>
  result: unknown
}

export interface ParameterUse {
  parameter_id: string
  key: string
  value: string
  effective_from: string | null
  notification_ref: string | null
  provisional: boolean
}

export interface SourceRow {
  id: string
  resolved: boolean
  reason?: string
  file_name?: string
  file_sha256?: string
  sheet_name?: string
  row_index?: number
  original_cells?: Record<string, string | null>
}

export interface CalcTrace {
  calc_id: string
  kind: string
  subject_id: string
  snapshot_id: string
  gstin: string | null
  period: string | null
  fy: string | null
  legal_basis: string | null
  formula_template: string | null
  formula_rendered: string | null
  inputs: Record<string, unknown>
  steps: TraceStep[]
  parameters: ParameterUse[]
  evidence_ids: string[]
  result: unknown
  engine_version: string
  params_version: string
  sources: SourceRow[]
  engine_run_id: string | null
}

export interface FlagRow {
  param_id: string
  title: string
  banding: string
  direction: string
  action_point: string
  value: string | null
  /** null means NOT_EVALUATED. It is never a zero. */
  flag: number | null
  status: string
  missing_inputs: string[]
  external_feed: string | null
  roadmap_ref: string | null
  excluded_from_score: boolean
  cohort: { p50: string | null; p75: string | null; p90: string | null; n: number | null }
  related_rules: string[]
  calc_id: string | null
}

export interface FindingRow {
  id: string
  rule_id: string
  title: string
  status: string
  severity: string
  confidence: string
  dimension: string
  period: string | null
  legal_basis: string | null
  delta: { igst: string; cgst: string; sgst: string; cess: string }
  interest: string
  penalty: string
  missing_inputs: string[]
  suppressed_by: string | null
  suggested_form: string | null
  calc_id: string
  formula_rendered: string | null
}

export interface TaxpayerFile {
  engine_run_id: string
  taxpayer: {
    gstin: string
    legal_name: string
    trade_name: string | null
    division: string | null
    range: string | null
    officer_id: string | null
    sector_code: string | null
    aato: string | null
    qrmp: boolean
    status: string
  }
  scores: {
    p_score: string | null
    p_evaluated: number | null
    p_of: number
    p_band: string | null
    p_calc_id: string | null
    f_score: string | null
    f_band: string | null
    f_calc_id: string | null
    note: string
  } | null
  flag_ladder: FlagRow[]
  findings: FindingRow[]
  scope: string
}

// --- D2 to D9 -------------------------------------------------------------

/** Law 5's shape on the wire: named, never a zero. */
export interface NotEvaluatedBlock {
  status: string
  value: null
  missing_inputs: string[]
  note: string
  detail?: string | undefined
}

export interface FilingPeriodRow {
  period: string
  expected: number
  filed: number
  on_time: number
  late: number
  not_filed: number
  nil: number
  barred: number
  near_bar: number
  return_types: string[]
  compliance_rate: string | null
  on_time_rate: string | null
  non_filer_share: string | null
  nil_share: string | null
  rates_evaluated: boolean
  drill: { on_time: string; late: string; not_filed: string }
}

export interface FilingView {
  engine_run_id: string
  jurisdiction: string | null
  periods: FilingPeriodRow[]
  totals: {
    expected: number
    filed: number
    on_time: number
    late: number
    not_filed: number
    nil: number
    barred: number
    near_bar: number
    compliance_rate: string | null
    on_time_rate: string | null
  }
  compliance: NotEvaluatedBlock | null
  bar: {
    barred: number
    near_bar: number
    drill: { barred: string; near_bar: string }
    note: string
  }
  note: string
}

export interface RevenuePeriodRow {
  period: string
  turnover: string | null
  liability: string | null
  cash_paid: string | null
  itc_utilised: string | null
  cash_ratio: string | null
  itc_ratio: string | null
  itc_to_turnover: string | null
  effective_rate: string | null
  evaluated: boolean
  drill: string
}

export interface RevenueView {
  engine_run_id: string
  jurisdiction: string | null
  periods: RevenuePeriodRow[]
  series: NotEvaluatedBlock | null
  boundary: { period: string; on: string; label: string; note: string }
  note: string
}

export interface RiskBandRow {
  band: string
  taxpayer_count: number
  revenue_at_risk: string
  p_score_mean: string | null
  p_coverage_mean: string | null
  f_score_mean: string | null
  drill: string
}

export interface RiskView {
  engine_run_id: string
  jurisdiction: string | null
  p_bands: RiskBandRow[]
  f_bands: RiskBandRow[]
  revenue_at_risk_by_confidence: {
    confidence: string
    value: string
    drill: string
    note: string
  }[]
  note: string
}

export interface FunnelView {
  engine_run_id: string
  jurisdiction: string | null
  steps: {
    stage: string
    label: string
    count: number
    share_of_previous: string | null
    share_of_flagged: string | null
    drill: string
  }[]
  months: {
    month: string
    flagged: number
    selected: number
    notices_issued: number
    demand_raised: string
    demand_collected: string
    drill: string
  }[]
  money: {
    demand_raised: string
    demand_confirmed: string
    demand_collected: string
    confirmation_rate: string | null
    collection_rate: string | null
  }
  note: string
}

export interface JurisdictionsView {
  engine_run_id: string
  items: {
    jurisdiction: string
    taxpayers: number
    revenue_at_risk: string
    compliance_rate: string | null
    barred_periods: number
    drill: string
    href: string
  }[]
  note: string
}

export interface OfficersView {
  engine_run_id: string
  jurisdiction: string | null
  items: {
    officer_id: string
    jurisdiction: string | null
    cases_open: number
    cases_closed: number
    notices_pending_approval: number
    mean_age_days: string | null
    demand_raised: string
    demand_collected: string
    case_mix: Record<string, number>
    months: string[]
    drill: string
  }[]
  note: string
}

export interface SectorsView {
  engine_run_id: string
  items: {
    sector: string
    taxpayers: number
    p_score_mean: string | null
    f_score_mean: string | null
    revenue_at_risk: string
    cohort_usable: boolean
    drill: string
  }[]
  min_cohort: number
  note: string
}

// --- S2 library, S3 admin, W5 cases, W6 notices ---------------------------

export interface RuleRow {
  rule_id: string
  title: string
  family: string
  dimension: string
  legal_basis: string
  severity: string
  confidence: string
  requires: string[]
  parameters: string[]
  relates_to: string[]
  suggested_form: string | null
  threshold_note: string | null
}

export interface ParameterSpecRow {
  param_id: string
  title: string
  metric: string
  metric_description: string
  banding: string
  direction: string
  weight: string
  action_point: string
  data_sources: string[]
  requires: string[]
  external_feed: string | null
  roadmap_ref: string | null
  related_rules: string[]
  excluded_from_score: boolean
}

export interface ThresholdRow {
  owner: string
  key: string
  value: string
  value_type: string
  unit: string | null
  effective_from: string | null
  effective_to: string | null
  notification_ref: string | null
  provisional: boolean
  note: string | null
}

export interface GapsView {
  unconfigured_statutory: {
    count: number
    items: { parameter_id: string; missing: string; todo_ref: string; status: string }[]
    note: string
  }
  provisional_thresholds: {
    count: number
    items: {
      owner: string
      key: string
      value: string
      value_type: string
      effective_from: string | null
      note: string | null
    }[]
    note: string
  }
  dark_parameters: {
    count: number
    items: {
      param_id: string
      title: string
      external_feed: string | null
      roadmap_ref: string | null
    }[]
    note: string
  }
}

export interface CaseRow {
  case_id: string
  gstin: string
  legal_name: string | null
  division: string | null
  fy: string
  type: string
  status: string
  officer_id: string | null
  finding_count: number
  section_applied: string | null
  scn_deadline: string | null
  order_deadline: string | null
  days_to_limitation: number | null
  notices: { notice_id: string; form: string; status: string; din: string | null }[]
  href: string
}

export interface NoticeRow {
  notice_id: string
  case_id: string
  gstin: string
  form: string
  status: string
  din: string | null
  reply_due: string | null
}

export interface NoticeTemplateRow {
  form: string
  language: string
  title: string
  legal_basis: string
  reply_days: number
  slots: string[]
  preconditions: string[]
}

// --- W1 worklist, W2 planner, W3 registry, S1 ingestion, W7 copilot -------

export interface RegistryRow {
  gstin: string
  legal_name: string
  trade_name: string | null
  division: string | null
  officer_id: string | null
  sector_code: string | null
  aato: string | null
  status: string
  p_score: string | null
  p_coverage: string | null
  p_evaluated: number | null
  p_band: string | null
  f_score: string | null
  f_band: string | null
  p_calc_id: string | null
  f_calc_id: string | null
  href: string
}

export interface RegistryView {
  engine_run_id: string
  total: number
  page: number
  size: number
  sort: string
  descending: boolean
  items: RegistryRow[]
  scope: string
  note: string
}

export interface RegistryFacets {
  divisions: string[]
  officers: string[]
  sectors: string[]
  p_bands: string[]
  f_bands: string[]
  sortable: string[]
}

export interface WorklistRow {
  finding_id: string
  rule_id: string
  title: string
  gstin: string
  legal_name: string
  division: string | null
  officer_id: string | null
  period: string | null
  fy: string | null
  severity: string
  confidence: string
  dimension: string
  legal_basis: string | null
  delta: { igst: string; cgst: string; sgst: string; cess: string }
  interest: string
  suggested_form: string | null
  calc_id: string
  may_populate_notice: boolean
  disposition: string | null
  href: string
}

export interface WorklistView {
  engine_run_id: string
  total: number
  page: number
  size: number
  items: WorklistRow[]
  scope: string
  note: string
}

export interface CandidateRow {
  gstin: string
  legal_name: string
  division: string | null
  officer_id: string | null
  p_score: string | null
  p_coverage: string | null
  p_evaluated: number | null
  p_of: number
  p_band: string | null
  f_score: string | null
  f_band: string | null
  p_calc_id: string | null
  href: string
}

export interface CandidatesView {
  engine_run_id: string
  total: number
  page: number
  size: number
  filters: Record<string, string | number | null>
  items: CandidateRow[]
  note: string
}

export interface SelectionRow {
  selection_id: string
  at: string
  by: string
  fy: string | null
  basis: string | null
  rationale: string | null
  gstins: string[]
  count: number
}

export interface UploadCounts {
  rows_in: number
  parsed: number
  quarantined: number
  duplicates: number
  reconciles?: boolean
}

export interface UploadSheetRow {
  sheet_name: string
  sheet_index: number
  detected_type: string | null
  confidence: number | string | null
  header_row_index: number | null
  status: string
  counts: UploadCounts
  unmapped_headers?: string[]
}

export interface QuarantinedRowView {
  sheet_name: string
  row_index: number
  reason_code?: string
  reason: string
  field?: string | null
  field_name?: string | null
  original_cells: Record<string, string | null> | null
}

export interface UploadResult {
  committed: boolean
  upload_id?: string
  snapshot_id?: string
  filename?: string
  stored_as?: string
  sha256?: string
  size_bytes?: number
  owner_gstin: string | null
  owner_gstin_source: string | null
  hint: { code: string; message: string; remedy: string } | null
  counts: UploadCounts
  sheets: UploadSheetRow[]
  quarantine: QuarantinedRowView[]
  reconciles?: boolean
  note?: string
}

export interface UploadListRow {
  upload_id: string
  filename: string
  sha256: string
  size_bytes: number
  uploaded_by: string
  uploaded_at: string
  status: string
  sheet_count: number
  rows_in: number
  rows_parsed: number
  rows_quarantined: number
  rows_duplicate: number
  reconciles: boolean
}

export interface AgentSpecRow {
  key: string
  title: string
  tools: { name: string; description: string }[]
  allows_ungrounded_numbers: boolean
}

export interface AgentAnswer {
  call_id: string
  agent: string
  text: string
  fidelity: { ok: boolean; checked: number; calc_ids: string[] }
  model: string
  tokens: number
  latency_ms: number
  badge: string
}

export interface ReconCell {
  period: string
  identity_id: string
  status: string
  delta: { igst: string; cgst: string; sgst: string; cess: string }
  delta_total: string
  missing_inputs: string[]
  consequence: string | null
  note: string | null
  calc_id: string
}

export interface ReconciliationView {
  engine_run_id: string
  gstin: string
  periods: string[]
  identities: { identity_id: string; title: string }[]
  cells: ReconCell[]
  counts: Record<string, number>
  note: string
}

export interface RegisterRow {
  id: string
  owner: string
  key: string
  value: string
  value_type: string
  unit: string | null
  effective_from: string
  effective_to: string | null
  notification_ref: string | null
  source_note: string | null
  approved_by: string | null
  approved_at: string | null
  status: 'PROVISIONAL' | 'DEPARTMENT' | 'NOTIFIED'
  in_force: boolean
}

export interface RegisterView {
  count: number
  by_status: Record<string, number>
  items: RegisterRow[]
  note: string
}

export interface SheetCellRow {
  index: number
  cells: (string | null)[]
  held: { reason_code: string; reason: string } | null
}

export interface SheetView {
  upload_id: string
  filename: string
  sheet_name: string
  sheet_index: number
  detected_type: string | null
  header_row_index: number | null
  mapping: Record<string, string> | null
  total_rows: number
  start: number
  width: number
  rows: SheetCellRow[]
  note: string
}

export interface SheetListRow {
  sheet_name: string
  sheet_index: number
  detected_type: string | null
  header_row_index: number | null
  status: string
  rows_in: number
}

// ---------------------------------------------------------------------------
// endpoints
// ---------------------------------------------------------------------------

/* --------------------------------------------------------- engine runs */

export interface EngineRunRow {
  engine_run_id: string
  snapshot_id: string
  as_of: string
  fy: string | null
  status: string
  triggered_by: string
  started_at: string
  gstin_count: number
  finding_count: number
  engine_version: string
  params_version: string
}

/* ----------------------------------------------------------- alignment */

/** One of the department's 34 risk flags, beside what the platform does. */
export interface AlignmentRow {
  label: string
  param_id: string
  /** The circular's own words, stored verbatim. */
  source_text: string
  /** The same thing in ordinary language. No authority. */
  plain: string
  implemented: boolean
  platform: {
    title: string
    computes: string
    data_sources: string[]
    how_flagged: string
    action_point: string
    related_rules: string[]
    compares_year_on_year: boolean
  }
  availability: {
    state: 'COMPUTED' | 'AWAITING_FEED'
    feed: string | null
    roadmap_ref: string | null
  }
  /** Present only when a run was named. Absent is not the same as zero. */
  run: {
    evaluated: number
    not_evaluated: number
    flagged: number
    missing_inputs: string[]
  } | null
}

export interface AlignmentView {
  source: { title: string; ladder_note: string; flag_count: number }
  summary: {
    in_circular: number
    implemented: number
    missing: string[]
    computed_from_returns: number
    awaiting_feed: number
    run_id: string | null
    run_fy: string | null
    run_taxpayers: number | null
    evaluated_in_run: number | null
  }
  feeds: { feed: string; flags: string[]; roadmap_ref: string | null }[]
  note: string
  items: AlignmentRow[]
}

/* ------------------------------------------------------------- filings */

/** One return, one period: the unit an officer actually works. */
export interface FilingRow {
  gstin: string
  period: string
  period_label: string
  legal_name: string | null
  division: string | null
  returns_held: string[]
  findings: number
  triggered: number
  not_evaluated: number
  worst_severity: string | null
  at_stake: string
  filing_status: string | null
  days_late: number | null
  barred_on: string | null
  review_count: number
  disposition: string | null
  reviewed_by: string | null
}

export interface FilingRule {
  rule_id: string
  title: string
  family: string | null
  legal_basis: string | null
  status: string
  severity: string
  confidence: string
  heads: { igst: string; cgst: string; sgst: string; cess: string }
  total: string
  interest: string
  penalty: string
  calc_id: string
  missing_inputs: string[]
}

export interface FilingFlag {
  param_id: string
  /** 0-4, or null when the flag could not be evaluated at all. */
  flag: number | null
  status: string
  value: string | null
  fy: string | null
  missing_inputs: string[]
  calc_id: string
}

export interface FilingReview {
  id: string
  at: string
  officer_id: string
  comment: string
  disposition: string
  engine_run_id: string | null
}

export interface FilingAnalysis {
  gstin: string
  period: string
  period_label: string
  legal_name: string
  trade_name: string | null
  division: string | null
  registration_status: string
  run_id: string | null
  as_of: string | null
  declared: {
    period: string
    t31a: { taxable: string; igst: string; cgst: string; sgst: string; cess: string }
    filing_date: string | null
    arn: string | null
  } | null
  summary: {
    rules_run: number
    triggered: number
    cleared: number
    not_evaluated: number
    at_stake: string
    flags_evaluated: number
    flags_total: number
  }
  triggered: FilingRule[]
  cleared: FilingRule[]
  not_evaluated: FilingRule[]
  flags: FilingFlag[]
  reviews: FilingReview[]
  note: string
}

export interface ScreenCoverageRow {
  code: string
  available: boolean
  dataset: string
  rows: number
  waiting_for: string
}

export interface ScreenCoverage {
  screens: ScreenCoverageRow[]
  datasets: { dataset: string; rows: number }[]
  note: string
}

export interface InsightDrill {
  panel: string
  bucket: string
}

/** One element of one panel. The optional fields differ by panel shape. */
export interface InsightItem {
  label: string
  value?: string
  share?: string | null
  lines?: number
  drill: InsightDrill | null
  /** Two-sided rows (counterparties on both sides). */
  sold_to?: string
  bought_from?: string
  /** Credit-note rows. */
  invoices?: string
  credit_notes?: string
  debit_notes?: string
  /** Credit-source rows. */
  form?: string | null
  availability?: string
}

export interface InsightPanel {
  id: string
  title: string
  reading: string
  items: InsightItem[]
  total?: string
  counterparties?: number
  count?: number
}

export interface TaxpayerInsights {
  gstin: string
  legal_name: string | null
  panels: InsightPanel[]
  note: string
}

export interface InsightRow {
  id: string
  period: string
  doc_type: string
  doc_no: string
  doc_date: string | null
  counterparty: string | null
  rate: string | null
  taxable_value: string
  igst: string
  cgst: string
  sgst: string
  source_form?: string | null
  itc_available?: boolean | null
  prov_id: string | null
}

export interface InsightRows {
  page: number
  size: number
  total: number
  items: InsightRow[]
}

export const api = {
  health: () => request<{ status: string; params_version: string }>('/health'),
  overview: (runId?: string) =>
    request<Overview>(`/dashboard/overview${runId ? `?run_id=${runId}` : ''}`),
  parameters: (runId?: string) =>
    request<ParameterMatrix>(`/dashboard/parameters${runId ? `?run_id=${runId}` : ''}`),
  metrics: () => request<{ count: number; items: MetricSpec[] }>('/dashboard/metrics'),
  /** `path` is the drill href the API itself supplied, e.g. `/dashboard/drill?...` */
  drill: (path: string) => request<DrillResult>(path),
  calc: (calcId: string) => request<CalcTrace>(`/calc/${calcId}`),
  reconciliation: (gstin: string) =>
    request<ReconciliationView>(`/taxpayers/${encodeURIComponent(gstin)}/reconciliation`),
  registry: (query: string) => request<RegistryView>(`/registry${query}`),
  registryFacets: () => request<RegistryFacets>('/registry/facets'),
  worklist: (query: string) => request<WorklistView>(`/worklist${query}`),
  dispose: (findingId: string, body: { disposition: string; note: string }) =>
    request<{ finding_id: string; disposition: string }>(
      `/worklist/${findingId}/disposition`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    ),
  promote: (findingId: string, body: { disposition: string; note: string }) =>
    request<{ finding_id: string; confidence: string; note: string }>(
      `/worklist/${findingId}/promote`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    ),
  candidates: (query: string) => request<CandidatesView>(`/planner/candidates${query}`),
  selections: () =>
    request<{ count: number; items: SelectionRow[]; note: string }>('/planner/selections'),
  select: (body: { gstins: string[]; fy: string; basis: string; rationale: string }) =>
    request<{ selection_id: string; count: number; note: string }>('/planner/selections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  uploads: () => request<{ count: number; items: UploadListRow[] }>('/ingestion/uploads'),
  upload: (file: File, options: { commit: boolean; gstin?: string }) => {
    const form = new FormData()
    form.append('file', file)
    const gstin = options.gstin === undefined || options.gstin === '' ? '' : `&gstin=${options.gstin}`
    return request<UploadResult>(
      `/ingestion/upload?commit=${options.commit ? 'true' : 'false'}${gstin}`,
      { method: 'POST', body: form },
    )
  },
  agents: () =>
    request<{ count: number; items: AgentSpecRow[]; guarantees: string[] }>('/agents'),
  askAgent: (key: string, body: { question: string; gstins: string[] }) =>
    request<AgentAnswer>(`/agents/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  libraryRules: () => request<{ count: number; families: string[]; items: RuleRow[] }>(
    '/library/rules',
  ),
  libraryParameters: () =>
    request<{ count: number; items: ParameterSpecRow[]; note: string }>('/library/parameters'),
  libraryThresholds: () =>
    request<{ count: number; provisional_count: number; items: ThresholdRow[]; note: string }>(
      '/library/thresholds',
    ),
  gaps: () => request<GapsView>('/admin/gaps'),
  register: (query = '') => request<RegisterView>(`/admin/parameters${query}`),
  setParameter: (
    owner: string,
    key: string,
    body: { value: string; effective_from: string; notification_ref?: string; source_note?: string },
  ) =>
    request<RegisterRow>(`/admin/parameters/${owner}/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  adoptParameters: (acknowledgement: string) =>
    request<{ adopted: number; still_provisional: number; note: string }>(
      '/admin/parameters/adopt',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledgement }),
      },
    ),
  uploadSheets: (uploadId: string) =>
    request<{ upload_id: string; items: SheetListRow[] }>(
      `/ingestion/uploads/${uploadId}/sheets`,
    ),
  sheetCells: (uploadId: string, sheetIndex: number, start = 0, limit = 200) =>
    request<SheetView>(
      `/ingestion/uploads/${uploadId}/sheets/${String(sheetIndex)}/cells?start=${String(start)}&limit=${String(limit)}`,
    ),
  cases: () =>
    request<{ count: number; items: CaseRow[]; scope: string; note: string }>('/cases'),
  notices: () => request<{ items: NoticeRow[]; scope: string }>('/notices'),
  noticeTemplates: () =>
    request<{ items: NoticeTemplateRow[]; note: string }>('/notices/templates'),
  filing: () => request<FilingView>('/dashboard/filing'),
  revenue: () => request<RevenueView>('/dashboard/revenue'),
  risk: () => request<RiskView>('/dashboard/risk'),
  funnel: () => request<FunnelView>('/dashboard/funnel'),
  jurisdictions: () => request<JurisdictionsView>('/dashboard/jurisdictions'),
  officers: () => request<OfficersView>('/dashboard/officers'),
  sectors: () => request<SectorsView>('/dashboard/sectors'),
  taxpayerFile: (gstin: string, runId?: string) =>
    request<TaxpayerFile>(
      `/taxpayers/${encodeURIComponent(gstin)}${runId === undefined ? '' : `?run_id=${runId}`}`,
    ),
  filings: (params: { only?: string; gstin?: string; runId?: string } = {}) => {
    const query = new URLSearchParams()
    if (params.only !== undefined) query.set('only', params.only)
    if (params.gstin !== undefined) query.set('gstin', params.gstin)
    if (params.runId !== undefined) query.set('run_id', params.runId)
    const suffix = query.toString()
    return request<{
      count: number
      shown: number
      run_id: string | null
      scope: string
      items: FilingRow[]
      note: string
    }>(`/filings${suffix === '' ? '' : `?${suffix}`}`)
  },
  filingAnalysis: (gstin: string, period: string, runId?: string) =>
    request<FilingAnalysis>(
      `/filings/${encodeURIComponent(gstin)}/${encodeURIComponent(period)}` +
        (runId === undefined ? '' : `?run_id=${encodeURIComponent(runId)}`),
    ),
  reviewFiling: (
    gstin: string,
    period: string,
    body: { comment: string; disposition: string },
  ) =>
    request<FilingReview>(
      `/filings/${encodeURIComponent(gstin)}/${encodeURIComponent(period)}/review`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    ),
  engineRuns: () => request<{ count: number; items: EngineRunRow[] }>('/engine/runs'),
  alignment: (runId?: string) =>
    request<AlignmentView>(
      `/alignment/risk-flags${runId === undefined ? '' : `?run_id=${encodeURIComponent(runId)}`}`,
    ),
  coverage: () => request<ScreenCoverage>('/coverage/screens'),
  insights: (gstin: string) =>
    request<TaxpayerInsights>(`/insights/taxpayer/${encodeURIComponent(gstin)}`),
  insightRows: (params: { gstin: string; panel: string; bucket: string; page?: number }) => {
    const query = new URLSearchParams({
      gstin: params.gstin,
      panel: params.panel,
      bucket: params.bucket,
    })
    if (params.page !== undefined) query.set('page', String(params.page))
    return request<InsightRows>(`/insights/rows?${query.toString()}`)
  },
  unconfigured: () =>
    request<{ count: number; items: { parameter_id: string; missing: string; todo_ref: string }[] }>(
      '/admin/unconfigured',
    ),
}
