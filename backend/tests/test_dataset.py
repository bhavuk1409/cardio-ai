"""
Unit tests — dataset loading, cleaning, target binarisation, preprocessing.
"""
import numpy as np
import pandas as pd
import pytest

from app.ml.dataset import (
    FEATURE_NAMES,
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
    clean_dataset,
    binarize_target,
    stratified_split,
    describe_dataset,
)
from app.ml.preprocessing import validate_input, build_preprocessor


def _make_synthetic_df(n: int = 50, seed: int = 0) -> pd.DataFrame:
    """Create a small synthetic dataset that mimics the Cleveland CSV format."""
    rng = np.random.default_rng(seed)
    df = pd.DataFrame({
        "age": rng.integers(30, 80, n).astype(float),
        "sex": rng.integers(0, 2, n).astype(float),
        "cp": rng.integers(1, 5, n).astype(float),
        "trestbps": rng.integers(90, 200, n).astype(float),
        "chol": rng.integers(150, 400, n).astype(float),
        "fbs": rng.integers(0, 2, n).astype(float),
        "restecg": rng.integers(0, 3, n).astype(float),
        "thalach": rng.integers(70, 200, n).astype(float),
        "exang": rng.integers(0, 2, n).astype(float),
        "oldpeak": rng.uniform(0, 6, n).round(1),
        "slope": rng.integers(1, 4, n).astype(float),
        "ca": rng.integers(0, 4, n).astype(float),
        "thal": rng.choice([3, 6, 7], n).astype(float),
        "num": rng.integers(0, 5, n).astype(float),
    })
    # Inject some missing-value markers
    df.loc[0, "ca"] = "?"
    df.loc[1, "thal"] = np.nan
    return df


class TestDatasetCleaning:
    def test_clean_replaces_question_marks(self):
        df = _make_synthetic_df()
        cleaned = clean_dataset(df)
        # "?" should have been replaced
        for col in FEATURE_NAMES:
            assert "?" not in cleaned[col].astype(str).values

    def test_clean_requires_all_columns(self):
        df = _make_synthetic_df()
        df_missing = df.drop(columns=["age"])
        with pytest.raises(ValueError, match="missing columns"):
            clean_dataset(df_missing)

    def test_clean_coerces_numeric_types(self):
        df = _make_synthetic_df()
        cleaned = clean_dataset(df)
        for col in FEATURE_NAMES:
            assert pd.api.types.is_numeric_dtype(cleaned[col]), f"{col} not numeric"

    def test_binarize_target_mapping(self):
        df = _make_synthetic_df()
        cleaned = clean_dataset(df)
        _, y = binarize_target(cleaned)
        # Binary
        assert set(y.unique()).issubset({0, 1})

    def test_binarize_original_0_maps_to_0(self):
        df = _make_synthetic_df(n=10)
        df["num"] = 0
        cleaned = clean_dataset(df)
        _, y = binarize_target(cleaned)
        assert (y == 0).all()

    def test_binarize_original_nonzero_maps_to_1(self):
        df = _make_synthetic_df(n=10)
        df["num"] = 3
        cleaned = clean_dataset(df)
        _, y = binarize_target(cleaned)
        assert (y == 1).all()

    def test_stratified_split_preserves_distribution(self):
        df = _make_synthetic_df(n=100)
        cleaned = clean_dataset(df)
        X, y = binarize_target(cleaned)
        X_tr, X_te, y_tr, y_te = stratified_split(X, y, test_size=0.2)
        train_rate = y_tr.mean()
        test_rate = y_te.mean()
        # Allow 10% relative difference
        assert abs(train_rate - test_rate) < 0.15

    def test_describe_dataset_structure(self):
        df = _make_synthetic_df(n=50)
        cleaned = clean_dataset(df)
        X, y = binarize_target(cleaned)
        desc = describe_dataset(X, y)
        assert "n_records" in desc
        assert "missing_values" in desc
        assert desc["n_features"] == 13


class TestPreprocessing:
    def test_preprocessor_fits_and_transforms(self):
        df = _make_synthetic_df(n=60)
        cleaned = clean_dataset(df)
        X, _ = binarize_target(cleaned)
        preprocessor = build_preprocessor()
        X_trans = preprocessor.fit_transform(X)
        assert X_trans.shape[0] == len(X)
        assert X_trans.shape[1] > 13  # OHE expands feature count

    def test_validate_input_accepts_valid(self):
        valid = {
            "age": 55, "sex": 1, "cp": 2, "trestbps": 130, "chol": 200,
            "fbs": 0, "restecg": 0, "thalach": 160, "exang": 0,
            "oldpeak": 1.5, "slope": 2, "ca": 0, "thal": 3,
        }
        cleaned = validate_input(valid)
        assert cleaned["age"] == 55.0

    def test_validate_input_rejects_out_of_range(self):
        bad = {
            "age": 999,  # out of range
            "sex": 1, "cp": 2, "trestbps": 130, "chol": 200,
            "fbs": 0, "restecg": 0, "thalach": 160, "exang": 0,
            "oldpeak": 1.5, "slope": 2, "ca": 0, "thal": 3,
        }
        with pytest.raises(ValueError, match="age"):
            validate_input(bad)

    def test_validate_input_rejects_missing_field(self):
        incomplete = {
            "sex": 1, "cp": 2, "trestbps": 130, "chol": 200,
            "fbs": 0, "restecg": 0, "thalach": 160, "exang": 0,
            "oldpeak": 1.5, "slope": 2, "ca": 0, "thal": 3,
            # age missing
        }
        with pytest.raises(ValueError, match="age"):
            validate_input(incomplete)
