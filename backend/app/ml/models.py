"""Model zoo and evaluation metrics.

The zoo follows the baseline-first policy from the research methodology:
mean baseline -> linear regression -> regularized linear -> random forest ->
XGBoost. Every fitted model is paired with bootstrap prediction intervals so
no point estimate ever travels without uncertainty.
"""

from collections.abc import Callable
from typing import Any

import numpy as np
from sklearn.base import BaseEstimator, RegressorMixin
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge
from xgboost import XGBRegressor


class MeanBaseline(BaseEstimator, RegressorMixin):
    """Predicts the training-set mean. The honest floor for any comparison."""

    def fit(self, X: np.ndarray, y: np.ndarray) -> "MeanBaseline":
        self.mean_ = float(np.mean(y))
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        return np.full(len(X), self.mean_)


def _xgb_factory(seed: int) -> Callable[[], XGBRegressor]:
    def build() -> XGBRegressor:
        return XGBRegressor(
            n_estimators=300,
            max_depth=3,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=seed,
            n_jobs=1,
        )

    return build


def model_builders(seed: int) -> dict[str, Callable[[], Any]]:
    """Factory table keyed by model id. Each call returns an unfitted model."""

    return {
        "mean_baseline": MeanBaseline,
        "linear": LinearRegression,
        "ridge": lambda: Ridge(alpha=1.0, random_state=seed),
        "random_forest": lambda: RandomForestRegressor(
            n_estimators=400, min_samples_leaf=3, random_state=seed, n_jobs=1
        ),
        "xgboost": _xgb_factory(seed),
    }


MODEL_BUILDERS = model_builders  # alias for import compatibility


def compute_regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    """Point metrics required by the methodology: MAE, RMSE, R2."""

    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    residuals = y_true - y_pred
    ss_res = float(np.sum(residuals**2))
    ss_tot = float(np.sum((y_true - np.mean(y_true)) ** 2))
    return {
        "mae": float(np.mean(np.abs(residuals))),
        "rmse": float(np.sqrt(np.mean(residuals**2))),
        "r2": 1.0 - ss_res / ss_tot if ss_tot > 0 else 0.0,
        "n": int(len(y_true)),
    }


def interval_coverage_metrics(
    y_true: np.ndarray, lower: np.ndarray, upper: np.ndarray
) -> dict[str, float]:
    """PICP (coverage) and MPIW (mean width) for a set of intervals."""

    y_true = np.asarray(y_true, dtype=float)
    lower = np.asarray(lower, dtype=float)
    upper = np.asarray(upper, dtype=float)
    covered = (y_true >= lower) & (y_true <= upper)
    return {
        "picp": float(np.mean(covered)),
        "mpiw": float(np.mean(upper - lower)),
    }


def bootstrap_prediction_intervals(
    factory: Callable[[], Any],
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_new: np.ndarray,
    n_bootstrap: int = 200,
    seed: int = 42,
    confidence_level: float = 0.95,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Case-bootstrap prediction intervals.

    The full-data model gives the point estimate; models refit on bootstrap
    resamples of the training rows give the sampling distribution of the
    prediction, from which percentile intervals are taken. Suitable for the
    small, structured datasets this project works with.
    """

    rng = np.random.default_rng(seed)
    X_train = np.asarray(X_train, dtype=float)
    y_train = np.asarray(y_train, dtype=float)
    X_new = np.asarray(X_new, dtype=float)

    point_model = factory()
    point_model.fit(X_train, y_train)
    point = np.asarray(point_model.predict(X_new), dtype=float)

    predictions = np.empty((n_bootstrap, len(X_new)))
    for b in range(n_bootstrap):
        indices = rng.integers(0, len(X_train), size=len(X_train))
        model = factory()
        model.fit(X_train[indices], y_train[indices])
        predictions[b] = np.asarray(model.predict(X_new), dtype=float)

    alpha = 1.0 - confidence_level
    lower = np.percentile(predictions, 100 * alpha / 2, axis=0)
    upper = np.percentile(predictions, 100 * (1 - alpha / 2), axis=0)
    return point, lower, upper
