import { useMemo } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { FilterNotApplicable } from '../components/ui/FilterScope.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { RiskBarChart } from '../components/ui/Charts.jsx'
import { AI_GOVERNANCE_METRICS, OFFICER_ROLES } from '../data/mockData.js'
import {
  useApp, MODULES, ROLE_SECTIONS, canAccessSection, canAccessModule, DEMO_GATE_NOTE
} from '../context/AppContext.jsx'
import { t, untranslatedMessages, catalogueSize, LOCALES, LOCALE_INFO } from '../i18n/index.js'
import {
  ShieldCheck, ShieldAlert, Users, Bot, CheckCircle2, XCircle, Clock,
  Lock, Radar, FlaskConical, KeyRound, FileSearch, Network, Gauge, Eye,
  MessageSquareText, ScrollText, ListChecks, UserCheck, Languages, AlertTriangle
} from 'lucide-react'

/* ---------------------------------------------------------------------------
 * THE CONTROL REGISTER
 *
 * This screen is the one an oversight reader consults to decide whether the
 * platform can be trusted at all, so every line on it has to be checkable.
 *
 * Three statuses, and only three:
 *   built — the control is demonstrably implemented in THIS build, and the
 *           evidence column says where an assessor can see it working.
 *   gap   — the control is not in place. The wording comes verbatim from
 *           AI_GOVERNANCE_METRICS, which is explicit that nothing in it is
 *           measured. None of these may ever be upgraded to a positive status
 *           without the thing itself existing.
 *   na    — genuinely not applicable to a build with no backend.
 *
 * "built" is a statement about software behaviour in a demonstration. It is
 * never a certification, an accreditation or an external assurance — this
 * platform holds none of those, and the KPI row says so in as many words.
 * ------------------------------------------------------------------------- */

/* Every piece of prose below is written as a t('…') literal inside a thunk
 * rather than as a bare constant string. A constant reaches t() at the render
 * site, which satisfies the translator but hides the English from the
 * catalogue tooling — and a half-matched sentence renders as a mongrel rather
 * than as honest untranslated English. `npm run prose` is the check that
 * notices; keep new prose in this shape. */
const CONTROL_STATES = {
  built: { label: () => t('Implemented in this build'), tone: 'green' },
  gap: { label: () => t('Not in place'), tone: 'red' },
  na: { label: () => t('Not applicable to this build'), tone: 'steel' }
}

