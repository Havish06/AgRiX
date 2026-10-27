# Experiment Log

Dated, append-only record of training runs. Metrics enter this log only after
execution against a documented snapshot; every entry carries the split periods,
seed, uncertainty method, and limitations.

## 2026-10-27 — Full model zoo training run (seed 42)

**Configuration**

| Item | Value |
|---|---|
| Seed | 42 |
| Bootstrap replicates | 200 (case bootstrap, 95% level) |
| Yield split | train ≤ 2014 · validation 2015–2019 · test 2020–2024 |
| Risk split | train ≤ 2015 · validation 2016–2020 · test 2021–2025 |
| Yield crop | crop with most observations (maize via FAOSTAT; cereal aggregate when the World Bank fallback is used) |
| Preprocessing | StandardScaler fitted on the training block only |
| Snapshots | NASA POWER monthly climate (checksummed), FAOSTAT/World Bank yields (checksummed), synthetic credit panel seed 42 |

**Results — yield task (target `yield_t_ha`, t/ha)**

| Feature set | Model | MAE | RMSE | R² | PICP 95% | MPIW |
|---|---|---|---|---|---|---|
| climate_only | mean_baseline | 2.273 | 2.277 | −332.79 | 0.00 | 0.742 |
| climate_only | linear | 2.091 | 2.094 | −281.36 | 0.00 | 1.193 |
| climate_only | ridge | 2.099 | 2.102 | −283.41 | 0.00 | 1.142 |
| climate_only | random_forest | 2.381 | 2.386 | −365.59 | 0.00 | 1.057 |
| climate_only | xgboost | 2.345 | 2.419 | −375.81 | 0.00 | 1.698 |
| climate_and_trend | mean_baseline | 2.273 | 2.277 | −332.79 | 0.00 | 0.742 |
| climate_and_trend | linear | **0.091** | **0.118** | **0.097** | **1.00** | 1.051 |
| climate_and_trend | ridge | 0.143 | 0.169 | −0.850 | 1.00 | 1.043 |
| climate_and_trend | random_forest | 1.581 | 1.590 | −161.79 | 0.00 | 1.027 |
| climate_and_trend | xgboost | 1.403 | 1.417 | −128.27 | 0.00 | 1.145 |

**Results — risk task (target `credit_stress_rate`, synthetic proxy)**

| Feature set | Model | MAE | RMSE | R² | PICP 95% | MPIW |
|---|---|---|---|---|---|---|
| finance_only | mean_baseline | 0.086 | 0.106 | −0.097 | 0.20 | 0.030 |
| finance_only | linear | 0.080 | 0.100 | 0.016 | 0.28 | 0.086 |
| finance_only | ridge | 0.080 | 0.099 | 0.034 | 0.23 | 0.081 |
| finance_only | random_forest | 0.076 | 0.090 | 0.204 | 0.38 | 0.097 |
| finance_only | xgboost | 0.086 | 0.102 | −0.014 | 0.40 | 0.123 |
| combined | mean_baseline | 0.086 | 0.106 | −0.097 | 0.20 | 0.030 |
| combined | linear | 0.080 | 0.102 | −0.027 | 0.33 | 0.095 |
| combined | ridge | 0.080 | 0.101 | −0.000 | 0.33 | 0.090 |
| combined | random_forest | **0.075** | **0.089** | **0.226** | 0.33 | 0.095 |
| combined | xgboost | 0.084 | 0.101 | 0.004 | **0.42** | 0.122 |

**Findings**

1. `climate_only` fails out-of-sample: national yields trend upward with
   technology, so climate features alone miss the 2020–2024 levels (large
   negative R², 0% interval coverage). The mean baseline beats every
   climate-only model.
2. `climate_and_trend` + linear generalises (MAE 0.091 t/ha, 5/5 test years
   inside the 95% interval). Tree-based models cannot extrapolate the year
   trend past the training range and fail despite the added feature.
3. On the risk task `combined` marginally beats `finance_only`
   (R² 0.226 vs 0.204, random forest). All risk models under-cover their 95%
   intervals (PICP 0.20–0.42). With ~30 annual observations per state and a
   synthetic target, the evidence that climate features improve credit-risk
   assessment is **not yet established** at this sample size.

**Artifacts** — `backend/model_registry/training_summary.json` (full metrics),
`backend/model_registry/registry.json` (model cards),
`backend/model_registry/*.pkl` (fitted models + scalers).

**Limitations** — national aggregates only; growing-season climate only;
5 test years (coverage estimates themselves uncertain); risk target is a
synthetic proxy, not observed defaults; tree models cannot extrapolate trends.

## 2026-10-07 — Baseline application verification

- Verified repository requirements and architecture documents.
- Fixed backend provider-cache syntax and added checksum calculation.
- Added NASA POWER public-provider implementation.
- Added API and provider-cache tests.
- Verified frontend type checking, linting, formatting, tests, and production
  build.
- No scientific experiment was run because no yield or financial snapshot is
  present.

## Experiment policy

Metrics must only be added here after execution against a documented public
snapshot. Each entry must include the snapshot checksum, feature version,
training/validation/test periods, random seed, model configuration, uncertainty
method, and limitations.