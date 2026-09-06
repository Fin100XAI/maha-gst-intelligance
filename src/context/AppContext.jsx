import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react'
// `isWithinDateRange` is used by applyCaseFilters below. It was missing from
// this import, which is not a build error — an undefined free variable inside a
// function body only fails when that function runs — so every module filtering
// a dated case list threw at render.
import { DISTRICTS, SECTORS, AUDIT_LOG, isWithinDateRange } from '../data/mockData.js'
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

/* ---------------------------------------------------------------------------
 * Theme — the third of the three controls GIGW expects an officer to reach on
 * every screen, alongside text size and language. Applied as `data-theme` on
 * <html>, which swaps the colour-token block in index.css; nothing downstream
 * needs a `dark:` variant. Defaults to the OS preference on first visit, and
 * is remembered per browser thereafter.
 * ------------------------------------------------------------------------- */
export const THEMES = ['light', 'dark']
const THEME_STORAGE_KEY = 'maha-gst.theme'

function readInitialTheme() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(THEME_STORAGE_KEY)
      if (THEMES.includes(raw)) return raw
    }
  } catch {
    // Storage unavailable — fall through to the OS preference.
  }
  if (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

// Order within a group is the order the menu lists them, and the first entry a
// role can access is where that role lands after sign-in.
export const MODULES = [
  // ---- Commissionerate ----
  { id: 'revenue-protection', label: 'Revenue Protection Command Centre', group: 'Commissionerate' },
  { id: 'command-center', label: 'Executive Command Center', group: 'Commissionerate' },
  { id: 'statutory-time', label: 'Statutory Time Intelligence', group: 'Commissionerate' },
  { id: 'capacity', label: 'Officer Capacity & Deployment', group: 'Commissionerate' },
  { id: 'retrospective', label: 'Retrospective Intelligence', group: 'Commissionerate' },
  // ---- Registration & Returns ----
  { id: 'case-twin', label: 'Case Digital Twin', group: 'Registration & Returns' },
  { id: 'taxpayer-360', label: 'Taxpayer 360', group: 'Registration & Returns' },
  { id: 'early-warning', label: 'Compliance Early Warning', group: 'Registration & Returns' },
  { id: 'revenue-intelligence', label: 'Revenue Intelligence', group: 'Registration & Returns' },
  // ---- Audit & Assessment ----
  { id: 'audit-scrutiny', label: 'Audit & Scrutiny Engine', group: 'Audit & Assessment' },
  { id: 'case-priority', label: 'Case Priority Engine', group: 'Audit & Assessment' },
  { id: 'officer-copilot', label: 'Officer AI Copilot', group: 'Audit & Assessment', hidden: true },
  // ---- Investigation & Enforcement ----
  { id: 'fake-invoice', label: 'Fake Invoice Network', group: 'Investigation & Enforcement' },
  { id: 'network-enforcement', label: 'Network Enforcement', group: 'Investigation & Enforcement' },
  { id: 'unknown-risk', label: 'Unknown Risk Discovery', group: 'Investigation & Enforcement' },
  { id: 'itc-risk', label: 'ITC Risk Intelligence', group: 'Investigation & Enforcement' },
  { id: 'eway-bill', label: 'E-Way Bill Intelligence', group: 'Investigation & Enforcement' },
  // ---- Refund & Recovery ----
  { id: 'refund-risk', label: 'Refund Risk Intelligence', group: 'Refund & Recovery' },
  { id: 'recovery-window', label: 'Revenue at Risk & Recovery', group: 'Refund & Recovery' },
  // ---- Legal & Appeals ----
  { id: 'litigation', label: 'Litigation Intelligence', group: 'Legal & Appeals' },
  { id: 'precedent', label: 'Precedent Intelligence', group: 'Legal & Appeals' },
  // ---- Analytics & Governance ----
  { id: 'district-performance', label: 'District & Division Performance', group: 'Analytics & Governance' },
  { id: 'sector-intelligence', label: 'Sector Intelligence', group: 'Analytics & Governance' },
  { id: 'ai-governance', label: 'AI Governance & Security', group: 'Analytics & Governance' },
  { id: 'reports', label: 'Reports & Briefing Notes', group: 'Analytics & Governance' },
  { id: 'official-statistics', label: 'Official Statistics', group: 'Analytics & Governance' }
]

// The modules the navigation menus and the landing-page grid list. Routing,
// breadcrumbs and role checks still use MODULES, so a hidden module remains
// fully reachable and correctly labelled once open.
export const NAV_MODULES = MODULES.filter(m => !m.hidden)

const RESTRICTED = {
  'statutory-time': ['Commissioner', 'Joint Commissioner', 'Division Officer', 'Audit Officer'],
  'recovery-window': ['Commissioner', 'Joint Commissioner', 'Division Officer'],
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
  // Whether the officer has passed the landing page. Held here rather than in
  // Shell so the profile menu can offer a real sign-out that returns to the
  // landing page, distinct from switching role, which does not.
  const [entered, setEntered] = useState(false)
  const [role, setRole] = useState(null)
  const [officerName, setOfficerName] = useState('')
  const [activeModule, setActiveModule] = useState('command-center')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [drilldownTaxpayer, setDrilldownTaxpayer] = useState(null)
  const [auditLog, setAuditLog] = useState(() => [...AUDIT_LOG])
  const [sessionIp] = useState(randomSessionIp)
  const [locale, setLocaleState] = useState(getLocale)
  const [fontScale, setFontScale] = useState(readInitialFontScale)
  const [theme, setTheme] = useState(readInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Storage unavailable — the theme still applies for this session.
    }
  }, [theme])

  useEffect(() => {
    document.body.style.zoom = FONT_SCALES[fontScale]
    try {
      localStorage.setItem(FONT_SCALE_STORAGE_KEY, fontScale)
    } catch {
      // Storage unavailable — the scale still applies for this session.
    }
  }, [fontScale])

  const enterPlatform = useCallback(() => setEntered(true), [])

  // Sign out returns the officer to the landing page and clears their identity.
  // Switching role (setRole(null)) keeps them inside the platform.
  const signOut = useCallback(() => {
    setEntered(false)
    setRole(null)
    setOfficerName('')
    setActiveModule('command-center')
    setFilters(DEFAULT_FILTERS)
  }, [])

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
    entered, enterPlatform, signOut,
    role, setRole, officerName, setOfficerName,
    activeModule, setActiveModule,
    filters, setFilter, setFilters, resetFilters,
    drilldownTaxpayer, setDrilldownTaxpayer,
    auditLog, logAction,
    locale, setLocale,
    fontScale, setFontScale,
    theme, setTheme
  }), [entered, enterPlatform, signOut, role, officerName, activeModule, filters, drilldownTaxpayer, auditLog, logAction, locale, setLocale, fontScale, theme])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

