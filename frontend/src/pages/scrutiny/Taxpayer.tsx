import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  MinusCircle,
} from "lucide-react";
import type { JSX } from "react";
import { useSearchParams } from "react-router-dom";
import { Money } from "../../components/Money";
import { api } from "../../lib/api";
import type {
  Scorecard,
  ScorecardCell,
  ScorecardMonth,
} from "../../lib/reports";

/**
 * One taxpayer's year, in one screen.
 *
 * The grid is the point. Twelve periods across, check families down, one cell
 * per intersection - an officer sees a whole year of compliance in a glance
 * and clicks the red one. `docs/08` calls it the single most useful object on
 * the platform, and the engine has returned the cards it is built from since
 * the scorecard was written without anything ever rendering them.
 *
 * **Four states, and the fourth is the one that matters.** Pass, fail, needs a
 * document, and *could not check*. The last is grey with a dashed edge and is
 * never allowed to look like a pass: a check that could not run and a check
 * that ran and found nothing are different answers, and a platform that draws
 * them the same way is lying quietly.
 *
 * Colour never carries meaning alone. Every cell has an icon and every legend
 * entry has a word.
 */

const STATE: Record<
  string,
  { icon: JSX.Element; label: string; cell: string; text: string }
> = {
  PASS: {
    icon: <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />,
    label: "Agrees",
    cell: "bg-status-good/15 border-status-good/40",
    text: "text-status-good",
  },
  FAIL: {
    icon: <AlertTriangle aria-hidden className="h-3.5 w-3.5" />,
    label: "Differs",
    cell: "bg-status-critical/15 border-status-critical/50",
    text: "text-status-critical",
  },
  NEEDS_DOCUMENT: {
    icon: <CircleHelp aria-hidden className="h-3.5 w-3.5" />,
    label: "Needs a document",
    cell: "bg-status-warning/15 border-status-warning/40",
    text: "text-status-warning",
  },
  NOT_EVALUATED: {
    icon: <MinusCircle aria-hidden className="h-3.5 w-3.5" />,
    label: "Could not check",
    cell: "border-dashed border-line bg-sunken/50",
    text: "text-ink-muted",
  },
};

/** The family a check belongs to, from its id. `ITC-01` is `ITC`. */
function familyOf(checkId: string): string {
  return checkId.split("-")[0] ?? checkId;
}

/** The worst thing said about this family in this period. */
function worst(cells: readonly ScorecardCell[]): string {
  if (cells.some((c) => c.status === "FAIL")) return "FAIL";
  if (cells.some((c) => c.status === "NEEDS_DOCUMENT")) return "NEEDS_DOCUMENT";
  if (cells.some((c) => c.status === "PASS")) return "PASS";
  return "NOT_EVALUATED";
}

