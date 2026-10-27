"""Model training, evaluation, and registration.

Implements the baseline-first protocol: every model in the zoo is trained on
the same chronological split, evaluated on the same test years, and given
bootstrap prediction intervals. Each trained model is persisted together with
a model card (metrics, features, limitations) in the registry.
"""

import json
from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd
from sklearn.inspection import permutation_importance
from sklearn.preprocessing import StandardScaler

from app.core.constants import DEFAULT_CONFIDENCE_LEVEL, DEFAULT_RANDOM_SEED
from app.ml.features import (
    CLIMATE_FEATURES,
    FINANCIAL_FEATURES,
    RISK_TARGET,
    chronological_split,
)
from app.ml.models import (
    bootstrap_prediction_intervals,
    compute_regression_metrics,
    interval_coverage_metrics,
    model_builders,
)
from app.services import store

YIELD_FEATURE_SETS = {
    "climate_only": CLIMATE_FEATURES,
    # National yields trend strongly upward (technology/seed improvements), so
    # climate alone cannot track them out-of-sample; the year term carries the
    # trend and lets the climate signal be read on top of it.
    "climate_and_trend": [*CLIMATE_FEATURES, "year"],
}
RISK_FEATURE_SETS = {
    "finance_only": [*FINANCIAL_FEATURES, "log_loan_exposure"],
    "combined": [*FINANCIAL_FEATURES, "log_loan_exposure", *CLIMATE_FEATURES, "yield_anomaly"],
}

MODEL_VERSION = "1.0.0"

YIELD_LIMITATIONS = [
    "National-level aggregates; no sub-national or farm-level resolution.",
    "Growing-season rainfall/temperature only; extremes and planting dates not modelled.",
    "Few test years: interval coverage estimates are themselves uncertain.",
    "Extrapolation beyond the observed climate range is unreliable.",
    "Tree-based models cannot extrapolate the year trend beyond the training range.",
]
RISK_LIMITATIONS = [
    "Target is a SYNTHETIC credit-stress proxy, not observed loan defaults.",
    "Results must not be quoted as empirical default probabilities.",
    "Climate enters through a small panel of state centroids.",
    "Few test years: interval coverage estimates are themselves uncertain.",
]


def _fit_scaled(model_factory, X_train, y_train, X_eval):
    """Standardize with statistics from the training block only (leakage-safe)."""
    scaler = StandardScaler().fit(X_train)
    model = model_factory()
    model.fit(scaler.transform(X_train), y_train)
    return model, scaler, scaler.transform(X_eval)


def _permutation_importance(model, scaler, X_test, y_test, seed: int) -> list[dict[str, Any]]:
    result = permutation_importance(
        model, scaler.transform(X_test), y_test, n_repeats=10, random_state=seed
    )
    order = np.argsort(result.importances_mean)[::-1]
    return [
        {"feature_index": int(idx), "importance": float(result.importances_mean[idx])}
        for idx in order
    ]


def train_task(
    task: str,
    feature_set: str,
    model_id: str,
    frame: pd.DataFrame,
    target: str,
    features: list[str],
    train_end: int,
    validation_end: int,
    seed: int = DEFAULT_RANDOM_SEED,
    n_bootstrap: int = 200,
) -> dict[str, Any]:
    """Train one (task, feature set, model) cell and persist artifact + card."""
    builders = model_builders(seed)
    if model_id not in builders:
        raise KeyError(f"Unknown model id '{model_id}'")

    train, validation, test = chronological_split(frame, train_end, validation_end)
    if len(train) < 10 or len(test) < 1:
        raise ValueError("Chronological split leaves too little data to train or test.")

    X_train = train[features].to_numpy(dtype=float)
    y_train = train[target].to_numpy(dtype=float)
    X_val = validation[features].to_numpy(dtype=float)
    y_val = validation[target].to_numpy(dtype=float)
    X_test = test[features].to_numpy(dtype=float)
    y_test = test[target].to_numpy(dtype=float)

    model, scaler, X_test_scaled = _fit_scaled(builders[model_id], X_train, y_train, X_test)
    X_val_scaled = scaler.transform(X_val) if len(validation) else X_val

    val_metrics = (
        compute_regression_metrics(y_val, model.predict(X_val_scaled))
        if len(validation)
        else {"mae": None, "rmse": None, "r2": None, "n": 0}
    )
    point, lower, upper = bootstrap_prediction_intervals(
        builders[model_id],
        X_train,
        y_train,
        X_test,
        n_bootstrap=n_bootstrap,
        seed=seed,
        confidence_level=DEFAULT_CONFIDENCE_LEVEL,
    )
    # Intervals are produced from unscaled features; evaluate the scaled point
    # model on the same test rows so metrics and intervals describe one model.
    test_metrics = compute_regression_metrics(y_test, model.predict(X_test_scaled))
    coverage = interval_coverage_metrics(y_test, lower, upper)

    importance = _permutation_importance(model, scaler, X_test, y_test, seed)
    drivers = [
        {"feature": features[row["feature_index"]], "importance": row["importance"]}
        for row in importance
    ]

    registry_key = f"{task}__{feature_set}__{model_id}"
    artifact_path = store.save_artifact(registry_key, {"model": model, "scaler": scaler})

    registry = store.load_registry() or {}
    registry[registry_key] = {
        "registry_key": registry_key,
        "task": task,
        "feature_set": feature_set,
        "model_id": model_id,
        "version": MODEL_VERSION,
        "target": target,
        "features": features,
        "training_period": f"<= {train_end}",
        "validation_period": f"{train_end + 1}-{validation_end}",
        "test_period": f"> {validation_end}",
        "seed": seed,
        "n_train": len(train),
        "n_validation": len(validation),
        "n_test": len(test),
        "validation_metrics": val_metrics,
        "test_metrics": test_metrics,
        "interval_metrics": {
            "picp_95": coverage["picp"],
            "mpiw_95": coverage["mpiw"],
            "confidence_level": DEFAULT_CONFIDENCE_LEVEL,
            "method": "case bootstrap",
        },
        "feature_importance": drivers,
        "artifact_path": str(artifact_path),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "limitations": RISK_LIMITATIONS if task == "risk" else YIELD_LIMITATIONS,
        "synthetic_target": task == "risk",
    }
    store.save_registry(registry)
    return registry[registry_key]


