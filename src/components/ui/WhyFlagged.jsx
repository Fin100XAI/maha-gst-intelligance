import { RISK_COLORS } from '../../data/risk.js'
import { explainRiskScore } from '../../data/risk.js'
import { HumanReviewBadge } from './RiskBadge.jsx'
import { ShieldAlert } from 'lucide-react'
import { t } from '../../i18n/index.js'

// Standard "Why flagged?" explainability block for any taxpayer with a computed `.risk`.
export function WhyFlaggedPanel({ taxpayer }) {
  const explain = explainRiskScore(taxpayer)
  const c = RISK_COLORS[explain.category]
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-navy-900">{t('Why flagged?')}</span>
          <span className={`text-xs font-semibold ${c.text}`}>{t(explain.category)} · {explain.score}/100</span>
        </div>
        <span className="text-[11px] text-steel-500">{t('Confidence: {0}', t(explain.confidence))}</span>
      </div>
      {explain.evidence.length === 0 ? (
        <p className="text-xs text-steel-600">{t('No risk rules triggered. Behaviour is within expected parameters for this taxpayer profile.')}</p>
      ) : (
        <div className="space-y-1.5">
          {explain.evidence.map((e, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-navy-800">{t(e.rule)}</span>
                  <span className="text-steel-500">+{e.weightContribution}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/70 border border-steel-200 mt-0.5 overflow-hidden">
                  <div className="h-full bg-ink-600" style={{ width: `${Math.min(100, e.weightContribution)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/60">
        {explain.humanReviewRequired ? <HumanReviewBadge /> : <span className="text-[11px] text-steel-500">{t('Routine monitoring — no escalation required')}</span>}
      </div>
      <div className="flex items-start gap-1.5 mt-2 text-[11px] text-steel-500">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>{t(explain.limitationNote)}</span>
      </div>
    </div>
  )
}
