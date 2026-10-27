"""NASA POWER public climate-data provider.

The provider uses NASA POWER's public monthly point API and returns records in
a small, serializable format so the common cache can persist verified snapshots.
No API key is required. Coordinates and variables must be supplied explicitly in
the request parameters to keep the provenance of every fetch auditable.
"""

from datetime import date
from typing import Any

import httpx

from app.data.providers.base import BaseDataProvider, DataRequest, DatasetMetadata


class NASAPowerProvider(BaseDataProvider):
    """Fetch monthly precipitation and temperature observations from NASA POWER."""

    def __init__(
        self,
        cache_dir: str,
        base_url: str = "https://power.larc.nasa.gov/api",
        cache_ttl_hours: int = 24,
    ) -> None:
        super().__init__(cache_dir, cache_ttl_hours)
        self.base_url = base_url.rstrip("/")
        self._last_metadata: DatasetMetadata | None = None

    def _fetch_raw(self, request: DataRequest) -> list[dict[str, Any]]:
        parameters = request.variables or ["PRECTOTCORR", "T2M"]
        latitude = request.parameters.get("latitude")
        longitude = request.parameters.get("longitude")
        if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
            raise ValueError(
                "NASA POWER requests require numeric latitude and longitude parameters"
            )

        start_year = request.start_date.year if request.start_date else date.today().year - 1
        end_year = request.end_date.year if request.end_date else start_year
        query = {
            "parameters": ",".join(parameters),
            "community": request.parameters.get("community", "AG"),
            "longitude": longitude,
            "latitude": latitude,
            "start": start_year,
            "end": end_year,
            "format": "JSON",
        }
        url = f"{self.base_url}/temporal/monthly/point"
        with httpx.Client(timeout=30.0) as client:
            response = client.get(url, params=query)
            response.raise_for_status()
            payload = response.json()

        values = payload.get("properties", {}).get("parameter", {})
        periods = sorted({period for series in values.values() for period in series})
        rows = [
            {
                "period": period,
                "latitude": latitude,
                "longitude": longitude,
                **{variable: values.get(variable, {}).get(period) for variable in parameters},
            }
            for period in periods
        ]
        self._last_metadata = self._get_metadata().model_copy(
            update={
                "url": url,
                "rows_received": len(rows),
                "rows_retained": len(rows),
                "variables": [
                    {
                        "name": variable,
                        "unit": payload.get("parameters", {})
                        .get(variable, {})
                        .get("units", "unknown"),
                    }
                    for variable in parameters
                ],
            }
        )
        return rows

    def _get_metadata(self) -> DatasetMetadata:
        return DatasetMetadata(
            dataset_name="NASA POWER monthly point climate observations",
            provider="NASA POWER / MERRA-2",
            url=f"{self.base_url}/temporal/monthly/point",
            license="NASA POWER Data Access Viewer terms",
            access_date=date.today(),
            temporal_coverage="Request-defined",
            geographic_coverage="Request-defined point",
            variables=[],
            preprocessing=["API response normalized to one row per period and coordinate"],
            version="NASA POWER API v2",
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
