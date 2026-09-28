import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown, ExternalLink, RefreshCw } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { FilterNotApplicable } from '../components/ui/FilterScope.jsx'
import { t } from '../i18n/index.js'

// GST Scrutiny is a separate application (GST v4), embedded rather than
// re-implemented so the two cannot drift apart. Embedded, it drops its own
// landing page, sign-in and sidebar: this screen supplies the menu, and the
// officer signed in here is handed over. Its address is set at build time.
const SCRUTINY_URL = import.meta.env.VITE_SCRUTINY_URL || 'http://localhost:5181'
const SCRUTINY_ORIGIN = new URL(SCRUTINY_URL).origin
const FRAME_SRC = (() => {
  const u = new URL(SCRUTINY_URL)
  u.searchParams.set('embed', '1')
  u.hash = '/dashboard'
  return u.href
})()

// The embedded app's pages, in its own order. `id` is its route.
const PAGES = [
  { section: 'Operate', items: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'network', label: 'Network' },
    { id: 'eiu', label: 'EIU signals' },
    { id: 'cases', label: 'Cases' },
    { id: 'taxpayer', label: 'Taxpayer 360°' },
    { id: 'notices', label: 'Notices' },
    { id: 'report', label: 'Reports' }
  ] },
  { section: 'Leadership', items: [
    { id: 'overview', label: 'Overview' },
    { id: 'collections', label: 'Collections' },
    { id: 'targets', label: 'Targets' },
    { id: 'actions', label: 'Actions' },
    { id: 'recovery', label: 'Recovery' },
    { id: 'learning', label: 'Learning' }
  ] },
  { section: 'Configure', items: [
    { id: 'rules', label: 'Rule register' },
    { id: 'scoring', label: 'Risk scoring' },
    { id: 'ai', label: 'AI assistant' },
    { id: 'data', label: 'Upload data' },
    { id: 'governance', label: 'Governance' }
  ] },
  { section: 'Help', items: [
    { id: 'guide', label: 'Guide' },
    { id: 'howto', label: 'How to' },
    { id: 'features', label: 'Features' },
    { id: 'catalog', label: 'Rules catalogue' },
    { id: 'demo', label: 'Commissioner demo' }
  ] }
]
const [PRIMARY, ...MENUS] = PAGES

// Space kept below the frame so the page itself never scrolls.
const BOTTOM_GAP_PX = 24
const MIN_HEIGHT_PX = 560

const tabClass = on => `relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] whitespace-nowrap transition-colors ${
  on ? 'bg-govt-50 font-semibold text-govt-700 ring-1 ring-govt-200/60' : 'font-medium text-navy-700 hover:bg-steel-50'
}`

