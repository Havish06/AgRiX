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
| `random_forest` | Bagged trees, seeded; hyperparameters tuned |
| `xgboost` | Gradient boosting, seeded; early stopping on the validation block |

## Protocol

- **Chronological splits only** — yield: train ≤ 2014, validate 2015–2019,
  test 2020–2024; risk: train ≤ 2015, validate 2016–2020, test 2021–2025.
  Random shuffles are forbidden: they leak future information in time series.
- **Time-aware hyperparameter tuning** — `RandomizedSearchCV` given exactly one
  candidate split (train rows → validation rows): no fold ever sees a future
  row and years are never shuffled. The iteration budget is capped by the
  validation block size (`n_iter = min(combinations, max(8, 2·len(val)))`), so
  there is no grid explosion. XGBoost candidates stop adding trees when the
  validation block stops improving (25-round patience, MAE), and the final
  model is given exactly that tree count. The final fit uses train + validation
  rows; the test block stays untouched.
- **Leakage-safe scaling** — `StandardScaler` fitted on the training block
  only; the scaler is stored with each artifact.
- **Calibrated uncertainty on every model** — 200-replicate case bootstrap for
  the sampling spread, unioned with a split-conformal half-width calibrated on
  held-out validation residuals (`ceil((n+1)·0.95)/n` quantile of |residuals|),
  so nominal 95% coverage is a property of the method, not a hope. When the
  validation block is too small to calibrate (the national yield series has
  5 validation rows), the card reports bootstrap-only intervals honestly.
  Point metrics and interval metrics are computed on the same test rows so
  they describe one model.
- **Feature importance** — permutation importance (10 repeats) on the test
  block, recorded in each model card.
- **Registry** — every fitted model is persisted (`backend/model_registry/*.pkl`)
  with a model card: features, target, split periods, seed, tuned
  hyperparameters, validation and test metrics, PICP/MPIW, interval method,
  limitations, and intended/non-intended use. Cards are served by
  `GET /api/models`.

## Results (run 2026-10-28, seed 42, model version 1.1.0)

Headline table (full 20-model tables in
[experiment-log.md](experiment-log.md) and
`backend/model_registry/training_summary.json`):

| Task | Feature set | Model | Test MAE | Test R² | PICP 95% | MPIW |
|---|---|---|---|---|---|---|
| yield | climate_and_trend | **random_forest** | **0.121** | −0.304 | 0.00 | 1.062 |
| yield | climate_and_trend | ridge | 0.251 | −3.843 | **1.00** | 1.051 |
| yield | climate_only | linear | 1.676 | −184.7 | 0.00 | 1.193 |
| risk | finance_only | ridge | **0.068** | 0.308 | **1.00** | 0.433 |
| risk | finance_only | random_forest | 0.069 | **0.325** | **1.00** | **0.369** |
| risk | combined | random_forest | 0.069 | 0.315 | 0.97 | 0.379 |
| risk | combined | xgboost | 0.071 | 0.296 | **1.00** | 0.449 |

## Interpretation

1. **Climate alone cannot forecast national yields out-of-sample.** Yields
   trend strongly upward (technology, seed genetics). Every `climate_only`
   model fails on the 2020+ test years with large negative R² and 0% interval
   coverage; the mean baseline beats them all. This is a finding, not a defect.
2. **Adding the year trend makes errors small — with caveats.** With tuning
   and a final fit that includes the validation years, the random forest posts
   the best point MAE (0.121 t/ha) and ridge covers all 5 test years. Test R²
   is negative across the board because the 2020+ yields sit in a narrow, flat
   band that even the training mean approximates; absolute errors, not R², are
   the meaningful yardstick here.
3. **The risk-task coverage gap is fixed.** Split-conformal calibration lifted
   PICP from 0.20–0.42 (2026-10-27 run) to **0.97–1.00** for every risk model,
   at the honest cost of wider intervals (MPIW 0.37–0.51): the earlier narrow
   intervals simply missed. Time-aware tuning also improved point quality (best
   finance-only R² 0.325, up from 0.204).
4. **Climate still adds little to risk assessment — for now.** `combined` no
   longer beats `finance_only` once the baselines are tuned (best R² 0.315 vs
   0.325). With ~30 annual observations per state and a synthetic target, the
   claim that climate improves credit-risk assessment is not yet established
   at this sample size.

## Intended and non-intended use

- **Intended:** research comparison of feature sets under uncertainty.
- **Non-intended:** production lending decisions; quoting risk outputs as
  empirical default probabilities (the risk target is synthetic).