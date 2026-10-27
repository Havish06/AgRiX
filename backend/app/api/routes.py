"""API routes.

Endpoints return real, provenanced results once the ingestion and training
pipeline has run (`POST /api/pipeline/run`). Before that, analysis endpoints
return an explicit 503 explaining what is missing — never fabricated output.
"""

import asyncio
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.core.constants import DEFAULT_CONFIDENCE_LEVEL
from app.services import statistics as stats_service
from app.services import inference, ingest, store, training

router = APIRouter()


class ValidationRequest(BaseModel):
    """Tabular payload submitted for basic structural validation."""

    model_config = ConfigDict(extra="forbid")

    rows: list[dict[str, Any]] = Field(default_factory=list)
    required_columns: list[str] = Field(default_factory=list)


class ValidationResponse(BaseModel):
    """Deterministic validation summary for an uploaded table."""

    valid: bool
    rows_received: int
    columns: list[str]
    missing_required_columns: list[str]
    duplicate_rows: int
    missing_values: dict[str, int]
    errors: list[str]


class YieldPredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    region_code: str = "US"
    crop_code: str = "maize"
    year: int | None = None
    rainfall_mm: float
    temperature_c: float
    soil_moisture: float | None = None
    fertilizer_kg_ha: float | None = None
    model_id: str = "ridge"


class RiskAssessmentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    region_code: str
    crop_code: str = "maize"
    year: int
    financial_indicators: dict[str, float] = Field(default_factory=dict)
    climate_variables: dict[str, float] = Field(default_factory=dict)
    agricultural_variables: dict[str, float] = Field(default_factory=dict)
    feature_set: str = "combined"
    model_id: str = "ridge"


class ForecastRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    region_code: str = "US"
    crop_code: str = "maize"
    horizon: int = Field(default=3, ge=1, le=10)
    model: str = "ridge"
    uncertainty_method: str = "trend+residual bootstrap"


class ScenarioRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    region_code: str = "US-IA"
    crop_code: str = "maize"
    scenario: str = "normal"
    custom_params: dict[str, float] | None = None
    n_simulations: int = Field(default=1000, ge=100, le=10000)
    confidence_level: float = Field(default=DEFAULT_CONFIDENCE_LEVEL, gt=0.5, lt=1.0)


class HypothesisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dataset: str = "risk_panel"
    column: str
    group_column: str = "region_code"
    group_a: str
    group_b: str


def _pipeline_required() -> HTTPException:
    return HTTPException(
        status_code=503,
        detail=(
            "No verified dataset snapshot or trained model is registered yet. "
            "Run POST /api/pipeline/run to ingest public data and train the model zoo."
        ),
    )


def _require_snapshots() -> None:
    if not store.snapshots_present():
        raise _pipeline_required()


def _require_registry() -> None:
    if not (store.load_registry() or {}):
        raise _pipeline_required()


# ---------------------------------------------------------------------------
# Pipeline orchestration
# ---------------------------------------------------------------------------


@router.post("/pipeline/run", tags=["Pipeline"])
async def run_pipeline() -> dict[str, Any]:
    """Ingest public data, build features, train the model zoo, register all."""
    try:
        ingestion = await ingest.run_ingestion()
        summary = await asyncio.to_thread(training.train_all)
    except Exception as exc:  # surface a clear API error instead of a stack trace
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {exc}") from exc
    return {
        "status": "completed",
        "ingestion": ingestion,
        "models_trained": len(summary["models"]),
        "training_summary": summary,
    }


# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------


@router.get("/datasets", tags=["Data"])
async def list_datasets() -> list[dict[str, Any]]:
    """Registered dataset snapshots with checksummed provenance metadata."""
    datasets = []
    for key in store.SNAPSHOT_KEYS:
        loaded = store.load_snapshot(key)
        if loaded is None:
            continue
        frame, metadata = loaded
        datasets.append({**metadata, "snapshot_key": key, "rows": len(frame)})
    return datasets


@router.post("/data/validate", response_model=ValidationResponse, tags=["Data"])
async def validate_data(payload: ValidationRequest) -> ValidationResponse:
    """Check tabular shape, required columns, duplicates, and missing values."""

    columns = sorted({column for row in payload.rows for column in row})
    missing_required = sorted(set(payload.required_columns).difference(columns))
    missing_values = {
        column: sum(1 for row in payload.rows if row.get(column) is None) for column in columns
    }
    serialized_rows = [tuple(sorted(row.items())) for row in payload.rows]
    duplicate_rows = len(serialized_rows) - len(set(serialized_rows))
    errors = [f"Missing required column: {column}" for column in missing_required]
    return ValidationResponse(
        valid=not errors,
        rows_received=len(payload.rows),
        columns=columns,
        missing_required_columns=missing_required,
        duplicate_rows=duplicate_rows,
        missing_values=missing_values,
        errors=errors,
    )


@router.get("/data/summary", tags=["Data"])
async def dataset_summary(dataset: str = "yield_matrix") -> dict[str, Any]:
    _require_snapshots()
    try:
        return await asyncio.to_thread(stats_service.dataset_summary, dataset)
    except RuntimeError as exc:
        raise _pipeline_required() from exc


# ---------------------------------------------------------------------------
# Statistics
# ---------------------------------------------------------------------------


@router.get("/statistics/summary", tags=["Statistics"])
async def statistics_summary(dataset: str = "yield_matrix") -> dict[str, Any]:
    _require_snapshots()
    try:
        return await asyncio.to_thread(stats_service.dataset_summary, dataset)
    except RuntimeError as exc:
        raise _pipeline_required() from exc


