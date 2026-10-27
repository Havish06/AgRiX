# AgRiX — Agricultural Credit Risk under Climate and Yield Variability

AgRiX is an end-to-end, uncertainty-aware research instrument for studying one
question:

> **Can agricultural and climate information improve financial-risk assessment
> for agricultural lending compared with financial information alone?**

It ingests real public data (NASA POWER climate, FAOSTAT/World Bank yields),
generates a documented **synthetic** credit panel (no public farm-loan outcome
data exists), trains a comparable model zoo on chronological splits, and serves
every estimate **with 95% prediction intervals, provenance, and explicit
limitations** through a FastAPI backend and a Next.js research workspace.

Status (2026-10-27): **fully operational.** Data ingested, models trained,
tests passing, all API endpoints verified.

---

## Why this project exists

Agricultural lending portfolios are exposed to climate-driven yield shocks, but
traditional credit models price borrowers on financial ratios alone. AgRiX
builds the comparison instrument: the same panel, the same splits, the same
uncertainty machinery — once with finance-only features, once with climate and
yield features added — so the marginal value of agricultural information can be
*measured* rather than asserted.

Three integrity rules shape everything:

1. **No fabricated data.** Real sources are used wherever they exist. Where
   they do not (farm-loan outcomes), the data is synthetic, seeded, and every
   row carries `synthetic=True`.
2. **No point estimates without intervals.** Every prediction endpoint returns
   a bootstrap prediction interval and states its method.
3. **Chronological validation only.** Training/validation/test splits respect
   time order, because random shuffles leak future information in time series.

## What the system does today

| Capability | Status |
|---|---|
| NASA POWER monthly climate ingestion (8 US Corn Belt states, 1990–2025) | ✅ Real data, checksummed snapshots |
| FAOSTAT US national yields with World Bank fallback | ✅ Real data, fallback recorded in metadata |
| Synthetic agricultural credit panel (seed 42) | ✅ Seeded generator, documented |
| Feature engineering (yield matrix, risk panel, state climate) | ✅ |
| Model zoo training: mean baseline, linear, ridge, random forest, XGBoost | ✅ 20 models (2 tasks × 2 feature sets × 5 models) |
| Bootstrap 95% prediction intervals on every model | ✅ Case bootstrap |
| Model registry with model cards, metrics, limitations | ✅ `backend/model_registry/` |
| REST API: predictions, risk assessment, forecast, scenarios, data endpoints | ✅ All verified |
| Next.js dashboard: overview, source check, model lab, scenarios, forecast, research, settings | ✅ |
| Automated test suite | ✅ `backend/tests/` |

## Project structure

```text
frontend/                Next.js 14 App Router workspace
  app/(dashboard)/       Overview, analysis, model-lab, scenarios, forecast,
                         research, settings pages
  lib/api/               Typed API client + TanStack Query hooks
backend/                 FastAPI service
  app/api/               Routes + strict Pydantic request models
  app/data/providers/    NASA POWER, FAOSTAT, World Bank, synthetic finance
  app/ml/                Feature builders, model zoo, bootstrap intervals
  app/services/          Ingestion pipeline, training, inference, storage
  app/models/            SQLAlchemy 2.0 models (regions, crops, observations…)
  data/                  Snapshots, feature matrices, SQLite database
  model_registry/        registry.json + trained artifacts (*.pkl)
  tests/                 pytest suite
docs/                    Method, dataset, model, API, experiment documentation
```

## Quick start

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload    # http://localhost:8000 (docs at /docs)
```

### 2. Run the data + training pipeline

The API exposes pipeline control; from the Settings page click **Run pipeline**
and **Train models**, or call directly:

```bash
curl -X POST http://localhost:8000/api/pipeline/ingest
curl -X POST http://localhost:8000/api/pipeline/train
```

Ingestion fetches NASA POWER + FAOSTAT (≈1–3 min depending on network), builds
feature matrices, and registers everything in SQLite. Training fits 20 models
with 200-replicate bootstrap intervals.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                      # http://localhost:3000
```

## Data sources — what is real and what is synthetic

| Source | Content | Coverage | Real? |
|---|---|---|---|
| **NASA POWER** (MERRA-2) | Monthly rainfall (`PRECTOTCORR`) + temperature (`T2M`) at state centroids | 8 states, 1990–2025 | ✅ Public, no key |
| **FAOSTAT QCL** | US national crop yields (maize, wheat, soybean) | 1990–latest | ✅ Public |
| **World Bank** `AG.YLD.CREL.KG` | Cereal-aggregate yield fallback | 1990–latest | ✅ Public — used when the FAOSTAT origin is down (HTTP 521); the substitution is recorded in the snapshot metadata, never hidden |
| **AgRiX synthetic generator** | Credit panel: loan exposure, interest rate, debt-service coverage, commodity price index, credit-stress rate | 8 states, 1990–2025, seed 42 | ⚠️ Synthetic by design — see below |

**Why synthetic credit data?** Public farm-loan default data does not exist at
the needed granularity. Rather than fabricate "real-looking" defaults, AgRiX
generates a transparent, seeded panel whose coupling to real climate runs
through national maize yield anomalies. Every risk result is labelled
`synthetic=True` and may never be quoted as an empirical default probability.

Every snapshot is stored as CSV + SHA-256 checksum + JSON metadata (provider,
access time, preprocessing steps) and registered in the database with row
counts and schema. See [docs/dataset-documentation.md](docs/dataset-documentation.md).

