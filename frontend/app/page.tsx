'use client';

import Link from 'next/link';
import { ArrowRight, Shield, BarChart3, Cloud, Leaf, BookOpen, Github } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: Shield,
      title: 'Statistical Analysis Engine',
      description: 'Descriptive statistics, distribution fitting, correlation analysis, and hypothesis testing with full statistical inference',
    },
    {
      icon: BarChart3,
      title: 'ML Models with Baselines',
      description: 'Linear regression, Ridge, Lasso, Random Forest, XGBoost with proper baseline comparisons and temporal splits',
    },
    {
      icon: Cloud,
      title: 'Uncertainty Quantification',
      description: 'Bootstrap prediction intervals, quantile regression, conformal prediction, and Monte Carlo scenario simulations',
    },
    {
      icon: Leaf,
      title: 'Risk Aggregation',
      description: 'Transparent methodology combining agricultural, climate, yield-loss, and financial risk into composite scores',
    },
    {
      icon: BookOpen,
      title: 'Research-Grade Reproducibility',
      description: 'Versioned datasets, features, models, experiments with full audit trail and MLflow experiment tracking',
    },
    {
      icon: Github,
      title: 'Explainable & Transparent',
      description: 'Feature importance, SHAP values, coefficient interpretations, and clear proxy vs. default probability distinction',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="panel-raised p-2">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="font-serif text-heading-md text-text">AgRiX</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-body text-text-muted hover:text-text transition-colors">
                Features
              </Link>
              <Link href="#methodology" className="text-body text-text-muted hover:text-text transition-colors">
                Methodology
              </Link>
              <Link href="/dashboard" className="btn-raised btn-primary">
                Enter Application
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="panel-inset inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-in">
              <span className="text-caption text-text-muted uppercase tracking-wide">
                Research-Oriented Decision Support System
              </span>
            </div>
            <h1 className="font-serif text-display-xl text-text mb-6 animate-slide-up">
              Uncertainty-Aware Agricultural Credit Risk
              <br />
              <span className="text-primary">Under Climate Variability</span>
            </h1>
            <p className="text-body-lg text-text-muted max-w-3xl mx-auto mb-10 animate-slide-up">
              Transform raw agricultural, climatic, and financial data into statistical understanding,
              predictions with quantified uncertainty, and actionable financial-risk assessments.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
              <Link href="/dashboard" className="btn-raised btn-primary text-lg px-8 py-3">
                Launch Application
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="#methodology" className="btn-raised btn-secondary text-lg px-8 py-3">
                View Methodology
              </Link>
            </div>
          </div>
        </section>

        {/* Core Research Question */}
        <section id="methodology" className="py-20 px-4 sm:px-6 lg:px-8 bg-surface/50">
          <div className="max-w-7xl mx-auto">
            <div className="panel-raised p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="font-serif text-display-md text-text mb-6">
                    Core Research Question
                  </h2>
                  <blockquote className="border-l-4 border-primary pl-6 py-2 italic text-body-lg text-text/80">
                    &ldquo;Can agricultural and climate information improve financial-risk
                    assessment for agricultural lending when compared with financial information alone?&rdquo;
                  </blockquote>
                  <p className="mt-6 text-body text-text-muted">
                    AgRiX addresses this through a rigorous experimental framework comparing
                    finance-only baselines against models enriched with agricultural and climate variables,
                    with full uncertainty quantification and temporal integrity guarantees.
                  </p>
                  <ul className="mt-8 space-y-3 text-body text-text-muted">
                    <li className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span><strong>RQ1:</strong> How strongly are climatic variables associated with crop yield?</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span><strong>RQ2:</strong> Which variables contribute most strongly to estimated risk?</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span><strong>RQ3:</strong> Can yield forecasting provide early indicators of financial risk?</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span><strong>RQ4:</strong> Does agri+climate data improve risk prediction vs finance-only?</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span><strong>RQ5:</strong> How does prediction uncertainty affect financial-risk estimates?</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span><strong>RQ6:</strong> Can scenario analysis estimate adverse climate impacts?</span>
                    </li>
                  </ul>
                </div>
                <div className="panel-inset p-8">
                  <h3 className="font-serif text-heading-md text-text mb-6">Key Differentiators</h3>
                  <dl className="space-y-5">
                    {[
                      { term: 'Uncertainty-Aware', desc: 'Every prediction includes quantified uncertainty intervals' },
                      { term: 'Research-Grade', desc: 'Reproducible, auditable, statistically sound methodology' },
                      { term: 'Integrated', desc: 'Jointly models agricultural, climate, and financial domains' },
                      { term: 'Explainable', desc: 'Every risk score has traceable drivers and SHAP explanations' },
                      { term: 'Scenario-Capable', desc: 'Monte Carlo simulation of climate stress scenarios (1000+ runs)' },
                      { term: 'Honest', desc: 'Clear distinction between proxy scores and actual default probabilities' },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <dt className="font-medium text-text min-w-[140px]">{item.term}</dt>
                        <dd className="text-text-muted text-body-sm flex-1">{item.desc}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-display-md text-text mb-4">Capabilities</h2>
              <p className="text-body-lg text-text-muted max-w-2xl mx-auto">
                A comprehensive framework for agricultural financial risk assessment
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <article
                  key={i}
                  className="card panel-raised p-6 group"
                >
                  <div className="panel-inset p-3 w-12 h-12 rounded-[4px] mb-4 group-hover:scale-105 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-heading-sm text-text mb-2">{feature.title}</h3>
                  <p className="text-body-sm text-text-muted">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Architecture Overview */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-display-md text-text mb-4">System Architecture</h2>
              <p className="text-body-lg text-text-muted max-w-2xl mx-auto">
                End-to-end pipeline from data sources to risk assessments
              </p>
            </div>
            <div className="panel-raised p-8 overflow-x-auto">
              <pre className="font-mono text-body-sm text-text-muted whitespace-pre-wrap">
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA SOURCES                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ Agricultural│  │   Climate   │  │  Financial  │  │   Commodity     │   │
│  │    Data     │  │    Data     │  │    Data     │  │     Data        │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘   │
└─────────┼────────────────┼────────────────┼─────────────────┼────────────┘
          │                │                │                 │
          ▼                ▼                ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA INGESTION LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ DataProvider (Abstract)                                              │    │
│  │  ├── AgriculturalDataProvider (FAOSTAT)                             │    │
│  │  ├── ClimateDataProvider (NOAA, NASA POWER, ERA5)                  │    │
│  │  ├── FinancialDataProvider (Public/Synthetic)                       │    │
│  │  └── CommodityDataProvider                                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATA VALIDATION & PREPROCESSING                         │
│  Schema Validation → Missing Analysis → Duplicate Detection → Unit Norm     │
│  Outlier Analysis → Temporal Alignment → Geo Alignment → Feature Eng        │
│  Dataset Versioning & Lineage                                               │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODELING LAYER                                       │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────────┐  │
│  │ Statistical      │ │ Yield            │ │ Credit / Risk              │  │
│  │ Models           │ │ Models           │ │ Models                     │  │
│  │ - Descriptive    │ │ - Linear Reg     │ │ - Finance-only baseline    │  │
│  │ - Distributions  │ │ - Ridge/Lasso    │ │ - Agri + Climate           │  │
│  │ - Correlation    │ │ - Random Forest  │ │ - Combined                 │  │
│  │ - Hypothesis     │ │ - XGBoost        │ │ - Risk aggregation         │  │
│  └──────────────────┘ └──────────────────┘ └────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ UNCERTAINTY ENGINE: Bootstrap PI, Quantile Regression, Conformal, MC │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ SCENARIO ENGINE: Normal, Dry, Heat, Severe, Custom (1000+ sims)     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ EXPLAINABILITY: Coefficients, Permutation, SHAP, Partial Dependence │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FASTAPI BACKEND → NEXT.JS FRONTEND                  │
└─────────────────────────────────────────────────────────────────────────────┘
              </pre>
            </div>
          </div>
        </section>

        {/* Research Integrity */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="panel-deep p-8 lg:p-12">
              <h2 className="font-serif text-display-md text-text mb-6 text-center">
                Research Integrity Standards
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: 'No Fabrication',
                    description: 'Never invent datasets, results, metrics, significance values, or scientific claims. Every number traces to actual code execution on real data.',
                  },
                  {
                    title: 'Proxy vs. Actual',
                    description: 'Clear distinction between agricultural financial risk estimates (proxy) and empirically observed default probabilities. Never present proxy as ground truth.',
                  },
                  {
                    title: 'Temporal Integrity',
                    description: 'Chronological splits only for forecasting. No future data in training. All preprocessing fitted on training data only. Leakage audit before final results.',
                  },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="panel-inset p-4 w-16 h-16 rounded-[4px] mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl font-serif text-primary">{i + 1}</span>
                    </div>
                    <h3 className="font-serif text-heading-sm text-text mb-2">{item.title}</h3>
                    <p className="text-body-sm text-text-muted">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="panel-raised p-2">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <span className="font-serif text-heading-sm text-text">AgRiX</span>
              </div>
              <p className="text-body-sm text-text-muted">
                Uncertainty-aware statistical and machine learning framework for agricultural credit risk under climate and yield variability.
              </p>
            </div>
            <div>
              <h4 className="font-serif text-heading-sm text-text mb-4">Resources</h4>
              <ul className="space-y-2 text-body-sm text-text-muted">
                <li><a href="#" className="hover:text-text transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-text transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-text transition-colors">Methodology</a></li>
                <li><a href="#" className="hover:text-text transition-colors">Experiment Log</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif text-heading-sm text-text mb-4">Research</h4>
              <ul className="space-y-2 text-body-sm text-text-muted">
                <li><a href="#" className="hover:text-text transition-colors">Publications</a></li>
                <li><a href="#" className="hover:text-text transition-colors">Datasets</a></li>
                <li><a href="#" className="hover:text-text transition-colors">Model Cards</a></li>
                <li><a href="#" className="hover:text-text transition-colors">Reproducibility</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif text-heading-sm text-text mb-4">Community</h4>
              <ul className="space-y-2 text-body-sm text-text-muted">
                <li><a href="#" className="hover:text-text transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-text transition-colors">Contributing</a></li>
                <li><a href="#" className="hover:text-text transition-colors">Issues</a></li>
                <li><a href="#" className="hover:text-text transition-colors">Discussions</a></li>
              </ul>
            </div>
          </div>
          <div className="divider" />
          <p className="text-caption text-text-muted text-center mt-8">
            © 2026 AgRiX Contributors. Licensed under MIT. Built for research integrity.
          </p>
        </div>
      </footer>
    </div>
  );
}