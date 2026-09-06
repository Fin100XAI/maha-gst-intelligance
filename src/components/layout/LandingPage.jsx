import {
  ArrowRight, ShieldCheck, Network, ClipboardCheck, Bot,
  TrendingUp, Lock, Eye, Users, CheckCircle2, Building2, MapPin, LayoutGrid
} from 'lucide-react'
import { NAV_MODULES, useApp } from '../../context/AppContext.jsx'
import { asOfLongLabel } from '../ui/DataProvenance.jsx'
import { MODULE_ICONS } from './moduleMeta.js'
import { KPI_SUMMARY, DISTRICTS } from '../../data/mockData.js'
import { t, tn } from '../../i18n/index.js'
import { Logo } from './Logo.jsx'
import { LanguageSwitcher } from './LanguageSwitcher.jsx'
import { FontSizeControl } from './FontSizeControl.jsx'
import { ThemeSwitcher } from './ThemeSwitcher.jsx'
import { useToneStyles } from '../ui/KpiCard.jsx'

const VALUE_PROPS = [
  {
    icon: TrendingUp,
    tone: 'navy',
    title: 'Revenue Assurance',
    text: 'Track collection against target across every district and sector, and surface leakage before it compounds.'
  },
  {
    icon: Network,
    tone: 'red',
    title: 'Fraud-Risk Detection',
    text: 'Graph-based detection of circular trading, shell-entity patterns and pass-through invoice networks.'
  },
  {
    icon: ShieldCheck,
    tone: 'green',
    title: 'Explainable Risk Scoring',
    text: 'Every risk score traces to a discrete, weighted rule set — officers see exactly why a taxpayer was flagged.'
  },
  {
    icon: ClipboardCheck,
    tone: 'saffron',
    title: 'Audit & Refund Prioritisation',
    text: 'Risk-ranked case queues with AI-assisted checklists and notice drafts, gated behind officer approval.'
  },
  {
    icon: Bot,
    tone: 'orange',
    title: 'Officer Decision Support',
    text: 'An AI copilot that drafts, summarises and translates — and never issues, blocks or rejects on its own.'
  },
  {
    icon: Lock,
    tone: 'steel',
    title: 'Governance & Security',
    text: 'Role-based access, maker-checker approval and a full audit trail across every sensitive action.'
  }
]

// Design principles the platform is built around — not certifications it holds.
// "DPDP-Aligned Data Handling" in particular read as an achieved compliance
// status; this build has no backend and stores no real taxpayer data, and the
// AI Governance screen now states that plainly. The strip must not contradict it.
const TRUST_BADGES = [
  'Role-based access control',
  'Maker-checker workflow',
  'Explainable AI — no black box',
  'Designed for DPDP-aligned data handling',
  'Full audit trail',
  'Human approval on every action'
]

const TRUST_PRINCIPLES = [
  {
    icon: Lock,
    title: 'Accountable by role',
    text: 'Access follows the role held, not the person — and every action taken under a role is logged against the officer who took it.'
  },
  {
    icon: Eye,
    title: 'Provenance on every figure',
    text: 'Every module states where its figures come from and which of them are simulated. Nothing is shown as an observation that isn’t one.'
  },
  {
    icon: Bot,
    title: 'AI that shows its work',
    text: 'Every recommendation carries its evidence, its confidence, and which role is authorised to act on it. The platform never issues, blocks or rejects on its own.'
  },
  {
    icon: ShieldCheck,
    title: 'Self-contained by design',
    text: 'The platform makes no calls out to the open internet for its figures, models or maps. It runs entirely within the department’s own infrastructure.'
  }
]

const GROUP_TONE = {
  Leadership: 'navy',
  Revenue: 'green',
  'Fraud & Risk': 'red',
  Enforcement: 'orange',
  Benchmarking: 'saffron',
  Governance: 'steel'
}

