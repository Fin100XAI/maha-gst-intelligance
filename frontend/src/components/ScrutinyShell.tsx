import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Lock } from "lucide-react";
import type { JSX } from "react";
import { NavLink, Outlet, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import type { ReportListing } from "../lib/reports";
import { Masthead } from "./layout/Masthead";

/**
 * One rail, and the categories live in it.
 *
 * The first version put the categories on a screen: you clicked Scrutiny,
 * landed on an index that showed "Reconciliation" and "Pattern" as headings,
 * and clicked again to reach a report. That is a screen whose only content is
 * a menu, and a menu belongs in the rail.
 *
 * So the rail carries the whole structure and every destination is one click.
 * Nothing is hidden behind a landing page, and an officer can see the shape of
 * what the platform does without navigating anywhere.
 *
 * **What cannot run is still listed.** It would be tidier to show only the
 * reports that work. It would also leave an officer unable to answer the one
 * question a missing report raises - *what do I ask the taxpayer for?* - so
 * the locked ones sit at the bottom, greyed, each naming the sheet it waits
 * on.
 */

const SETUP = [
  {
    to: "/setup/data",
    label: "Data",
    hint: "What was read, and what was held",
  },
  { to: "/setup/reference", label: "Reference", hint: "Thresholds and checks" },
] as const;

function Rail({
  children,
  title,
}: {
  title: string;
  children: JSX.Element;
}): JSX.Element {
  return (
    <div className="mb-6">
      <h2 className="mb-2 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Item({
  to,
  label,
  hint,
}: {
  to: string;
  label: string;
  hint?: string;
}): JSX.Element {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          clsx(
            "block rounded-md px-3 py-2 text-sm leading-tight transition",
            isActive
              ? "bg-raised font-semibold text-ink shadow-[inset_2px_0_0_0_var(--navy)]"
              : "text-ink-secondary hover:bg-raised/60 hover:text-ink",
          )
        }
      >
        {label}
        {hint !== undefined && (
          <span className="mt-0.5 block text-xs text-ink-muted">{hint}</span>
        )}
      </NavLink>
    </li>
  );
}

export function ScrutinyShell(): JSX.Element {
  const [params] = useSearchParams();
  const query = params.toString();
  const suffix = query === "" ? "" : `?${query}`;
  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: () => api.reports(),
  });

  const groups = new Map<string, ReportListing[]>();
  const locked: ReportListing[] = [];
  for (const report of data?.reports ?? []) {
    if (report.available) {
      const bucket = groups.get(report.group) ?? [];
      bucket.push(report);
      groups.set(report.group, bucket);
    } else {
      locked.push(report);
    }
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <Masthead onOpenNav={() => undefined}>{null}</Masthead>
      <div className="mx-auto flex max-w-[1240px] gap-8 px-6 py-8">
        <nav aria-label="Sections" className="w-60 shrink-0">
          <Rail title="Setup & reference">
            <ul className="space-y-0.5">
              {SETUP.map((item) => (
                <Item
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  hint={item.hint}
                />
              ))}
            </ul>
          </Rail>

          <Rail title="Scrutiny">
            <ul className="space-y-0.5">
              <Item
                to={`/scrutiny/taxpayer${suffix}`}
                label="Taxpayer"
                hint="The year, check by check"
              />
            </ul>
          </Rail>

          {[...groups.entries()].map(([group, reports]) => (
            <Rail key={group} title={group}>
              <ul className="space-y-0.5">
                {reports.map((report) => (
                  <Item
                    key={report.id}
                    to={`/scrutiny/report/${report.id}${suffix}`}
                    label={report.title}
                  />
                ))}
              </ul>
            </Rail>
          ))}

          {locked.length > 0 && (
            <Rail title={`Not available yet (${String(locked.length)})`}>
              <ul className="space-y-0.5">
                {locked.map((report) => (
                  <li
                    key={report.id}
                    className="flex items-start gap-2 px-3 py-2 text-sm leading-tight text-ink-muted"
                    title={`Waiting on: ${report.needs ?? "an external dataset"}`}
                  >
                    <Lock aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{report.title}</span>
                  </li>
                ))}
              </ul>
            </Rail>
          )}
        </nav>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
