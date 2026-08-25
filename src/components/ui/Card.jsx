export function Card({ title, subtitle, actions, className = '', children, padded = true }) {
  return (
    <div className={`bg-white rounded-xl border border-steel-200 shadow-card ${className}`}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-steel-100">
          <div>
            {title && <h3 className="text-sm font-semibold text-navy-800">{title}</h3>}
            {subtitle && <p className="text-xs text-steel-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </div>
  )
}

export function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5 bg-white rounded-xl border border-steel-200 shadow-card px-5 py-4">
      <div>
        {eyebrow && <div className="text-[11px] font-bold uppercase tracking-wider text-saffron-600 mb-1">{eyebrow}</div>}
        <h1 className="text-xl font-bold text-navy-900">{title}</h1>
        {description && <p className="text-sm text-steel-500 mt-1 max-w-3xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
