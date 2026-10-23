import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CheckCircle, XCircle, AlertCircle, ArrowRight, Database, Brain, MessageSquare } from 'lucide-react';
import { api } from '../services/api';

interface StatusBadgeProps { ok: boolean; label: string }
function StatusBadge({ ok, label }: StatusBadgeProps) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
      {ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {label}
    </div>
  );
}

interface MetricCardProps { label: string; value: string | number; sub?: string }
function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <div className="card p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function Overview() {
  const [health, setHealth] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.health(), api.modelMetrics()])
      .then(([h, m]) => { setHealth(h); setMetrics(m); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rf = metrics?.models?.random_forest;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI-Driven Clinical Risk Prediction</h1>
        <p className="mt-1 text-gray-500">
          Cardiovascular Risk Prediction using ML, RAG, SHAP & LLMs — CSET343 (Session 2026–2027)
        </p>
      </div>

      {/* System Status */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          System Status
        </h2>
        {loading ? (
          <div className="text-sm text-gray-400">Checking services…</div>
        ) : health ? (
          <div className="flex flex-wrap gap-2">
            <StatusBadge ok={health.model_ready} label="ML Models" />
            <StatusBadge ok={health.retrieval_ready} label="Vector Store" />
            <StatusBadge ok={health.llm_ready} label="LLM (Groq)" />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertCircle className="w-4 h-4" />
            Backend not reachable — start with: uvicorn app.main:app
          </div>
        )}
      </div>

      {/* Dataset & Model Summary */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          Dataset & Trained Models
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Dataset" value="Cleveland" sub="UCI ML Repository #45" />
          <MetricCard label="Records" value="303" sub="Cleveland subset" />
          <MetricCard label="Features" value="13" sub="Cardiovascular indicators" />
          <MetricCard label="Models Trained" value="3" sub="LR · RF · XGBoost" />
        </div>
      </div>

      {/* Actual Metrics */}
      {rf && (
        <div>
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-600" />
            Best Model — Random Forest (actual test-set metrics)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard label="Accuracy" value={`${(rf.accuracy * 100).toFixed(1)}%`} />
            <MetricCard label="Precision" value={`${(rf.precision * 100).toFixed(1)}%`} />
            <MetricCard label="Recall" value={`${(rf.recall * 100).toFixed(1)}%`} />
            <MetricCard label="F1-Score" value={`${(rf.f1 * 100).toFixed(1)}%`} />
            <MetricCard label="ROC-AUC" value={rf.roc_auc ? `${(rf.roc_auc * 100).toFixed(1)}%` : 'N/A'} />
          </div>
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { to: '/predict', label: 'Risk Prediction', desc: 'Submit patient features and get a model prediction with SHAP explanation.', color: 'blue' },
            { to: '/performance', label: 'Model Performance', desc: 'Compare Logistic Regression, Random Forest and XGBoost metrics.', color: 'green' },
            { to: '/assistant', label: 'Medical AI Assistant', desc: 'Ask cardiovascular health questions. Powered by RAG + Groq.', color: 'purple' },
          ].map(({ to, label, desc, color }) => (
            <Link
              key={to}
              to={to}
              className="card p-4 hover:shadow-md transition-shadow group"
            >
              <div className={`text-sm font-semibold text-${color}-600 mb-1`}>{label}</div>
              <p className="text-sm text-gray-500 mb-3">{desc}</p>
              <div className={`flex items-center gap-1 text-sm text-${color}-600 font-medium`}>
                Open <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Educational disclaimer */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-amber-800">Educational Prototype — Not a Medical Device</div>
            <p className="mt-1 text-sm text-amber-700">
              Predictions are dataset classification results from models trained on the UCI Cleveland Heart Disease dataset.
              They are NOT clinical diagnoses, clinically validated risk assessments, or a substitute for professional medical advice.
              This application is built for academic demonstration purposes only (CSET343 — Bhavuk Agrawal, Goyal Annayan).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
