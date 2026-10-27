from typing import Any


class AgRiXError(Exception):
    """Base exception for AgRiX."""

    def __init__(self, message: str, code: str, details: dict[str, Any] | None = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(message)

    def to_dict(self) -> dict[str, Any]:
        return {
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details,
            }
        }


class ValidationError(AgRiXError):
    def __init__(self, message: str, field: str, value: Any):
        super().__init__(
            message,
            "VALIDATION_ERROR",
            {"field": field, "value": str(value)},
        )


class DataLeakageError(AgRiXError):
    def __init__(self, message: str, details: dict[str, Any]):
        super().__init__(message, "DATA_LEAKAGE", details)


class ModelNotFittedError(AgRiXError):
    def __init__(self, model_name: str):
        super().__init__(
            f"Model {model_name} has not been fitted",
            "MODEL_NOT_FITTED",
            {"model": model_name},
        )


class DatasetNotFoundError(AgRiXError):
    def __init__(self, dataset_id: str):
        super().__init__(
            f"Dataset {dataset_id} not found",
            "DATASET_NOT_FOUND",
            {"dataset_id": dataset_id},
        )


class ModelNotFoundError(AgRiXError):
    def __init__(self, model_id: str):
        super().__init__(
            f"Model {model_id} not found",
            "MODEL_NOT_FOUND",
            {"model_id": model_id},
        )


class ExperimentNotFoundError(AgRiXError):
    def __init__(self, experiment_id: str):
        super().__init__(
            f"Experiment {experiment_id} not found",
            "EXPERIMENT_NOT_FOUND",
            {"experiment_id": experiment_id},
        )


class InsufficientDataError(AgRiXError):
    def __init__(self, message: str, required: int, available: int):
        super().__init__(
            message,
            "INSUFFICIENT_DATA",
            {"required": required, "available": available},
        )


class ConfigurationError(AgRiXError):
    def __init__(self, message: str, config_key: str):
        super().__init__(
            message,
            "CONFIGURATION_ERROR",
            {"config_key": config_key},
        )
