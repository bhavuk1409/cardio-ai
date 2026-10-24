export interface PredictionInput {
  age: number;
  sex: number;
  cp: number;
  trestbps: number;
  chol: number;
  fbs: number;
  restecg: number;
  thalach: number;
  exang: number;
  oldpeak: number;
  slope: number;
  ca: number;
  thal: number;
}

export interface PredictionResponse {
  predicted_class: number;
  probability_positive_class: number | null;
  model_name: string;
  model_version: string;
  interpretation: string;
  disclaimer: string;
}

export interface ShapContribution {
  feature: string;
  shap_value: number;
  feature_value: number;
  direction: string;
}

export interface ExplainResponse {
  status: string;
  contributions: ShapContribution[];
  base_value: number | null;
  message: string | null;
  global_importance: Array<{ feature: string; importance: number }> | null;
  caveat: string;
}

export interface Passage {
  text: string;
  title: string;
  organization: string;
  url: string;
  section: string;
  similarity_score: number;
}

export interface ChatResponse {
  query: string;
  answer: string | null;
  passages: Passage[];
  sources_used: string[];
  provider: string;
  retrieval_available: boolean;
  llm_available: boolean;
  error: string | null;
  disclaimer: string;
}

export interface HealthStatus {
  status: string;
  model_ready: boolean;
  retrieval_ready: boolean;
  llm_ready: boolean;
  version: string;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number | null;
  confusion_matrix: number[][];
  model_name: string;
  training_date: string;
  n_test_samples: number;
}

export interface KnowledgeSource {
  title: string;
  organization: string;
  url: string;
  section: string;
  retrieved_date: string;
  chunks_count?: number;
}

// Sample dataset records from UCI Cleveland heart disease cohort
export const SAMPLE_RECORDS: Array<{ label: string; data: PredictionInput; risk: 'HIGH' | 'LOW' }> = [
  {
    label: 'Case A — Male, 67, Asymptomatic (Severe CAD)',
    risk: 'HIGH',
    data: { age: 67, sex: 1, cp: 4, trestbps: 160, chol: 286, fbs: 0, restecg: 2, thalach: 108, exang: 1, oldpeak: 1.5, slope: 2, ca: 3, thal: 3 },
  },
  {
    label: 'Case B — Female, 57, Normal Flow (Low Risk)',
    risk: 'LOW',
    data: { age: 57, sex: 0, cp: 4, trestbps: 120, chol: 354, fbs: 0, restecg: 0, thalach: 163, exang: 1, oldpeak: 0.6, slope: 1, ca: 0, thal: 3 },
  },
  {
    label: 'Case C — Male, 53, Reversible Defect (Ischemic)',
    risk: 'HIGH',
    data: { age: 53, sex: 1, cp: 4, trestbps: 140, chol: 203, fbs: 1, restecg: 2, thalach: 155, exang: 1, oldpeak: 3.1, slope: 3, ca: 0, thal: 7 },
  },
  {
    label: 'Case D — Female, 41, Clear Scan (Healthy)',
    risk: 'LOW',
    data: { age: 41, sex: 0, cp: 2, trestbps: 130, chol: 204, fbs: 0, restecg: 2, thalach: 172, exang: 0, oldpeak: 1.4, slope: 1, ca: 0, thal: 3 },
  },
];
