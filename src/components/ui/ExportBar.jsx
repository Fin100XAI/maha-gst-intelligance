import { useState } from 'react'
import { FileDown, FileSpreadsheet, FileText, Check, Loader2, AlertTriangle } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { t } from '../../i18n/index.js'
import { asOfLongLabel } from './DataProvenance.jsx'

function ExportButton({ icon: Icon, label, onTrigger, doneLabel = 'Done' }) {
  const [state, setState] = useState('idle')
  const trigger = () => {
    if (state !== 'idle') return
    // Run the actual action (e.g. clipboard write) synchronously within the click handler —
    // browsers require an active user gesture for Clipboard API access, which a delayed
    // callback would no longer have. The loading delay below is purely cosmetic.
    const resultPromise = Promise.resolve(onTrigger?.())
    setState('loading')
    setTimeout(async () => {
      const ok = await resultPromise
      setState(ok === false ? 'error' : 'done')
      setTimeout(() => setState('idle'), 1600)
    }, 700)
  }
  return (
    <button
      onClick={trigger}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-steel-200 bg-white hover:bg-steel-50 text-steel-700 disabled:opacity-70"
      disabled={state === 'loading'}
    >
      {state === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : state === 'done' ? <Check className="w-3.5 h-3.5 text-emerald-600" />
        : state === 'error' ? <AlertTriangle className="w-3.5 h-3.5 text-maharisk-critical" />
        : <Icon className="w-3.5 h-3.5" />}
      {state === 'done' ? t(doneLabel) : state === 'error' ? t('Copy failed') : t(label)}
    </button>
  )
}

// `moduleLabel` names the module/report this export bar belongs to, for the audit log.
// `getBriefingText` supplies the actual text placed on the clipboard by "Copy Briefing Note" —
// falls back to a generic line if the caller doesn't provide one.
export function ExportBar({ briefingNote = true, moduleLabel = 'Module', getBriefingText, caseId = '—' }) {
  const { logAction, locale } = useApp()

  // PDF/Excel export is not implemented — no file is produced. Logging these as
  // "Exported Report" put an event in the audit trail saying a document left the
  // system when none did, and the AI Governance module then displays that trail
  // as evidence of log integrity. A demonstration stub must not write a record
  // that would be false in the real thing.
  const exportPdf = () => {
    logAction('Export (PDF) requested — not implemented in demonstration build', moduleLabel, caseId)
    return true
  }
  const exportExcel = () => {
    logAction('Export (Excel) requested — not implemented in demonstration build', moduleLabel, caseId)
    return true
  }
  const copyBriefing = async () => {
    // The provenance line used to be the FALLBACK only — so the moment a caller
    // supplied real briefing content (which every caller that matters does), the
    // figures left the app with no indication they were simulated. It is now
    // appended to whatever is copied, which is the one place the label has to
    // travel with the data.
    const body = getBriefingText?.() || `${moduleLabel} — briefing note generated ${new Date().toLocaleDateString('en-IN')}.`
    const text =
      body +
      '\n\n' +
      t(
        '— Simulated export from Maha GST Intelligence (demonstration environment). All figures are generated demonstration data as at {0}; they are not departmental records. Verify against the source system before circulation.',
        asOfLongLabel(locale)
      )
    try {
      await navigator.clipboard.writeText(text)
      logAction('Copied Briefing Note to Clipboard', moduleLabel, caseId)
      return true
    } catch {
      return false
    }
  }

  return (
    // Only "Copy Briefing Note" actually does anything. The other two are
    // labelled as unavailable rather than reporting a successful export.
    <div className="flex items-center gap-2">
      <ExportButton icon={FileDown} label="Export PDF" doneLabel="Not available in demo" onTrigger={exportPdf} />
      <ExportButton icon={FileSpreadsheet} label="Export Excel" doneLabel="Not available in demo" onTrigger={exportExcel} />
      {briefingNote && <ExportButton icon={FileText} label="Copy Briefing Note" doneLabel="Copied" onTrigger={copyBriefing} />}
    </div>
  )
}
