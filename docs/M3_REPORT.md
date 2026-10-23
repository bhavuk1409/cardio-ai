# CSET343 — Milestone 3 Project Report
## AI-Driven Clinical Risk Prediction: Data Preprocessing and Baseline Model Implementation

**Institution:** Bennett University / School of Computer Science Engineering and Technology  
**Course:** CSET343 — Artificial Intelligence and Machine Learning Applications  
**Academic Session:** 2024–2025  
**Evaluation Window:** October 12 – October 16  
**Project Title:** AI-Driven Clinical Risk Prediction and Context-Aware Medical Information Retrieval  
**Subtitle:** A Cardiovascular Risk Prediction Case Study using Machine Learning, Retrieval-Augmented Generation (RAG), SHAP and Large Language Models  

### Project Team
- **Bhavuk Agrawal** — Enrollment No: `E23CSEU1938`
- **Goyal Annayan** — Enrollment No: `E23CSEU1937`

---

## 1. Project Introduction & Problem Statement

Cardiovascular diseases (CVDs) remain the leading cause of mortality worldwide, accounting for an estimated 17.9 million deaths annually according to the World Health Organization. Early identification of individuals at high risk for coronary artery disease enables targeted preventive interventions, lifestyle modifications, and timely medical care.

However, traditional clinical risk estimators frequently rely on rigid linear scoring systems that can fail to capture complex non-linear interactions among clinical measurements, electrocardiographic biomarkers, and patient history. Furthermore, deploying machine learning systems in clinical decision support requires:
1. Complete transparency and explainability.
2. Protection against data leakage during preprocessing.
3. Separation of statistical risk inference from generative natural language interactions to prevent hallucinated diagnoses.

This project delivers a robust, locally runnable academic healthcare AI prototype bridging reproducible supervised machine learning with contextual medical information retrieval.

---

## 2. Milestone 3 Objectives

Milestone 3 focuses on foundational data engineering, exploratory data analysis, and baseline model implementation:
1. Ingest the canonical UCI Heart Disease benchmark dataset (Cleveland subset).
2. Formulate a reproducible binary classification target.
3. Construct a leak-free scikit-learn preprocessing pipeline handling missing data, continuous scaling, and categorical one-hot encoding.
4. Perform exploratory data analysis (EDA) and persist publication-quality visual diagnostics.
5. Train and evaluate an interpretable **Logistic Regression** baseline classifier using stratified validation.
6. Establish baseline classification metrics (Accuracy, Precision, Recall, F1-Score, and ROC-AUC).

---

## 3. Dataset Description & Provenance

### 3.1 Data Source
The study utilizes the **Cleveland Heart Disease Dataset** hosted by the **UCI Machine Learning Repository** (Repository ID: 45):
- **Source URL:** https://archive.ics.uci.edu/dataset/45/heart+disease
- **Verified Record Count:** 303 clinical records.
- **Features:** 13 input predictors, 1 integer target (`num`).

### 3.2 Feature Schema
| Feature | Type | Range / Categories | Description |
| :--- | :--- | :--- | :--- |
| `age` | Continuous | 29 – 77 years | Age of the patient in years |
| `sex` | Binary | 1 = Male, 0 = Female | Biological sex |
| `cp` | Nominal | 1, 2, 3, 4 | Chest pain type (1: Typical, 2: Atypical, 3: Non-Anginal, 4: Asymptomatic) |
| `trestbps`| Continuous | 94 – 200 mm Hg | Resting systolic blood pressure on hospital admission |
| `chol` | Continuous | 126 – 564 mg/dl | Serum cholesterol level |
| `fbs` | Binary | 1 = True, 0 = False | Fasting blood sugar > 120 mg/dl |
| `restecg`| Categorical | 0, 1, 2 | Resting ECG (0: Normal, 1: ST-T abnormality, 2: LV hypertrophy) |
| `thalach`| Continuous | 71 – 202 bpm | Maximum heart rate achieved during treadmill exercise |
| `exang` | Binary | 1 = Yes, 0 = No | Exercise-induced angina |
| `oldpeak`| Continuous | 0.0 – 6.2 mm | ST depression induced by exercise relative to rest |
| `slope` | Ordinal | 1, 2, 3 | Slope of peak exercise ST segment (1: Up, 2: Flat, 3: Down) |
| `ca` | Count | 0, 1, 2, 3 | Number of major coronary vessels colored by fluoroscopy |
| `thal` | Nominal | 3, 6, 7 | Thallium heart scan (3: Normal, 6: Fixed defect, 7: Reversable defect) |
| `num` | Target | 0, 1, 2, 3, 4 | Angiographic disease status (0: <50% stenosis, 1–4: >50% stenosis) |

### 3.3 Target Binarization
The raw target column `num` represents the severity of coronary artery disease. For our primary binary diagnostic baseline:
- **Class 0 (Negative / No Disease Detected):** `num == 0` (164 records, 54.1%)
- **Class 1 (Positive / Disease Present):** `num > 0` (139 records, 45.9%)

*Clinical Disclaimer:* This label reflects angiographic stenosis presence in the historical Cleveland study sample and is not a calibrated absolute lifetime clinical risk probability.

---

## 4. Data Preprocessing & Leak-Free Pipeline

