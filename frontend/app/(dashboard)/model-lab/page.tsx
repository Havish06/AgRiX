'use client';

import { AlertTriangle, FlaskConical } from 'lucide-react';
import { useExperiments, useModels } from '@/lib/api/hooks';

export default function ModelLabPage() {
  const models = useModels();
  const experiments = useExperiments();

  return (
    <div className="animate-fade-in space-y-8">
      <header>
        <h1 className="font-serif text-display-md text-text">Evidence ledger</h1>
        <p className="mt-1 text-body text-text-muted">
          Keep baseline, enriched model, validation split, and limitations in one recorded place.
        </p>
      </header>
      <section className="panel-deep p-6 lg:p-8" aria-labelledby="experiment-heading">
        <div className="flex items-start gap-4">
          <FlaskConical className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 id="experiment-heading" className="font-serif text-heading-lg text-text">
              Finance-only vs combined
            </h2>
            <p className="mt-2 text-body text-text-muted">
              The comparison is ready for a documented public yield source and a defined financial
              target. Metrics will appear here after a reproducible run.
            </p>
          </div>
        </div>
      </section>
      <section className="card panel-raised" aria-labelledby="models-heading">
        <h2 id="models-heading" className="mb-4 font-serif text-heading-md text-text">
          Registered model cards
        </h2>
        {models.isSuccess && models.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Version</th>
                  <th>Target</th>
                  <th>Validation</th>
                </tr>
              </thead>
              <tbody>
                {models.data.map((model) => (
                  <tr key={`${model.model_name}-${model.version}`}>
                    <td>{model.model_name}</td>
                    <td>{model.version}</td>
                    <td>{model.target}</td>
                    <td>{model.validation_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <UnavailableState loading={models.isLoading} />
        )}
      </section>
      <section className="card panel-raised" aria-labelledby="experiments-heading">
        <h2 id="experiments-heading" className="mb-4 font-serif text-heading-md text-text">
          Experiment history
        </h2>
        {experiments.isSuccess && experiments.data.length > 0 ? (
          <ul className="space-y-3">
            {experiments.data.map((experiment) => (
              <li key={experiment.experiment_id} className="panel-inset p-4">
                <strong className="text-text">{experiment.name}</strong>
                <span className="ml-3 text-body-sm text-text-muted">{experiment.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <UnavailableState loading={experiments.isLoading} />
        )}
      </section>
    </div>
  );
}

function UnavailableState({ loading }: { loading: boolean }) {
  return (
    <div className="chart-container flex min-h-40 items-center justify-center text-center text-text-muted">
      <div>
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 opacity-40" aria-hidden="true" />
        <p>{loading ? 'Loading registered records…' : 'No registered records are available.'}</p>
      </div>
    </div>
  );
}
