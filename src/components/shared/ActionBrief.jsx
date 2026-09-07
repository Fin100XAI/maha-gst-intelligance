import { useMemo } from 'react'
import { FileSearch, Scale, Gavel, Coins, Gauge, Clock, ArrowRight, ExternalLink, ShieldAlert, Info } from 'lucide-react'
import { Pill } from '../ui/RiskBadge.jsx'
import { buildActionBrief, CONFIDENCE_LEVELS, BRIEF_NOTE, CONFIDENCE_NOTE } from '../../data/actionBrief.js'
import { t } from '../../i18n/index.js'

const lakh = n => `₹${(n / 100000).toFixed(1)} L`

/* The seven things an officer needs before acting on an alert, in one place.
 *
 * Each of these existed somewhere already — the failure was that they existed
 * in seven different screens, so an officer acting on an alert saw the risk
 * score and none of the rest. */
export function ActionBrief({ gstin }) {
  // buildActionBrief assembles the whole case twin, which scans every
  // proceedings array. Without this it reran on every keystroke in the copilot's
  // search box and on every parent re-render behind the drilldown modal.
  const b = useMemo(() => buildActionBrief(gstin), [gstin])
  if (!b) return null

  return (
    <div className="rounded-xl border border-steel-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 bg-navy-50 border-b border-steel-200 flex items-center gap-2">
        <FileSearch className="w-4 h-4 text-navy-600 shrink-0" />
        <span className="text-[12.5px] font-bold text-navy-900">{t('Evidence-to-action brief')}</span>
        <span className="text-[11px] text-steel-500 ml-auto">{b.tradeName} · {t(b.division)}</span>
      </div>

      <div className="divide-y divide-steel-100">
        {/* 1 — EVIDENCE */}
        <Row n={1} icon={FileSearch} title={t('Evidence on record')}>
          {b.evidence.rules.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {b.evidence.rules.map(r => (
                <span key={t(r.label)} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-amber-200 bg-amber-50 text-amber-900">
                  {t(r.label)}<span className="text-amber-600 tabular-nums">+{r.weight}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-steel-500 mb-2">{t('No encoded risk rule fires for this taxpayer.')}</p>
          )}
          {b.evidence.proceedings.length > 0 && (
            <div className="space-y-1">
              {b.evidence.proceedings.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-[11.5px]">
                  <span className="text-navy-800 font-medium">{p.kind}</span>
                  <span className="text-steel-500">{p.ref}</span>
                  <span className="text-steel-400">· {t(p.detail)}</span>
                  <span className="ml-auto text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-steel-100 text-steel-500">{p.source}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-steel-500 mt-2">
            {t('Filing status: {0} · compliance history on record: {1}', b.evidence.filingStatus, b.evidence.complianceHistory)}
          </p>
        </Row>

        {/* 2 — PROVISION */}
        <Row n={2} icon={Scale} title={t('Provision engaged')}>
          {b.legal ? (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Pill tone="navy">{b.legal.sectionLabel}</Pill>
                <Pill tone="steel">{b.legal.fy}</Pill>
                {b.legal.contested && <Pill tone="red">{t('Rests on a contested notification')}</Pill>}
              </div>
              {b.legal.basis && <p className="text-[12px] text-steel-700 leading-relaxed">{b.legal.basis}</p>}
            </>
          ) : (
            <p className="text-[12px] text-steel-500">{t('No limitation record exists for this taxpayer, so no provision has been engaged by the platform.')}</p>
          )}
        </Row>

        {/* 3 — PRECEDENT */}
        <Row n={3} icon={Gavel} title={t('Precedent bearing on this case')}>
          {b.precedent.authority ? (
            <>
              <div className="rounded-lg border border-red-200 bg-red-50/60 px-3 py-2.5 mb-2">
                <div className="text-[12px] font-semibold text-navy-900 mb-0.5">{b.precedent.authority.verdict}</div>
                <p className="text-[11.5px] text-steel-700 leading-relaxed">{b.precedent.authority.text}</p>
              </div>
              <div className="space-y-1.5">
                {b.precedent.authority.authorities.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11.5px]">
                    <Pill tone={a.binding ? 'green' : 'steel'}>{a.binding ? t('Binding') : t('Persuasive')}</Pill>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-navy-900">{a.court}</span>
                      {a.caseName && <span className="text-steel-600 italic"> — {a.caseName}</span>}
                      <div className="text-steel-500">
                        {t('Favours')}: {a.favours === 'department' ? t('the department') : a.favours === 'assessee' ? t('the assessee') : t('undecided')}
                      </div>
                    </div>
                    {a.source && (
                      <a href={a.source} target="_blank" rel="noopener noreferrer" className="shrink-0 text-govt-700 hover:underline inline-flex items-center gap-0.5">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : b.precedent.departmental && b.precedent.departmental.sampleAdequate ? (
            <p className="text-[12px] text-navy-800 leading-relaxed">
              {t('Departmental record on {0}: {1} concluded proceedings, {2}% confirmed. Institutional memory, not judicial authority.',
                b.precedent.issue, b.precedent.departmental.concludedCount, b.precedent.departmental.successRatePct)}
            </p>
          ) : (
            /* Saying this plainly is more useful than presenting sector-matched
               cases as though they were authority. */
            <p className="text-[12px] text-steel-600 leading-relaxed">{b.precedent.noneReason}</p>
          )}
        </Row>

        {/* 4 — EXPOSURE */}
        <Row n={4} icon={Coins} title={t('What is at stake')}>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <Figure label={t('Assessed exposure')} value={lakh(b.exposure.assessed)} />
            {b.exposure.recoverableNow != null && <Figure label={t('Still recoverable')} value={lakh(b.exposure.recoverableNow)} tone="green" />}
            {b.exposure.decayNextWeek != null && b.exposure.decayNextWeek > 0 && (
              <Figure label={t('Decays within 7 days')} value={lakh(b.exposure.decayNextWeek)} tone="red" />
            )}
          </div>
        </Row>

        {/* 5 — CONFIDENCE, DECOMPOSED */}
        <Row n={5} icon={Gauge} title={t('Confidence — reported against four separate questions')}>
          <div className="space-y-2">
            {b.confidence.map(c => {
              const lvl = CONFIDENCE_LEVELS[c.level]
              return (
                <div key={c.id} className="rounded-lg border border-steel-200 bg-steel-50/60 px-3 py-2">
                  <div className="flex items-start gap-2 mb-1">
                    <Pill tone={lvl.tone === 'steel' ? 'steel' : lvl.tone}>{t(lvl.label)}</Pill>
                    <span className="text-[12px] font-semibold text-navy-900 leading-snug">{t(c.question)}</span>
                  </div>
                  <p className="text-[11.5px] text-steel-700 leading-relaxed">{c.because}</p>
                  <p className="text-[11px] text-steel-500 leading-relaxed mt-0.5 italic">{c.caveat}</p>
                </div>
              )
            })}
          </div>
          <div className="rounded-lg border border-steel-200 bg-white px-3 py-2 mt-2 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-steel-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-steel-600 leading-relaxed">{t(CONFIDENCE_NOTE)}</p>
          </div>
        </Row>

        {/* 6 — LIMITATION */}
        <Row n={6} icon={Clock} title={t('Limitation position')}>
          {b.limitation ? (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {b.limitation.barred
                  ? <Pill tone="red">{t('{0} days past the deadline', b.limitation.daysOverdue)}</Pill>
                  : <Pill tone={b.limitation.critical ? 'amber' : 'green'}>{t('{0} days remain', b.limitation.daysRemaining)}</Pill>}
                <span className="text-[11.5px] text-steel-500">{b.limitation.bindingLabel} · {b.limitation.bindingDate}</span>
              </div>
              <p className="text-[12px] text-navy-800 leading-relaxed">{b.limitation.verdict}</p>
            </>
          ) : (
            <p className="text-[12px] text-steel-500">{t('No limitation record. Absence of a record is not the same as absence of a deadline.')}</p>
          )}
        </Row>

        {/* 7 — NEXT STEP */}
        <Row n={7} icon={ArrowRight} title={t('Recommended next step')}>
          <div className="rounded-lg border border-navy-200 bg-navy-50/70 px-3 py-2.5">
            <div className="text-[12.5px] font-bold text-navy-900">{b.nextStep.action}</div>
            <p className="text-[11.5px] text-steel-700 leading-relaxed mt-0.5">{b.nextStep.because}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Pill tone="steel">{t('Basis: {0}', b.nextStep.basis)}</Pill>
              <span className="text-[11px] text-steel-500">{t('Requires officer approval before anything issues.')}</span>
            </div>
          </div>
        </Row>
      </div>

      <div className="px-4 py-2.5 bg-steel-50 border-t border-steel-200 flex items-start gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-steel-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-steel-600 leading-relaxed">{t(BRIEF_NOTE)}</p>
      </div>
    </div>
  )
}

function Row({ n, icon: Icon, title, children }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="shrink-0 w-5 h-5 rounded-md bg-steel-100 text-steel-600 text-[10px] font-bold flex items-center justify-center tabular-nums">{n}</span>
        <Icon className="w-3.5 h-3.5 text-steel-400 shrink-0" />
        <span className="text-[12px] font-bold text-navy-900">{title}</span>
      </div>
      <div className="pl-7">{children}</div>
    </div>
  )
}

function Figure({ label, value, tone }) {
  const color = tone === 'green' ? 'text-emerald-700' : tone === 'red' ? 'text-[#C5221F]' : 'text-navy-900'
  return (
    <div>
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400">{label}</div>
      <div className={`text-[15px] font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  )
}
