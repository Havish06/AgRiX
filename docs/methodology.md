# Methodology

## Research question

Can agricultural and climate information improve financial-risk assessment
for agricultural lending compared with financial information alone?

## Analysis protocol

1. **Acquire** public data without modifying raw responses.
2. **Record provenance** — provider, URL, license, access date, coverage,
   request scope, and a SHA-256 checksum of every normalized snapshot. If a
   fallback source substitutes for an unavailable primary (e.g. World Bank
   for FAOSTAT), the substitution is recorded in the snapshot metadata.
3. **Validate** required columns, ranges, missingness, duplicates, units,
   temporal ordering, and geographic identifiers. Reject impossible values.
4. **Prevent leakage** — chronological splits only (yield: train ≤2014,
   validation 2015–2019, test 2020–2024; risk: train ≤2015, validation
   2016–2020, test 2021–2025). Scalers and encoders are fitted on the
   training block only. Lag features use only t−k with k > 0.
5. **Compare feature sets fairly** — an interpretable finance-only baseline
   against progressively enriched agricultural/climate feature sets, using
   identical splits, preprocessing, and evaluation for every model.
6. **Quantify uncertainty** — every point estimate carries a 95% interval
   (200-replicate bootstrap; trend + residual bootstrap for forecasts).
   Report interval coverage (PICP) and width (MPIW) alongside MAE, RMSE, R².
7. **Report honestly** — limitations stated explicitly; proxy risk scores are
   never described as observed default probabilities; synthetic financial
   data is labelled as such in every output.

## Modelling choices

Mean/median baselines run first so every learned model must beat a trivial
competitor. Linear models come before tree ensembles because the yield series
is trend-dominated and trees cannot extrapolate trends. This ordering is a
deliberate application of "interpretable baselines before complex models".

## Reproducibility

Centralized seed 42 for all stochastic operations. Every experiment is
reproducible from its logged configuration (dataset version, features, model,
hyperparameters, seed, splits), and no result is considered reportable until
the source snapshot and configuration are checked into the experiment record
([experiment-log.md](experiment-log.md)).