// `metricKey` rows render their current state VERBATIM from
// AI_GOVERNANCE_METRICS — the production requirement is already inside that
// sentence, and rewording it here is how a "Not assessed" quietly becomes an
// "Assessed".
const CONTROL_REGISTER = [
  {
    id: 'maker-checker',
    summary: () => t('The AI drafts; an authorised officer approves or rejects.'),
    icon: UserCheck,
    control: () => t('Maker-checker / human-in-the-loop'),
    state: 'built',
    owner: 'console',
    detail: () => t('The AI system only ever occupies the maker / draft role and cannot independently execute an enforcement action. Every AI output is advisory and passes through an authorised officer who verifies the evidence and approves or rejects it. Visible in the workflow strip below and in the Human Approval step of the Audit & Scrutiny Engine.'),
    production: () => t('Production requirement: bind the approval to the officer\'s authenticated identity in the departmental system of record, so the approval cannot be replayed or attributed to the wrong officer.')
  },
  {
    id: 'explainability',
    summary: () => t('Every score traces back to the rules that fired and their weights.'),
    icon: Radar,
    control: () => t('Model explainability'),
    state: 'built',
    owner: 'console',
    detail: () => t('Every risk score is fully attributable to a discrete set of weighted, transparent rules — there is no black-box scoring. An officer can trace any rating back to the exact triggered indicators and their weight contribution through the "Why flagged?" panel used app-wide.'),
    production: () => t('Production requirement: hold the rule set and its weights under version control with change approval, so a score can be reconstructed as it stood on the date the officer acted.')
  },
  {
    id: 'rbac',
    summary: () => t('Access is decided per role at section level, then again per module.'),
    icon: Users,
    control: () => t('Role-based access control'),
    state: 'built',
    owner: 'console',
    detail: () => t('Access is decided per role at section level and then again at module level. The matrix below is generated from that configuration at render time rather than described alongside it, so it cannot drift from what the platform actually enforces.'),
    production: () => t('Production requirement: enforce the same matrix server-side against an authenticated session. The check in this build runs in the browser and a client-side check is not access control.')
  },
  {
    id: 'audit-trail',
    summary: () => t('Every officer action is recorded, including denied attempts.'),
    icon: ScrollText,
    control: () => t('Audit trail capture'),
    state: 'built',
    owner: 'console',
    detail: () => t('Every officer action is recorded with user, role, action, module, case reference, IP, device and outcome, including denied attempts. Entries from this session are marked Live in the trail below.'),
    production: () => t('Production requirement: append-only, tamper-evident storage with a defined retention period and an integrity check. This build holds the trail in browser memory and loses it on reload, so it evidences the capture, not the preservation.')
  },
  {
    id: 'copilot-logging',
    summary: () => t('The fact of each generation is logged; the content is not.'),
    icon: MessageSquareText,
    control: () => t('AI Copilot usage logging'),
    state: 'built',
    owner: 'console',
    detail: () => t('Each draft, summary, checklist or translation the Copilot produces is logged separately from the general system trail: the fact of the generation, the officer, the case and the time. Prompt and output content are deliberately not persisted.'),
    production: () => t('Production requirement: retain the same usage record server-side, and decide the retention period for generated content explicitly rather than by omission.')
  },
  {
    id: 'data-minimisation',
    summary: () => t('No real taxpayer data is present, so no control has been exercised.'),
    icon: Lock,
    control: () => t('Data minimisation / PII masking'),
    state: 'gap',
    owner: 'unassigned',
    metricKey: 'dataMinimisation'
  },
  {
    id: 'encryption',
    summary: () => t('Not assessed — this build stores nothing and transmits nothing.'),
    icon: KeyRound,
    control: () => t('Encryption at rest and in transit'),
    state: 'na',
    owner: 'unassigned',
    metricKey: 'encryptionStatus'
  },
  {
    id: 'drift',
    summary: () => t('Not measured. No model and no sampling programme exist here.'),
    icon: FlaskConical,
    control: () => t('Model drift monitoring'),
    state: 'gap',
    owner: 'unassigned',
    metricKey: 'driftStatus'
  },
  {
    id: 'red-team',
    summary: () => t('Not carried out against this build.'),
    icon: ShieldAlert,
    control: () => t('Adversarial / red-team testing'),
    state: 'gap',
    owner: 'unassigned',
    metricKey: 'lastRedTeamTest'
  },
  {
    id: 'vapt',
    summary: () => t('Not carried out against this build.'),
    icon: FileSearch,
    control: () => t('CERT-In / VAPT readiness'),
    state: 'gap',
    owner: 'unassigned',
    metricKey: 'vaptStatus'
  },
  {
    id: 'api-security',
    summary: () => t('No integrations and no network calls, so there is nothing to assess.'),
    icon: Network,
    control: () => t('API integration security'),
    state: 'na',
    owner: 'unassigned',
    detail: () => t('This demonstration has no integrations and makes no network calls, so there is no gateway, no token and no external endpoint to assess.'),
    production: () => t('Production requirement: route every AI Copilot and reporting integration through the departmental secure gateway with mutual TLS, request signing and role-scoped API tokens, and transmit no taxpayer data to external, uncontrolled endpoints.')
  },
  {
    id: 'dpdp',
    summary: () => t('No real personal data, so purpose limitation has not been exercised.'),
    icon: ShieldCheck,
    control: () => t('DPDP-aligned data handling'),
    state: 'gap',
    owner: 'unassigned',
    detail: () => t('No real taxpayer data is present in this demonstration — every record on the platform is generated. No purpose-limitation, retention or consent control has therefore been exercised against real personal data.'),
    production: () => t('Production requirement: process taxpayer personal and financial data strictly for stated revenue-assurance and compliance purposes under the Digital Personal Data Protection Act, 2023, with purpose limitation, access logging and retention controls evidenced.')
  },
  {
    id: 'bias',
    summary: () => t('No sampling programme runs, so the false-positive rate measures nothing.'),
    icon: Gauge,
    control: () => t('Bias / false-positive monitoring'),
    state: 'gap',
    owner: 'unassigned',
    detail: () => t('No sampling programme runs in this demonstration. The false-positive rate shown on this screen is an illustrative placeholder and measures nothing.'),
    production: () => t('Production requirement: sample AI-flagged cases continuously for officer review and track the confirmed false-positive rate by sector and district, to detect systemic bias or drift.')
  }
]

// Controls a production deployment must evidence — NOT controls this build has
// passed. Every row reads "Required" and there is deliberately no code path
// that renders any other value here.
const VAPT_CHECKLIST = [
  'Access control review',
  'Data encryption audit',
  'Penetration testing',
  'Incident response drill',
  'Third-party API security assessment'
]

// Actions in the trail that record an officer disposing of an AI output. These
// are the maker-checker control points as they actually appear in the log.
const OFFICER_DECISION_ACTIONS = [
  'Overrode AI Risk Flag',
  'Marked False Positive',
  'Approved Audit Assignment'
]

const gm = AI_GOVERNANCE_METRICS

