import logging
import sys
from typing import Any, cast

import structlog
from structlog.types import EventDict, Processor

from app.core.config import settings


def add_correlation_id(
    logger: logging.Logger, method_name: str, event_dict: EventDict
) -> EventDict:
    correlation_id = getattr(logger, "correlation_id", None)
    if correlation_id:
        event_dict["correlation_id"] = correlation_id
    return event_dict


def setup_logging() -> None:
    timestamper = structlog.processors.TimeStamper(fmt="iso", utc=True)

    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        add_correlation_id,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        timestamper,
        structlog.processors.format_exc_info,
    ]

    if settings.LOG_FORMAT == "json":
        processors: list[Processor] = shared_processors + [
            structlog.processors.JSONRenderer(),
        ]
    else:
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.LOG_LEVEL),
    )

    for logger_name in ["uvicorn", "uvicorn.access", "sqlalchemy.engine"]:
        logging.getLogger(logger_name).handlers = []
        logging.getLogger(logger_name).propagate = True


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    return cast(structlog.stdlib.BoundLogger, structlog.get_logger(name))


class LoggerMixin:
    @property
    def logger(self) -> structlog.stdlib.BoundLogger:
        return get_logger(self.__class__.__module__ + "." + self.__class__.__name__)

    def log_info(self, event: str, **kwargs: Any) -> None:
        self.logger.info(event, **kwargs)

    def log_warning(self, event: str, **kwargs: Any) -> None:
        self.logger.warning(event, **kwargs)

    def log_error(self, event: str, **kwargs: Any) -> None:
        self.logger.error(event, **kwargs)

    def log_debug(self, event: str, **kwargs: Any) -> None:
        self.logger.debug(event, **kwargs)
