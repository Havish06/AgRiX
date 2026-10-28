"""Prediction, forecasting, and risk-assessment inference services.

Every function returns point estimates together with prediction intervals,
the method that produced them, and the model version, per the uncertainty
policy. If a required artifact is missing, an explanatory error is raised
instead of fabricating a result.
"""

from typing import Any

import numpy as np
import pandas as pd

from app.core.constants import DEFAULT_CONFIDENCE_LEVEL, DEFAULT_RANDOM_SEED
from app.ml.models import bootstrap_prediction_intervals, tuned_builder
from app.ml.uncertainty import interval_summary
from app.services import store

RISK_THRESHOLDS = [(0.25, "Low"), (0.50, "Moderate"), (0.75, "High"), (1.01, "Very High")]


def _resolve_crop(yield_matrix: pd.DataFrame, crop_code: str) -> str:
    """Return the requested crop, or the only available crop when the
    requested one is absent (e.g. cereal aggregate from the fallback source)."""
    crops = sorted(str(c) for c in yield_matrix["crop_code"].unique())
    if crop_code in crops:
        return crop_code
    if len(crops) == 1:
        return crops[0]
    raise KeyError(f"Crop '{crop_code}' not in yield matrix; available crops: {crops}")


def _require_registry_entry(task: str, feature_set: str, model_id: str) -> dict[str, Any]:
    registry = store.load_registry() or {}
    key = f"{task}__{feature_set}__{model_id}"
    if key not in registry:
        raise RuntimeError(
            f"Model '{key}' has not been trained. Run the training pipeline first."
        )
    return registry[key]


def predict_yield(
    crop_code: str,
    rainfall_mm: float,
    temperature_c: float,
    model_id: str = "ridge",
) -> dict[str, Any]:
    """Predict national yield for a climate scenario with a bootstrap interval."""
    record = _require_registry_entry("yield", "climate_only", model_id)
    bundle = store.load_artifact(record["registry_key"])
    if bundle is None:
        raise RuntimeError(f"Artifact for '{model_id}' is missing from the registry.")
    model, scaler = bundle["model"], bundle["scaler"]

    yield_matrix = store.load_feature_matrix("yield_matrix")
    crop_code = _resolve_crop(yield_matrix, crop_code)
    crop_rows = yield_matrix[yield_matrix["crop_code"] == crop_code]
    if crop_rows.empty:
        raise KeyError(f"No observations for crop '{crop_code}'")

    features = record["features"]
    X_train = crop_rows[features].to_numpy(dtype=float)
    y_train = crop_rows["yield_t_ha"].to_numpy(dtype=float)
    X_new = np.array([[rainfall_mm, temperature_c]], dtype=float)

    # Refit the registered (tuned) configuration, and widen the bootstrap
    # spread with the conformal half-width stored on the model card so live
    # intervals match the coverage the card reports.
    builder = tuned_builder(model_id, record.get("best_params"), DEFAULT_RANDOM_SEED)
    point, lower, upper = bootstrap_prediction_intervals(
        builder,
        X_train,
        y_train,
        X_new,
        n_bootstrap=200,
        seed=DEFAULT_RANDOM_SEED,
        confidence_level=DEFAULT_CONFIDENCE_LEVEL,
    )
    conformal_q = record["interval_metrics"].get("conformal_half_width")
    if conformal_q is not None:
        lower = np.minimum(lower, point - conformal_q)
        upper = np.maximum(upper, point + conformal_q)
    return {
        "predicted_yield_t_ha": float(point[0]),
        "prediction_interval": [float(lower[0]), float(upper[0])],
        "confidence_level": DEFAULT_CONFIDENCE_LEVEL,
        "model_version": record["version"],
        "uncertainty_method": record["interval_metrics"]["method"],
        "model_id": model_id,
        "crop_code": crop_code,
        "inputs": {"rainfall_mm": rainfall_mm, "temperature_c": temperature_c},
    }


def _risk_category(score: float) -> str:
    for threshold, category in RISK_THRESHOLDS:
        if score < threshold:
            return category
    return "Very High"


