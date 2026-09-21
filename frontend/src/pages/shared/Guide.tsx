import { useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Explain, Term } from '../../components/Explain'
import { StatusChip } from '../../components/StatusChip'

/**
 * S0 — How this works.
 *
 * Written for somebody who has not used the platform before and does not want
 * a tour of its features: what it is for, what to put into it, what comes out,
 * and what it will refuse to do. Everything on this page is checkable against
 * the platform's actual behaviour — the column names it recognises, the file
 * types it takes, the limits it enforces — because a guide that describes an
 * idealised version of the software is worse than no guide.
 */
export default function Guide(): JSX.Element {
  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <div className="mb-1 text-xs font-medium tracking-wide text-ink-muted tabular">S0</div>
        <h1 className="text-2xl font-semibold">How this works</h1>
        <p className="mt-2 text-base text-ink-secondary">
          This platform reads GST returns, checks them against the department&rsquo;s own rules,
          and shows you which businesses are worth a closer look and how much money is behind
          each one. It does the arithmetic and shows its working. It does not decide anything.
        </p>
      </header>

      <nav aria-label="On this page" className="mb-8 rounded border border-line bg-sunken p-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          On this page
        </h2>
        <ol className="grid gap-1 text-sm sm:grid-cols-2">
          {[
            ['#steps', 'The five steps, start to finish'],
            ['#feed', 'What to upload, and in what shape'],
            ['#columns', 'The columns each return needs'],
            ['#rows', 'What happens to every row'],
            ['#scores', 'The two scores, explained'],
            ['#refuse', 'What this platform will not do'],
          ].map(([href, label]) => (
            <li key={href}>
              <a className="underline decoration-dotted underline-offset-2" href={href}>
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* ---------------------------------------------------------- steps */}
      <Section id="steps" title="The five steps, start to finish">
        <p className="mb-4 text-sm text-ink-secondary">
          Nothing is hidden between these steps. Each one shows you what it did before the next
          one begins.
        </p>

        <ol className="space-y-4">
          <Step
            n={1}
            title="Upload the returns"
            to="/ingestion"
            linkLabel="Go to Upload returns"
          >
            Drop in the whole workbook &mdash; GSTR-1, GSTR-3B, GSTR-2A, GSTR-2B and the
            ledgers, every month of the year, in whatever order the sheets happen to sit. The
            platform works out what each sheet is from its name and its columns and says so on
            screen. Use <strong>Dry run</strong> first if you
            want to see what a file would do before it does it &mdash; a dry run reads the whole
            file and writes nothing. The screen then shows you the arithmetic:{' '}
            <em>rows in the file = rows read + rows held + duplicates</em>. If those do not
            balance, nothing is saved at all.
          </Step>

          <Step
            n={2}
            title="Check the numbers the rules will use"
            to="/admin"
            linkLabel="Go to Settings and thresholds"
          >
            The platform ships with 106 thresholds &mdash; percentages, limits, day counts. Until
            somebody adopts them they are marked <Term k="provisional" />, which means the
            arithmetic is right but the number it compares against is one nobody has signed. Adopt
            them, or set the ones your department has decided differently. Editing never
            overwrites: a new value applies from the date you give it, and a re-run of an earlier
            year still uses the value that was in force then.
          </Step>

          <Step n={3} title="Run the checks" to="/workbench" linkLabel="Go to My work">
            One pass applies all 34 risk flags and all 57 detection rules to everything uploaded.
            A rule that cannot run says so and names the data it needed. It never reports
            &ldquo;no issue found&rdquo; when what it means is &ldquo;I could not look&rdquo;.
          </Step>

          <Step
            n={4}
            title="Read the results"
            to="/dashboard"
            linkLabel="Go to the Dashboard"
          >
            The Dashboard is the whole State; Casework is one business at a time. Every figure on
            either can be clicked: a bar opens the businesses behind it, a total opens its
            working, and the working ends at the cell of the spreadsheet it came from. If a figure
            will not do that, treat it as a bug and say so.{' '}
            <strong>Shape of the year</strong> sits beside them and answers a different question
            &mdash; not who to audit or what to demand, but what the business actually looks like:
            where its purchases come from, what rates it declares, when it issues credit notes.
            Nothing there is a finding, and the screen says so.
          </Step>

          <Step n={5} title="Act on it" to="/workbench/cases" linkLabel="Go to Cases">
            Open a case, build the demand from the findings you accept, and draft the notice. The
            figures come from the demand, not from anyone typing. One officer drafts; a different
            officer approves; the <Term k="din" /> is minted at approval and never before. Every
            step lands in the <Term k="auditChain" />.
          </Step>
        </ol>
      </Section>

      {/* ----------------------------------------------------------- feed */}
      <Section id="feed" title="What to upload, and in what shape">
        <p className="mb-4 text-sm text-ink-secondary">
          The short version: <strong>upload the portal&rsquo;s own export, unedited</strong>. The
          platform was built to read what the portal actually produces &mdash; title blocks,
          merged headers, spacer columns, totals rows and all &mdash; rather than to demand a
          tidied file. Tidying it up is more likely to break the read than to help it.
        </p>

        <Fact label="File types">
          <code className="tabular">.xlsx</code>, <code className="tabular">.xlsm</code>,{' '}
          <code className="tabular">.xls</code> and <code className="tabular">.csv</code>. Up to
          64&nbsp;MB. One workbook may hold many sheets and many months.
        </Fact>

        <Fact label="Whose return it is">
          Type the filer&rsquo;s GSTIN into the box if you have it. If you leave it blank the
          platform reads it from the title block at the top of the sheet &mdash; the four or five
          lines above the header row that the portal writes. It only reads a GSTIN from a sparse
          line up there, never from a data row, so a customer&rsquo;s GSTIN in the first column
          can never be mistaken for the filer&rsquo;s.
        </Fact>

        <Fact label="Which month">
          Taken from the sheet name where the portal puts it &mdash;{' '}
          <code className="tabular">b2b_072025</code>,{' '}
          <code className="tabular">GSTR1_Jun2025</code> &mdash; or from a period column if the
          sheet has one. A sheet with neither has its rows held and told you so, rather than being
          filed under a guess.
        </Fact>

        <Fact label="Dates">
          Any format the file happens to use. <code className="tabular">2025-07-04</code>,{' '}
          <code className="tabular">05-07-2025</code> and a raw Excel serial like{' '}
          <code className="tabular">45845</code> are all read correctly, and all three can sit in
          the same column. The viewer shows them exactly as the file has them, because what you
          are checking is the file, not the platform&rsquo;s tidy-up of it.
        </Fact>

        <Fact label="Amounts">
          Figures in brackets are read as negative, the way accounting exports write them. A
          credit note is stored as a positive amount with its direction recorded separately, so
          it reduces the liability once rather than twice.
        </Fact>

        <Fact label="Column headings">
          They do not have to match anything exactly. The platform tries an exact match against
          several hundred known spellings &mdash; the portal&rsquo;s, Tally&rsquo;s, Busy&rsquo;s,
          ClearTax&rsquo;s, Zoho&rsquo;s &mdash; then a word-overlap match, then a
          closest-spelling match. Marathi and Hindi headings are in that list from the start. A
          heading it still cannot place is reported on screen rather than ignored.
        </Fact>

        <Fact label="What is not read yet">
          Four sheets of a filed workbook are recognised by name and have nowhere to go yet:
          GSTR-1 Table 13 (the document series), the HSN summary, the challan register and
          GSTR-7. Their rows are held and the reason says plainly that the gap is ours, not a
          fault in your file. E-way bills, e-invoices and supplier filing status are read when a
          workbook carries them. Rules that need a dataset nobody supplied report{' '}
          <Term k="notEvaluated" /> naming it. The{' '}
          <Link className="underline decoration-dotted underline-offset-2" to="/alignment">
            circular check
          </Link>{' '}
          lists exactly which flags that affects.
        </Fact>
      </Section>

      {/* -------------------------------------------------------- columns */}
      <Section id="columns" title="The columns each return needs">
        <p className="mb-3 text-sm text-ink-secondary">
          A row is read only if these can be found. Everything else is a bonus &mdash; the more
          columns present, the more rules can run. Spellings shown are examples; close variants
          are matched automatically.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-ink-muted">
                <th className="py-1.5 text-left">Return</th>
                <th className="py-1.5 text-left">Must have</th>
                <th className="py-1.5 text-left">Uses if present</th>
              </tr>
            </thead>
            <tbody>
              {NEEDS.map((row) => (
                <tr key={row.family} className="border-b border-line align-top">
                  <td className="py-2 pr-3">
                    <span className="font-medium">{row.family}</span>
                    <span className="mt-0.5 block text-xs text-ink-muted">{row.what}</span>
                  </td>
                  <td className="py-2 pr-3 text-ink-secondary">{row.must}</td>
                  <td className="py-2 text-ink-muted">{row.nice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded border border-line bg-sunken p-3">
          <h3 className="text-sm font-semibold">GSTR-3B is shaped differently</h3>
          <p className="mt-1 text-sm text-ink-secondary">
            Every other return is one row per invoice. A GSTR-3B is one row per <em>line of the
            return</em> and one column per tax head &mdash; so it is read as a table, not as a
            register. The line labels are matched to the portal&rsquo;s own numbering, which is
            what lets a notice say &ldquo;Table 3.1(a)&rdquo; and lets you find the cell it came
            from. A line that matches nothing is held individually and named, rather than the
            sheet being skipped.
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            Twenty-one of the 57 rules need a GSTR-3B. Without one, most of the platform can say
            very little.
          </p>
        </div>
      </Section>

      {/* ----------------------------------------------------------- rows */}
      <Section id="rows" title="What happens to every row">
        <p className="mb-3 text-sm text-ink-secondary">
          Every row of every sheet ends up in exactly one of three places, and the three are added
          up on screen against the number of rows in the file. Nothing is dropped quietly.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Disposition
            level="good"
            name="Read"
            body="Understood and stored. It will be used by the rules."
          />
          <Disposition
            level="warning"
            name="Held"
            body="Could not be read with confidence. Kept with the reason and the original cells, and shown to you. Fix the source or the mapping and upload again."
          />
          <Disposition
            level="unknown"
            name="Duplicate"
            body="Already present, identified by its content rather than its position. Counted, not stored twice."
          />
        </div>
        <p className="mt-3 text-sm text-ink-secondary">
          If the three do not add up to the number of rows in the file, the upload is refused
          outright. A row nobody can account for becomes a wrong figure in a notice six screens
          later.
        </p>
      </Section>

      {/* --------------------------------------------------------- scores */}
      <Section id="scores" title="The two scores, explained">
        <p className="mb-4 text-sm text-ink-secondary">
          Two numbers appear beside almost every business. They answer different questions and are
          never added together.
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="panel p-4">
            <h3 className="flex items-baseline text-base font-semibold">
              P-Score
              <Explain term="pScore" />
            </h3>
            <p className="mt-0.5 text-sm font-medium text-ink-secondary">
              Who should we look at?
            </p>
            <p className="mt-2 text-sm text-ink-secondary">
              A number between 0 and 1, built from the department&rsquo;s 34 risk flags. Each flag
              is scored 0 to 4 &mdash; 0 meaning tested and clear, 4 meaning seriously adverse
              &mdash; and the P-Score is the weighted average of the flags that could actually be
              tested.
            </p>
            <p className="mt-2 text-sm text-ink-secondary">
              It is a way of sorting a list. It is not evidence, and it never appears in a notice.
            </p>
            <p className="mt-2 rounded bg-sunken p-2 text-sm">
              <strong>Always read it with its coverage.</strong> &ldquo;0.7 over 3 flags&rdquo;
              and &ldquo;0.7 over 30 flags&rdquo; are not the same claim, so the coverage is
              printed beside the score every single time.
            </p>
          </article>

          <article className="panel p-4">
            <h3 className="flex items-baseline text-base font-semibold">
              F-Score
              <Explain term="fScore" />
            </h3>
            <p className="mt-0.5 text-sm font-medium text-ink-secondary">
              What can we demand, and on what evidence?
            </p>
            <p className="mt-2 text-sm text-ink-secondary">
              Built from the 57 detection rules. Each one compares one declared figure with
              another and reports the difference in rupees, split head by head, with the source
              rows attached and the formula shown as it was executed.
            </p>
            <p className="mt-2 text-sm text-ink-secondary">
              This is the side that can go into a notice, because every figure on it can be traced
              to a cell in a spreadsheet somebody filed.
            </p>
            <p className="mt-2 rounded bg-sunken p-2 text-sm">
              A business can score high on risk and owe nothing. Another can owe a great deal
              through a clerical slip and be no risk at all. That is why there are two numbers.
            </p>
          </article>
        </div>

        <div className="mt-4 rounded border border-line p-4">
          <h3 className="flex items-baseline text-base font-semibold">
            The flag ladder
            <Explain term="flag" />
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {LADDER.map((rung) => (
              <li key={rung.flag} className="flex items-baseline gap-3">
                <StatusChip level={rung.level} label={`Flag ${String(rung.flag)}`} />
                <span className="text-ink-secondary">{rung.meaning}</span>
              </li>
            ))}
            <li className="flex items-baseline gap-3">
              <StatusChip level="unknown" label="Not evaluated" />
              <span className="text-ink-secondary">
                The test could not be run, and the screen names the data that was missing. This is
                not a zero: it is left out of the score on both sides, and coverage falls instead.
              </span>
            </li>
          </ul>
        </div>
      </Section>

      {/* -------------------------------------------------------- refusal */}
      <Section id="refuse" title="What this platform will not do">
        <ul className="space-y-3">
          {REFUSALS.map((item) => (
            <li key={item.title} className="panel p-3">
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-ink-secondary">{item.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-secondary">
          These are not limitations to be engineered away later. Output from this platform is used
          to issue notices that create legal liability, and each of the above is the difference
          between a figure that survives an appeal and one that does not.
        </p>
      </Section>
    </div>
  )
}

/* --------------------------------------------------------------- pieces */

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}): JSX.Element {
  return (
    <section id={id} className="mb-10 scroll-mt-20">
      <h2 className="mb-3 border-b border-line pb-1 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Step({
  n,
  title,
  to,
  linkLabel,
  children,
}: {
  n: number
  title: string
  to: string
  linkLabel: string
  children: ReactNode
}): JSX.Element {
  return (
    <li className="flex gap-4">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-sm font-semibold tabular"
      >
        {n}
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-ink-secondary">{children}</p>
        <Link
          to={to}
          className="mt-1.5 inline-block text-sm underline decoration-dotted underline-offset-2"
        >
          {linkLabel} &rarr;
        </Link>
      </div>
    </li>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-line py-2.5">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current)
        }}
        aria-expanded={open}
        className="flex w-full items-baseline gap-2 text-left"
      >
        <span aria-hidden="true" className="w-3 shrink-0 text-xs text-ink-muted">
          {open ? '−' : '+'}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </button>
      {open && <p className="ml-5 mt-1.5 text-sm text-ink-secondary">{children}</p>}
    </div>
  )
}

function Disposition({
  level,
  name,
  body,
}: {
  level: 'good' | 'warning' | 'unknown'
  name: string
  body: string
}): JSX.Element {
  return (
    <article className="panel p-3">
      <StatusChip level={level} label={name} />
      <p className="mt-2 text-sm text-ink-secondary">{body}</p>
    </article>
  )
}

/* ----------------------------------------------------------------- data */

interface Need {
  family: string
  what: string
  must: string
  nice: string
}

/** Mirrors `_REQUIRED` in `app/ingestion/pipeline.py`. */
const NEEDS: readonly Need[] = [
  {
    family: 'GSTR-1',
    what: 'Sales, invoice by invoice',
    must: 'Filer GSTIN, period, taxable value',
    nice: 'Customer GSTIN and name, invoice number and date, invoice value, place of supply, rate, IGST / CGST / SGST / Cess, HSN, quantity, reverse charge, invoice type, IRN',
  },
  {
    family: 'GSTR-3B',
    what: 'The monthly summary return',
    must: 'Filer GSTIN, period',
    nice: 'Every line of Tables 3.1, 4 and 6.1, one column per tax head',
  },
  {
    family: 'GSTR-2B',
    what: 'Credit the suppliers reported',
    must: 'Filer GSTIN, period, supplier GSTIN, taxable value',
    nice: 'Supplier name, ITC availability and the reason it is not available, supplier filing period and date, IMS action',
  },
  {
    family: 'E-way bills',
    what: 'Goods in transit',
    must: 'Filer GSTIN, e-way bill number',
    nice: 'Vehicle, distance, consignor and consignee, validity, Part-B',
  },
  {
    family: 'Ledgers',
    what: 'Cash and credit balances',
    must: 'Filer GSTIN, date, head',
    nice: 'Opening and closing balance, credits and debits',
  },
  {
    family: 'E-invoices',
    what: 'Invoice registration',
    must: 'Filer GSTIN, IRN',
    nice: 'Acknowledgement number and date, invoice number, taxable value',
  },
]

const LADDER: readonly {
  flag: number
  level: 'good' | 'warning' | 'serious' | 'critical'
  meaning: string
}[] = [
  { flag: 0, level: 'good', meaning: 'Tested. Nothing adverse found.' },
  { flag: 1, level: 'warning', meaning: 'Slightly out of line with comparable businesses.' },
  { flag: 2, level: 'warning', meaning: 'Clearly out of line, and worth an explanation.' },
  { flag: 3, level: 'serious', meaning: 'Well outside the range. Plan the audit around it.' },
  { flag: 4, level: 'critical', meaning: 'Seriously adverse. The circular asks for intense scrutiny.' },
]

const REFUSALS: readonly { title: string; body: string }[] = [
  {
    title: 'It will not invent a number',
    body: 'If a rate, a due date, a form number or a threshold is not in the department’s own material, the rule does not run and the gap is listed on the Settings screen for somebody to resolve. A plausible guess in a notice is worse than an empty screen.',
  },
  {
    title: 'It will not let a language model do arithmetic',
    body: 'Every rupee, ratio and day count comes from ordinary code working in exact decimals. The assistant drafts text and finds documents; it never produces a figure, and a draft whose numbers do not match the demand exactly is refused rather than corrected.',
  },
  {
    title: 'It will not add IGST, CGST and SGST together',
    body: 'They go to different governments and are demanded in different columns. A single total would have to be split again later, and the split would be a guess.',
  },
  {
    title: 'It will not call an untested flag "clear"',
    body: 'A flag that could not be tested is left out of the score entirely, and the coverage figure falls. Counting it as clear would make a high score look like a clean bill of health.',
  },
  {
    title: 'It will not let you approve your own draft',
    body: 'The officer who drafts a notice and the officer who approves it must be different people. There is no setting for this.',
  },
  {
    title: 'It will not show a figure it cannot explain',
    body: 'Every number carries a route back to the cell of the spreadsheet it came from. One that does not is treated as a defect.',
  },
]
