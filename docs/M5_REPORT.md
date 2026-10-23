# CSET343 — Milestone 5 Final Project Report & Research Paper
## AI-Driven Clinical Risk Prediction and Context-Aware Medical Information Retrieval: A Cardiovascular Case Study

**Course:** CSET343 — Artificial Intelligence and Machine Learning Applications  
**Academic Session:** 2024–2025  
**Evaluation Window:** November 16 – November 20  
**Project Title:** AI-Driven Clinical Risk Prediction and Context-Aware Medical Information Retrieval  
**Subtitle:** A Cardiovascular Risk Prediction Case Study using Machine Learning, Retrieval-Augmented Generation (RAG), SHAP and Large Language Models  

### Authors & Affiliation
- **Bhavuk Agrawal** — Enrollment No: `E23CSEU1938`  
  *Department of Computer Science Engineering, Bennett University, Greater Noida, India*  
  Email: `e23cseu1938@bennett.edu.in`
- **Goyal Annayan** — Enrollment No: `E23CSEU1937`  
  *Department of Computer Science Engineering, Bennett University, Greater Noida, India*  
  Email: `e23cseu1937@bennett.edu.in`

---

## Abstract
Cardiovascular diseases (CVDs) remain the leading contributor to global mortality. While supervised machine learning models demonstrate considerable predictive potential in cardiology, their clinical adoption has been severely hindered by two persistent challenges: black-box opacity and the tendency of unconstrained Large Language Models (LLMs) to hallucinate unverified medical advice. In this work, we propose, implement, and evaluate an integrated dual-stream decision-support architecture that strictly decouples empirical machine learning risk classification from generative natural language interactions. 

Using the benchmark UCI Cleveland Heart Disease dataset (303 records, 13 features), we construct a leak-free preprocessing pipeline and compare an interpretable Logistic Regression baseline against Random Forest and XGBoost classifiers on an independent stratified 20% test partition ($n = 61$). Random Forest achieves champion performance with **90.16% accuracy**, **90.00% F1-score**, and **96.43% recall (sensitivity)**, missing only one positive disease instance. To ensure diagnostic transparency, game-theoretic SHAP (SHapley Additive exPlanations) is integrated to compute both global feature rankings and individual local feature contributions. Concurrently, a privacy-preserving Retrieval-Augmented Generation (RAG) pipeline is constructed using dense `all-MiniLM-L6-v2` embeddings and a local ChromaDB vector store containing 30 chunks extracted from verified clinical guidelines of the WHO, CDC, AHA, and NIH. Grounded natural language explanations are synthesized via Google Gemini 1.5 Flash with strict source citation enforcement, while preserving zero-key graceful degradation. The entire system is packaged as an asynchronous FastAPI backend paired with an accessible, responsive React 18 / TypeScript frontend, validated across 40 automated tests with a 100% pass rate.

**Keywords:** Cardiovascular Disease, Machine Learning, Random Forest, SHAP Explainability, Retrieval-Augmented Generation, ChromaDB, FastAPI, React.

---

## 1. Introduction

Early detection of coronary artery disease (CAD) is critical for preventing acute coronary syndromes and reducing premature mortality. Routine outpatient cardiovascular screening involves non-invasive evaluation of demographics, hemodynamic vitals, blood chemistries, and resting and exercise electrocardiography. 

Despite substantial advances in predictive analytics, translating machine learning into practical clinical decision support requires addressing three foundational requirements:
1. **Mathematical Interpretability:** Clinicians must understand the precise pathophysiological drivers influencing an algorithm's output for an individual patient.
2. **Data Leakage Prevention:** Preprocessing steps—such as missing value imputation and numerical normalization—must strictly avoid learning from validation or testing distributions.
3. **Safety-Constrained Communication:** When generative language models are deployed to communicate with patients or clinicians, they must be strictly bounded to verified evidence to prevent hallucinated diagnoses or unauthorized treatment alterations.

This project delivers an end-to-end, locally runnable academic healthcare AI prototype that addresses each of these requirements through an integrated software and algorithmic architecture.

---

## 2. Organization and Structure of the Proposed Architecture

The system architecture enforces a clean separation of concerns across client, API, statistical ML, and generative retrieval layers:

