# Dataset Documentation

AgRiX never trains on unprovenanced data. Every dataset enters the system as a
versioned snapshot with recorded provenance (provider, URL, license, access
date, coverage, request scope) and a SHA-256 checksum of the normalized
response. Snapshots are registered through `GET /api/datasets` and referenced
by key (e.g. `yield_matrix`, `risk_panel`).

## 1. Climate data — NASA POWER

| Property | Value |
|----------|-------|
| Provider | NASA POWER (public, no API key required) |
| Endpoint | `https://power.larc.nasa.gov/api/temporal/monthly/point` |
| Variables | `PRECTOTCORR` (precipitation, mm/day), `T2M` (2 m air temperature, °C) |
| Frequency | Monthly, aggregated to annual summaries per region coordinate |
| Coverage | Request-defined coordinates and years |

Monthly responses are normalized to one row per period and coordinate, cached
with a TTL, and checksummed. Precipitation is summed to annual millimetres;
temperature is averaged to annual °C. The exact request URL and access date
are retained with every snapshot.

## 2. Crop yield — FAOSTAT QCL (with World Bank fallback)

| Property | Value |
|----------|-------|
| Primary provider | FAOSTAT Quick Crop Query (QCL) |
| Variables | Yield, area harvested, production |
| Units | Normalized to tonnes per hectare (t/ha) |

FAOSTAT intermittently returns HTTP 521 responses. When the primary source is
unavailable, the ingestion layer falls back to the World Bank indicator
`AG.YLD.CREL.KG` (cereal yield, kg per hectare, converted to t/ha). **The
substitution is never silent**: the snapshot metadata records which source
actually supplied the data, so downstream results can be traced to the exact
origin.

## 3. Financial data — synthetic credit panel

No public agricultural-loan dataset with real default labels can be
redistributed for this project, so the financial panel is **synthetic**:

- Generated deterministically from the central seed (42).
- Every row carries `synthetic=True` — the flag propagates into model cards,
  API responses, and UI labels.
- The target is a composite **agricultural risk score (0–1)**, a constructed
  proxy. It is never reported as a default probability.

This keeps the full modelling protocol (splits, uncertainty, explainability)
exercisable end-to-end without fabricating financial claims.

## 4. Data quality rules

All snapshots pass the same validation gate before registration:

- Required columns, types, and plausible ranges enforced; impossible values
  (negative yield, negative rainfall, out-of-range temperatures) rejected.
- Exact duplicates detected and counted; missing values reported per column.
- Unit normalization enforced (rainfall mm, yield t/ha).
- Observations aligned to a consistent annual frequency and stable region
  identifiers.
- Chronological ordering verified; transformations are fitted on the training
  block only (no leakage).

Every validation run logs rows received / rejected / retained, missing counts,
and duplicate counts.

## 5. Reproducibility

| Mechanism | Detail |
|-----------|--------|
| Seed | Centralized, default 42 |
| Checksums | SHA-256 over each normalized provider response |
| Cache | TTL-based provider cache under `backend/cache` |
| Registry | Snapshots + model registry under `backend/data` and `backend/model_registry` |
| Pipeline | One entry point: `POST /api/pipeline/run` |