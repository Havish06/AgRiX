'use client';

import { Shield, TrendingUp, AlertTriangle, Clock, BarChart3, Cloud, Leaf, Calculator } from 'lucide-react';

const statCards = [
  {
    title: 'Predicted Yield',
    value: '4.2 t/ha',
    interval: '[3.8, 4.6]',
    confidence: '95%',
    icon: Leaf,
    trend: '+5.2%',
    trendDirection: 'up' as const,
  },
  {
    title: 'Risk Score',
    value: '0.34',
    interval: '[0.28, 0.41]',
    confidence: '95%',
    icon: AlertTriangle,
    category: 'Moderate',
    trend: '-2.1%',
    trendDirection: 'down' as const,
  },
  {
    title: 'Yield Loss Probability',
    value: '18%',
    interval: '[12%, 25%]',
    confidence: '95%',
    icon: Cloud,
    trend: '+1.3%',
    trendDirection: 'up' as const,
  },
  {
    title: 'Expected Loss',
    value: '$12,400',
    interval: '[$8,200, $18,600]',
    confidence: '95%',
    icon: Calculator,
    trend: '-3.4%',
    trendDirection: 'down' as const,
  },
];

const quickActions = [
  { name: 'New Analysis', href: '/dashboard/analysis', icon: BarChart3, description: 'Run statistical analysis on selected region/crop' },
  { name: 'Generate Forecast', href: '/dashboard/forecast', icon: TrendingUp, description: 'Create yield forecasts with prediction intervals' },
  { name: 'Run Scenarios', href: '/dashboard/scenarios', icon: Cloud, description: 'Simulate climate stress scenarios' },
  { name: 'Compare Models', href: '/dashboard/model-lab', icon: Calculator, description: 'Compare model performance metrics' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-display-md text-text">Dashboard</h1>
          <p className="text-body text-text-muted mt-1">
            Current analysis overview for your selected region and crop
          </p>
        </div>
        <div className="panel-raised px-4 py-2 rounded-[4px] text-body-sm text-text-muted">
          <span className="font-mono">Region: US-IA</span>
          <span className="mx-2 text-border">|</span>
          <span className="font-mono">Crop: Maize</span>
          <span className="mx-2 text-border">|</span>
          <span className="font-mono">Period: 2010-2024</span>
        </div>
      </div>

      {/* Key Metrics */}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">Key Metrics</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <article
              key={i}
              className="card panel-raised p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="panel-inset p-2">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                {stat.category && (
                  <span className={`risk-badge risk-badge-${stat.category.toLowerCase()}`}>
                    {stat.category}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p className="metric-label">{stat.title}</p>
                <p className="metric-value font-serif text-heading-lg">{stat.value}</p>
                <div className="flex items-center gap-2 text-body-sm text-text-muted">
                  <span className="font-mono">{stat.interval}</span>
                  <span className="text-border">·</span>
                  <span>{stat.confidence} CI</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                <span className={`text-body-sm font-medium ${
                  stat.trendDirection === 'up' ? 'text-risk-high' : 'text-risk-low'
                }`}>
                  {stat.trendDirection === 'up' ? '↑' : '↓'} {stat.trend} vs baseline
                </span>
                <span className="text-caption text-text-muted">Updated 2h ago</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section aria-labelledby="actions-heading">
        <div className="flex items-center justify-between mb-6">
          <h2 id="actions-heading" className="font-serif text-heading-lg text-text">Quick Actions</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="card panel-raised p-5 group"
            >
              <div className="panel-inset p-3 w-12 h-12 rounded-[4px] mb-4 group-hover:scale-105 transition-transform">
                <action.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-heading-sm text-text mb-1">{action.name}</h3>
              <p className="text-body-sm text-text-muted">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity / Charts Placeholder */}
      <section aria-labelledby="charts-heading" className="grid lg:grid-cols-2 gap-6">
        <div className="card panel-raised p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 id="charts-heading" className="font-serif text-heading-md text-text">Yield Forecast</h2>
            <span className="text-caption text-text-muted">95% Prediction Interval</span>
          </div>
          <div className="chart-container h-80 flex items-center justify-center">
            <div className="text-center text-text-muted">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-body">Chart: Historical yield + forecast with intervals</p>
              <p className="text-body-sm mt-1">Connects to /api/forecast endpoint</p>
            </div>
          </div>
        </div>

        <div className="card panel-raised p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-heading-md text-text">Risk Drivers</h2>
            <span className="text-caption text-text-muted">SHAP Feature Importance</span>
          </div>
          <div className="chart-container h-80 flex items-center justify-center">
            <div className="text-center text-text-muted">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-body">Chart: Ranked risk drivers with direction</p>
              <p className="text-body-sm mt-1">Connects to /api/explanations endpoint</p>
            </div>
          </div>
        </div>
      </section>

      {/* Scenario Summary */}
      <section aria-labelledby="scenarios-heading" className="space-y-4">
        <h2 id="scenarios-heading" className="font-serif text-heading-lg text-text">Scenario Summary</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Scenario</th>
                <th className="text-right">Predicted Yield</th>
                <th className="text-right">Loss Probability</th>
                <th className="text-right">Risk Score</th>
                <th className="text-right">Expected Loss</th>
                <th className="text-right">Category</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Normal (Historical)', yield: '4.2 [3.8, 4.6]', loss: '18% [12%, 25%]', risk: '0.34 [0.28, 0.41]', loss$: '$12,400 [$8,200, $18,600]', category: 'Moderate' },
                { name: 'Dry (-20% Rainfall)', yield: '3.5 [3.1, 3.9]', loss: '32% [24%, 41%]', risk: '0.52 [0.44, 0.61]', loss$: '$21,800 [$15,200, $30,400]', category: 'High' },
                { name: 'Heat (+2°C)', yield: '3.8 [3.4, 4.2]', loss: '25% [18%, 33%]', risk: '0.43 [0.36, 0.52]', loss$: '$16,600 [$11,400, $23,800]', category: 'Moderate' },
                { name: 'Severe (Combined)', yield: '2.9 [2.5, 3.3]', loss: '48% [38%, 58%]', risk: '0.67 [0.58, 0.76]', loss$: '$32,400 [$24,100, $42,800]', category: 'High' },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="font-medium text-text">{row.name}</td>
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
      </section>
    </div>
  );
}