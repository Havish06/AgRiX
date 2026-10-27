from datetime import date
from typing import Any

from app.data.providers.base import BaseDataProvider, DataRequest, DatasetMetadata


class MemoryProvider(BaseDataProvider):
    def _fetch_raw(self, request: DataRequest) -> Any:
        return {"dataset": request.dataset, "rows": [1, 2, 3]}

    def _get_metadata(self) -> DatasetMetadata:
        return DatasetMetadata(
            dataset_name="Public test snapshot",
            provider="test",
            url="https://example.com/snapshot",
            license="CC BY 4.0",
            access_date=date(2026, 1, 1),
            temporal_coverage="2020-2024",
            geographic_coverage="US",
            variables=[{"name": "yield", "unit": "t/ha"}],
            preprocessing=[],
            version="1.0.0",
            checksum="sha256:test",
            rows_received=3,
            rows_rejected=0,
            rows_corrected=0,
            rows_retained=3,
            missing_values={},
            outliers={},
        )


def test_provider_caches_data_and_metadata(tmp_path: Any) -> None:
    provider = MemoryProvider(str(tmp_path))
    request = DataRequest(provider="test", dataset="snapshot")

    first = provider.fetch(request)
    second = provider.fetch(request)

    assert first.data == second.data
    assert second.metadata.checksum.startswith("sha256:")
    assert second.source_request == request
