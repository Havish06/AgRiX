'use client';

import { useState } from 'react';
import { Zap, Cloud, Sun, AlertTriangle, SlidersHorizontal } from 'lucide-react';

const scenarios = [
  { id: 'normal', name: 'Normal (Historical)', icon: Cloud, color: 'text-primary', description: 'Historical climate conditions' },
  { id: 'dry', name: 'Dry (-20% Rainfall)', icon: Sun, color: 'text-risk-moderate', description: 'Reduced rainfall scenario' },
  { id: 'heat', name: 'Heat (+2°C)', icon: AlertTriangle, color: 'text-risk-high', description: 'Increased temperature scenario' },
  { id: 'severe', name: 'Severe (Combined)', icon: Zap, color: 'text-risk-very-high', description: 'Combined climate stress' },
  { id: 'custom', name: 'Custom', icon: SlidersHorizontal, color: 'text-text', description: 'User-defined parameters' },
];

const scenarioResults = [
  { scenario: 'Normal (Historical)', yield: '4.2 [3.8, 4.6]', loss: '18% [12%, 25%]', risk: '0.34 [0.28, 0.41]', loss$: '$12,400 [$8,200, $18,600]', category: 'Moderate' },
  { scenario: 'Dry (-20% Rainfall)', yield: '3.5 [3.1, 3.9]', loss: '32% [24%, 41%]', risk: '0.52 [0.44, 0.61]', loss$: '$21,800 [$15,200, $30,400]', category: 'High' },
  { scenario: 'Heat (+2°C)', yield: '3.8 [3.4, 4.2]', loss: '25% [18%, 33%]', risk: '0.43 [0.36, 0.52]', loss$: '$16,600 [$11,400, $23,800]', category: 'Moderate' },
  { scenario: 'Severe (Combined)', yield: '2.9 [2.5, 3.3]', loss: '48% [38%, 58%]', risk: '0.67 [0.58, 0.76]', loss$: '$32,400 [$24,100, $42,800]', category: 'High' },
];

