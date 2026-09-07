import { useState } from 'react'
import { Info, X } from 'lucide-react'
import { t } from '../../i18n/index.js'

/**
 * One short line on screen; the reasoning behind it one click away.
 *
 * These screens used to state their method in full, inline — eighty to three
 * hundred words under a chart. The intent was right: an officer who cannot
 * interrogate a figure will not act on it. The effect was not. The reasoning
 * outweighed the finding on the page, every screen read the same way, and the
 * paragraph an officer needed on their first visit was still there on their
 * fiftieth.
 *
 * So the finding is the line, and the method is behind it. Nothing is deleted —
 * a disputed figure can still be traced to the method that produced it, which
 * is the property that has to survive any amount of tightening.
 *
 *   <MethodNote short={…the one line…} full={…the basis behind it…} />
 *
 * Both take already-translated strings. The example is written without a
 * literal t('…') call because the coverage scanner reads one inside a comment
 * as a real render site, and then reports a doc example as a translation gap.
 *
 * `full` is optional: a line that needs no defence is just a line.
 */
export function MethodNote({ short, full, tone = 'muted', className = '' }) {
  const [open, setOpen] = useState(false)
  const label = open ? t('Hide the basis for this') : t('How this is computed')

  const text =
    tone === 'plain'
      ? 'text-[12px] text-navy-800'
      : 'text-[11.5px] text-steel-500'

  return (
    <div className={className}>
      <div className="flex items-start gap-1.5">
        <p className={`${text} leading-snug flex-1`}>{short}</p>
        {full && (
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            title={label}
            className="shrink-0 mt-px inline-flex items-center justify-center w-4 h-4 rounded-full border border-steel-300 text-steel-400 hover:text-navy-700 hover:border-navy-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 transition-colors"
          >
            {open ? <X className="w-2.5 h-2.5" aria-hidden /> : <Info className="w-2.5 h-2.5" aria-hidden />}
            <span className="sr-only">{label}</span>
          </button>
        )}
      </div>
      {open && full && (
        <p className="mt-1.5 rounded-lg bg-steel-50 border border-steel-200 px-2.5 py-2 text-[11.5px] text-steel-600 leading-relaxed">
          {full}
        </p>
      )}
    </div>
  )
}
