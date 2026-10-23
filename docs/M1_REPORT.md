# CSET343 — Milestone 1 Project Report
## Problem Domain Identification and Analysis

**Institution:** Bennett University / School of Computer Science Engineering and Technology  
**Course:** CSET343 — Artificial Intelligence and Machine Learning Applications  
**Academic Session:** 2026–2027  
**Evaluation Window:** September 8 – September 11  
**Project Title:** AI-Driven Clinical Risk Prediction and Context-Aware Medical Information Retrieval  
**Subtitle:** A Cardiovascular Risk Prediction Case Study using Machine Learning, Retrieval-Augmented Generation (RAG), SHAP and Large Language Models  

### Project Team
- **Bhavuk Agrawal** — Enrollment No: `E23CSEU1938`
- **Goyal Annayan** — Enrollment No: `E23CSEU1937`

---

## 1. Problem Domain Identification

### 1.1 Clinical & Epidemiological Background
Cardiovascular diseases (CVDs) represent the single leading cause of mortality and disability globally. According to the World Health Organization (WHO), an estimated 17.9 million individuals succumb to CVDs each year, constituting approximately 32% of all global fatalities. More than three-quarters of these deaths occur in low- and middle-income countries, where specialized cardiological facilities, catheterization laboratories, and skilled diagnosticians are heavily constrained.

Coronary artery disease (CAD)—characterized by atherosclerotic plaque accumulation in coronary vessels leading to myocardial ischemia or acute myocardial infarction—develops progressively over decades. Early identification of preclinical or asymptomatic individuals at high risk for CAD provides a decisive window for lifestyle interventions, pharmacotherapy (e.g., statins, antihypertensives), and preventive outpatient monitoring.

### 1.2 The Clinical Decision-Making Challenge
In routine outpatient triage, general practitioners and triage nurses must synthesize diverse multidimensional indicators:
- Demographic parameters (age, biological sex).
- Hemodynamic vitals (resting blood pressure).
- Biochemical profiles (serum cholesterol, fasting blood glucose).
- Non-invasive diagnostic biomarkers (resting electrocardiography, exercise treadmill stress ECG, fluoroscopic vessel counts, and thallium scintigraphy scans).

Traditional risk assessment tools (such as the Framingham Risk Score, SCORE2, and Reynolds Risk Score) rely on simplified regression point systems that assume strictly linear or log-linear additive relationships. They often fail to capture non-linear feature interactions, such as the compounding hazard of exercise ST-segment depression in the presence of asymptomatic chest pain.

---

## 2. Problem Domain Analysis

### 2.1 Limitations of Existing Approaches
Modern healthcare environments face two major computational challenges when applying artificial intelligence to cardiovascular screening:

1. **The "Black-Box" Opacity Barrier:**
   High-capacity supervised estimators (gradient boosted decision trees, deep neural networks) frequently achieve high statistical discrimination but fail in clinical adoption because healthcare professionals cannot inspect the individual rationale behind a specific prediction. In medical jurisprudence and ethics, an uninterpretable risk score cannot justify invasive angiographic follow-ups or aggressive pharmacotherapy.

2. **The Generative Hallucination Hazard in LLMs:**
   While Large Language Models (LLMs) excel at natural-language patient communication and medical question answering, they lack empirical mathematical grounding. When queried about a patient's clinical state, unconstrained generative models can hallucinate diagnostic thresholds, fabricate scientific citations, or offer unauthorized therapeutic adjustments.

### 2.2 Domain Requirements & Problem Formulation
To address these challenges, this project formulates an integrated, dual-stream architecture:
- **Stream A (Empirical Numerical Inference):** Supervised machine learning algorithms trained on verified benchmark clinical records (UCI Heart Disease Repository) to output reproducible classifications and probability estimates, accompanied by game-theoretic feature attributions (SHAP).
- **Stream B (Contextual Knowledge Retrieval):** A Retrieval-Augmented Generation (RAG) pipeline querying trusted public health guidelines (WHO, CDC, AHA, NIH) to deliver grounded medical explanations and literature citations.
- **Architectural Boundary:** The LLM is strictly prohibited from altering, re-weighting, or overriding the empirical machine learning model's output, maintaining patient safety and diagnostic separation.

---

## 3. Stakeholder Analysis

| Stakeholder Group | Primary Needs & Objectives | Impact of Proposed Solution |
| :--- | :--- | :--- |
| **Triage & Primary Care Physicians** | Rapid, objective risk stratification; transparent explanations of contributing risk factors. | Provides instant predictions with SHAP waterfall explanations highlighting high-impact biomarkers. |
| **Patients & Caregivers** | Understandable health context without overwhelming technical jargon or unverified medical claims. | Grounded conversational assistant explaining terms (e.g., ST depression, LDL targets) citing official guidelines. |
| **Clinical Informatics Researchers** | Reproducible, leak-free preprocessing pipelines and open, verifiable benchmark evaluations. | Fully reproducible scikit-learn pipeline, open UCI dataset integration, and auditable metrics. |

---

## 4. Scope, Constraints & Ethical Guardrails

### 4.1 Scope of the Study
- Focus on ischemic cardiovascular disease classification using the established Cleveland Clinic dataset (303 records, 13 features).
- Implementation of a baseline Logistic Regression classifier followed by comparative tree ensembles (Random Forest, XGBoost).
- Development of a local, privacy-preserving vector database (ChromaDB) containing curated cardiovascular guidance.
- Provision of an intuitive web-based decision support interface.

### 4.2 Constraints & Ethical Disclaimers
- **Educational Prototype:** This system is an academic research prototype and is **not certified as a clinical medical device** under FDA or CE-MDR regulations.
- **Data Privacy:** Demonstrations rely exclusively on anonymized public benchmark records and synthetic mock cases. No Protected Health Information (PHI) is collected, stored, or transmitted.
- **Decision-Support Guardrail:** Outputs are explicitly labeled as dataset classification estimates, not autonomous definitive medical diagnoses.

---

## 5. Milestone 1 Summary & Conclusion

Milestone 1 successfully establishes:
1. Clear delineation of the cardiovascular diagnostic domain and clinical motivation.
2. Comprehensive analysis of existing gaps in traditional linear risk scoring and ungrounded LLMs.
3. Formulation of a dual-pipeline architecture (Empirical ML + Grounded RAG) with ethical safety constraints.
4. Foundation for Milestone 2's systematic literature review and algorithmic methodology design.

---

## 6. References
1. World Health Organization. (2021). *Cardiovascular diseases (CVDs) Factsheet.* WHO Media Centre.
2. Detrano, R., et al. (1989). *International application of a new probability algorithm for the diagnosis of coronary artery disease.* American Journal of Cardiology, 64(5), 304–310.
3. Topol, E. J. (2019). *High-performance medicine: the convergence of human and artificial intelligence.* Nature Medicine, 25(1), 44–56.
4. Rajkomar, A., Dean, J., & Kohane, I. (2019). *Machine learning in medicine.* New England Journal of Medicine, 380(14), 1347–1358.
