import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../ui/Modal.jsx'
import { RiskBadge, Pill } from '../ui/RiskBadge.jsx'
import { StatutoryFlag, StatutoryVerdict } from '../ui/StatutoryFlag.jsx'
import { ActionBrief } from './ActionBrief.jsx'
import { WhyFlaggedPanel } from '../ui/WhyFlagged.jsx'
import { TrendLineChart } from '../ui/Charts.jsx'
import { AIOutputPanel } from '../ui/AIOutputPanel.jsx'
import { ExportBar } from '../ui/ExportBar.jsx'
import { summarizeTaxpayer } from '../../data/ai.js'
import { TAXPAYERS, NOTICES, SECTORS, MONTHS, REFERENCE_DATE_ISO } from '../../data/mockData.js'
import { useApp } from '../../context/AppContext.jsx'
import { t } from '../../i18n/index.js'
import { Building2, MapPin, Calendar, Phone, Mail, Sparkles } from 'lucide-react'

function seededSeries(seedStr, base, months = 12) {
  let h = 0
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0
  const out = []
  for (let i = 0; i < months; i++) {
    h = (h * 1103515245 + 12345) >>> 0
    const noise = ((h % 1000) / 1000 - 0.5) * 0.5
    out.push(Math.max(0, Math.round(base * (1 + noise))))
  }
  return out
}

const TABS = ['Overview', 'Filing & ITC', 'E-Way & Refund', 'Network', 'Timeline & Notes', 'AI Summary']

