'use client';

import { useState } from 'react';
import { CheckCircle2, Database, XCircle } from 'lucide-react';
import { useDatasets } from '@/lib/api/hooks';
import { api } from '@/lib/api/client';
import { useMutation, useQuery } from '@tanstack/react-query';

const SAMPLE_ROWS = [
  { region: 'US-IA', year: 2020, yield_t_ha: 11.2 },
  { region: 'US-IA', year: 2020, yield_t_ha: 11.2 },
  { region: 'US-IL', year: 2021, yield_t_ha: null },
];

interface ValidationResult {
  valid: boolean;
  rows_received: number;
  columns: string[];
  missing_required_columns: string[];
  duplicate_rows: number;
  missing_values: Record<string, number>;
  errors: string[];
}

export default function AnalysisPage() {
  const datasets = useDatasets();
  const [dataset, setDataset] = useState('yield_matrix');
  const summary = useQuery({
    queryKey: ['data', 'summary', dataset],
    queryFn: () => api.getDatasetSummary({ dataset }),
    enabled: datasets.isSuccess && datasets.data.length > 0,
  });
  const validate = useMutation({
    mutationFn: () =>
      api.validateData({ rows: SAMPLE_ROWS, required_columns: ['region', 'yield_t_ha'] }),
  });
  const result = validate.data as ValidationResult | undefined;

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-serif text-display-md text-text">Source check</h1>
        <p className="mt-1 text-body text-text-muted">
          Registered snapshots, their provenance, and structural validation results.
        </p>
      </div>

      <section className="card panel-raised" aria-labelledby="registry-heading">
        <h2 id="registry-heading" className="mb-4 font-serif text-heading-md text-text">
          Registered snapshots
        </h2>
        {datasets.isSuccess && datasets.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dataset</th>
                  <th>Provider</th>
                  <th>Coverage</th>
                  <th>Rows</th>
                  <th>Checksum</th>
                </tr>
              </thead>
              <tbody>
                {datasets.data.map((entry) => {
                  const meta = entry as unknown as {
                    dataset_name: string;
                    provider: string;
                    temporal_coverage: string;
                    rows: number;
                    checksum: string;
                  };
                  return (
                    <tr key={meta.dataset_name}>
                      <td>{meta.dataset_name}</td>
                      <td>{meta.provider}</td>
                      <td>{meta.temporal_coverage}</td>
                      <td className="text-right font-mono">{meta.rows}</td>
                      <td className="max-w-[14rem] truncate font-mono text-caption">
                        {meta.checksum}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            message={
              datasets.isLoading
                ? 'Loading registry…'
                : 'No snapshots registered. Run the pipeline from Settings.'
            }
          />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card panel-raised" aria-labelledby="summary-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="summary-heading" className="font-serif text-heading-md text-text">
              Feature-matrix summary
            </h2>
            <select
              className="input-field w-auto"
              value={dataset}
              onChange={(event) => setDataset(event.target.value)}
              aria-label="Feature matrix"
            >
              <option value="yield_matrix">yield_matrix</option>
              <option value="risk_panel">risk_panel</option>
              <option value="state_climate">state_climate</option>
            </select>
          </div>
          {summary.isSuccess ? (
            <SummaryTable data={summary.data as SummaryData} />
          ) : (
            <EmptyState
              message={
                summary.isLoading
                  ? 'Loading summary…'
                  : summary.isError
                    ? 'Summary unavailable — run the pipeline first.'
                    : 'Register a snapshot to see summary statistics.'
              }
            />
          )}
        </section>

        <section className="card panel-raised" aria-labelledby="validate-heading">
          <h2 id="validate-heading" className="mb-2 font-serif text-heading-md text-text">
            Structural validation
          </h2>
          <p className="mb-4 text-body-sm text-text-muted">
            Sends a sample table to <code className="font-mono">/api/data/validate</code> to
            demonstrate missingness, duplicate, and required-column checks.
          </p>
          <button
            type="button"
            className="btn-raised btn-primary"
            onClick={() => validate.mutate()}
            disabled={validate.isPending}
          >
            {validate.isPending ? 'Validating…' : 'Validate sample table'}
          </button>
          {result && (
            <div className="mt-5 space-y-2 text-body-sm">
              <p className="flex items-center gap-2 font-medium text-text">
                {result.valid ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <XCircle className="h-4 w-4 text-risk-high" />
                )}
                {result.valid ? 'Structure valid' : 'Structure invalid'} — {result.rows_received}{' '}
                rows, {result.duplicate_rows} duplicate(s)
              </p>
              <p className="text-text-muted">
                Columns: <span className="font-mono">{result.columns.join(', ')}</span>
              </p>
              <p className="text-text-muted">
                Missing values:{' '}
                <span className="font-mono">
                  {Object.entries(result.missing_values)
                    .map(([column, count]) => `${column}=${count}`)
                    .join(', ')}
                </span>
              </p>
              {result.errors.length > 0 && (
                <ul className="list-inside list-disc text-risk-high">
                  {result.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

interface SummaryData {
  dataset: string;
  rows: number;
  columns: string[];
  numeric_summary: Record<
    string,
    { mean: number; std: number; min: number; median: number; max: number; missing: number }
  >;
  duplicate_rows: number;
}

function SummaryTable({ data }: { data: SummaryData }) {
  return (
    <div className="overflow-x-auto">
      <p className="mb-3 text-body-sm text-text-muted">
        {data.rows} rows · {data.duplicate_rows} duplicate rows
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Column</th>
            <th className="text-right">Mean</th>
            <th className="text-right">Std</th>
            <th className="text-right">Min</th>
            <th className="text-right">Median</th>
            <th className="text-right">Max</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.numeric_summary).map(([column, stats]) => (
            <tr key={column}>
              <td className="font-mono">{column}</td>
              <td className="text-right font-mono">{stats.mean.toFixed(3)}</td>
              <td className="text-right font-mono">{stats.std.toFixed(3)}</td>
              <td className="text-right font-mono">{stats.min.toFixed(3)}</td>
              <td className="text-right font-mono">{stats.median.toFixed(3)}</td>
              <td className="text-right font-mono">{stats.max.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="chart-container flex min-h-40 items-center justify-center text-center text-text-muted">
      <div>
        <Database className="mx-auto mb-3 h-10 w-10 opacity-40" aria-hidden="true" />
        <p className="text-body-sm">{message}</p>
      </div>
    </div>
  );
}
