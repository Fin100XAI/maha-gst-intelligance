import { Sparkles, ShieldAlert, Info } from 'lucide-react'
import { HumanReviewBadge } from './RiskBadge.jsx'
import { t } from '../../i18n/index.js'

// Renders the standard shape returned by src/data/ai.js helpers:
// { title, confidence, summary?|checklist?|draft?|questions?|message?, evidenceUsed?, humanReviewRequired, limitationNote }
export function AIOutputPanel({ output }) {
  if (!output) return null
  const body = output.summary || output.checklist || output.questions
  return (
    <div className="rounded-xl border border-navy-200 bg-gradient-to-br from-navy-50/70 to-surface overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-navy-100 bg-navy-50/60">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-ink-700 text-white"><Sparkles className="w-3.5 h-3.5" /></span>
          <div>
            <div className="text-sm font-semibold text-navy-900">{t(output.title)}</div>
            <div className="text-[11px] text-steel-500">{t('AI Copilot — simulated output')}</div>
          </div>
        </div>
        {output.confidence && <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-white border border-navy-200 text-navy-700">{t('Confidence: {0}', t(output.confidence))}</span>}
      </div>
      <div className="px-4 py-3 space-y-2 text-sm text-navy-800">
        {Array.isArray(body) ? body.map((line, i) => (
          <p key={i} className={output.checklist ? 'flex gap-2' : output.questions ? 'flex gap-2' : ''}>
            {(output.checklist || output.questions) && <span className="text-navy-400 font-semibold">{i + 1}.</span>}
            <span>{line}</span>
          </p>
        )) : output.draft ? (
          <pre className="whitespace-pre-wrap font-sans text-xs bg-white border border-steel-200 rounded-lg p-3 text-navy-800">{output.draft}</pre>
        ) : output.message ? (
          <p>{output.message}</p>
        ) : output.narrative ? <p>{output.narrative}</p> : null}
      </div>
      {output.evidenceUsed && (
        <div className="px-4 pb-3">
          <div className="text-[11px] font-semibold text-steel-500 uppercase tracking-wide mb-1">{t('Evidence Used')}</div>
          <div className="flex flex-wrap gap-1.5">
            {output.evidenceUsed.map((e, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-steel-100 text-steel-700 border border-steel-200">{e}</span>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-navy-100 bg-steel-50/70">
        {output.humanReviewRequired ? <HumanReviewBadge /> : <span className="text-[11px] text-steel-500 flex items-center gap-1"><Info className="w-3 h-3" /> {t('Informational only')}</span>}
      </div>
      {output.limitationNote && (
        <div className="flex items-start gap-1.5 px-4 py-2 border-t border-navy-100 text-[11px] text-steel-500">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-steel-400" />
          <span>{t(output.limitationNote)}</span>
        </div>
      )}
    </div>
  )
}

export function AIDisclaimer({ text = 'AI does not take enforcement decisions. All outputs are advisory risk signals subject to authorised officer verification and approval.' }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-saffron-200 bg-saffron-50 px-3 py-2 text-[11px] text-saffron-900">
      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{t(text)}</span>
    </div>
  )
}
