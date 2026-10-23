# Technical Methodology

## Project Title
**AI-Driven Clinical Risk Prediction and Context-Aware Medical Information Retrieval**

**Authors:** Bhavuk Agrawal (E23CSEU1938), Goyal Annayan (E23CSEU1937)  
**Course:** CSET343 — Artificial Intelligence and Machine Learning Applications

---

## 1. Dataset Selection & Provenance

The primary dataset used for this academic cardiovascular risk study is the **Cleveland Clinic Heart Disease** database from the **UCI Machine Learning Repository** (Dataset ID: 45, DOI: `10.24432/C52P4X`).

- **Total records:** 303 patient observations.
- **Features:** 13 input predictors + 1 integer target (`num`).
- **Feature Schema:**
  1. `age`: Patient age in years (Range: 29–77).
  2. `sex`: Gender (1 = Male, 0 = Female).
  3. `cp`: Chest pain type:
     - 1: Typical angina
     - 2: Atypical angina
     - 3: Non-anginal pain
     - 4: Asymptomatic
  4. `trestbps`: Resting blood pressure on admission in mm Hg (Range: 94–200).
  5. `chol`: Serum cholesterol in mg/dl (Range: 126–564).
  6. `fbs`: Fasting blood sugar > 120 mg/dl (1 = True, 0 = False).
  7. `restecg`: Resting electrocardiographic results:
     - 0: Normal
     - 1: Having ST-T wave abnormality
     - 2: Showing probable or definite left ventricular hypertrophy
  8. `thalach`: Maximum heart rate achieved during exercise (Range: 71–202 bpm).
  9. `exang`: Exercise-induced angina (1 = Yes, 0 = No).
  10. `oldpeak`: ST depression induced by exercise relative to rest (Range: 0.0–6.2 mm).
  11. `slope`: Slope of peak exercise ST segment:
      - 1: Upsloping
      - 2: Flat
      - 3: Downsloping
  12. `ca`: Number of major vessels (0–3) coloured by fluoroscopy.
  13. `thal`: Thallium scintigraphy scan result:
      - 3: Normal
      - 6: Fixed defect
      - 7: Reversable defect
  14. `num`: Diagnosis of heart disease (angiographic disease status, 0 to 4).

### Target Binarization
The clinical classification objective was formulated as a binary prediction task:
- **Class 0 (Negative):** `num == 0` (angiographic diameter narrowing < 50%, no detected significant disease).
- **Class 1 (Positive):** `num > 0` (values 1, 2, 3, or 4 indicating > 50% diameter narrowing).

In the raw dataset:
- Negative instances (`0`): 164 records (54.1%)
- Positive instances (`1–4`): 139 records (45.9%)

---

## 2. Preprocessing & Leakage Prevention

To guarantee reproducibility and prevent data leakage:
1. **Split Strategy:** Stratified 80/20 train/test split fixed with seed `42`.
   - Training set: 242 records
   - Test set: 61 records
2. **Missing Value Imputation:**
   - Missing-value markers (`?`, `-9`, `NaN`) identified in columns `ca` (4 instances) and `thal` (2 instances).
   - Continuous and count features imputed using the **training set median**.
   - Categorical features imputed using the **training set most frequent value**.
3. **Feature Transformations:**
   - Numerical features (`age`, `trestbps`, `chol`, `thalach`, `oldpeak`, `sex`, `fbs`, `exang`, `ca`) scaled via `StandardScaler()` fitted solely on training data.
   - Categorical features (`cp`, `restecg`, `slope`, `thal`) transformed via `OneHotEncoder(handle_unknown='ignore', sparse_output=False)`.
4. **End-to-End Encapsulation:** The preprocessor and classification estimator are combined into an atomic scikit-learn `Pipeline`, serialized to disk via `joblib`.

---

## 3. Model Architecture & Selection

Three distinct supervised learning algorithms were evaluated on the identical test partition:

| Parameter / Metric | Logistic Regression (Baseline) | Random Forest (Champion) | XGBoost |
| :--- | :--- | :--- | :--- |
| **Model Type** | Generalized Linear Model (L2) | Bagged Decision Tree Ensemble | Gradient Boosted Trees |
| **Hyperparameters** | `solver='lbfgs'`, `max_iter=1000` | `n_estimators=200`, `seed=42` | `n_estimators=200`, `logloss` |
| **Class Imbalance** | `class_weight='balanced'` | `class_weight='balanced'` | `scale_pos_weight=1.18` |
| **Test Accuracy** | **86.89%** | **90.16%** | **86.89%** |
| **Test Precision** | 81.25% | **84.38%** | 81.25% |
| **Test Recall** | 92.86% | **96.43%** | 92.86% |
| **Test F1-Score** | 86.67% | **90.00%** | 86.67% |
| **Test ROC-AUC** | **95.78%** | 93.72% | 91.88% |

### Why Random Forest is Champion
In clinical screening systems, **Recall (Sensitivity)** is paramount: minimizing false negatives ensures high-risk individuals are not erroneously categorized as low-risk. Random Forest achieved **96.43% recall** (only 1 false negative on the 61-sample test set) alongside the highest test accuracy (**90.16%**) and F1-score (**90.00%**).

---

## 4. Model Explainability via SHAP

Black-box predictions are unacceptable in medical decision support. We incorporated SHAP (SHapley Additive exPlanations) based on cooperative game theory:
- **Global Explainability:** Measures the mean absolute SHAP value across the training population to rank top predictors. Across models, `thal`, `cp` (asymptomatic chest pain), `ca` (major vessels), and `oldpeak` (ST depression) rank as the most influential variables.
- **Local Explainability:** For any single patient input, computes exact additive feature attributions ($\phi_i$) that explain the shift from the base expected value ($E[f(x)]$) to the model's output $f(x)$:
  $$f(x) = E[f(x)] + \sum_{i=1}^{M} \phi_i$$

---

## 5. RAG Pipeline & Medical Grounding

To provide medical educational context without allowing LLMs to manipulate numerical predictions:
1. **Curated Corpus:** 15 canonical clinical documents extracted from authoritative organizations (WHO, CDC, AHA, NIH).
2. **Chunking & Vectorization:** Documents segmented into 400-character passages with 80-character overlap (30 chunks total) and vectorized using `sentence-transformers/all-MiniLM-L6-v2`.
3. **Retrieval Mechanism:** ChromaDB vector database performs cosine similarity search to retrieve top-$k$ passages.
4. **Strict Grounding Prompt:** Instructs the LLM (Gemini 1.5 Flash) to generate answers citing source titles and URLs, explicitly disclose context gaps, refuse personal diagnoses, and refrain from overriding ML model outputs.
