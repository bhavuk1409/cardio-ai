"""
Pytest configuration — adds the backend root to sys.path.
"""
import os
import sys
from pathlib import Path

os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

try:
    import torch
    torch.set_num_threads(1)
except ImportError:
    pass

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