```
+---------------------------------------------------------------------------------------------------------+
|                                        FRONTEND PRESENTATION LAYER                                      |
|                                (React 18 + Vite + TypeScript + Tailwind CSS)                            |
|  +--------------------+  +----------------------+  +---------------------+  +------------------------+  |
|  | Overview Dashboard |  | Risk Prediction Form |  | Model Performance   |  | SHAP Explainability    |  |
|  +--------------------+  +----------------------+  +---------------------+  +------------------------+  |
|  +----------------------------------------------+  +-------------------------------------------------+  |
|  | Medical AI Assistant (Conversational RAG)    |  | Knowledge Sources Catalog (WHO, CDC, AHA, NIH)  |  |
|  +----------------------------------------------+  +-------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                            REST API Calls (JSON)
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                                        BACKEND APPLICATION LAYER                                        |
|                                       (FastAPI v1 + Pydantic v2)                                        |
|  /health            /model/info         /model/metrics       /predict        /explain       /chat       |
+---------------------------------------------------------------------------------------------------------+
                         |                                                     |
                         v                                                     v
+----------------------------------------------------+   +------------------------------------------------+
|           EMPIRICAL MACHINE LEARNING ENGINE        |   |       RETRIEVAL-AUGMENTED GENERATION (RAG)     |
|  +-----------------------------------------------+ |   | +--------------------------------------------+ |
|  | UCI Cleveland Heart Disease Dataset (ID: 45)   | |   | | Curated Medical Corpus (15 Guidelines)     | |
|  +-----------------------------------------------+ |   | +--------------------------------------------+ |
|                         |                          |   |                       |                        |
|                         v                          |   |                       v                        |
|  +-----------------------------------------------+ |   | +--------------------------------------------+ |
|  | Leak-Free Pipeline (Median + Modal + OHE)     | |   | | Chunking (400 chars, 80 overlap)           | |
|  +-----------------------------------------------+ |   | +--------------------------------------------+ |
|                         |                          |   |                       |                        |
|                         v                          |   |                       v                        |
|  +-----------------------------------------------+ |   | +--------------------------------------------+ |
|  | Trained Estimators (Joblib Serialized):       | |   | | all-MiniLM-L6-v2 Dense Embeddings (384-dim)| |
|  | - Logistic Regression (M3 Baseline)           | |   | +--------------------------------------------+ |
|  | - Random Forest (Champion: 90.16% Acc)        | |   |                       |                        |
|  | - XGBoost (Gradient Boosted Classifier)       | |   |                       v                        |
|  +-----------------------------------------------+ |   | +--------------------------------------------+ |
|                         |                          |   | | ChromaDB Local Persistent Vector Store     | |
|                         v                          |   | +--------------------------------------------+ |
|  +-----------------------------------------------+ |   |                       |                        |
|  | SHAP Explainability Engine                    | |   |                       v                        |
|  | (TreeExplainer & LinearExplainer Attributions)| |   | | Google Gemini 1.5 Flash (Fallback: Ollama) | |
|  +-----------------------------------------------+ |   | +--------------------------------------------+ |
+----------------------------------------------------+   +------------------------------------------------+
```

---

## 3. Compliance with Prescribed Report Format & Methodology

### 3.1 Dataset Provenance & Target Binarization
The investigation utilizes the Cleveland subset of the UCI Heart Disease benchmark repository (Dataset ID: 45):
- **Cohort Size:** 303 patient records across 13 clinical predictors.
- **Missing Value Handling:** Missing markers identified in fluoroscopy vessels (`ca`, 4 missing) and thallium scan (`thal`, 2 missing). Continuous features are imputed using the **training median**; categorical features are imputed using the **training mode**.
- **Target Formulation:** The multi-grade clinical angiographic stenosis target (`num`, range 0 to 4) is converted to a binary classification task:
  $$\text{Target} = \begin{cases} 0, & \text{if } num = 0 \text{ (absence of significant CAD)} \\ 1, & \text{if } num \in \{1, 2, 3, 4\} \text{ (presence of significant CAD)} \end{cases}$$
- **Data Partitions:** Stratified 80/20 train/test split fixed with seed `42` yielding 242 training observations and 61 independent test observations.

### 3.2 Machine Learning Model Comparison

All models were evaluated on the identical test set ($n = 61$):

