# AgRiX Core Platform - Requirements

## 1. Project Context

AgRiX is an uncertainty-aware statistical and machine learning framework for agricultural credit risk under climate and yield variability. It is a research-oriented software project, not a simple ML demo.

## 2. Functional Requirements

### 2.1 Data Ingestion

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-DI-01 | Implement abstract `DataProvider` interface with concrete providers for Agricultural, Climate, Financial, and Commodity data | P0 |
| FR-DI-02 | Support FAOSTAT as primary agricultural data source (crop yield, area, production) | P0 |
| FR-DI-03 | Support NOAA, NASA POWER, ERA5 as climate data sources (rainfall, temperature, soil moisture) | P0 |
| FR-DI-04 | Support public agricultural credit datasets and synthetic financial profiles for financial data | P0 |
| FR-DI-05 | Support commodity price data (FAOSTAT, Alpha Vantage, Quandl) | P1 |
| FR-DI-06 | Cache all external API responses with TTL and versioning | P0 |
| FR-DI-07 | Work offline with local verified snapshots when external APIs unavailable | P0 |
| FR-DI-08 | Record provenance metadata (provider, URL, license, access date, coverage) for every dataset | P0 |

### 2.2 Data Validation & Preprocessing

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-DV-01 | Validate schema on ingestion (required fields, types, ranges) | P0 |
| FR-DV-02 | Detect and report missing values by variable and time period | P0 |
| FR-DV-03 | Detect duplicate rows (exact and near-duplicate) | P0 |
| FR-DV-04 | Enforce unit normalization (e.g., all rainfall in mm, yield in t/ha) | P0 |
| FR-DV-05 | Reject impossible values: negative yield, negative rainfall, temperature outside plausible range | P0 |
| FR-DV-06 | Align temporal observations to consistent frequency (annual, monthly) | P0 |
| FR-DV-07 | Align geographical identifiers using stable region crosswalk (ISO 3166) | P0 |
| FR-DV-08 | Detect target leakage (future information in features) | P0 |
| FR-DV-09 | Log transformation pipeline: rows received/rejected/corrected/retained, missing counts, outlier counts | P0 |
| FR-DV-10 | Version every dataset transformation with checksum | P0 |

### 2.3 Feature Engineering

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-FE-01 | Create lag features for time-series forecasting (yield, climate variables) | P0 |
| FR-FE-02 | Generate climate anomalies (deviation from historical mean) | P0 |
| FR-FE-03 | Compute rolling statistics (moving averages, std dev) over configurable windows | P0 |
| FR-FE-04 | Create interaction features (rainfall × temperature, fertilizer × soil moisture) | P1 |
| FR-FE-05 | Encode categorical variables (crop, region) with target encoding or one-hot | P0 |
| FR-FE-06 | Generate financial ratios (debt-to-income, loan-to-value, debt service coverage) | P0 |
| FR-FE-07 | Create yield-loss probability features from historical distribution | P1 |
| FR-FE-08 | Fit and apply scalers/encoders on training data only (no leakage) | P0 |

### 2.4 Statistical Analysis Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SA-01 | Compute descriptive statistics: mean, median, mode, variance, std dev, min, max, quartiles, IQR, skewness, kurtosis | P0 |
| FR-SA-02 | Fit candidate distributions: Normal, Log-normal, Gamma, Exponential, Poisson, Binomial | P0 |
| FR-SA-03 | Select distribution using visual diagnostics (Q-Q plots), goodness-of-fit tests (KS, Anderson-Darling), and AIC/BIC | P0 |
| FR-SA-04 | Compute Pearson and Spearman correlations with confidence intervals | P0 |
| FR-SA-05 | Compute partial correlations controlling for confounders | P1 |
| FR-SA-06 | Perform hypothesis tests: t-test, Welch's t-test, Mann-Whitney U, ANOVA, Kruskal-Wallis, chi-square, regression coefficient significance, permutation tests | P0 |
| FR-SA-07 | Select appropriate test based on assumptions (normality, equal variance, independence) | P0 |
| FR-SA-08 | Provide covariance matrix and correlation heatmaps | P0 |

