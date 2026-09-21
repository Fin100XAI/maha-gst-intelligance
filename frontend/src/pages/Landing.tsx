import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Lock,
  Network,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { Logo } from '../components/brand/Logo'
import { api } from '../lib/api'
import { NAV_GROUPS } from '../lib/navigation'
import { SCREEN_BLURB } from '../lib/screenBlurbs'
import { useI18n } from '../i18n'

/**
 * The storefront, on the maha-gst-intelligance design system.
 *
 * Layout, palette and section order are ported from
 * Fin100XAI/maha-gst-intelligance so this platform reads as one system with
 * the department's other intelligence surfaces. What is *not* ported is the
 * ticker's contents.
 *
 * The reference fills its ticker from a seeded mock dataset and labels it
 * "Simulated". This build has a real engine over real filed returns, and the
 * fifth law forbids fabricated data anywhere. So the strip reads the same
 * counts the screens behind it read - from `/coverage/screens`, which reports
 * what is actually in the database - and when that call fails the strip does
 * not render at all. An officer is never shown a number here that they would
 * not find again after signing in.
 */

const VALUE_PROPS = [
  {
    icon: TrendingUp,
    tone: 'navy',
    title: 'Revenue assurance',
    text: 'Every rupee of a finding traces to the rule that produced it, the threshold it was measured against, and the cell of the return it came from.',
  },
  {
    icon: Network,
    tone: 'red',
    title: 'Reconciliation across forms',
    text: 'GSTR-1 against GSTR-3B against GSTR-2B, head by head, period by period. IGST, CGST, SGST and Cess are never summed into one figure.',
  },
  {
    icon: ShieldCheck,
    tone: 'green',
    title: 'Two scores, never fused',
    text: 'The P-Score answers who to audit and carries its coverage beside it. The F-Score answers what can be demanded and on what evidence.',
  },
  {
    icon: ClipboardCheck,
    tone: 'saffron',
    title: 'Nothing silently assumed',
    text: 'A rule that cannot run reports NOT EVALUATED and names the dataset it needed. It never reports "no issue found" when it means "I could not look".',
  },
  {
    icon: Bot,
    tone: 'orange',
    title: 'The model is a scribe',
    text: 'Every rupee, ratio, day-count and flag is pure Python over Decimal. No language model touches a calculation, and a test enforces it.',
  },
  {
    icon: Lock,
    tone: 'steel',
    title: 'Auditable by construction',
    text: 'Every officer action on taxpayer data lands in a hash-chained log. Maker and checker are different people, and the platform will not let them be one.',
  },
] as const

/*
 * A pairing rule, because dark mode makes it bite immediately.
 *
 * The `govt` and `govtgold` families are FIXED in both themes -- they are
 * institutional bands, and a masthead that inverts is a light strip across a
 * dark page. Our ink and surface tokens are THEMED and do invert.
 *
 * So the two may never be mixed on the same element. A fixed-light ground
 * (`bg-govt-50`) under themed ink renders as light text on a light card the
 * moment the reader switches to dark, which is how the selected officer's
 * name disappeared from the sign-in screen.
 *
 *   fixed ground  -> fixed ink   (bg-govt-50 + text-govt-700)
 *   themed ground -> themed ink  (bg-sunken  + text-ink)
 *
 * Pick a side. Never one of each.
 */
type ToneName = 'navy' | 'red' | 'green' | 'saffron' | 'orange' | 'steel'

interface Tone {
  bg: string
  border: string
  icon: string
  accent: string
}

const TONE: Record<ToneName, Tone> = {
  navy: {
    bg: 'bg-sunken',
    border: 'border-govt-400',
    icon: 'bg-raised text-govt-700',
    accent: 'text-govt-700',
  },
  red: {
    bg: 'bg-sunken',
    border: 'border-line',
    icon: 'bg-raised text-status-critical',
    accent: 'text-status-critical',
  },
  green: {
    bg: 'bg-sunken',
    border: 'border-line',
    icon: 'bg-raised text-status-good',
    accent: 'text-status-good',
  },
  saffron: {
    bg: 'bg-sunken',
    border: 'border-govtgold-400',
    icon: 'bg-raised text-saffron-deep',
    accent: 'text-saffron-deep',
  },
  orange: {
    bg: 'bg-sunken',
    border: 'border-line',
    icon: 'bg-raised text-status-warning',
    accent: 'text-status-warning',
  },
  steel: {
    bg: 'bg-sunken',
    border: 'border-line',
    icon: 'bg-raised text-ink-secondary',
    accent: 'text-ink',
  },
}

