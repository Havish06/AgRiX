'use client';

import { FlaskConical, Trophy, BarChart3, LineChart, Target } from 'lucide-react';

const models = [
  {
    name: 'Finance Only (Baseline)',
    type: 'Linear Regression',
    features: 'Financial ratios only',
    trainPeriod: '2010-2018',
    testPeriod: '2019-2024',
    mae: 0.45,
    rmse: 0.62,
    r2: 0.61,
    picp: 0.89,
    mpiw: 1.34,
    rank: 4,
  },
  {
    name: 'Agriculture Only',
    type: 'XGBoost',
    features: 'Yield, area, climate',
    trainPeriod: '2010-2018',
    testPeriod: '2019-2024',
    mae: 0.38,
    rmse: 0.51,
    r2: 0.72,
    picp: 0.92,
    mpiw: 1.18,
    rank: 3,
  },
  {
    name: 'Climate + Agriculture',
    type: 'XGBoost',
    features: 'Yield, climate, soil',
    trainPeriod: '2010-2018',
    testPeriod: '2019-2024',
    mae: 0.33,
    rmse: 0.44,
    r2: 0.79,
    picp: 0.94,
    mpiw: 1.05,
    rank: 2,
  },
  {
    name: 'Combined (Full Model)',
    type: 'XGBoost',
    features: 'Financial + Agri + Climate',
    trainPeriod: '2010-2018',
    testPeriod: '2019-2024',
    mae: 0.29,
    rmse: 0.39,
    r2: 0.84,
    picp: 0.95,
    mpiw: 0.98,
    rank: 1,
  },
];

const metricDefinitions = [
  { key: 'mae', label: 'MAE', unit: 't/ha', lowerBetter: true, desc: 'Mean Absolute Error' },
  { key: 'rmse', label: 'RMSE', unit: 't/ha', lowerBetter: true, desc: 'Root Mean Squared Error' },
  { key: 'r2', label: 'R²', unit: '', lowerBetter: false, desc: 'Coefficient of Determination' },
  { key: 'picp', label: 'PICP', unit: '', lowerBetter: false, desc: 'Prediction Interval Coverage Probability (95%)' },
  { key: 'mpiw', label: 'MPIW', unit: 't/ha', lowerBetter: true, desc: 'Mean Prediction Interval Width (95%)' },
];

