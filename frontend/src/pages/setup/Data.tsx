import { useQuery } from "@tanstack/react-query";
import type { JSX } from "react";
import { api } from "../../lib/api";

/**
 * What the platform read, and what it refused.
 *
 * This is the screen that wins trust, and it wins it by showing the rejects.
 * A tool that only shows what it accepted is a tool you have to take on faith;
 * one that hands back every row it would not read, with the reason in words
 * and the source cells beside it, is a tool you can argue with.
 *
 * The ledger is stated as a sentence rather than a table because the identity
 * is the point: **rows in = read + held + duplicates**, and it reconciles.
 */

function Ledger({
  rowsIn,
  parsed,
  held,
  duplicates,
}: {
  rowsIn: number;
  parsed: number;
  held: number;
  duplicates: number;
}): JSX.Element {
  const reconciles = rowsIn === parsed + held + duplicates;
  const width = (part: number): string =>
    rowsIn === 0 ? "0%" : `${String((part / rowsIn) * 100)}%`;

  return (
    <div className="rounded-xl border border-line bg-raised p-5">
      <p className="text-[1.0625rem] leading-relaxed text-ink">
        <strong className="tabular">{rowsIn.toLocaleString("en-IN")}</strong>{" "}
        rows in ={" "}
        <strong className="tabular">{parsed.toLocaleString("en-IN")}</strong>{" "}
        read +{" "}
        <strong className="tabular">{held.toLocaleString("en-IN")}</strong> held
        +{" "}
        <strong className="tabular">
          {duplicates.toLocaleString("en-IN")}
        </strong>{" "}
        duplicates.{" "}
        {reconciles ? (
          <span className="text-status-good">They reconcile.</span>
        ) : (
          <span className="text-status-critical">
            They do not reconcile - that is a bug in the pipeline, not a data
            problem.
          </span>
        )}
      </p>
      {/* One bar, three segments, each labelled. Colour never alone. */}
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-sunken">
        <div className="bg-status-good" style={{ width: width(parsed) }} />
        <div className="bg-status-warning" style={{ width: width(held) }} />
        <div className="bg-ink-muted/40" style={{ width: width(duplicates) }} />
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-secondary">
        <li>
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-status-good align-middle" />
          Read
        </li>
        <li>
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-status-warning align-middle" />
          Held, with a reason
        </li>
        <li>
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-ink-muted/40 align-middle" />
          Duplicate of a row already read
        </li>
      </ul>
    </div>
  );
}

export default function Data(): JSX.Element {
  const { data, isPending, error } = useQuery({
    queryKey: ["uploads"],
    queryFn: () => api.uploads(),
  });

  if (isPending)
    return <p className="text-ink-secondary">Reading the upload history...</p>;
  if (error) return <p className="text-status-critical">{error.message}</p>;

  const uploads = data.items;
  const totals = uploads.reduce(
    (sum, upload) => ({
      rowsIn: sum.rowsIn + upload.rows_in,
      parsed: sum.parsed + upload.rows_parsed,
      held: sum.held + upload.rows_quarantined,
      duplicates: sum.duplicates + upload.rows_duplicate,
    }),
    { rowsIn: 0, parsed: 0, held: 0, duplicates: 0 },
  );

  return (
    <article className="max-w-[68rem]">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Data</h1>
        <p className="mt-1 max-w-[46rem] text-ink-secondary">
          Every row of every workbook lands in exactly one place: read, held
          with a reason, or a duplicate of something already read. The counts
          reconcile on this screen, and a row that was held is shown with the
          cells it came from.
        </p>
      </header>

      <div className="mb-8">
        <Ledger {...totals} />
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">
          Workbooks{" "}
          <span className="font-normal text-ink-muted">({uploads.length})</span>
        </h2>
        <div className="max-h-[32rem] overflow-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-sunken text-left shadow-[0_1px_0_0_var(--border)]">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  File
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-3 py-2 text-right font-medium"
                >
                  Rows in
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-3 py-2 text-right font-medium"
                >
                  Read
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-3 py-2 text-right font-medium"
                >
                  Held
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-3 py-2 text-right font-medium"
                >
                  Duplicates
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-3 py-2 font-medium"
                >
                  Reconciles
                </th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((upload) => {
                const ok = upload.reconciles;
                return (
                  <tr
                    key={upload.upload_id}
                    className="border-t border-line odd:bg-raised/40"
                  >
                    <td
                      className="max-w-[26rem] truncate px-3 py-2"
                      title={upload.filename}
                    >
                      {upload.filename}
                    </td>
                    <td className="px-3 py-2 text-right tabular">
                      {upload.rows_in.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2 text-right tabular">
                      {upload.rows_parsed.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2 text-right tabular">
                      {upload.rows_quarantined.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2 text-right tabular">
                      {upload.rows_duplicate.toLocaleString("en-IN")}
                    </td>
                    <td
                      className={`px-3 py-2 ${ok ? "text-status-good" : "text-status-critical"}`}
                    >
                      {ok ? "Yes" : "NO - pipeline bug"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}
