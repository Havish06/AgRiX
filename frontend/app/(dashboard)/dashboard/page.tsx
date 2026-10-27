'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CloudSun,
  Database,
  FlaskConical,
  LineChart,
  ShieldCheck,
} from 'lucide-react';
import { useDatasets, useExperiments, useHealth } from '@/lib/api/hooks';

const workbench = [
  {
    name: 'Admit a dataset',
    href: '/analysis',
    icon: Database,
    text: 'Check shape, missingness, and duplicates before analysis.',
  },
  {
    name: 'Bend the season',
    href: '/scenarios',
    icon: CloudSun,
    text: 'Set a defined climate path for a later simulation.',
  },
  {
    name: 'Read the interval',
    href: '/forecast',
    icon: LineChart,
    text: 'Review forecasts only after a verified source is present.',
  },
  {
    name: 'Compare the evidence',
    href: '/model-lab',
    icon: FlaskConical,
    text: 'Keep the baseline and enriched model side by side.',
  },
];

export default function DashboardPage() {
  const health = useHealth();
  const datasets = useDatasets();
  const experiments = useExperiments();
  const ready = datasets.isSuccess && datasets.data.length > 0;

  return (
    <div className="animate-fade-in space-y-8">
      <header className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">AgRiX / working instrument</p>
          <h1 className="mt-2 font-serif text-display-md text-text">The season lens</h1>
          <p className="mt-2 max-w-2xl text-body text-text-muted">
            One place to verify the source, stress the growing season, and keep the credit
            conclusion tied to its evidence.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-text-light">
          <span
            className={`h-2 w-2 rounded-full ${health.isSuccess ? 'bg-primary' : 'bg-risk-moderate'}`}
          />
          {health.isLoading
            ? 'checking service'
            : health.isSuccess
              ? 'service online'
              : 'service unavailable'}
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]" aria-labelledby="lens-heading">
        <div className="panel-deep p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <p className="eyebrow text-primary-light">Instrument 01</p>
              <h2 id="lens-heading" className="mt-2 font-serif text-heading-lg text-text">
                Counterfactual season
              </h2>
              <p className="mt-2 max-w-xl text-body-sm text-text-muted">
                Build a defined “what if” around a verified loan context. The readout stays locked
                until the underlying yield and financial target are documented.
              </p>
            </div>
            <div className="border-risk-moderate/50 border bg-surface px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-risk-moderate">
              {ready ? 'source admitted' : 'readout locked'}
            </div>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <InputTray
              label="01 / source"
              value={ready ? 'Verified snapshot' : 'Nothing admitted'}
              icon={Database}
              done={ready}
            />
            <InputTray label="02 / season" value="Stress path undefined" icon={CloudSun} />
            <InputTray label="03 / target" value="Financial target missing" icon={BarChart3} />
          </div>
          <div className="mt-6 flex flex-col justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center">
            <p className="text-body-sm text-text-muted">
              A result appears here only when all three trays are documented.
            </p>
            <Link
              href="/research"
              className="inline-flex shrink-0 items-center gap-2 text-body-sm font-medium text-primary hover:text-primary-hover"
            >
              Check readiness <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <aside className="card panel-raised" aria-labelledby="rules-heading">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 id="rules-heading" className="font-serif text-heading-md text-text">
              Readout rules
            </h2>
          </div>
          <ul className="mt-6 space-y-4 text-body-sm text-text-muted">
            <li className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Source metadata
              travels with the result.
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Intervals are shown
              beside point estimates.
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Proxy risk is never
              labelled default probability.
            </li>
          </ul>
          <div className="mt-7 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-wider text-text-light">
            Integrity gate / active
          </div>
        </aside>
      </section>

      <section aria-labelledby="workbench-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Workbench</p>
            <h2 id="workbench-heading" className="mt-2 font-serif text-heading-lg text-text">
              Choose the next instrument
            </h2>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-text-light sm:block">
            4 available paths
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {workbench.map(({ name, href, icon: Icon, text }) => (
            <Link key={name} href={href} className="card panel-raised group">
              <div className="flex items-start justify-between">
                <div className="panel-inset flex h-10 w-10 items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <ArrowRight className="h-4 w-4 text-text-light transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="mt-8 font-serif text-heading-sm text-text">{name}</h3>
              <p className="mt-2 text-body-sm text-text-muted">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3"
        aria-label="Workspace status"
      >
        <StatusCell
          label="API service"
          value={health.isSuccess ? 'Healthy' : health.isLoading ? 'Checking' : 'Unavailable'}
        />
        <StatusCell
          label="Verified datasets"
          value={datasets.isSuccess ? String(datasets.data.length) : 'Unavailable'}
        />
        <StatusCell
          label="Recorded experiments"
          value={experiments.isSuccess ? String(experiments.data.length) : 'Unavailable'}
        />
      </section>

      {!ready && (
        <div className="border-risk-moderate/50 flex gap-4 border bg-surface p-5" role="status">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-risk-moderate"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-text">No verified source snapshot is registered.</p>
            <p className="mt-1 text-body-sm text-text-muted">
              Analysis, forecasts, and season readouts remain unavailable until a public yield
              snapshot and documented financial target are admitted.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function InputTray({
  label,
  value,
  icon: Icon,
  done = false,
}: {
  label: string;
  value: string;
  icon: typeof Database;
  done?: boolean;
}) {
  return (
    <div className="border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <Icon
          className={`h-4 w-4 ${done ? 'text-primary' : 'text-text-light'}`}
          aria-hidden="true"
        />
      </div>
      <p className="mt-8 text-body-sm font-medium text-text">{value}</p>
    </div>
  );
}

function StatusCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-elevated px-5 py-4">
      <p className="metric-label">{label}</p>
      <p className="mt-1 font-mono text-sm tabular-nums text-text">{value}</p>
    </div>
  );
}
