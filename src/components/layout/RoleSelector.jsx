import { useState } from 'react'
import { ShieldCheck, Gavel, Receipt, Search, Bot, FileBarChart2, Crown, Users, ChevronRight, KeyRound, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { useApp, NAV_MODULES, canAccessModule, ROLE_SECTIONS, DEMO_ACCESS_CODE, DEMO_GATE_NOTE } from '../../context/AppContext.jsx'
import { OFFICER_ROLES, officerByRole } from '../../data/mockData.js'
import { t } from '../../i18n/index.js'
import { Logo } from './Logo.jsx'
import { LanguageSwitcher } from './LanguageSwitcher.jsx'
import { FontSizeControl } from './FontSizeControl.jsx'
import { ThemeSwitcher } from './ThemeSwitcher.jsx'

// These two roles are scoped to "cases assigned to me" elsewhere in the app —
// so identity here must resolve to a real officer record, not free text.
const CASE_SCOPED_ROLES = ['Audit Officer', 'Refund Officer']

const ROLE_META = {
  'Commissioner': { icon: Crown, desc: 'Full state-wide access. Executive command center, all intelligence modules and AI governance.' },
  'Joint Commissioner': { icon: ShieldCheck, desc: 'Full state-wide access with divisional oversight responsibilities.' },
  'Division Officer': { icon: Users, desc: 'Division-level revenue, audit and refund intelligence for assigned territory.' },
  'Audit Officer': { icon: Search, desc: 'Access to assigned audit and scrutiny cases and case-level intelligence.' },
  'Refund Officer': { icon: Receipt, desc: 'Access to refund risk intelligence and assigned refund cases.' },
  'Investigation Officer': { icon: Gavel, desc: 'Access to fake invoice network, ITC risk and audit case intelligence.' },
  'AI Governance Officer': { icon: Bot, desc: 'Access to AI governance dashboard, model logs and override review.' },
  'Read-only Policy Viewer': { icon: FileBarChart2, desc: 'Read-only access to reports and briefing notes only.' }
}

export function RoleSelector() {
  const { setRole, setOfficerName, setActiveModule } = useApp()
  const [selected, setSelected] = useState(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [error, setError] = useState('')

  const enter = () => {
    if (!selected) return
    if (code !== DEMO_ACCESS_CODE) {
      setError(t('Access code not recognised.'))
      return
    }
    setError('')
    setOfficerName(name.trim() || 'Guest Officer')
    setRole(selected)
    // command-center (the module's default landing state) isn't visible to every
    // role — land instead on the first module this role can actually see.
    const firstAccessible = NAV_MODULES.find(m => canAccessModule(selected, m.id))
    setActiveModule(firstAccessible ? firstAccessible.id : 'command-center')
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col lg:flex-row">
      {/* Left: identity and what the officer is signing into. Carries the
          simulated-data statement so it is read before sign-in, not after. */}
      <div className="lg:w-1/2 bg-govt-900 text-white flex flex-col justify-between px-6 sm:px-10 py-6 shrink-0 lg:h-full">
        <div className="flex justify-end gap-2">
          <FontSizeControl className="hidden sm:flex bg-white/10 border-white/15" />
          <ThemeSwitcher className="bg-white/10 border-white/15" />
          <LanguageSwitcher className="bg-white/10 border-white/15" />
        </div>

        <div className="max-w-md mx-auto lg:mx-0 py-4">
          <Logo size="xl" className="mb-4 shadow-panel" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">{t('Maha GST Intelligence')}</h1>
          <p className="text-govt-200 text-[11px] tracking-widest uppercase font-semibold mt-2">
            {t('Government of Maharashtra · State GST Department')}
          </p>
          <p className="text-govt-100 text-sm mt-4 leading-relaxed hidden sm:block">
            {t('Revenue Assurance, Fraud Risk & Compliance Intelligence Infrastructure for Maharashtra GST')}
          </p>

          <ul className="mt-6 space-y-2.5 hidden sm:block">
            {[
              t('Access follows the role held, and every action is logged against the officer who took it.'),
              t('Every figure states the system it came from and whether it is simulated.'),
              t('The platform makes no call to the open internet for its figures, models or maps.')
            ].map((line, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[12.5px] text-govt-100 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-govt-300 shrink-0 mt-0.5" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3 hidden lg:block">
          <p className="text-[11px] text-govt-200 leading-relaxed">
            {t('Demonstration environment. Every taxpayer, return, notice and case in this platform is simulated; the statute, notifications and published collection figures are real.')}
          </p>
        </div>
      </div>

      {/* Right: the sign-in itself. */}
      <div className="lg:w-1/2 bg-steel-50 flex-1 min-h-0 overflow-hidden">
        <div className="max-w-xl mx-auto px-6 sm:px-8 py-4 flex flex-col h-full">
          <div className="shrink-0">
            <h2 className="text-base font-bold text-navy-900">{t('Officer Sign-In')}</h2>
            <p className="text-[12px] text-steel-600 mt-0.5">{t('Select your role, then enter the access code.')}</p>
          </div>

          {!CASE_SCOPED_ROLES.includes(selected) && (
            <div className="mt-2.5 shrink-0">
              <label className="text-[11px] font-semibold text-steel-500">{t('Officer Name (optional)')}</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('e.g. Rohan Deshmukh')}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-steel-200 bg-white focus:outline-none focus:ring-2 focus:ring-govt-300"
              />
            </div>
          )}

          <div className="text-[11px] font-semibold text-steel-500 mt-2.5 mb-1.5 shrink-0">{t('Select Role to Continue')}</div>
          <div className="grid grid-cols-2 gap-1.5 content-start flex-1 min-h-0 overflow-y-auto pr-1">
            {OFFICER_ROLES.map(role => {
              const meta = ROLE_META[role]
              const Icon = meta.icon
              const active = selected === role
              return (
                <button
                  key={role}
                  onClick={() => { setSelected(role); setName('') }}
                  className={`text-left flex items-start gap-2 px-2.5 py-2 rounded-lg border transition-all bg-white ${active ? 'border-govt-600 bg-govt-50 ring-2 ring-govt-200' : 'border-steel-200 hover:border-govt-300 hover:bg-steel-50'}`}
                >
                  <span className={`p-1.5 rounded-md shrink-0 ${active ? 'bg-govt-700 text-white' : 'bg-steel-100 text-steel-600'}`}><Icon className="w-3.5 h-3.5" /></span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-navy-900 leading-tight">{t(role)}</span>
                    <span className="block text-[10.5px] text-steel-500 leading-snug mt-0.5">{t(meta.desc)}</span>
                  </span>
                </button>
              )
            })}
          </div>
          {CASE_SCOPED_ROLES.includes(selected) && (
            <div className="mt-3 shrink-0">
              <label className="text-xs font-semibold text-steel-500">{t('You are signing in as')}</label>
              <select
                value={name}
                onChange={e => setName(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 text-sm rounded-lg border border-steel-200 focus:outline-none focus:ring-2 focus:ring-govt-300 bg-white"
              >
                <option value="">{t('Select your officer record…')}</option>
                {officerByRole(selected).map(o => (
                  <option key={o.id} value={o.name}>{o.name} — {o.district} ({o.assignedCases} {t('assigned cases')})</option>
                ))}
              </select>
              <p className="text-[10.5px] text-steel-400 mt-1.5">{t('This role is scoped to cases assigned to you specifically — pick your officer record so that scoping resolves correctly.')}</p>
            </div>
          )}

          {selected && (
            <div className="mt-2.5 rounded-lg border border-steel-200 bg-steel-50/70 px-3 py-2 shrink-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-steel-500 mb-1">{t('Sections this role opens')}</div>
              <div className="flex flex-wrap gap-1">
                {ROLE_SECTIONS[selected] === 'all'
                  ? <span className="text-[11px] px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800">{t('All sections')}</span>
                  : ROLE_SECTIONS[selected].map(sec => (
                    <span key={sec} className="text-[11px] px-1.5 py-0.5 rounded border border-steel-200 bg-white text-navy-800">{t(sec)}</span>
                  ))}
              </div>
            </div>
          )}

          <label className="block mt-2.5 shrink-0">
            <span className="text-[11px] font-semibold text-steel-600 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-steel-400" />{t('Demonstration access code')}
            </span>
            <span className="relative block mt-1">
            <input
              type={showCode ? 'text' : 'password'}
              value={code}
              name="maha-demo-access-code"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
              onChange={e => { setCode(e.target.value); if (error) setError('') }}
              onKeyDown={e => { if (e.key === 'Enter') enter() }}
              placeholder={t('Enter the access code')}
              className={`w-full px-3 py-2 pr-10 text-sm rounded-lg border focus:outline-none focus:ring-2 bg-white ${
                error ? 'border-red-300 focus:ring-red-300' : 'border-steel-200 focus:ring-govt-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowCode(v => !v)}
              aria-label={showCode ? t('Hide access code') : t('Show access code')}
              title={showCode ? t('Hide access code') : t('Show access code')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-steel-400 hover:text-navy-700 hover:bg-steel-100"
            >
              {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            </span>
            {error && (
              <span className="flex items-center gap-1.5 text-[11px] text-[#C5221F] mt-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />{error}
              </span>
            )}
          </label>

          <button
            onClick={enter}
            disabled={!selected || !code || (CASE_SCOPED_ROLES.includes(selected) && !name)}
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 shrink-0 bg-gradient-to-b from-govt-600 to-govt-700 hover:from-govt-500 hover:to-govt-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl transition-colors shrink-0"
          >
            {t('Enter Secure Workspace')} <ChevronRight className="w-4 h-4" />
          </button>

          <p className="text-[10px] text-steel-400 mt-2.5 leading-snug shrink-0">
            {t('Demonstration environment using simulated data. Role-based section access, maker-checker workflow and audit logging run throughout the platform.')}{' '}
            <span className="text-amber-700">{DEMO_GATE_NOTE}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