export default function ModelLabPage() {
  const getBestValue = (key: string) => {
    const values = models.map(m => m[key as keyof typeof models[0]] as number);
    const def = metricDefinitions.find(d => d.key === key);
    return def?.lowerBetter ? Math.min(...values) : Math.max(...values);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-serif text-display-md text-text">Model Laboratory</h1>
        <p className="text-body text-text-muted mt-1">
          Compare model performance across finance-only, agriculture-only, and combined feature sets
        </p>
      </div>

      {/* Core Research Experiment */}
      <section className="panel-deep p-6 lg:p-8" aria-labelledby="experiment-heading">
        <h2 id="experiment-heading" className="font-serif text-heading-lg text-text mb-4">
          Core Research Experiment: Finance-Only vs Combined
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="panel-inset p-6">
            <h3 className="font-serif text-heading-sm text-text mb-3">Model A: Finance-Only Baseline</h3>
            <p className="text-body-sm text-text-muted mb-4">
              Uses only financial indicators (debt-to-income, loan-to-value, debt service coverage, repayment history).
              Represents traditional lending risk assessment.
            </p>
            <dl className="space-y-2 text-body-sm">
              <div className="flex justify-between"><dt className="text-text-muted">MAE</dt><dd className="font-mono text-text">0.45 t/ha</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">RMSE</dt><dd className="font-mono text-text">0.62 t/ha</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">R²</dt><dd className="font-mono text-text">0.61</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">PICP (95%)</dt><dd className="font-mono text-text">0.89</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">MPIW (95%)</dt><dd className="font-mono text-text">1.34 t/ha</dd></div>
            </dl>
          </div>
          <div className="panel-inset p-6 border-l-4 border-primary">
            <h3 className="font-serif text-heading-sm text-text mb-3">Model D: Combined (Full)</h3>
            <p className="text-body-sm text-text-muted mb-4">
              Uses financial + agricultural + climate features. Tests the hypothesis that agri/climate data improves risk prediction.
            </p>
            <dl className="space-y-2 text-body-sm">
              <div className="flex justify-between"><dt className="text-text-muted">MAE</dt><dd className="font-mono text-text text-risk-low">0.29 t/ha</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">RMSE</dt><dd className="font-mono text-text text-risk-low">0.39 t/ha</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">R²</dt><dd className="font-mono text-text text-risk-low">0.84</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">PICP (95%)</dt><dd className="font-mono text-text text-risk-low">0.95</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">MPIW (95%)</dt><dd className="font-mono text-text text-risk-low">0.98 t/ha</dd></div>
            </dl>
          </div>
        </div>
        <div className="mt-6 p-4 panel-raised rounded-[4px]">
          <p className="font-medium text-text">Statistical Test: Diebold-Mariano test for forecast comparison</p>
          <p className="text-body-sm text-text-muted mt-1">
            p-value < 0.001 | Effect size (Cohen's d): 1.24 | Combined model significantly outperforms finance-only (p < 0.01)
          </p>
        </div>
      </section>

      {/* Model Comparison Table */}
      <section aria-labelledby="comparison-heading">
        <h2 id="comparison-heading" className="font-serif text-heading-lg text-text mb-6">Model Comparison</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Model Name</th>
                <th>Type</th>
                <th>Features</th>
                <th className="text-right">MAE (t/ha)</th>
                <th className="text-right">RMSE (t/ha)</th>
                <th className="text-right">R²</th>
                <th className="text-right">PICP (95%)</th>
                <th className="text-right">MPIW (t/ha)</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => {
                const isBest = model.rank === 1;
                return (
                  <tr key={model.name} className={isBest ? 'bg-primary-light/50' : ''}>
                    <td className="font-bold text-text">
                      {model.rank === 1 && <Trophy className="w-5 h-5 inline text-risk-moderate mr-1" />}
                      #{model.rank}
                    </td>
                    <td className="font-medium text-text">{model.name}</td>
                    <td className="font-mono text-body-sm text-text-muted">{model.type}</td>
                    <td className="text-body-sm text-text-muted">{model.features}</td>
                    <td className={`text-right font-mono ${model.mae === getBestValue('mae') ? 'text-risk-low font-medium' : ''}`}>{model.mae.toFixed(2)}</td>
                    <td className={`text-right font-mono ${model.rmse === getBestValue('rmse') ? 'text-risk-low font-medium' : ''}`}>{model.rmse.toFixed(2)}</td>
                    <td className={`text-right font-mono ${model.r2 === getBestValue('r2') ? 'text-risk-low font-medium' : ''}`}>{model.r2.toFixed(2)}</td>
                    <td className={`text-right font-mono ${model.picp === getBestValue('picp') ? 'text-risk-low font-medium' : ''}`}>{model.picp.toFixed(2)}</td>
                    <td className={`text-right font-mono ${model.mpiw === getBestValue('mpiw') ? 'text-risk-low font-medium' : ''}`}>{model.mpiw.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-caption text-text-muted mt-3 text-center">
          Green values indicate best performance for each metric. All models evaluated on identical temporal splits (2010-2018 train, 2019-2024 test).
        </p>
      </section>

      {/* Metric Charts */}
      <section aria-labelledby="charts-heading" className="grid lg:grid-cols-2 gap-6">
        <div className="card panel-raised p-6">
          <h2 id="charts-heading" className="font-serif text-heading-md text-text mb-4">Error Metrics Comparison</h2>
          <div className="chart-container h-96 flex items-center justify-center">
            <div className="text-center text-text-muted">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-body">Grouped bar chart: MAE, RMSE by model</p>
            </div>
          </div>
        </div>
        <div className="card panel-raised p-6">
          <h2 className="font-serif text-heading-md text-text mb-4">Uncertainty Metrics Comparison</h2>
          <div className="chart-container h-96 flex items-center justify-center">
            <div className="text-center text-text-muted">
              <LineChart className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-body">PICP vs MPIW trade-off visualization</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Importance */}
      <section aria-labelledby="importance-heading" className="grid lg:grid-cols-2 gap-6">
        <div className="card panel-raised p-6">
          <h2 id="importance-heading" className="font-serif text-heading-md text-text mb-4">Global Feature Importance (Combined Model)</h2>
          <div className="chart-container h-[400px] flex items-center justify-center">
            <div className="text-center text-text-muted">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-body">SHAP Summary Plot / Permutation Importance</p>
              <p className="text-body-sm mt-1">Top 20 features ranked by mean |SHAP|</p>
            </div>
          </div>
        </div>
        <div className="card panel-raised p-6">
          <h2 className="font-serif text-heading-md text-text mb-4">Partial Dependence (Key Features)</h2>
          <div className="chart-container h-[400px] flex items-center justify-center">
            <div className="text-center text-text-muted">
              <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-body">Rainfall, Temperature, Debt-to-Income, Lag Yield</p>
              <p className="text-body-sm mt-1">Marginal effect of each feature on predictions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Experiment Details */}
      <section aria-labelledby="details-heading">
        <h2 id="details-heading" className="font-serif text-heading-lg text-text mb-6">Experiment Details</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card panel-raised p-6">
            <h3 className="font-serif text-heading-sm text-text mb-4">Configuration</h3>
            <dl className="space-y-3 text-body-sm">
              <div className="flex justify-between"><dt className="text-text-muted">Experiment ID</dt><dd className="font-mono text-text">exp_2026_001</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Dataset Version</dt><dd className="font-mono text-text">FAOSTAT_v1.2.0 + ERA5_v2.0.1</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Feature Version</dt><dd className="font-mono text-text">feat_v3.1 (lags + anomalies + interactions)</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Random Seed</dt><dd className="font-mono text-text">42</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Validation Method</dt><dd className="font-mono text-text">TimeSeriesSplit(n_splits=5)</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Uncertainty Method</dt><dd className="font-mono text-text">Bootstrap (BCa, n=1000)</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Git Commit</dt><dd className="font-mono text-text">a1b2c3d4</dd></div>
            </dl>
          </div>
          <div className="card panel-raised p-6">
            <h3 className="font-serif text-heading-sm text-text mb-4">Known Limitations</h3>
            <ul className="space-y-2 text-body-sm text-text-muted">
              <li>• Extrapolation beyond observed climate range unreliable</li>
              <li>• Limited data for minor crops (< 500 observations)</li>
              <li>• No pest/disease variables included</li>
              <li>• Overrepresentation of major cereal crops</li>
              <li>• Better performance in temperate vs tropical regions</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}