// One line per module — what an officer actually finds on that page, not a restatement of its name.
const MODULE_DESCRIPTIONS = {
  'command-center': 'Whole state on one screen, ordered by what needs a decision today.',
  'revenue-intelligence': 'Collection against target across every district, sector and tax head.',
  'taxpayer-360': 'One profile per GSTIN — filings, payments, ITC and risk in one place.',
  'itc-risk': 'Input tax credit claims scored against filing and payment behaviour.',
  'fake-invoice': 'Graph view of circular trading, shell entities and pass-through chains.',
  'eway-bill': 'Transit records checked against filings for mismatches and route anomalies.',
  'refund-risk': 'Refund claims ranked by risk before sanction, with the evidence behind each.',
  'audit-scrutiny': 'Case queues, AI-assisted checklists and notice drafts, gated behind approval.',
  'sector-intelligence': 'Compliance and revenue patterns compared across industry sectors statewide.',
  'district-performance': 'Every district and division scored on collection, compliance and enforcement.',
  'officer-copilot': 'Drafts, summarises and translates — and never issues or blocks on its own.',
  litigation: 'Pending cases, order outcomes and exposure tracked through appeal stages.',
  capacity: 'A week of officer capacity allocated against binding territorial and role eligibility, surfacing what nobody can reach and why.',
  precedent: 'Prior decisions weighted by the forum that gave them and whether they still stand — not by how similar the facts look.',
  'early-warning': 'Non-filers and slipping compliance flagged before the shortfall compounds.',
  'ai-governance': 'Model logs, override history and the guardrails every recommendation runs through.',
  reports: 'Ready-made briefing notes and exportable reports for every review cycle.'
}

function tickerItems() {
  return [
    t('{0} compliance alerts currently open for officer review', KPI_SUMMARY.complianceAlerts),
    t('{0} ITC risk cases flagged this cycle', KPI_SUMMARY.itcRiskCases),
    t('{0} refund cases awaiting officer sanction', KPI_SUMMARY.refundCasesUnderReview),
    t('₹{0} Cr in exposure currently flagged as high-risk', KPI_SUMMARY.highRiskExposureCr.toLocaleString('en-IN')),
    tn(KPI_SUMMARY.nonFilers, '{0} taxpayer has not filed for the current period', '{0} taxpayers have not filed for the current period'),
    tn(KPI_SUMMARY.criticalRisk, '{0} taxpayer currently carries a Critical risk rating', '{0} taxpayers currently carry a Critical risk rating')
  ]
}

