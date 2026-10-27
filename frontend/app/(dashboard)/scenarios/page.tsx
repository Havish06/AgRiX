'use client';

import { AlertTriangle, Cloud, SlidersHorizontal, Sun, Zap } from 'lucide-react';
import { useState } from 'react';
import { useRunScenario } from '@/lib/api/hooks';
import type { ScenarioRequest } from '@/types';

const scenarioOptions: Array<{
  id: ScenarioRequest['scenario'];
  name: string;
  description: string;
}> = [
  { id: 'normal', name: 'Normal', description: 'Historical conditions' },
  { id: 'dry', name: 'Dry', description: 'Reduced rainfall' },
  { id: 'heat', name: 'Heat', description: 'Increased temperature' },
  { id: 'severe', name: 'Severe', description: 'Combined stress' },
  { id: 'custom', name: 'Custom', description: 'User-defined parameters' },
];

const regions = [
  { code: 'US-IA', name: 'Iowa' },
  { code: 'US-IL', name: 'Illinois' },
  { code: 'US-IN', name: 'Indiana' },
  { code: 'US-NE', name: 'Nebraska' },
  { code: 'US-KS', name: 'Kansas' },
  { code: 'US-MN', name: 'Minnesota' },
  { code: 'US-SD', name: 'South Dakota' },
  { code: 'US-OH', name: 'Ohio' },
];

export default function ScenariosPage() {
  const [scenario, setScenario] = useState<ScenarioRequest['scenario']>('normal');
  const [regionCode, setRegionCode] = useState('US-IA');
  const [rainfallMultiplier, setRainfallMultiplier] = useState(1);
  const [temperatureOffset, setTemperatureOffset] = useState(0);
  const runScenario = useRunScenario();

  const submit = () =>
    runScenario.mutate({
      region_code: regionCode,
      crop_code: 'maize',
      scenario,
      custom_params: {
        rainfall_multiplier: rainfallMultiplier,
        temperature_offset: temperatureOffset,
      },
      n_simulations: 1000,
      confidence_level: 0.95,
    });

  return (
    <div className="animate-fade-in space-y-8">
      <header>
        <h1 className="font-serif text-display-md text-text">Stress path builder</h1>
        <p className="mt-1 text-body text-text-muted">
          Define a counterfactual growing season before asking what the credit picture would change.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-1" aria-labelledby="scenario-heading">
          <div className="card panel-raised">
            <h2 id="scenario-heading" className="mb-4 font-serif text-heading-md text-text">
              Scenario
            </h2>
            <label className="label-field mb-4 block">
              Region
              <select
                className="input-field mt-1"
                value={regionCode}
                onChange={(event) => setRegionCode(event.target.value)}
              >
                {regions.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name} ({region.code})
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-2">
              {scenarioOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setScenario(option.id)}
                  className={`flex w-full items-center gap-3 rounded-[4px] border p-4 text-left ${scenario === option.id ? 'border-primary bg-primary-light' : 'border-border bg-surface'}`}
                >
                  <ScenarioIcon scenario={option.id} />
                  <span>
                    <strong className="block text-text">{option.name}</strong>
                    <small className="text-text-muted">{option.description}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
          {scenario === 'custom' && (
            <div className="card panel-raised space-y-4">
              <label className="label-field">
                Rainfall multiplier
                <input
                  className="input-field mt-1"
                  type="number"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={rainfallMultiplier}
                  onChange={(event) => setRainfallMultiplier(Number(event.target.value))}
                />
              </label>
              <label className="label-field">
                Temperature offset
                <input
                  className="input-field mt-1"
                  type="number"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={temperatureOffset}
                  onChange={(event) => setTemperatureOffset(Number(event.target.value))}
                />
              </label>
            </div>
          )}
          <button
            type="button"
            className="btn-raised btn-primary w-full"
            onClick={submit}
            disabled={runScenario.isPending}
          >
            {runScenario.isPending ? 'Running…' : 'Run scenario'}
          </button>
        </section>
        <section className="space-y-6 lg:col-span-2" aria-labelledby="results-heading">
          <div className="card panel-raised">
            <h2 id="results-heading" className="mb-4 font-serif text-heading-md text-text">
              Season readout
            </h2>
            {runScenario.data ? (
              <ScenarioResults data={runScenario.data} />
            ) : (
              <div className="chart-container flex min-h-64 items-center justify-center">
                <div className="text-center text-text-muted">
                  <AlertTriangle className="mx-auto mb-4 h-12 w-12 opacity-40" aria-hidden="true" />
                  <p className="text-body">No scenario result is available.</p>
                  <p className="mt-1 text-body-sm">
                    Run this analysis after a verified model and dataset are configured.
                  </p>
                </div>
              </div>
            )}
          </div>
          {runScenario.isError && (
            <p className="text-body-sm text-risk-high" role="alert">
              The scenario could not be run. The backend may be waiting for a verified snapshot.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function ScenarioIcon({ scenario }: { scenario: ScenarioRequest['scenario'] }) {
  const Icon =
    scenario === 'dry'
      ? Sun
      : scenario === 'heat'
        ? AlertTriangle
        : scenario === 'severe'
          ? Zap
          : scenario === 'custom'
            ? SlidersHorizontal
            : Cloud;
  return <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />;
}

function ScenarioResults({
  data,
}: {
  data: {
    results: Array<{
      scenario: string;
      yield_distribution: { mean: number };
      yield_loss_probability: number;
      risk_score_distribution: { mean: number };
      expected_loss: number;
      category: string;
    }>;
    n_simulations: number;
  };
}) {
  return (
    <div>
      <p className="mb-4 text-body-sm text-text-muted">
        {data.n_simulations.toLocaleString()} simulations
      </p>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th className="text-right">Mean yield</th>
              <th className="text-right">Loss probability</th>
              <th className="text-right">Mean risk</th>
              <th className="text-right">Expected loss</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((result) => (
              <tr key={result.scenario}>
                <td>{result.scenario}</td>
                <td className="text-right font-mono">{result.yield_distribution.mean}</td>
                <td className="text-right font-mono">{result.yield_loss_probability}</td>
                <td className="text-right font-mono">{result.risk_score_distribution.mean}</td>
                <td className="text-right font-mono">{result.expected_loss}</td>
                <td>{result.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
