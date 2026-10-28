# AgRiX Project Report

## Purpose

AgRiX is a research instrument for one question: **can agricultural and
climate information improve financial-risk assessment for agricultural
lending compared with financial information alone?** It separates data
acquisition, validation, modelling, uncertainty quantification, and
presentation so every claim traces back to a versioned source.

## Operational status (2026-10-28)

The system is fully operational:

- Data pipeline ingests NASA POWER climate data and FAOSTAT/World Bank yield
  data, builds the synthetic credit panel, and registers checksummed
  snapshots.
- The full model zoo (2 tasks × 2 feature sets × 5 models = 20 models) trains
  end-to-end with chronological splits, time-aware hyperparameter tuning
  (RandomizedSearchCV on the validation block, XGBoost early stopping), and
  calibrated intervals (case bootstrap ∪ split-conformal band).
- Every API endpoint has been exercised against the live service and returns
  real computed results (verified payloads and responses are in
  [api-documentation.md](api-documentation.md)).
- The frontend renders only backend-computed values; there are no hard-coded
  charts.

Integrity guards remain in place: analysis endpoints return an explicit 503
until the pipeline has run, and financial outputs are labelled synthetic.

## Headline results (seed 42, model version 1.1.0, chronological test blocks)

Full tables are in [experiment-log.md](experiment-log.md). Key rows:

| Task | Feature set | Model | MAE | RMSE | R² | PICP | MPIW |
|------|-------------|-------|-----|------|----|------|------|
| yield | climate_only | mean_baseline | 1.917 | 1.921 | −236.62 | 0.00 | 0.742 |
| yield | climate_only | linear | 1.676 | 1.698 | −184.66 | 0.00 | 1.193 |
| yield | climate_and_trend | random_forest | **0.121** | **0.142** | −0.304 | 0.00 | 1.062 |
| yield | climate_and_trend | ridge | 0.251 | 0.274 | −3.843 | **1.00** | 1.051 |
| risk | finance_only | ridge | **0.068** | **0.084** | 0.308 | **1.00** | 0.433 |
| risk | finance_only | random_forest | 0.069 | 0.083 | **0.325** | **1.00** | **0.369** |
| risk | combined | random_forest | 0.069 | 0.084 | 0.315 | 0.97 | 0.379 |

## What the results say

1. **Climate alone does not forecast yield out-of-sample.** The yield series
   is dominated by a technology trend; climate-only models miss it badly on
   the 2020+ test block (large negative R²).
2. **Adding the trend makes errors small — with caveats.** With tuning and a
   final fit that includes the validation years, the random forest reaches the
   best point MAE (0.121 t/ha) and ridge covers all 5 test years. Test R² is
   negative everywhere because the 2020+ yields sit in a narrow flat band;
   absolute errors, not R², are the yardstick. The yield validation block
   (5 rows) is too small to calibrate a conformal band, so those cards report
   bootstrap-only intervals honestly.
3. **The interval-coverage gap is fixed.** Split-conformal calibration lifted
   risk PICP from 0.20–0.42 to **0.97–1.00** for every risk model, at the
   honest cost of wider intervals (MPIW 0.37–0.51).
4. **Climate still barely moves credit-risk accuracy.** Once the baselines are
   tuned, combined features no longer beat finance-only (best R² 0.315 vs
   0.325) — within noise at this sample size. The honest conclusion: the
   hypothesis that climate data improves credit-risk assessment is **not yet
   established** here.

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
2021–2025); hyperparameters tuned on the validation block only
(RandomizedSearchCV, XGBoost early stopping); final fits on train + validation
rows; scalers fitted on the training block only; intervals = 200-replicate
case bootstrap ∪ split-conformal band from validation residuals; every
snapshot checksummed; every model registered with a full card. One command
rebuilds everything: `POST /api/pipeline/run` (or `/pipeline/ingest` +
`/pipeline/train` separately).