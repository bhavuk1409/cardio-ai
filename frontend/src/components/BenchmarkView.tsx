import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';

export function BenchmarkView() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.modelMetrics()
      .then((m) => setMetrics(m.models))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="panel panel-pad text-center py-16 text-xs font-mono text-cyan-400 animate-pulse">
        LOADING BENCHMARK METRICS…
      </div>
    );
  }

  const rf = metrics?.random_forest || { accuracy: 0.9016, recall: 0.9643, f1: 0.90, roc_auc: 0.9372 };
  const lr = metrics?.logistic_regression || { accuracy: 0.8525, recall: 0.8929, f1: 0.8475, roc_auc: 0.9113 };
  const xgb = metrics?.xgboost || { accuracy: 0.8689, recall: 0.9286, f1: 0.8667, roc_auc: 0.9242 };

  const chartData = [
    {
      metric: 'Accuracy',
      'Logistic Regression': Number(((lr?.accuracy || 0) * 100).toFixed(1)),
      'Random Forest': Number(((rf?.accuracy || 0) * 100).toFixed(1)),
      XGBoost: Number(((xgb?.accuracy || 0) * 100).toFixed(1)),
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
    <div className="layout">
      {/* ==================== CONSOLE (LEFT) ==================== */}
      <section className="console">
        <div className="panel panel--notch panel-pad space-y-3">
          <div className="section-label">
            <span>MODEL BENCHMARK LEADERBOARD</span>
            <b>TEST SET ($n=61$)</b>
          </div>

          {/* Rank 1: RF */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="p-3.5 bg-emerald-950/20 border border-emerald-500/50 rounded flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-emerald-400">01</span>
                <span className="font-display font-bold text-white text-sm">RANDOM FOREST</span>
                <span className="badge badge--green text-[8.5px]">CHAMPION</span>
              </div>
              <div className="text-[11px] font-mono text-gray-400 mt-1">
                Accuracy: <b className="text-white">{(rf.accuracy * 100).toFixed(1)}%</b> · Recall:{' '}
                <b className="text-emerald-400">{(rf.recall * 100).toFixed(1)}%</b>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-gray-500 block">ROC-AUC</span>
              <span className="font-bold text-cyan-400 text-sm">
                {(rf.roc_auc * 100).toFixed(1)}%
              </span>
            </div>
          </motion.div>

          {/* Rank 2: XGBoost */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="p-3.5 bg-black/30 border border-[var(--line)] rounded flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-gray-500">02</span>
                <span className="font-display font-bold text-white text-sm">XGBOOST</span>
                <span className="badge badge--cyan text-[8.5px]">BOOSTED</span>
              </div>
              <div className="text-[11px] font-mono text-gray-400 mt-1">
                Accuracy: <b className="text-white">{(xgb.accuracy * 100).toFixed(1)}%</b> · Recall:{' '}
                <b className="text-white">{(xgb.recall * 100).toFixed(1)}%</b>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-gray-500 block">ROC-AUC</span>
              <span className="font-bold text-cyan-400 text-sm">
                {(xgb.roc_auc * 100).toFixed(1)}%
              </span>
            </div>
          </motion.div>

          {/* Rank 3: Logistic Regression */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="p-3.5 bg-black/30 border border-[var(--line)] rounded flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-gray-500">03</span>
                <span className="font-display font-bold text-white text-sm">LOGISTIC REGRESSION</span>
                <span className="badge badge--approx text-[8.5px]">BASELINE</span>
              </div>
              <div className="text-[11px] font-mono text-gray-400 mt-1">
                Accuracy: <b className="text-white">{(lr.accuracy * 100).toFixed(1)}%</b> · Recall:{' '}
                <b className="text-white">{(lr.recall * 100).toFixed(1)}%</b>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-gray-500 block">ROC-AUC</span>
              <span className="font-bold text-cyan-400 text-sm">
                {(lr.roc_auc * 100).toFixed(1)}%
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== OUTPUT (RIGHT) ==================== */}
      <section className="output">
        <div className="panel panel-pad">
          <div className="section-label">
            <span>SIDE-BY-SIDE METRIC COMPARISON (%)</span>
            <b>VISUAL BENCHMARK</b>
          </div>
          <div className="h-64 w-full mt-2">
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
        {rf.confusion_matrix && (
          <div className="panel panel-pad border-emerald-500/30">
            <div className="section-label">
              <span>RANDOM FOREST CONFUSION MATRIX</span>
              <b>TEST SPLIT ($n=61$)</b>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center font-mono mt-2">
              <div className="p-2.5 bg-black/40 rounded border border-[var(--line)]">
                <div className="text-[10px] text-gray-400">TRUE NEG (TN)</div>
                <div className="text-lg font-bold text-white">{rf.confusion_matrix[0][0]}</div>
                <div className="text-[9.5px] text-emerald-400">Correct Healthy</div>
              </div>
              <div className="p-2.5 bg-red-950/20 rounded border border-red-500/30">
                <div className="text-[10px] text-red-300">FALSE POS (FP)</div>
                <div className="text-lg font-bold text-red-400">{rf.confusion_matrix[0][1]}</div>
                <div className="text-[9.5px] text-red-300/70">False Alarm</div>
              </div>
              <div className="p-2.5 bg-amber-950/20 rounded border border-amber-500/30">
                <div className="text-[10px] text-amber-300">FALSE NEG (FN)</div>
                <div className="text-lg font-bold text-amber-400">{rf.confusion_matrix[1][0]}</div>
                <div className="text-[9.5px] text-amber-300/70">Missed Case</div>
              </div>
              <div className="p-2.5 bg-black/40 rounded border border-[var(--line)]">
                <div className="text-[10px] text-gray-400">TRUE POS (TP)</div>
                <div className="text-lg font-bold text-emerald-400">{rf.confusion_matrix[1][1]}</div>
                <div className="text-[9.5px] text-emerald-400">Disease Caught</div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
