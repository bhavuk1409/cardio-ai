# Live Professor Demonstration Script (5–7 Minutes)

## Project Title
**AI-Driven Clinical Risk Prediction and Context-Aware Medical Information Retrieval**

**Team Presenters:**
- Bhavuk Agrawal (E23CSEU1938)
- Goyal Annayan (E23CSEU1937)

**Demonstration Goal:** Provide an evaluative walkthrough of Milestone 3 (data preprocessing & baseline model) and Milestone 4 (multi-model training, SHAP explainability, RAG pipeline, and medical chatbot).

---

## Pre-Demo Checklist (Do this 2 minutes before the presentation)
1. **Terminal 1 (Backend Server):**
   ```bash
   cd clinical-risk-prediction/backend
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```
   *Verify:* Output displays:
   `✓ Model service ready (selected: random_forest)`
   `✓ Retrieval service ready`

2. **Terminal 2 (Frontend Client):**
   ```bash
   cd clinical-risk-prediction/frontend
   npm run dev
   ```
   *Open:* Browser at `http://localhost:5173`

---

## Demonstration Sequence

### Phase 1: Problem & System Overview (1:00 min)
- **Presenter:** Bhavuk Agrawal
- **Screen:** Navigate to **Overview** (`/`)
- **Script:**
  > *"Good morning professor. Today we are presenting our cardiovascular clinical risk prediction and context-aware medical information retrieval system.
  >
  > Clinical AI systems face two primary pitfalls: black-box opacity and generative hallucination. To solve this, our architecture strictly decouples numerical ML risk classification from generative natural language processing.
  >
  > As shown on this overview dashboard, our live services are fully operational: the scikit-learn models are loaded into memory, the local ChromaDB vector store is active, and our Cleveland dataset benchmark contains 303 records across 13 cardiovascular features."*

---

### Phase 2: Data Preprocessing & Model Performance (1:30 min)
- **Presenter:** Goyal Annayan
- **Screen:** Navigate to **Model Performance** (`/performance`)
- **Script:**
  > *"For Milestone 3, we implemented an end-to-end leak-free pipeline using the UCI Cleveland Heart Disease dataset. We established an 80/20 stratified split and fit all median imputers and scalers strictly on training data.
  >
  > Here is our benchmark comparison across all three trained models:
  > - **Logistic Regression (M3 Baseline):** Accuracy 86.89%, Recall 92.86%, ROC-AUC 95.78%.
  > - **Random Forest (M4 Champion):** Accuracy 90.16%, Precision 84.38%, Recall 96.43%, F1-Score 90.00%.
  > - **XGBoost:** Accuracy 86.89%, Recall 92.86%, ROC-AUC 91.88%.
  >
  > Notice why Random Forest is our champion: in medical triage, false negatives are catastrophic. On our 61-sample test set, Random Forest missed only 1 true positive case, achieving 96.43% sensitivity compared to 92.86% for the baseline."*
- **Action:** Point to the interactive confusion matrix and the radar chart comparing metrics.

---

### Phase 3: Interactive Risk Prediction (1:30 min)
- **Presenter:** Bhavuk Agrawal
- **Screen:** Navigate to **Risk Prediction** (`/predict`)
- **Script:**
  > *"In Milestone 4, we built this validated input form reflecting the 13 clinical biomarkers: age, sex, chest pain type, resting BP, cholesterol, fasting sugar, resting ECG, maximum heart rate, exercise angina, ST depression (oldpeak), ST slope, fluoroscopy vessels, and thallium scintigraphy.
  >
  > Let's load Sample A from our demonstration records—a 63-year-old male with typical angina and a fixed thallium defect."*
- **Action:**
  1. Select `Sample A — Male, 63, Typical Angina (Class 1 expected)`.
  2. Click **Predict**.
- **Script:**
  > *"The backend executes the Random Forest pipeline in real time. The model classifies this patient as Class 1 (disease presence in dataset), with an estimated positive probability of approximately 85%. Notice our visible educational disclaimer stating this is a dataset classification result and not an autonomous clinical prescription."*

---

### Phase 4: SHAP Explainability (1:00 min)
- **Presenter:** Goyal Annayan
- **Screen:** Navigate to **Explainability** (`/explain`)
- **Script:**
  > *"To ensure doctors can trust the output, we integrated game-theoretic SHAP explanations. Let's compute the feature contributions for the record we just tested."*
- **Action:** Select Sample A and click **Compute Explanation**.
- **Script:**
  > *"The local waterfall chart reveals the exact features driving this individual's prediction:
  > - Red bars represent positive forces increasing risk (such as ST depression oldpeak = 2.3 mm and thal fixed defect).
  > - Blue bars represent protective attributes.
  > Below, the global importance chart highlights that across the entire cohort, thallium scans, chest pain type, and major vessels are the top 3 drivers of cardiovascular risk."*

---

### Phase 5: RAG Medical Assistant & Grounded Retrieval (1:00 min)
- **Presenter:** Bhavuk Agrawal
- **Screen:** Navigate to **Medical AI Assistant** (`/assistant`)
- **Script:**
  > *"Finally, we demonstrate our contextual retrieval module. Patients and clinicians often need clear explanations of medical terminology like ST depression or cholesterol thresholds.
  >
  > Let's ask: 'What does ST depression mean in a stress test?'"*
- **Action:** Click the suggested question or type it in and hit Send.
- **Script:**
  > *"Notice what happens:
  > 1. Our query is converted into a 384-dimensional dense vector via sentence-transformers.
  > 2. ChromaDB searches our curated vector store of WHO, CDC, AHA, and NIH documents.
  > 3. Click 'Show retrieved source(s)'—you can inspect the exact passage retrieved from the National Institutes of Health NHLBI guide on stress testing, along with its similarity score and direct URL.
  > 4. The LLM synthesizes an educational explanation citing the NIH source without hallucinating treatment advice or altering the ML model's prediction."*

---

### Phase 6: Conclusion & Questions (0:30 min)
- **Presenter:** Both
- **Script:**
  > *"To summarize, we have delivered:
  > - Milestone 1: Problem domain identification and epidemiological analysis.
  > - Milestone 2: Review of existing scores (Framingham, ASCVD), feasibility, and algorithmic relevance.
  > - Milestone 3: Cleaned data, automated EDA, leak-free pipeline, and Logistic Regression baseline.
  > - Milestone 4: Random Forest champion (90.16% acc, 96.43% recall), XGBoost comparison, SHAP explanations, and ChromaDB RAG.
  > - Milestone 5: Full academic research paper report and demonstration scripts.
  >
  > Thank you, and we welcome any questions."*

---

## Fallback Procedures
- **If LLM API key has reached quota or is not configured:**  
  The RAG retrieval pipeline still functions 100%! Explain to the professor:
  *"Notice our graceful degradation: the system retrieves the verified passages, similarity scores, and canonical links from the ChromaDB vector database, and informs the user that natural-language synthesis requires an active GROQ_API_KEY."*
- **If models need to be retrained:**  
  Execute `python -m scripts.train_models` from the backend directory. The pipeline trains all three models, generates confusion matrix images, and saves artifacts in under 10 seconds.
