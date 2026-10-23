# CSET343 — Milestone 4 Final Project Report
## AI-Driven Clinical Risk Prediction & Context-Aware Medical Information Retrieval

**Institution:** Bennett University / School of Computer Science Engineering and Technology  
**Course:** CSET343 — Artificial Intelligence and Machine Learning Applications  
**Project Title:** AI-Driven Clinical Risk Prediction and Context-Aware Medical Information Retrieval  
**Subtitle:** A Cardiovascular Risk Prediction Case Study using Machine Learning, Retrieval-Augmented Generation (RAG), SHAP and Large Language Models  

### Project Team
- **Bhavuk Agrawal** — Enrollment No: `E23CSEU1938`
- **Goyal Annayan** — Enrollment No: `E23CSEU1937`

---

## 1. Executive Summary & Implemented Modules

Milestone 4 delivers the complete full-stack clinical decision support prototype, advancing the project from the M3 baseline to a production-grade, locally executable healthcare AI system. All 14 modules specified in the master specification are implemented, tested, and operational:

1. **Dataset Loading & Preprocessing:** UCI Cleveland Heart Disease repository integration with fallback and stratified splitting.
2. **Reproducible Model Training:** Standardized scikit-learn pipeline for Logistic Regression, Random Forest, and XGBoost.
3. **Model Evaluation & Comparison Engine:** Multi-metric evaluation on identical test folds with persisted confusion matrices.
4. **SHAP Explainability Module:** Game-theoretic feature attribution producing local waterfall bars and global feature rankings.
5. **Interactive Prediction Form:** Clinically validated boundary inputs, units, live error states, and demonstration sample profiles.
6. **Cardiovascular Knowledge Base:** 15 curated medical documents from WHO, CDC, AHA, and NIH/NHLBI.
7. **RAG Vector Search Pipeline:** 30 chunked passages embedded with `all-MiniLM-L6-v2` in a local persistent ChromaDB instance.
8. **LLM Conversational Assistant:** Grounded question-answering with citation enforcement, graceful degradation, and hallucination guardrails.
9. **Source Citation Browser:** Complete manifest of trusted health authority sources with direct links.
10. **FastAPI REST Backend:** Versioned `/api/v1` routes with Pydantic validation, CORS, and health diagnostics.
11. **Modern React Frontend:** High-contrast, responsive dashboard crafted in Vite, TypeScript, Tailwind CSS, and Recharts.
12. **System Test Suite:** 40 automated tests covering API endpoints, data pipelines, model inference, SHAP, and RAG retrieval.
13. **Comprehensive Documentation:** Academic reports, architecture diagrams, demo scripts, and setup checklists.
14. **Medical Safety Safeguards:** Persistent educational disclaimers and absolute separation of LLM generation from ML risk probabilities.

---

## 2. Multi-Model Training & Benchmark Comparison

All models were evaluated on the exact same stratified test set ($n = 61$, 33 negative cases, 28 positive cases).

### 2.1 Measured Performance Comparison

| Metric | Logistic Regression (M3 Baseline) | Random Forest (M4 Champion) | XGBoost Classifier |
| :--- | :--- | :--- | :--- |
| **Accuracy** | 86.89% (53/61) | **90.16%** (55/61) | 86.89% (53/61) |
| **Precision** | 81.25% | **84.38%** | 81.25% |
| **Recall (Sensitivity)** | 92.86% (26/28) | **96.43%** (27/28) | 92.86% (26/28) |
| **F1-Score** | 86.67% | **90.00%** | 86.67% |
| **ROC-AUC** | **95.78%** | 93.72% | 91.88% |
| **False Negatives** | 2 | **1 (Lowest Missed Disease)** | 2 |
| **False Positives** | 6 | **5** | 6 |

### 2.2 Champion Model Selection Justification
**Random Forest** emerged as the superior operational model for this clinical screening application:
- **Maximized Sensitivity (96.43%):** In medical risk triage, failing to identify an at-risk individual (False Negative) has far more severe clinical consequences than a False Positive requiring follow-up tests. Random Forest missed only 1 out of 28 positive disease cases.
- **Top Accuracy and F1-Score:** Achieved **90.16% accuracy** and an **F1-score of 90.00%**, balancing precision with exceptional coverage.
- **Ensemble Stability:** Outperformed single gradient boosting steps on this 303-record benchmark by effectively resisting individual observation outliers.

---

## 3. Explainable AI via SHAP

To avoid treating trained estimators as clinical "black boxes", we integrated SHAP (SHapley Additive exPlanations):

### 3.1 Local Patient-Level Explanations
For an individual input record, the backend runs `shap.TreeExplainer` on the transformed feature space. Each feature contribution $\phi_i$ indicates whether a given biomarker moved the model toward Class 1 (disease, positive SHAP value, rendered in red) or toward Class 0 (no disease, negative SHAP value, rendered in blue).

*Example (High-Risk Sample):*
- Patient with `thal` = 6 (fixed defect) and `cp` = 4 (asymptomatic chest pain) exhibits strong positive SHAP forces ($+0.18$ and $+0.12$) driving the model's estimated probability from the baseline base value ($0.506$) to $> 85\%$.

