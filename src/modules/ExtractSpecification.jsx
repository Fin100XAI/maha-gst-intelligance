import { useState } from 'react'
import { FileSpreadsheet, AlertTriangle, Scale, Ruler, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
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

/* The column list to hand to GSTN, NIC and the divisions. Every field states
 * its format, source, whether it is mandatory and which engine it unlocks — so
 * a data owner can see what their column is for. */
export default function ExtractSpecification() {
  const S = SPEC_SUMMARY
  const [open, setOpen] = useState(FILES[0].id)
  const ordered = [...FILES].sort((a, b) => a.priority - b.priority)

  return (
    <div>
      <SectionHeader
        eyebrow={t('Governance · Pilot')}
        title={t('Pilot Extract Specification')}
        description={t('The field-level column list for the 500-case pilot, addressed to GSTN, NIC and the divisions. Each field carries its format, its source, whether it is mandatory and which engine it unlocks — so a data owner can see what their column is for rather than being asked for whatever they have.')}
        actions={<ExportBar moduleLabel="Pilot Extract Specification" />}
      />

      <FilterNotApplicable reason={t('It is a column specification for a data request, not a view over taxpayer records.')} />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <KpiCard label={t('Files requested')} value={S.fileCount} unit={t('one per entity type')} tone="navy" icon={FileSpreadsheet} />
        <KpiCard label={t('Fields specified')} value={S.fieldCount} unit={t('{0} mandatory', S.mandatoryCount)} tone="steel" icon={Ruler} />
        <KpiCard label={t('Critical fields')} value={S.criticalCount} unit={t('decide the outcome tier')} tone="red" icon={AlertTriangle} />
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

      {/* Files, in the order they should be chased. */}
      <div className="space-y-3 mb-4">
        {ordered.map(f => {
          const p = PRIORITY_TONE[f.priority]
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
                  <span className="ml-auto text-[11.5px] text-steel-500">{t('{0} fields', f.fields.length)} · {f.owner}</span>
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
                          const critical = (fld.note || '').startsWith('CRITICAL')
                          return (
                            <tr key={fld.name} className={critical ? 'bg-red-50/50' : ''}>
                              <td className="px-4 py-2 align-top">
                                <code className="font-semibold text-navy-900">{fld.name}</code>
                                {!fld.official && <span className="block text-[9.5px] text-steel-400 italic">{t('naming convention — map to source')}</span>}
                              </td>
                              <td className="px-3 py-2 align-top text-steel-600 whitespace-nowrap">{fld.type}</td>
                              <td className="px-3 py-2 align-top text-steel-500 font-mono text-[10.5px]">{fld.example || '—'}</td>
                              <td className="px-3 py-2 align-top text-center">
                                {fld.mandatory ? <Pill tone="red">{t('Yes')}</Pill> : <span className="text-steel-400">—</span>}
                              </td>
                              <td className="px-3 py-2 align-top text-steel-600 whitespace-nowrap">{fld.unlocks}</td>
                              <td className="px-4 py-2 align-top text-steel-700 leading-relaxed max-w-[340px]">
                                {critical && <span className="text-[9px] font-bold uppercase tracking-wider text-[#C5221F] mr-1">{t('Critical')}</span>}
                                {critical ? fld.note.replace(/^CRITICAL\.\s*/, '') : fld.note}
                              </td>
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
        <Card title={t('Format conventions')} subtitle={t('Each of these has caused a real error in this build or would have.')}>
          <div className="space-y-2.5">
            {CONVENTIONS.map(c => (
              <div key={c.id} className="rounded-lg border border-steel-200 bg-steel-50/60 px-3.5 py-2.5">
                <div className="text-[12px] font-semibold text-navy-900 mb-0.5">{c.rule}</div>
                <p className="text-[11.5px] text-steel-600 leading-relaxed">{t(c.why)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('Legal and privacy position')} subtitle={t('Settle these before the request goes out, not after.')}>
          <div className="space-y-2.5">
            {LEGAL_CONSTRAINTS.map(l => (
              <div key={l.id} className="rounded-lg border border-amber-200 bg-amber-50/50 px-3.5 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <Scale className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-[12px] font-bold text-navy-900">{l.item}</span>
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
        <p className="text-[11.5px] text-steel-600 leading-relaxed">
          {t('Where a field corresponds to a published GST form, that form is named. Where a column name is a convention proposed for this extract rather than an official schema field it is marked as such — map it to whatever the source system actually calls it rather than assuming the name exists.')}
        </p>
      </div>
    </div>
  )
}
