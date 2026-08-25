import { useState } from 'react'
import { Landmark, ShieldCheck, Gavel, Receipt, Search, Bot, FileBarChart2, Crown, Users, ChevronRight } from 'lucide-react'
import { useApp, MODULES, canAccessModule } from '../../context/AppContext.jsx'
import { OFFICER_ROLES, officerByRole } from '../../data/mockData.js'
import { t } from '../../i18n/index.js'
import { LanguageSwitcher } from './LanguageSwitcher.jsx'
import { FontSizeControl } from './FontSizeControl.jsx'

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

  const enter = () => {
    if (!selected) return
    setOfficerName(name.trim() || 'Guest Officer')
    setRole(selected)
    // command-center (the module's default landing state) isn't visible to every
    // role — land instead on the first module this role can actually see.
    const firstAccessible = MODULES.find(m => canAccessModule(selected, m.id))
    setActiveModule(firstAccessible ? firstAccessible.id : 'command-center')
  }

  return (
    <div className="h-screen overflow-hidden bg-govt-900 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl h-full flex flex-col">
        <div className="flex justify-end gap-2 mb-2 shrink-0">
          <FontSizeControl className="hidden sm:flex bg-white/10 border-white/15" />
          <LanguageSwitcher className="bg-white/10 border-white/15" />
        </div>
        <div className="flex flex-col items-center text-center mb-3 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-intel-400 to-intel-600 flex items-center justify-center mb-2.5 shadow-panel">
            <Landmark className="w-6 h-6 text-rail-900" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{t('Maha GST Intelligence')}</h1>
          <p className="text-govt-100 text-xs sm:text-sm mt-1.5 max-w-xl hidden sm:block">{t('Revenue Assurance, Fraud Risk & Compliance Intelligence Infrastructure for Maharashtra GST')}</p>
          <p className="text-govt-300 text-[10px] mt-2 uppercase tracking-widest font-semibold">{t('Secure Access · Role-Based Sign-In')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-5 flex flex-col flex-1 min-h-0">
          {!CASE_SCOPED_ROLES.includes(selected) && (
            <div className="mb-3 shrink-0">
              <label className="text-xs font-semibold text-steel-500">{t('Officer Name (optional)')}</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('e.g. Rohan Deshmukh')}
                className="mt-1 w-full px-3 py-1.5 text-sm rounded-lg border border-steel-200 focus:outline-none focus:ring-2 focus:ring-govt-300"
              />
            </div>
          )}

          <div className="text-xs font-semibold text-steel-500 mb-2 shrink-0">{t('Select Role to Continue')}</div>
          <div className="grid sm:grid-cols-2 gap-2 flex-1 min-h-0 overflow-y-auto pr-1 content-start">
            {OFFICER_ROLES.map(role => {
              const meta = ROLE_META[role]
              const Icon = meta.icon
              const active = selected === role
              return (
                <button
                  key={role}
                  onClick={() => { setSelected(role); setName('') }}
                  className={`text-left flex items-start gap-3 p-2.5 rounded-xl border transition-all ${active ? 'border-govt-600 bg-govt-50 ring-2 ring-govt-200' : 'border-steel-200 hover:border-govt-300 hover:bg-steel-50'}`}
                >
                  <span className={`p-2 rounded-lg shrink-0 ${active ? 'bg-govt-700 text-white' : 'bg-steel-100 text-steel-600'}`}><Icon className="w-4 h-4" /></span>
                  <span>
                    <span className="block text-sm font-semibold text-navy-900">{t(role)}</span>
                    <span className="block text-[11px] text-steel-500 mt-0.5 leading-snug">{t(meta.desc)}</span>
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

          <button
            onClick={enter}
            disabled={!selected || (CASE_SCOPED_ROLES.includes(selected) && !name)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 bg-gradient-to-b from-govt-600 to-govt-700 hover:from-govt-500 hover:to-govt-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl transition-colors shrink-0"
          >
            {t('Enter Secure Workspace')} <ChevronRight className="w-4 h-4" />
          </button>

          <p className="text-[10.5px] text-steel-400 text-center mt-2.5 leading-relaxed shrink-0 hidden sm:block">
            {t('This is a demonstration environment using simulated data. Role-based access control, maker-checker workflow and audit logging are enforced throughout the platform.')}
          </p>
        </div>
      </div>
    </div>
  )
}
