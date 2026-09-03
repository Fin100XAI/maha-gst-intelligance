import { useEffect, useMemo, useState } from 'react'
import { t } from '../../i18n/index.js'
import { Logo } from './Logo.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { asOfLabel } from '../ui/DataProvenance.jsx'

// The identity band, above everything — the seal, the department, and the
// moment the figures were taken. It scrolls away with the page; the search
// bar beneath it is what stays pinned, since that's what an officer reaches
// for mid-task, not the letterhead.
export function Masthead() {
  const { locale } = useApp()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Marathi month/weekday names, Latin-numeral digits — Government of
  // Maharashtra practice, and what keeps a date column alignable.
  const intlLocale = locale === 'mr' ? 'mr-IN-u-nu-latn' : 'en-IN'
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(intlLocale, { timeZone: 'Asia/Kolkata', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
    [intlLocale]
  )
  const timeFmt = useMemo(
    () => new Intl.DateTimeFormat(intlLocale, { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }),
    [intlLocale]
  )

  return (
    <div className="shrink-0">
      <div className="relative flex flex-wrap items-center gap-3 overflow-hidden bg-govt-900 px-4 py-2.5 sm:px-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }}
        />
        <Logo size="lg" className="relative ring-1 ring-white/25" />
        <div className="relative min-w-0 flex-1">
          <h1 className="truncate text-[17px] leading-tight font-bold tracking-tight text-white">
            {t('Maha GST Intelligence')}
          </h1>
          <p className="mt-0.5 line-clamp-1 max-w-3xl text-[11px] leading-snug text-white/65">
            {t('Revenue Assurance, Fraud Risk & Compliance Intelligence Infrastructure for Maharashtra GST')}
          </p>
        </div>
        {/* "Position as at" must name the date the FIGURES describe, not the
            wall clock. The dataset is fixed at REFERENCE_DATE, so showing a
            live ticking timestamp here told an officer the numbers were current
            to the second when they were in fact weeks old. The clock is still
            useful — as the session clock, labelled as such. */}
        <div className="relative text-right shrink-0">
          <p className="text-[9px] font-bold tracking-[0.1em] text-white/60 uppercase">{t('Position as at')}</p>
          <p className="mt-0.5 text-xs font-semibold text-white tabular-nums">{asOfLabel(locale)}</p>
          <p className="mt-0.5 hidden text-[10px] text-white/60 tabular-nums sm:block">
            {t('Session')}: {dateFmt.format(now)}, {timeFmt.format(now)} IST
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-gold-300">{t('Demonstration Environment · Simulated data')}</p>
        </div>
      </div>
      {/* The single piece of ornament in the shell — marks where the department's identity ends and the working surfaces begin. */}
      <div aria-hidden className="h-[3px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />
    </div>
  )
}
