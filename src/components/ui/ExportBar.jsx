import { useState } from 'react'
import { FileDown, FileSpreadsheet, FileText, Check, Loader2, AlertTriangle } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { t } from '../../i18n/index.js'

function ExportButton({ icon: Icon, label, onTrigger }) {
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
      {state === 'done' ? t('Exported') : state === 'error' ? t('Copy failed') : t(label)}
    </button>
  )
}

// `moduleLabel` names the module/report this export bar belongs to, for the audit log.
// `getBriefingText` supplies the actual text placed on the clipboard by "Copy Briefing Note" —
// falls back to a generic line if the caller doesn't provide one.
export function ExportBar({ briefingNote = true, moduleLabel = 'Module', getBriefingText, caseId = '—' }) {
  const { logAction } = useApp()

  const exportPdf = () => {
    logAction(`Exported Report (PDF)`, moduleLabel, caseId)
    return true
  }
  const exportExcel = () => {
    logAction(`Exported Report (Excel)`, moduleLabel, caseId)
    return true
  }
  const copyBriefing = async () => {
    const text = getBriefingText?.() || `${moduleLabel} — briefing note generated ${new Date().toLocaleDateString('en-IN')}. Simulated export from Maha GST Intelligence; verify against source module before circulation.`
    try {
      await navigator.clipboard.writeText(text)
      logAction('Copied Briefing Note to Clipboard', moduleLabel, caseId)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="flex items-center gap-2">
      <ExportButton icon={FileDown} label="Export PDF" onTrigger={exportPdf} />
      <ExportButton icon={FileSpreadsheet} label="Export Excel" onTrigger={exportExcel} />
      {briefingNote && <ExportButton icon={FileText} label="Copy Briefing Note" onTrigger={copyBriefing} />}
    </div>
  )
}
