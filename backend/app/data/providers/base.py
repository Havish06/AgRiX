import hashlib
import json
import os
import pickle
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from typing import Any, Protocol

from pydantic import BaseModel, ConfigDict, Field


class DataRequest(BaseModel):
    """Request for data fetching with explicit scope."""

    model_config = ConfigDict(extra="forbid")

    provider: str
    dataset: str
    start_date: date | None = None
    end_date: date | None = None
    regions: list[str] | None = None
    crops: list[str] | None = None
    variables: list[str] | None = None
    parameters: dict[str, Any] = Field(default_factory=dict)


class DatasetMetadata(BaseModel):
    """Metadata for a dataset version."""

    model_config = ConfigDict(extra="forbid")

    dataset_name: str
    provider: str
    url: str
    license: str
    access_date: date
    temporal_coverage: str
    geographic_coverage: str
    variables: list[dict[str, str]]
    preprocessing: list[str]
    version: str
    checksum: str
    rows_received: int
    rows_rejected: int
    rows_corrected: int
    rows_retained: int
    missing_values: dict[str, int]
    outliers: dict[str, int]


@dataclass(frozen=True)
class DataSnapshot:
    """Versioned data snapshot with provenance."""

    data: Any  # pandas.DataFrame or similar
    metadata: DatasetMetadata
    source_request: DataRequest
    fetched_at: date


class DataProvider(Protocol):
    """Contract for reproducible external data access."""

    def fetch(self, request: DataRequest) -> DataSnapshot:
        """Fetch a versioned snapshot for the requested scope."""
        ...

    def metadata(self) -> DatasetMetadata:
        """Return provider, license, coverage, and access information."""
        ...

    def cache_key(self, request: DataRequest) -> str:
        """Return a stable cache key for the request."""
        ...


class BaseDataProvider(ABC):
    """Base implementation with common caching and metadata logic."""

    def __init__(self, cache_dir: str, cache_ttl_hours: int = 24):
        self.cache_dir = cache_dir
        self.cache_ttl_hours = cache_ttl_hours

    @abstractmethod
    def _fetch_raw(self, request: DataRequest) -> Any:
        """Fetch raw data from the source."""
        pass

    @abstractmethod
    def _get_metadata(self) -> DatasetMetadata:
        """Get dataset metadata."""
        pass

    def fetch(self, request: DataRequest) -> DataSnapshot:
        """Fetch data with caching."""
        cache_key = self.cache_key(request)
        cache_path = os.path.join(self.cache_dir, f"{cache_key}.pkl")
        meta_path = os.path.join(self.cache_dir, f"{cache_key}.meta.json")

        # Check cache
        if os.path.exists(cache_path) and os.path.exists(meta_path):
            if time.time() - os.path.getmtime(cache_path) < self.cache_ttl_hours * 3600:
                with open(cache_path, "rb") as f:
                    data = pickle.load(f)
                with open(meta_path, encoding="utf-8") as f:
                    meta_dict = json.load(f)
                metadata = DatasetMetadata(**meta_dict)
                return DataSnapshot(
                    data=data,
                    metadata=metadata,
                    source_request=request,
                    fetched_at=date.fromtimestamp(os.path.getmtime(cache_path)),
                )

        # Fetch fresh
        raw_data = self._fetch_raw(request)
        checksum = hashlib.sha256(pickle.dumps(raw_data)).hexdigest()
        metadata = self.metadata().model_copy(
            update={"access_date": date.today(), "checksum": f"sha256:{checksum}"}
        )

        # Cache
        os.makedirs(self.cache_dir, exist_ok=True)
        with open(cache_path, "wb") as file:
            pickle.dump(raw_data, file)
        with open(meta_path, "w", encoding="utf-8") as file:
            json.dump(metadata.model_dump(mode="json"), file)

        return DataSnapshot(
            data=raw_data,
            metadata=metadata,
            source_request=request,
            fetched_at=date.today(),
        )

    def metadata(self) -> DatasetMetadata:
        return self._get_metadata()

    def cache_key(self, request: DataRequest) -> str:
        """Generate stable cache key from request."""
        key_parts = [
            request.provider,
            request.dataset,
            str(request.start_date),
            str(request.end_date),
            ",".join(sorted(request.regions or [])),
            ",".join(sorted(request.crops or [])),
            ",".join(sorted(request.variables or [])),
            json.dumps(request.parameters, sort_keys=True),
        ]
        key_string = "|".join(key_parts)
        return hashlib.sha256(key_string.encode()).hexdigest()[:32]
