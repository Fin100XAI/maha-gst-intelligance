import { X } from 'lucide-react'
import { useEffect } from 'react'
import { t } from '../../i18n/index.js'

export function Modal({ open, onClose, title, subtitle, size = 'lg', children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const sizeMap = { md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl', full: 'max-w-7xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/50 backdrop-blur-[2px] p-4 sm:p-8">
      <div className={`relative w-full ${sizeMap[size]} bg-white rounded-xl shadow-2xl mt-4 mb-8 animate-[fadeIn_0.15s_ease-out]`}>
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-steel-100 sticky top-0 bg-white rounded-t-xl z-10">
          <div>
            <h2 className="text-base font-bold text-navy-900">{title}</h2>
            {subtitle && <p className="text-xs text-steel-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-steel-100 text-steel-500 shrink-0" aria-label={t('Close')}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-steel-100 bg-steel-50 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  )
}
