'use client';

import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Database,
  GitCompare,
  Scale,
  SlidersHorizontal,
  Waypoints,
} from 'lucide-react';

const principles = [
  {
    number: '01',
    title: 'Baseline before bold claims',
    text: 'A finance-only reference stays visible beside every climate-enriched comparison.',
    icon: Scale,
  },
  {
    number: '02',
    title: 'Uncertainty travels with the result',
    text: 'Intervals, coverage, and limitations live next to the estimate—not in a footnote.',
    icon: Waypoints,
  },
  {
    number: '03',
    title: 'No output without a source',
    text: 'A clean empty state is more useful than a convincing number with no provenance.',
    icon: Database,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="border-border/80 bg-background/90 border-b">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="AgRiX home">
            <div className="flex h-9 w-9 items-center justify-center border border-primary bg-primary text-surface">
              <span className="font-serif text-lg">A</span>
            </div>
            <div>
              <p className="font-serif text-lg leading-none text-text">AgRiX</p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-text-light">
                season / credit / evidence
              </p>
            </div>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-7" aria-label="Primary navigation">
            <Link
              href="#instrument"
              className="hidden text-body-sm text-text-muted hover:text-text sm:block"
            >
              The instrument
            </Link>
            <Link
              href="#method"
              className="hidden text-body-sm text-text-muted hover:text-text sm:block"
            >
              Method
            </Link>
            <Link
              href="/dashboard"
              className="btn-raised btn-primary inline-flex items-center gap-2 text-body-sm"
            >
              Open workspace <ArrowUpRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:pb-28 lg:pt-24">
          <div className="flex flex-col justify-center">
            <p className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
              <span className="h-px w-8 bg-primary" /> agricultural finance / research instrument
            </p>
            <h1 className="max-w-3xl font-serif text-[clamp(3.2rem,7vw,6.7rem)] leading-[0.94] tracking-[-0.055em] text-text">
              Stress-test the season, <em className="text-primary">not just the borrower.</em>
            </h1>
            <p className="mt-8 max-w-xl text-body-lg text-text-muted">
              AgRiX keeps a finance-only baseline beside climate and yield evidence, then shows how
              much the credit picture moves when the growing season shifts.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="btn-raised btn-primary inline-flex items-center gap-2 px-5 py-3"
              >
                Enter the season lens <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#method"
                className="btn-raised btn-secondary inline-flex items-center gap-2 px-5 py-3"
              >
                How it works <BookOpen className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-light">
              No fabricated metrics · no black-box approvals · source first
            </p>
          </div>

          <CounterfactualCard />
        </section>

        <section className="bg-surface/60 border-y border-border" id="instrument">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="eyebrow">Why this exists</p>
                <h2 className="mt-3 max-w-2xl font-serif text-display-md text-text">
                  A small, opinionated instrument for a messy decision.
                </h2>
              </div>
              <p className="max-w-sm text-body-sm text-text-muted">
                The novelty is the workflow: one loan, several plausible seasons, and a traceable
                comparison instead of a single confident score.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
              {principles.map(({ number, title, text, icon: Icon }) => (
                <article key={number} className="bg-surface-elevated p-6 lg:p-8">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-text-light">{number}</span>
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mt-14 max-w-[15rem] font-serif text-heading-md text-text">
                    {title}
                  </h3>
                  <p className="mt-3 text-body-sm text-text-muted">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24" id="method">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="eyebrow">The method</p>
              <h2 className="mt-3 font-serif text-display-md text-text">
                Make the evidence legible.
              </h2>
              <p className="mt-5 text-body text-text-muted">
                AgRiX is deliberately unfinished until its sources are verified. The interface is
                built to make that constraint useful: it shows what is ready, what is missing, and
                what would be needed before a result can be interpreted.
              </p>
              <Link
                href="/research"
                className="mt-7 inline-flex items-center gap-2 text-body-sm font-medium text-primary hover:text-primary-hover"
              >
                Read research readiness <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-border border-y border-border">
              <MethodRow
                number="01"
                title="Admit a source"
                text="Register a public snapshot, its coverage, license, and checksum."
                icon={Database}
              />
              <MethodRow
                number="02"
                title="Bend the season"
                text="Compare a finance-only reference with climate and yield features under a defined stress."
                icon={SlidersHorizontal}
              />
              <MethodRow
                number="03"
                title="Keep the receipt"
                text="Save the interval, validation split, model version, and limitations with every result."
                icon={GitCompare}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-primary px-5 py-8 text-surface sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="font-serif text-lg">AgRiX</p>
          <p className="text-surface/60 font-mono text-[10px] uppercase tracking-[0.18em]">
            uncertainty-aware agricultural credit research
          </p>
        </div>
      </footer>
    </div>
  );
}

function CounterfactualCard() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] self-center">
      <div
        className="bg-primary/20 absolute -left-3 top-8 h-20 w-1 border-y border-primary"
        aria-hidden="true"
      />
      <div className="instrument-card p-5 sm:p-7">
        <div className="flex items-start justify-between border-b border-border pb-5">
          <div>
            <p className="eyebrow">AgRiX / 01</p>
            <h2 className="mt-2 font-serif text-heading-lg text-text">Counterfactual season</h2>
          </div>
          <span className="border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-light">
            concept
          </span>
        </div>
        <div className="py-7">
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-text-light">
            <span>Observed</span>
            <span>Stress path</span>
          </div>
          <div
            className="season-rail"
            aria-label="Illustration of a season changing from observed to stress path"
          >
            <span className="season-rail__line" />
            <span className="season-rail__mark season-rail__mark--active" />
            <span className="season-rail__mark season-rail__mark--mid" />
            <span className="season-rail__mark season-rail__mark--end" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center font-mono text-[10px] uppercase tracking-wider text-text-light">
            <span>finance</span>
            <span>climate</span>
            <span>yield</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="paper-note">
            <p className="eyebrow">What changes</p>
            <p className="mt-2 text-body-sm text-text">
              A defined weather path and its effect on the evidence.
            </p>
          </div>
          <div className="paper-note paper-note--dark">
            <p className="eyebrow text-surface/60">What stays attached</p>
            <p className="mt-2 text-body-sm text-surface">
              The interval, source, split, and limitation.
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-wider text-risk-moderate">
          <span className="h-2 w-2 rounded-full bg-risk-moderate" />
          No verified dataset loaded — readout locked
        </div>
      </div>
    </div>
  );
}

function MethodRow({
  number,
  title,
  text,
  icon: Icon,
}: {
  number: string;
  title: string;
  text: string;
  icon: typeof Database;
}) {
  return (
    <div className="flex gap-5 py-6 sm:gap-8 sm:py-7">
      <span className="pt-1 font-mono text-xs text-text-light">{number}</span>
      <Icon className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <div>
        <h3 className="font-serif text-heading-sm text-text">{title}</h3>
        <p className="mt-1 text-body-sm text-text-muted">{text}</p>
      </div>
      <Check className="ml-auto mt-1 hidden h-4 w-4 text-primary sm:block" aria-hidden="true" />
    </div>
  );
}
