import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { SAMPLE_RECORDS, ExplainResponse } from '../types';

export default function Explainability() {
  const [selectedSample, setSelectedSample] = useState<string>('0');
  const [result, setResult] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExplanation(selectedSample);
  }, [selectedSample]);

  async function fetchExplanation(idx: string) {
    setLoading(true);
    setError(null);
    try {
      const input = SAMPLE_RECORDS[parseInt(idx)].data;
      const res = await api.explain({ input_data: input, top_k: 10 });
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Failed to compute SHAP explanation.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <div className="eyebrow eyebrow--cyan">EXPLAINABILITY</div>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-wider text-white mt-1">
          SHAP FEATURE ATTRIBUTION
        </h1>
        <p className="mt-1 text-xs font-mono text-gray-400">
          Individual patient attributions and global dataset feature rankings.
        </p>
      </div>

      {/* Profile Selector */}
      <div className="panel panel-pad">
        <div className="section-label">
          <span>SELECT DEMONSTRATION PATIENT PROFILE</span>
          <b>CASE VALIDATION</b>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_RECORDS.map((s, i) => (
            <button
              key={i}
              type="button"
              className={`btn ${selectedSample === String(i) ? 'btn--cyan' : 'btn--outline'}`}
              onClick={() => setSelectedSample(String(i))}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="panel panel-pad text-center py-12 text-xs font-mono text-cyan-400 animate-pulse">
          COMPUTING SHAPLEY VALUES VIA TREE EXPLAINER…
        </div>
      )}

      {error && (
        <div className="panel panel-pad border-red-500/40 bg-red-950/20 text-red-300 text-xs font-mono">
          ⚠ {error}
        </div>
      )}

      {!loading && result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Local Patient Feature Contributions */}
          <div className="panel panel--notch panel-pad">
            <div className="section-label">
              <span>LOCAL PATIENT ATTRIBUTIONS</span>
              <b>SHAPLEY ADDITIVE VALUES</b>
            </div>

            <div className="mb-4 text-xs font-mono text-gray-400 flex items-center justify-between border-b border-[var(--line)] pb-3">
              <span>BASE MODEL VALUE (EXPECTED VALUE):</span>
              <span className="text-white font-semibold">
                {result.base_value !== null ? result.base_value.toFixed(4) : '0.5060'}
              </span>
            </div>

            <div className="space-y-3">
              {result.contributions.map((c, i) => {
                const isPos = c.shap_value > 0;
                const cleanName = c.feature.replace(/^(num__|cat__)/, '');
                const absVal = Math.abs(c.shap_value);
                const barWidth = Math.min(Math.round((absVal / 0.12) * 100), 100);

                return (
                  <motion.div
                    key={i}
                    className="shap-bar"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="shap-bar__label" title={cleanName}>
                      {cleanName}
                    </span>
                    <div className="shap-bar__track">
                      <div
                        className={`shap-bar__fill ${
                          isPos ? 'shap-bar__fill--pos' : 'shap-bar__fill--neg'
                        }`}
                        style={{ width: `${Math.max(barWidth, 10)}%` }}
                      />
                    </div>
                    <span
                      className="shap-bar__val"
                      style={{ color: isPos ? 'var(--red)' : 'var(--green)' }}
                    >
                      {isPos ? '+' : ''}{c.shap_value.toFixed(3)}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--line)] text-[11px] font-mono text-gray-400 flex items-center justify-between">
              <span className="text-red-400">■ Pushing Risk Higher (Positive)</span>
              <span className="text-emerald-400">■ Protective Influence (Negative)</span>
            </div>
          </div>

          {/* Right: Global Feature Importance */}
          <div className="panel panel--notch panel-pad">
            <div className="section-label">
              <span>GLOBAL FEATURE IMPORTANCE</span>
              <b>OVERALL MODEL ATTRIBUTION</b>
            </div>

            <div className="mb-4 text-xs font-mono text-gray-400 border-b border-[var(--line)] pb-3">
              Mean absolute SHAP value across the entire Cleveland test cohort:
            </div>

            <div className="space-y-3">
              {(result.global_importance || []).slice(0, 10).map((g, i) => {
                const cleanName = g.feature.replace(/^(num__|cat__)/, '');
                const barWidth = Math.min(Math.round((g.importance / 0.10) * 100), 100);

                return (
                  <motion.div
                    key={i}
                    className="shap-bar"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="shap-bar__label" title={cleanName}>
                      {i + 1}. {cleanName}
                    </span>
                    <div className="shap-bar__track">
                      <div
                        className="shap-bar__fill"
                        style={{
                          width: `${Math.max(barWidth, 8)}%`,
                          background: 'linear-gradient(90deg, #1e293b, var(--cyan))',
                        }}
                      />
                    </div>
                    <span className="shap-bar__val text-cyan-300">
                      {g.importance.toFixed(3)}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--line)] text-[11px] font-mono text-gray-500">
              Biomarkers with higher mean absolute SHAP values have the greatest overall discriminative power.
            </div>
          </div>
        </div>
      )}

      {/* Caveat */}
      <div className="panel panel-pad border-gray-800 bg-black/40">
        <div className="text-xs font-mono text-gray-400 leading-relaxed">
          <strong className="text-white">SHAP Interpretation Notice:</strong> {result?.caveat || 'SHAP feature contributions indicate the mathematical influence of each feature on this model prediction. They do not establish medical causation. The model was trained on the UCI Cleveland dataset and is for educational demonstration only.'}
        </div>
      </div>
    </motion.div>
  );
}
