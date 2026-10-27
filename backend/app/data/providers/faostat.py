"""FAOSTAT public agricultural-statistics provider.

Fetches crop production statistics from the public FAOSTAT bulk API
(no API key required). The default scope is national crop yields for the
United States, reported in tonnes per hectare. Raw responses are cached,
checksummed, and normalized to a flat row-per-record table.

Source documentation: https://www.fao.org/faostat/en/#data/QCL
License: CC BY-NC-SA 3.0 IGO (FAOSTAT terms of use).
"""

from datetime import date
from typing import Any

import httpx

from app.data.providers.base import BaseDataProvider, DataRequest, DatasetMetadata

# FAOSTAT codes (standard FAO code lists)
AREA_USA = 231
ELEMENT_YIELD_HG_HA = 5419  # Yield (hg/ha)
ITEM_CODES = {
    "maize": 56,
    "wheat": 15,
    "soybean": 236,
}


class FAOSTATProvider(BaseDataProvider):
    """Fetch annual crop yield observations from the FAOSTAT public API."""

    def __init__(
        self,
        cache_dir: str,
        base_url: str = "https://fenixservices.fao.org/faostat/api/v1",
        cache_ttl_hours: int = 24 * 30,
    ) -> None:
        super().__init__(cache_dir, cache_ttl_hours)
        self.base_url = base_url.rstrip("/")
        self._last_metadata: DatasetMetadata | None = None

    def _fetch_raw(self, request: DataRequest) -> list[dict[str, Any]]:
        crops = request.crops or list(ITEM_CODES)
        start_year = request.start_date.year if request.start_date else 1990
        end_year = request.end_date.year if request.end_date else date.today().year - 1
        years = [str(year) for year in range(start_year, end_year + 1)]
        items = [str(ITEM_CODES[crop]) for crop in crops if crop in ITEM_CODES]
        unknown = [crop for crop in crops if crop not in ITEM_CODES]
        if unknown:
            raise ValueError(f"FAOSTAT provider has no item code for crops: {unknown}")

        query = {
            "area_cs": "FAO",
            "item_cs": "FAO",
            "element_cs": "FAO",
            "show_codes": 1,
            "show_flags": 0,
            "null_values": 0,
            "output_type": "objects",
            "lang": "en",
            "areas": str(AREA_USA),
            "items": ",".join(items),
            "elements": str(ELEMENT_YIELD_HG_HA),
            "years": ",".join(years),
        }
        url = f"{self.base_url}/data/QCL"
        with httpx.Client(timeout=60.0) as client:
            response = client.get(url, params=query)
            response.raise_for_status()
            payload = response.json()

        item_names = {code: name for code, name in ITEM_CODES.items()}
        rows: list[dict[str, Any]] = []
        for record in payload.get("data", []):
            item_code = record.get("Item Code")
            crop_name = next(
                (name for name, code in ITEM_CODES.items() if code == item_code), None
            )
            if crop_name is None:
                continue
            rows.append(
                {
                    "year": int(record["Year"]),
                    "region_code": "US",
                    "crop_code": crop_name,
                    "yield_t_ha": float(record["Value"]) / 1000.0,  # hg/ha -> t/ha
                    "area_ha": None,
                    "production_t": None,
                }
            )
        rows.sort(key=lambda row: (row["crop_code"], row["year"]))

        start = min((row["year"] for row in rows), default=start_year)
        end = max((row["year"] for row in rows), default=end_year)
        self._last_metadata = self._get_metadata().model_copy(
            update={
                "url": url,
                "temporal_coverage": f"{start} to {end}",
                "variables": [
                    {"name": "yield_t_ha", "unit": "t/ha"},
                    {"name": "year", "unit": "calendar year"},
                    {"name": "crop_code", "unit": "FAO item name"},
                    {"name": "region_code", "unit": "ISO area"},
                ],
                "rows_received": len(payload.get("data", [])),
                "rows_retained": len(rows),
                "rows_rejected": len(payload.get("data", [])) - len(rows),
            }
        )
        return rows

    def _get_metadata(self) -> DatasetMetadata:
        return DatasetMetadata(
            dataset_name="FAOSTAT national crop yields (United States)",
            provider="FAO / FAOSTAT Production Crops and Livestock (QCL)",
            url=f"{self.base_url}/data/QCL",
            license="CC BY-NC-SA 3.0 IGO (FAOSTAT terms of use)",
            access_date=date.today(),
            temporal_coverage="Request-defined",
            geographic_coverage="United States (national)",
            variables=[],
            preprocessing=[
                "Yield converted from hg/ha to t/ha",
                "Records without a value dropped by the API (null_values=0)",
            ],
            version="FAOSTAT API v1 / QCL",
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
