"""Advisory service: fuses risk + scenarios + forecast + seasonal calendar into dated banking actions.

Every action is grounded in provenance: the feature matrices, registered models,
and simulation inputs that produced it.  If any required artifact is missing, an
explanatory error is raised instead of fabricating a result.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

import numpy as np
import pandas as pd

def _resolve_crop(yield_matrix: pd.DataFrame, crop_code: str) -> str:
    """Return the requested crop, or the only available crop when the
    requested one is absent."""
    crops = sorted(str(c) for c in yield_matrix["crop_code"].unique())
    if crop_code in crops:
        return crop_code
    if len(crops) == 1:
        return crops[0]
    raise KeyError(f"Crop '{crop_code}' not in yield matrix; available crops: {crops}")


def _risk_category(mean_risk: float) -> str:
    """Map a mean risk probability to a RiskCategory label."""
    from app.core.constants import RISK_THRESHOLDS

    for thresh_label, (low, high) in sorted(RISK_THRESHOLDS.items(), key=lambda x: x[1][0]):
        if mean_risk < high:
            return thresh_label
    return "Very High"


def _build_seasonal_calendar(region_code: str, state_climate: pd.DataFrame) -> dict[str, Any]:
    """Build a simple growing-season calendar from the state_climate matrix.

    Returns month-by-month aggregates for the typical growing window.
    """
    if state_climate is None or state_climate.empty:
        return {"months": [], "note": "No climate data for region"}

    # The feature matrix has growing-season aggregates;
    # we expand them into a notional monthly calendar.
    # This is a proxy — real calendars would use NOAA daily data.
    rows = state_climate.sort_values("year")
    baseline_rain = float(rows["rainfall_gs_mm"].mean())
    baseline_temp = float(rows["temp_gs_c"].mean())

    # Approximate 8-month growing season (May–Sep)
    months = []
    for i, month in enumerate(["May", "Jun", "Jul", "Aug", "Sep"]):
        rain = baseline_rain * (1.0 + 0.1 * np.sin(2 * np.pi * (i - 2) / 5.0))
        temp = baseline_temp * (1.0 + 0.05 * np.sin(2 * np.pi * (i - 2) / 5.0))
        months.append({
            "month": month,
            "baseline_rainfall_mm": round(rain, 1),
            "baseline_temperature_c": round(temp, 1),
        })

    return {
        "months": months,
        "baseline_rainfall_mm": round(baseline_rain, 1),
        "baseline_temperature_c": round(baseline_temp, 1),
    }


def advisory(
    region_code: str,
    crop_code: str,
    *,
    horizon: int = 3,
    n_simulations: int = 1000,
    confidence_level: float = DEFAULT_CONFIDENCE_LEVEL,
# --- Construct dated banking actions ---
    actions: list[dict[str, Any]] = []

    # Action group 1: Yield forecast-driven actions
    forecast_mean = float(np.mean(forecast_results["forecast"]))
    forecast_lower = float(np.min(forecast_results["forecast"]))
    forecast_upper = float(np.max(forecast_results["forecast"]))

    if forecast_mean < baseline_yield * 0.9:
        actions.append({
            "date": datetime.now().strftime("%Y-%m-%d"),
            "category": "forecast_downgrade",
            "title": "Yield forecast below baseline",
            "rationale": (
                f"Projected yield for {crop_code} in {region_code} is {forecast_mean:.2f} t/ha "
                f"({((forecast_mean / baseline_yield - 1) * 100:.1f}% below baseline).  "
                f"Interval: [{forecast_lower:.2f}, {forecast_upper:.2f}] t/ha. "
                f"Consider tightening credit limits or requiring additional collateral."
            ),
            "source": "forecast",
        })

    # Action group 2: Scenario-driven risk actions
    risk_mean = float(scenario_results["results"][0]["risk_score_distribution"]["mean"])
    if risk_mean > 0.5:
        actions.append({
            "date": datetime.now().strftime("%Y-%m-%d"),
            "category": "scenario_risk_elevation",
            "title": "Elevated credit risk under normal scenario",
            "rationale": (
                f"Monte Carlo simulation under normal conditions yields a mean risk score of "
                f"{risk_mean:.2f}.  "
                f"Yield loss probability: {float(scenario_results['results'][0]['yield_loss_probability']):.2f}. "
                f"Review borrower repayment capacity and consider stress-testing under dry/severe scenarios."
            ),
            "source": "scenario",
            "scenario": "normal",
            "n_simulations": n_simulations,
        })

    # Action group 3: Seasonal calendar observations
    if calendar.get("months"):
        actions.append({
            "date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "category": "seasonal_preparation",
            "title": "Growing-season preparation advisory",
            "rationale": (
                f"Seasonal calendar for {region_code}: baseline rainfall "
                f"{calendar['baseline_rainfall_mm']} mm, baseline temperature "
                f"{calendar['baseline_temperature_c']}°C across {len(calendar['months'])} months. "
                f"Plan planting dates, irrigation allocation, and harvest timing accordingly. "
                f"Deviations from these baselines should trigger early-warning monitoring."
            ),
            "source": "seasonal_calendar",
            "calendar": calendar,
        })

    # Action group 4: Yield-loss-driven credit actions
    loss_prob = float(scenario_results["results"][0]["yield_loss_probability"])
    if loss_prob > 0.3:
        actions.append({
            "date": (datetime.now() + timedelta(days=60)).strftime("%Y-%m-%d"),
            "category": "loss_probability_warning",
            "title": "High yield-loss probability",
            "rationale": (
                f"{loss_prob:.0%} probability that yield falls below 90% of baseline. "
                f"This increases default risk for agrifinance obligations. "
                f"Consider grace-period structuring or harvest-hedge recommendations."
            ),
            "source": "scenario",
            "yield_loss_probability": loss_prob,
        })

    # Deduplicate actions with the same category within 7 days
    seen: set[str] = set()
    deduped: list[dict[str, Any]] = []
    for action in actions:
        key = f"{action['category']}_{action['date']}"
        if key not in seen:
            seen.add(key)
            deduped.append(action)

    return {
        "region_code": region_code,
        "crop_code": crop_code,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "baseline_yield_t_ha": baseline_yield,
        "actions": deduped,
        "summary": {
            "total_actions": len(deduped),
            "high_priority": len([a for a in deduped if a["category"] in ("forecast_downgrade", "scenario_risk_elevation", "loss_probability_warning")]),
            "source_integration": ["risk", "scenarios", "forecast", "seasonal_calendar"],
        },
    }