export default function AIGovernanceSecurity() {
  const { filters, auditLog, locale } = useApp()

  const filteredLog = useMemo(() => {
    const q = filters.search?.trim().toLowerCase()
    if (!q) return auditLog
    return auditLog.filter(r => `${r.user} ${r.action} ${r.module} ${r.caseId} ${r.role}`.toLowerCase().includes(q))
  }, [auditLog, filters.search])

  const copilotLog = useMemo(
    () => filteredLog.filter(r => r.module === 'Officer AI Copilot' || r.action.toLowerCase().includes('ai') || r.action.toLowerCase().includes('draft') || r.action.toLowerCase().includes('translat')),
    [filteredLog]
  )

  const overrideLog = useMemo(
    () => filteredLog.filter(r => OFFICER_DECISION_ACTIONS.includes(r.action)),
    [filteredLog]
  )

  const overrideCounts = useMemo(
    () => OFFICER_DECISION_ACTIONS.map(action => ({ action, count: filteredLog.filter(r => r.action === action).length })),
    [filteredLog]
  )

  /* The register counted, so the headline of this page is the control position
   * rather than a placeholder recommendation count. */
  const register = useMemo(() => {
    const built = CONTROL_REGISTER.filter(c => c.state === 'built').length
    const gaps = CONTROL_REGISTER.filter(c => c.state === 'gap').length
    const na = CONTROL_REGISTER.filter(c => c.state === 'na').length
    return { total: CONTROL_REGISTER.length, built, gaps, na }
  }, [])

  /* Who can open this console, read straight off the access configuration
   * rather than restated. If the configuration changes, this changes. */
  const consoleRoles = useMemo(
    () => OFFICER_ROLES.filter(role => canAccessModule(role, 'ai-governance')),
    []
  )

  /* The access matrix, generated from ROLE_SECTIONS / canAccessSection /
   * canAccessModule. `moduleOnlyDenied` is the module-level restriction layer
   * on its own — modules inside a section the role holds that it still cannot
   * open. That is the layer a reviewer most often cannot see. */
  const accessMatrix = useMemo(() => {
    const sections = [...new Set(MODULES.map(m => m.group))]
    return OFFICER_ROLES.map(role => {
      const granted = sections.filter(s => canAccessSection(role, s))
      const allowed = MODULES.filter(m => canAccessModule(role, m.id))
      const moduleOnlyDenied = MODULES.filter(m => canAccessSection(role, m.group) && !canAccessModule(role, m.id))
      return {
        role,
        sectionsGranted: granted,
        allSections: ROLE_SECTIONS[role] === 'all',
        moduleCount: allowed.length,
        moduleOnlyDenied,
        opensThisConsole: canAccessModule(role, 'ai-governance')
      }
    })
  }, [])

  /* Integrity properties of the trail itself. Nothing here is asserted — each
   * value is counted off the log the officer is looking at. */
  const trail = useMemo(() => {
    const rows = auditLog
    const stamps = rows.map(r => r.timestamp).slice().sort()
    const denied = rows.filter(r => r.status !== 'Success').length
    const live = rows.filter(r => r.live).length
    return {
      total: rows.length,
      live,
      seeded: rows.length - live,
      denied,
      deniedPct: rows.length ? Math.round((denied / rows.length) * 1000) / 10 : 0,
      officers: new Set(rows.map(r => r.user)).size,
      roles: new Set(rows.map(r => r.role)).size,
      modules: new Set(rows.map(r => r.module)).size,
      withCase: rows.filter(r => r.caseId && r.caseId !== '—').length,
      first: stamps[0] || '—',
      last: stamps.length ? stamps[stamps.length - 1] : '—'
    }
  }, [auditLog])

  /* The placeholder model figures, with their arithmetic checked in front of
   * the reader instead of behind it. `unaccounted` is the number the three
   * disposition cards do not explain; it must read zero. */
  const model = useMemo(() => {
    const generated = gm.recommendationsGenerated
    const disposed = gm.officerApproved + gm.rejectedSuggestions
    const accounted = disposed + gm.pendingGovernanceReview
    const pct = n => (generated ? Math.round((n / generated) * 1000) / 10 : 0)
    return {
      generated,
      approvalPct: pct(gm.officerApproved),
      rejectionPct: pct(gm.rejectedSuggestions),
      pendingPct: pct(gm.pendingGovernanceReview),
      disposedPct: pct(disposed),
      unaccounted: generated - accounted,
      confidenceTotal: gm.modelConfidenceDistribution.reduce((s, b) => s + b.pct, 0),
      falsePositivePct: gm.falsePositiveReviewed
        ? Math.round((gm.falsePositiveConfirmed / gm.falsePositiveReviewed) * 1000) / 10
        : 0
    }
  }, [])

  /* Official-language coverage. locale.js records every string that fell back
   * to English; surfacing it here is the only way a translation gap is seen
   * before an officer meets it on screen. */
  const translation = useMemo(() => {
    const misses = untranslatedMessages()
    return {
      misses: misses.slice(0, 8).map((m, i) => ({ id: `miss-${i}`, ...m })),
      distinct: misses.length,
      occurrences: misses.reduce((s, m) => s + m.count, 0),
      catalogues: LOCALES.filter(l => l !== 'en').map(l => ({ id: l, name: LOCALE_INFO[l].nativeName, size: catalogueSize(l) }))
    }
  }, [locale, auditLog])

  return (
    <div>
      <SectionHeader
        eyebrow={t('Governance · AI Oversight & Security')}
        title={t('AI Governance & Security')}
        description={
          <MethodNote
            tone="plain"
            short={t('AI here is advisory only, under mandatory human review.')}
            full={t('Governance metrics on this screen describe the AI layer itself and are not narrowed by the taxpayer filters above; only the audit trail responds to the search box. Oversight console for AI-assisted decision support across the platform — the control register and its evidence, role-based access as the platform actually enforces it, officer override history, and audit trail integrity. AI systems here operate strictly in an advisory capacity under mandatory human review.')}
          />
        }
        actions={<ExportBar moduleLabel="AI Governance & Security" />}
      />

      <FilterNotApplicable reason={t('It shows system and model activity, which is logged against officers and actions rather than against taxpayers.')} />

      {/* Compliance banner */}
      <div className="rounded-xl border-2 border-saffron-300 bg-saffron-50 px-5 py-4 mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <ShieldAlert className="w-4 h-4 text-saffron-700" />
          <span className="text-sm font-bold text-saffron-900 uppercase tracking-wide">{t('Mandatory Governance Boundaries')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {['AI cannot issue penalty', 'AI cannot block taxpayer', 'AI cannot reject refund', 'AI only supports authorised officer decision-making'].map((boundary, i) => (
            <div key={i} className="flex items-center gap-2 bg-white border border-saffron-200 rounded-lg px-3 py-2.5">
              <ShieldCheck className="w-4 h-4 text-saffron-700 shrink-0" />
              <span className="text-xs font-semibold text-navy-900">{t(boundary)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* The control position is the headline. A placeholder recommendation
          count used to sit here and read as a measured result. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard label={t('Controls in Register')} value={register.total} tone="navy" icon={ListChecks} />
        <KpiCard label={t('Implemented in This Build')} value={t('{0} of {1}', register.built, register.total)} tone="green" icon={CheckCircle2} />
        <KpiCard label={t('Controls Not in Place')} value={register.gaps} unit={t('{0} not applicable', register.na)} tone="red" icon={XCircle} />
        <KpiCard label={t('External Certifications Held')} value={0} unit={t('none claimed')} tone="steel" icon={ShieldAlert} />
      </div>

      <div className="rounded-xl border border-steel-200 bg-steel-50/70 px-5 py-4 mb-5 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <MethodNote className="text-xs text-navy-800 leading-relaxed max-w-4xl" short={t('A control position, not an assurance — the platform holds no certification.')} full={t('Read this page as a control position, not as an assurance. "Implemented in this build" means an assessor can watch the control work in this demonstration; it is not an accreditation, a certification or an independent assessment, and the platform holds none of those. Every model figure on this screen — recommendation counts, confidence bands and the false-positive rate — is an illustrative placeholder: there is no model, no gateway and no scheduled audit behind them. The audit trail, the access matrix and the translation coverage below are the only figures on this page counted from something that actually exists.')} />
      </div>

      <Card
        title={t('AI Control Register')}
        subtitle={t('What each control is, its state in this build, what production would require, and who owns it')}
        className="mb-5"
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone="green">{t('{0} implemented', register.built)}</Pill>
            <Pill tone="red">{t('{0} not in place', register.gaps)}</Pill>
            <Pill tone="steel">{t('{0} not applicable', register.na)}</Pill>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-steel-50 border-b border-steel-200">
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] w-52">{t('Control')}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] w-44">{t('State')}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px]">{t('Current state and production requirement')}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] w-52">{t('Owner')}</th>
              </tr>
            </thead>
            <tbody>
              {CONTROL_REGISTER.map((control, i) => {
                const Icon = control.icon
                const state = CONTROL_STATES[control.state]
                return (
                  <tr key={control.id} className={`border-b border-steel-100 last:border-0 align-top ${i % 2 === 1 ? 'bg-steel-50/40' : ''}`}>
                    <td className="px-3 py-3 font-semibold text-navy-800">
                      <div className="flex items-start gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-steel-400 shrink-0 mt-0.5" />
                        <span>{control.control()}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Pill tone={state.tone}>{state.label()}</Pill>
                    </td>
                    <td className="px-3 py-3 text-navy-700 leading-relaxed">
                      {/* The state as the line, the full wording behind it. The
                          register is a reference an assessor reads row by row;
                          it does not have to shout every production requirement
                          at an officer scanning for the gaps. A metricKey row
                          still carries its sentence VERBATIM from
                          AI_GOVERNANCE_METRICS — the summary sits in front of
                          it, never in place of it. */}
                      <MethodNote
                        tone="plain"
                        /* Falls back to the control's own name. A register row
                           added without a summary should read thinly, not take
                           the oversight console down with it — which is what a
                           bare control.summary() did the first time one was. */
                        short={control.summary ? control.summary() : control.control()}
                        full={
                          control.metricKey
                            ? t(gm[control.metricKey])
                            : `${control.detail()} ${control.production()}`
                        }
                      />
                    </td>
                    <td className="px-3 py-3 text-navy-700">
                      {control.owner === 'console'
                        ? t('Roles configured for this console ({0} listed below)', consoleRoles.length)
                        : t('Not assigned — this build holds no control-owner register')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <MethodNote className="text-[11px] text-steel-500 mt-3 max-w-4xl" short={t('Ownership is read from the access configuration; no owner register exists.')} full={t('Ownership is derived from the access configuration, which is the only ownership statement this build can evidence: the roles that can open this console are {0}. No separate control-owner register exists, so the infrastructure controls above have no named accountable owner. Production requirement: name an accountable owner and a review cycle for every row before go-live.', consoleRoles.map(r => t(r)).join(', '))} />
      </Card>

      <Card
        title={t('CERT-In / VAPT Readiness Checklist')}
        subtitle={t('Controls a production deployment must evidence — none has been carried out against this build')}
        className="mb-5"
        actions={<Pill tone="red">{t('0 of {0} completed', VAPT_CHECKLIST.length)}</Pill>}
      >
        <p className="text-xs text-navy-700 mb-3 max-w-4xl">{t(gm.vaptStatus)}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {VAPT_CHECKLIST.map(item => (
            <div
              key={item}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md border"
              style={{ backgroundColor: TONE_STYLES.saffron.bg, borderColor: TONE_STYLES.saffron.border }}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: TONE_STYLES.saffron.accent }} />
              <span className="text-navy-700">{t(item)}</span>
              <span className="ml-auto font-semibold" style={{ color: TONE_STYLES.saffron.accent }}>{t('Required')}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t('Maker-Checker / Human-in-the-Loop Workflow')} subtitle={t('Every AI-generated notice or audit action requires officer approval before execution')} className="mb-5">
        <MethodNote className="text-xs text-steel-500 mb-4 max-w-4xl" short={t('The AI only ever drafts. An officer approves or rejects every output.')} full={t('The platform enforces a maker-checker control on every AI-assisted output. The AI system only ever occupies the "maker / draft" role — it cannot independently execute an enforcement action. This mirrors the Human Approval step already built into the Audit & Scrutiny Engine workflow, and applies uniformly across notice drafting, audit scoping, refund checklists and taxpayer outreach.')} />
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <ProcessBox icon={Bot} label={t('AI generates draft')} sub={t('Notice / checklist / summary / briefing')} tone="navy" />
          <Arrow />
          <ProcessBox icon={Eye} label={t('Officer reviews')} sub={t('Verifies evidence, edits content')} tone="saffron" />
          <Arrow />
          <ProcessBox icon={CheckCircle2} label={t('Officer approves or rejects')} sub={t('Maker-checker control point')} tone="saffron" />
          <Arrow />
          <ProcessBox icon={FileSearch} label={t('Action executed & logged')} sub={t('Recorded in audit trail')} tone="green" />
        </div>
        <p className="text-[11px] text-steel-500 mt-3 max-w-4xl">
          {t('No step in this platform bypasses the officer. There is no configuration, threshold or confidence band at which an AI output executes on its own.')}
        </p>
      </Card>

      <Card
        title={t('Role-Based Access Control — as enforced')}
        subtitle={t('Generated from the platform access configuration at render time, not described alongside it')}
        className="mb-5"
        actions={<Pill tone="navy">{t('{0} roles · {1} modules', OFFICER_ROLES.length, MODULES.length)}</Pill>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-steel-50 border-b border-steel-200">
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px]">{t('Role')}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px]">{t('Sections granted')}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] w-28">{t('Modules reachable')}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px]">{t('Denied at module level despite section access')}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] w-36">{t('Opens this console')}</th>
              </tr>
            </thead>
            <tbody>
              {accessMatrix.map((row, i) => (
                <tr key={row.role} className={`border-b border-steel-100 last:border-0 align-top ${i % 2 === 1 ? 'bg-steel-50/40' : ''}`}>
                  <td className="px-3 py-2.5 font-semibold text-navy-800 whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-steel-400" />{t(row.role)}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {row.allSections && <Pill tone="navy">{t('All sections')}</Pill>}
                      {!row.allSections && row.sectionsGranted.map(s => <Pill key={s} tone="navy">{t(s)}</Pill>)}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-navy-700">
                    {t('{0} of {1}', row.moduleCount, MODULES.length)}
                  </td>
                  <td className="px-3 py-2.5">
                    {row.moduleOnlyDenied.length === 0
                      ? <span className="text-steel-400">{t('None')}</span>
                      : (
                        <div className="flex flex-wrap gap-1">
                          {row.moduleOnlyDenied.map(m => <Pill key={m.id} tone="red">{t(m.label)}</Pill>)}
                        </div>
                      )}
                  </td>
                  <td className="px-3 py-2.5">
                    <Pill tone={row.opensThisConsole ? 'green' : 'steel'}>
                      {row.opensThisConsole ? t('Yes') : t('No')}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 space-y-1.5 max-w-4xl">
          <MethodNote className="text-[11px] text-steel-500" short={t('A role with a section is not automatically given every module in it.')} full={t('Module counts include the Officer AI Copilot, which is reachable but not listed in the navigation menu. A role with a section is not automatically given every module inside it — the fourth column is that second layer on its own.')} />
          <p className="text-[11px] text-steel-600 flex items-start gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
            <span>{t(DEMO_GATE_NOTE)}</span>
          </p>
        </div>
      </Card>

      <Card
        title={t('Officer Override & Disposition History')}
        subtitle={t('Every logged instance of an officer overriding, rejecting or approving an AI-assisted output — the maker-checker control as it appears in the trail')}
        className="mb-5"
        actions={<Pill tone="navy">{t('{0} of {1} trail entries', overrideLog.length, filteredLog.length)}</Pill>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {overrideCounts.map(entry => (
            <StatTile key={entry.action} tone="navy" label={t(entry.action)} value={entry.count} />
          ))}
        </div>
        <DataTable
          searchPlaceholder={t('Search override history...')}
          emptyLabel={t('No override or disposition entries in the current trail. Overriding an AI risk flag or marking a false positive anywhere in the platform records an entry here.')}
          columns={[
            { key: 'timestamp', label: t('Timestamp'), sortValue: r => r.timestamp },
            { key: 'user', label: t('Officer') },
            { key: 'role', label: t('Role'), render: r => t(r.role) },
            { key: 'action', label: t('Officer decision'), render: r => t(r.action) },
            { key: 'module', label: t('Module'), render: r => t(r.module) },
            { key: 'caseId', label: t('Case ID') }
          ]}
          rows={overrideLog}
          pageSize={6}
        />
        <MethodNote className="text-[11px] text-steel-500 mt-3 max-w-4xl" short={t('A trail with no overrides would be a warning sign, not a good result.')} full={t('An override is an officer disagreeing with the platform, which is the outcome the maker-checker control exists to make possible. A trail with no overrides in it would be a warning sign, not a good result.')} />
      </Card>

      <Card
        title={t('AI Decision-Support Activity')}
        subtitle={t('Illustrative placeholder figures — nothing below is measured')}
        className="mb-5"
        actions={<Pill tone="amber">{t('Illustrative placeholder')}</Pill>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatTile tone="navy" label={t('Recommendations generated')} value={model.generated.toLocaleString('en-IN')} />
          <StatTile tone="green" label={t('Officer-approved')} value={gm.officerApproved.toLocaleString('en-IN')} note={t('{0}% of generated', model.approvalPct)} />
          <StatTile tone="red" label={t('Rejected by officer')} value={gm.rejectedSuggestions.toLocaleString('en-IN')} note={t('{0}% of generated', model.rejectionPct)} />
          <StatTile tone="saffron" label={t('Pending governance review')} value={gm.pendingGovernanceReview.toLocaleString('en-IN')} note={t('{0}% of generated', model.pendingPct)} />
        </div>
        <MethodNote className="text-xs text-steel-600 max-w-4xl" short={t('Approved, rejected and pending are an exhaustive split of what was generated.')} full={t('Disposition check: approved plus rejected plus pending accounts for {0} of {1} recommendations, leaving {2} unexplained. The three figures are presented as an exhaustive split, so a non-zero remainder would mean the split is wrong. {3}% of generated recommendations have been disposed of one way or the other.', (gm.officerApproved + gm.rejectedSuggestions + gm.pendingGovernanceReview).toLocaleString('en-IN'), model.generated.toLocaleString('en-IN'), model.unaccounted, model.disposedPct)} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card
          title={t('Model Confidence Distribution')}
          subtitle={t('Share of AI outputs by confidence band — illustrative placeholder')}
          actions={<Pill tone={model.confidenceTotal === 100 ? 'navy' : 'red'}>{t('Bands total {0}%', model.confidenceTotal)}</Pill>}
        >
          <RiskBarChart
            data={gm.modelConfidenceDistribution}
            xKey="band"
            barKey="pct"
            height={240}
            colorFn={d => d.band === 'Very High' ? '#1f8a4c' : d.band === 'High' ? '#204575' : d.band === 'Moderate' ? '#f78c0a' : '#c41e3a'}
          />
          <MethodNote className="text-[11px] text-steel-500 mt-3" short={t('Confidence is a property of the output, not a permission.')} full={t('Confidence is a property of the output, not a permission. A "Very High" band does not shorten the officer review path — every band goes through the same maker-checker step.')} />
        </Card>

        <Card
          title={t('False Positive Review')}
          subtitle={t('Human-in-the-loop review outcomes for AI-flagged cases — illustrative placeholder')}
          actions={<Pill tone="amber">{t('Not measured')}</Pill>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatTile tone="navy" label={t('Flags Reviewed')} value={gm.falsePositiveReviewed} />
              <StatTile tone="orange" label={t('Confirmed False Positives')} value={gm.falsePositiveConfirmed} />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-navy-800">{t('Confirmed false-positive rate')}</span>
                <span className="font-semibold text-navy-900">{t('{0}%', model.falsePositivePct)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-steel-100 border border-steel-200 overflow-hidden">
                <div className="h-full bg-maharisk-high" style={{ width: `${model.falsePositivePct}%` }} />
              </div>
            </div>
            <MethodNote className="text-xs text-steel-500" short={t('Illustrative only — no sampling programme produced this rate.')} full={t('Of {0} AI-generated risk flags submitted for officer review, {1} were confirmed as false positives ({2}%). No sampling programme produced these numbers — they are illustrative. Production requirement: track this rate continuously by sector and district to monitor model precision; it must never by itself trigger an automated model change.', gm.falsePositiveReviewed, gm.falsePositiveConfirmed, model.falsePositivePct)} />
          </div>
        </Card>
      </div>

      <Card
        title={t('Audit Trail Integrity')}
        subtitle={t('Properties counted off the trail below, including this session\'s own entries')}
        className="mb-5"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatTile tone="navy" label={t('Entries held')} value={trail.total} note={t('{0} live this session', trail.live)} />
          <StatTile tone="red" label={t('Denied attempts')} value={trail.denied} note={t('{0}% of entries', trail.deniedPct)} />
          <StatTile tone="navy" label={t('Distinct officers')} value={trail.officers} note={t('across {0} roles', trail.roles)} />
          <StatTile tone="navy" label={t('Modules covered')} value={trail.modules} />
          <StatTile tone="navy" label={t('Entries with a case reference')} value={trail.withCase} note={t('of {0}', trail.total)} />
          <StatTile tone="steel" label={t('Coverage window')} value={trail.first} note={t('to {0}', trail.last)} />
        </div>
        <MethodNote className="text-[11px] text-steel-500 mt-3 max-w-4xl" short={t('Denied attempts are kept deliberately; the trail is session-only.')} full={t('Denied attempts are kept in the trail deliberately: a log that records only what succeeded cannot evidence that access control refused anything. The trail is held in browser memory for this session and is lost on reload — it evidences capture, not preservation, and production requires append-only, tamper-evident storage with a defined retention period.')} />
      </Card>

      <Card
        title={t('Audit Log')}
        subtitle={t('System-wide access and action log across all modules — live entries from this session appear at the top')}
        className="mb-5"
        actions={filters.search ? <Pill tone="navy">{t('Filtered by header search: "{0}"', filters.search)}</Pill> : null}
      >
        <DataTable
          searchPlaceholder={t('Search user, action, module, case ID...')}
          columns={[
            {
              key: 'timestamp', label: t('Timestamp'), sortValue: r => r.timestamp, render: r => (
                <span className="inline-flex items-center gap-1.5">
                  {r.timestamp}
                  {r.live && <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{t('Live')}</span>}
                </span>
              )
            },
            { key: 'user', label: t('User') },
            { key: 'role', label: t('Role'), render: r => t(r.role) },
            { key: 'action', label: t('Action'), render: r => t(r.action) },
            { key: 'module', label: t('Module'), render: r => t(r.module) },
            { key: 'caseId', label: t('Case ID') },
            { key: 'ipDevice', label: t('IP / Device'), sortable: false, render: r => (
              <div className="leading-tight">
                <div>{r.ip}</div>
                <div className="text-steel-400 text-[10.5px]">{t(r.device)}</div>
              </div>
            ) },
            { key: 'status', label: t('Status'), render: r => (
              <Pill tone={r.status === 'Success' ? 'green' : 'red'}>{t(r.status)}</Pill>
            ) }
          ]}
          rows={filteredLog}
          pageSize={10}
        />
      </Card>

      <Card
        title={t('AI Copilot Prompt / Output Log')}
        subtitle={t('Every draft, summary, checklist or translation the AI Copilot has generated, with the officer and case it was generated for')}
        className="mb-5"
        actions={<span className="inline-flex items-center gap-1.5 text-[11px] text-steel-500"><MessageSquareText className="w-3.5 h-3.5" /> {t('{0} logged outputs', copilotLog.length)}</span>}
      >
        <DataTable
          searchPlaceholder={t('Search AI Copilot activity...')}
          emptyLabel={t('No AI Copilot activity logged yet this session. Generate a draft, checklist, or summary from Officer AI Copilot to see it appear here.')}
          columns={[
            { key: 'timestamp', label: t('Timestamp'), sortValue: r => r.timestamp },
            { key: 'user', label: t('Officer') },
            { key: 'action', label: t('AI Output Generated'), render: r => t(r.action) },
            { key: 'module', label: t('Context Module'), render: r => t(r.module) },
            { key: 'caseId', label: t('Case / GSTIN') }
          ]}
          rows={copilotLog}
          pageSize={6}
        />
        <MethodNote className="text-[11px] text-steel-500 mt-3 max-w-4xl" short={t('Only the fact of a generation is logged — never the prompt or the output.')} full={t('Prompt/output content itself is not persisted in this log by design (data minimisation) — only the fact that a generation occurred, by whom, for which case, and when. This satisfies the governance requirement for AI Copilot usage logging distinct from the general system audit trail above.')} />
      </Card>

      <Card
        title={t('Official-Language Coverage')}
        subtitle={t('Strings that fell back to English in this browser session, and the size of each catalogue')}
        actions={
          <Pill tone={translation.distinct === 0 ? 'green' : 'amber'}>
            {t('{0} untranslated strings observed', translation.distinct)}
          </Pill>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatTile
            tone="navy"
            label={t('Active language')}
            value={LOCALE_INFO[locale] ? t(LOCALE_INFO[locale].englishName) : t('English')}
          />
          {translation.catalogues.map(c => (
            <StatTile key={c.id} tone="navy" label={t('{0} catalogue entries', c.name)} value={c.size.toLocaleString('en-IN')} />
          ))}
          <StatTile tone="saffron" label={t('Fallback occurrences')} value={translation.occurrences} note={t('{0} distinct strings', translation.distinct)} />
        </div>
        {translation.distinct > 0 && (
          <DataTable
            searchable={false}
            columns={[
              { key: 'message', label: t('String with no catalogue entry') },
              { key: 'count', label: t('Times shown'), align: 'right' }
            ]}
            rows={translation.misses}
            pageSize={8}
          />
        )}
        <p className="text-[11px] text-steel-500 mt-3 flex items-start gap-1.5 max-w-4xl">
          <Languages className="w-3.5 h-3.5 shrink-0 mt-0.5 text-steel-400" />
          <MethodNote short={t('A live gap indicator for this session, not a coverage audit.')} full={t('This counts only what this browser has rendered since the page loaded, in the currently selected language — it is a live gap indicator, not a coverage audit, and it reads zero in English because English is the source language. A string listed here reaches an officer in English on a screen they have set to Marathi or Hindi. Production requirement: drive this to zero for every officer-facing string before an official-language deployment.')} />
        </p>
      </Card>
    </div>
  )
}

/* A labelled figure. Same markup and tone tokens the KPI tiles use — it exists
 * so a count can sit inside a card without a KPI tile's weight. */
function StatTile({ tone = 'navy', label, value, note }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.navy
  return (
    <div className="rounded-lg border px-4 py-3" style={{ backgroundColor: styles.bg, borderColor: styles.border }}>
      <div className="text-[11px] uppercase font-semibold leading-tight" style={{ color: styles.accent }}>{label}</div>
      <div className="text-2xl font-bold text-navy-900 mt-1 tabular-nums">{value}</div>
      {note && <div className="text-[11px] text-steel-500 mt-0.5">{note}</div>}
    </div>
  )
}

function ProcessBox({ icon: Icon, label, sub, tone }) {
  // Never name this `t` — it would shadow the translator for the whole function.
  const styles = TONE_STYLES[tone] || TONE_STYLES.navy
  return (
    <div className="flex-1 rounded-lg border px-3 py-3 text-center" style={{ backgroundColor: styles.bg, borderColor: styles.border, color: styles.accent }}>
      <Icon className="w-4 h-4 mx-auto mb-1.5" />
      <div className="text-xs font-bold">{label}</div>
      <div className="text-[10.5px] mt-0.5 opacity-80">{sub}</div>
    </div>
  )
}

function Arrow() {
  return (
    <div className="flex items-center justify-center px-1 text-steel-400 shrink-0 rotate-90 sm:rotate-0">
      &#8594;
    </div>
  )
}
