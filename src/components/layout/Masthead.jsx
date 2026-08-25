import { useEffect, useMemo, useState } from 'react'
import { Landmark } from 'lucide-react'
import { t } from '../../i18n/index.js'
import { useApp } from '../../context/AppContext.jsx'

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
        <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-intel-400 to-intel-600 flex items-center justify-center shrink-0 ring-1 ring-white/25">
          <Landmark className="w-5 h-5 text-rail-900" />
        </div>
        <div className="relative min-w-0 flex-1">
          <h1 className="truncate text-[17px] leading-tight font-bold tracking-tight text-white">
            {t('Maha GST Intelligence')}
          </h1>
          <p className="mt-0.5 line-clamp-1 max-w-3xl text-[11px] leading-snug text-white/65">
            {t('Revenue Assurance, Fraud Risk & Compliance Intelligence Infrastructure for Maharashtra GST')}
          </p>
        </div>
        <div className="relative hidden sm:block text-right shrink-0">
          <p className="text-[9px] font-bold tracking-[0.1em] text-white/60 uppercase">{t('Position as at')}</p>
          <p className="mt-0.5 text-xs font-semibold text-white tabular-nums">
            {dateFmt.format(now)}, {timeFmt.format(now)} IST
          </p>
          <p className="mt-0.5 text-[10px] text-white/60">{t('Demonstration Environment')}</p>
        </div>
      </div>
      {/* The single piece of ornament in the shell — marks where the department's identity ends and the working surfaces begin. */}
      <div aria-hidden className="h-[3px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />
    </div>
  )
}
