import { useQuery } from "@tanstack/react-query";
import type { JSX } from "react";
import { api } from "../../lib/api";

/**
 * Where the numbers in the rules come from.
 *
 * An officer asked *"why thirty days?"* should get an answer with a citation,
 * not a shrug about how the software works. Every threshold the engine uses is
 * a row someone adopted, effective-dated, with the notification beside it - so
 * changing one is data entry and a signature, never a pull request.
 *
 * The check catalogue sits beside it because the two answer the same question
 * from opposite ends: what does this platform look for, and on what authority.
 */

export default function Reference(): JSX.Element {
  const rules = useQuery({
    queryKey: ["libraryRules"],
    queryFn: () => api.libraryRules(),
  });

  if (rules.isPending)
    return <p className="text-ink-secondary">Loading the catalogue...</p>;
  if (rules.error)
    return <p className="text-status-critical">{rules.error.message}</p>;

  const byFamily = new Map<string, typeof rules.data.items>();
  for (const rule of rules.data.items) {
    const bucket = byFamily.get(rule.family) ?? [];
    bucket.push(rule);
    byFamily.set(rule.family, bucket);
  }

  return (
    <article className="max-w-[68rem]">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Reference</h1>
        <p className="mt-1 max-w-[46rem] text-ink-secondary">
          Every check the platform runs, what it is allowed to conclude, and the
          provision it rests on. A finding an officer cannot trace to a
          provision is a finding they cannot act on, so the legal basis is not
          optional here - a check cannot be registered without one.
        </p>
      </header>

      <p className="mb-6 text-sm text-ink-secondary">
        <strong className="tabular text-ink">{rules.data.count}</strong> checks
        across <strong className="tabular text-ink">{byFamily.size}</strong>{" "}
        families.
      </p>

      {[...byFamily.entries()].map(([family, items]) => (
        <section key={family} className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            {family}{" "}
            <span className="font-normal normal-case">({items.length})</span>
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {items.map((rule) => (
              <li key={rule.rule_id} className="bg-raised px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-xs text-ink-muted tabular">
                    {rule.rule_id}
                  </span>
                  <span className="font-medium text-ink">{rule.title}</span>
                  <span className="text-xs uppercase tracking-wide text-ink-muted">
                    {rule.severity} · {rule.confidence}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-secondary">
                  {rule.legal_basis}
                </p>
                {rule.threshold_note !== null && (
                  <p className="mt-1 text-xs text-ink-muted">
                    Fires when: {rule.threshold_note}
                  </p>
                )}
                {rule.requires.length > 0 && (
                  <p className="mt-1 text-xs text-ink-muted">
                    Needs: {rule.requires.join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}