def train_all(seed: int = DEFAULT_RANDOM_SEED, n_bootstrap: int = 200) -> dict[str, Any]:
    """Train the full zoo for both tasks; return the comparison summary."""
    yield_matrix = store.load_feature_matrix("yield_matrix")
    risk_panel = store.load_feature_matrix("risk_panel")
    if yield_matrix is None or risk_panel is None:
        raise RuntimeError("Feature matrices missing; run ingestion first.")

    y_years = sorted(yield_matrix["year"].unique())
    r_years = sorted(risk_panel["year"].unique())
    y_train_end, y_val_end = y_years[int(len(y_years) * 0.7)], y_years[int(len(y_years) * 0.85)]
    r_train_end, r_val_end = r_years[int(len(r_years) * 0.7)], r_years[int(len(r_years) * 0.85)]
    # Train on the crop with the most observations (maize when FAOSTAT is
    # available, the cereal aggregate when the World Bank fallback is used).
    default_crop = str(yield_matrix["crop_code"].value_counts().index[0])

    results: list[dict[str, Any]] = []
    for feature_set, features in YIELD_FEATURE_SETS.items():
        for model_id in model_builders(seed):
            results.append(
                train_task(
                    "yield",
                    feature_set,
                    model_id,
                    yield_matrix[yield_matrix["crop_code"] == default_crop],
                    "yield_t_ha",
                    features,
                    y_train_end,
                    y_val_end,
                    seed=seed,
                    n_bootstrap=n_bootstrap,
                )
            )
    for feature_set, features in RISK_FEATURE_SETS.items():
        for model_id in model_builders(seed):
            results.append(
                train_task(
                    "risk",
                    feature_set,
                    model_id,
                    risk_panel,
                    RISK_TARGET,
                    features,
                    r_train_end,
                    r_val_end,
                    seed=seed,
                    n_bootstrap=n_bootstrap,
                )
            )

    summary = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "seed": seed,
        "yield_split": {"train_end": int(y_train_end), "validation_end": int(y_val_end)},
        "risk_split": {"train_end": int(r_train_end), "validation_end": int(r_val_end)},
        "models": results,
    }
    (store.REGISTRY_DIR / "training_summary.json").write_text(
        json.dumps(summary, indent=2, default=str), encoding="utf-8"
    )
    return summary


def model_cards() -> list[dict[str, Any]]:
    """Render registry entries as model cards for the frontend ledger."""
    registry = store.load_registry() or {}
    cards = []
    for record in registry.values():
        cards.append(
            {
                "model_name": f"{record['task']} / {record['feature_set']} / {record['model_id']}",
                "version": record["version"],
                "training_data": "NASA POWER + FAOSTAT"
                + (" + synthetic credit panel" if record["synthetic_target"] else ""),
                "features": record["features"],
                "target": record["target"],
                "training_period": record["training_period"],
                "validation_method": f"chronological split; test {record['test_period']}",
                "metrics": {
                    **record["test_metrics"],
                    **record["interval_metrics"],
                },
                "known_limitations": record["limitations"],
                "potential_bias": (
                    ["Synthetic target; proxy risk only"] if record["synthetic_target"] else []
                ),
                "intended_use": "Research comparison of feature sets under uncertainty",
                "non_intended_use": "Production lending decisions; default-probability claims",
            }
        )
    return cards