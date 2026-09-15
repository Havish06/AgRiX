# AgRiX Architecture Steering

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA SOURCES                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ Agricultural│  │   Climate   │  │  Financial  │  │   Commodity     │   │
│  │    Data     │  │    Data     │  │    Data     │  │     Data        │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘   │
└─────────┼────────────────┼────────────────┼─────────────────┼────────────┘
          │                │                │                 │
          ▼                ▼                ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA INGESTION LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ DataProvider (Abstract)                                              │    │
│  │  ├── AgriculturalDataProvider                                        │    │
│  │  ├── ClimateDataProvider                                             │    │
│  │  ├── FinancialDataProvider                                           │    │
│  │  └── CommodityDataProvider                                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATA VALIDATION & PREPROCESSING                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │  Schema     │ │  Missing    │ │  Duplicate  │ │  Unit               │   │
│  │  Validation │ │  Analysis   │ │  Detection  │ │  Normalization      │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │  Outlier    │ │  Temporal   │ │  Geo        │ │  Feature            │   │
│  │  Analysis   │ │  Alignment  │ │  Alignment  │ │  Engineering        │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Dataset Versioning & Lineage                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODELING LAYER                                       │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────────┐  │
│  │ Statistical      │ │ Yield            │ │ Credit / Risk              │  │
│  │ Models           │ │ Models           │ │ Models                     │  │
│  │                  │ │                  │ │                            │  │
│  │ - Descriptive    │ │ - Linear Reg     │ │ - Finance-only baseline    │  │
│  │ - Distributions  │ │ - Ridge/Lasso    │ │ - Agri + Climate           │  │
│  │ - Correlation    │ │ - Random Forest  │ │ - Combined                 │  │
│  │ - Hypothesis     │ │ - XGBoost        │ │ - Risk aggregation         │  │
│  │ - Regression     │ │ - Time-series    │ │                            │  │
│  └──────────────────┘ └──────────────────┘ └────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    UNCERTAINTY ENGINE                                │    │
│  │  • Bootstrap Prediction Intervals                                    │    │
│  │  • Quantile Regression                                               │    │
│  │  • Conformal Prediction                                              │    │
│  │  • Monte Carlo Simulation                                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    SCENARIO ENGINE                                   │    │
│  │  • Normal (historical)                                               │    │
│  │  • Dry (reduced rainfall)                                            │    │
│  │  • Heat (increased temperature)                                      │    │
│  │  • Severe (combined stress)                                          │    │
│  │  • Custom                                                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    EXPLAINABILITY                                    │    │
│  │  • Model Coefficients                                                │    │
│  │  • Permutation Importance                                            │    │
│  │  • SHAP Values                                                       │    │
│  │  • Partial Dependence                                                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FASTAPI BACKEND                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ /api/health │ │ /api/data   │ │ /api/stats  │ │ /api/models         │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ /api/predict│ │ /api/forecast│ │/api/scenario│ │ /api/explain        │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ /api/research│ │/api/experiments│ │/api/model-reg│ │/api/risk          │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       NEXT.JS FRONTEND                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐   │
│  │ Landing  │ │Dashboard │ │ Analysis │ │ Forecast │ │  Scenarios     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────────────┐  │
│  │Model Lab │ │ Research │ │ Settings │ │  Visualization Components    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend (Python 3.11+)
- **Framework**: FastAPI with async support
- **Validation**: Pydantic v2
- **Database**: SQLAlchemy 2.0 + Alembic (PostgreSQL/SQLite)
- **ML**: scikit-learn, XGBoost, SciPy, statsmodels
- **Stats**: NumPy, Pandas, SciPy, pingouin
- **Uncertainty**: MAPIE, conformal prediction libraries
- **Experiment Tracking**: MLflow
- **Testing**: pytest, hypothesis (property-based)

### Frontend (TypeScript/React)
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + CSS Variables for theming
- **Charts**: Recharts (primary), Plotly.js (advanced)
- **State**: React Query (TanStack Query) + Zustand
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + Playwright

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 15+ (production), SQLite (local)
- **Caching**: Redis (optional, for production)
- **Monitoring**: Structured logging (structlog), OpenTelemetry

