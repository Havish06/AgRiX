'use client';

import { AlertTriangle, FlaskConical } from 'lucide-react';
import { useExperiments, useModelComparison, useModels } from '@/lib/api/hooks';

export default function ModelLabPage() {
  const models = useModels();
  const experiments = useExperiments();
  const comparison = useModelComparison();

  return (
    <div className="animate-fade-in space-y-8">
      <header>
        <h1 className="font-serif text-display-md text-text">Evidence ledger</h1>
        <p className="mt-1 text-body text-text-muted">
          Keep baseline, enriched model, validation split, and limitations in one recorded place.
        </p>
      </header>
      <section className="card panel-raised" aria-labelledby="experiment-heading">
        <div className="mb-4 flex items-start gap-4">
          <FlaskConical className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 id="experiment-heading" className="font-serif text-heading-lg text-text">
              Finance-only vs combined
            </h2>
            <p className="mt-2 text-body text-text-muted">
              Held-out test metrics and calibrated interval coverage for the two risk feature sets
              across the model zoo.
            </p>
          </div>
        </div>
        {comparison.isSuccess && comparison.data.models.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Feature set</th>
                  <th className="text-right">Test MAE</th>
                  <th className="text-right">Test R²</th>
                  <th className="text-right">PICP 95</th>
                  <th className="text-right">MPIW 95</th>
                </tr>
              </thead>
              <tbody>
                {comparison.data.models
                  .filter((row) => row.task === 'risk')
                  .map((row) => (
                    <tr key={row.registry_key}>
                      <td>{row.model_id}</td>
                      <td>{row.feature_set}</td>
                      <td className="text-right font-mono">{row.test_mae.toFixed(4)}</td>
                      <td className="text-right font-mono">{row.test_r2.toFixed(4)}</td>
                      <td className="text-right font-mono">{row.picp_95.toFixed(2)}</td>
                      <td className="text-right font-mono">{row.mpiw_95.toFixed(4)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <UnavailableState loading={comparison.isLoading} />
        )}
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