### 2.5 Regression & Baseline Modeling

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RM-01 | Implement mean/median baseline for yield prediction | P0 |
| FR-RM-02 | Implement Multiple Linear Regression with full statistical inference (coefficients, SE, p-values, CI, R², adj-R², residuals) | P0 |
| FR-RM-03 | Implement Ridge, Lasso, Elastic Net with cross-validated regularization | P0 |
| FR-RM-04 | Implement Random Forest Regressor with permutation importance | P0 |
| FR-RM-05 | Implement XGBoost Regressor with SHAP explanations | P0 |
| FR-RM-06 | Support target variables: yield (t/ha), yield loss (%), agricultural risk score (0-1), default probability (when labeled data exists) | P0 |
| FR-RM-07 | Compare all models on same temporal splits with identical preprocessing | P0 |
| FR-RM-08 | Report MAE, RMSE, R², MAPE, PICP, MPIW for regression | P0 |
| FR-RM-09 | Report Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC, Calibration Error for classification | P1 |

### 2.6 Time-Series Forecasting

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-TF-01 | Enforce chronological train/validation/test splits (no random shuffle) | P0 |
| FR-TF-02 | Generate lag features respecting temporal ordering (only t-k where k>0) | P0 |
| FR-TF-03 | Implement statistical time-series baselines (ARIMA, ETS) | P1 |
| FR-TF-04 | Implement lag-augmented Random Forest and XGBoost for forecasting | P0 |
| FR-TF-05 | Implement LSTM/GRU ONLY if data volume > 10k samples and temporal structure justifies | P2 |
| FR-TF-06 | Produce forecasts with prediction intervals (lower, upper, confidence level) | P0 |
| FR-TF-07 | Support configurable forecast horizon (1-5 years) | P0 |
| FR-TF-08 | Validate no future data leakage in any preprocessing step | P0 |

### 2.7 Uncertainty Quantification

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-UQ-01 | Implement bootstrap prediction intervals (percentile and BCa) | P0 |
| FR-UQ-02 | Implement quantile regression forests for conditional quantiles | P0 |
| FR-UQ-03 | Implement conformal prediction (split conformal) for distribution-free intervals | P0 |
| FR-UQ-04 | Support Monte Carlo simulation for scenario analysis (1000+ simulations) | P0 |
| FR-UQ-05 | Report PICP (Prediction Interval Coverage Probability) and MPIW (Mean Prediction Interval Width) | P0 |
| FR-UQ-06 | Propagate uncertainty from yield prediction through to risk score | P0 |

### 2.8 Monte Carlo Scenario Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SC-01 | Define scenarios: Normal (historical), Dry (reduced rainfall), Heat (increased temperature), Severe (combined), Custom | P0 |
| FR-SC-02 | Allow user to adjust: rainfall multiplier, temperature offset, crop price, loan exposure | P0 |
| FR-SC-03 | Run 1000+ simulations per scenario sampling from fitted distributions | P0 |
| FR-SC-04 | Output yield distribution, yield-loss probability, risk score distribution, expected loss per scenario | P0 |
| FR-SC-05 | Results must come from actual model outputs, never hard-coded | P0 |

### 2.9 Risk Aggregation Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RA-01 | Compute Agricultural Risk from yield loss probability and climate exposure | P0 |
| FR-RA-02 | Compute Climate Exposure from rainfall deficit, temperature anomaly, drought index | P0 |
| FR-RA-03 | Compute Yield Loss Probability from forecast distribution | P0 |
| FR-RA-04 | Compute Financial Vulnerability from debt burden, loan-to-income, repayment history | P0 |
| FR-RA-05 | Aggregate into Composite Risk Score (0.00-1.00) with transparent, documented formula | P0 |
| FR-RA-06 | Map to risk categories: Low (0.00-0.24), Moderate (0.25-0.49), High (0.50-0.74), Very High (0.75-1.00) | P0 |
| FR-RA-07 | Make thresholds configurable, not hard-coded | P0 |
| FR-RA-08 | Compute Expected Loss = PD × EAD × LGD ONLY when real default labels exist; otherwise label as "Agricultural Financial Risk Estimate" | P0 |