```
+----------------------------------------------------------------------------------------------------------+
|                                    MEASURED BENCHMARK EVALUATION RESULTS                                 |
+--------------------------+---------------------+-------------------+------------------+------------------+
| Metric                   | Logistic Regression | Random Forest     | XGBoost          | Evaluation Focus |
|                          | (M3 Baseline)       | (M4 Champion)     | (Gradient Boost) | in Healthcare    |
+--------------------------+---------------------+-------------------+------------------+------------------+
| Accuracy                 | 86.89% (53/61)      | 90.16% (55/61)    | 86.89% (53/61)   | Overall correctly|
|                          |                     |                   |                  | classified cases |
+--------------------------+---------------------+-------------------+------------------+------------------+
| Precision                | 81.25%              | 84.38%            | 81.25%           | Positive         |
|                          |                     |                   |                  | predictive value |
+--------------------------+---------------------+-------------------+------------------+------------------+
| Recall (Sensitivity)     | 92.86% (26/28)      | 96.43% (27/28)    | 92.86% (26/28)   | Minimizing       |
|                          |                     |                   |                  | False Negatives  |
+--------------------------+---------------------+-------------------+------------------+------------------+
| F1-Score                 | 86.67%              | 90.00%            | 86.67%           | Harmonic mean    |
+--------------------------+---------------------+-------------------+------------------+------------------+
| ROC-AUC                  | 95.78%              | 93.72%            | 91.88%           | Threshold rank   |
+--------------------------+---------------------+-------------------+------------------+------------------+
| Confusion Matrix         | [[27, 6],           | [[28, 5],         | [[27, 6],        | True Negative,   |
| [TN, FP], [FN, TP]       |  [ 2, 26]]          |  [ 1, 27]]        |  [ 2, 26]]       | False Positive...|
+--------------------------+---------------------+-------------------+------------------+------------------+
| False Negatives          | 2                   | 1 (Lowest Miss)   | 2                | High Clinical    |
|                          |                     |                   |                  | Risk Impact      |
+--------------------------+---------------------+-------------------+------------------+------------------+
```

### 3.3 Explainable AI (SHAP) Synthesis
SHAP values provide an additive attribution framework rooted in cooperative game theory:
- **Global Findings:** Across all 242 training instances, the three most influential predictors are `thal` (thallium scan defect status), `cp` (asymptomatic chest pain status), and `ca` (number of fluoroscopically confirmed diseased vessels).
- **Local Clinical Utility:** For high-risk patient Sample A (Male, 63, typical angina), SHAP isolated ST depression (`oldpeak = 2.3 mm`) and reversible thallium defect (`thal = 6`) as the primary positive contributors elevating estimated disease probability to $>85\%$.

### 3.4 Context-Aware RAG Implementation
- **Corpus Curation:** 15 canonical clinical documents extracted from WHO, CDC, AHA, and NIH/NHLBI public guidelines.
- **Dense Vector Search:** Character chunking (400 length, 80 overlap) embedded via `all-MiniLM-L6-v2` into a local ChromaDB collection (30 chunks).
- **Grounded Generation:** Gemini 1.5 Flash generates answers citing source titles and external URLs. In tests with `GEMINI_API_KEY` omitted, the retrieval engine gracefully returns matching chunks, similarity scores, and canonical links without crashing.

---

## 4. Verification and System Testing

The system underwent automated validation covering unit, integration, and end-to-end user workflows:
- **Pytest Suite:** 40 automated tests executed via `pytest tests/ -v`, achieving a **100% pass rate in 11.15 seconds**.
- **Frontend Production Build:** TypeScript compilation and Vite minification completed in **2.22 seconds** with zero diagnostic warnings.

---

## 5. Clarity and Organization of Presentation