def predict_risk(
    region_code: str,
    year: int,
    model_id: str = "ridge",
    feature_set: str = "combined",
) -> dict[str, Any]:
    """Assess the (synthetic) credit-stress target for one state-year."""
    record = _require_registry_entry("risk", feature_set, model_id)
    bundle = store.load_artifact(record["registry_key"])
    if bundle is None:
        raise RuntimeError(f"Artifact for '{feature_set}/{model_id}' is missing.")
    model, scaler = bundle["model"], bundle["scaler"]

    risk_panel = store.load_feature_matrix("risk_panel")
    row = risk_panel[(risk_panel["region_code"] == region_code) & (risk_panel["year"] == year)]
    if row.empty:
        raise KeyError(f"No risk-panel row for {region_code} {year}")

    features = record["features"]
    train_rows = risk_panel[risk_panel["year"] <= int(record["training_period"].split("<= ")[1])]
    X_train = train_rows[features].to_numpy(dtype=float)
    y_train = train_rows["credit_stress_rate"].to_numpy(dtype=float)
    X_new = row[features].to_numpy(dtype=float)

    builder = tuned_builder(model_id, record.get("best_params"), DEFAULT_RANDOM_SEED)
    point, lower, upper = bootstrap_prediction_intervals(
        builder,
        X_train,
        y_train,
        X_new,
        n_bootstrap=200,
        seed=DEFAULT_RANDOM_SEED,
        confidence_level=DEFAULT_CONFIDENCE_LEVEL,
    )
    conformal_q = record["interval_metrics"].get("conformal_half_width")
    if conformal_q is not None:
        lower = np.minimum(lower, point - conformal_q)
        upper = np.maximum(upper, point + conformal_q)
    score = float(np.clip(point[0], 0.0, 1.0))
    return {
        "composite_score": score,
        "category": _risk_category(score),
        "risk_components": {
            "agricultural_risk": float(np.clip(-row["yield_anomaly"].iloc[0], 0.0, 1.0)),
            "climate_exposure": float(
                np.clip(row["temp_gs_c"].iloc[0] / 30.0, 0.0, 1.0)
            ),
            "yield_loss_probability": float(np.clip(0.5 - row["yield_anomaly"].iloc[0], 0.0, 1.0)),
            "financial_vulnerability": float(
                np.clip(row["credit_stress_rate"].iloc[0], 0.0, 1.0)
            ),
        },
        "prediction_interval": [
            float(np.clip(lower[0], 0.0, 1.0)),
            float(np.clip(upper[0], 0.0, 1.0)),
        ],
        "confidence_level": DEFAULT_CONFIDENCE_LEVEL,
        "drivers": record["feature_importance"][:5],
        "model_version": record["version"],
        "label": "agricultural_financial_risk_estimate (synthetic proxy)",
        "synthetic": True,
    }


def forecast(
    crop_code: str = "maize",
    horizon: int = 3,
    model_id: str = "ridge",
) -> dict[str, Any]:
    """Historical + naive-trend forecast with bootstrap intervals.

    The trend model is refit per bootstrap sample, so the interval honestly
    covers both parameter uncertainty and the extrapolation step.
    """
    record = _require_registry_entry("yield", "climate_only", model_id)
    yield_matrix = store.load_feature_matrix("yield_matrix")
    crop_code = _resolve_crop(yield_matrix, crop_code)
    crop_rows = (
        yield_matrix[yield_matrix["crop_code"] == crop_code]
        .sort_values("year")
        .reset_index(drop=True)
    )
    if len(crop_rows) < 5:
        raise ValueError("Not enough history to forecast.")

    years = crop_rows["year"].to_numpy(dtype=float)
    yields = crop_rows["yield_t_ha"].to_numpy(dtype=float)
    last_year = int(years.max())

    historical = [
        {
            "year": int(row.year),
            "yield": float(row.yield_t_ha),
            "lower_bound": float(row.yield_t_ha),
            "upper_bound": float(row.yield_t_ha),
            "type": "historical",
        }
        for row in crop_rows.itertuples(index=False)
    ]

    rng = np.random.default_rng(DEFAULT_RANDOM_SEED)
    residuals = yields - np.polyval(np.polyfit(years, yields, 1), years)
    future_years = np.arange(last_year + 1, last_year + horizon + 1, dtype=float)
    samples = np.empty((200, horizon))
    for b in range(200):
        sample_years = rng.integers(0, len(years), size=len(years))
        slope, intercept = np.polyfit(years[sample_years], yields[sample_years], 1)
        noise = rng.choice(residuals, size=horizon, replace=True)
        samples[b] = slope * future_years + intercept + noise

    alpha = 1.0 - DEFAULT_CONFIDENCE_LEVEL
    forecast_points = [
        {
            "year": int(future_years[i]),
            "yield": float(np.mean(samples[:, i])),
            "lower_bound": float(np.percentile(samples[:, i], 100 * alpha / 2)),
            "upper_bound": float(np.percentile(samples[:, i], 100 * (1 - alpha / 2))),
            "type": "forecast",
        }
        for i in range(horizon)
    ]
    return {
        "historical": historical,
        "forecast": forecast_points,
        "model_version": record["version"],
        "uncertainty_method": "trend + residual bootstrap",
        "confidence_level": DEFAULT_CONFIDENCE_LEVEL,
        "metrics": {
            "test_mae": record["test_metrics"]["mae"],
            "test_rmse": record["test_metrics"]["rmse"],
            "test_r2": record["test_metrics"]["r2"],
            "picp_95": record["interval_metrics"]["picp_95"],
            "mpiw_95": record["interval_metrics"]["mpiw_95"],
        },
    }


