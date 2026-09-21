import type { JSX, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CircleSlash,
  Clock,
  EyeOff,
  FileWarning,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { ChartCard, moneyDatum, useDrillNavigation } from '../../components/ChartCard'
import type { ChartDatum } from '../../components/ChartCard'
import { Explain } from '../../components/Explain'
import { Figure, Money } from '../../components/Money'
import { StatusChip } from '../../components/StatusChip'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardTitle } from '../../components/ui/card'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import type { Coverage } from '../../lib/api'

/**
 * D1 — Overview. The landing screen.
 *
 * Laid out across the full width rather than down a column on the left: on a
 * 1920px desk the old single column left two thirds of the screen empty and
 * pushed the risk distributions below the fold, so the first thing a
 * Commissioner saw was a lot of nothing.
 *
 * The order is an argument, not a grid fill. Money first, because that is what
 * the screen is for. Then the four things worth acting on this morning, spread
 * across the rest of the row. Then the two distributions side by side, because
 * they answer different questions and have to be read together. Then the
 * caveat — what the scores could not see — which stays on the first screen
 * rather than in a footnote.
 *
 * What has not changed, and must not: every figure drills, the two scores are
 * never fused, and no number animates.
 *
 * Served from the rollups, never live.
 */
export default function Overview(): JSX.Element {
  const drill = useDrillNavigation()
  const query = useQuery({ queryKey: ['overview'], queryFn: () => api.overview() })

  if (query.isLoading) return <Skeleton />
  if (query.isError || !query.data) return <NoRun />
  const data = query.data

  const byMetric = new Map(data.kpi.map((tile) => [tile.metric, tile]))
  const atRisk = byMetric.get('M-K05')
  const barred = byMetric.get('M-F07')
  const notFiled = byMetric.get('M-F04')
  const taxpayers = byMetric.get('taxpayers')
  const nearBar = byMetric.get('M-F06')

  const pBands: ChartDatum[] = data.risk_landscape.p_bands.map((row) => ({
    label: BAND_LABEL[row.band] ?? row.band,
    value: businesses(row.taxpayer_count),
    magnitude: row.taxpayer_count,
    drill: row.drill,
    status: bandStatus(row.band),
  }))
  const fBands: ChartDatum[] = data.risk_landscape.f_bands.map((row) => ({
    label: F_BAND_LABEL[row.band] ?? row.band,
    value: businesses(row.taxpayer_count),
    magnitude: row.taxpayer_count,
    drill: row.drill,
    status: fBandStatus(row.band),
  }))
  const confidence: ChartDatum[] = data.revenue_at_risk_by_confidence.map((row) => ({
    label: CONFIDENCE_LABEL[row.confidence] ?? row.confidence,
    ...moneyDatum(row.value),
    drill: row.drill,
    note: row.note ?? CONFIDENCE_NOTE[row.confidence],
  }))

  const atRiskBand = data.risk_landscape.p_bands
    .filter((row) => row.band === 'SEVERE' || row.band === 'HIGH')
    .reduce((sum, row) => sum + row.taxpayer_count, 0)

  return (
    <div className="w-full">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <span className="eyebrow">Commercial Taxes Department &middot; Maharashtra</span>
          <h1 className="mt-0.5 font-display text-3xl font-semibold tracking-tight">Overview</h1>
        </div>
        <p className="text-xs text-ink-muted tabular">
          Checked {data.as_of} &middot; FY {data.fy} &middot; run{' '}
          {data.engine_run_id.slice(0, 8)}
        </p>
      </header>

      {/* ------------------------------------------- the headline, full width */}
      <section className="animate-rise mb-4 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="relative overflow-hidden p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl"
          />
          <span className="eyebrow flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
            Money the returns say is owed
            <Explain title="What this figure is">
              The total of every finding the rules are confident about, added across every
              business in view. Advisory findings &mdash; worth mentioning, not worth demanding
              &mdash; are left out. It is what the returns themselves show, before anyone has
              replied, so read it as the top of the range rather than as recovery.
            </Explain>
          </span>
          {atRisk !== undefined ? (
            <p className="mt-2 font-display text-[2.6rem] font-semibold leading-none">
              <Money
                value={atRisk.value}
                calcId={null}
                drill={() => {
                  drill(atRisk.drill)
                }}
              />
            </p>
          ) : (
            <p className="mt-2 text-2xl text-ink-muted">not computed</p>
          )}
          <p className="mt-2 text-sm text-ink-secondary">
            across <Figure value={taxpayers?.value ?? '0'} /> businesses in view
          </p>
          <hr className="brand-rule mt-4 w-24" />
        </Card>

        {/* Four stats, spread across the rest of the row. */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            icon={<Clock className="h-3.5 w-3.5" aria-hidden="true" />}
            label="Running out of time"
            value={nearBar?.value ?? '—'}
            hint="periods near the three-year bar"
            tone={nearBar !== undefined && nearBar.value !== '0' ? 'critical' : 'good'}
            drill={nearBar?.drill}
            onDrill={drill}
          />
          <Stat
            icon={<CircleSlash className="h-3.5 w-3.5" aria-hidden="true" />}
            label="Already out of time"
            value={barred?.value ?? '—'}
            hint="the deadline has passed"
            tone={barred !== undefined && barred.value !== '0' ? 'critical' : 'good'}
            drill={barred?.drill}
            onDrill={drill}
          />
          <Stat
            icon={<FileWarning className="h-3.5 w-3.5" aria-hidden="true" />}
            label="Returns never filed"
            value={notFiled?.value ?? '—'}
            hint="the liability still exists"
            tone="warning"
            drill={notFiled?.drill}
            onDrill={drill}
          />
          <Stat
            icon={<AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
            label="High or severe risk"
            value={String(atRiskBand)}
            hint="businesses to examine first"
            tone={atRiskBand > 0 ? 'serious' : 'good'}
            to="/dashboard/risk"
          />
        </div>
      </section>

      {/* ------------------------------------------ three charts, side by side */}
      <section className="animate-rise stagger-1 mb-4 grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Who should we look at?"
          subtitle="P-Score — from the department's 34 risk flags"
          data={pBands}
          unit="Businesses"
          onDrill={drill}
          footer={
            <span className="flex items-baseline">
              A way of sorting the list, not evidence. Always read with its coverage.
              <Explain term="pScore" />
            </span>
          }
        />
        <ChartCard
          title="What can we actually demand?"
          subtitle="F-Score — from the 57 detection rules, with the rupees attached"
          data={fBands}
          unit="Businesses"
          onDrill={drill}
          footer={
            <span className="flex items-baseline">
              This side can go into a notice. Shown beside the P-Score, never added to it.
              <Explain term="fScore" />
            </span>
          }
        />
        <ChartCard
          title="Would it survive a reply?"
          subtitle="The same money, by how firmly the returns support it"
          data={confidence}
          unit="Rupees"
          onDrill={drill}
          footer="Advisory findings are excluded from the headline figure — worth raising, not worth demanding."
        />
      </section>

      {/* ------------------------------------------- coverage and what to do */}
      <section className="animate-rise stagger-2 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <CoverageCard coverage={data.coverage} />
        <NextCard />
      </section>
    </div>
  )
}

/* --------------------------------------------------------------- pieces */

function Stat({
  icon,
  label,
  value,
  hint,
  tone,
  drill,
  onDrill,
  to,
}: {
  icon: ReactNode
  label: string
  value: string
  hint: string
  tone: 'good' | 'warning' | 'serious' | 'critical'
  drill?: string | undefined
  onDrill?: ((drill: string) => void) | undefined
  to?: string
}): JSX.Element {
  const body = (
    <>
      <span className="eyebrow flex items-center gap-1.5 text-[10px]">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span className="mt-1 block font-display text-3xl font-semibold leading-none tabular">
        {value}
      </span>
      <span className="mt-1 block text-xs text-ink-muted">{hint}</span>
      {value !== '0' && value !== '—' && tone !== 'good' && (
        <span className="mt-2 block">
          <StatusChip level={tone} label={TONE_LABEL[tone]} />
        </span>
      )}
    </>
  )

  const shared = 'panel panel-interactive p-3 text-left'

  if (to !== undefined) {
    return (
      <Link to={to} className={cn(shared, 'block')}>
        {body}
      </Link>
    )
  }
  return (
    <button
      type="button"
      className={shared}
      disabled={drill === undefined}
      onClick={() => {
        if (drill !== undefined && onDrill !== undefined) onDrill(drill)
      }}
    >
      {body}
    </button>
  )
}

/**
 * The coverage meter.
 *
 * This is the integration business case, priced in flags, and it stays on the
 * landing screen deliberately. The temptation with a dark parameter is to
 * leave it off the dashboard, and a dashboard that leaves it off is quietly
 * claiming a completeness it does not have.
 */
function CoverageCard({ coverage }: { coverage: Coverage }): JSX.Element {
  const share = coverage.total === 0 ? 0 : Math.round((coverage.evaluated / coverage.total) * 100)
  return (
    <Card className="border-status-unknown/40">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <CardTitle className="flex items-baseline">
          <EyeOff className="mr-1.5 h-4 w-4 self-center" aria-hidden="true" />
          What the scores could not see
          <Explain term="coverage" />
        </CardTitle>
        <span className="text-sm tabular text-ink-secondary">
          {coverage.evaluated} of {coverage.total} risk flags tested, on average
        </span>
      </div>

      <CardContent className="mt-3">
        <div
          className="h-2 w-full overflow-hidden rounded-sm bg-sunken"
          role="img"
          aria-label={`${String(share)} per cent of the risk flags could be tested`}
        >
          <div
            className="h-full rounded-sm bg-status-unknown transition-[width] duration-[--motion-slow] ease-out"
            style={{ width: `${String(Math.max(2, share))}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-ink-secondary">
          The rest could not be tested, so they are left out of the score on both sides rather
          than counted as clear. That is why this figure is printed beside every score on the
          platform: <strong>a high score over few flags is not the same claim</strong> as the
          same score over all of them.
        </p>

        {coverage.awaiting_feeds.length > 0 && (
          <p className="mt-2 text-sm text-ink-secondary">
            Waiting on: {coverage.awaiting_feeds.join(', ')}.
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-1">
          {coverage.dark_parameters.map((parameter) => (
            <span
              key={parameter}
              className="rounded-sm border border-status-unknown/60 px-1.5 py-0.5 text-[11px] tabular text-status-unknown"
            >
              {parameter}
            </span>
          ))}
        </div>

        <Button asChild variant="link" size="sm" className="mt-3 px-0">
          <Link to="/alignment">
            See which flags, and what each is waiting for
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

/** Where to go next, for a reader who has just landed. */
function NextCard(): JSX.Element {
  const links: [string, string, string][] = [
    ['/workbench', 'Work my queue', 'The items waiting on you, actionable first'],
    ['/dashboard/risk', 'Where the risk is', 'The bands, and the flags driving them'],
    ['/alignment', 'Check against the circular', 'All 34 flags, beside what we compute'],
    ['/guide', 'How this works', 'What to upload, and what comes out'],
  ]
  return (
    <Card>
      <CardTitle className="flex items-baseline">
        <ShieldCheck className="mr-1.5 h-4 w-4 self-center" aria-hidden="true" />
        Where to go next
      </CardTitle>
      <CardContent className="mt-3">
        <ul className="space-y-1">
          {links.map(([to, label, hint]) => (
            <li key={to}>
              <Link
                to={to}
                className="group flex items-baseline gap-2 rounded px-2 py-1.5 transition-colors hover:bg-sunken"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-ink-muted">{hint}</span>
                </span>
                <ArrowRight
                  className="h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function Skeleton(): JSX.Element {
  return (
    <div className="w-full">
      <div className="mb-5 h-10 w-52 animate-pulse rounded bg-sunken" />
      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="h-40 animate-pulse rounded-lg bg-sunken" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-lg bg-sunken" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {[0, 1, 2].map((n) => (
          <div key={n} className="h-56 animate-pulse rounded-lg bg-sunken" />
        ))}
      </div>
      <span className="sr-only">Loading the overview</span>
    </div>
  )
}

function NoRun(): JSX.Element {
  return (
    <section className="max-w-2xl">
      <div className="mb-3 flex items-center gap-3">
        <h1 className="font-display text-2xl font-semibold">Overview</h1>
        <StatusChip level="unknown" label="Nothing has been checked yet" />
      </div>
      <p className="text-sm text-ink-secondary">
        No returns have been read and scored, so there is nothing to show. This screen does not
        display example figures.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant="primary">
          <Link to="/ingestion">Upload returns</Link>
        </Button>
        <Button asChild>
          <Link to="/guide">How this works</Link>
        </Button>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- maps */

/** "1 businesses" is the sort of thing a reader stops trusting a screen over. */
function businesses(n: number): string {
  return `${String(n)} ${n === 1 ? 'business' : 'businesses'}`
}

const TONE_LABEL: Record<'good' | 'warning' | 'serious' | 'critical', string> = {
  good: 'Clear',
  warning: 'Open',
  serious: 'Watch',
  critical: 'Urgent',
}

/** The bands, named so a reader does not have to learn the ladder first. */
const BAND_LABEL: Record<string, string> = {
  LOW: 'Low risk',
  MODERATE: 'Moderate',
  HIGH: 'High',
  SEVERE: 'Severe',
}

const F_BAND_LABEL: Record<string, string> = {
  GREEN: 'Nothing found',
  AMBER: 'Small amounts',
  ORANGE: 'Substantial',
  RED: 'Large',
}

const CONFIDENCE_LABEL: Record<string, string> = {
  CERTAIN: 'Arithmetic',
  STRONG: 'Well supported',
  ADVISORY: 'Advisory only',
}

const CONFIDENCE_NOTE: Record<string, string> = {
  CERTAIN: 'One declared figure against another. Hard to argue with.',
  STRONG: 'Well supported, but a reply could move it.',
  ADVISORY: 'Not counted in the headline figure.',
}

function bandStatus(band: string): ChartDatum['status'] {
  return (
    { LOW: 'good', MODERATE: 'warning', HIGH: 'serious', SEVERE: 'critical' } as const
  )[band as 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE']
}

function fBandStatus(band: string): ChartDatum['status'] {
  return (
    { GREEN: 'good', AMBER: 'warning', ORANGE: 'serious', RED: 'critical' } as const
  )[band as 'GREEN' | 'AMBER' | 'ORANGE' | 'RED']
}