To guarantee statistical validity and prevent data leakage:
1. **Missing Value Identification:** Verified missing markers (`?`, `-9`, `NaN`). Found 4 missing values in `ca` and 2 in `thal`.
2. **Stratified Split:** 80% train (242 samples) and 20% test (61 samples) using `random_state=42`. Stratification preserves the ~54:46 class ratio across both splits.
3. **Pipeline Structure:**
   - **Numeric Branch:** `SimpleImputer(strategy='median')` followed by `StandardScaler()`. Fits strictly on the 242 training instances.
   - **Categorical Branch:** `SimpleImputer(strategy='most_frequent')` followed by `OneHotEncoder(handle_unknown='ignore', sparse_output=False)`.
4. **Persistence:** The preprocessor and model are bound in a single scikit-learn `Pipeline` object and saved to disk via `joblib`.

---

## 5. Exploratory Data Analysis (EDA) Findings

The automated EDA script generated diagnostic figures saved to `backend/results/eda/`:
- **Target Distribution (`target_distribution.png`):** Demonstrates balanced binary classes (164 negative vs 139 positive), avoiding extreme class-imbalance pathologies.
- **Missing Values by Feature (`missing_values.png`):** Only `ca` (4) and `thal` (2) require imputation; all other 11 features are 100% complete.
- **Distributions (`numeric_distributions.png`):**
  - Resting blood pressure (`trestbps`) exhibits a right-skewed distribution centered around 130 mm Hg.
  - Serum cholesterol (`chol`) shows typical biological variance with extreme values up to 564 mg/dl.
- **Feature Correlation Matrix (`correlation_heatmap.png`):**
  - Moderate negative correlation between maximum heart rate (`thalach`) and target class ($r = -0.42$).
  - Positive correlation between exercise ST depression (`oldpeak`) and target class ($r = +0.42$).
- **Chest Pain Type Analysis (`chest_pain_by_target.png`):** Asymptomatic chest pain (Type 4) is heavily enriched for Class 1 (disease present), highlighting silent ischemia risks.

---

## 6. Baseline Model: Logistic Regression

A standard linear baseline with $L_2$ regularization was selected for Milestone 3 due to its clinical interpretability, calibrated log-odds outputs, and minimal risk of overfitting on small sample sizes.

- **Estimator:** `sklearn.linear_model.LogisticRegression`
- **Solver:** `lbfgs`
- **Class Weight:** `balanced`
- **Max Iterations:** 1000
- **Random State:** 42

### 6.1 Measured Baseline Results (Held-Out Test Set: $n = 61$)

| Metric | Measured Value | Clinical Interpretation |
| :--- | :--- | :--- |
| **Accuracy** | **86.89%** (53 / 61 correct) | Overall correctness on the independent test sample |
| **Precision** | **81.25%** | When predicting disease, 81.3% were true disease cases |
| **Recall (Sensitivity)** | **92.86%** (26 / 28 caught) | Crucial in medicine: detected 92.9% of true positive patients |
| **F1-Score** | **86.67%** | Harmonic mean balancing sensitivity and precision |
| **ROC-AUC** | **95.78%** | High ranking capability across classification thresholds |

### 6.2 Confusion Matrix
- **True Negatives ($TN$):** 27 (Correctly classified as no disease)
- **False Positives ($FP$):** 6 (Type I error: healthy flagged as at-risk)
- **False Negatives ($FN$):** 2 (Type II error: disease missed)
- **True Positives ($TP$):** 26 (Correctly identified positive cases)

---

## 7. System Architecture (Milestone 3 State)

During Milestone 3, the foundational backend and machine learning architecture was established:
- Data loader module (`app/ml/dataset.py`)
- Leak-free preprocessor (`app/ml/preprocessing.py`)
- EDA engine (`app/ml/eda.py`)
- Model training & evaluation harness (`app/ml/train.py`, `app/ml/evaluation.py`)
- Automated unit test suite verifying data transformations and pipeline integrity.

---

## 8. Milestone 3 Limitations

1. **Dataset Size:** 303 samples from a single clinical center (Cleveland Clinic) limits statistical power for multi-subgroup demographic generalizations.
2. **Linear Decision Boundary:** Logistic Regression cannot capture higher-order feature interactions (e.g., combinations of age, depression slope, and vessel count) without explicit polynomial expansion.
3. **Absence of Uncertainty Intervals:** Point estimates of probability without conformal prediction bounds.

---

## 9. Work Remaining for Milestone 4

1. Implementation of non-linear tree-based ensembles (Random Forest, XGBoost).
2. Local and global explainability via SHAP (SHapley Additive exPlanations).
3. Production FastAPI REST endpoints for real-time model inference.
4. Construction of a medical RAG pipeline using ChromaDB and Sentence-Transformers.
5. LLM-powered context-grounded conversational medical assistant.
6. Modern React dashboard for interactive live demonstrations.

---

## 10. Team Member Contributions (Milestone 3)

- **Bhavuk Agrawal (E23CSEU1938):**
  - Dataset acquisition and UCI repository integration.
  - Design and implementation of the leak-free scikit-learn preprocessing pipeline.
  - Automated EDA script generation and correlation analysis.
- **Goyal Annayan (E23CSEU1937):**
  - Baseline Logistic Regression training and hyperparameter configuration.
  - Stratified evaluation harness, confusion matrix, and ROC-AUC calculation.
  - Milestone 3 academic report synthesis and documentation.

---

## 11. References
1. Detrano, R., et al. (1989). *International application of a new probability algorithm for the diagnosis of coronary artery disease.* American Journal of Cardiology, 64(5), 304-310.
2. UCI Machine Learning Repository: Heart Disease Data Set. DOI: `10.24432/C52P4X`.
3. Pedregosa, F., et al. (2011). *Scikit-learn: Machine Learning in Python.* Journal of Machine Learning Research, 12, 2825-2830.
