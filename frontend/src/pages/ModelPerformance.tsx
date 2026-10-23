import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';

const MODEL_LABELS: Record<string, string> = {
  logistic_regression: 'Logistic Regression (M3 Baseline)',
  random_forest: 'Random Forest (Champion)',
  xgboost: 'XGBoost Classifier',
};

export default function ModelPerformance() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.modelMetrics()
      .then((m) => setMetrics(m.models))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="panel panel-pad text-center py-16 text-xs font-mono text-cyan-400 animate-pulse">
        LOADING MODEL TELEMETRY & TEST EVALUATION METRICS…
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="panel panel-pad border-red-500/40 bg-red-950/20 text-red-300 text-xs font-mono">
        ⚠ {error || 'No evaluation metrics found.'}
      </div>
    );
  }

  const rf = metrics.random_forest;
  const lr = metrics.logistic_regression;
  const xgb = metrics.xgboost;

  const chartData = [
    {
      metric: 'Accuracy',
      'Logistic Regression': Number(((lr?.accuracy || 0) * 100).toFixed(1)),
      'Random Forest': Number(((rf?.accuracy || 0) * 100).toFixed(1)),
      XGBoost: Number(((xgb?.accuracy || 0) * 100).toFixed(1)),
    },
    {
      metric: 'Precision',
      'Logistic Regression': Number(((lr?.precision || 0) * 100).toFixed(1)),
      'Random Forest': Number(((rf?.precision || 0) * 100).toFixed(1)),
      XGBoost: Number(((xgb?.precision || 0) * 100).toFixed(1)),
    },
    {
      metric: 'Recall (Sensitivity)',
      'Logistic Regression': Number(((lr?.recall || 0) * 100).toFixed(1)),
      'Random Forest': Number(((rf?.recall || 0) * 100).toFixed(1)),
      XGBoost: Number(((xgb?.recall || 0) * 100).toFixed(1)),
    },
    {
      metric: 'F1-Score',
      'Logistic Regression': Number(((lr?.f1 || 0) * 100).toFixed(1)),
      'Random Forest': Number(((rf?.f1 || 0) * 100).toFixed(1)),
      XGBoost: Number(((xgb?.f1 || 0) * 100).toFixed(1)),
    },
    {
      metric: 'ROC-AUC',
      'Logistic Regression': Number(((lr?.roc_auc || 0) * 100).toFixed(1)),
      'Random Forest': Number(((rf?.roc_auc || 0) * 100).toFixed(1)),
      XGBoost: Number(((xgb?.roc_auc || 0) * 100).toFixed(1)),
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <div className="eyebrow eyebrow--green">MILESTONES 3 & 4 · MODEL EVALUATION & BENCHMARK</div>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-wider text-white mt-1">
          THREE-MODEL PERFORMANCE BENCHMARK
        </h1>
        <p className="mt-1 text-xs font-mono text-gray-400">
          Independent 20% stratified test partition ($n = 61$). Preprocessor fitted strictly on training data with no leakage.
        </p>
      </div>

      {/* Model Benchmark Leaderboard (Pit Wall style) */}
      <div className="panel panel--notch panel-pad">
        <div className="section-label">
          <span>MODEL LEADERBOARD</span>
          <b>STRATIFIED TEST EVALUATION ($n=61$)</b>
        </div>

        <div className="space-y-3">
          {/* Row 1: Random Forest */}
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="p-4 bg-emerald-950/20 border border-emerald-500/50 rounded flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <span className="font-display font-bold text-2xl text-emerald-400">01</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-white text-base">RANDOM FOREST</span>
                  <span className="badge badge--green">CHAMPION MODEL</span>
                </div>
                <div className="text-xs font-mono text-gray-400 mt-0.5">
                  100 estimators · Gini impurity · Highest sensitivity (minimizes false negatives in clinical triage)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-gray-500 block text-[10px]">ACCURACY</span>
                <span className="font-bold text-white text-sm">{(rf.accuracy * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">RECALL</span>
                <span className="font-bold text-emerald-400 text-sm">{(rf.recall * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">F1</span>
                <span className="font-bold text-white text-sm">{(rf.f1 * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">ROC-AUC</span>
                <span className="font-bold text-cyan-400 text-sm">{(rf.roc_auc * 100).toFixed(2)}%</span>
              </div>
            </div>
          </motion.div>

          {/* Row 2: XGBoost */}
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="p-4 bg-black/30 border border-[var(--line)] rounded flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <span className="font-display font-bold text-2xl text-gray-500">02</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-white text-base">XGBOOST CLASSIFIER</span>
                  <span className="badge badge--cyan">GRADIENT BOOSTED</span>
                </div>
                <div className="text-xs font-mono text-gray-400 mt-0.5">
                  Gradient boosted trees with regularized learning rate = 0.05, max_depth = 3
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-gray-500 block text-[10px]">ACCURACY</span>
                <span className="font-bold text-white text-sm">{(xgb.accuracy * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">RECALL</span>
                <span className="font-bold text-white text-sm">{(xgb.recall * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">F1</span>
                <span className="font-bold text-white text-sm">{(xgb.f1 * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">ROC-AUC</span>
                <span className="font-bold text-cyan-400 text-sm">{(xgb.roc_auc * 100).toFixed(2)}%</span>
              </div>
            </div>
          </motion.div>

          {/* Row 3: Logistic Regression */}
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.19, ease: [0.22, 1, 0.36, 1] }}
            className="p-4 bg-black/30 border border-[var(--line)] rounded flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <span className="font-display font-bold text-2xl text-gray-500">03</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-white text-base">LOGISTIC REGRESSION</span>
                  <span className="badge badge--approx">M3 BASELINE</span>
                </div>
                <div className="text-xs font-mono text-gray-400 mt-0.5">
                  L2 regularized linear baseline with C = 1.0 (Milestone 3 core deliverable)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-gray-500 block text-[10px]">ACCURACY</span>
                <span className="font-bold text-white text-sm">{(lr.accuracy * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">RECALL</span>
                <span className="font-bold text-white text-sm">{(lr.recall * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">F1</span>
                <span className="font-bold text-white text-sm">{(lr.f1 * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">ROC-AUC</span>
                <span className="font-bold text-cyan-400 text-sm">{(lr.roc_auc * 100).toFixed(2)}%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Comparative Multi-Metric Bar Chart */}
      <div className="panel panel-pad">
        <div className="section-label">
          <span>SIDE-BY-SIDE METRIC COMPARISON (%)</span>
          <b>VISUAL BENCHMARK</b>
        </div>
        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="metric" stroke="#868b95" tick={{ fill: '#868b95', fontSize: 11 }} />
              <YAxis domain={[70, 100]} stroke="#868b95" tick={{ fill: '#868b95', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#101318',
                  borderColor: 'rgba(255,255,255,0.15)',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Bar dataKey="Logistic Regression" fill="#868b95" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Random Forest" fill="#43d675" radius={[2, 2, 0, 0]} />
              <Bar dataKey="XGBoost" fill="#35dfe6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confusion Matrix Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: 'random_forest', name: 'Random Forest (Champion)', m: rf, border: 'border-emerald-500/40' },
          { key: 'xgboost', name: 'XGBoost', m: xgb, border: 'border-cyan-500/40' },
          { key: 'logistic_regression', name: 'Logistic Regression', m: lr, border: 'border-gray-700' },
        ].map((item) => (
          <div key={item.key} className={`panel panel-pad ${item.border}`}>
            <div className="section-label">
              <span>{item.name.toUpperCase()}</span>
              <b>CONFUSION MATRIX</b>
            </div>

            {item.m.confusion_matrix && (
              <div className="grid grid-cols-2 gap-2 text-center font-mono mt-3">
                <div className="p-3 bg-black/40 rounded border border-[var(--line)]">
                  <div className="text-[10px] text-gray-400">TRUE NEG (TN)</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {item.m.confusion_matrix[0][0]}
                  </div>
                  <div className="text-[10px] text-emerald-400">Healthy Correct</div>
                </div>

                <div className="p-3 bg-red-950/20 rounded border border-red-500/30">
                  <div className="text-[10px] text-red-300">FALSE POS (FP)</div>
                  <div className="text-xl font-bold text-red-400 mt-1">
                    {item.m.confusion_matrix[0][1]}
                  </div>
                  <div className="text-[10px] text-red-300/70">False Alarm</div>
                </div>

                <div className="p-3 bg-amber-950/20 rounded border border-amber-500/30">
                  <div className="text-[10px] text-amber-300">FALSE NEG (FN)</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {item.m.confusion_matrix[1][0]}
                  </div>
                  <div className="text-[10px] text-amber-300/70">Missed Case</div>
                </div>

                <div className="p-3 bg-black/40 rounded border border-[var(--line)]">
                  <div className="text-[10px] text-gray-400">TRUE POS (TP)</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {item.m.confusion_matrix[1][1]}
                  </div>
                  <div className="text-[10px] text-emerald-400">Disease Caught</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
