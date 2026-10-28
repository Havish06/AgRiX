"""Model zoo and evaluation metrics.

The zoo follows the baseline-first policy from the research methodology:
mean baseline -> linear regression -> regularized linear -> random forest ->
XGBoost. Every fitted model is paired with prediction intervals so no point
estimate ever travels without uncertainty.

Hyperparameters are tuned with RandomizedSearchCV against the chronological
validation block only (never the test block, never shuffled folds); XGBoost
additionally stops adding trees early when the validation block stops
improving, and the final model gets exactly that many trees. Intervals union
the case-bootstrap sampling spread with a split-conformal band calibrated on
held-out validation residuals, so nominal coverage is a property of the
method, not a hope.
"""

import copy
import math
from collections.abc import Callable
from typing import Any

import numpy as np
from sklearn.base import BaseEstimator, RegressorMixin
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.model_selection import RandomizedSearchCV
from xgboost import XGBRegressor

RANDOM_STATE_KEY = "random_state"
_EARLY_STOPPING_ROUNDS = 25
_EARLY_STOPPING_METRIC = "mae"


class MeanBaseline(BaseEstimator, RegressorMixin):
    """Predicts the training-set mean. The honest floor for any comparison."""

    def fit(self, X: np.ndarray, y: np.ndarray) -> "MeanBaseline":
        self.mean_ = float(np.mean(y))
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        return np.full(len(X), self.mean_)


class EarlyStoppingXGB(BaseEstimator, RegressorMixin):
    """XGBoost wrapper with flat constructor hyperparameters so
    RandomizedSearchCV can address them directly (``n_estimators``,
    ``max_depth``, ...). Early-stopping knobs apply when an eval set is
    handed to ``fit``. The wrapper exposes constructor arguments as
    attributes, so it survives sklearn's clone/get_params machinery."""

    def __init__(
        self,
        n_estimators: int = 300,
        max_depth: int = 3,
        learning_rate: float = 0.05,
        subsample: float = 0.9,
        colsample_bytree: float = 0.9,
        reg_lambda: float = 1.0,
        random_state: int = 42,
        early_stopping_rounds: int | None = None,
        eval_metric: str | None = None,
    ):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.subsample = subsample
        self.colsample_bytree = colsample_bytree
        self.reg_lambda = reg_lambda
        self.random_state = random_state
        self.early_stopping_rounds = early_stopping_rounds
        self.eval_metric = eval_metric

    def _regressor(self) -> XGBRegressor:
        kwargs: dict[str, Any] = dict(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            learning_rate=self.learning_rate,
            subsample=self.subsample,
            colsample_bytree=self.colsample_bytree,
            reg_lambda=self.reg_lambda,
            random_state=self.random_state,
            n_jobs=1,
        )
        # xgboost >= 3 takes the early-stopping knobs on the constructor,
        # not on fit(); they only take effect when fit receives an eval_set.
        if self.early_stopping_rounds is not None:
            kwargs["early_stopping_rounds"] = self.early_stopping_rounds
        if self.eval_metric is not None:
            kwargs["eval_metric"] = self.eval_metric
        return XGBRegressor(**kwargs)

    def fit(self, X, y, eval_set=None, **fit_kwargs):
        if eval_set is not None:
            fit_kwargs.setdefault("eval_set", eval_set)
        fit_kwargs.setdefault("verbose", False)
        self.model_ = self._regressor().fit(X, y, **fit_kwargs)
        if hasattr(self.model_, "best_iteration"):
            # Tree count at which the eval block stopped improving.
            self.best_iteration_ = int(self.model_.best_iteration) + 1
        return self

    def predict(self, X):
        return self.model_.predict(X)


def _default_hyperparameters(seed: int) -> dict[str, dict[str, Any]]:
    """Default configurations: the tuned build when tuning is unavailable."""
    return {
        "ridge": {"alpha": 1.0, RANDOM_STATE_KEY: seed},
        "random_forest": {
            "n_estimators": 400,
            "min_samples_leaf": 3,
            RANDOM_STATE_KEY: seed,
            "n_jobs": 1,
        },
        "xgboost": {
            "n_estimators": 300,
            "max_depth": 3,
            "learning_rate": 0.05,
            "subsample": 0.9,
            "colsample_bytree": 0.9,
            "reg_lambda": 1.0,
            RANDOM_STATE_KEY: seed,
        },
    }


