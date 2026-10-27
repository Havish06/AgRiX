# AgRiX Project Report

## Purpose

AgRiX is a research instrument for one question: **can agricultural and
climate information improve financial-risk assessment for agricultural
lending compared with financial information alone?** It separates data
acquisition, validation, modelling, uncertainty quantification, and
presentation so every claim traces back to a versioned source.

## Operational status (2026-10-27)

The system is fully operational:

- Data pipeline ingests NASA POWER climate data and FAOSTAT/World Bank yield
  data, builds the synthetic credit panel, and registers checksummed
  snapshots.
- The full model zoo (2 tasks × 2 feature sets × 5 models = 20 models) trains
  end-to-end with chronological splits and bootstrap intervals.
- Every API endpoint has been exercised against the live service and returns
  real computed results (verified payloads and responses are in
  [api-documentation.md](api-documentation.md)).
- The frontend renders only backend-computed values; there are no hard-coded
  charts.

Integrity guards remain in place: analysis endpoints return an explicit 503
until the pipeline has run, and financial outputs are labelled synthetic.

## Headline results (seed 42, chronological test blocks)

Full tables are in [experiment-log.md](experiment-log.md). Key rows:

| Task | Feature set | Model | MAE | RMSE | R² | PICP | MPIW |
|------|-------------|-------|-----|------|----|------|------|
| yield | climate_only | mean_baseline | 2.273 | 2.277 | −332.79 | 0.00 | 0.742 |
| yield | climate_only | ridge | 2.099 | 2.102 | −283.41 | 0.00 | 1.142 |
| yield | climate_and_trend | linear | **0.091** | **0.118** | **0.097** | **1.00** | 1.051 |
| yield | climate_and_trend | ridge | 0.143 | 0.169 | −0.850 | 1.00 | 1.043 |
| risk | finance_only | random_forest | 0.076 | 0.090 | **0.204** | 0.38 | 0.097 |
| risk | combined | random_forest | 0.075 | 0.089 | **0.226** | 0.33 | 0.095 |

## What the results say

1. **Climate alone does not forecast yield out-of-sample.** The yield series
   is dominated by a technology trend; climate-only models miss it badly on
   the 2020–2024 test block (large negative R²).
2. **Adding the trend fixes generalization for linear models.**
   climate_and_trend + linear regression achieves MAE 0.091 t/ha with 100%
   interval coverage. Tree-based models cannot extrapolate the trend and
   still fail.
3. **Climate barely moves credit-risk accuracy.** On the synthetic panel,
   combined features improve the best R² from 0.204 to 0.226 over
   finance-only — within noise at this sample size. All risk models
   under-cover (PICP 0.20–0.42 vs the nominal 0.95). The honest conclusion:
   the hypothesis that climate data improves credit-risk assessment is **not
   yet established** here.

## Limitations

- Yield coverage is one aggregate series (US cereals) — no per-farm panel.
- The financial target is synthetic; results are risk *estimates*, never
  default probabilities.
- FAOSTAT availability is intermittent; the World Bank fallback is recorded
  in snapshot metadata.
- Small test blocks make single-run metric comparisons noisy.

## Reproducibility

Central seed 42; chronological splits only (yield: train ≤2014, val
2015–2019, test 2020–2024; risk: train ≤2015, val 2016–2020, test
2021–2025); scalers fitted on the training block only; 200 bootstrap
replicates for intervals; every snapshot checksummed; every model registered
with a full card. One command rebuilds everything: `POST /api/pipeline/run`.