### 2.10 Explainability

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-EX-01 | Provide global feature importance (permutation, SHAP summary) | P0 |
| FR-EX-02 | Provide local explanations per prediction (SHAP force, coefficient contributions) | P0 |
| FR-EX-03 | Provide partial dependence plots for key continuous features | P1 |
| FR-EX-04 | Ensure explanations correspond to actual model (no fake explanations) | P0 |
| FR-EX-05 | Display risk drivers as ranked bars with direction of effect | P0 |

### 2.11 Model Comparison & Experiment Tracking

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-MC-01 | Compare Model A (finance-only), Model B (agriculture-only), Model C (climate+agriculture), Model D (combined) | P0 |
| FR-MC-02 | Use identical temporal splits, preprocessing, and evaluation protocol | P0 |
| FR-MC-03 | Statistical test of difference (Diebold-Mariano for forecasts, paired t-test for cross-section) | P0 |
| FR-MC-04 | Track every experiment: dataset version, feature version, model type, hyperparameters, seed, periods, metrics, timestamp, git commit | P0 |
| FR-MC-05 | Support MLflow or equivalent for experiment tracking | P0 |
| FR-MC-06 | Version models with model cards (training data, features, target, period, validation, metrics, limitations, bias) | P0 |

### 2.12 API Endpoints

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-API-01 | `GET /api/health` - health check | P0 |
| FR-API-02 | `GET /api/datasets` - list available datasets with metadata | P0 |
| FR-API-03 | `POST /api/data/validate` - validate uploaded data | P0 |
| FR-API-04 | `GET /api/data/summary` - dataset summary statistics | P0 |
| FR-API-05 | `GET /api/statistics/summary` - descriptive statistics | P0 |
| FR-API-06 | `GET /api/statistics/distribution` - fitted distribution parameters and diagnostics | P0 |
| FR-API-07 | `GET /api/statistics/correlation` - correlation matrix | P0 |
| FR-API-08 | `POST /api/statistics/hypothesis` - run hypothesis test | P0 |
| FR-API-09 | `POST /api/models/train` - train model with config | P0 |
| FR-API-10 | `GET /api/models/evaluate` - evaluate model on test set | P0 |
| FR-API-11 | `GET /api/models/list` - list trained models | P0 |
| FR-API-12 | `POST /api/predictions/yield` - yield prediction with uncertainty | P0 |
| FR-API-13 | `POST /api/predictions/risk` - risk assessment | P0 |
| FR-API-14 | `POST /api/forecast` - yield forecast with intervals | P0 |
| FR-API-15 | `POST /api/scenarios` - scenario analysis | P0 |
| FR-API-16 | `POST /api/explanations` - model explanations | P0 |
| FR-API-17 | `GET /api/research/experiments` - experiment history | P0 |

### 2.13 Frontend Pages

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-FE-01 | Landing page: project identity, research problem, capabilities, methodology, enter application | P0 |
| FR-FE-02 | Dashboard: current analysis (region, crop, period), predicted yield, risk categories, yield forecast chart, risk drivers, scenario selector | P0 |
| FR-FE-03 | Analysis Workspace: select region, crop, year range, scenario, model → statistical summary, distribution, correlation, regression, prediction | P0 |
| FR-FE-04 | Forecast page: historical yield, forecast, prediction interval, uncertainty, model info, horizon | P0 |
| FR-FE-05 | Scenario page: sliders for rainfall, temperature, crop price, loan exposure; scenarios: Historical, Dry, Heat, Combined, Custom; outputs: yield, loss prob, risk score, expected loss, category | P0 |
| FR-FE-06 | Model Lab: compare models (RMSE, R², MAE, PICP) from actual experiment results | P0 |
| FR-FE-07 | Research page: expose dataset, period, features, models, validation, tests, confidence, uncertainty method, model version | P0 |

