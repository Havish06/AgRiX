"""On-disk layout for snapshots, feature matrices, and the model registry.

Snapshots and artifacts are plain CSV/JSON/joblib files so that every result
can be inspected, checksummed, and reproduced without a running server.
"""

import hashlib
import json
import pickle
from pathlib import Path
from typing import Any

import pandas as pd

BACKEND_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_DIR / "data"
SNAPSHOT_DIR = DATA_DIR / "snapshots"
FEATURES_DIR = DATA_DIR / "features"
REGISTRY_DIR = BACKEND_DIR / "model_registry"

SNAPSHOT_KEYS = ("nasa_power", "faostat", "synthetic_credit")


def ensure_dirs() -> None:
    for directory in (SNAPSHOT_DIR, FEATURES_DIR, REGISTRY_DIR):
        directory.mkdir(parents=True, exist_ok=True)


def checksum_bytes(payload: bytes) -> str:
    return f"sha256:{hashlib.sha256(payload).hexdigest()}"


def save_snapshot(key: str, frame: pd.DataFrame, metadata: dict[str, Any]) -> Path:
    """Persist a validated snapshot as CSV plus sidecar metadata JSON."""
    ensure_dirs()
    csv_path = SNAPSHOT_DIR / f"{key}.csv"
    payload = frame.to_csv(index=False).encode("utf-8")
    csv_path.write_bytes(payload)
    metadata = {**metadata, "checksum": checksum_bytes(payload)}
    (SNAPSHOT_DIR / f"{key}.meta.json").write_text(
        json.dumps(metadata, indent=2, default=str), encoding="utf-8"
    )
    return csv_path


def load_snapshot(key: str) -> tuple[pd.DataFrame, dict[str, Any]] | None:
    csv_path = SNAPSHOT_DIR / f"{key}.csv"
    meta_path = SNAPSHOT_DIR / f"{key}.meta.json"
    if not csv_path.exists() or not meta_path.exists():
        return None
    frame = pd.read_csv(csv_path)
    metadata = json.loads(meta_path.read_text(encoding="utf-8"))
    return frame, metadata


def snapshots_present() -> bool:
    return all((SNAPSHOT_DIR / f"{key}.csv").exists() for key in SNAPSHOT_KEYS)


def save_feature_matrix(name: str, frame: pd.DataFrame) -> Path:
    ensure_dirs()
    path = FEATURES_DIR / f"{name}.csv"
    frame.to_csv(path, index=False)
    return path


def load_feature_matrix(name: str) -> pd.DataFrame | None:
    path = FEATURES_DIR / f"{name}.csv"
    if not path.exists():
        return None
    return pd.read_csv(path)


def save_artifact(model_key: str, model: Any) -> Path:
    ensure_dirs()
    path = REGISTRY_DIR / f"{model_key}.pkl"
    path.write_bytes(pickle.dumps(model))
    return path


def load_artifact(model_key: str) -> Any | None:
    path = REGISTRY_DIR / f"{model_key}.pkl"
    if not path.exists():
        return None
    return pickle.loads(path.read_bytes())


def save_registry(records: dict[str, Any]) -> None:
    ensure_dirs()
    (REGISTRY_DIR / "registry.json").write_text(
        json.dumps(records, indent=2, default=str), encoding="utf-8"
    )


def load_registry() -> dict[str, Any] | None:
    path = REGISTRY_DIR / "registry.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))