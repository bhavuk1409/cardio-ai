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

// Sample dataset records for demo
export const SAMPLE_RECORDS: Array<{ label: string; data: PredictionInput }> = [
  {
    label: 'Sample A — Male, 63, Typical Angina (Class 1 expected)',
    data: { age: 63, sex: 1, cp: 1, trestbps: 145, chol: 233, fbs: 1, restecg: 2, thalach: 150, exang: 0, oldpeak: 2.3, slope: 3, ca: 0, thal: 6 },
  },
  {
    label: 'Sample B — Female, 57, Non-Anginal Pain (Class 0 expected)',
    data: { age: 57, sex: 0, cp: 3, trestbps: 128, chol: 303, fbs: 0, restecg: 0, thalach: 159, exang: 0, oldpeak: 0.0, slope: 1, ca: 1, thal: 3 },
  },
  {
    label: 'Sample C — Male, 52, Asymptomatic (Class 1 expected)',
    data: { age: 52, sex: 1, cp: 4, trestbps: 172, chol: 199, fbs: 1, restecg: 0, thalach: 162, exang: 0, oldpeak: 0.5, slope: 1, ca: 0, thal: 3 },
  },
  {
    label: 'Sample D — Female, 41, Atypical Angina (Class 0 expected)',
    data: { age: 41, sex: 0, cp: 2, trestbps: 130, chol: 204, fbs: 0, restecg: 2, thalach: 172, exang: 0, oldpeak: 1.4, slope: 1, ca: 0, thal: 3 },
  },
];