@router.get("/statistics/distribution", tags=["Statistics"])
async def distribution_summary(dataset: str = "yield_matrix", column: str = "yield_t_ha") -> dict[str, Any]:
    _require_snapshots()
    try:
        return await asyncio.to_thread(stats_service.distribution_summary, dataset, column)
    except (RuntimeError, KeyError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/statistics/correlation", tags=["Statistics"])
async def correlation_summary(dataset: str = "risk_panel") -> dict[str, Any]:
    _require_snapshots()
    try:
        return await asyncio.to_thread(stats_service.correlation_summary, dataset)
    except RuntimeError as exc:
        raise _pipeline_required() from exc


@router.post("/statistics/hypothesis", tags=["Statistics"])
async def hypothesis_test(payload: HypothesisRequest) -> dict[str, Any]:
    _require_snapshots()
    try:
        return await asyncio.to_thread(
            stats_service.hypothesis_test,
            payload.dataset,
            payload.column,
            payload.group_column,
            payload.group_a,
            payload.group_b,
        )
    except (RuntimeError, KeyError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


@router.post("/models/train", tags=["Models"])
async def train_model() -> dict[str, Any]:
    """Train the full model zoo (all tasks, feature sets, model ids)."""
    _require_snapshots()
    try:
        return await asyncio.to_thread(training.train_all)
    except RuntimeError as exc:
        raise _pipeline_required() from exc


@router.get("/models/evaluate", tags=["Models"])
async def evaluate_model(registry_key: str) -> dict[str, Any]:
    _require_registry()
    registry = store.load_registry() or {}
    if registry_key not in registry:
        raise HTTPException(status_code=404, detail=f"Model '{registry_key}' not found")
    return registry[registry_key]


@router.get("/models/list", tags=["Models"])
async def list_models() -> list[dict[str, Any]]:
    """Model cards for every trained artifact (empty before training)."""
    if not (store.load_registry() or {}):
        return []
    return await asyncio.to_thread(training.model_cards)


@router.get("/models/comparison", tags=["Models"])
async def model_comparison() -> dict[str, Any]:
    """Finance-only vs combined comparison table for the central experiment."""
    _require_registry()
    registry = store.load_registry() or {}
    rows = []
    for record in registry.values():
        rows.append(
            {
                "registry_key": record["registry_key"],
                "task": record["task"],
                "feature_set": record["feature_set"],
                "model_id": record["model_id"],
                "test_mae": record["test_metrics"]["mae"],
                "test_rmse": record["test_metrics"]["rmse"],
                "test_r2": record["test_metrics"]["r2"],
                "picp_95": record["interval_metrics"]["picp_95"],
                "mpiw_95": record["interval_metrics"]["mpiw_95"],
                "synthetic_target": record["synthetic_target"],
            }
        )
    return {"models": rows}


# ---------------------------------------------------------------------------
# Predictions
# ---------------------------------------------------------------------------


@router.post("/predictions/yield", tags=["Predictions"])
async def predict_yield(payload: YieldPredictionRequest) -> dict[str, Any]:
    _require_registry()
    try:
        return await asyncio.to_thread(
            inference.predict_yield,
            payload.crop_code,
            payload.rainfall_mm,
            payload.temperature_c,
            payload.model_id,
        )
    except (RuntimeError, KeyError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/predictions/risk", tags=["Predictions"])
async def predict_risk(payload: RiskAssessmentRequest) -> dict[str, Any]:
    _require_registry()
    try:
        return await asyncio.to_thread(
            inference.predict_risk,
            payload.region_code,
            payload.year,
            payload.model_id,
            payload.feature_set,
        )
    except (RuntimeError, KeyError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# Forecast & scenarios
# ---------------------------------------------------------------------------


@router.post("/forecast", tags=["Forecast"])
async def forecast(payload: ForecastRequest) -> dict[str, Any]:
    _require_registry()
    try:
        return await asyncio.to_thread(
            inference.forecast, payload.crop_code, payload.horizon, payload.model
        )
    except (RuntimeError, KeyError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/scenarios", tags=["Scenarios"])
async def scenarios(payload: ScenarioRequest) -> dict[str, Any]:
    _require_registry()
    try:
        return await asyncio.to_thread(
            inference.run_scenario,
            payload.region_code,
            payload.crop_code,
            payload.scenario,
            payload.custom_params,
            payload.n_simulations,
            payload.confidence_level,
        )
    except (RuntimeError, KeyError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/explanations", tags=["Explainability"])
async def explanations(payload: dict[str, str]) -> dict[str, Any]:
    """Permutation-importance explanation for a registered model."""
    _require_registry()
    registry = store.load_registry() or {}
    key = payload.get("registry_key", "risk__combined__ridge")
    if key not in registry:
        raise HTTPException(status_code=404, detail=f"Model '{key}' not found")
    record = registry[key]
    return {
        "registry_key": key,
        "feature_importance": record["feature_importance"],
        "method": "permutation importance on the chronological test block",
    }


# ---------------------------------------------------------------------------
# Research registry
# ---------------------------------------------------------------------------


@router.get("/research/experiments", tags=["Research"])
async def list_experiments() -> list[dict[str, Any]]:
    """Experiment records reconstructed from the training summary."""
    summary_path = store.REGISTRY_DIR / "training_summary.json"
    if not summary_path.exists():
        return []
    import json

    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    return [
        {
            "experiment_id": record["registry_key"],
            "name": f"{record['task']} / {record['feature_set']} / {record['model_id']}",
            "config": {
                "features": record["features"],
                "target": record["target"],
                "seed": record["seed"],
                "training_period": record["training_period"],
                "test_period": record["test_period"],
            },
            "status": "completed",
            "created_at": record["trained_at"],
            "completed_at": record["trained_at"],
            "metrics": record["test_metrics"],
        }
        for record in summary.get("models", [])
    ]