function Grid({ months }: { months: readonly ScorecardMonth[] }): JSX.Element {
  const families = [
    ...new Set(months.flatMap((m) => m.cells.map((c) => familyOf(c.check_id)))),
  ].sort();

  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-xs">
        <caption className="sr-only">
          Check families down, tax periods across. Each cell is the worst
          outcome in that family for that period.
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="px-2 py-1 text-left font-medium text-ink-muted"
            >
              Family
            </th>
            {months.map((month) => (
              <th
                key={month.period}
                scope="col"
                className="px-1 py-1 text-center font-medium text-ink-muted tabular"
              >
                {month.period.slice(0, 2)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {families.map((family) => (
            <tr key={family}>
              <th
                scope="row"
                className="whitespace-nowrap px-2 py-1 text-left font-medium"
              >
                {family}
              </th>
              {months.map((month) => {
                const cells = month.cells.filter(
                  (c) => familyOf(c.check_id) === family,
                );
                const state = STATE[worst(cells)] ?? STATE["NOT_EVALUATED"];
                const fails = cells.filter((c) => c.status === "FAIL").length;
                return (
                  <td key={month.period} className="p-0">
                    <div
                      className={`flex h-7 w-9 items-center justify-center rounded border ${state?.cell ?? ""} ${state?.text ?? ""}`}
                      title={`${family} · ${month.period} · ${state?.label ?? ""}${
                        fails > 0 ? ` (${String(fails)} failing)` : ""
                      }`}
                    >
                      {state?.icon}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        {Object.entries(STATE).map(([key, state]) => (
          <li key={key} className={`flex items-center gap-1.5 ${state.text}`}>
            {state.icon}
            {state.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Score({
  title,
  value,
  question,
  note,
}: {
  title: string;
  value: string;
  question: string;
  note: string;
}): JSX.Element {
  return (
    <div className="rounded-xl border border-line bg-raised p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {title}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular text-ink">{value}</p>
      <p className="mt-1 text-sm text-ink-secondary">{question}</p>
      <p className="mt-2 text-xs text-ink-muted">{note}</p>
    </div>
  );
}

export default function Taxpayer(): JSX.Element {
  const [params] = useSearchParams();
  const gstin = params.get("gstin") ?? "";
  const snapshotId = params.get("snapshot") ?? "";

  const { data, isPending, error } = useQuery<Scorecard>({
    queryKey: ["scorecard", gstin, snapshotId],
    queryFn: () => api.scorecard(gstin, snapshotId),
    enabled: gstin !== "" && snapshotId !== "",
  });

  if (gstin === "" || snapshotId === "")
    return <p className="text-ink-secondary">No taxpayer selected.</p>;
  if (isPending)
    return <p className="text-ink-secondary">Running the checks...</p>;
  if (error) return <p className="text-status-critical">{error.message}</p>;

  const triggered = data.findings.filter((f) => f.status === "TRIGGERED");
  const dark = data.findings.filter((f) => f.status === "NOT_EVALUATED");

  return (
    <article className="max-w-[68rem]">
      <header className="mb-6">
        <p className="text-sm text-ink-muted tabular">
          {data.gstin} · {data.fy}
        </p>
        <h1 className="text-xl font-semibold text-ink">
          {data.legal_name ?? data.gstin}
        </h1>
      </header>

      {/* The two scores, side by side, never fused. */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Score
          title="Audit risk"
          value={data.p_score.p_score}
          question="Who should we audit?"
          note={data.p_score.coverage_sentence}
        />
        <Score
          title="Findings"
          value={data.f_score.f_score}
          question="What can we demand, and on what evidence?"
          note="Built only from checks that produce a rupee figure from the returns themselves. A document call never moves it."
        />
      </div>

      <section className="mb-8">
        <h2 className="mb-1 text-base font-semibold text-ink">
          The year, check by check
        </h2>
        <p className="mb-3 max-w-[46rem] text-sm text-ink-secondary">
          Each square is one family of checks in one month. Hover for what it
          says. Grey with a dashed edge means the platform could not check -
          which is not the same as nothing being wrong.
        </p>
        <Grid months={data.months} />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-ink">
          What was found{" "}
          <span className="font-normal text-ink-muted">
            ({triggered.length})
          </span>
        </h2>
        <ul className="space-y-3">
          {triggered.map((finding) => (
            <li
              key={finding.rule_id}
              className="rounded-xl border border-line bg-raised p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="text-lg font-semibold tabular">
                  <Money value={finding.delta_total} calcId={finding.calc_id} />
                </span>
                <span className="text-xs uppercase tracking-wide text-ink-muted">
                  {finding.rule_id} · {finding.confidence}
                </span>
              </div>
              <p className="mt-1 font-medium text-ink">{finding.title}</p>
              {finding.narrative !== null && (
                <p className="mt-2 max-w-[52rem] text-sm leading-relaxed text-ink-secondary">
                  {finding.narrative}
                </p>
              )}
              <p className="mt-2 text-xs text-ink-muted">
                {finding.legal_basis}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-ink">
          What could not be checked{" "}
          <span className="font-normal text-ink-muted">({dark.length})</span>
        </h2>
        <p className="mb-3 max-w-[46rem] text-sm text-ink-secondary">
          Each one names the sheet or feed that would answer it. This list is
          the argument for what to connect next.
        </p>
        <ul className="space-y-1.5">
          {dark.map((finding) => (
            <li
              key={finding.rule_id}
              className="flex flex-wrap items-baseline gap-x-2 rounded-lg border border-dashed border-line bg-sunken/40 px-3 py-2 text-sm"
            >
              <span className="text-xs text-ink-muted tabular">
                {finding.rule_id}
              </span>
              <span className="text-ink-secondary">{finding.title}</span>
              <span className="text-xs text-ink-muted">
                — waiting on {finding.missing_inputs.join(", ")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