### 3.2 Global Biomarker Importance
Aggregating the mean absolute SHAP values across the entire training cohort revealed the top global risk predictors in the Cleveland dataset:
1. `thal` (Thallium scintigraphy defect status)
2. `ca` (Number of major vessels illuminated by fluoroscopy)
3. `cp` (Chest pain category, particularly asymptomatic ischemia)
4. `oldpeak` (Exercise-induced ST segment depression)
5. `thalach` (Maximum achieved heart rate)

*Clinical Caveat:* SHAP reflects associations captured by the model within this dataset. It does not independently establish causal pathology.

---

## 4. Retrieval-Augmented Generation (RAG) Architecture

The medical knowledge assistant provides verified context for clinical terms without allowing the generative model to manipulate the classification probability.

### 4.1 Knowledge Base Curation
- 15 documents spanning prevention, blood pressure staging, cholesterol targets, exercise stress testing, diabetes interaction, and warning signs.
- Exclusively sourced from public domain guidelines of WHO, CDC, AHA, and NIH/NHLBI.
- Stored with canonical URLs and verified publication metadata.

### 4.2 Ingestion & Vector Retrieval
- **Chunking:** Text divided into overlapping passages (400 characters, 80-character overlap), producing 30 distinct vector chunks.
- **Embedding:** `sentence-transformers/all-MiniLM-L6-v2` generating 384-dimensional dense semantic vectors.
- **Index:** ChromaDB persistent vector database configured with cosine similarity indexing.
- **Retrieval Performance:** Average query retrieval latency < 15ms locally.

