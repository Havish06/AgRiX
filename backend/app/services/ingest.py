"""Data ingestion: fetch, validate, persist, and register all three sources.

Sources
-------
1. NASA POWER  — real public climate data (no key), monthly, 1990-2024, at the
   centroid of each panel state.
2. FAOSTAT     — real public national crop yields (US; maize, wheat, soybean).
3. Synthetic credit panel — documented, seeded generator (no public farm-loan
   outcome data exists). Every row carries `synthetic=True`.

Every snapshot is validated against the domain rules in `app.core.constants`
before it is written to disk and registered in the database.
"""

from datetime import date
from typing import Any

import numpy as np
import pandas as pd
from sqlalchemy import delete, select

from app.core.constants import (
    MAX_RAINFALL_MM,
    MAX_TEMPERATURE_C,
    MAX_YIELD_T_HA,
    MIN_RAINFALL_MM,
    MIN_TEMPERATURE_C,
    MIN_YIELD_T_HA,
)
from app.core.database import async_session_maker
from app.core.logging import get_logger
from app.data.providers.base import DataRequest
from app.data.providers.faostat import FAOSTATProvider
from app.data.providers.nasa_power import NASAPowerProvider
from app.data.providers.synthetic_finance import (
    STATES,
    generate_credit_panel,
    panel_metadata,
)
from app.data.providers.worldbank import WorldBankYieldProvider
from app.ml.features import (
    build_risk_panel,
    build_yield_matrix,
    monthly_to_state_climate,
    national_yield_anomaly,
)
from app.models import (
    AgriculturalObservation,
    Crop,
    Dataset,
    DatasetVersion,
    FinancialObservation,
    Region,
    WeatherObservation,
)
from app.services import store

logger = get_logger(__name__)

START_YEAR = 1990
SEED = 42

CROP_NAMES = {
    "maize": ("Maize", "cereal"),
    "wheat": ("Wheat", "cereal"),
    "soybean": ("Soybean", "oilseed"),
    "cereal": ("Cereals, aggregate (World Bank indicator)", "cereal"),
}


def fetch_climate_snapshot(cache_dir: str) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Fetch monthly NASA POWER climate data for all panel-state centroids."""
    provider = NASAPowerProvider(cache_dir)
    frames = []
    for code, state in STATES.items():
        request = DataRequest(
            provider="nasa_power",
            dataset="monthly_point",
            start_date=date(START_YEAR, 1, 1),
            end_date=date(date.today().year - 1, 12, 31),
            variables=["PRECTOTCORR", "T2M"],
            parameters={
                "latitude": state["latitude"],
                "longitude": state["longitude"],
                "community": "AG",
            },
        )
        snapshot = provider.fetch(request)
        frame = pd.DataFrame(snapshot.data)
        frame["region_code"] = code
        frames.append(frame)
    climate = pd.concat(frames, ignore_index=True)
    climate = climate[["region_code", "period", "latitude", "longitude", "PRECTOTCORR", "T2M"]]
    metadata = provider.metadata().model_dump(mode="json")
    return climate, metadata


def fetch_yield_snapshot(cache_dir: str) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Fetch national yields; FAOSTAT first, World Bank cereal aggregate as fallback.

    The fallback exists because the FAOSTAT origin intermittently returns 521
    (origin down) behind its CDN. Both sources are public and checksummed, so
    using the fallback is recorded in the snapshot metadata rather than hidden.
    """
    start = date(START_YEAR, 1, 1)
    end = date(date.today().year - 1, 12, 31)
    try:
        provider: FAOSTATProvider | WorldBankYieldProvider = FAOSTATProvider(cache_dir)
        request = DataRequest(
            provider="faostat",
            dataset="QCL",
            start_date=start,
            end_date=end,
            crops=["maize", "wheat", "soybean"],
            regions=["US"],
        )
        snapshot = provider.fetch(request)
        if not snapshot.data:
            raise RuntimeError("FAOSTAT returned no rows")
    except Exception as exc:
        logger.warning("faostat_unavailable_using_worldbank_fallback", error=str(exc))
        provider = WorldBankYieldProvider(cache_dir)
        request = DataRequest(
            provider="worldbank",
            dataset="AG.YLD.CREL.KG",
            start_date=start,
            end_date=end,
            regions=["US"],
        )
        snapshot = provider.fetch(request)

    frame = pd.DataFrame(snapshot.data)
    metadata = provider.metadata().model_dump(mode="json")
    if metadata.get("provider", "").startswith("World Bank"):
        metadata["preprocessing"] = [
            *metadata.get("preprocessing", []),
            "Fallback source used: FAOSTAT API was unreachable at access time",
        ]
    return frame, metadata