export function LandingPage({ onEnter }) {
  const ticker = tickerItems()
  const TONE_STYLES = useToneStyles()
  const { locale } = useApp()
  return (
    <div className="min-h-screen bg-steel-50">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-govt-900/95 backdrop-blur text-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo size="sm" />
            <div className="leading-tight min-w-0">
              <div className="text-sm font-bold tracking-wide truncate">{t('MAHA GST INTELLIGENCE')}</div>
              <div className="text-[10px] text-govt-200 tracking-wider hidden sm:block truncate">{t('GOVERNMENT OF MAHARASHTRA · STATE GST DEPARTMENT')}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <FontSizeControl className="hidden sm:flex bg-white/10 border-white/15" />
            <ThemeSwitcher className="bg-white/10 border-white/15" />
            <LanguageSwitcher className="bg-white/10 border-white/15" />
            <button
              onClick={onEnter}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-b from-govt-600 to-govt-700 hover:from-govt-500 hover:to-govt-600 text-white px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              {t('Officer Sign-In')} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Live ticker — recent signal counts pulled from the same figures the modules
          themselves show, so what an officer sees here is never a different number
          from what they'd find after signing in. */}
      <div className="bg-govt-900 border-b border-white/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 h-9 flex items-center gap-3">
          {/* Labelled "Simulated", not "Live" — a pulsing dot next to the word
              Live is a claim that these counts are arriving in real time from a
              departmental system. They are fixed values from the seeded dataset. */}
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gold-300 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400" aria-hidden /> {t('Simulated')}
          </span>
          <div className="flex-1 overflow-hidden">
            <div className="ticker-track flex items-center gap-10 whitespace-nowrap text-[11.5px] text-govt-100">
              {[...ticker, ...ticker].map((item, i) => (
                <span key={i} className="inline-flex items-center gap-2 shrink-0">
                  {i > 0 && <span className="text-govt-500" aria-hidden>·</span>}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .ticker-track { animation: mahagst-ticker 42s linear infinite; width: max-content; }
        .ticker-track:hover { animation-play-state: paused; }
        @keyframes mahagst-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .ticker-track { animation: none; } }
      `}</style>

      {/* Hero */}
      <section
        className="relative overflow-hidden bg-govt-900 text-white"
        style={{
          background:
            'radial-gradient(60% 85% at 88% 0%, rgb(8 163 186 / 0.30) 0%, transparent 55%), ' +
            'radial-gradient(70% 90% at 8% 100%, rgb(47 107 239 / 0.35) 0%, transparent 60%), ' +
            '#0051bb'
        }}
      >
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        {/* A soft ring of light behind the copy — the single ornamental flourish
            that keeps a flat institutional blue from reading as inert. */}
        <div className="absolute -top-24 right-[-6rem] w-[28rem] h-[28rem] rounded-full bg-intel-400/20 blur-3xl pointer-events-none" aria-hidden />
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-16 relative">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-govt-200 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 mb-6 shadow-[0_1px_0_0_rgb(255_255_255/0.15)_inset]">
            <Building2 className="w-3.5 h-3.5" /> {t('Government of Maharashtra · State GST Department')}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-3xl leading-[1.1]">
            <span className="text-intel-300">{t('Revenue Assurance, Fraud Risk')}</span>{t(' & Compliance Intelligence Infrastructure for Maharashtra GST')}
          </h1>
          <p className="text-govt-100 text-sm sm:text-lg max-w-2xl mt-5 leading-relaxed">
            {t('A unified intelligence platform for the Commissioner, senior officers, audit teams and refund teams — turning filings, payments, ITC claims, e-way bills and litigation into explainable, action-ready risk signals. Built for revenue protection and taxpayer fairness alike.')}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <button
              onClick={onEnter}
              className="on-brand-solid inline-flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl transition-all shadow-[0_8px_24px_-6px_rgb(0_0_0/0.35)] hover:-translate-y-0.5"
            >
              {t('Enter Secure Workspace')} <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#surfaces"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-white/10 border border-white/25 hover:bg-white/20 px-5 py-3 rounded-xl transition-colors"
            >
              <Eye className="w-4 h-4" /> {t('View Platform Capabilities')}
            </a>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-white border-b border-steel-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 justify-center">
          {TRUST_BADGES.map(b => (
            <span key={b} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-steel-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {t(b)}
            </span>
          ))}
        </div>
      </section>

      {/* Value props */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-govt-600 mb-2">{t('What This Platform Does')}</div>
          <h2 className="text-2xl font-bold text-navy-900">{t('Intelligence infrastructure, not another dashboard')}</h2>
          <p className="text-sm text-steel-500 mt-2">{t('Every module is built around one principle: officers get explainable signals, never black-box decisions.')}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VALUE_PROPS.map(v => {
            const c = TONE_STYLES[v.tone]
            return (
              <div key={v.title} className="rounded-xl border shadow-card p-5" style={{ backgroundColor: c.bg, borderColor: c.border }}>
                <span className="inline-flex p-2.5 rounded-lg mb-3" style={{ backgroundColor: c.iconBg, color: c.accent }}>
                  <v.icon className="w-5 h-5" />
                </span>
                <h3 className="text-sm font-bold" style={{ color: c.accent }}>{t(v.title)}</h3>
                <p className="text-xs text-steel-600 mt-1.5 leading-relaxed">{t(v.text)}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Surfaces — the actual pages behind the storefront; after sign-in, an officer's
          own role determines which of these they land on, but the figures never differ
          from what this preview shows. */}
      <section id="surfaces" className="max-w-6xl mx-auto px-6 py-16">
        <div className="max-w-2xl mb-10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-govt-600 mb-2">{t('Behind The Sign-In')}</div>
          <h2 className="text-2xl font-bold text-navy-900">{t('The intelligence pages behind this platform')}</h2>
          <p className="text-sm text-steel-500 mt-2 leading-relaxed">
            {t('This page is the storefront. After sign-in, these same figures are laid out in the pages officers actually decide from — one for every area the department runs.')}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {NAV_MODULES.map(m => {
            const Icon = MODULE_ICONS[m.id]
            const c = TONE_STYLES[GROUP_TONE[m.group]]
            return (
              <div key={m.id} className="rounded-xl p-5" style={{ backgroundColor: c.bg }}>
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3.5" style={{ backgroundColor: c.accent, color: '#fff' }}>
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="text-sm font-bold text-navy-900">{t(m.label)}</h3>
                <p className="text-xs text-steel-600 mt-1.5 leading-relaxed">{t(MODULE_DESCRIPTIONS[m.id])}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* District coverage */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="text-[11px] font-bold uppercase tracking-wider text-govt-600 mb-2">{t('Coverage In This Demonstration')}</div>
          <h2 className="text-2xl font-bold text-navy-900">{t('{0} districts modelled, one consolidated view', DISTRICTS.length)}</h2>
          <p className="text-sm text-steel-500 mt-2 leading-relaxed">
            {t('This demonstration models {0} of Maharashtra’s 36 districts. The consolidated view is designed to take all 36 without change — what is shown here is a representative subset, not statewide coverage.', DISTRICTS.length)}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
          {DISTRICTS.map(d => (
            <span key={d.name} className="inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-steel-200 rounded-full px-3 py-1.5 text-navy-700">
              <Users className="w-3 h-3 text-steel-400" /> {t(d.name)}
            </span>
          ))}
        </div>
      </section>

      {/* Built to be accountable — the four properties that hold regardless of which
          module an officer is standing in, each checkable from inside the platform. */}
      <section className="bg-white border-y border-steel-200">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="max-w-2xl mb-10">
            <div className="text-[11px] font-bold uppercase tracking-wider text-govt-600 mb-2">{t('Assurance')}</div>
            <h2 className="text-2xl font-bold text-navy-900">{t('Built to be accountable')}</h2>
            <p className="text-sm text-steel-500 mt-2 leading-relaxed">
              {t('A decision an officer cannot account for is worse than no decision at all. These four properties hold on every page behind this one, and each can be checked from inside the platform.')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {TRUST_PRINCIPLES.map((p, i) => (
              <div key={p.title} className="rounded-xl border border-steel-200 p-5">
                <div className="flex items-start gap-3">
                  <span className="text-[11px] font-bold text-govt-600 tabular-nums shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="p-1.5 rounded-lg bg-govt-50 text-govt-600 shrink-0"><p.icon className="w-3.5 h-3.5" /></span>
                      <h3 className="text-sm font-bold text-navy-900">{t(p.title)}</h3>
                    </div>
                    <p className="text-xs text-steel-600 leading-relaxed">{t(p.text)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-govt-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold">{t('Ready to enter the secure workspace?')}</h2>
          <p className="text-govt-200 text-sm mt-2 max-w-xl mx-auto">
            {t('Sign in with your officer role to access risk intelligence, case workflows and the AI copilot — all subject to role-based access control and mandatory human approval.')}
          </p>
          <button
            onClick={onEnter}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-b from-govt-600 to-govt-700 hover:from-govt-500 hover:to-govt-600 text-white px-5 py-3 rounded-xl transition-colors mt-6"
          >
            {t('Enter Secure Workspace')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <footer className="bg-govt-900 text-govt-300 text-[11px]">
        <div className="max-w-6xl mx-auto px-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-white/10 pb-5">
          <span>{t('Last reviewed and updated')}: <span className="text-govt-200 tabular-nums">{asOfLongLabel(locale)}</span></span>
          <span className="flex items-center gap-4">
            <span>{t('Visitors today (simulated)')}: <span className="text-govt-200 tabular-nums">4,812</span></span>
            <span className="hidden sm:inline text-white/15">|</span>
            <span className="hidden sm:inline">{t('Built in line with GIGW, W3C and WCAG 2.1 accessibility guidelines')}</span>
          </span>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{t('Government of Maharashtra · State GST Department — Revenue Assurance & Compliance Intelligence Infrastructure')}</span>
          <span>{t('Demonstration environment · All figures are simulated')}</span>
        </div>
      </footer>
    </div>
  )
}