/** The five laws, as the four properties a reader can check from inside. */
const ASSURANCE = [
  {
    icon: Lock,
    title: 'Determinism',
    text: 'The same input bytes produce byte-identical output, today and in three years. Every figure is pure Python over Decimal - no floats, no randomness, no clock.',
  },
  {
    icon: Eye,
    title: 'Provenance on every figure',
    text: 'Every number carries a calculation id resolving to the rule, its basis, the formula as executed, the intermediate terms and the source rows. A figure without one is a bug.',
  },
  {
    icon: ShieldCheck,
    title: 'Head-wise integrity',
    text: 'IGST, CGST, SGST and Cess are carried as a vector and never collapsed into a scalar. The collapse is structurally impossible, not merely discouraged.',
  },
  {
    icon: Bot,
    title: 'Nothing silently dropped',
    text: 'Every uploaded row lands in read, held or duplicate, and the counts reconcile on screen. If they do not balance, nothing is saved at all.',
  },
] as const

const TRUST_BADGES = [
  'Role-based access at the query layer',
  'Maker and checker are different officers',
  'Every figure drills to its source cell',
  'Hash-chained audit log',
  'No model touches a calculation',
  'Thresholds versioned by effective date',
] as const

export default function Landing(): JSX.Element {
  const { t } = useI18n()

  // Real counts or none. See the note at the top of this file.
  const coverage = useQuery({
    queryKey: ['coverage', 'landing'],
    queryFn: () => api.coverage(),
    retry: false,
    staleTime: 300_000,
  })
  const datasets = (coverage.data?.datasets ?? []).filter((d) => d.rows > 0)

  return (
    <div className="min-h-screen bg-page">
      {/* -------------------------------------------------------- top bar */}
      <div className="sticky top-0 z-20 bg-govt-900/95 text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo size="sm" />
            <div className="min-w-0 truncate text-sm font-bold tracking-wide">
              GST Intelligence
            </div>
          </div>

          <nav aria-label="Sections" className="mx-auto hidden items-center gap-0.5 lg:flex">
            {[
              ['#platform', 'What it does'],
              ['#surfaces', 'Screens'],
              ['#coverage', 'What is loaded'],
              ['#assurance', 'Assurance'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 text-[13px] font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>

          <Link
            to="/sign-in"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-b from-govt-600 to-govt-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:from-govt-500 hover:to-govt-600"
          >
            Officer sign-in <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* --------------------------------------------------------- ticker */}
      {datasets.length > 0 && (
        <div className="overflow-hidden border-b border-white/10 bg-govt-900">
          <div className="mx-auto flex h-9 max-w-7xl items-center gap-3 px-6">
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-govtgold-300">
              <span className="h-1.5 w-1.5 rounded-full bg-govtgold-400" aria-hidden="true" />
              Loaded now
            </span>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-10 whitespace-nowrap text-[11.5px] text-govt-100">
                {datasets.map((d) => (
                  <span key={d.dataset} className="inline-flex shrink-0 items-center gap-2">
                    <span className="tabular font-semibold text-white">
                      {d.rows.toLocaleString('en-IN')}
                    </span>
                    {d.dataset}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- hero */}
      <section
        className="relative overflow-hidden bg-govt-900 text-white"
        style={{
          background:
            'radial-gradient(60% 85% at 88% 0%, rgb(34 196 216 / 0.30) 0%, transparent 55%), ' +
            'radial-gradient(70% 90% at 8% 100%, rgb(47 107 239 / 0.35) 0%, transparent 60%), ' +
            'rgb(var(--govt-900))',
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-intel-400/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-16">
          <h1 className="max-w-3xl text-3xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            <span className="text-intel-300">Scrutiny, reconciliation</span> and demand - from
            the filed return to the source cell
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-govt-100 sm:text-lg">
            {t('app.tagline')} Thirty-four risk parameters and fifty-seven detection rules over
            GSTR-1, GSTR-3B and GSTR-2B - every figure determinate, every figure traceable, and
            every rule that could not run saying so by name.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-govtgold-400 to-govtgold-600 px-5 py-3 text-sm font-semibold text-rail-900 shadow-[0_8px_24px_-6px_rgb(0_0_0/0.35)] transition-all hover:-translate-y-0.5"
            >
              Enter the workspace <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#surfaces"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
            >
              <Eye className="h-4 w-4" /> See the screens
            </a>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- trust strip */}
      <section className="border-b border-line bg-raised">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-4">
          {TRUST_BADGES.map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-secondary"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-status-good" /> {b}
            </span>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- value props */}
      <section id="platform" className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-govt-accent">
            What this platform does
          </div>
          <h2 className="font-display text-2xl font-bold">
            An instrument of record, not another dashboard
          </h2>
          <p className="mt-2 text-sm text-ink-secondary">
            Output from this platform is used to issue statutory notices that create legal
            liability. Everything below follows from that.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUE_PROPS.map((v) => {
            const c = TONE[v.tone]
            return (
              <div key={v.title} className={`rounded-xl border p-5 ${c.bg} ${c.border}`}>
                <span className={`mb-3 inline-flex rounded-lg p-2.5 ${c.icon}`}>
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className={`text-sm font-bold ${c.accent}`}>{v.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">{v.text}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ------------------------------------------------------- surfaces */}
      <section id="surfaces" className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 max-w-2xl">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-govt-accent">
            Behind the sign-in
          </div>
          <h2 className="font-display text-2xl font-bold">Every screen the platform has</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            Nothing is hidden behind a tier. Every officer sees every screen; what differs is
            which actions each may take, and the screens say so rather than hiding the button.
          </p>
        </div>
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="mb-8">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-ink-muted">
              {t(group.headingKey)}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <div key={item.path} className="rounded-xl bg-sunken p-4">
                  <div className="flex items-baseline gap-2">
                    <span className="tabular text-[10px] font-bold text-govt-accent">
                      {item.code}
                    </span>
                    <h4 className="text-sm font-bold">{t(item.labelKey)}</h4>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
                    {SCREEN_BLURB[item.code] ?? ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ------------------------------------------------------- coverage */}
      <section id="coverage" className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-govt-accent">
            What is loaded right now
          </div>
          <h2 className="font-display text-2xl font-bold">
            {datasets.length > 0
              ? 'The datasets behind these screens'
              : 'Nothing has been uploaded yet'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            These are counts from the database this platform is serving, not an illustration.
            A screen whose dataset is absent says so by name rather than showing a zero.
          </p>
        </div>
        <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
          {(coverage.data?.datasets ?? []).map((d) => (
            <span
              key={d.dataset}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-raised px-3 py-1.5 text-xs font-medium"
            >
              <span className="tabular font-semibold">{d.rows.toLocaleString('en-IN')}</span>
              <span className="text-ink-secondary">{d.dataset}</span>
            </span>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ assurance */}
      <section id="assurance" className="border-y border-line bg-raised">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10 max-w-2xl">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-govt-accent">
              Assurance
            </div>
            <h2 className="font-display text-2xl font-bold">Built to be accountable</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              A decision an officer cannot account for is worse than no decision at all. These
              four hold on every screen behind this one, and each can be checked from inside the
              platform.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {ASSURANCE.map((p, i) => (
              <div key={p.title} className="rounded-xl border border-line p-5">
                <div className="flex items-start gap-3">
                  <span className="tabular mt-0.5 shrink-0 text-[11px] font-bold text-govt-accent">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="shrink-0 rounded-lg bg-govt-50 p-1.5 text-govt-700">
                        <p.icon className="h-3.5 w-3.5" />
                      </span>
                      <h3 className="text-sm font-bold">{p.title}</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-ink-secondary">{p.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ final CTA */}
      <section className="bg-govt-900 text-white">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="font-display text-2xl font-bold">Ready to open the workspace?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-govt-200">
            Sign in as an officer to reach the returns, the findings and the case workflow. What
            you may do is decided by your role; what you may see is decided by your jurisdiction,
            and enforced on the server.
          </p>
          <Link
            to="/sign-in"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-govtgold-400 to-govtgold-600 px-5 py-3 text-sm font-semibold text-rail-900 transition-colors"
          >
            Officer sign-in <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="bg-govt-900 text-[11px] text-govt-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 border-b border-white/10 px-6 pb-5 pt-6 sm:flex-row">
          <span>GST Intelligence · Commercial Taxes Department</span>
          <span className="hidden sm:inline">
            Built in line with GIGW, W3C and WCAG 2.1 accessibility guidance
          </span>
        </div>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 sm:flex-row">
          <span>Every figure on every screen drills to the cell it came from.</span>
          <span>No figure on this page is illustrative.</span>
        </div>
      </footer>
    </div>
  )
}
