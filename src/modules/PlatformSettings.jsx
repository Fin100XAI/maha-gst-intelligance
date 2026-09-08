import { useMemo } from 'react'
import { Users, ShieldAlert, Lock, Layers, KeyRound } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { FilterNotApplicable } from '../components/ui/FilterScope.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { OFFICER_ROLES } from '../data/mockData.js'
import {
  MODULES, ROLE_SECTIONS, canAccessSection, canAccessModule, DEMO_GATE_NOTE
} from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'

/* ---------------------------------------------------------------------------
 * PLATFORM SETTINGS
 *
 * The access configuration, read out of the configuration itself rather than
 * described alongside it. Every table on this screen is generated at render
 * time from ROLE_SECTIONS, canAccessSection and canAccessModule, so it cannot
 * drift from what the platform actually enforces — a settings screen that
 * describes a rule the code no longer applies is worse than no screen at all.
 *
 * Nothing here is editable. Access is a deployment decision made in the
 * departmental system of record, not a switch an officer flips mid-session;
 * showing a control that pretends otherwise would misrepresent how the platform
 * would actually be run.
 * ------------------------------------------------------------------------- */
export default function PlatformSettings() {
  const sections = useMemo(() => [...new Set(MODULES.map(m => m.group))], [])

  const matrix = useMemo(() => OFFICER_ROLES.map(role => {
    const granted = sections.filter(s => canAccessSection(role, s))
    const allowed = MODULES.filter(m => canAccessModule(role, m.id))
    const moduleOnlyDenied = MODULES.filter(m => canAccessSection(role, m.group) && !canAccessModule(role, m.id))
    return {
      role,
      sectionsGranted: granted,
      allSections: ROLE_SECTIONS[role] === 'all',
      moduleCount: allowed.length,
      moduleOnlyDenied,
      landsOn: allowed[0] || null
    }
  }), [sections])

  /* The module-level layer on its own. A module appears here when some role
     holds its section and still cannot open it — the pins that keep a
     reorganisation of the menu from quietly regranting a screen. */
  const pins = useMemo(() => MODULES
    .map(m => {
      const canOpen = OFFICER_ROLES.filter(r => canAccessModule(r, m.id))
      const sectionOnly = OFFICER_ROLES.filter(r => canAccessSection(r, m.group))
      return { module: m, canOpen, pinned: sectionOnly.some(r => !canOpen.includes(r)) }
    })
    .filter(x => x.pinned), [])

  const totals = useMemo(() => ({
    roles: OFFICER_ROLES.length,
    sections: sections.length,
    modules: MODULES.length,
    pinned: pins.length
  }), [sections, pins])

  return (
    <div>
      <SectionHeader
        eyebrow={t('Settings · Platform Configuration')}
        title={t('Settings')}
        description={
          <MethodNote
            tone="plain"
            short={t('Who can open what, read out of the configuration the platform enforces.')}
            full={t('Every table on this screen is generated at render time from the role and module access configuration rather than described alongside it, so it cannot drift from what the platform actually applies. Nothing here is editable: access is a deployment decision made in the departmental system of record, not a switch an officer flips mid-session.')}
          />
        }
        actions={<ExportBar moduleLabel="Settings" />}
      />

      <FilterNotApplicable reason={t('It describes roles and access, which are configuration rather than taxpayer data.')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard label={t('Officer Roles')} value={totals.roles} tone="navy" icon={Users} />
        <KpiCard label={t('Sections')} value={totals.sections} tone="steel" icon={Layers} />
        <KpiCard label={t('Modules')} value={totals.modules} tone="steel" icon={KeyRound} />
        <KpiCard
          label={t('Modules Pinned Below Their Section')}
          value={totals.pinned}
          unit={t('open to fewer roles than the section')}
          tone="red"
          icon={Lock}
        />
      </div>

      <Card tone="green"
        title={t('Role-Based Access — as enforced')}
        subtitle={t('Generated from the access configuration at render time, not described alongside it')}
        className="mb-5"
        actions={<Pill tone="navy">{t('{0} roles · {1} modules', totals.roles, totals.modules)}</Pill>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-steel-50 border-b border-steel-200">
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px]">{t('Role')}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px]">{t('Sections granted')}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] w-28">{t('Modules reachable')}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px]">{t('Denied at module level despite section access')}</th>
                <th className="px-3 py-2.5 text-left font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] w-44">{t('Lands on after sign-in')}</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={row.role} className={`border-b border-steel-100 last:border-0 align-top ${i % 2 === 1 ? 'bg-steel-50/40' : ''}`}>
                  <td className="px-3 py-2.5 font-semibold text-navy-800 whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-steel-400" />{t(row.role)}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {row.allSections
                        ? <Pill tone="navy">{t('All sections')}</Pill>
                        : row.sectionsGranted.map(s => <Pill key={s} tone="navy">{t(s)}</Pill>)}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-navy-700">{t('{0} of {1}', row.moduleCount, totals.modules)}</td>
                  <td className="px-3 py-2.5">
                    {row.moduleOnlyDenied.length === 0
                      ? <span className="text-steel-400">{t('None')}</span>
                      : (
                        <div className="flex flex-wrap gap-1">
                          {row.moduleOnlyDenied.map(m => <Pill key={m.id} tone="red">{t(m.label)}</Pill>)}
                        </div>
                      )}
                  </td>
                  <td className="px-3 py-2.5 text-steel-600">
                    {row.landsOn ? t(row.landsOn.label) : <span className="text-steel-400">{t('No module reachable')}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <MethodNote
          className="mt-3 max-w-4xl"
          short={t('A role with a section is not automatically given every module in it.')}
          full={t('Access is decided per role at section level and then again at module level. The fourth column is that second layer on its own — modules inside a section the role holds that it still cannot open. That is the layer a reviewer most often cannot see.')}
        />
      </Card>

      <Card tone="blue"
        title={t('Modules Pinned Below Their Section')}
        subtitle={t('Screens open to fewer roles than the section they sit in')}
        className="mb-5"
      >
        {pins.length === 0
          ? <p className="text-[12.5px] text-steel-500">{t('No module is pinned. Every screen is open to whoever holds its section.')}</p>
          : (
            <div className="space-y-2.5">
              {pins.map(({ module, canOpen }) => (
                <div key={module.id} className="flex flex-wrap items-start gap-x-3 gap-y-1.5 rounded-lg border border-steel-200 bg-steel-50/60 px-3 py-2.5">
                  <div className="min-w-[200px]">
                    <div className="text-[12.5px] font-semibold text-navy-900">{t(module.label)}</div>
                    <div className="text-[10.5px] text-steel-500">{t(module.group)}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {canOpen.map(r => <Pill key={r} tone="green">{t(r)}</Pill>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        <MethodNote
          className="mt-3 max-w-4xl"
          short={t('A pin is what keeps a menu change from becoming an access change.')}
          full={t('When a screen moves between sections, every role holding the destination section would otherwise gain it. Pinning the module to the roles that could already open it keeps the audience exactly as it was, so the platform can be reorganised for how work is actually done without quietly widening who sees what.')}
        />
      </Card>

      <Card tone="red" title={t('Demonstration Access Gate')} subtitle={t('How this build is entered, and what that is worth')}>
        <p className="text-[12px] text-navy-800 leading-relaxed flex items-start gap-2 max-w-4xl">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" aria-hidden />
          <span>{t(DEMO_GATE_NOTE)}</span>
        </p>
      </Card>
    </div>
  )
}