export default function ScenariosPage() {
  const [selectedScenario, setSelectedScenario] = useState('normal');
  const [rainfallMult, setRainfallMult] = useState(1.0);
  const [tempOffset, setTempOffset] = useState(0);
  const [cropPrice, setCropPrice] = useState(1.0);
  const [loanExposure, setLoanExposure] = useState(1.0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-serif text-display-md text-text">Scenario Analysis</h1>
        <p className="text-body text-text-muted mt-1">
          Simulate climate stress scenarios and assess agricultural financial risk
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Scenario Selection & Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card panel-raised p-6">
            <h2 className="font-serif text-heading-md text-text mb-4">Select Scenario</h2>
            <div className="space-y-2">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id)}
                  className={`w-full text-left p-4 rounded-[4px] transition-all duration-[var(--transition-fast)] flex items-center gap-3 ${
                    selectedScenario === scenario.id
                      ? 'bg-primary-light border border-primary'
                      : 'bg-surface border border-border hover:bg-surface-elevated'
                  }`}
                >
                  <scenario.icon className={`w-5 h-5 ${scenario.color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text truncate">{scenario.name}</p>
                    <p className="text-caption text-text-muted truncate">{scenario.description}</p>
                  </div>
                  {selectedScenario === scenario.id && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedScenario === 'custom' && (
            <div className="card panel-raised p-6">
              <h2 className="font-serif text-heading-md text-text mb-4">Custom Parameters</h2>
              <div className="space-y-4">
                <div>
                  <label className="label-field flex justify-between">
                    <span>Rainfall Multiplier</span>
                    <span className="font-mono text-text">{rainfallMult.toFixed(1)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={rainfallMult}
                    onChange={(e) => setRainfallMult(Number(e.target.value))}
                    className="w-full h-2 bg-surface rounded-lg appearance-none accent-primary"
                  />
                </div>
                <div>
                  <label className="label-field flex justify-between">
                    <span>Temperature Offset (°C)</span>
                    <span className="font-mono text-text">{tempOffset >= 0 ? '+' : ''}{tempOffset.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="-3"
                    max="5"
                    step="0.5"
                    value={tempOffset}
                    onChange={(e) => setTempOffset(Number(e.target.value))}
                    className="w-full h-2 bg-surface rounded-lg appearance-none accent-primary"
                  />
                </div>
                <div>
                  <label className="label-field flex justify-between">
                    <span>Crop Price Multiplier</span>
                    <span className="font-mono text-text">{cropPrice.toFixed(1)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={cropPrice}
                    onChange={(e) => setCropPrice(Number(e.target.value))}
                    className="w-full h-2 bg-surface rounded-lg appearance-none accent-primary"
                  />
                </div>
                <div>
                  <label className="label-field flex justify-between">
                    <span>Loan Exposure Multiplier</span>
                    <span className="font-mono text-text">{loanExposure.toFixed(1)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={loanExposure}
                    onChange={(e) => setLoanExposure(Number(e.target.value))}
                    className="w-full h-2 bg-surface rounded-lg appearance-none accent-primary"
                  />
                </div>
                <button className="btn-raised btn-primary w-full">Run Custom Scenario</button>
              </div>
            </div>
          )}

          <div className="card panel-raised p-6">
            <h2 className="font-serif text-heading-md text-text mb-4">Simulation Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="label-field">Number of Simulations</label>
                <select className="input-field">
                  <option value="1000">1,000</option>
                  <option value="5000">5,000</option>
                  <option value="10000">10,000</option>
                </select>
              </div>
              <div>
                <label className="label-field">Confidence Level</label>
                <select className="input-field">
                  <option value="0.90">90%</option>
                  <option value="0.95">95%</option>
                  <option value="0.99">99%</option>
                </select>
              </div>
              <button className="btn-raised btn-primary w-full" disabled={selectedScenario !== 'custom'}>
                {selectedScenario === 'custom' ? 'Run Simulation' : 'Select Custom to Run'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card panel-raised p-6">
            <h2 className="font-serif text-heading-md text-text mb-4">Scenario Comparison</h2>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th className="text-right">Predicted Yield (t/ha)</th>
                    <th className="text-right">Yield Loss Probability</th>
                    <th className="text-right">Risk Score</th>
                    <th className="text-right">Expected Loss</th>
                    <th className="text-right">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioResults.map((row, i) => (
                    <tr key={i} className={selectedScenario === scenarios[i]?.id ? 'bg-primary-light/50' : ''}>
                      <td className="font-medium text-text">{row.scenario}</td>
                      <td className="text-right font-mono text-body-sm">{row.yield}</td>
                      <td className="text-right font-mono text-body-sm">{row.loss}</td>
                      <td className="text-right font-mono text-body-sm">{row.risk}</td>
                      <td className="text-right font-mono text-body-sm">{row.loss$}</td>
                      <td className="text-right">
                        <span className={`risk-badge risk-badge-${row.category.toLowerCase()}`}>
                          {row.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card panel-raised p-6">
            <h2 className="font-serif text-heading-md text-text mb-4">Yield Distribution by Scenario</h2>
            <div className="chart-container h-96 flex items-center justify-center">
              <div className="text-center text-text-muted">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-body">Monte Carlo simulation results (1000+ runs)</p>
                <p className="text-body-sm mt-1">Kernel density estimates for each scenario</p>
              </div>
            </div>
          </div>

          <div className="card panel-raised p-6">
            <h2 className="font-serif text-heading-md text-text mb-4">Risk Score Distribution</h2>
            <div className="chart-container h-96 flex items-center justify-center">
              <div className="text-center text-text-muted">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-body">Risk score distributions across scenarios</p>
                <p className="text-body-sm mt=1">Shows uncertainty propagation from yield to risk</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}