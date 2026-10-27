"""Documented synthetic agricultural-credit panel generator.

No public dataset provides farm-loan outcomes (defaults or repayments) at the
state-year grain in a form this project may redistribute. Following the AgRiX
data policy, this module therefore generates a SYNTHETIC credit panel for
controlled experimentation only. The generator is fully deterministic (seeded),
every assumption is documented, and every row carries `synthetic=True` so the
panel can never be mistaken for observed data downstream.

The panel is used to build the financial feature set and the proxy credit-
stress target for the finance-only vs combined comparison. It is NOT an
observed default probability and is labelled accordingly.
"""

from datetime import date
from typing import Any

import numpy as np
import pandas as pd

from app.data.providers.base import DataRequest, DatasetMetadata

# Synthetic state panel: centroid coordinates double as the climate join key.
STATES: dict[str, dict[str, Any]] = {
    "US-IA": {"name": "Iowa", "latitude": 42.0, "longitude": -93.5},
    "US-IL": {"name": "Illinois", "latitude": 40.0, "longitude": -89.2},
    "US-IN": {"name": "Indiana", "latitude": 39.8, "longitude": -86.3},
    "US-NE": {"name": "Nebraska", "latitude": 41.5, "longitude": -99.8},
    "US-KS": {"name": "Kansas", "latitude": 38.5, "longitude": -98.3},
    "US-MN": {"name": "Minnesota", "latitude": 46.3, "longitude": -94.3},
    "US-SD": {"name": "South Dakota", "latitude": 44.4, "longitude": -100.2},
    "US-OH": {"name": "Ohio", "latitude": 40.3, "longitude": -82.8},
}

GENERATOR_VERSION = "1.0.0"


def generate_credit_panel(
    start_year: int,
    end_year: int,
    yield_anomalies: pd.DataFrame | None = None,
    seed: int = 42,
) -> pd.DataFrame:
    """Generate a seeded synthetic state-year agricultural credit panel.

    The process model is intentionally simple and documented:
    - Each state has fixed structural parameters (portfolio size, base rate).
    - Interest rates follow a slow AR(1) around a national mean.
    - Debt service coverage drifts with a state productivity cycle.
    - A latent stress factor combines interest-rate load and, when supplied,
      observed yield anomalies (real climate signal, synthetic credit map).
    - `credit_stress_rate` is a logistic transform of the latent factor plus
      small noise: a PROXY for portfolio stress, never an observed default.
    """
    rng = np.random.default_rng(seed)
    years = list(range(start_year, end_year + 1))
    rows: list[dict[str, Any]] = []

    for state_code, state in STATES.items():
        base_exposure = rng.uniform(120.0, 900.0)  # million USD
        base_rate = rng.uniform(4.5, 7.5)  # percent
        productivity_phase = rng.uniform(0.0, 2 * np.pi)
        rate = base_rate
        coverage = rng.uniform(1.6, 2.6)

        for index, year in enumerate(years):
            rate = base_rate + 0.7 * (rate - base_rate) + rng.normal(0.0, 0.35)
            cycle = 0.15 * np.sin(2 * np.pi * index / 9.0 + productivity_phase)
            coverage = max(0.6, coverage + 0.6 * (1.9 - coverage) * 0.2 + cycle * 0.3 + rng.normal(0.0, 0.06))

            anomaly_signal = 0.0
            if yield_anomalies is not None and not yield_anomalies.empty:
                row = yield_anomalies[yield_anomalies["year"] == year]
                if not row.empty:
                    anomaly_signal = float(row["mean_yield_anomaly"].iloc[0])

            rate_load = (rate - 5.0) / 3.0
            stress_latent = (
                0.9 * rate_load
                + 0.8 * (1.7 - coverage)
                - 1.6 * anomaly_signal  # negative yield anomaly raises stress
                + rng.normal(0.0, 0.35)
            )
            stress_rate = float(1.0 / (1.0 + np.exp(-stress_latent)))

            rows.append(
                {
                    "year": year,
                    "region_code": state_code,
                    "synthetic": True,
                    "loan_exposure_musd": round(base_exposure * (1.0 + rng.normal(0.02, 0.03)) ** index, 2),
                    "interest_rate_pct": round(float(rate), 3),
                    "debt_service_coverage": round(float(coverage), 3),
                    "commodity_price_index": round(100.0 * (1.0 + rng.normal(0.0, 0.07)), 2),
                    "credit_stress_rate": round(stress_rate, 5),
                }
            )

    panel = pd.DataFrame(rows)
    panel = panel.sort_values(["region_code", "year"]).reset_index(drop=True)
    return panel


def panel_metadata(start_year: int, end_year: int, seed: int) -> DatasetMetadata:
    n_states = len(STATES)
    n_rows = n_states * (end_year - start_year + 1)
    return DatasetMetadata(
        dataset_name="Synthetic agricultural credit panel (state-year)",
        provider="AgRiX synthetic generator",
        url="backend/app/data/providers/synthetic_finance.py",
        license="Generated in-repo; MIT",
        access_date=date.today(),
        temporal_coverage=f"{start_year} to {end_year}",
        geographic_coverage="8 US agricultural states (synthetic)",
        variables=[
            {"name": "loan_exposure_musd", "unit": "million USD"},
            {"name": "interest_rate_pct", "unit": "percent"},
            {"name": "debt_service_coverage", "unit": "ratio"},
            {"name": "commodity_price_index", "unit": "index"},
            {"name": "credit_stress_rate", "unit": "fraction (proxy)"},
        ],
        preprocessing=[
            "Seeded generator (no live source)",
            "credit_stress_rate is a synthetic PROXY, not an observed default probability",
            f"Yield-anomaly coupling documented in module docstring",
        ],
        version=f"synthetic-{GENERATOR_VERSION}-seed{seed}",
        checksum="sha256:deterministic",
        rows_received=n_rows,
        rows_rejected=0,
        rows_corrected=0,
        rows_retained=n_rows,
        missing_values={},
        outliers={},
    )
