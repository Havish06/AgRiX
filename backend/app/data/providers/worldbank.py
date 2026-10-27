"""World Bank cereal-yield provider (fallback agricultural source).

The FAOSTAT API sits behind a CDN whose origin is occasionally unavailable
(HTTP 521). To keep the pipeline runnable without inventing data, this
provider fetches the World Bank indicator AG.YLD.CREL.KG (cereal yield,
kg per hectare) for the United States from the public, keyless World Bank
API. Values are converted to t/ha and emitted as a single aggregate crop
`cereal`, clearly labelled so downstream consumers know this is a cereal
aggregate rather than a crop-specific FAOSTAT series.

Source: https://data.worldbank.org/indicator/AG.YLD.CREL.KG
License: CC BY 4.0 (World Bank open data terms).
"""

from datetime import date
from typing import Any

import httpx

from app.data.providers.base import BaseDataProvider, DataRequest, DatasetMetadata

INDICATOR = "AG.YLD.CREL.KG"
COUNTRY = "USA"


class WorldBankYieldProvider(BaseDataProvider):
    """Fetch annual US cereal yield (kg/ha -> t/ha) from the World Bank API."""

    def __init__(
        self,
        cache_dir: str,
        base_url: str = "https://api.worldbank.org/v2",
        cache_ttl_hours: int = 24 * 30,
    ) -> None:
        super().__init__(cache_dir, cache_ttl_hours)
        self.base_url = base_url.rstrip("/")
        self._last_metadata: DatasetMetadata | None = None

    def _fetch_raw(self, request: DataRequest) -> list[dict[str, Any]]:
        start_year = request.start_date.year if request.start_date else 1990
        end_year = request.end_date.year if request.end_date else date.today().year - 1
        url = f"{self.base_url}/country/{COUNTRY}/indicator/{INDICATOR}"
        query = {
            "format": "json",
            "per_page": 1000,
            "date": f"{start_year}:{end_year}",
        }
        with httpx.Client(timeout=60.0) as client:
            response = client.get(url, params=query)
            response.raise_for_status()
            payload = response.json()

        records = payload[1] if isinstance(payload, list) and len(payload) > 1 else []
        rows: list[dict[str, Any]] = []
        for record in records:
            if record.get("value") is None:
                continue
            rows.append(
                {
                    "year": int(record["date"]),
                    "region_code": "US",
                    "crop_code": "cereal",
                    "yield_t_ha": float(record["value"]) / 1000.0,  # kg/ha -> t/ha
                    "area_ha": None,
                    "production_t": None,
                }
            )
        rows.sort(key=lambda row: row["year"])

        start = min((row["year"] for row in rows), default=start_year)
        end = max((row["year"] for row in rows), default=end_year)
        self._last_metadata = self._get_metadata().model_copy(
            update={
                "url": url,
                "temporal_coverage": f"{start} to {end}",
                "rows_received": len(records),
                "rows_retained": len(rows),
                "rows_rejected": len(records) - len(rows),
            }
        )
        return rows

    def _get_metadata(self) -> DatasetMetadata:
        return DatasetMetadata(
            dataset_name="World Bank US cereal yield (aggregate)",
            provider="World Bank Open Data / FAO source indicator AG.YLD.CREL.KG",
            url=f"{self.base_url}/country/{COUNTRY}/indicator/{INDICATOR}",
            license="CC BY 4.0 (World Bank open data terms)",
            access_date=date.today(),
            temporal_coverage="Request-defined",
            geographic_coverage="United States (national)",
            variables=[
                {"name": "yield_t_ha", "unit": "t/ha"},
                {"name": "year", "unit": "calendar year"},
                {"name": "crop_code", "unit": "cereal aggregate"},
                {"name": "region_code", "unit": "ISO area"},
            ],
            preprocessing=[
                "Yield converted from kg/ha to t/ha",
                "Null-value years dropped",
                "Cereal aggregate: not split by maize/wheat/soybean",
            ],
            version="World Bank API v2 / AG.YLD.CREL.KG",
            checksum="sha256:not-fetched",
            rows_received=0,
            rows_rejected=0,
            rows_corrected=0,
            rows_retained=0,
            missing_values={},
            outliers={},
        )

    def metadata(self) -> DatasetMetadata:
        return self._last_metadata or self._get_metadata()