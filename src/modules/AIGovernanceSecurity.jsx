import { useMemo } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { RiskBarChart } from '../components/ui/Charts.jsx'
import { AI_GOVERNANCE_METRICS, OFFICER_ROLES } from '../data/mockData.js'
import { useApp } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'
import {
  ShieldCheck, ShieldAlert, Users, Bot, CheckCircle2, XCircle, Clock,
  Lock, Radar, FlaskConical, KeyRound, FileSearch, Network, Gauge, Eye, MessageSquareText
} from 'lucide-react'

const ROLE_ACCESS = {
  'Commissioner': 'Full access to all modules, including Executive Command Center and AI Governance & Security.',
  'Joint Commissioner': 'Full access to all modules, including Executive Command Center and AI Governance & Security.',
  'Division Officer': 'Access to all modules except AI Governance & Security; includes Audit & Scrutiny and Refund Risk.',
  'Audit Officer': 'Access to all modules except Executive Command Center and AI Governance & Security; includes Audit & Scrutiny Engine.',
  'Refund Officer': 'Access to all modules except Executive Command Center and AI Governance & Security; includes Refund Risk Intelligence.',
  'Investigation Officer': 'Access to all modules except Executive Command Center and AI Governance & Security; includes Audit & Scrutiny Engine.',
  'AI Governance Officer': 'Access to all modules except Executive Command Center; primary oversight of AI Governance & Security.',
  'Read-only Policy Viewer': 'Restricted to Reports & Briefing Notes only, in read-only capacity.'
}

const MODULE_RESTRICTION_NOTES = {
  'Commissioner': ['Executive Command Center', 'AI Governance & Security'],
  'Joint Commissioner': ['Executive Command Center', 'AI Governance & Security'],
  'Division Officer': ['Audit & Scrutiny Engine', 'Refund Risk Intelligence'],
  'Audit Officer': ['Audit & Scrutiny Engine'],
  'Refund Officer': ['Refund Risk Intelligence'],
  'Investigation Officer': ['Audit & Scrutiny Engine'],
  'AI Governance Officer': ['AI Governance & Security'],
  'Read-only Policy Viewer': ['Reports & Briefing Notes (read-only)']
}

// These are the controls a production deployment must evidence — NOT controls
// this build has passed. They previously read "Complete", which asserted a
// security posture no part of this demonstration has.
const VAPT_CHECKLIST = [
  { item: 'Access control review', status: 'Required' },
  { item: 'Data encryption audit', status: 'Required' },
  { item: 'Penetration testing', status: 'Required' },
  { item: 'Incident response drill', status: 'Required' },
  { item: 'Third-party API security assessment', status: 'Required' }
]

const gm = AI_GOVERNANCE_METRICS
const approvalRatePct = Math.round((gm.officerApproved / gm.recommendationsGenerated) * 1000) / 10
const rejectionRatePct = Math.round((gm.rejectedSuggestions / gm.recommendationsGenerated) * 1000) / 10
const falsePositiveRatePct = Math.round((gm.falsePositiveConfirmed / gm.falsePositiveReviewed) * 1000) / 10