function PageMenu({ section, current, onGo }) {
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  const active = section.items.find(p => p.id === current)

  // Clicking into the frame never reaches this document; the window losing focus is the signal.
  useEffect(() => {
    if (!open) return undefined
    const onDown = e => { if (!box.current?.contains(e.target)) setOpen(false) }
    const onBlur = () => setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('blur', onBlur)
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('blur', onBlur) }
  }, [open])

  return (
    <div ref={box} className="relative">
      <button type="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(o => !o)} className={tabClass(!!active)}>
        {t(section.section)}{active && <span className="font-normal text-govt-600">· {t(active.label)}</span>}
        <ChevronDown className={`w-3 h-3 text-steel-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-56 rounded-xl border border-steel-200 bg-white p-1.5 shadow-panel">
          {section.items.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onGo(p.id); setOpen(false) }}
              className={`w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] ${p.id === current ? 'bg-govt-50 font-semibold text-govt-700' : 'font-medium text-navy-800 hover:bg-steel-50'}`}
            >
              {t(p.label)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GstScrutiny() {
  const { filters, officerName } = useApp()
  const frame = useRef(null)
  const frameBox = useRef(null)
  const [height, setHeight] = useState(MIN_HEIGHT_PX)
  const [status, setStatus] = useState('checking')
  const [attempt, setAttempt] = useState(0)
  const [view, setView] = useState('dashboard')
  const [openCases, setOpenCases] = useState(null)

  // A cross-origin frame cannot report that its server is down, so ask first:
  // an opaque response means the app answered; a network error means it did not.
  useEffect(() => {
    let cancelled = false
    setStatus('checking')
    fetch(SCRUTINY_URL, { mode: 'no-cors', cache: 'no-store' })
      .then(() => { if (!cancelled) setStatus('up') })
      .catch(() => { if (!cancelled) setStatus('down') })
    return () => { cancelled = true }
  }, [attempt])

  // The handshake. Only our own frame, on the configured origin, is listened to.
  useEffect(() => {
    const onMessage = e => {
      if (e.origin !== SCRUTINY_ORIGIN || e.source !== frame.current?.contentWindow) return
      const msg = e.data || {}
      if (msg.type === 'scrutiny:ready') {
        e.source.postMessage({ type: 'scrutiny:officer', officer: { name: officerName || 'Guest Officer' } }, SCRUTINY_ORIGIN)
      } else if (msg.type === 'scrutiny:route') {
        if (typeof msg.view === 'string') setView(msg.view)
        if (Number.isFinite(msg.openCases)) setOpenCases(msg.openCases)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [officerName])

  const go = useCallback(id => {
    setView(id)
    frame.current?.contentWindow?.postMessage({ type: 'scrutiny:go', view: id }, SCRUTINY_ORIGIN)
  }, [])

  const fit = useCallback(() => {
    const top = frameBox.current?.getBoundingClientRect().top ?? 0
    setHeight(Math.max(MIN_HEIGHT_PX, window.innerHeight - top - BOTTOM_GAP_PX))
  }, [])

  // The filter notice above the frame appears and disappears, moving its top.
  useLayoutEffect(() => {
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [fit, status, filters])

  return (
    <>
      <FilterNotApplicable reason={t('GST Scrutiny has its own filters, which narrow what it shows from inside it.')} />
      <div className="rounded-xl border border-steel-200 bg-white shadow-card">
        {status === 'up' && (
          <nav aria-label={t('GST Scrutiny pages')} className="flex flex-wrap items-center gap-0.5 border-b border-steel-200 px-2 py-1.5">
            {PRIMARY.items.map(p => (
              <button key={p.id} type="button" aria-current={p.id === view ? 'page' : undefined} onClick={() => go(p.id)} className={tabClass(p.id === view)}>
                {t(p.label)}
                {p.id === 'cases' && openCases > 0 && (
                  <span className="rounded-full bg-gold-100 px-1.5 py-px text-[10px] font-bold tabular-nums text-gold-700 ring-1 ring-gold-200">{openCases}</span>
                )}
              </button>
            ))}
            <span className="mx-1.5 h-5 w-px bg-steel-200" aria-hidden />
            {MENUS.map(s => <PageMenu key={s.section} section={s} current={view} onGo={go} />)}
          </nav>
        )}

        <div ref={frameBox} style={{ height }} className="overflow-hidden rounded-b-xl">
          {status === 'up' && (
            <iframe ref={frame} title={t('GST Scrutiny')} src={FRAME_SRC} className="h-full w-full border-0" allow="clipboard-write" />
          )}

          {status === 'checking' && (
            <div className="flex h-full items-center justify-center text-sm text-steel-500">
              {t('Connecting to GST Scrutiny…')}
            </div>
          )}

          {status === 'down' && (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <AlertTriangle className="h-8 w-8 text-maharisk-high" />
              <p className="text-base font-semibold text-navy-900">{t('GST Scrutiny is not running')}</p>
              <p className="max-w-md text-sm text-steel-600">
                {t('Nothing answered at {0}. Start the scrutiny app, then try again.', SCRUTINY_URL)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAttempt(a => a + 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-govt-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-govt-800"
                >
                  <RefreshCw className="h-4 w-4" /> {t('Try again')}
                </button>
                <a
                  href={SCRUTINY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-steel-200 px-3 py-1.5 text-sm font-medium text-navy-800 hover:bg-steel-50"
                >
                  <ExternalLink className="h-4 w-4" /> {t('Open in a new tab')}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
