import type { JSX } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import Drill from './pages/Drill'
import Overview from './pages/dashboard/Overview'
import ParameterExplorer from './pages/dashboard/ParameterExplorer'
import Filing from './pages/dashboard/Filing'
import Funnel from './pages/dashboard/Funnel'
import Jurisdictions from './pages/dashboard/Jurisdictions'
import Officers from './pages/dashboard/Officers'
import Revenue from './pages/dashboard/Revenue'
import Risk from './pages/dashboard/Risk'
import Sectors from './pages/dashboard/Sectors'
import Admin from './pages/shared/Admin'
import Alignment from './pages/shared/Alignment'
import Guide from './pages/shared/Guide'
import Ingestion from './pages/shared/Ingestion'
import Library from './pages/shared/Library'
import Cases from './pages/workbench/Cases'
import Copilot from './pages/workbench/Copilot'
import FilingDetail from './pages/workbench/FilingDetail'
import Insights from './pages/workbench/Insights'
import InsightsIndex from './pages/workbench/InsightsIndex'
import Filings from './pages/workbench/Filings'
import Planner from './pages/workbench/Planner'
import Registry from './pages/workbench/Registry'
import Worklist from './pages/workbench/Worklist'
import Notices from './pages/workbench/Notices'
import TaxpayerFile from './pages/workbench/TaxpayerFile'
import { ComingSoon } from './components/ComingSoon'
import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import { useI18n } from './i18n'
import { landingPath } from './lib/rbac'
import { useSession } from './lib/session'

/** Root redirects to the surface this role lands on -- docs/03 section 0. */
function RoleLanding(): JSX.Element {
  const role = useSession((state) => state.role)
  return <Navigate to={landingPath(role)} replace />
}

function NotFound(): JSX.Element {
  const { t } = useI18n()
  const role = useSession((state) => state.role)
  const { pathname } = useLocation()
  return (
    <section className="max-w-3xl">
      <h1 className="mb-2 text-xl font-semibold">{t('notFound.title')}</h1>
      <p className="text-ink-secondary">{t('notFound.body')}</p>
      <p className="mt-1 text-sm text-ink-muted tabular">{pathname}</p>
      <a className="mt-4 inline-block text-sm underline" href={landingPath(role)}>
        {t('notFound.back')}
      </a>
    </section>
  )
}

export default function App(): JSX.Element {
  return (
    <Routes>
      {/* The storefront and the sign-in sit OUTSIDE the shell: both carry the
          department's identity band themselves, and neither belongs under a
          navigation bar for a workspace you have not entered. */}
      <Route path="/welcome" element={<Landing />} />
      <Route path="/sign-in" element={<SignIn />} />

      <Route path="/" element={<AppShell />}>
        <Route index element={<RoleLanding />} />

        {/* ---------------- DASHBOARD: decision makers ---------------- */}
        <Route path="dashboard" element={<Overview />} />
        <Route path="dashboard/filing" element={<Filing />} />
        <Route path="dashboard/revenue" element={<Revenue />} />
        <Route path="dashboard/risk" element={<Risk />} />
        <Route path="dashboard/parameters" element={<ParameterExplorer />} />
        <Route path="dashboard/funnel" element={<Funnel />} />
        <Route path="dashboard/jurisdictions" element={<Jurisdictions />} />
        <Route path="dashboard/officers" element={<Officers />} />
        <Route path="dashboard/sectors" element={<Sectors />} />

        {/* ---------------- WORKBENCH: officers ---------------- */}
        <Route path="workbench" element={<Worklist />} />
        <Route path="workbench/filings" element={<Filings />} />
        <Route path="workbench/filings/:gstin/:period" element={<FilingDetail />} />
        <Route path="workbench/insights" element={<InsightsIndex />} />
        <Route path="workbench/insights/:gstin" element={<Insights />} />
        <Route path="workbench/planner" element={<Planner />} />
        <Route path="workbench/registry" element={<Registry />} />
        <Route path="workbench/taxpayer" element={<TaxpayerFile />} />
        <Route path="workbench/taxpayer/:gstin" element={<TaxpayerFile />} />
        <Route path="workbench/cases" element={<Cases />} />
        <Route path="workbench/notices" element={<Notices />} />
        <Route path="workbench/copilot" element={<Copilot />} />

        {/* ---------------- SHARED ---------------- */}
        <Route path="guide" element={<Guide />} />
        <Route path="ingestion" element={<Ingestion />} />
        <Route path="library" element={<Library />} />
        <Route path="alignment" element={<Alignment />} />
        <Route path="admin" element={<Admin />} />
        <Route
          path="roadmap"
          element={
            <ComingSoon
              title="Integration roadmap"
              status="PLANNED"
              capability="External feeds that light up the ten dark audit risk parameters."
              dependency="ICEGATE, ITD/AIS, DGARM and the refund module."
              roadmapRef="RM-02 to RM-05"
              unlocks={[
                'P02',
                'P15',
                'P20',
                'P23',
                'P25',
                'P26',
                'P27',
                'P28',
                'P33',
                'P34',
              ]}
            />
          }
        />

        {/* Every chart element resolves here. */}
        <Route path="drill" element={<Drill />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
