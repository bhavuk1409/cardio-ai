import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';

const FALLBACK = {
  random_forest: { accuracy: 0.9016, recall: 0.9643, f1: 0.90, roc_auc: 0.9372 },
  logistic_regression: { accuracy: 0.8525, recall: 0.8929, f1: 0.8475, roc_auc: 0.9113 },
  xgboost: { accuracy: 0.8689, recall: 0.9286, f1: 0.8667, roc_auc: 0.9242 },
};

export function BenchmarkView() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.modelMetrics().then((m) => setMetrics(m.models)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="panel panel-pad" style={{ textAlign: 'center', padding: '60px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
          <span className="chat-dot" />
          <span className="chat-dot" />
          <span className="chat-dot" />
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--faint)' }}>
          LOADING METRICS…
        </p>
      </div>
    );
  }

  const rf  = metrics?.random_forest        || FALLBACK.random_forest;
  const lr  = metrics?.logistic_regression  || FALLBACK.logistic_regression;
  const xgb = metrics?.xgboost              || FALLBACK.xgboost;

  const models = [
    { key: 'RF',  name: 'Random Forest',        data: rf,  color: 'var(--green)',  badge: 'CHAMPION', badgeCls: 'badge--green' },
    { key: 'XGB', name: 'XGBoost',              data: xgb, color: '#94a3b8',       badge: 'BOOSTED',  badgeCls: 'badge--approx' },
    { key: 'LR',  name: 'Logistic Regression',  data: lr,  color: 'var(--muted)',  badge: 'BASELINE', badgeCls: 'badge--approx' },
  ];

  const chartData = [
    { m: 'Accuracy', RF: +(rf.accuracy * 100).toFixed(1), XGB: +(xgb.accuracy * 100).toFixed(1), LR: +(lr.accuracy * 100).toFixed(1) },
    { m: 'Recall',   RF: +(rf.recall   * 100).toFixed(1), XGB: +(xgb.recall   * 100).toFixed(1), LR: +(lr.recall   * 100).toFixed(1) },
    { m: 'F1',       RF: +(rf.f1       * 100).toFixed(1), XGB: +(xgb.f1       * 100).toFixed(1), LR: +(lr.f1       * 100).toFixed(1) },
    { m: 'ROC-AUC',  RF: +(rf.roc_auc  * 100).toFixed(1), XGB: +(xgb.roc_auc  * 100).toFixed(1), LR: +(lr.roc_auc  * 100).toFixed(1) },
  ];

  return (
    <div className="layout" style={{ height: '100%' }}>
      {/* ── CONSOLE (LEFT): Leaderboard ── */}
      <section className="console" style={{ height: '100%', minHeight: 0 }}>
        <div className="panel panel--notch panel-pad">
          <p className="eyebrow" style={{ marginBottom: 12 }}>Model Leaderboard</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {models.map((m, idx) => (
              <motion.div key={m.key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  padding: '10px 14px',
                  background: idx === 0 ? 'rgba(67,214,117,0.05)' : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${idx === 0 ? 'rgba(67,214,117,0.3)' : 'var(--line)'}`,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11,
                      color: 'var(--faint)', minWidth: 20,
                    }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                      {m.name}
                    </span>
                    <span className={`badge ${m.badgeCls}`} style={{ fontSize: 8 }}>{m.badge}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--faint)', paddingLeft: 28 }}>
                    Acc <span style={{ color: 'var(--text)', fontWeight: 600 }}>{(m.data.accuracy * 100).toFixed(1)}%</span>
                    {' · '}
                    Recall <span style={{ color: m.color, fontWeight: 600 }}>{(m.data.recall * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--faint)', letterSpacing: '0.1em', marginBottom: 2 }}>ROC-AUC</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
                    {(m.data.roc_auc * 100).toFixed(1)}%
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Evaluation protocol */}
        <div className="panel panel-pad">
          <p className="eyebrow" style={{ marginBottom: 10 }}>Evaluation Protocol</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['Dataset', 'UCI Heart Disease'],
              ['Split', '80 / 20 stratified'],
              ['Test set', 'n = 61 patients'],
              ['CV', '5-fold cross-validation'],
              ['Priority', 'Recall (sensitivity)'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--faint)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--muted)', textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUTPUT (RIGHT): Charts ── */}
      <section className="output" style={{ height: '100%', minHeight: 0 }}>
        {/* Bar chart */}
        <div className="panel panel-pad">
          <p className="eyebrow" style={{ marginBottom: 12 }}>Metric Comparison</p>
          <div style={{ height: 180, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="m" stroke="var(--faint)" tick={{ fill: 'var(--faint)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                <YAxis domain={[70, 100]} stroke="var(--faint)" tick={{ fill: 'var(--faint)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                <Tooltip
                  contentStyle={{ background: '#101318', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="LR"  name="Logistic Regression" fill="#565b66" radius={[2,2,0,0]} />
                <Bar dataKey="RF"  name="Random Forest"       fill="#43d675" radius={[2,2,0,0]} />
                <Bar dataKey="XGB" name="XGBoost"             fill="#94a3b8" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
            {[['#565b66','Logistic Reg.'], ['#43d675','Random Forest'], ['#94a3b8','XGBoost']].map(([col, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: col, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--faint)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Confusion matrix — only if data available */}
        {rf.confusion_matrix && (
          <motion.div
            className="panel panel-pad"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow eyebrow--green" style={{ marginBottom: 14 }}>Confusion Matrix · RF</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'True Negative', val: rf.confusion_matrix[0][0], sub: 'Correct Healthy', style: { border: '1px solid var(--line)' } },
                { label: 'False Positive', val: rf.confusion_matrix[0][1], sub: 'False Alarm', style: { border: '1px solid rgba(225,6,0,0.3)', background: 'rgba(225,6,0,0.06)' } },
                { label: 'False Negative', val: rf.confusion_matrix[1][0], sub: 'Missed Case', style: { border: '1px solid rgba(255,178,0,0.3)', background: 'rgba(255,178,0,0.06)' } },
                { label: 'True Positive', val: rf.confusion_matrix[1][1], sub: 'Disease Caught', style: { border: '1px solid rgba(67,214,117,0.3)', background: 'rgba(67,214,117,0.06)' } },
              ].map((cell) => (
                <div key={cell.label} style={{
                  padding: '12px 14px', borderRadius: 4, textAlign: 'center', ...cell.style,
                }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                    {cell.label}
                  </p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                    {cell.val}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--faint)', marginTop: 4 }}>
                    {cell.sub}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}