DEFAULT_HYPERPARAMETERS = _default_hyperparameters


def _base_model(model_id: str, hyperparameters: dict[str, Any]) -> Any:
    """Instantiate one model from its hyperparameter dict."""
    if model_id == "mean_baseline":
        return MeanBaseline()
    if model_id == "linear":
        return LinearRegression()
    if model_id == "ridge":
        return Ridge(**hyperparameters)
    if model_id == "random_forest":
        return RandomForestRegressor(**hyperparameters)
    if model_id == "xgboost":
        return EarlyStoppingXGB(**copy.deepcopy(hyperparameters))
    raise KeyError(f"Unknown model id '{model_id}'")


def search_spaces(seed: int) -> dict[str, dict[str, list[Any]]]:
    """RandomizedSearchCV spaces per tunable model id (log-spaced ridge
    alphas, depth/leaf caps and sampling fractions for the ensembles)."""
    return {
        "ridge": {"alpha": np.logspace(-2, 3, 26).tolist()},
        "random_forest": {
            "n_estimators": [200, 400, 600],
            "min_samples_leaf": [1, 2, 3, 5, 8],
            "max_features": [1.0, 0.8, 0.6],
        },
        "xgboost": {
            "n_estimators": [200, 400, 600, 800],
            "max_depth": [2, 3, 4, 5],
            "learning_rate": [0.01, 0.03, 0.05, 0.08, 0.12],
            "subsample": [0.7, 0.85, 1.0],
            "colsample_bytree": [0.7, 0.85, 1.0],
            "reg_lambda": [0.0, 1.0, 5.0],
        },
    }


def model_builders(seed: int) -> dict[str, Callable[[], Any]]:
    """Factory table keyed by model id. Each call returns an unfitted model
    with its default hyperparameters (used for bootstrap refits)."""
    defaults = _default_hyperparameters(seed)
    model_ids = ["mean_baseline", "linear", "ridge", "random_forest", "xgboost"]
    return {
        model_id: (lambda mid=model_id: _base_model(mid, defaults.get(mid, {})))
        for model_id in model_ids
    }


MODEL_BUILDERS = model_builders  # alias for import compatibility


def tuned_builder(
    model_id: str, best_params: dict[str, Any] | None, seed: int
) -> Callable[[], Any]:
    """Factory for a model with its tuned hyperparameters.

    Used by inference endpoints to refit the registered configuration on the
    exact training block; ``best_params`` comes from the registry card, so the
    rebuilt model matches the one that was evaluated.
    """
    if model_id in ("mean_baseline", "linear") or not best_params:
        defaults = _default_hyperparameters(seed)
        return lambda: _base_model(model_id, defaults.get(model_id, {}))
    return lambda: _base_model(model_id, copy.deepcopy(best_params))