A structured 5–7 minute evaluative presentation script is provided in [`docs/DEMO_SCRIPT.md`](file:///Users/bhavukagrawal/ai-project/clinical-risk-prediction/docs/DEMO_SCRIPT.md), formatted for faculty assessment:

```
+------------------------------------------------------------------------------------+
|                         LIVE DEMONSTRATION WALKTHROUGH FLOW                        |
+--------+--------------------------+-----------------------+------------------------+
| Phase  | Topic                    | Active Screen         | Evaluator Takeaway     |
+--------+--------------------------+-----------------------+------------------------+
| 1:00m  | Problem & System Status  | Overview (/)          | Decoupled ML/RAG design|
| 1:30m  | Data & Model Benchmark   | Performance (/perf)   | RF champion: 96.4% Rec |
| 1:30m  | Live Risk Prediction     | Predict (/predict)    | Validated 13-feature UI|
| 1:00m  | SHAP Explainability      | Explain (/explain)    | Waterfall attribution  |
| 1:00m  | Medical RAG Chatbot      | Assistant (/assistant)| Citation enforcement   |
| 0:30m  | Architecture & Summary   | About (/about)        | Ethics & limitations   |
+--------+--------------------------+-----------------------+------------------------+
```

---

## 6. Contribution by Each Team Member

In strict accordance with the CSET343 collaborative assessment criteria, project responsibilities were distributed equitably:

### Bhavuk Agrawal (`E23CSEU1938`)
- **Machine Learning Architecture:**
  - Implementation of leak-free `ColumnTransformer` preprocessing pipeline (`backend/app/ml/preprocessing.py`).
  - Training, hyperparameter tuning, and serialization of Random Forest and XGBoost pipelines (`backend/app/ml/train.py`).
  - Integration of SHAP `TreeExplainer` and local waterfall attribution logic (`backend/app/ml/explainer.py`).
- **Frontend Full-Stack Engineering:**
  - Modern React 18, Vite, and TypeScript architecture design.
  - Interactive data visualization with Recharts (confusion matrices, radar charts, SHAP bars).
  - Implementation of the responsive Risk Prediction and Model Performance views.
- **Reporting & Documentation:**
  - Author of Milestone 1 Domain Analysis and Milestone 4 System Implementation reports.

### Goyal Annayan (`E23CSEU1937`)
- **API & Data Engineering:**
  - UCI Cleveland dataset loading, target binarization, and automated EDA engine (`backend/app/ml/eda.py`).
  - Design of FastAPI versioned router and Pydantic v2 validation schemas (`backend/app/api/routes.py`, `schemas.py`).
  - Implementation of the baseline Logistic Regression model and evaluation harness (`backend/app/ml/evaluation.py`).
- **Retrieval-Augmented Generation (RAG):**
  - Curation of the verified medical guidelines corpus from WHO, CDC, AHA, and NIH (`backend/app/rag/knowledge_base.py`).
  - ChromaDB persistent vector database setup and sentence-transformers embedding pipeline (`backend/app/rag/ingestion.py`, `retrieval.py`).
  - Google Gemini 1.5 Flash integration with prompt grounding guardrails and fallback handlers (`backend/app/rag/llm.py`).
- **Testing & Academic Reporting:**
  - Author of the 40-test pytest validation suite (`backend/tests/`).
  - Co-author of Milestone 2 Feasibility, Milestone 3 Baseline, and Milestone 5 Final Research Paper reports.

---

## 7. Ethical Considerations & Medical Disclaimers

This application is strictly an **educational and academic research decision-support prototype**. It is **not** a clinically validated medical device, diagnostic system, or autonomous prescribing tool. In production medical environments, machine learning predictions must always be interpreted in conjunction with comprehensive clinical evaluations, laboratory assays, and direct consultation with licensed healthcare professionals.

---

## 8. References

1. Detrano, R., et al. (1989). *International application of a new probability algorithm for the diagnosis of coronary artery disease.* American Journal of Cardiology, 64(5), 304–310.
2. Lundberg, S. M., & Lee, S. I. (2017). *A unified approach to interpreting model predictions.* Advances in Neural Information Processing Systems (NeurIPS 30), 4765–4774.
3. Lewis, P., et al. (2020). *Retrieval-augmented generation for knowledge-intensive NLP tasks.* Advances in Neural Information Processing Systems (NeurIPS 33), 9459–9474.
4. Al'Aref, S. J., et al. (2020). *Clinical applications of machine learning in cardiovascular disease and its relevance to cardiac imaging.* European Heart Journal, 41(19), 1875–1886.
5. Reimers, N., & Gurevych, I. (2019). *Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks.* Proceedings of EMNLP 2019, 3982–3992.
6. Thirunavukarasu, A. J., et al. (2023). *Large language models in medicine.* Nature Medicine, 29(11), 2630–2640.
