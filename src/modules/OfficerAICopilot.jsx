import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { RiskBadge, HumanReviewBadge, Pill } from '../components/ui/RiskBadge.jsx'
import { AIOutputPanel, AIDisclaimer } from '../components/ui/AIOutputPanel.jsx'
import { WhyFlaggedPanel } from '../components/ui/WhyFlagged.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { TAXPAYERS } from '../data/mockData.js'
import { KPI_SUMMARY, DISTRICT_REVENUE } from '../data/mockData.js'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import {
  summarizeTaxpayer,
  draftNotice,
  summarizeReply,
  generateAuditChecklist,
  generateExecutiveBrief,
  translateBriefing,
  compareSimilarCases,
  suggestHearingQuestions
} from '../data/ai.js'
import { t } from '../i18n/index.js'
import {
  Search, FileText, MessageSquareText, ClipboardList, FileSignature,
  ScanSearch, Landmark, Languages, GitCompare, HelpCircle, Trash2,
  Sparkles, User2, MapPin, Building2
} from 'lucide-react'

const DEFAULT_TAXPAYER = [...TAXPAYERS]
  .sort((a, b) => b.risk.score - a.risk.score)[0]

const ACTION_DEFS = [
  { id: 'summary', label: 'Generate Case Summary', icon: FileText },
  { id: 'notice', label: 'Draft Notice', icon: FileSignature },
  { id: 'reply', label: 'Summarise Taxpayer Reply', icon: MessageSquareText },
  { id: 'checklist', label: 'Generate Audit Checklist', icon: ClipboardList },
  { id: 'mismatch', label: 'Explain Mismatch', icon: ScanSearch },
  { id: 'briefing', label: 'Generate Senior Officer Briefing', icon: Landmark },
  { id: 'compare', label: 'Compare With Similar Cases', icon: GitCompare },
  { id: 'hearing', label: 'Suggest Hearing Questions', icon: HelpCircle }
]

let turnSeq = 0