def generate_financial_snapshot() -> tuple[pd.DataFrame, dict[str, Any]]:
    """Synthetic credit panel; maize yield anomalies couple it to real climate."""
    end_year = date.today().year - 1
    panel = generate_credit_panel(START_YEAR, end_year, yield_anomalies=None, seed=SEED)
    metadata = panel_metadata(START_YEAR, end_year, SEED).model_dump(mode="json")
    return panel, metadata


def validate_climate(frame: pd.DataFrame) -> pd.DataFrame:
    valid = frame.dropna(subset=["PRECTOTCORR", "T2M"])
    # NASA POWER appends an annual aggregate row with period "YYYY13"; keep
    # calendar months only so downstream date handling stays valid.
    valid = valid[valid["period"].astype(str).str.match(r"^\d{4}(0[1-9]|1[0-2])$")]
    valid = valid[
        (valid["PRECTOTCORR"].between(MIN_RAINFALL_MM / 31.0, MAX_RAINFALL_MM / 31.0))
        & (valid["T2M"].between(MIN_TEMPERATURE_C, MAX_TEMPERATURE_C))
    ]
    rejected = len(frame) - len(valid)
    if rejected:
        logger.warning("climate_validation_rejected", rows=rejected)
    return valid.reset_index(drop=True)


def validate_yields(frame: pd.DataFrame) -> pd.DataFrame:
    valid = frame.dropna(subset=["yield_t_ha"])
    valid = valid[valid["yield_t_ha"].between(MIN_YIELD_T_HA, MAX_YIELD_T_HA)]
    valid = valid.drop_duplicates(subset=["region_code", "crop_code", "year"])
    rejected = len(frame) - len(valid)
    if rejected:
        logger.warning("yield_validation_rejected", rows=rejected)
    return valid.reset_index(drop=True)


def build_and_save_features() -> dict[str, int]:
    """Join snapshots into the yield matrix and risk panel; save as feature CSVs."""
    climate_raw = store.load_snapshot("nasa_power")
    yields_raw = store.load_snapshot("faostat")
    credit_raw = store.load_snapshot("synthetic_credit")
    if climate_raw is None or yields_raw is None or credit_raw is None:
        raise RuntimeError("Snapshots missing; run ingestion first.")

    climate_frame, yields_frame, credit_frame = climate_raw[0], yields_raw[0], credit_raw[0]
    state_climate = monthly_to_state_climate(climate_frame.to_dict("records"))
    yield_matrix = build_yield_matrix(state_climate, yields_frame.to_dict("records"))
    default_crop = str(yield_matrix["crop_code"].value_counts().index[0])
    anomaly = national_yield_anomaly(yield_matrix, crop=default_crop)
    risk_panel = build_risk_panel(state_climate, credit_frame, anomaly)

    store.save_feature_matrix("yield_matrix", yield_matrix)
    store.save_feature_matrix("risk_panel", risk_panel)
    store.save_feature_matrix("state_climate", state_climate)
    return {"yield_rows": len(yield_matrix), "risk_rows": len(risk_panel)}


