import { useState, useMemo } from 'react'
import { FileSpreadsheet, AlertTriangle, Scale, Ruler, ChevronDown, ChevronRight, Info, Building2, Tag } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { FilterNotApplicable } from '../components/ui/FilterScope.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { FILES, CONVENTIONS, LEGAL_CONSTRAINTS, SCOPE_NOTE, SPEC_SUMMARY } from '../data/extractSpec.js'
import { t } from '../i18n/index.js'

const PRIORITY_TONE = {
  1: { chip: 'bg-[#C5221F] text-white', border: 'border-red-300', label: 'Priority 1' },
  2: { chip: 'bg-orange-500 text-white', border: 'border-orange-200', label: 'Priority 2' },
  3: { chip: 'bg-amber-500 text-white', border: 'border-amber-200', label: 'Priority 3' },
  4: { chip: 'bg-steel-400 text-white', border: 'border-steel-200', label: 'Priority 4' }
}

const isCritical = fld => (fld.note || '').startsWith('CRITICAL')
const enginesOf = fields => [...new Set(fields.flatMap(fld => String(fld.unlocks || '').match(/\d+/g) || []))]
  .map(Number).sort((a, b) => a - b)

/* The column list to hand to GSTN, NIC and the divisions. Every field states
 * its format, source, whether it is mandatory and which engine it unlocks — so
 * a data owner can see what their column is for. */
