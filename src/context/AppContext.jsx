import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react'
import { DISTRICTS, SECTORS, AUDIT_LOG } from '../data/mockData.js'
import { getLocale, setActiveLocale } from '../i18n/index.js'

const AppContext = createContext(null)

/* ---------------------------------------------------------------------------
 * Text size — an accessibility control every officer can reach without going
 * looking for it, the same reasoning as the language switcher. Applied via
 * CSS `zoom` rather than root font-size: most of this app's type is sized
 * with Tailwind arbitrary pixel values (`text-[11px]`), which are absolute
 * and would silently ignore a font-size-only scale — `zoom` scales the
 * whole rendered page uniformly, the same way browser-native zoom does,
 * regardless of what unit any given element happens to use.
 * ------------------------------------------------------------------------- */
export const FONT_SCALES = { sm: '93.75%', base: '100%', lg: '112.5%' }
const FONT_SCALE_STORAGE_KEY = 'maha-gst.fontScale'

function readInitialFontScale() {
  try {
    if (typeof localStorage === 'undefined') return 'base'
    const raw = localStorage.getItem(FONT_SCALE_STORAGE_KEY)
    return raw && FONT_SCALES[raw] ? raw : 'base'
  } catch {
    return 'base'
  }
}

export const MODULES = [
  { id: 'command-center', label: 'Executive Command Center', group: 'Leadership' },
  { id: 'revenue-intelligence', label: 'Revenue Intelligence', group: 'Revenue' },
  { id: 'taxpayer-360', label: 'Taxpayer 360', group: 'Revenue' },
  { id: 'itc-risk', label: 'ITC Risk Intelligence', group: 'Fraud & Risk' },
  { id: 'fake-invoice', label: 'Fake Invoice Network', group: 'Fraud & Risk' },
  { id: 'eway-bill', label: 'E-Way Bill Intelligence', group: 'Fraud & Risk' },
  { id: 'refund-risk', label: 'Refund Risk Intelligence', group: 'Fraud & Risk' },
  { id: 'audit-scrutiny', label: 'Audit & Scrutiny Engine', group: 'Enforcement' },
  { id: 'sector-intelligence', label: 'Sector Intelligence', group: 'Benchmarking' },
  { id: 'district-performance', label: 'District & Division Performance', group: 'Benchmarking' },
  { id: 'officer-copilot', label: 'Officer AI Copilot', group: 'Enforcement' },
  { id: 'litigation', label: 'Litigation Intelligence', group: 'Enforcement' },
  { id: 'early-warning', label: 'Compliance Early Warning', group: 'Revenue' },
  { id: 'ai-governance', label: 'AI Governance & Security', group: 'Governance' },
  { id: 'reports', label: 'Reports & Briefing Notes', group: 'Governance' }
]

const RESTRICTED = {
  'command-center': ['Commissioner', 'Joint Commissioner'],
  'ai-governance': ['Commissioner', 'Joint Commissioner', 'AI Governance Officer'],
  'audit-scrutiny': ['Commissioner', 'Joint Commissioner', 'Division Officer', 'Audit Officer', 'Investigation Officer'],
  'refund-risk': ['Commissioner', 'Joint Commissioner', 'Division Officer', 'Refund Officer']
}

export function canAccessModule(role, moduleId) {
  if (!role) return false
  if (role === 'Read-only Policy Viewer') return moduleId === 'reports'
  const allowed = RESTRICTED[moduleId]
  if (!allowed) return true
  return allowed.includes(role)
}

const DEFAULT_FILTERS = {
  search: '',
  district: 'All Districts',
  division: 'All Divisions',
  sector: 'All Sectors',
  taxpayerType: 'All Types',
  riskLevel: 'All Risk Levels',
  dateRange: 'Last 12 Months'
}

export const DISTRICT_OPTIONS = ['All Districts', ...DISTRICTS.map(d => d.name)]
export const DIVISION_OPTIONS = ['All Divisions', ...[...new Set(DISTRICTS.map(d => d.division))]]
export const SECTOR_OPTIONS = ['All Sectors', ...SECTORS.map(s => s.name)]
export const RISK_OPTIONS = ['All Risk Levels', 'Low', 'Medium', 'High', 'Critical']
export const TAXPAYER_TYPE_OPTIONS = ['All Types', 'Regular Filer', 'Late Filer', 'Non-Filer']
export const DATE_RANGE_OPTIONS = ['Last 3 Months', 'Last 6 Months', 'Last 12 Months', 'Financial Year 2025-26']

function formatLogTimestamp(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function randomSessionIp() {
  const seg = () => Math.floor(Math.random() * 255) + 1
  return `10.${seg()}.${seg()}.${seg()}`
}

export function AppProvider({ children }) {
  const [role, setRole] = useState(null)
  const [officerName, setOfficerName] = useState('')
  const [activeModule, setActiveModule] = useState('command-center')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [drilldownTaxpayer, setDrilldownTaxpayer] = useState(null)
  const [auditLog, setAuditLog] = useState(() => [...AUDIT_LOG])
  const [sessionIp] = useState(randomSessionIp)
  const [locale, setLocaleState] = useState(getLocale)
  const [fontScale, setFontScale] = useState(readInitialFontScale)

  useEffect(() => {
    document.body.style.zoom = FONT_SCALES[fontScale]
    try {
      localStorage.setItem(FONT_SCALE_STORAGE_KEY, fontScale)
    } catch {
      // Storage unavailable — the scale still applies for this session.
    }
  }, [fontScale])

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }))
  const resetFilters = () => setFilters(DEFAULT_FILTERS)

  // t() reads a module-level variable (so it works outside React too); setLocaleState
  // is what actually triggers a re-render once that variable changes.
  const setLocale = useCallback(next => {
    setActiveLocale(next)
    setLocaleState(next)
  }, [])

  // Appends a live entry to the audit log — this session's own actions, not just seed data.
  const logAction = useCallback((action, module, caseId = '—') => {
    setAuditLog(prev => [{
      id: `LOG-LIVE-${Date.now()}-${prev.length}`,
      user: officerName || 'Guest Officer',
      role: role || 'Unauthenticated',
      action,
      module,
      caseId,
      timestamp: formatLogTimestamp(new Date()),
      ip: sessionIp,
      device: 'Desktop / Chrome (MahaGST Intranet)',
      status: 'Success',
      live: true
    }, ...prev])
  }, [role, officerName, sessionIp])

  const value = useMemo(() => ({
    role, setRole, officerName, setOfficerName,
    activeModule, setActiveModule,
    filters, setFilter, setFilters, resetFilters,
    drilldownTaxpayer, setDrilldownTaxpayer,
    auditLog, logAction,
    locale, setLocale,
    fontScale, setFontScale
  }), [role, officerName, activeModule, filters, drilldownTaxpayer, auditLog, logAction, locale, setLocale, fontScale])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

// Applies the global header filters to a taxpayer-shaped record.
export function applyGlobalFilters(taxpayer, filters) {
  if (filters.district !== 'All Districts' && taxpayer.district !== filters.district) return false
  if (filters.division !== 'All Divisions' && taxpayer.division !== filters.division) return false
  if (filters.sector !== 'All Sectors' && taxpayer.sector !== filters.sector) return false
  if (filters.taxpayerType !== 'All Types' && taxpayer.filingStatus !== filters.taxpayerType) return false
  if (filters.riskLevel !== 'All Risk Levels' && taxpayer.risk?.category !== filters.riskLevel) return false
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase()
    const hay = `${taxpayer.gstin} ${taxpayer.tradeName} ${taxpayer.legalName}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}
