'use client';

import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Database,
  GitBranch,
  Shield,
} from 'lucide-react';
import { useDatasets, useExperiments } from '@/lib/api/hooks';

export default function ResearchPage() {
  const datasets = useDatasets();
  const experiments = useExperiments();
  const datasetsReady = datasets.isSuccess && datasets.data.length > 0;
  const experimentsReady = experiments.isSuccess && experiments.data.length > 0;

  return (
    <div className="animate-fade-in space-y-8">
      <header>
        <h1 className="font-serif text-display-md text-text">Research Transparency</h1>
        <p className="mt-1 text-body text-text-muted">
          Data provenance, experiment records, and methodological safeguards.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <InfoCard icon={Database} title="Public data registry">
          <p>
            Snapshots are registered only after a public response is fetched, normalized, cached,
            and checksum-verified.
          </p>
          {datasets.isSuccess && datasets.data.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {datasets.data.map((dataset) => (
                <li
                  key={`${dataset.provider}-${dataset.version}`}
                  className="panel-inset p-3 text-body-sm"
                >
                  {dataset.dataset_name}
                </li>
              ))}
            </ul>
          ) : (
            <StatusLine loading={datasets.isLoading} />
          )}
        </InfoCard>
        <InfoCard icon={GitBranch} title="Experiment history">
          <p>
            Every run must record dataset, feature, model, seed, periods, metrics, and limitations.
          </p>
          {experiments.isSuccess && experiments.data.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {experiments.data.map((experiment) => (
                <li key={experiment.experiment_id} className="panel-inset p-3 text-body-sm">
                  {experiment.name} — {experiment.status}
                </li>
              ))}
            </ul>
          ) : (
            <StatusLine loading={experiments.isLoading} />
          )}
        </InfoCard>
      </div>
      <section className="panel-deep p-6 lg:p-8" aria-labelledby="integrity-heading">
        <h2
          id="integrity-heading"
          className="mb-5 flex items-center gap-2 font-serif text-heading-lg text-text"
        >
          <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
          Research integrity gates
        </h2>
        <ul className="grid gap-4 text-body-sm text-text-muted md:grid-cols-2">
          <li>✓ No model result is shown without a verified source snapshot.</li>
          <li>✓ Forecast preprocessing must be fitted on training data only.</li>
          <li>✓ Proxy agricultural financial risk is not labeled as default probability.</li>
          <li>✓ Prediction intervals and limitations are required for model outputs.</li>
        </ul>
      </section>
      <section className="card panel-raised" aria-labelledby="method-heading">
        <h2
          id="method-heading"
          className="mb-4 flex items-center gap-2 font-serif text-heading-md text-text"
        >
          <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
          Methodology readiness
        </h2>
        {datasetsReady && experimentsReady ? (
          <>
            <p className="text-body text-text-muted">
              Public climate, yield, and credit-panel snapshots are registered and the model zoo has
              been trained on a chronological split. Held-out test metrics and calibrated interval
              coverage are recorded for every experiment above.
            </p>
            <div className="mt-4 flex items-start gap-3 rounded-[4px] border border-primary bg-surface p-4 text-body-sm text-text">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              {experiments.data.length} experiment records registered with test metrics.
            </div>
          </>
        ) : (
          <>
            <p className="text-body text-text-muted">
              NASA POWER public climate ingestion is available. Register the remaining public
              snapshots and run the pipeline before the central finance-only versus combined
              experiment can report metrics.
            </p>
            <div className="mt-4 flex items-start gap-3 rounded-[4px] border border-risk-moderate bg-surface p-4 text-body-sm text-text">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-risk-moderate"
                aria-hidden="true"
              />
              No scientific metrics are available yet — run the pipeline from Settings.
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Database;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card panel-raised">
      <h2 className="mb-4 flex items-center gap-2 font-serif text-heading-md text-text">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatusLine({ loading }: { loading: boolean }) {
  return (
    <p className="mt-4 text-body-sm text-text-muted">
      {loading ? 'Loading registry…' : 'No verified records are available.'}
    </p>
  );
}