export default function ExtractSpecification() {
  const S = SPEC_SUMMARY
  const [open, setOpen] = useState(FILES[0].id)
  const ordered = [...FILES].sort((a, b) => a.priority - b.priority)

  /* Page-local derivations over the specification itself. Each is a count of
   * what is written in extractSpec.js, so a data owner can check any of them
   * by opening the file rather than taking the tile on trust. */
  const D = useMemo(() => {
    const all = FILES.flatMap(f => f.fields.map(fld => ({ ...fld, file: f.file, fileLabel: f.label })))
    return {
      conventionCount: all.filter(fld => !fld.official).length,
      criticalFields: all.filter(isCritical),
      perFile: Object.fromEntries(FILES.map(f => [f.id, {
        mandatory: f.fields.filter(fld => fld.mandatory).length,
        critical: f.fields.filter(isCritical).length,
        conventions: f.fields.filter(fld => !fld.official).length,
        engines: enginesOf(f.fields)
      }]))
    }
  }, [])

  return (
    <div>
      <SectionHeader
        eyebrow={t('Governance · Pilot')}
        title={t('Pilot Extract Specification')}
        description={<MethodNote short={t('The column list for the 500-case pilot, addressed to GSTN, NIC and divisions.')} full={t('The field-level column list for the 500-case pilot, addressed to GSTN, NIC and the divisions. Each field carries its format, its source, whether it is mandatory and which engine it unlocks — so a data owner can see what their column is for rather than being asked for whatever they have.')} />}
        actions={<ExportBar moduleLabel="Pilot Extract Specification" />}
      />

      <FilterNotApplicable reason={t('It is a column specification for a data request, not a view over taxpayer records.')} />

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4">
        <KpiCard label={t('Files requested')} value={S.fileCount} unit={t('one per entity type')} tone="navy" icon={FileSpreadsheet} />
        <KpiCard label={t('Fields specified')} value={S.fieldCount} unit={t('{0} mandatory', S.mandatoryCount)} tone="steel" icon={Ruler} />
        <KpiCard label={t('Critical fields')} value={S.criticalCount} unit={t('decide the outcome tier')} tone="red" icon={AlertTriangle} />
        <KpiCard label={t('Names to map')} value={D.conventionCount} unit={t('of {0} — proposed, not official schema names', S.fieldCount)} tone="amber" icon={Tag} />
        <KpiCard label={t('From GSTN')} value={S.byOwner.find(o => o.owner === 'GSTN')?.count || 0} unit={t('of {0} — rest departmental and NIC', S.fieldCount)} tone="amber" icon={FileSpreadsheet} />
      </div>

      {/* The mistake most likely to make this pilot fail for the wrong reason. */}
      <div className="rounded-xl border border-red-300 bg-red-50/60 px-5 py-4 mb-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#C5221F] shrink-0 mt-0.5" />
        <div>
          <div className="text-[13.5px] font-bold text-navy-900 mb-1">{t('500 cases is not 500 taxpayers')}</div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{t(SCOPE_NOTE)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Who has to be asked, and for how much of the extract. A request that
          * does not say this gets routed to one owner and stalls at the others. */}
        <Card tone="green"
          title={t('Who owns which columns')}
          subtitle={t('{0} fields across {1} files, held by {2} owners. Each owner must be approached separately.', S.fieldCount, S.fileCount, S.byOwner.length)}
          padded={false}
        >
          <div className="divide-y divide-steel-100">
            {S.byOwner.map((o, i) => (
              <div key={i} className="px-5 py-2.5 flex flex-wrap items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-steel-400 shrink-0" />
                <span className="text-[12.5px] font-semibold text-navy-900">{t(o.owner)}</span>
                <span className="ml-auto text-[11.5px] text-steel-600 tabular-nums">
                  {t('{0} of {1} fields', o.count, S.fieldCount)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Three fields decide whether the outcome tier can ever be built. They
          * are listed here because they are the ones most likely to be dropped
          * from a request as "nice to have". */}
        <Card tone="blue"
          title={t('The {0} fields that decide the outcome tier', D.criticalFields.length)}
          subtitle={t('Without these the outcome engines learn who the taxpayer was, not why a demand held up. They cannot be collected retrospectively.')}
          padded={false}
        >
          <div className="divide-y divide-steel-100">
            {D.criticalFields.map(fld => (
              <div key={fld.name} className="px-5 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-[11.5px] font-semibold text-navy-900 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">{fld.name}</code>
                  <code className="text-[10.5px] text-steel-600 bg-steel-100 px-1.5 py-0.5 rounded">{fld.file}</code>
                  <span className="ml-auto text-[11px] text-steel-500">{t('Engines {0}', fld.unlocks)}</span>
                </div>
                <p className="text-[11.5px] text-steel-700 leading-relaxed mt-1">{t(fld.note)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Files, in the order they should be chased. */}
      <div className="space-y-3 mb-4">
        {ordered.map(f => {
          const p = PRIORITY_TONE[f.priority]
          const stats = D.perFile[f.id]
          const isOpen = open === f.id
          return (
            <div key={f.id} className={`rounded-xl border overflow-hidden ${p.border}`}>
              <button
                onClick={() => setOpen(isOpen ? null : f.id)}
                className="w-full text-left px-5 py-3.5 bg-white hover:bg-navy-50/40 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-steel-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-steel-400 shrink-0" />}
                  <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${p.chip}`}>{t(p.label)}</span>
                  <span className="text-[13.5px] font-bold text-navy-900">{t(f.label)}</span>
                  <code className="text-[11.5px] text-steel-600 bg-steel-100 px-1.5 py-0.5 rounded">{f.file}</code>
                  <span className="ml-auto text-[11.5px] text-steel-500">{t('{0} fields', f.fields.length)} · {t(f.owner)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-6">
                  <Pill tone="navy">{t('{0} mandatory', stats.mandatory)}</Pill>
                  <Pill tone="steel">{t('{0} optional', f.fields.length - stats.mandatory)}</Pill>
                  {stats.critical > 0 && <Pill tone="red">{t('{0} critical', stats.critical)}</Pill>}
                  {stats.conventions > 0 && <Pill tone="amber">{t('{0} names to map', stats.conventions)}</Pill>}
                  <Pill tone="green">{t('Serves engines {0}', stats.engines.join(', '))}</Pill>
                </div>
                <p className="text-[12px] text-steel-600 leading-relaxed mt-1.5 ml-6">{t(f.why)}</p>
              </button>

              {isOpen && (
                <div className="border-t border-steel-100">
                  <div className="px-5 py-2.5 bg-steel-50 border-b border-steel-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-steel-400">{t('Scope')}</span>
                    <p className="text-[12px] text-navy-800 leading-relaxed">{t(f.scope)}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11.5px]">
                      <thead className="bg-steel-50 border-b border-steel-200">
                        <tr className="text-left text-[9.5px] font-bold uppercase tracking-wider text-steel-500">
                          <th className="px-4 py-2">{t('Column')}</th>
                          <th className="px-3 py-2">{t('Type')}</th>
                          <th className="px-3 py-2">{t('Example')}</th>
                          <th className="px-3 py-2 text-center">{t('Req')}</th>
                          <th className="px-3 py-2">{t('Engines')}</th>
                          <th className="px-4 py-2">{t('Note')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-steel-100">
                        {f.fields.map(fld => {
                          const critical = isCritical(fld)
                          return (
                            <tr key={fld.name} className={critical ? 'bg-red-50/50' : ''}>
                              <td className="px-4 py-2 align-top">
                                <code className="font-semibold text-navy-900">{fld.name}</code>
                                {critical && <span className="block mt-1"><Pill tone="red">{t('Critical')}</Pill></span>}
                                {!fld.official && <span className="block text-[9.5px] text-steel-400 italic">{t('naming convention — map to source')}</span>}
                              </td>
                              <td className="px-3 py-2 align-top text-steel-600 whitespace-nowrap">{fld.type}</td>
                              <td className="px-3 py-2 align-top text-steel-500 font-mono text-[10.5px]">{fld.example || '—'}</td>
                              <td className="px-3 py-2 align-top text-center">
                                {fld.mandatory ? <Pill tone="red">{t('Yes')}</Pill> : <span className="text-steel-400">—</span>}
                              </td>
                              <td className="px-3 py-2 align-top text-steel-600 whitespace-nowrap">
                                {fld.unlocks === 'All' ? t('All') : fld.unlocks}
                              </td>
                              <td className="px-4 py-2 align-top text-steel-700 leading-relaxed max-w-[340px]">{t(fld.note)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card tone="red"
          title={t('Format conventions')}
          subtitle={t('{0} rules. Each of these has caused a real error in this build or would have, and each states the consequence rather than the preference.', CONVENTIONS.length)}
        >
          <div className="space-y-2.5">
            {CONVENTIONS.map(c => (
              <div key={c.id} className="rounded-lg border border-steel-200 bg-steel-50/60 px-3.5 py-2.5">
                <div className="text-[12px] font-semibold text-navy-900 mb-0.5">{t(c.rule)}</div>
                <p className="text-[11.5px] text-steel-600 leading-relaxed">{t(c.why)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card tone="yellow"
          title={t('Legal and privacy position')}
          subtitle={t('{0} positions, to be settled before the request goes out rather than after the extract is built.', LEGAL_CONSTRAINTS.length)}
        >
          <div className="space-y-2.5">
            {LEGAL_CONSTRAINTS.map(l => (
              <div key={l.id} className="rounded-lg border border-amber-200 bg-amber-50/50 px-3.5 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <Scale className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-[12px] font-bold text-navy-900">{t(l.item)}</span>
                </div>
                <div className="text-[11.5px] font-semibold text-amber-800 mb-1">{t(l.position)}</div>
                <p className="text-[11.5px] text-steel-700 leading-relaxed">{t(l.note)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="rounded-lg border border-steel-200 bg-steel-50 px-4 py-3 mt-4 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
        <MethodNote className="text-[11.5px] text-steel-600 leading-relaxed" short={t('Proposed names are marked — map each to what the source system calls it.')} full={t('Where a field corresponds to a published GST form, that form is named. {0} of the {1} column names are conventions proposed for this extract rather than official schema fields, and are marked as such in the Column cell — map each of those to whatever the source system actually calls it rather than assuming the name exists.', D.conventionCount, S.fieldCount)} />
      </div>
    </div>
  )
}
