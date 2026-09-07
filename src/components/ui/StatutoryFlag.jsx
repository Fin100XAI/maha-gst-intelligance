import { AlertTriangle, Clock, Ban } from 'lucide-react'
import { statutoryPositionFor, statutoryReviewOf } from '../../data/caseTwin.js'
import { t } from '../../i18n/index.js'

/* The Case Digital Twin's statutory verdict, rendered wherever a proceeding is
 * listed.
 *
 * The twin and the operational screens read the same records, so their fields
 * agree. What they disagreed about was the conclusion: a taxpayer whose
 * limitation period has expired appeared in the audit queue as live work, with
 * an officer assigned and a next stage to advance to, while the twin said the
 * case should be reviewed for closure. An officer following the queue would
 * spend a day on a demand that can no longer be raised.
 *
 * Rendering nothing when there is nothing to say is deliberate — a badge on
 * every row trains officers to ignore badges. */
export function StatutoryFlag({ gstin, showSafe = false }) {
  const pos = statutoryPositionFor(gstin)
  if (!pos) return null

  if (pos.barred) {
    return (
      <span
        title={t(pos.verdictMsg.key, ...pos.verdictMsg.args)}
        className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 text-[#C5221F] text-[10.5px] font-bold px-1.5 py-0.5 whitespace-nowrap"
      >
        <Ban className="w-3 h-3 shrink-0" />
        {t('Time-barred')}
      </span>
    )
  }
  if (pos.critical) {
    return (
      <span
        title={t(pos.verdictMsg.key, ...pos.verdictMsg.args)}
        className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 text-amber-800 text-[10.5px] font-bold px-1.5 py-0.5 whitespace-nowrap"
      >
        <Clock className="w-3 h-3 shrink-0" />
        {t('{0}d left', pos.daysRemaining)}
      </span>
    )
  }
  if (showSafe && pos.daysRemaining != null) {
    return <span className="text-[10.5px] text-steel-400 tabular-nums whitespace-nowrap">{t('{0}d', pos.daysRemaining)}</span>
  }
  return null
}

/* A banner over a list of proceedings. Silent unless something in the list is
 * actually expired or expiring, so it stays worth reading. */
export function StatutoryReviewBanner({ records, gstinOf, context }) {
  const review = statutoryReviewOf(records, gstinOf)
  if (!review) return null

  const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`
  // An expired period and an expiring one are different warnings; the banner
  // must not dress the softer one in the harder one's colours.
  const severe = review.barred.length > 0

  return (
    <div className={`rounded-xl border px-5 py-4 mb-4 flex items-start gap-3 ${severe ? 'border-red-300 bg-red-50/60' : 'border-amber-300 bg-amber-50/60'}`}>
      <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${severe ? 'text-[#C5221F]' : 'text-amber-600'}`} />
      <div className="min-w-0">
        {review.barred.length > 0 && (
          <>
            <div className="text-[13.5px] font-bold text-navy-900 mb-1">
              {t('{0} of these {1} are on periods that are already time-barred — {2} of exposure that can no longer be demanded.',
                review.barred.length, context, cr(review.barredExposure))}
            </div>
            <p className="text-[12.5px] text-steel-700 leading-relaxed mb-2">
              {t('The limitation period has expired, so no demand can lawfully be raised for these periods however the case is worked. They should be reviewed for closure rather than advanced, and the officer-days they hold released to cases that are still live.')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {review.barred.slice(0, 8).map(b => (
                <span key={b.gstin} title={t(b.verdictMsg.key, ...b.verdictMsg.args)} className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white text-[11px] px-2 py-0.5">
                  <Ban className="w-3 h-3 text-[#C5221F] shrink-0" />
                  <span className="text-navy-800">{b.fy}</span>
                  <span className="text-steel-500 tabular-nums">{t('{0}d overdue', b.daysOverdue)}</span>
                </span>
              ))}
            </div>
          </>
        )}
        {review.critical.length > 0 && (
          <p className={`text-[12.5px] leading-relaxed ${severe ? 'text-amber-800 mt-3 pt-2 border-t border-red-200/70' : 'text-navy-900'}`}>
            <strong>{severe
              ? t('{0} more expire within 30 days', review.critical.length)
              : t('{0} of these {1} expire within 30 days', review.critical.length, context)}</strong>
            {t(' — {0} of exposure that will be extinguished by operation of law if the notice does not issue in time.', cr(review.criticalExposure))}
          </p>
        )}
      </div>
    </div>
  )
}

/* The limitation position in plain words, for a modal or detail panel. Shown
 * only when there is something to say — and deliberately placed where an
 * officer is about to ACT on a case, not merely browse it, because the stage-
 * advance control is the moment the warning has to land. */
export function StatutoryVerdict({ gstin }) {
  const pos = statutoryPositionFor(gstin)
  if (!pos || (!pos.barred && !pos.critical)) return null
  const severe = pos.barred
  return (
    <div className={`rounded-lg border px-3.5 py-2.5 mb-3 ${severe ? 'border-red-300 bg-red-50/60' : 'border-amber-300 bg-amber-50/60'}`}>
      <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${severe ? 'text-[#C5221F]' : 'text-amber-700'}`}>
        {severe ? t('Statutory period expired') : t('Statutory deadline approaching')}
      </div>
      <p className="text-[12px] text-navy-800 leading-relaxed">{t(pos.verdictMsg.key, ...pos.verdictMsg.args)}</p>
      {severe && (
        <p className="text-[11.5px] text-[#C5221F] font-medium leading-relaxed mt-1">
          {t('Advancing this case cannot produce a recoverable demand. Review it for closure.')}
        </p>
      )}
      {pos.contested && (
        <p className="text-[11.5px] text-steel-600 leading-relaxed mt-1">
          {t('This deadline rests on a notification whose validity is reserved before the Supreme Court — see Precedent Intelligence.')}
        </p>
      )}
    </div>
  )
}
