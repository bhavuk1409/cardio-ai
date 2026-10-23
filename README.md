# AI-Driven Clinical Risk Prediction & Context-Aware Medical Information Retrieval

> **A Cardiovascular Risk Prediction Case Study using Machine Learning, Retrieval-Augmented Generation (RAG), SHAP, and Large Language Models.**  
> Course: **CSET343 — Artificial Intelligence and Machine Learning Applications** (Academic Session: 2024–2025)  
> Comprehensive Milestones 1, 2, 3, 4 & 5 Project Submission  

---

## Team Members
- **Bhavuk Agrawal** — `E23CSEU1938`
- **Goyal Annayan** — `E23CSEU1937`

---

## Milestone Evaluation & Delivery Roadmap

| Milestone | Rubric Focus Components | Evaluation Window | Documentation Deliverable |
| :--- | :--- | :--- | :--- |
| **Milestone 1** | Problem domain identification and analysis | **Sep 8 – Sep 11** | [`docs/M1_REPORT.md`](file:///Users/bhavukagrawal/ai-project/clinical-risk-prediction/docs/M1_REPORT.md) |
| **Milestone 2** | Review of existing systems, project feasibility, objectives & algorithmic relevance | **Sep 21 – Sep 25** | [`docs/M2_REPORT.md`](file:///Users/bhavukagrawal/ai-project/clinical-risk-prediction/docs/M2_REPORT.md) |
| **Milestone 3** | Synchronization of Project Design & Implementation (Data & Baseline Model) | **Oct 12 – Oct 16** | [`docs/M3_REPORT.md`](file:///Users/bhavukagrawal/ai-project/clinical-risk-prediction/docs/M3_REPORT.md) |
| **Milestone 4** | Implementation & Live Demonstration of Trained-Model Modules, SHAP & RAG | **Oct 26 – Oct 30** | [`docs/M4_REPORT.md`](file:///Users/bhavukagrawal/ai-project/clinical-risk-prediction/docs/M4_REPORT.md) |
| **Milestone 5** | Final Project Report / Research Paper, Format Compliance & Team Contributions | **Nov 16 – Nov 20** | [`docs/M5_REPORT.md`](file:///Users/bhavukagrawal/ai-project/clinical-risk-prediction/docs/M5_REPORT.md) |

---

## 1. Project Overview

This repository contains a full-stack, locally runnable academic clinical decision-support prototype that combines:
1. **Machine Learning Risk Prediction**: Supervised binary classification using the UCI Cleveland Heart Disease dataset (303 records, 13 features).
2. **Three-Model Benchmark**: Reproducible comparison between **Logistic Regression (M3 Baseline)**, **Random Forest (Champion)**, and **XGBoost**.
3. **Model Explainability**: Game-theoretic feature attribution using **SHAP** (local patient explanations and global feature ranking).
4. **Context-Aware Medical Retrieval (RAG)**: A vector search pipeline built with **sentence-transformers (`all-MiniLM-L6-v2`)** and **ChromaDB**, searching a curated corpus from WHO, CDC, AHA, and NIH.
5. **Grounded Medical AI Assistant**: Natural language question-answering powered by **Groq API** (Llama 3.3 / Llama 3.1, with Ollama fallback), constrained to never hallucinate clinical recommendations or modify model predictions.
6. **Modern Clinical Dashboard**: A React 18, Vite, TypeScript, and Tailwind CSS web application designed with high aesthetic standards (light mode, accessible contrast, interactive Recharts visualizations).

> **Important Educational Disclaimer:** This application is an educational prototype developed for academic demonstration purposes. It is **NOT** a clinically validated medical device, diagnostic tool, or a substitute for professional healthcare advice.

---

## 2. Actual Measured Benchmark Results

All models were evaluated on the identical stratified 80/20 test split ($n = 61$ held-out samples: 33 negative, 28 positive):

| Model | Test Accuracy | Precision | Recall (Sensitivity) | F1-Score | ROC-AUC | False Negatives |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression (Baseline)** | 86.89% | 81.25% | 92.86% | 86.67% | **95.78%** | 2 / 28 |
| **Random Forest (Champion)** | **90.16%** | **84.38%** | **96.43%** | **90.00%** | 93.72% | **1 / 28** |
| **XGBoost Classifier** | 86.89% | 81.25% | 92.86% | 86.67% | 91.88% | 2 / 28 |

*Why Random Forest is the Champion:* In medical screening triage, sensitivity (recall) is critical to prevent missed disease cases. Random Forest achieved **96.43% recall** (only 1 false negative) and the highest overall accuracy (**90.16%**).

---

## 3. Repository Structure

```
clinical-risk-prediction/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── api/routes.py        # Versioned /api/v1 REST endpoints
│   │   ├── schemas/schemas.py   # Pydantic v2 validation models
│   │   ├── services/            # Model singleton service
│   │   ├── ml/                  # Dataset, preprocessing, EDA, training, SHAP
│   │   ├── rag/                 # Knowledge base, chunking, ChromaDB, Groq LLM
│   │   └── core/                # Configuration and logging
│   ├── scripts/
│   │   ├── train_models.py      # Automated training & chart generation script
│   │   └── build_kb.py          # Vector store ingestion script
│   ├── tests/                   # 40 automated pytest unit & integration tests
│   ├── data/                    # UCI Cleveland dataset cache
│   ├── models/                  # Serialized .joblib pipeline artifacts
│   ├── vectorstore/             # Persistent ChromaDB vector database
│   ├── results/                 # Metrics JSON and EDA/evaluation PNGs
│   └── requirements.txt         # Pinned Python 3.11 dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/               # Overview, Predict, Performance, Explain, Assistant, Sources, About
│   │   ├── services/api.ts      # Typed API client
│   │   ├── types/index.ts       # TypeScript interfaces & sample records
│   │   ├── App.tsx              # Router & Sidebar layout
│   │   └── main.tsx             # Application bootstrap
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docs/
│   ├── M1_REPORT.md             # Formal Milestone 1 Domain Analysis Report
│   ├── M2_REPORT.md             # Formal Milestone 2 Feasibility & Algorithmic Review
│   ├── M3_REPORT.md             # Formal Milestone 3 Data & Baseline Model Report
│   ├── M4_REPORT.md             # Formal Milestone 4 Trained-Model Modules Report
│   ├── M5_REPORT.md             # Formal Milestone 5 Final Research Paper & Project Report
│   ├── architecture.md          # Full architectural specification with Mermaid diagram
│   └── methodology.md           # Dataset, preprocessing, models & RAG methodology
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. Local Quickstart Instructions

### 4.1 Prerequisites
- **Python**: 3.11 (tested on macOS Apple Silicon and Linux)
- **Node.js**: v18+ or v20+ (tested on Node v22)
- **Optional**: Groq API key (for high-speed conversational chatbot generation via Llama 3.3 / Llama 3.1)

---

### 4.2 Backend Setup & Execution

#### Step 1: Create & Activate Virtual Environment
```bash
cd clinical-risk-prediction/backend
python3.11 -m venv venv

# macOS / Linux:
source venv/bin/activate

# Windows (PowerShell):
# .\venv\Scripts\Activate.ps1
```

#### Step 2: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```
*(On macOS, ensure `brew install libomp` is installed for XGBoost OpenMP runtime support).*

#### Step 3: Configure Environment Variables
```bash
cp ../.env.example ../.env
```
*(Edit `../.env` to add your optional `GROQ_API_KEY`. If left unset, the RAG search and passage citation engine will still function 100%).*

#### Step 4: Run Training & Build Vector Store
```bash
# 1. Download dataset, run EDA, and train Logistic Regression, Random Forest, & XGBoost:
python -m scripts.train_models

# 2. Build the ChromaDB vector database from curated medical guidelines:
python -m scripts.build_kb
```

#### Step 5: Start the FastAPI Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Documentation (Swagger UI): `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/v1/health`

---

### 4.3 Frontend Setup & Execution

Open a new terminal:
```bash
cd clinical-risk-prediction/frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 5. Running the Automated Test Suite

The test suite validates data loading, target binarization, pipeline leak prevention, model inference, SHAP explanations, ChromaDB retrieval, and API route contracts:

```bash
cd clinical-risk-prediction/backend
source venv/bin/activate
pytest tests/ -v
```

**Actual Execution Result:**
```
====================== 40 passed in 11.15s =======================
```

To verify the frontend production build:
```bash
cd clinical-risk-prediction/frontend
npm run build
```

---

## 6. API Reference (FastAPI `/api/v1`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service readiness check (Models, ChromaDB, LLM) |
| `GET` | `/api/v1/model/info` | Active model metadata, version, and training date |
| `GET` | `/api/v1/model/metrics` | Detailed metrics and confusion matrices for all 3 models |
| `POST` | `/api/v1/predict` | Run cardiovascular prediction on 13 patient features |
| `POST` | `/api/v1/explain` | Compute local and global SHAP feature contributions |
| `POST` | `/api/v1/rag/retrieve` | Semantic vector search against ChromaDB |
| `POST` | `/api/v1/chat` | Conversational RAG assistant grounded with citations |
| `GET` | `/api/v1/knowledge/sources`| Verified catalog of curated WHO, CDC, AHA, and NIH sources |

---

## 7. Submission Deliverables Summary

- **Milestone 1 Report (Problem Domain Identification & Analysis):** [`docs/M1_REPORT.md`](file:///Users/bhavukagrawal/ai-project/clinical-risk-prediction/docs/M1_REPORT.md)
- **Milestone 2 Report (Review of Existing Systems, Feasibility & Algorithms):** [`docs/M2_REPORT.md`](file:///Users/bhavukagrawal/ai-project/clinical-risk-prediction/docs/M2_REPORT.md)
- **Milestone 3 Report (Data Preprocessing & Baseline Model):** [`docs/M3_REPORT.md`](file:///Users/bhavukagrawal/ai-project/clinical-risk-prediction/docs/M3_REPORT.md)
- **Milestone 4 Report (Trained-Model Modules & RAG Implementation):** [`docs/M4_REPORT.md`](file:///Users/bhavukagrawal/ai-project/clinical-risk-prediction/docs/M4_REPORT.md)
- **Milestone 5 Report (Final Research Paper, Format Compliance & Team Contributions):** [`docs/M5_REPORT.md`](file:///Users/bhavukagrawal/ai-project/clinical-risk-prediction/docs/M5_REPORT.md)
- **System Architecture (with Mermaid Diagram):** [`docs/architecture.md`](file:///Users/bhavukagrawal/ai-project/clinical-risk-prediction/docs/architecture.md)
- **Technical Methodology:** [`docs/methodology.md`](file:///Users/bhavukagrawal/ai-project/clinical-risk-prediction/docs/methodology.md)
