'use client';

import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useForecast } from '@/lib/api/hooks';
import type { ForecastResponse } from '@/types';

export default function ForecastPage() {
  const [request, setRequest] = useState({
    region_code: 'US-IA',
    crop_code: 'maize',
    horizon: 1,
    model: 'xgboost',
    uncertainty_method: 'bootstrap',
  });
  const forecast = useForecast(request);

  return (
    <div className="animate-fade-in space-y-8">
      <header>
        <h1 className="font-serif text-display-md text-text">Yield interval</h1>
        <p className="mt-1 text-body text-text-muted">
          Read the forecast together with its prediction interval, validation method, and source.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card panel-raised" aria-labelledby="settings-heading">
          <h2 id="settings-heading" className="mb-4 font-serif text-heading-md text-text">
            Forecast settings
          </h2>
          <div className="space-y-4">
            <label className="label-field">
              Region
              <input
                className="input-field mt-1"
                value={request.region_code}
                onChange={(event) => setRequest({ ...request, region_code: event.target.value })}
              />
            </label>
            <label className="label-field">
              Crop
              <input
                className="input-field mt-1"
                value={request.crop_code}
                onChange={(event) => setRequest({ ...request, crop_code: event.target.value })}
              />
            </label>
            <label className="label-field">
              Horizon
              <select
                className="input-field mt-1"
                value={request.horizon}
                onChange={(event) =>
                  setRequest({ ...request, horizon: Number(event.target.value) })
                }
              >
                <option value={1}>1 year</option>
                <option value={3}>3 years</option>
                <option value={5}>5 years</option>
              </select>
            </label>
            <p className="text-caption text-text-muted">
              The request is sent only when a verified backend model is available.
            </p>
          </div>
        </section>

        <section className="space-y-6 lg:col-span-2" aria-labelledby="result-heading">
          <div className="card panel-raised">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="result-heading" className="font-serif text-heading-md text-text">
                Forecast result
              </h2>
              <span className="text-caption text-text-muted">API-backed</span>
            </div>
            {forecast.isSuccess ? (
              <ForecastTable data={forecast.data} />
            ) : (
              <UnavailableState isLoading={forecast.isLoading} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ForecastTable({ data }: { data: ForecastResponse }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Year</th>
            <th className="text-right">Yield</th>
            <th className="text-right">Lower</th>
            <th className="text-right">Upper</th>
          </tr>
        </thead>
        <tbody>
          {[...data.historical, ...data.forecast].map((point) => (
            <tr key={`${point.type}-${point.year}`}>
              <td>
                {point.year} ({point.type})
              </td>
              <td className="text-right font-mono">{point.yield}</td>
              <td className="text-right font-mono">{point.lower_bound}</td>
              <td className="text-right font-mono">{point.upper_bound}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UnavailableState({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="chart-container flex min-h-64 items-center justify-center">
      <div className="text-center text-text-muted">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 opacity-40" aria-hidden="true" />
        <p className="text-body">
          {isLoading ? 'Checking for a verified model…' : 'No verified model is available.'}
        </p>
        <p className="mt-1 text-body-sm">
          Forecasts remain disabled until public data and a trained artifact are registered.
        </p>
      </div>
    </div>
  );
}