/* ---------------------------------------------------------------------------
 * Applies the global header filters to a CASE-shaped record — audit, refund,
 * litigation and compliance-alert rows, which carry their own district /
 * division / sector / risk fields rather than a nested `risk` object.
 *
 * This exists because those four modules each hand-rolled their own version,
 * and the four copies had drifted: none checked division, litigation ignored
 * risk level, and early warning ignored the date range. A filter that silently
 * matches everything is worse than one that is absent — the officer believes
 * the queue in front of them is scoped when it is not.
 *
 * `dateField` names the record's own date column (openedOn / filedOn / raisedOn).
 * Pass null for a record type that carries no date.
 * ------------------------------------------------------------------------- */
export function applyCaseFilters(record, filters, dateField = null) {
  if (filters.district !== 'All Districts' && record.district !== filters.district) return false
  if (filters.division !== 'All Divisions' && record.division !== filters.division) return false
  if (filters.sector !== 'All Sectors' && record.sector !== filters.sector) return false
  if (filters.riskLevel !== 'All Risk Levels' && record.riskCategory !== filters.riskLevel) return false
  if (dateField && !isWithinDateRange(record[dateField], filters.dateRange)) return false
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase()
    if (!`${record.gstin} ${record.tradeName}`.toLowerCase().includes(q)) return false
  }
  return true
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
