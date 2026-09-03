import { FlaskConical } from 'lucide-react'
import { REFERENCE_DATE } from '../../data/mockData.js'
import { t } from '../../i18n/index.js'

// The date every figure in the platform is measured against. It is a fixed
// point in the seeded dataset, NOT the wall clock — a screen that implies
// "as of right now" when the data is frozen is the one provenance failure an
// officer has no way to detect for themselves.
export function asOfLongLabel(locale) {
  return new Intl.DateTimeFormat(locale === 'mr' ? 'mr-IN-u-nu-latn' : 'en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(REFERENCE_DATE)
}

export function asOfLabel(locale) {
  return new Intl.DateTimeFormat(locale === 'mr' ? 'mr-IN-u-nu-latn' : 'en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(REFERENCE_DATE)
}

// Shown on every module screen via SectionHeader. This platform is a
// demonstration built on a generated dataset, and the numbers it shows are
// shaped to look exactly like real collection and risk figures — which is
// precisely why the label has to be on the screen carrying them, not only in
// the footer of the page the officer signed in from.
export function ProvenanceBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-saffron-300 bg-saffron-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-saffron-700 ${className}`}
      title={t('Every figure on this screen is generated demonstration data. No live departmental system is connected.')}
    >
      <FlaskConical className="w-3 h-3 shrink-0" aria-hidden />
      {t('Illustrative data')}
    </span>
  )
}