### 2.14 UI/UX Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-UI-01 | Use warm parchment/ivory backgrounds, forest green, olive, charcoal, muted brown | P0 |
| FR-UI-02 | Apply restrained skeuomorphism: inset panels, raised buttons, paper-like cards, physical toggles, embossed headers | P0 |
| FR-UI-03 | Smooth transitions (150-250ms ease-out) for tabs, cards, charts, sliders, scenarios | P0 |
| FR-UI-04 | Respect `prefers-reduced-motion` | P0 |
| FR-UI-05 | No AI-blue/purple gradients, no neon, no excessive glassmorphism, no glowing cards | P0 |
| FR-UI-06 | Charts readable, professional, prioritize information over decoration | P0 |
| FR-UI-07 | Keyboard navigation, semantic HTML, accessible labels, focus indicators, sufficient contrast | P0 |
| FR-UI-08 | Responsive: desktop, laptop, tablet | P0 |
| FR-UI-09 | Error states: user-friendly messages, developer logs for actual errors | P0 |
| FR-UI-10 | Loading states for async operations | P0 |

## 3. Non-Functional Requirements

### 3.1 Reproducibility

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-REP-01 | Every experiment reproducible from logged configuration (data version, features, model, seed, splits) | P0 |
| NFR-REP-02 | Centralized random seed (default 42) for all stochastic operations | P0 |
| NFR-REP-03 | Deterministic model training and prediction given same inputs | P0 |

### 3.2 Research Integrity

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-RI-01 | Never fabricate datasets, results, metrics, significance, citations, or claims | P0 |
| NFR-RI-02 | Clear distinction between proxy risk score and actual default probability | P0 |
| NFR-RI-03 | No temporal leakage in any forecasting task | P0 |
| NFR-RI-04 | Prefer interpretable baselines before complex models | P0 |
| NFR-RI-05 | Report limitations honestly | P0 |

### 3.3 Performance

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-PER-01 | API response < 2s for predictions, < 10s for scenario simulations | P1 |
| NFR-PER-02 | Background job queue for expensive experiments | P1 |
| NFR-PER-03 | UI remains responsive during long operations | P0 |

### 3.4 Security

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-SEC-01 | No hardcoded secrets; use `.env` (gitignored) | P0 |
| NFR-SEC-02 | API keys never exposed to frontend | P0 |
| NFR-SEC-03 | Input validation on all endpoints | P0 |
| NFR-SEC-04 | Rate limiting on public endpoints | P1 |
| NFR-SEC-05 | CORS restricted to configured origins | P0 |

### 3.5 Observability

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-OBS-01 | Structured JSON logging with correlation IDs | P0 |
| NFR-OBS-02 | Health check endpoint with dependency status | P0 |
| NFR-OBS-03 | Audit logs for data access, model training, predictions | P1 |

## 4. Constraints

- Python 3.11+, Node.js 20+
- PostgreSQL (production), SQLite (local development)
- No external paid APIs required for core functionality
- All code must pass lint, type-check, and test suites before merge
- Frontend must not contain ML logic

## 5. Out of Scope (Explicit Non-Goals)

- Generic crop recommendation
- Weather dashboard
- Loan calculator
- Chatbot
- "Predict crop with Random Forest" demo
- Fake banking system
- Black-box medical-style risk predictor
- UI-only project with meaningless ML

## 6. Acceptance Criteria

The system is accepted when:

1. All P0 requirements implemented and tested
2. Central research experiment (Finance-only vs Combined) runs and produces results
3. No data leakage detected in audit
4. All model predictions include uncertainty intervals
5. UI displays real backend data (no hard-coded charts)
6. All critical logic tests pass
7. Documentation complete (README, API docs, methodology, experiment log, user manual)
8. Full test suite passes in CI
