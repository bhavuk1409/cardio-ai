"""
Logging configuration.
"""
import logging
import sys


def setup_logging(level: int = logging.INFO) -> None:
    fmt = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    logging.basicConfig(stream=sys.stdout, level=level, format=fmt)


logger = logging.getLogger("clinical_risk")
