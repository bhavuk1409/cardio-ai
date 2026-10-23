import { useState } from 'react';
import { Brain, Loader2, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { api } from '../services/api';
import { SAMPLE_RECORDS, ExplainResponse } from '../types';

export default function Explainability() {
  const [selectedSample, setSelectedSample] = useState<string>('0');
  const [result, setResult] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExplain() {
    setLoading(true);
    setError(null);
    try {
      const input = SAMPLE_RECORDS[parseInt(selectedSample)].data;
      const res = await api.explain({ input_data: input });
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const chartData = result?.contributions?.map(c => ({
    feature: c.feature.replace(/^(num__|cat__)/, '').slice(0, 24),
    value: c.shap_value,
    abs: Math.abs(c.shap_value),
    direction: c.direction,
  })) || [];

  const globalData = result?.global_importance?.map(g => ({
    feature: g.feature.replace(/^(num__|cat__)/, '').slice(0, 24),
    importance: g.importance,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SHAP Explainability</h1>
        <p className="mt-1 text-gray-500">
          Understand which features drive individual predictions and global model behaviour.
        </p>
      </div>

      <div className="card p-5">
        <h2 className="font-medium text-gray-800 mb-3">Select a demonstration record</h2>
        <select
          value={selectedSample}
          onChange={e => { setSelectedSample(e.target.value); setResult(null); }}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mb-3"
        >
          {SAMPLE_RECORDS.map((s, i) => (
            <option key={i} value={i}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={handleExplain}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {loading ? 'Computing SHAP…' : 'Compute Explanation'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200 text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium">Explanation Error</div>
            <div className="text-sm mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {result && result.status === 'ok' && (
        <>
          {/* Local explanation */}
          {chartData.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-800 mb-1">
                Local SHAP Explanation — Top Contributing Features
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Positive values (red) push the prediction toward class 1 (disease); negative values (blue) push toward class 0.
              </p>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => v.toFixed(3)} />
                  <YAxis type="category" dataKey="feature" width={160} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => v.toFixed(4)} />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.direction === 'positive' ? '#EF4444' : '#3B82F6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {result.base_value != null && (
                <p className="text-xs text-gray-400 mt-2">
                  Base value (model expected output): {result.base_value.toFixed(4)}
                </p>
              )}
            </div>
          )}

          {/* Global importance */}
          {globalData.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-800 mb-1">Global Feature Importance</h2>
              <p className="text-sm text-gray-500 mb-4">
                Mean |SHAP| values over the training set — higher = more influential overall.
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={globalData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="feature" width={160} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => v.toFixed(4)} />
                  <Bar dataKey="importance" fill="#14b8a6" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Caveat */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <strong>Important: </strong>{result.caveat}
          </div>
        </>
      )}

      {result && result.status === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          SHAP computation failed: {result.message}
        </div>
      )}
    </div>
  );
}