### 4.3 LLM Grounding & Safety Constraints
- **Model:** Groq API (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`), with fallback compatibility for local Ollama instances.
- **Prompt Guardrails:** Instructs the LLM to:
  1. Base factual assertions strictly on retrieved text and cite sources by title/organization.
  2. Acknowledge insufficient context when questions fall outside cardiovascular scope.
  3. Prohibit clinical prescribing or personalized diagnostic affirmations.
  4. Never override or modify the numerical ML probability.
  5. Include educational and emergency warning disclaimers.
- **Zero-Key Graceful Degradation:** If `GROQ_API_KEY` is not provided, the assistant displays retrieved passages, similarity scores, and source links, accompanied by an explicit notice that natural-language synthesis requires API key configuration.

---

## 5. Software Architecture & Implementation

### 5.1 FastAPI Backend
- Fully versioned under `/api/v1` with automatic OpenAPI documentation at `/docs`.
- Strict typing with Pydantic v2 schemas.
- Startup validation verifies that all model pipelines, metrics JSON, and ChromaDB vector stores exist before accepting traffic.
- CORS configured for local React origins.

### 5.2 React 18 User Interface
- Designed following modern clinical dashboard paradigms (light mode, white/slate surfaces, restrained blue and teal accents, high contrast typography).
- Modular pages:
  - **Overview:** System readiness pills, summary metric cards, dataset stats, and disclaimers.
  - **Risk Prediction:** Validated 13-feature input form, demo sample selector, predicted class badge, animated probability bar, and interpretation.
  - **Model Performance:** Side-by-side metric comparison table, grouped bar chart, radar performance chart, and interactive confusion matrices.
  - **Explainability:** Interactive SHAP local contribution charts and global feature ranking.
  - **Medical Assistant:** Conversational UI with expandable source passage cards, similarity scores, and citation pills.
  - **Knowledge Sources:** Verified registry grouped by public health authority with external source links.
  - **About:** Team details, academic context, system stack, and medical ethics disclaimers.

---

## 6. Verification & Automated Test Results

The test suite contains **40 automated tests** implemented using `pytest` and `FastAPI TestClient`.

### 6.1 Test Execution Summary
```
============================= test session starts ==============================
collected 40 items

tests/test_api.py::TestHealthEndpoint::test_health_returns_200 PASSED    [  2%]
tests/test_api.py::TestHealthEndpoint::test_health_schema PASSED         [  5%]
tests/test_api.py::TestHealthEndpoint::test_root_returns_200 PASSED      [  7%]
tests/test_api.py::TestModelEndpoints::test_model_info_returns_200 PASSED [ 10%]
tests/test_api.py::TestModelEndpoints::test_model_metrics_returns_200 PASSED [ 12%]
tests/test_api.py::TestModelEndpoints::test_model_metrics_schema PASSED  [ 15%]
tests/test_api.py::TestPredictionEndpoint::test_invalid_input_returns_422 PASSED [ 17%]
tests/test_api.py::TestPredictionEndpoint::test_invalid_thal_returns_422 PASSED [ 20%]
tests/test_api.py::TestPredictionEndpoint::test_predict_with_valid_input PASSED [ 22%]
tests/test_api.py::TestPredictionEndpoint::test_predict_response_schema PASSED [ 25%]
tests/test_api.py::TestRAGEndpoints::test_retrieve_returns_200_or_503 PASSED [ 27%]
tests/test_api.py::TestRAGEndpoints::test_retrieve_schema PASSED         [ 30%]
tests/test_api.py::TestRAGEndpoints::test_chat_endpoint_exists PASSED    [ 32%]
tests/test_api.py::TestRAGEndpoints::test_knowledge_sources_returns_list PASSED [ 35%]
tests/test_api.py::TestInputValidation::test_predict_missing_required_field PASSED [ 37%]
tests/test_api.py::TestInputValidation::test_predict_field_out_of_range PASSED [ 40%]
tests/test_api.py::TestInputValidation::test_chat_query_too_short PASSED [ 42%]
tests/test_dataset.py::TestDatasetCleaning::test_clean_replaces_question_marks PASSED [ 45%]
tests/test_dataset.py::TestDatasetCleaning::test_clean_requires_all_columns PASSED [ 47%]
tests/test_dataset.py::TestDatasetCleaning::test_clean_coerces_numeric_types PASSED [ 50%]
tests/test_dataset.py::TestDatasetCleaning::test_binarize_target_mapping PASSED [ 52%]
tests/test_dataset.py::TestDatasetCleaning::test_binarize_original_0_maps_to_0 PASSED [ 55%]
tests/test_dataset.py::TestDatasetCleaning::test_binarize_original_nonzero_maps_to_1 PASSED [ 57%]
tests/test_dataset.py::TestDatasetCleaning::test_stratified_split_preserves_distribution PASSED [ 60%]
tests/test_dataset.py::TestDatasetCleaning::test_describe_dataset_structure PASSED [ 62%]
tests/test_dataset.py::TestPreprocessing::test_preprocessor_fits_and_transforms PASSED [ 65%]
tests/test_dataset.py::TestPreprocessing::test_validate_input_accepts_valid PASSED [ 67%]
tests/test_dataset.py::TestPreprocessing::test_validate_input_rejects_out_of_range PASSED [ 70%]
tests/test_dataset.py::TestPreprocessing::test_validate_input_rejects_missing_field PASSED [ 72%]
tests/test_ml_and_rag.py::TestModelPersistenceAndInference::test_model_pipelines_exist_and_load PASSED [ 75%]
tests/test_ml_and_rag.py::TestModelPersistenceAndInference::test_model_service_reload PASSED [ 77%]
tests/test_ml_and_rag.py::TestSHAPExplanation::test_shap_local_explanation PASSED [ 80%]
tests/test_ml_and_rag.py::TestSHAPExplanation::test_shap_global_importance PASSED [ 82%]
tests/test_ml_and_rag.py::TestRAGPipeline::test_chunking_logic PASSED    [ 85%]
tests/test_ml_and_rag.py::TestRAGPipeline::test_stable_id_deterministic PASSED [ 87%]
tests/test_ml_and_rag.py::TestRAGPipeline::test_retrieval_and_metadata_preservation PASSED [ 90%]
tests/test_ml_and_rag.py::TestRAGPipeline::test_retrieval_evaluation_suite PASSED [ 92%]
tests/test_ml_and_rag.py::TestLLMGracefulFallback::test_missing_api_key_returns_educational_notice PASSED [ 95%]
tests/test_ml_and_rag.py::TestLLMGracefulFallback::test_format_context_empty PASSED [ 97%]
tests/test_ml_and_rag.py::TestLLMGracefulFallback::test_format_context_with_passages PASSED [100%]

====================== 40 passed, 941 warnings in 11.15s =======================
```

### 6.2 Frontend Production Build
`npm run build` executed cleanly in 2.22s, compiling TypeScript and bundling all assets into static production distribution files with 0 type errors.

---

## 7. Limitations & Future Roadmap

1. **Cohort Diversity:** The Cleveland dataset represents an older clinical population from one medical center. External validation on Hungarian, Swiss, and Long Beach cohorts from the full UCI Heart Disease repository is a logical extension.
2. **Dynamic Web Scraping:** Live retrieval scraping was intentionally replaced with a curated verifiable manifest to prevent web-breaking rate limits and transient URL deprecations during college evaluations.
3. **Calibrated Confidence Intervals:** Future work can integrate conformal prediction or Platt scaling to output formal confidence intervals for high-stakes screening.

---

## 8. Team Member Contributions (Milestone 4)

- **Bhavuk Agrawal (E23CSEU1938):**
  - Random Forest and XGBoost model training and pipeline serialization.
  - SHAP local and global explainability service implementation.
  - ChromaDB vector storage and semantic retrieval pipeline design.
  - React application architecture, routing, and UI design.
- **Goyal Annayan (E23CSEU1937):**
  - FastAPI versioned route handlers and Pydantic validation schemas.
  - Medical knowledge base curation from WHO, CDC, AHA, and NIH.
  - LLM integration with Groq API, prompt grounding, and fallback logic.
  - Comprehensive pytest test suite construction and M4 documentation.

---

## 9. Conclusion

Milestone 4 successfully fulfills all technical and academic objectives of the CSET343 curriculum. By integrating machine learning classification with mathematical explainability (SHAP), semantic knowledge retrieval (ChromaDB), and an interactive modern web dashboard, the project demonstrates how AI decision support systems can be engineered with safety, transparency, and statistical rigor.