## Data Flow Principles

1. **Immutability**: Raw data never modified; transformations create new versions
2. **Lineage**: Every derived dataset traces to source + transformation pipeline
3. **Versioning**: Datasets, features, models, experiments all versioned
4. **Reproducibility**: Same inputs + same code = same outputs (deterministic seeds)
5. **Validation**: Schema validation at every pipeline stage
6. **Auditability**: Structured logs for all transformations

## API Design Principles

- **RESTful** with consistent resource naming
- **Typed contracts** via Pydantic models (request/response)
- **Async-first** for I/O bound operations
- **Pagination** for list endpoints
- **Filtering/sorting** via query parameters
- **Error responses** with consistent structure
- **OpenAPI/Swagger** auto-generated documentation

## ML Pipeline Principles

1. **Baseline First**: Mean → Linear → Classical ML → Advanced ML → DL (if justified)
2. **Temporal Integrity**: Chronological splits only for forecasting
3. **Leakage Prevention**: No future data in training; fit transformers on train only
4. **Uncertainty Required**: Every prediction includes prediction intervals
5. **Explainability Required**: Every model produces feature importance
6. **Model Cards**: Every production model has documented card
7. **Experiment Tracking**: All runs logged with full configuration

## Database Schema Overview

```sql
-- Core tables
datasets (id, name, provider, version, metadata, created_at)
dataset_versions (id, dataset_id, version, file_path, checksum, rows, schema)
regions (id, code, name, level, parent_id, geometry)
crops (id, code, name, category, growing_season)
weather_observations (id, region_id, date, variables_json, source)
agricultural_observations (id, region_id, crop_id, year, yield, area, production, source)
financial_observations (id, region_id, year, indicators_json, source)
features (id, dataset_version_id, feature_set_version, feature_matrix_path, target_path)
experiments (id, name, config_json, status, created_at, completed_at)
models (id, experiment_id, name, type, version, hyperparameters, metrics, artifact_path)
predictions (id, model_id, dataset_version_id, scenario_id, predictions_path, created_at)
scenarios (id, name, climate_adjustments_json, description)
risk_assessments (id, prediction_id, risk_components_json, composite_score, category, created_at)
```

## Security Principles

- No hardcoded secrets (use `.env` with `.env.example`)
- API keys only in backend, never exposed to frontend
- Input validation on all endpoints
- Rate limiting on public endpoints
- CORS restricted to known origins
- Structured logging without sensitive data

## Observability

- **Structured JSON logging** with correlation IDs
- **Metrics**: Request latency, error rates, model inference time
- **Tracing**: OpenTelemetry for distributed tracing
- **Health checks**: `/api/health` with dependency checks
- **Audit logs**: Data access, model training, predictions

## Deployment Architecture

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         ┌─────────┐    ┌─────────┐    ┌─────────┐
         │ Frontend│    │ Frontend│    │ Frontend│  (Next.js)
         └────┬────┘    └────┬────┘    └────┬────┘
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ┌─────────────────┐
                    │   API Gateway   │  (FastAPI)
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         ┌─────────┐    ┌─────────┐    ┌─────────┐
         │ Backend │    │ Backend │    │ Backend │
         └────┬────┘    └────┬────┘    └────┬────┘
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ┌─────────────────┐
                    │  PostgreSQL     │
                    │   (Primary)     │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
             ┌───────────┐      ┌───────────┐
             │  Read     │      │  Cache    │
             │  Replica  │      │  (Redis)  │
             └───────────┘      └───────────┘
```

## Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Database | SQLite | PostgreSQL |
| Cache | In-memory | Redis |
| MLflow | Local file | Tracking server |
| Workers | 1 (reload) | 4+ (gunicorn) |
| HTTPS | No | Yes (TLS) |
| Secrets | `.env` | Vault/Secrets Manager |

## Scaling Considerations

- **Stateless API**: Horizontal scaling via replicas
- **Async Workers**: Background jobs for training, scenarios
- **Model Serving**: Separate inference service (future)
- **CDN**: Static assets via CDN
- **Database**: Read replicas for analytics queries