def run_scenario(
    region_code: str,
    crop_code: str,
    scenario: str,
    custom_params: dict[str, float] | None = None,
    n_simulations: int = 1000,
    confidence_level: float = DEFAULT_CONFIDENCE_LEVEL,
) -> dict[str, Any]:
    """Monte-Carlo stress path over the registered yield model.

    The scenario perturbs the region's historical growing-season climate, then
    propagates the registered model's bootstrap distribution to a yield-loss
    probability and a proxy risk score.
    """
    record = _require_registry_entry("yield", "climate_only", "ridge")
    state_climate = store.load_feature_matrix("state_climate")
    yield_matrix = store.load_feature_matrix("yield_matrix")
    if state_climate is None or yield_matrix is None:
        raise RuntimeError("Feature matrices missing; run ingestion first.")

    region_rows = state_climate[state_climate["region_code"] == region_code]
    if region_rows.empty:
        raise KeyError(f"No climate history for region '{region_code}'")

    presets = {
        "normal": (1.0, 0.0),
        "dry": (0.7, 0.0),
        "heat": (1.0, 2.5),
        "severe": (0.6, 3.5),
    }
    if scenario == "custom":
        # Free parameters apply only to the custom scenario; the named presets
        # stay authoritative so Dry/Heat/Severe cannot be silently overridden.
        params = custom_params or {}
        rainfall_multiplier = params.get("rainfall_multiplier", 1.0)
        temperature_offset = params.get("temperature_offset", 0.0)
    else:
        rainfall_multiplier, temperature_offset = presets.get(scenario, presets["normal"])

    baseline_rain = float(region_rows["rainfall_gs_mm"].mean())
    baseline_temp = float(region_rows["temp_gs_c"].mean())
    stress_rain = baseline_rain * rainfall_multiplier
    stress_temp = baseline_temp + temperature_offset

    crop_code = _resolve_crop(yield_matrix, crop_code)
    crop_rows = yield_matrix[yield_matrix["crop_code"] == crop_code]
    X_train = crop_rows[record["features"]].to_numpy(dtype=float)
    y_train = crop_rows["yield_t_ha"].to_numpy(dtype=float)

    builder = tuned_builder("ridge", record.get("best_params"), DEFAULT_RANDOM_SEED)
    rng = np.random.default_rng(DEFAULT_RANDOM_SEED)
    samples = np.empty(n_simulations)
    X_stress = np.array([[stress_rain, stress_temp]])
    # Sample bootstrap models once, then draw parameter noise per simulation.
    for i in range(n_simulations):
        indices = rng.integers(0, len(X_train), size=len(X_train))
        model = builder()
        model.fit(X_train[indices], y_train[indices])
        samples[i] = model.predict(X_stress)[0] + rng.normal(0.0, y_train.std(ddof=1) * 0.25)

    baseline_yield = float(y_train.mean())
    loss_probability = float(np.mean(samples < baseline_yield * 0.9))
    yield_summary = interval_summary(samples, confidence_level)

    risk_samples = np.clip(0.5 + (baseline_yield - samples) / max(baseline_yield, 1e-6), 0.0, 1.0)
    risk_summary = interval_summary(risk_samples, confidence_level)
    expected_loss = float(np.mean(np.clip((baseline_yield - samples) / baseline_yield, 0.0, None)))

    return {
        "results": [
            {
                "scenario": scenario,
                "yield_distribution": yield_summary,
                "yield_loss_probability": loss_probability,
                "risk_score_distribution": risk_summary,
                "expected_loss": expected_loss,
                "category": _risk_category(risk_summary["mean"]),
            }
        ],
        "n_simulations": n_simulations,
        "confidence_level": confidence_level,
        "stress_inputs": {
            "region_code": region_code,
            "rainfall_multiplier": rainfall_multiplier,
            "temperature_offset": temperature_offset,
            "baseline_rainfall_mm": baseline_rain,
            "baseline_temperature_c": baseline_temp,
            "stress_rainfall_mm": stress_rain,
            "stress_temperature_c": stress_temp,
        },
        "label": "Illustrative proxy risk; synthetic credit target.",
    }