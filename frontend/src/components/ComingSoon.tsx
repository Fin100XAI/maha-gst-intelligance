import type { JSX } from 'react'
import { useI18n } from '../i18n'
import { StatusChip } from './StatusChip'

/**
 * A coming-soon module is a real routed screen -- docs/03 section 7.
 *
 * Status chip, described capability, stated data dependency, roadmap reference,
 * and the parameters it unlocks, which is what turns a roadmap slide into a
 * budget conversation.  Its API returns 501.
 *
 * **No fabricated data, ever.**  This component renders no figures and accepts
 * none, so there is nothing here that could be mistaken for a result.
 */
export interface ComingSoonProps {
  title: string
  status: string
  eta?: string
  capability: string
  dependency: string
  roadmapRef: string
  unlocks?: readonly string[]
}

export function ComingSoon({
  title,
  status,
  eta,
  capability,
  dependency,
  roadmapRef,
  unlocks = [],
}: ComingSoonProps): JSX.Element {
  const { t } = useI18n()

  return (
    <section className="max-w-3xl" aria-labelledby="coming-soon-title">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 id="coming-soon-title" className="text-xl font-semibold">
          {title}
        </h1>
        <StatusChip
          level="unknown"
          label={eta === undefined ? status : `${status} · ${eta}`}
          title={t('comingSoon.title')}
        />
      </div>

      <dl className="grid gap-x-6 gap-y-3 border-t border-line pt-4 sm:grid-cols-[12rem_1fr]">
        <dt className="text-sm text-ink-secondary">{t('comingSoon.capability')}</dt>
        <dd className="text-base">{capability}</dd>

        <dt className="text-sm text-ink-secondary">{t('comingSoon.dependency')}</dt>
        <dd className="text-base">{dependency}</dd>

        <dt className="text-sm text-ink-secondary">{t('comingSoon.roadmap')}</dt>
        <dd className="text-base tabular">{roadmapRef}</dd>

        {unlocks.length > 0 && (
          <>
            <dt className="text-sm text-ink-secondary">{t('comingSoon.unlocks')}</dt>
            <dd className="flex flex-wrap gap-1.5">
              {unlocks.map((parameter) => (
                <span
                  key={parameter}
                  className="rounded border border-line-strong px-1.5 py-0.5 text-xs tabular"
                >
                  {parameter}
                </span>
              ))}
            </dd>
          </>
        )}
      </dl>

      <p className="mt-6 border-l-2 border-line-strong pl-3 text-sm text-ink-muted">
        {t('comingSoon.noData')}
      </p>
    </section>
  )
}
