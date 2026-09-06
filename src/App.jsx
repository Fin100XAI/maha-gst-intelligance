import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext.jsx'
import { Sidebar } from './components/layout/Sidebar.jsx'
import { Masthead } from './components/layout/Masthead.jsx'
import { Header } from './components/layout/Header.jsx'
import { TopNav } from './components/layout/TopNav.jsx'
import { ContextBar } from './components/layout/ContextBar.jsx'
import { RoleSelector } from './components/layout/RoleSelector.jsx'
import { LandingPage } from './components/layout/LandingPage.jsx'
import { RoleGate } from './components/layout/RoleGate.jsx'

import StatutoryTimeIntelligence from './modules/StatutoryTimeIntelligence.jsx'
import PrecedentIntelligence from './modules/PrecedentIntelligence.jsx'
import CapacityOptimisation from './modules/CapacityOptimisation.jsx'
import NetworkEnforcement from './modules/NetworkEnforcement.jsx'
import UnknownRiskDiscovery from './modules/UnknownRiskDiscovery.jsx'
import RevenueProtectionCommandCentre from './modules/RevenueProtectionCommandCentre.jsx'
import RevenueRecoveryWindow from './modules/RevenueRecoveryWindow.jsx'
import ExecutiveCommandCenter from './modules/ExecutiveCommandCenter.jsx'
import CaseDigitalTwin from './modules/CaseDigitalTwin.jsx'
import RevenueIntelligence from './modules/RevenueIntelligence.jsx'
import Taxpayer360 from './modules/Taxpayer360.jsx'
import ITCRiskIntelligence from './modules/ITCRiskIntelligence.jsx'
import FakeInvoiceNetwork from './modules/FakeInvoiceNetwork.jsx'
import EWayBillIntelligence from './modules/EWayBillIntelligence.jsx'
import RefundRiskIntelligence from './modules/RefundRiskIntelligence.jsx'
import CasePriorityEngine from './modules/CasePriorityEngine.jsx'
import AuditScrutinyEngine from './modules/AuditScrutinyEngine.jsx'
import SectorIntelligence from './modules/SectorIntelligence.jsx'
import DistrictDivisionPerformance from './modules/DistrictDivisionPerformance.jsx'
import OfficerAICopilot from './modules/OfficerAICopilot.jsx'
import LitigationIntelligence from './modules/LitigationIntelligence.jsx'
import ComplianceEarlyWarning from './modules/ComplianceEarlyWarning.jsx'
import AIGovernanceSecurity from './modules/AIGovernanceSecurity.jsx'
import ReportsBriefingNotes from './modules/ReportsBriefingNotes.jsx'
import OfficialStatistics from './modules/OfficialStatistics.jsx'

const MODULE_COMPONENTS = {
  'statutory-time': StatutoryTimeIntelligence,
  'precedent': PrecedentIntelligence,
  'capacity': CapacityOptimisation,
  'network-enforcement': NetworkEnforcement,
  'unknown-risk': UnknownRiskDiscovery,
  'revenue-protection': RevenueProtectionCommandCentre,
  'recovery-window': RevenueRecoveryWindow,
  'command-center': ExecutiveCommandCenter,
  'case-twin': CaseDigitalTwin,
  'revenue-intelligence': RevenueIntelligence,
  'taxpayer-360': Taxpayer360,
  'itc-risk': ITCRiskIntelligence,
  'fake-invoice': FakeInvoiceNetwork,
  'eway-bill': EWayBillIntelligence,
  'refund-risk': RefundRiskIntelligence,
  'case-priority': CasePriorityEngine,
  'audit-scrutiny': AuditScrutinyEngine,
  'sector-intelligence': SectorIntelligence,
  'district-performance': DistrictDivisionPerformance,
  'officer-copilot': OfficerAICopilot,
  'litigation': LitigationIntelligence,
  'early-warning': ComplianceEarlyWarning,
  'ai-governance': AIGovernanceSecurity,
  'reports': ReportsBriefingNotes,
  'official-statistics': OfficialStatistics
}

function Shell() {
  const { role, activeModule, entered, enterPlatform } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!entered) return <LandingPage onEnter={enterPlatform} />
  if (!role) return <RoleSelector />

  const ActiveComponent = MODULE_COMPONENTS[activeModule] || ExecutiveCommandCenter

  return (
    <div className="min-h-screen flex flex-col bg-steel-50">
      {/* Mobile-only drawer — primary navigation on wide screens is the horizontal TopNav below. */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <Masthead />
      <Header onOpenMobile={() => setMobileOpen(true)} />
      <TopNav />
      <ContextBar />
      <main className="flex-1 min-w-0 p-4 lg:p-6">
        <div className="mx-auto w-full max-w-[1600px]">
          <RoleGate moduleId={activeModule}>
            <ActiveComponent />
          </RoleGate>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
