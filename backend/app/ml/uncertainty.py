"""Uncertainty helpers shared by forecasting and scenario services."""

from typing import Any

import numpy as np


def interval_summary(
    samples: np.ndarray,
    confidence_level: float = 0.95,
) -> dict[str, Any]:
    """Summarize a Monte-Carlo or bootstrap sample into mean, std, percentiles."""

    samples = np.asarray(samples, dtype=float)
    alpha = 1.0 - confidence_level
    percentiles = [5, 25, 50, 75, 95]
    return {
        "mean": float(np.mean(samples)),
        "std": float(np.std(samples, ddof=1)),
        "percentiles": {
            f"p{p}": float(np.percentile(samples, p)) for p in percentiles
        },
        "lower": float(np.percentile(samples, 100 * alpha / 2)),
        "upper": float(np.percentile(samples, 100 * (1 - alpha / 2))),
    }