## Model zoo and results

Two tasks, two feature sets each, five models, one protocol:

- **Yield task** — predict national cereal yield (t/ha)
  - `climate_only`: growing-season rainfall + temperature
  - `climate_and_trend`: climate + `year` (carries the technology trend)
- **Risk task** — predict the synthetic credit-stress proxy
  - `finance_only`: financial indicators + log loan exposure
  - `combined`: finance + climate + yield anomaly

Models: `mean_baseline` (the bar every model must beat), `linear`, `ridge`,
`random_forest`, `xgboost`. All trained on chronological splits
(yield: train ≤2014, validate 2015–2019, test 2020–2024; risk: train ≤2015,
validate 2016–2020, test 2021–2025), scaled with train-block statistics only.

### Headline results (trained run 2026-10-27, seed 42)

| Task | Feature set | Model | Test MAE | Test R² | PICP 95% | MPIW |
|---|---|---|---|---|---|---|
| yield | climate_and_trend | **linear** | **0.091** | **0.097** | **1.00** | 1.051 |
| yield | climate_and_trend | ridge | 0.143 | −0.850 | 1.00 | 1.043 |
| yield | climate_and_trend | xgboost | 1.403 | −128.3 | 0.00 | 1.145 |
| yield | climate_only | linear | 2.091 | −281.4 | 0.00 | 1.193 |
| risk | finance_only | random_forest | 0.076 | **0.204** | 0.38 | 0.097 |
| risk | combined | random_forest | **0.075** | **0.226** | 0.33 | 0.095 |
| risk | combined | xgboost | 0.084 | 0.004 | **0.42** | 0.122 |

Full tables live in `backend/model_registry/training_summary.json` and
[docs/model-documentation.md](docs/model-documentation.md).

### What the results say

1. **Climate alone cannot forecast national yields out-of-sample.** Yields
   trend strongly upward (technology, seed genetics). Every `climate_only`
   model fails on the 2020–2024 test years (large negative R², 0% interval
   coverage). This is a *finding*, not a bug — the mean baseline beats them all.
2. **Adding the year trend fixes it.** `climate_and_trend` + linear tracks the
   held-out years (MAE 0.091 t/ha) with honest 95% intervals (5/5 test years
   covered). Tree-based models still fail because they cannot extrapolate a
   trend beyond the training range — a textbook limitation surfaced by the zoo.
3. **On the risk task, climate adds little — for now.** `combined`
   (random forest) edges out `finance_only` (R² 0.226 vs 0.204), and interval
   coverage is below the 95% target for all risk models. With ~30 annual
   observations per state and a synthetic target, the honest conclusion is that
   the evidence for climate improving credit-risk assessment is **not yet
   established** at this sample size. The instrument is built; stronger claims
   need real loan outcomes and longer histories.

## API overview

Base URL `http://localhost:8000`, OpenAPI at `/docs`. Key endpoints:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Readiness incl. `data_ingested`, `models_trained` |
| `/api/datasets` | GET | Registered snapshots + provenance metadata |
| `/api/data/summary` | GET | Per-matrix statistics (rows, missingness, duplicates) |
| `/api/data/validate` | POST | Structural validation of a submitted table |
| `/api/models` | GET | Model cards from the registry |
| `/api/predictions/yield` | POST | Yield point estimate + 95% bootstrap interval |
| `/api/predictions/risk` | POST | Composite risk score, components, drivers + interval |
| `/api/forecast` | POST | Multi-year yield forecast (trend + residual bootstrap) |
| `/api/scenarios` | POST | Monte-Carlo stress scenarios (normal/dry/heat/severe/custom) |
| `/api/pipeline/ingest`, `/api/pipeline/train` | POST | Pipeline control |

Verified example responses and full request schemas are in
[docs/api-documentation.md](docs/api-documentation.md).

## Research integrity

AgRiX does not fabricate datasets, metrics, citations, or default
probabilities. Results must never be quoted as empirical default
probabilities; the credit target is a synthetic proxy. Every registered model
carries a model card with features, split periods, metrics, interval method,
and known limitations. See:

- [docs/methodology.md](docs/methodology.md) — method and validation protocol
- [docs/dataset-documentation.md](docs/dataset-documentation.md) — sources, fallback policy, synthetic panel
- [docs/model-documentation.md](docs/model-documentation.md) — zoo, results, interpretation
- [docs/experiment-log.md](docs/experiment-log.md) — dated record of training runs
- [docs/api-documentation.md](docs/api-documentation.md) — endpoint reference
- [docs/user-manual.md](docs/user-manual.md) — dashboard walkthrough

## Testing

```bash
cd backend
pytest                          # unit + service tests
```

The suite covers provider parsing/caching, feature builders, split integrity,
bootstrap intervals, validation rules, and API contracts. Frontend checks:
`npm run lint` and `npx tsc --noEmit` in `frontend/`.

## Limitations (read before using any number)

- National-level yield aggregates; no sub-national or farm-level resolution.
- Growing-season rainfall/temperature only — extremes, timing, and planting
  dates are not modelled.
- Few test years (5): interval-coverage estimates are themselves uncertain.
- The credit target is synthetic; results are proxy-risk illustrations.
- Tree models cannot extrapolate trends beyond the training range.
</content>
</content>