"""Feature matrix construction from validated snapshots.

Two matrices are built:

1. Yield matrix (national, per crop): target `yield_t_ha` with national
   growing-season climate aggregates (May-September rainfall and temperature,
   equal-weight mean over the eight state centroids).
2. Credit-risk panel (state-year): synthetic credit indicators joined with
   state-level growing-season climate and the national maize yield anomaly.

All transformations are deterministic and documented; the risk panel carries
`synthetic=True` end to end.
"""

import calendar
from datetime import date
from typing import Any

import numpy as np
import pandas as pd

from app.data.providers.synthetic_finance import STATES

COORD_TO_STATE = {
    (round(state["latitude"], 4), round(state["longitude"], 4)): code
    for code, state in STATES.items()
}

GROWING_SEASON_MONTHS = {"05", "06", "07", "08", "09"}

CLIMATE_FEATURES = ["rainfall_gs_mm", "temp_gs_c"]
FINANCIAL_FEATURES = [
    "interest_rate_pct",
    "debt_service_coverage",
    "loan_exposure_musd",
    "commodity_price_index",
]
RISK_TARGET = "credit_stress_rate"


def monthly_to_state_climate(rows: list[dict[str, Any]]) -> pd.DataFrame:
    """Aggregate NASA POWER monthly rows into state-year growing-season values.

    Rainfall is the May-September total (daily rate x days in month);
    temperature is the May-September mean.
    """

    records: list[dict[str, Any]] = []
    for row in rows:
        period = str(row["period"])
        month = period[4:6]
        if month not in GROWING_SEASON_MONTHS:
            continue
        state_code = COORD_TO_STATE.get(
            (round(float(row["latitude"]), 4), round(float(row["longitude"]), 4))
        )
        if state_code is None:
            continue
        year = int(period[:4])
        days = calendar.monthrange(year, int(month))[1]
        rainfall = float(row.get("PRECTOTCORR") or 0.0) * days
        records.append(
            {
                "region_code": state_code,
                "year": year,
                "rainfall_mm": rainfall,
                "temp_c": float(row.get("T2M")),
            }
        )

    monthly = pd.DataFrame(records)
    grouped = (
        monthly.groupby(["region_code", "year"], as_index=False)
        .agg(rainfall_gs_mm=("rainfall_mm", "sum"), temp_gs_c=("temp_c", "mean"))
    )
    return grouped.sort_values(["region_code", "year"]).reset_index(drop=True)


def national_climate(state_climate: pd.DataFrame) -> pd.DataFrame:
    """Equal-weight national aggregate of state growing-season climate."""

    return (
        state_climate.groupby("year", as_index=False)[CLIMATE_FEATURES]
        .mean()
        .sort_values("year")
        .reset_index(drop=True)
    )


def build_yield_matrix(
    state_climate: pd.DataFrame, faostat_rows: list[dict[str, Any]]
) -> pd.DataFrame:
    """Join national climate aggregates with FAOSTAT national yields."""

    yields = pd.DataFrame(faostat_rows)
    climate = national_climate(state_climate)
    matrix = yields.merge(climate, on="year", how="inner")
    matrix = matrix[["year", "region_code", "crop_code", *CLIMATE_FEATURES, "yield_t_ha"]]
    return matrix.sort_values(["crop_code", "year"]).reset_index(drop=True)


def national_yield_anomaly(yield_matrix: pd.DataFrame, crop: str = "maize") -> pd.DataFrame:
    """Detrended national yield anomaly for the named crop (linear trend removed)."""

    crop_rows = yield_matrix[yield_matrix["crop_code"] == crop].copy()
    x = crop_rows["year"].to_numpy(dtype=float)
    y = crop_rows["yield_t_ha"].to_numpy(dtype=float)
    slope, intercept = np.polyfit(x, y, 1)
    trend = slope * x + intercept
    crop_rows["yield_anomaly"] = y - trend
    return crop_rows[["year", "yield_anomaly"]].sort_values("year").reset_index(drop=True)


def build_risk_panel(
    state_climate: pd.DataFrame,
    credit_panel: pd.DataFrame,
    maize_anomaly: pd.DataFrame,
) -> pd.DataFrame:
    """State-year risk panel: financial features + climate + yield anomaly."""

    panel = credit_panel.merge(state_climate, on=["region_code", "year"], how="inner")
    panel = panel.merge(maize_anomaly, on="year", how="left")
    panel["yield_anomaly"] = panel["yield_anomaly"].fillna(0.0)
    panel["log_loan_exposure"] = np.log1p(panel["loan_exposure_musd"])
    columns = [
        "region_code",
        "year",
        "synthetic",
        *FINANCIAL_FEATURES,
        "log_loan_exposure",
        *CLIMATE_FEATURES,
        "yield_anomaly",
        RISK_TARGET,
    ]
    return panel[columns].sort_values(["region_code", "year"]).reset_index(drop=True)


def chronological_split(
    frame: pd.DataFrame, train_end: int, validation_end: int
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Chronological split by year. The only split policy allowed for this data."""

    train = frame[frame["year"] <= train_end]
    validation = frame[(frame["year"] > train_end) & (frame["year"] <= validation_end)]
    test = frame[frame["year"] > validation_end]
    return train, validation, test