def tune_model(
    model_id: str,
    builder: Callable[[], Any],
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    seed: int,
) -> dict[str, Any]:
    """Select hyperparameters on the chronological validation block.

    RandomizedSearchCV is given exactly one candidate split (train rows ->
    validation rows), so selection is time-aware: no fold ever sees a future
    row and years are never shuffled. The iteration budget is capped by the
    validation block size so there is no grid explosion. XGBoost candidates
    stop early when the validation block stops improving; the winning
    configuration is then refit once to read off the tree count the final
    model should get.
    """
    spaces = search_spaces(seed)
    if model_id not in spaces or len(X_val) == 0:
        return {
            "tuned": False,
            "best_params": None,
            "best_iteration": None,
            "n_iter": 0,
            "best_val_mae": None,
        }

    X_train = np.asarray(X_train, dtype=float)
    y_train = np.asarray(y_train, dtype=float)
    X_val = np.asarray(X_val, dtype=float)
    y_val = np.asarray(y_val, dtype=float)

    model = builder()
    fit_params: dict[str, Any] = {}
    if model_id == "xgboost":
        model.early_stopping_rounds = _EARLY_STOPPING_ROUNDS
        model.eval_metric = _EARLY_STOPPING_METRIC
        fit_params["eval_set"] = [(X_val, y_val)]

    combinations = math.prod(len(values) for values in spaces[model_id].values())
    n_iter = min(combinations, max(8, 2 * len(X_val)))
    search = RandomizedSearchCV(
        model,
        spaces[model_id],
        n_iter=n_iter,
        scoring="neg_mean_absolute_error",
        cv=[(np.arange(len(X_train)), np.arange(len(X_train), len(X_train) + len(X_val)))],
        random_state=seed,
        n_jobs=1,
        refit=False,
    )
    search.fit(np.vstack([X_train, X_val]), np.concatenate([y_train, y_val]), **fit_params)

    best_params = dict(search.best_params_)
    best_params.setdefault(RANDOM_STATE_KEY, seed)
    best_iteration = None
    if model_id == "xgboost":
        probe = _base_model(
            model_id,
            {
                **copy.deepcopy(best_params),
                "early_stopping_rounds": _EARLY_STOPPING_ROUNDS,
                "eval_metric": _EARLY_STOPPING_METRIC,
            },
        )
        probe.fit(X_train, y_train, eval_set=[(X_val, y_val)])
        best_iteration = getattr(probe, "best_iteration_", None)

    return {
        "tuned": True,
        "best_params": best_params,
        "best_iteration": int(best_iteration) if best_iteration else None,
        "n_iter": search.n_iter,
        "best_val_mae": float(-search.best_score_),
    }


def fit_tuned(
    model_id: str,
    tuned: dict[str, Any],
    builder: Callable[[], Any],
    scaler,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
):
    """Final fit: tuned hyperparameters, trained on train + validation rows.

    The validation block never influences selection beyond tuning (and, for
    XGBoost, the early-stopped tree count), so spending it on the final fit
    extracts maximum signal from limited data; the test block stays untouched.
    """
    if tuned["tuned"]:
        model = _base_model(model_id, tuned["best_params"])
    else:
        model = builder()

    X_full = np.vstack([X_train, X_val]) if len(X_val) else X_train
    y_full = np.concatenate([y_train, y_val]) if len(X_val) else y_train

    if model_id == "xgboost" and tuned.get("best_iteration"):
        # Exactly the tree count early stopping selected — no more.
        model.n_estimators = int(tuned["best_iteration"])
        model.early_stopping_rounds = None
        model.eval_metric = None
    model.fit(scaler.transform(X_full), y_full)
    return model


def conformal_quantile(
    residuals: np.ndarray, confidence_level: float = 0.95, bias_correct: bool = True
) -> float:
    """Split-conformal half-width from held-out residuals.

    q is the ceil((n+1)(1-alpha))/n-th quantile of |residuals|, where
    alpha = 1 - confidence_level; with that finite-sample correction,
    intervals of point +/- q achieve at least the nominal coverage on
    exchangeable data. Returns inf when the residual block is too small to
    calibrate (the card records that honestly rather than pretending to
    cover).
    """
    residuals = np.asarray(residuals, dtype=float)
    n = len(residuals)
    if n == 0:
        return float("inf")
    centered = residuals - float(np.mean(residuals)) if bias_correct else residuals
    # (n+1)(1-alpha) with alpha = 1 - confidence_level, i.e. the ~ (1-alpha)
    # quantile corrected for the held-out point itself. The previous version
    # inverted this and read a near-zero quantile, which made the band a no-op.
    level = min(1.0, np.ceil((n + 1) * confidence_level) / n)
    if level >= 1.0:
        return float("inf")
    return float(np.quantile(np.abs(centered), level))


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
    """Case-bootstrap intervals for the sampling spread of the prediction.

    The full-data model gives the point estimate; models refit on bootstrap
    resamples of the training rows give the parameter-uncertainty spread,
    from which percentile intervals are taken. These intervals capture model
    uncertainty only — they are unioned with the split-conformal band
    (``conformal_quantile`` on held-out residuals) when coverage of the
    actual target is required.
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