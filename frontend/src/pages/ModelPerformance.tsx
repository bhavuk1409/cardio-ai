import { useEffect, useState } from 'react';
import { BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { api } from '../services/api';

const MODEL_COLORS: Record<string, string> = {
  logistic_regression: '#3B82F6',
  random_forest: '#10B981',
  xgboost: '#F59E0B',
};
const MODEL_LABELS: Record<string, string> = {
  logistic_regression: 'Logistic Regression',
  random_forest: 'Random Forest',
  xgboost: 'XGBoost',
};

function pct(v: number | null | undefined) {
  if (v == null) return 'N/A';
  return `${(v * 100).toFixed(1)}%`;
}

export default function ModelPerformance() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.modelMetrics()
      .then(m => setMetrics(m.models))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center gap-3 text-gray-500 py-12">
      <Loader2 className="w-5 h-5 animate-spin" /> Loading metrics…
    </div>
  );
  if (error) return (
    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl text-red-700">
      <AlertCircle className="w-5 h-5 mt-0.5" /> {error}
    </div>
  );
  if (!metrics || Object.keys(metrics).length === 0) return (
    <div className="p-4 bg-amber-50 rounded-xl text-amber-700">
      No metrics found. Train models first: <code>python -m scripts.train_models</code>
    </div>
  );

  const models = Object.entries(metrics).map(([k, v]: [string, any]) => ({
    name: MODEL_LABELS[k] || k,
    key: k,
    ...v,
  }));

  // Data for bar chart comparison
  const barData = ['accuracy', 'precision', 'recall', 'f1'].map(metric => ({
    metric: metric.charAt(0).toUpperCase() + metric.slice(1),
    ...Object.fromEntries(models.map(m => [m.name, m[metric]])),
  }));

  // Radar data
  const radarData = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc'].map(metric => ({
    metric: metric === 'roc_auc' ? 'ROC-AUC' : metric.charAt(0).toUpperCase() + metric.slice(1),
    ...Object.fromEntries(models.map(m => [m.name, (m[metric] || 0) * 100])),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Model Performance</h1>
        <p className="mt-1 text-gray-500">Actual test-set evaluation metrics for all three models.</p>
      </div>

      {/* Comparison table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" /> Model Comparison
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Model</th>
                <th className="px-4 py-3 text-right">Accuracy</th>
                <th className="px-4 py-3 text-right">Precision</th>
                <th className="px-4 py-3 text-right">Recall</th>
                <th className="px-4 py-3 text-right">F1</th>
                <th className="px-4 py-3 text-right">ROC-AUC</th>
                <th className="px-4 py-3 text-right">Test Samples</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {models.map((m) => (
                <tr key={m.key} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium" style={{ color: MODEL_COLORS[m.key] }}>
                    {m.name}
                  </td>
                  <td className="px-4 py-3 text-right">{pct(m.accuracy)}</td>
                  <td className="px-4 py-3 text-right">{pct(m.precision)}</td>
                  <td className="px-4 py-3 text-right text-blue-700 font-medium">{pct(m.recall)}</td>
                  <td className="px-4 py-3 text-right">{pct(m.f1)}</td>
                  <td className="px-4 py-3 text-right">{pct(m.roc_auc)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{m.n_test_samples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar chart */}
        <div className="card p-5">
          <h3 className="font-medium text-gray-800 mb-4">Metric Comparison</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
              <Legend />
              {models.map(m => (
                <Bar key={m.key} dataKey={m.name} fill={MODEL_COLORS[m.key]} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar chart */}
        <div className="card p-5">
          <h3 className="font-medium text-gray-800 mb-4">Performance Radar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              {models.map(m => (
                <Radar
                  key={m.key}
                  name={m.name}
                  dataKey={m.name}
                  stroke={MODEL_COLORS[m.key]}
                  fill={MODEL_COLORS[m.key]}
                  fillOpacity={0.1}
                />
              ))}
              <Legend />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confusion matrices */}
      {models.map(m => (
        m.confusion_matrix && (
          <div key={m.key} className="card p-5">
            <h3 className="font-medium text-gray-800 mb-3">{m.name} — Confusion Matrix</h3>
            <div className="flex items-start gap-6">
              <div className="grid grid-cols-2 gap-1 text-center text-sm">
                <div className="col-span-2 text-xs text-gray-400 mb-1">Predicted →</div>
                {[
                  { label: 'No Disease', val: m.confusion_matrix[0][0], bg: 'bg-green-100 text-green-800', desc: 'True Negative' },
                  { label: 'Disease', val: m.confusion_matrix[0][1], bg: 'bg-red-100 text-red-800', desc: 'False Positive' },
                  { label: 'No Disease', val: m.confusion_matrix[1][0], bg: 'bg-orange-100 text-orange-800', desc: 'False Negative' },
                  { label: 'Disease', val: m.confusion_matrix[1][1], bg: 'bg-blue-100 text-blue-800', desc: 'True Positive' },
                ].map((cell, i) => (
                  <div key={i} className={`${cell.bg} rounded-lg p-4`}>
                    <div className="text-2xl font-bold">{cell.val}</div>
                    <div className="text-xs mt-1">{cell.desc}</div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-500 space-y-1.5">
                <div><span className="font-medium text-green-700">True Negative:</span> Correctly predicted no disease</div>
                <div><span className="font-medium text-red-700">False Positive:</span> Predicted disease, actually none</div>
                <div><span className="font-medium text-orange-700">False Negative:</span> Predicted no disease, actually present (higher clinical risk)</div>
                <div><span className="font-medium text-blue-700">True Positive:</span> Correctly predicted disease</div>
                <p className="text-xs text-gray-400 mt-3">
                  In clinical screening, minimising false negatives (↑ recall) is typically prioritised. 
                  These are dataset classification results, not validated clinical outcomes.
                </p>
              </div>
            </div>
          </div>
        )
      ))}

      {/* Training info */}
      {models[0] && (
        <div className="card p-4 text-sm text-gray-500">
          <span className="font-medium text-gray-700">Training info: </span>
          Dataset: UCI Cleveland ({models[0].dataset?.n_records} records) ·
          Split: 80/20 stratified ·
          Seed: {models[0].random_seed} ·
          Date: {models[0].training_date ? new Date(models[0].training_date).toLocaleDateString() : 'N/A'}
        </div>
      )}
    </div>
  );
}
