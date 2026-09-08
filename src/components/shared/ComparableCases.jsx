import { useMemo } from 'react'
import { GitCompare, Check, Minus, Info, Scale } from 'lucide-react'
import { Card } from '../ui/Card.jsx'
import { Pill } from '../ui/RiskBadge.jsx'
import { findComparables, DIMENSIONS, SIMILARITY_NOTE, OUTCOME_NOTE } from '../../data/similarity.js'
import { t } from '../../i18n/index.js'

const lakh = n => `₹${(n / 100000).toFixed(1)} L`

const KLASS = {
  determinative: { label: 'Determinative', tone: 'red', note: 'Decides outcomes.' },
  contextual: { label: 'Contextual', tone: 'amber', note: 'Shapes how a case is argued.' },
  descriptive: { label: 'Descriptive', tone: 'steel', note: 'Decides nothing.' }
}

/* Comparable concluded proceedings and what actually happened in them.
 *
 * Not a resemblance score. Comparability is scored on the dimensions that can
 * move an outcome, every dimension's contribution is visible so the score can
 * be argued with, and what DIFFERS is shown beside what matches — a comparable
 * case that differs on a material fact is a trap rather than a guide. */
export function ComparableCases({ gstin }) {
  const r = useMemo(() => findComparables(gstin), [gstin])
  if (!r) return null

  return (
    <Card tone="yellow"
      title={t('Comparable concluded proceedings')}
      subtitle={t('Drawn from the {0} proceedings in the department’s record that have actually concluded and carry an outcome.', r.poolSize)}
      padded={false}
    >
      {/* The gate, stated before any outcome is read. */}
      <div className={`px-5 py-3 border-b ${r.rateStated ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'}`}>
        <div className="flex items-start gap-2.5">
          <Scale className={`w-4 h-4 shrink-0 mt-0.5 ${r.rateStated ? 'text-emerald-700' : 'text-amber-600'}`} />
          <p className="text-[12px] text-navy-800 leading-relaxed">{t(r.rateNoteMsg.key, ...r.rateNoteMsg.args)}</p>
        </div>
      </div>

      {r.none ? (
        <div className="px-5 py-5">
          <p className="text-[12.5px] text-steel-600 leading-relaxed">{r.noneReason}</p>
        </div>
      ) : (
        <div className="divide-y divide-steel-100">
          {r.comparables.map(c => (
            <div key={c.gstin} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[13px] font-bold text-navy-900">{c.tradeName}</span>
                <span className="text-[11.5px] text-steel-500">{t(c.division)}</span>
                {c.outcomeMeta && (
                  <Pill tone={c.outcomeMeta.tone === 'green' ? 'green' : c.outcomeMeta.tone === 'red' ? 'red' : 'amber'}>
                    {c.outcomeMeta.label}
                  </Pill>
                )}
                <span className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-steel-400">{t('Comparability')}</span>
                  <span className="text-[13px] font-bold text-navy-900 tabular-nums">{c.score}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-steel-600 mb-2.5">
                {c.issue && <span>{t(c.issue)}</span>}
                {c.disputedAmount != null && <span className="tabular-nums">{lakh(c.disputedAmount)}</span>}
                {c.departmentPosition && <span>{t('Position')}: {t(c.departmentPosition)}</span>}
                {c.ageingDays != null && <span className="tabular-nums">{t('{0} days', c.ageingDays)}</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2.5">
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 mb-1.5">{t('Why it is comparable')}</div>
                  {c.matches.length ? (
                    <ul className="space-y-1">
                      {c.matches.map((m, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11.5px] text-navy-800 leading-relaxed">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span><span className="text-steel-500">[{KLASS[m.klass].label}]</span> {t(m.text)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-[11.5px] text-steel-500">{t('No positive match beyond the score.')}</p>}
                </div>

                {/* Equal weight, deliberately. This is the half that stops an
                    officer relying on a case that does not actually apply. */}
                <div className="rounded-lg border border-red-200 bg-red-50/40 px-3 py-2.5">
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#C5221F] mb-1.5">{t('How it differs — read before relying on it')}</div>
                  {c.distinguishers.length ? (
                    <ul className="space-y-1">
                      {c.distinguishers.map((d, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11.5px] text-navy-800 leading-relaxed">
                          <Minus className="w-3 h-3 text-[#C5221F] shrink-0 mt-0.5" />
                          <span><span className="text-steel-500">[{KLASS[d.klass].label}]</span> {t(d.text)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-[11.5px] text-steel-500">{t('No material difference detected on the assessed dimensions.')}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How the score is built, so it can be disagreed with. */}
      <div className="px-5 py-3.5 border-t border-steel-100 bg-steel-50/60">
        <div className="flex items-center gap-1.5 mb-2">
          <GitCompare className="w-3.5 h-3.5 text-steel-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-steel-500">{t('Dimensions and their weight')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
          {DIMENSIONS.map(d => (
            <div key={d.id} className="rounded-md border border-steel-200 bg-white px-2.5 py-2" title={t(d.why)}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-semibold text-navy-800">{t(d.label)}</span>
                <span className="text-[11.5px] font-bold text-navy-900 tabular-nums">{d.weight.toFixed(2)}</span>
              </div>
              <Pill tone={KLASS[d.klass].tone}>{t(KLASS[d.klass].label)}</Pill>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-steel-600 leading-relaxed mb-1.5">{t(SIMILARITY_NOTE)}</p>
        <div className="flex items-start gap-2 pt-2 border-t border-steel-200">
          <Info className="w-3.5 h-3.5 text-steel-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-steel-600 leading-relaxed">{t(OUTCOME_NOTE)}</p>
        </div>
      </div>
    </Card>
  )
}
