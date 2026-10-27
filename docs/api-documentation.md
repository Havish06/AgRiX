# API Documentation

The FastAPI service runs at `http://localhost:8000` with interactive OpenAPI
docs at `/docs`. All routes are prefixed with `/api`.

## Prerequisite: run the pipeline

Data-dependent endpoints require registered snapshots and trained models.
Run once after starting the backend:

```
POST /api/pipeline/run
```

This ingests NASA POWER climate data and FAOSTAT/World Bank yield data,
builds the synthetic credit panel, and trains the full model zoo (20 models).
Before it completes, analysis endpoints return **HTTP 503** with a message
naming the missing piece — an intentional integrity guard, never fabricated
output.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Service/version health |
| POST | `/api/pipeline/run` | Ingest data + train model zoo |
| GET | `/api/datasets` | Registered snapshots with provenance |
| POST | `/api/data/validate` | Validate a tabular payload |
| GET | `/api/data/summary` | Dataset summary statistics |
| GET | `/api/statistics/summary` | Descriptive statistics |
| GET | `/api/statistics/distribution` | Fitted distribution diagnostics |
| GET | `/api/statistics/correlation` | Correlation matrix |
| POST | `/api/statistics/hypothesis` | Two-group hypothesis test |
| POST | `/api/models/train` | Train the full model zoo |
| GET | `/api/models/list` | Model cards for all artifacts |
| GET | `/api/models/evaluate` | Single model card by `registry_key` |
| GET | `/api/models/comparison` | Finance-only vs combined comparison |
| POST | `/api/predictions/yield` | Yield prediction with interval |
| POST | `/api/predictions/risk` | Risk assessment with interval |
| POST | `/api/forecast` | Multi-year yield forecast with intervals |
| POST | `/api/scenarios` | Monte Carlo scenario analysis |
| POST | `/api/explanations` | Permutation-importance explanation |
| GET | `/api/research/experiments` | Experiment history |

## Verified examples

All examples below were executed against the running API (seed-42 artifacts,
2026-10-27) and returned HTTP 200.

### Yield prediction

```
POST /api/predictions/yield
{"rainfall_mm": 900, "temperature_c": 20.5, "model_id": "ridge"}
```

Response: point yield **9.016 t/ha** with a 95% interval of
**[6.510, 12.566]** (ridge, climate_and_trend feature set).

### Risk assessment

```
POST /api/predictions/risk
{"region_code": "US-IA", "year": 2024,
 "feature_set": "combined", "model_id": "ridge"}
```

Response: composite risk **0.4687 → "Moderate"**, 95% interval
**[0.435, 0.507]**, top driver `interest_rate_pct` (0.499). The response is
explicitly labelled as based on a synthetic financial panel.

### Forecast

```
POST /api/forecast
{"crop_code": "cereal", "horizon": 3, "model": "ridge"}
```

Response (trend + residual bootstrap intervals):

| Year | Forecast (t/ha) | 95% interval |
|------|-----------------|--------------|
| 2025 | 8.756 | [7.677, 9.652] |
| 2026 | 8.907 | [8.188, 9.847] |
| 2027 | 8.978 | [8.206, 9.709] |

### Scenario analysis

```
POST /api/scenarios
{"crop_code": "cereal", "scenario": "severe", "n_simulations": 500}
```

Response: mean simulated yield **8.689 t/ha**, yield-loss probability
**0.002**, category **Low**; scenario inputs shift rainfall from 537.79 mm to
322.67 mm and temperature from 20.6 °C to 24.1 °C. The frontend's default
payload (`maize` / `normal` / 1000 simulations) also returns 200.

## Request schemas

All request models reject unknown fields (`extra="forbid"`); an unexpected
key returns HTTP 422.

- **YieldPredictionRequest** — `rainfall_mm` and `temperature_c` required;
  `region_code` (default "US"), `crop_code` (default "maize"), `year`,
  `soil_moisture`, `fertilizer_kg_ha`, `model_id` (default "ridge").
- **RiskAssessmentRequest** — `region_code` and `year` required; `crop_code`,
  `financial_indicators`, `climate_variables`, `agricultural_variables`,
  `feature_set` (default "combined"), `model_id` (default "ridge").
- **ForecastRequest** — `horizon` 1–10 (default 3), `model` (default "ridge"),
  `region_code`, `crop_code`, `uncertainty_method`.
- **ScenarioRequest** — `scenario` in {normal, dry, heat, severe, custom},
  `custom_params` for custom, `n_simulations` 100–10000 (default 1000),
  `confidence_level` (default 0.95).
- **HypothesisRequest** — `column`, `group_a`, `group_b` required;
  `dataset` (default "risk_panel"), `group_column` (default "region_code").

## Error behaviour

| Status | Meaning |
|--------|---------|
| 400 | Invalid dataset/column/model reference, or service-level validation failure |
| 404 | Unknown `registry_key` or model id |
| 422 | Payload schema violation (unknown or missing fields) |
| 500 | Pipeline failure (returned with the underlying message) |
| 503 | Snapshots or models not registered yet — run `/api/pipeline/run` |