export default function OfficerAICopilot() {
  const { filters, logAction } = useApp()
  const [query, setQuery] = useState(filters.search || '')
  const [selected, setSelected] = useState(DEFAULT_TAXPAYER)
  const [conversation, setConversation] = useState([])
  const [lastSummaryText, setLastSummaryText] = useState(
    `${DEFAULT_TAXPAYER.tradeName} (${DEFAULT_TAXPAYER.gstin}) is rated ${DEFAULT_TAXPAYER.risk.category} risk (${DEFAULT_TAXPAYER.risk.score}/100) in the ${DEFAULT_TAXPAYER.sector} sector, ${DEFAULT_TAXPAYER.district} district.`
  )
  const [drilldownTaxpayer, setDrilldownTaxpayer] = useState(null)

  const globalFiltersActive = filters.district !== 'All Districts' || filters.division !== 'All Divisions'
    || filters.sector !== 'All Sectors' || filters.taxpayerType !== 'All Types' || filters.riskLevel !== 'All Risk Levels'

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q && !globalFiltersActive) return []
    return TAXPAYERS.filter(t => {
      if (q && !(t.tradeName.toLowerCase().includes(q) || t.gstin.toLowerCase().includes(q))) return false
      return applyGlobalFilters(t, { ...filters, search: '' })
    }).slice(0, 8)
  }, [query, filters, globalFiltersActive])

  function pushTurn(actionLabel, output) {
    turnSeq += 1
    setConversation(c => [...c, { id: turnSeq, actionLabel, kind: 'ai', output, taxpayer: selected.tradeName }])
  }

  function pushCustomTurn(actionLabel, node) {
    turnSeq += 1
    setConversation(c => [...c, { id: turnSeq, actionLabel, kind: 'custom', node, taxpayer: selected.tradeName }])
  }

  function runAction(id) {
    if (!selected) return
    const actionLabel = ACTION_DEFS.find(a => a.id === id)?.label || id
    logAction(`Generated: ${actionLabel}`, 'Officer AI Copilot', selected.gstin)
    switch (id) {
      case 'summary': {
        const out = summarizeTaxpayer(selected)
        setLastSummaryText(out.summary.join(' '))
        pushTurn('Generate Case Summary', out)
        break
      }
      case 'notice': {
        const out = draftNotice(selected, 'ASMT-10 Scrutiny Notice')
        pushTurn('Draft Notice — ASMT-10 Scrutiny Notice', out)
        break
      }
      case 'reply': {
        const out = summarizeReply(selected.tradeName)
        pushTurn('Summarise Taxpayer Reply', out)
        break
      }
      case 'checklist': {
        const out = generateAuditChecklist({
          tradeName: selected.tradeName,
          riskCategory: selected.risk.category,
          riskScore: selected.risk.score
        })
        pushTurn('Generate Audit Checklist', out)
        break
      }
      case 'mismatch': {
        pushCustomTurn('Explain Mismatch', <WhyFlaggedPanel taxpayer={selected} />)
        break
      }
      case 'briefing': {
        const out = generateExecutiveBrief(KPI_SUMMARY, DISTRICT_REVENUE, KPI_SUMMARY.complianceAlerts)
        setLastSummaryText(out.summary.join(' '))
        pushTurn('Generate Senior Officer Briefing', out)
        break
      }
      case 'compare': {
        const out = compareSimilarCases(
          { id: selected.id, tradeName: selected.tradeName, sector: selected.sector },
          TAXPAYERS.map(t => ({ id: t.id, tradeName: t.tradeName, sector: t.sector, riskScore: t.risk.score }))
        )
        pushCustomTurn('Compare With Similar Cases', <CompareOutput output={out} />)
        break
      }
      case 'hearing': {
        const out = suggestHearingQuestions({ tradeName: selected.tradeName })
        pushTurn('Suggest Hearing Questions', out)
        break
      }
      default:
        break
    }
  }

  function runTranslate(lang) {
    const translated = translateBriefing(lastSummaryText, lang)
    logAction(`Translated Summary — ${lang === 'mr' ? 'Marathi' : lang === 'hi' ? 'Hindi' : 'English'}`, 'Officer AI Copilot', selected?.gstin || '—')
    turnSeq += 1
    setConversation(c => [...c, {
      id: turnSeq,
      actionLabel: `Translate Summary — ${lang === 'mr' ? 'Marathi' : lang === 'hi' ? 'Hindi' : 'English'}`,
      kind: 'translation',
      translated,
      taxpayer: selected.tradeName
    }])
  }

  return (
    <div>
      <SectionHeader
        eyebrow={t('Enforcement · AI-Assisted Workflow')}
        title={t('Officer AI Copilot')}
        description={t('AI-generated draft. Officer verification and approval required. This assistant generates decision-support drafts — case summaries, notice drafts, checklists and briefings — for a selected taxpayer case. It does not issue notices, take enforcement action or replace officer judgement.')}
        actions={<ExportBar moduleLabel="Officer AI Copilot" caseId={selected?.gstin} getBriefingText={() => lastSummaryText} />}
      />

      <AIDisclaimer text={t('AI-generated draft. Officer verification and approval required. All outputs below are advisory suggestions only and must be reviewed, edited and approved by an authorised officer before use.')} />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 mt-5 lg:items-start">
        {/* Case Context Panel — stays in view while the answer feed grows, so the
            action buttons and case search never scroll out of reach. */}
        <div className="space-y-4 lg:sticky lg:top-[4.5rem]">
          <Card title={t('Case Context')} subtitle={t('Select the working case for this session')}>
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-steel-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('Search trade name or GSTIN...')}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-steel-200 bg-steel-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-300"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-steel-200 rounded-lg shadow-panel">
                  {globalFiltersActive && (
                    <div className="px-3 py-1.5 text-[10px] text-steel-400 bg-steel-50 border-b border-steel-100">{t('Narrowed by header filters (district / sector / risk level)')}</div>
                  )}
                  {searchResults.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setSelected(t); setQuery(''); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-navy-50 flex items-center justify-between gap-2 border-b border-steel-100 last:border-0"
                    >
                      <span>
                        <span className="font-medium text-navy-800">{t.tradeName}</span>
                        <span className="text-steel-400 block text-[10.5px]">{t.gstin}</span>
                      </span>
                      <RiskBadge category={t.risk.category} size="sm" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selected && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-navy-900 flex items-center gap-1.5">
                      <User2 className="w-3.5 h-3.5 text-steel-400" /> {selected.tradeName}
                    </div>
                    <div className="text-[11px] text-steel-500 mt-0.5">{selected.gstin}</div>
                  </div>
                  <RiskBadge category={selected.risk.category} score={selected.risk.score} />
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-steel-600"><Building2 className="w-3 h-3 text-steel-400" /> {t('Sector')}: <span className="font-medium text-navy-800">{selected.sector}</span></div>
                  <div className="flex items-center gap-1.5 text-steel-600"><MapPin className="w-3 h-3 text-steel-400" /> {t('District')}: <span className="font-medium text-navy-800">{selected.district}</span></div>
                  <div className="text-steel-600">{t('Filing status')}: <span className="font-medium text-navy-800">{selected.filingStatus}</span></div>
                  <div className="text-steel-600">{t('Audit status')}: <span className="font-medium text-navy-800">{selected.auditStatus}</span></div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Pill tone="navy">{t('Risk signal only')}</Pill>
                  <Pill tone="amber">{t('Officer verification required')}</Pill>
                </div>
                <button
                  onClick={() => setDrilldownTaxpayer(selected)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-steel-200 hover:bg-steel-50 text-navy-700"
                >
                  {t('View Full Taxpayer 360 Profile')}
                </button>
              </div>
            )}
          </Card>

          <Card title={t('AI Actions')} subtitle={t('Generate a draft using this case as context')}>
            <div className="grid grid-cols-1 gap-2">
              {ACTION_DEFS.map(a => (
                <button
                  key={a.id}
                  onClick={() => runAction(a.id)}
                  className="flex items-center gap-2 text-xs font-medium px-3 py-2.5 rounded-lg border border-steel-200 bg-white hover:bg-navy-50 hover:border-navy-300 text-navy-800 text-left"
                >
                  <a.icon className="w-3.5 h-3.5 text-navy-600 shrink-0" />
                  {t(a.label)}
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-steel-100">
              <div className="text-[11px] font-semibold text-steel-500 uppercase tracking-wide mb-1.5">{t('Translate Summary')}</div>
              <div className="flex gap-1.5">
                <button onClick={() => runTranslate('mr')} className="flex-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border border-steel-200 hover:bg-steel-50">{t('Marathi')}</button>
                <button onClick={() => runTranslate('hi')} className="flex-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border border-steel-200 hover:bg-steel-50">{t('Hindi')}</button>
                <button onClick={() => runTranslate('en')} className="flex-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border border-steel-200 hover:bg-steel-50">{t('English')}</button>
              </div>
              <div className="flex items-center gap-1 mt-1.5 text-[10.5px] text-steel-400">
                <Languages className="w-3 h-3" /> {t('Uses the most recent generated summary as source text')}
              </div>
            </div>
          </Card>

          <button
            onClick={() => setConversation([])}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-steel-200 text-steel-600 hover:bg-steel-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> {t('Clear Conversation')}
          </button>
        </div>

        {/* Conversation / Output Area */}
        <div className="space-y-4">
          {conversation.length === 0 && (
            <Card>
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <Sparkles className="w-6 h-6 text-navy-300" />
                <div className="text-sm font-semibold text-navy-800">{t('No AI actions run yet')}</div>
                <div className="text-xs text-steel-500 max-w-sm">
                  {t('Select an action from the left panel to generate a draft for {0}. All outputs are advisory suggestions requiring officer review.', selected?.tradeName || t('the selected case'))}
                </div>
              </div>
            </Card>
          )}

          {conversation.map(turn => (
            <div key={turn.id}>
              <div className="flex items-center gap-2 mb-1.5 text-[11px] text-steel-500">
                <span className="font-semibold text-navy-700">{t(turn.actionLabel)}</span>
                <span>·</span>
                <span>{t('Case')}: {turn.taxpayer}</span>
              </div>
              {turn.kind === 'ai' && <AIOutputPanel output={turn.output} />}
              {turn.kind === 'custom' && turn.node}
              {turn.kind === 'translation' && <TranslationBubble translated={turn.translated} />}
            </div>
          ))}
        </div>
      </div>

      <TaxpayerDrilldownModal taxpayer={drilldownTaxpayer} open={!!drilldownTaxpayer} onClose={() => setDrilldownTaxpayer(null)} />
    </div>
  )
}

function CompareOutput({ output }) {
  return (
    <div className="rounded-xl border border-navy-200 bg-gradient-to-br from-navy-50/70 to-surface overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-navy-100 bg-navy-50/60">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-ink-700 text-white"><GitCompare className="w-3.5 h-3.5" /></span>
          <div className="text-sm font-semibold text-navy-900">{output.title}</div>
        </div>
        <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-white border border-navy-200 text-navy-700">{t('Confidence')}: {output.confidence}</span>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm text-navy-800">{output.observation}</p>
        {output.similarCases.length > 0 && (
          <div className="space-y-1.5">
            {output.similarCases.map(c => (
              <div key={c.id} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg border border-steel-200 bg-white">
                <span className="font-medium text-navy-800">{c.tradeName}</span>
                <span className="text-steel-500">{t('Risk score')}: {c.riskScore ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-navy-100 bg-steel-50/70">
        <HumanReviewBadge />
      </div>
    </div>
  )
}

function TranslationBubble({ translated }) {
  return (
    <div className="rounded-xl border border-saffron-200 bg-saffron-50/60 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-saffron-200 bg-saffron-50">
        <Languages className="w-3.5 h-3.5 text-saffron-700" />
        <span className="text-sm font-semibold text-saffron-900">{translated.prefix}</span>
      </div>
      <div className="px-4 py-3 text-sm text-navy-800 whitespace-pre-wrap">{translated.body}</div>
      <div className="px-4 py-2.5 border-t border-saffron-200 text-[11px] text-saffron-900 bg-saffron-50/80">{translated.note}</div>
    </div>
  )
}
