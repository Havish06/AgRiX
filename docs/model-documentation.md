# Model Documentation

## The model zoo

Twenty models: two tasks × two feature sets × five algorithms, all trained
under one protocol so that feature sets can be compared like-for-like.

### Tasks and feature sets

**Yield task** — predict national cereal yield (`yield_t_ha`, t/ha):

| Feature set | Features |
|---|---|
| `climate_only` | growing-season rainfall (`gs_rainfall_mm`), growing-season mean temperature (`gs_mean_temp_c`) |
| `climate_and_trend` | the above + `year` (carries the technology trend) |

**Risk task** — predict the synthetic credit-stress proxy (`credit_stress_rate`):

| Feature set | Features |
|---|---|
| `finance_only` | interest rate, debt-service coverage, commodity price index, log loan exposure |
| `combined` | the above + growing-season rainfall, temperature, national yield anomaly |

### Algorithms

| Model id | Notes |
|---|---|
| `mean_baseline` | Training-mean predictor; the bar every model must beat |
| `linear` | OLS linear regression |
| `ridge` | L2-regularised linear model |
| `random_forest` | 300 trees, seeded |
| `xgboost` | Gradient boosting, seeded |

## Protocol

- **Chronological splits only** — yield: train ≤ 2014, validate 2015–2019,
  test 2020–2024; risk: train ≤ 2015, validate 2016–2020, test 2021–2025.
  Random shuffles are forbidden: they leak future information in time series.
- **Leakage-safe scaling** — `StandardScaler` fitted on the training block
  only; the scaler is stored with each artifact.
- **Uncertainty on every model** — 200-replicate case bootstrap at the 95%
  level; point metrics and interval metrics are computed on the same test rows
  so they describe one model.
- **Feature importance** — permutation importance (10 repeats) on the test
  block, recorded in each model card.
- **Registry** — every fitted model is persisted (`backend/model_registry/*.pkl`)
  with a model card: features, target, split periods, seed, validation and test
  metrics, PICP/MPIW, interval method, limitations, and intended/non-intended
  use. Cards are served by `GET /api/models`.

## Results (run 2026-10-27, seed 42)

Headline table (full 20-model tables in
[experiment-log.md](experiment-log.md) and
`backend/model_registry/training_summary.json`):

| Task | Feature set | Model | Test MAE | Test R² | PICP 95% | MPIW |
|---|---|---|---|---|---|---|
| yield | climate_and_trend | **linear** | **0.091** | **0.097** | **1.00** | 1.051 |
| yield | climate_and_trend | ridge | 0.143 | −0.850 | 1.00 | 1.043 |
| yield | climate_only | linear | 2.091 | −281.4 | 0.00 | 1.193 |
| risk | finance_only | random_forest | 0.076 | 0.204 | 0.38 | 0.097 |
| risk | combined | random_forest | **0.075** | **0.226** | 0.33 | 0.095 |

## Interpretation

1. **Climate alone cannot forecast national yields out-of-sample.** Yields
   trend strongly upward (technology, seed genetics). Every `climate_only`
   model fails on 2020–2024 with large negative R² and 0% interval coverage;
   the mean baseline beats them all. This is a finding, not a defect.
2. **Adding the year trend fixes the linear models.** `climate_and_trend` +
   linear tracks the held-out years (MAE 0.091 t/ha) with honest 95% intervals
   (5/5 covered). Tree-based models still fail: they cannot extrapolate a
   trend beyond the training range.
3. **On the risk task, climate adds little — for now.** `combined` edges out
   `finance_only` (R² 0.226 vs 0.204) and all risk models under-cover their
   95% intervals (PICP 0.20–0.42). With ~30 annual observations per state and
   a synthetic target, the claim that climate improves credit-risk assessment
   is not yet established at this sample size.

## Intended and non-intended use

- **Intended:** research comparison of feature sets under uncertainty.
- **Non-intended:** production lending decisions; quoting risk outputs as
  empirical default probabilities (the risk target is synthetic).