export function TaxpayerDrilldownModal({ taxpayer, open, onClose }) {
  const { logAction } = useApp()
  const [tab, setTab] = useState('Overview')
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState([
    { by: 'Div. Officer — S. Patil', text: 'Preliminary desk review completed. Awaiting GSTR-2B reconciliation.', on: '2026-08-05' }
  ])

  useEffect(() => {
    if (open && taxpayer) logAction('Viewed Taxpayer 360 Profile', 'Taxpayer 360', taxpayer.gstin)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taxpayer?.id])

  const months12 = MONTHS.slice(-12)
  const filingSeries = useMemo(() => taxpayer ? seededSeries(taxpayer.gstin + 'tax', taxpayer.taxPaid) : [], [taxpayer])
  const itcSeries = useMemo(() => taxpayer ? seededSeries(taxpayer.gstin + 'itc', taxpayer.itcClaimed) : [], [taxpayer])
  const refundSeries = useMemo(() => taxpayer ? seededSeries(taxpayer.gstin + 'rfd', Math.max(10000, taxpayer.refundClaimed / 3)) : [], [taxpayer])
  const ewaySeries = useMemo(() => taxpayer ? seededSeries(taxpayer.gstin + 'ewb', taxpayer.ewayBillValue) : [], [taxpayer])

  const chartData = months12.map((m, i) => ({ month: m, tax: filingSeries[i], itc: itcSeries[i] }))

  const sectorBenchmark = SECTORS.find(s => s.name === taxpayer?.sector)
  const linked = useMemo(() => {
    if (!taxpayer) return { suppliers: [], buyers: [] }
    const idx = TAXPAYERS.findIndex(t => t.id === taxpayer.id)
    const pool = TAXPAYERS.filter((_, i) => i !== idx)
    return {
      suppliers: [pool[(idx * 3) % pool.length], pool[(idx * 3 + 1) % pool.length]],
      buyers: [pool[(idx * 5 + 2) % pool.length], pool[(idx * 5 + 3) % pool.length]]
    }
  }, [taxpayer])

  const taxpayerNotices = taxpayer ? NOTICES.filter(n => n.taxpayerId === taxpayer.id) : []
  const aiSummary = taxpayer ? summarizeTaxpayer(taxpayer) : null

  if (!taxpayer) return null

  return (
    <Modal open={open} onClose={onClose} size="xl" title={
      <span className="flex items-center gap-2">{taxpayer.tradeName} <RiskBadge category={taxpayer.risk.category} score={taxpayer.risk.score} /> <StatutoryFlag gstin={taxpayer.gstin} /></span>
    } subtitle={`${taxpayer.gstin} · ${taxpayer.legalName}`}>
      {/* This modal is opened from most case screens, so the twin's statutory
          verdict is stated here once rather than repeated on each of them. The
          notices listed further down include ones on periods that have expired,
          and nothing else on this modal would have said so. */}
      <StatutoryVerdict gstin={taxpayer.gstin} />
      <div className="mb-3"><ActionBrief gstin={taxpayer.gstin} /></div>
      <div className="flex flex-wrap items-center gap-2 mb-2 text-[11px] text-steel-500">
        <Pill tone="navy">{t('Risk signal only')}</Pill>
        <Pill tone="amber">{t('Officer verification required')}</Pill>
        <Pill tone="steel">{t('No automated adverse action')}</Pill>
      </div>

      <div className="flex items-center gap-1 border-b border-steel-200 mb-4 overflow-x-auto scrollbar-none">
        {TABS.map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)} className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px ${tab === tabKey ? 'border-navy-700 text-navy-800' : 'border-transparent text-steel-500 hover:text-navy-700'}`}>
            {t(tabKey)}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <InfoRow icon={Building2} label={t('Sector')} value={taxpayer.sector} />
              <InfoRow icon={MapPin} label={t('District / Division')} value={`${taxpayer.district} · ${taxpayer.division}`} />
              <InfoRow icon={Calendar} label={t('Registered')} value={taxpayer.registrationDate} />
              <InfoRow icon={Phone} label={t('Contact')} value={taxpayer.contactPhone} />
              <InfoRow icon={Mail} label={t('Email')} value={taxpayer.contactEmail} />
              <InfoRow icon={MapPin} label={t('Address')} value={taxpayer.address} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label={t('Monthly Turnover')} value={`₹${(taxpayer.monthlyTurnover / 100000).toFixed(1)}L`} />
              <Stat label={t('Tax Paid')} value={`₹${(taxpayer.taxPaid / 100000).toFixed(1)}L`} />
              <Stat label={t('ITC Claimed')} value={`₹${(taxpayer.itcClaimed / 100000).toFixed(1)}L`} />
              <Stat label={t('Filing Status')} value={taxpayer.filingStatus} />
              <Stat label={t('Audit Status')} value={taxpayer.auditStatus} />
              <Stat label={t('Appeal Status')} value={taxpayer.appealStatus} />
            </div>
          </div>
          <WhyFlaggedPanel taxpayer={taxpayer} />
        </div>
      )}

      {tab === 'Filing & ITC' && (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-navy-800 mb-1">{t('Tax Paid vs ITC Claimed (12 months)')}</div>
            <TrendLineChart data={chartData} xKey="month" series={[{ key: 'tax', label: t('Tax Paid (₹)') }, { key: 'itc', label: t('ITC Claimed (₹)'), color: '#f78c0a' }]} height={220} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <Stat label={t('ITC-to-Turnover')} value={`${((taxpayer.itcClaimed / taxpayer.monthlyTurnover) * 100).toFixed(1)}%`} />
            <Stat label={t('Sector Benchmark ITC')} value={`${(sectorBenchmark.benchmarkItcRatio * 100).toFixed(1)}%`} />
            <Stat label={t('Deviation')} value={`${taxpayer.sectorDeviationPct}%`} />
          </div>
        </div>
      )}

      {tab === 'E-Way & Refund' && (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-navy-800 mb-1">{t('Refund Claim Trend (₹)')}</div>
            <TrendLineChart data={months12.map((m, i) => ({ month: m, refund: refundSeries[i] }))} xKey="month" series={[{ key: 'refund', label: t('Refund Claimed'), color: '#1f8a4c' }]} height={180} />
          </div>
          <div>
            <div className="text-xs font-semibold text-navy-800 mb-1">{t('E-Way Bill Movement Value (₹)')}</div>
            <TrendLineChart data={months12.map((m, i) => ({ month: m, eway: ewaySeries[i] }))} xKey="month" series={[{ key: 'eway', label: t('E-Way Value'), color: '#204575' }]} height={180} />
          </div>
        </div>
      )}

      {tab === 'Network' && (
        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-semibold text-navy-800 mb-2">{t('Linked Suppliers')}</div>
            <div className="space-y-1.5">
              {linked.suppliers.map(s => s && (
                <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-steel-200">
                  <span>{s.tradeName}</span>
                  <RiskBadge category={s.risk.category} size="sm" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="font-semibold text-navy-800 mb-2">{t('Linked Buyers')}</div>
            <div className="space-y-1.5">
              {linked.buyers.map(b => b && (
                <div key={b.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-steel-200">
                  <span>{b.tradeName}</span>
                  <RiskBadge category={b.risk.category} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Timeline & Notes' && (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-navy-800 mb-2">{t('Compliance Timeline')}</div>
            <ul className="space-y-2 text-xs">
              <TimelineItem date={taxpayer.registrationDate} text={t('GST Registration granted')} />
              {taxpayerNotices.map(n => <TimelineItem key={n.id} date={n.issuedOn} text={t('{0} issued — status: {1}', n.type, t(n.status))} />)}
              <TimelineItem date={REFERENCE_DATE_ISO} text={t('Current compliance history: {0}', taxpayer.complianceHistory)} />
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold text-navy-800 mb-2">{t('Officer Notes')}</div>
            <div className="space-y-2 mb-2">
              {notes.map((n, i) => (
                <div key={i} className="text-xs bg-steel-50 border border-steel-200 rounded-lg px-3 py-2">
                  <div className="text-steel-500 mb-0.5">{n.by} · {n.on}</div>
                  {n.text}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={note} onChange={e => setNote(e.target.value)} placeholder={t('Add an officer note...')} className="flex-1 text-xs px-3 py-2 rounded-lg border border-steel-200" />
              <button
                onClick={() => { if (note.trim()) { setNotes(n => [...n, { by: 'Current Officer', text: note, on: REFERENCE_DATE_ISO }]); setNote('') } }}
                className="text-xs font-semibold px-3 py-2 rounded-lg bg-ink-700 text-white hover:bg-ink-800"
              >{t('Add Note')}</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'AI Summary' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-steel-500"><Sparkles className="w-3.5 h-3.5" /> {t('Generated by Officer AI Copilot')}</div>
          <AIOutputPanel output={aiSummary} />
        </div>
      )}

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-steel-100">
        <ExportBar
          moduleLabel="Taxpayer 360"
          caseId={taxpayer.gstin}
          getBriefingText={() => `${taxpayer.tradeName} (${taxpayer.gstin}) — ${taxpayer.sector}, ${taxpayer.district}. Risk: ${taxpayer.risk.category} (${taxpayer.risk.score}/100). Filing status: ${taxpayer.filingStatus}. Risk signal only — officer verification required before any action.`}
        />
      </div>
    </Modal>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-steel-50 border border-steel-100">
      <Icon className="w-3.5 h-3.5 text-steel-400 mt-0.5 shrink-0" />
      <div>
        <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold">{label}</div>
        <div className="text-navy-800 font-medium">{value}</div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="px-3 py-2.5 rounded-lg border border-steel-200 bg-white">
      <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold">{label}</div>
      <div className="text-sm font-bold text-navy-900 mt-0.5">{value}</div>
    </div>
  )
}

function TimelineItem({ date, text }) {
  return (
    <li className="flex gap-3">
      <div className="w-20 shrink-0 text-steel-500">{date}</div>
      <div className="flex-1 pb-2 border-l border-steel-200 pl-3 relative">
        <span className="absolute -left-[3.5px] top-1 w-1.5 h-1.5 rounded-full bg-navy-500" />
        {text}
      </div>
    </li>
  )
}