export default function AIGovernanceSecurity() {
  const { filters, auditLog } = useApp()

  const filteredLog = useMemo(() => {
    const q = filters.search?.trim().toLowerCase()
    if (!q) return auditLog
    return auditLog.filter(r => `${r.user} ${r.action} ${r.module} ${r.caseId} ${r.role}`.toLowerCase().includes(q))
  }, [auditLog, filters.search])

  const copilotLog = useMemo(
    () => filteredLog.filter(r => r.module === 'Officer AI Copilot' || r.action.toLowerCase().includes('ai') || r.action.toLowerCase().includes('draft') || r.action.toLowerCase().includes('translat')),
    [filteredLog]
  )

  return (
    <div>
      <SectionHeader
        eyebrow={t('Governance · AI Oversight & Security')}
        title={t('AI Governance & Security')}
        description={t('Governance metrics on this screen describe the AI layer itself and are not narrowed by the taxpayer filters above; only the audit trail responds to the search box. Oversight console for AI-assisted decision support across the platform — model usage, human override rates, role-based access control, and audit trail integrity. AI systems here operate strictly in an advisory capacity under mandatory human review.')}
        actions={<ExportBar moduleLabel="AI Governance & Security" />}
      />

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

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard label={t('AI Recommendations Generated')} value={gm.recommendationsGenerated.toLocaleString('en-IN')} tone="navy" icon={Bot} />
        <KpiCard label={t('Officer-Approved Actions')} value={gm.officerApproved.toLocaleString('en-IN')} unit={`${approvalRatePct}%`} tone="green" icon={CheckCircle2} />
        <KpiCard label={t('Rejected AI Suggestions')} value={gm.rejectedSuggestions.toLocaleString('en-IN')} unit={`${rejectionRatePct}%`} tone="red" icon={XCircle} />
        <KpiCard label={t('Pending Governance Review')} value={gm.pendingGovernanceReview} tone="saffron" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title={t('Model Confidence Distribution')} subtitle={t('Share of AI outputs by confidence band')}>
          <RiskBarChart
            data={gm.modelConfidenceDistribution}
            xKey="band"
            barKey="pct"
            height={240}
            colorFn={d => d.band === 'Very High' ? '#1f8a4c' : d.band === 'High' ? '#204575' : d.band === 'Moderate' ? '#f78c0a' : '#c41e3a'}
          />
        </Card>

        <Card title={t('False Positive Review')} subtitle={t('Human-in-the-loop review outcomes for AI-flagged cases')}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border px-4 py-3" style={{ backgroundColor: TONE_STYLES.navy.bg, borderColor: TONE_STYLES.navy.border }}>
                <div className="text-[11px] uppercase font-semibold" style={{ color: TONE_STYLES.navy.accent }}>{t('Flags Reviewed')}</div>
                <div className="text-2xl font-bold text-navy-900 mt-1">{gm.falsePositiveReviewed}</div>
              </div>
              <div className="rounded-lg border px-4 py-3" style={{ backgroundColor: TONE_STYLES.orange.bg, borderColor: TONE_STYLES.orange.border }}>
                <div className="text-[11px] uppercase font-semibold" style={{ color: TONE_STYLES.orange.accent }}>{t('Confirmed False Positives')}</div>
                <div className="text-2xl font-bold text-navy-900 mt-1">{gm.falsePositiveConfirmed}</div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-navy-800">{t('Confirmed false-positive rate')}</span>
                <span className="font-semibold text-navy-900">{falsePositiveRatePct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-steel-100 border border-steel-200 overflow-hidden">
                <div className="h-full bg-maharisk-high" style={{ width: `${falsePositiveRatePct}%` }} />
              </div>
            </div>
            <p className="text-xs text-steel-500">
              {t('Of {0} AI-generated risk flags submitted for officer review, {1} were confirmed as false positives ({2}%). This rate is tracked continuously to monitor model precision and inform periodic recalibration; it does not by itself trigger any automated model change.', gm.falsePositiveReviewed, gm.falsePositiveConfirmed, falsePositiveRatePct)}
            </p>
          </div>
        </Card>
      </div>

      <Card title={t('Role-Based Access Control')} subtitle={t('Module access permissions by officer role')} className="mb-5">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-steel-50 border-b border-steel-200">
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px]">{t('Role')}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px]">{t('Access Summary')}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px]">{t('Restricted / Focus Modules')}</th>
              </tr>
            </thead>
            <tbody>
              {OFFICER_ROLES.map((role, i) => (
                <tr key={role} className={`border-b border-steel-100 last:border-0 ${i % 2 === 1 ? 'bg-steel-50/40' : ''}`}>
                  <td className="px-3 py-2.5 font-semibold text-navy-800 whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-steel-400" />{t(role)}</div>
                  </td>
                  <td className="px-3 py-2.5 text-navy-700">{t(ROLE_ACCESS[role])}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {MODULE_RESTRICTION_NOTES[role].map(m => <Pill key={m} tone="navy">{t(m)}</Pill>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={t('Maker-Checker / Human-in-the-Loop Workflow')} subtitle={t('Every AI-generated notice or audit action requires officer approval before execution')} className="mb-5">
        <p className="text-xs text-steel-500 mb-4 max-w-3xl">
          {t('The platform enforces a maker-checker control on every AI-assisted output. The AI system only ever occupies the "maker / draft" role — it cannot independently execute an enforcement action. This mirrors the Human Approval step already built into the Audit & Scrutiny Engine workflow, and applies uniformly across notice drafting, audit scoping, refund checklists and taxpayer outreach.')}
        </p>
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <ProcessBox icon={Bot} label={t('AI generates draft')} sub={t('Notice / checklist / summary / briefing')} tone="navy" />
          <Arrow />
          <ProcessBox icon={Eye} label={t('Officer reviews')} sub={t('Verifies evidence, edits content')} tone="saffron" />
          <Arrow />
          <ProcessBox icon={CheckCircle2} label={t('Officer approves or rejects')} sub={t('Maker-checker control point')} tone="saffron" />
          <Arrow />
          <ProcessBox icon={FileSearch} label={t('Action executed & logged')} sub={t('Recorded in audit trail')} tone="green" />
        </div>
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
            { key: 'role', label: t('Role') },
            { key: 'action', label: t('Action') },
            { key: 'module', label: t('Module') },
            { key: 'caseId', label: t('Case ID') },
            { key: 'ipDevice', label: t('IP / Device'), sortable: false, render: r => (
              <div className="leading-tight">
                <div>{r.ip}</div>
                <div className="text-steel-400 text-[10.5px]">{r.device}</div>
              </div>
            ) },
            { key: 'status', label: t('Status'), render: r => (
              <Pill tone={r.status === 'Success' ? 'green' : 'red'}>{r.status}</Pill>
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
            { key: 'action', label: t('AI Output Generated') },
            { key: 'module', label: t('Context Module') },
            { key: 'caseId', label: t('Case / GSTIN') }
          ]}
          rows={copilotLog}
          pageSize={6}
        />
        <p className="text-[11px] text-steel-500 mt-3">
          {t('Prompt/output content itself is not persisted in this log by design (data minimisation) — only the fact that a generation occurred, by whom, for which case, and when. This satisfies the governance requirement for AI Copilot usage logging distinct from the general system audit trail above.')}
        </p>
      </Card>

      <Card title={t('Model Explainability & Data Governance')} subtitle={t('Standing controls governing AI usage on this platform')}>
        <ul className="space-y-3 text-xs text-navy-800">
          <GovItem icon={Radar} title={t('Model explainability')}>
            {t('Every risk score is fully attributable to a discrete set of weighted, transparent rules (see the "Why flagged?" panel used app-wide) — there is no black-box scoring. Officers can trace any risk rating back to the exact triggered indicators and their weight contribution.')}
          </GovItem>
          <GovItem icon={Lock} title={t('Data minimisation')}>
            {gm.dataMinimisation}
          </GovItem>
          <GovItem icon={KeyRound} title={t('Encryption status')}>
            {gm.encryptionStatus}
          </GovItem>
          <GovItem icon={Network} title={t('API integration security')}>
            {t('This demonstration has no integrations and makes no network calls. Production requirement: route all AI Copilot and reporting integrations through the departmental secure gateway with mutual TLS, request signing and role-scoped API tokens, and transmit no taxpayer data to external, uncontrolled endpoints.')}
          </GovItem>
          <GovItem icon={ShieldCheck} title={t('DPDP-aligned data handling')}>
            {t('No real taxpayer data is present in this demonstration — every record is generated. Production requirement: process taxpayer personal and financial data strictly for stated revenue-assurance and compliance purposes, consistent with the Digital Personal Data Protection Act, 2023, with purpose limitation, access logging and retention controls.')}
          </GovItem>
          <GovItem icon={Gauge} title={t('Bias / false-positive monitoring')}>
            {t('No sampling programme runs in this demonstration; the rate shown above is an illustrative placeholder. Production requirement: sample AI-flagged cases continuously for officer review and track the confirmed false-positive rate to detect systemic bias or drift by sector and district.')}
          </GovItem>
          <GovItem icon={FlaskConical} title={t('Model drift monitoring')}>
            {gm.driftStatus}
          </GovItem>
          <GovItem icon={ShieldAlert} title={t('Red-team testing status')}>
            {gm.lastRedTeamTest}
          </GovItem>
          <GovItem icon={FileSearch} title={t('CERT-In / VAPT readiness')}>
            {gm.vaptStatus}
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {VAPT_CHECKLIST.map(v => {
                const tone = v.status === 'Complete' ? TONE_STYLES.green : TONE_STYLES.saffron
                return (
                  <div key={v.item} className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md border" style={{ backgroundColor: tone.bg, borderColor: tone.border }}>
                    {v.status === 'Complete'
                      ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: tone.accent }} />
                      : <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: tone.accent }} />}
                    <span className="text-navy-700">{t(v.item)}</span>
                    <span className="ml-auto font-semibold" style={{ color: tone.accent }}>{t(v.status)}</span>
                  </div>
                )
              })}
            </div>
          </GovItem>
        </ul>
      </Card>
    </div>
  )
}

function GovItem({ icon: Icon, title, children }) {
  return (
    <li className="flex gap-3 border-b border-steel-100 last:border-0 pb-3 last:pb-0">
      <span className="p-1.5 rounded-lg bg-navy-50 border border-navy-100 h-fit shrink-0">
        <Icon className="w-3.5 h-3.5 text-navy-700" />
      </span>
      <div>
        <div className="font-semibold text-navy-900 mb-0.5">{title}</div>
        <div className="text-steel-600">{children}</div>
      </div>
    </li>
  )
}

function ProcessBox({ icon: Icon, label, sub, tone }) {
  const t = TONE_STYLES[tone] || TONE_STYLES.navy
  return (
    <div className="flex-1 rounded-lg border px-3 py-3 text-center" style={{ backgroundColor: t.bg, borderColor: t.border, color: t.accent }}>
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
