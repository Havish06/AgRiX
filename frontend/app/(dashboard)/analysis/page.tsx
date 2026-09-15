'use client';

import { Shield } from 'lucide-react';

export default function AnalysisPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-serif text-display-md text-text">Analysis Workspace</h1>
        <p className="text-body text-text-muted mt-1">
          Select region, crop, year range, and model to run statistical analysis
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card panel-raised p-6">
            <h2 className="font-serif text-heading-md text-text mb-4">Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="label-field">Region</label>
                <select className="input-field">
                  <option value="US-IA">Iowa, USA (US-IA)</option>
                  <option value="US-IL">Illinois, USA (US-IL)</option>
                  <option value="BR-MT">Mato Grosso, Brazil (BR-MT)</option>
                </select>
              </div>
              <div>
                <label className="label-field">Crop</label>
                <select className="input-field">
                  <option value="maize">Maize</option>
                  <option value="wheat">Wheat</option>
                  <option value="soybean">Soybean</option>
                  <option value="rice">Rice</option>
                </select>
              </div>
              <div>
                <label className="label-field">Year Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" className="input-field" placeholder="Start" defaultValue="2010" />
                  <input type="number" className="input-field" placeholder="End" defaultValue="2024" />
                </div>
              </div>
              <div>
                <label className="label-field">Model</label>
                <select className="input-field">
                  <option value="linear">Linear Regression</option>
                  <option value="ridge">Ridge Regression</option>
                  <option value="rf">Random Forest</option>
                  <option value="xgboost">XGBoost</option>
                </select>
              </div>
              <button className="btn-raised btn-primary w-full">Run Analysis</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card panel-raised p-6">
            <h2 className="font-serif text-heading-md text-text mb-4">Statistical Summary</h2>
            <div className="chart-container h-96 flex items-center justify-center">
              <div className="text-center text-text-muted">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-body">Descriptive statistics, distributions, correlations</p>
                <p className="text-body-sm mt-1">Results from /api/statistics endpoints</p>
              </div>
            </div>
          </div>

          <div className="card panel-raised p-6">
            <h2 className="font-serif text-heading-md text-text mb-4">Model Results</h2>
            <div className="chart-container h-96 flex items-center justify-center">
              <div className="text-center text-text-muted">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-body">Regression coefficients, predictions, diagnostics</p>
                <p className="text-body-sm mt-1">Results from /api/models endpoints</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}