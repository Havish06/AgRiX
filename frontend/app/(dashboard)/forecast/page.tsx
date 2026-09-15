'use client';

import { LineChart as LineChartIcon } from 'lucide-react';

export default function ForecastPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-serif text-display-md text-text">Yield Forecast</h1>
        <p className="text-body text-text-muted mt-1">
          Historical yield trends and future forecasts with prediction intervals
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card panel-raised p-6">
            <h2 className="font-serif text-heading-md text-text mb-4">Forecast Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="label-field">Region</label>
                <select className="input-field">
                  <option value="US-IA">Iowa, USA (US-IA)</option>
                </select>
              </div>
              <div>
                <label className="label-field">Crop</label>
                <select className="input-field">
                  <option value="maize">Maize</option>
                </select>
              </div>
              <div>
                <label className="label-field">Forecast Horizon (years)</label>
                <select className="input-field">
                  <option value="1">1 Year</option>
                  <option value="3">3 Years</option>
                  <option value="5">5 Years</option>
                </select>
              </div>
              <div>
                <label className="label-field">Model</label>
                <select className="input-field">
                  <option value="xgboost">XGBoost (Recommended)</option>
                  <option value="rf">Random Forest</option>
                  <option value="linear">Linear Regression</option>
                </select>
              </div>
              <div>
                <label className="label-field">Uncertainty Method</label>
                <select className="input-field">
                  <option value="bootstrap">Bootstrap (Percentile)</option>
                  <option value="conformal">Conformal Prediction</option>
                  <option value="quantile">Quantile Regression</option>
                </select>
              </div>
              <button className="btn-raised btn-primary w-full">Generate Forecast</button>
            </div>
          </div>

          <div className="card panel-raised p-6">
            <h2 className="font-serif text-heading-md text-text mb-4">Model Info</h2>
            <dl className="space-y-3 text-body-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Version</dt>
                <dd className="font-mono text-text">XGBoost_v3.1.0</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Training Period</dt>
                <dd className="font-mono text-text">2010-2018</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Test MAE</dt>
                <dd className="font-mono text-text">0.31 t/ha</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Test RMSE</dt>
                <dd className="font-mono text-text">0.42 t/ha</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Test R²</dt>
                <dd className="font-mono text-text">0.83</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">PICP (95%)</dt>
                <dd className="font-mono text-text">0.94</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card panel-raised p-6">
            <h2 className="font-serif text-heading-md text-text mb-4">Yield Forecast Chart</h2>
            <div className="chart-container h-[500px] flex items-center justify-center">
              <div className="text-center text-text-muted">
                <LineChartIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-body-lg">Historical Yield + Forecast with 95% PI</p>
                <p className="text-body-sm mt-2">Connects to /api/forecast endpoint</p>
              </div>
            </div>
          </div>

          <div className="card panel-raised p-6">
            <h2 className="font-serif text-heading-md text-text mb-4">Forecast Table</h2>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th className="text-right">Predicted Yield (t/ha)</th>
                    <th className="text-right">Lower Bound (95%)</th>
                    <th className="text-right">Upper Bound (95%)</th>
                    <th className="text-right">Interval Width</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { year: 2025, pred: '4.21', lower: '3.78', upper: '4.64', width: '0.86' },
                    { year: 2026, pred: '4.28', lower: '3.72', upper: '4.84', width: '1.12' },
                    { year: 2027, pred: '4.35', lower: '3.65', upper: '5.05', width: '1.40' },
                    { year: 2028, pred: '4.41', lower: '3.58', upper: '5.24', width: '1.66' },
                    { year: 2029, pred: '4.48', lower: '3.51', upper: '5.45', width: '1.94' },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="font-medium">{row.year}</td>
                      <td className="text-right font-mono">{row.pred}</td>
                      <td className="text-right font-mono">{row.lower}</td>
                      <td className="text-right font-mono">{row.upper}</td>
                      <td className="text-right font-mono">{row.width}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}