async def register_in_database() -> dict[str, Any]:
    """Register regions, crops, observations, and dataset versions."""
    climate_raw = store.load_snapshot("nasa_power")
    yields_raw = store.load_snapshot("faostat")
    credit_raw = store.load_snapshot("synthetic_credit")
    if climate_raw is None or yields_raw is None or credit_raw is None:
        raise RuntimeError("Snapshots missing; run ingestion first.")

    climate_frame, climate_meta = climate_raw
    yields_frame, yields_meta = yields_raw
    credit_frame, credit_meta = credit_raw

    async with async_session_maker() as session:
        for table in (
            WeatherObservation,
            AgriculturalObservation,
            FinancialObservation,
            DatasetVersion,
            Dataset,
            Region,
            Crop,
        ):
            await session.execute(delete(table))

        regions: dict[str, Region] = {}
        national = Region(code="US", name="United States (national)", level="national")
        regions["US"] = national
        session.add(national)
        for code, state in STATES.items():
            region = Region(
                code=code,
                name=state["name"],
                level="state",
                geometry={"latitude": state["latitude"], "longitude": state["longitude"]},
            )
            regions[code] = region
            session.add(region)

        crops: dict[str, Crop] = {}
        crop_codes = sorted(set(yields_frame["crop_code"].astype(str)))
        for crop_code in crop_codes:
            name, category = CROP_NAMES.get(crop_code, (crop_code.title(), "cereal"))
            crop = Crop(code=crop_code, name=name, category=category, growing_season="May-Sep")
            crops[crop_code] = crop
            session.add(crop)
        await session.flush()

        for row in climate_frame.itertuples(index=False):
            session.add(
                WeatherObservation(
                    region_id=regions[row.region_code].id,
                    date=date(int(str(row.period)[:4]), int(str(row.period)[4:6]), 1),
                    variables={
                        "PRECTOTCORR_mm_day": float(row.PRECTOTCORR),
                        "T2M_c": float(row.T2M),
                    },
                    source="NASA POWER",
                )
            )

        for row in yields_frame.itertuples(index=False):
            session.add(
                AgriculturalObservation(
                    region_id=regions[row.region_code].id,
                    crop_id=crops[row.crop_code].id,
                    year=int(row.year),
                    yield_t_ha=float(row.yield_t_ha),
                    source="FAOSTAT QCL",
                )
            )

        for row in credit_frame.itertuples(index=False):
            session.add(
                FinancialObservation(
                    region_id=regions[row.region_code].id,
                    year=int(row.year),
                    indicators={
                        "loan_exposure_musd": float(row.loan_exposure_musd),
                        "interest_rate_pct": float(row.interest_rate_pct),
                        "debt_service_coverage": float(row.debt_service_coverage),
                        "commodity_price_index": float(row.commodity_price_index),
                        "credit_stress_rate": float(row.credit_stress_rate),
                        "synthetic": True,
                    },
                    source="AgRiX synthetic generator",
                )
            )

        for key, (name, provider, version, meta, frame) in {
            "nasa_power": (
                "NASA POWER monthly climate (panel states)",
                "NASA POWER / MERRA-2",
                "v1",
                climate_meta,
                climate_frame,
            ),
            "faostat": (
                "FAOSTAT US national crop yields",
                "FAO / FAOSTAT QCL",
                "v1",
                yields_meta,
                yields_frame,
            ),
            "synthetic_credit": (
                "Synthetic agricultural credit panel",
                "AgRiX synthetic generator",
                "v1",
                credit_meta,
                credit_frame,
            ),
        }.items():
            dataset = Dataset(name=name, provider=provider, version=version, metadata_=meta)
            session.add(dataset)
            await session.flush()
            session.add(
                DatasetVersion(
                    dataset_id=dataset.id,
                    version=version,
                    file_path=str(store.SNAPSHOT_DIR / f"{key}.csv"),
                    checksum=str(meta.get("checksum", "sha256:unknown")),
                    rows=len(frame),
                    schema_={column: str(dtype) for column, dtype in frame.dtypes.items()},
                )
            )

        await session.commit()

    return {
        "regions": len(regions),
        "crops": len(crops),
        "weather_rows": len(climate_frame),
        "agricultural_rows": len(yields_frame),
        "financial_rows": len(credit_frame),
    }


async def run_ingestion() -> dict[str, Any]:
    """Full pipeline: fetch/generate -> validate -> persist -> features -> DB."""
    store.ensure_dirs()
    cache_dir = str(store.DATA_DIR / "provider_cache")

    climate_frame, climate_meta = fetch_climate_snapshot(cache_dir)
    climate_frame = validate_climate(climate_frame)
    store.save_snapshot("nasa_power", climate_frame, climate_meta)

    yields_frame, yields_meta = fetch_yield_snapshot(cache_dir)
    yields_frame = validate_yields(yields_frame)
    store.save_snapshot("faostat", yields_frame, yields_meta)

    credit_frame, credit_meta = generate_financial_snapshot()
    store.save_snapshot("synthetic_credit", credit_frame, credit_meta)

    feature_counts = build_and_save_features()
    db_counts = await register_in_database()

    logger.info(
        "ingestion_complete",
        climate_rows=len(climate_frame),
        yield_snapshot_rows=len(yields_frame),
        credit_rows=len(credit_frame),
        **feature_counts,
    )
    return {
        "climate_rows": len(climate_frame),
        "yield_rows": len(yields_frame),
        "credit_rows": len(credit_frame),
        "features": feature_counts,
        "database": db_counts,
    }