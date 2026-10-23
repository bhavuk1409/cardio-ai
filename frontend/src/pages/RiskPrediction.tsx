import { useState } from 'react';
import { Heart, AlertCircle, CheckCircle, Loader2, RotateCcw, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { PredictionInput, PredictionResponse, SAMPLE_RECORDS } from '../types';

const FIELD_DEFS = [
  { key: 'age', label: 'Age', type: 'number', min: 1, max: 120, unit: 'years', step: 1 },
  { key: 'sex', label: 'Sex', type: 'select', options: [{ v: 1, l: 'Male' }, { v: 0, l: 'Female' }] },
  { key: 'cp', label: 'Chest Pain Type', type: 'select', options: [
    { v: 1, l: '1 — Typical Angina' }, { v: 2, l: '2 — Atypical Angina' },
    { v: 3, l: '3 — Non-Anginal Pain' }, { v: 4, l: '4 — Asymptomatic' }
  ]},
  { key: 'trestbps', label: 'Resting Blood Pressure', type: 'number', min: 50, max: 300, unit: 'mm Hg', step: 1 },
  { key: 'chol', label: 'Serum Cholesterol', type: 'number', min: 100, max: 700, unit: 'mg/dl', step: 1 },
  { key: 'fbs', label: 'Fasting Blood Sugar > 120 mg/dl', type: 'select', options: [{ v: 1, l: 'True (>120)' }, { v: 0, l: 'False (≤120)' }] },
  { key: 'restecg', label: 'Resting ECG', type: 'select', options: [
    { v: 0, l: '0 — Normal' }, { v: 1, l: '1 — ST-T Abnormality' }, { v: 2, l: '2 — LV Hypertrophy' }
  ]},
  { key: 'thalach', label: 'Max Heart Rate Achieved', type: 'number', min: 50, max: 250, unit: 'bpm', step: 1 },
  { key: 'exang', label: 'Exercise-Induced Angina', type: 'select', options: [{ v: 1, l: 'Yes' }, { v: 0, l: 'No' }] },
  { key: 'oldpeak', label: 'ST Depression (Oldpeak)', type: 'number', min: 0, max: 10, unit: 'mm', step: 0.1 },
  { key: 'slope', label: 'Slope of Peak Exercise ST', type: 'select', options: [
    { v: 1, l: '1 — Upsloping' }, { v: 2, l: '2 — Flat' }, { v: 3, l: '3 — Downsloping' }
  ]},
  { key: 'ca', label: 'Major Vessels (Fluoroscopy)', type: 'select', options: [
    { v: 0, l: '0' }, { v: 1, l: '1' }, { v: 2, l: '2' }, { v: 3, l: '3' }
  ]},
  { key: 'thal', label: 'Thallium Scan', type: 'select', options: [
    { v: 3, l: '3 — Normal' }, { v: 6, l: '6 — Fixed Defect' }, { v: 7, l: '7 — Reversable Defect' }
  ]},
] as const;

const EMPTY: PredictionInput = {
  age: 50, sex: 1, cp: 2, trestbps: 130, chol: 240,
  fbs: 0, restecg: 0, thalach: 150, exang: 0,
  oldpeak: 1.0, slope: 2, ca: 0, thal: 3
};

export default function RiskPrediction() {
  const [form, setForm] = useState<PredictionInput>(EMPTY);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<string>('');

  function handleChange(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: parseFloat(value) }));
  }

  function handleSample(idx: string) {
    if (!idx) return;
    setSelectedSample(idx);
    setForm(SAMPLE_RECORDS[parseInt(idx)].data);
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.predict(form);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setForm(EMPTY);
    setResult(null);
    setError(null);
    setSelectedSample('');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Risk Prediction</h1>
        <p className="mt-1 text-gray-500">
          Enter cardiovascular feature values below to get a model classification result.
        </p>
      </div>

      {/* Demo sample selector */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">Load a demonstration record</span>
          <span className="badge bg-amber-100 text-amber-700">Demo only — not real patients</span>
        </div>
        <select
          value={selectedSample}
          onChange={e => handleSample(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a sample record…</option>
          {SAMPLE_RECORDS.map((s, i) => (
            <option key={i} value={i}>{s.label}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Patient Feature Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FIELD_DEFS.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {f.label}
                  {'unit' in f && <span className="text-gray-400 font-normal"> ({f.unit})</span>}
                </label>
                {f.type === 'select' ? (
                  <select
                    value={form[f.key as keyof PredictionInput]}
                    onChange={e => handleChange(f.key, e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(f as any).options.map((o: any) => (
                      <option key={o.v} value={o.v}>{o.l}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    min={(f as any).min}
                    max={(f as any).max}
                    step={(f as any).step}
                    value={form[f.key as keyof PredictionInput]}
                    onChange={e => handleChange(f.key, e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
              {loading ? 'Running prediction…' : 'Predict'}
            </button>
            <button type="button" onClick={handleReset} className="btn-secondary flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-red-800">Prediction Error</div>
              <div className="text-sm text-red-600 mt-0.5">{error}</div>
              {error.includes('not loaded') && (
                <div className="text-sm text-red-600 mt-1">
                  Run: <code className="bg-red-100 px-1 rounded">python -m scripts.train_models</code> in the backend directory.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`card p-5 border-l-4 ${result.predicted_class === 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                result.predicted_class === 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {result.predicted_class === 0 ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-semibold text-gray-900">
                    Predicted Class: {result.predicted_class}
                    {' '}({result.predicted_class === 0 ? 'No Disease' : 'Disease Present'})
                  </h3>
                  <span className="badge bg-blue-100 text-blue-700">{result.model_name.replace('_', ' ')}</span>
                  <span className="badge bg-gray-100 text-gray-600">v{result.model_version}</span>
                </div>
                {result.probability_positive_class !== null && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-600 mb-1">
                      Estimated probability of positive class (disease):&nbsp;
                      <span className="font-semibold">{(result.probability_positive_class * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${result.predicted_class === 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${result.probability_positive_class * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                <p className="mt-3 text-sm text-gray-600">{result.interpretation}</p>
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  {result.disclaimer}
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
