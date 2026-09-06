import { useMemo } from 'react'
import {
  LayoutDashboard, TrendingUp, UserSearch, ShieldAlert, Network, Truck, Timer, Gavel as GavelIcon,
  Receipt, ClipboardCheck, Factory, Map, Bot, Gavel, BellRing, ShieldCheck,
  FileBarChart2, BadgeCheck, Layers, ListOrdered, Scale, Users, Scissors, Radar, ShieldCheck as ShieldCheckIcon, History
} from 'lucide-react'
import {
  KPI_SUMMARY, NETWORK_CLUSTERS, EWAY_RECORDS, AUDIT_CASES,
  LITIGATION_CASES, AI_GOVERNANCE_METRICS
} from '../../data/mockData.js'

export const MODULE_ICONS = {
  'statutory-time': GavelIcon,
  'recovery-window': Timer,
  'command-center': LayoutDashboard,
  'case-twin': Layers,
  'revenue-intelligence': TrendingUp,
  'taxpayer-360': UserSearch,
  'itc-risk': ShieldAlert,
  'fake-invoice': Network,
  'eway-bill': Truck,
  'refund-risk': Receipt,
  'case-priority': ListOrdered,
  'audit-scrutiny': ClipboardCheck,
  'sector-intelligence': Factory,
  'district-performance': Map,
  'officer-copilot': Bot,
  'litigation': Gavel,
  'precedent': Scale,
  'capacity': Users,
  'network-enforcement': Scissors,
  'unknown-risk': Radar,
  'revenue-protection': ShieldCheckIcon,
  'retrospective': History,
  'early-warning': BellRing,
  'ai-governance': ShieldCheck,
  'reports': FileBarChart2,
  'official-statistics': BadgeCheck
}

// Numeric counts shown on navigation — each one a queue that plausibly demands
// an officer's attention, not decoration. `urgent` items pulse / show red.
export function useSidebarBadges() {
  return useMemo(() => {
    const activeAuditCases = AUDIT_CASES.filter(c => c.stage !== 'Closed').length
    const eWayAnomalies = EWAY_RECORDS.filter(r => r.anomalyFlag).length
    const pendingLitigation = LITIGATION_CASES.filter(c => c.stage !== 'Order Confirmed' && c.stage !== 'Order Reversed').length
    return {
      'itc-risk': { count: KPI_SUMMARY.itcRiskCases, urgent: false },
      'fake-invoice': { count: NETWORK_CLUSTERS.length, urgent: true },
      'eway-bill': { count: eWayAnomalies, urgent: false },
      'refund-risk': { count: KPI_SUMMARY.refundCasesUnderReview, urgent: false },
      'audit-scrutiny': { count: activeAuditCases, urgent: false },
      'litigation': { count: pendingLitigation, urgent: false },
      'early-warning': { count: KPI_SUMMARY.complianceAlerts, urgent: true },
      'ai-governance': { count: AI_GOVERNANCE_METRICS.pendingGovernanceReview, urgent: false }
    }
  }, [])
}

export const NAV_GROUPS = [
  { id: 'Leadership', label: 'Leadership' },
  { id: 'Revenue', label: 'Revenue' },
  { id: 'Fraud & Risk', label: 'Fraud & Risk' },
  { id: 'Enforcement', label: 'Enforcement' },
  { id: 'Benchmarking', label: 'Benchmarking' },
  { id: 'Governance', label: 'Governance' }
]
