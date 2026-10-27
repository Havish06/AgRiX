"""Descriptive statistics, distributions, correlations, and hypothesis tests."""

from typing import Any

import numpy as np
import pandas as pd
from scipy import stats

from app.services import store

NUMERIC_ONLY = "numeric"


def _load(name: str) -> pd.DataFrame:
    frame = store.load_feature_matrix(name)
    if frame is None:
        raise RuntimeError(f"Feature matrix '{name}' is not available. Run the pipeline first.")
    return frame


def dataset_summary(name: str) -> dict[str, Any]:
    frame = _load(name)
    numeric = frame.select_dtypes(include=[np.number])
    return {
        "dataset": name,
        "rows": len(frame),
        "columns": list(frame.columns),
        "numeric_summary": {
            column: {
                "mean": float(values.mean()),
                "std": float(values.std(ddof=1)),
                "min": float(values.min()),
                "p25": float(values.quantile(0.25)),
                "median": float(values.median()),
                "p75": float(values.quantile(0.75)),
                "max": float(values.max()),
                "missing": int(frame[column].isna().sum()),
            }
            for column, values in numeric.items()
        },
        "missing_values": {
            column: int(series.isna().sum()) for column, series in frame.items()
        },
        "duplicate_rows": int(frame.duplicated().sum()),
    }


def distribution_summary(name: str, column: str) -> dict[str, Any]:
    frame = _load(name)
    if column not in frame.columns:
        raise KeyError(f"Column '{column}' not found in '{name}'")
    values = frame[column].dropna().to_numpy(dtype=float)
    counts, edges = np.histogram(values, bins=20)
    normal_ks = stats.kstest((values - values.mean()) / values.std(ddof=1), "norm")
    return {
        "dataset": name,
        "column": column,
        "n": int(len(values)),
        "histogram": {
            "counts": [int(count) for count in counts],
            "edges": [float(edge) for edge in edges],
        },
        "normality": {
            "test": "Kolmogorov-Smirnov (standardized)",
            "statistic": float(normal_ks.statistic),
            "p_value": float(normal_ks.pvalue),
            "note": "Low p: reject normality at the chosen level.",
        },
    }


def correlation_summary(name: str) -> dict[str, Any]:
    frame = _load(name)
    numeric = frame.select_dtypes(include=[np.number])
    columns = list(numeric.columns)
    pairs = []
    for i, first in enumerate(columns):
        for second in columns[i + 1 :]:
            x = numeric[first].to_numpy(dtype=float)
            y = numeric[second].to_numpy(dtype=float)
            pearson = stats.pearsonr(x, y)
            spearman = stats.spearmanr(x, y)
            pairs.append(
                {
                    "x": first,
                    "y": second,
                    "pearson_r": float(pearson.statistic),
                    "pearson_p": float(pearson.pvalue),
                    "spearman_rho": float(spearman.statistic),
                    "spearman_p": float(spearman.pvalue),
                }
            )
    pairs.sort(key=lambda pair: abs(pair["pearson_r"]), reverse=True)
    return {
        "dataset": name,
        "note": "Correlation is not causation.",
        "pairs": pairs,
    }


def hypothesis_test(
    name: str, column: str, group_column: str, group_a: str, group_b: str
) -> dict[str, Any]:
    frame = _load(name)
    for required in (column, group_column):
        if required not in frame.columns:
            raise KeyError(f"Column '{required}' not found in '{name}'")
    values_a = frame.loc[frame[group_column] == group_a, column].dropna().to_numpy(float)
    values_b = frame.loc[frame[group_column] == group_b, column].dropna().to_numpy(float)
    if len(values_a) < 3 or len(values_b) < 3:
        raise ValueError("Each group needs at least 3 observations.")
    welch = stats.ttest_ind(values_a, values_b, equal_var=False)
    mann = stats.mannwhitneyu(values_a, values_b, alternative="two-sided")
    pooled_std = float(np.sqrt((values_a.var(ddof=1) + values_b.var(ddof=1)) / 2))
    cohens_d = float((values_a.mean() - values_b.mean()) / pooled_std) if pooled_std else 0.0
    return {
        "dataset": name,
        "column": column,
        "groups": {group_a: int(len(values_a)), group_b: int(len(values_b))},
        "welch_t": {"statistic": float(welch.statistic), "p_value": float(welch.pvalue)},
        "mann_whitney_u": {"statistic": float(mann.statistic), "p_value": float(mann.pvalue)},
        "effect_size_cohens_d": cohens_d,
        "note": "Welch's t-test is the default (unequal variance); Mann-Whitney U is the non-parametric check.",
    }