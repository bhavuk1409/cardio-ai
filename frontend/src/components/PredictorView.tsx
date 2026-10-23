import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { PredictionInput, PredictionResponse, SAMPLE_RECORDS } from '../types';
import { StatReadout } from './StatReadout';

interface Props {
  onConsultAI: (prompt: string) => void;
}

const DEFAULT_PATIENT: PredictionInput = {
  age: 60,
  sex: 1,
  cp: 4,
  trestbps: 140,
  chol: 260,
  fbs: 0,
  restecg: 2,
  thalach: 140,
  exang: 1,
  oldpeak: 2.5,
  slope: 2,
  ca: 2,
  thal: 7,
};

export function PredictorView({ onConsultAI }: Props) {
  const [form, setForm] = useState<PredictionInput>(DEFAULT_PATIENT);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [shapData, setShapData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<string>('0');

  function handleChange(key: keyof PredictionInput, val: number) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function loadSample(idx: number) {
    const s = SAMPLE_RECORDS[idx];
    if (!s) return;
    setSelectedSample(String(idx));
    setForm(s.data);
    setResult(null);
    setShapData(null);
    setError(null);
  }

  async function handlePredict(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const pred = await api.predict(form);
      setResult(pred);

      try {
        const shap = await api.explain({ input_data: form, top_k: 5 });
        setShapData(shap);
      } catch {
        // non-blocking
      }
    } catch (err: any) {
      setError(err.message || 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setForm(DEFAULT_PATIENT);
    setResult(null);
    setShapData(null);
    setError(null);
  }

  const probPercent =
    result && result.probability_positive_class !== null
      ? result.probability_positive_class * 100
      : result?.predicted_class === 1
      ? 95
      : 5;

  const isHighRisk = result?.predicted_class === 1;

  const maxTargetHr = 220 - form.age;
  const hrPercent = Math.round((form.thalach / maxTargetHr) * 100);
  const bpCategory =
    form.trestbps < 120
      ? 'Optimal'
      : form.trestbps <= 129
      ? 'Elevated'
      : form.trestbps <= 139
      ? 'Stage 1 HTN'
      : 'Stage 2 HTN';

  return (
    <div className="layout">
      {/* ==================== CONSOLE (LEFT) ==================== */}
      <section className="console">
        {/* Quick Sample Selector */}
        <div className="panel panel-pad">
          <div className="section-label">
            <span>PRESET PATIENT PROFILES</span>
            <b>1-CLICK LOAD</b>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_RECORDS.map((s, i) => {
              const isPos = s.label.includes('Class 1');
              return (
                <button
                  key={i}
                  type="button"
                  className={`btn btn--sm text-left justify-between ${
                    selectedSample === String(i) ? 'btn--cyan' : 'btn--outline'
                  }`}
                  onClick={() => loadSample(i)}
                >
                  <span className="truncate">{s.label.split('—')[0].trim()}</span>
                  <span className={`badge ${isPos ? 'badge--red' : 'badge--green'} text-[8.5px]`}>
                    {isPos ? 'HIGH RISK' : 'LOW RISK'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handlePredict} className="panel panel-pad space-y-4">
          <div className="section-label">
            <span>PATIENT BIOMARKERS</span>
            <b>13 CLINICAL INDICATORS</b>
          </div>

          {/* Row 1: Age & Sex */}
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label>AGE <b>YEARS</b></label>
              <input
                type="number"
                className="input"
                min={20}
                max={90}
                value={form.age}
                onChange={(e) => handleChange('age', Number(e.target.value))}
                required
              />
            </div>
            <div className="field">
              <label>BIOLOGICAL SEX</label>
              <select
                className="select"
                value={form.sex}
                onChange={(e) => handleChange('sex', Number(e.target.value))}
              >
                <option value={1}>Male</option>
                <option value={0}>Female</option>
              </select>
            </div>
          </div>

          {/* Row 2: BP & Cholesterol */}
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label>RESTING BP <b>MM HG</b></label>
              <input
                type="number"
                className="input"
                min={80}
                max={220}
                value={form.trestbps}
                onChange={(e) => handleChange('trestbps', Number(e.target.value))}
                required
              />
            </div>
            <div className="field">
              <label>CHOLESTEROL <b>MG/DL</b></label>
              <input
                type="number"
                className="input"
                min={100}
                max={500}
                value={form.chol}
                onChange={(e) => handleChange('chol', Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Row 3: Chest Pain & Max HR */}
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label>CHEST PAIN TYPE</label>
              <select
                className="select"
                value={form.cp}
                onChange={(e) => handleChange('cp', Number(e.target.value))}
              >
                <option value={1}>Typical Angina</option>
                <option value={2}>Atypical Angina</option>
                <option value={3}>Non-Anginal Pain</option>
                <option value={4}>Asymptomatic (High Risk)</option>
              </select>
            </div>
            <div className="field">
              <label>MAX HEART RATE <b>BPM</b></label>
              <input
                type="number"
                className="input"
                min={60}
                max={220}
                value={form.thalach}
                onChange={(e) => handleChange('thalach', Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Row 4: ST Depression & Slope */}
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label>ST DEPRESSION <b>MM</b></label>
              <input
                type="number"
                step="0.1"
                className="input"
                min={0}
                max={6}
                value={form.oldpeak}
                onChange={(e) => handleChange('oldpeak', Number(e.target.value))}
                required
              />
            </div>
            <div className="field">
              <label>PEAK ST SLOPE</label>
              <select
                className="select"
                value={form.slope}
                onChange={(e) => handleChange('slope', Number(e.target.value))}
              >
                <option value={1}>Upsloping</option>
                <option value={2}>Flat</option>
                <option value={3}>Downsloping</option>
              </select>
            </div>
          </div>

          {/* Row 5: Vessels & Thalassemia */}
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label>MAJOR VESSELS <b>(0–3)</b></label>
              <select
                className="select"
                value={form.ca}
                onChange={(e) => handleChange('ca', Number(e.target.value))}
              >
                <option value={0}>0 Vessels</option>
                <option value={1}>1 Vessel</option>
                <option value={2}>2 Vessels</option>
                <option value={3}>3 Vessels</option>
              </select>
            </div>
            <div className="field">
              <label>THALLIUM SCAN</label>
              <select
                className="select"
                value={form.thal}
                onChange={(e) => handleChange('thal', Number(e.target.value))}
              >
                <option value={3}>Normal Blood Flow</option>
                <option value={6}>Fixed Defect</option>
                <option value={7}>Reversible Defect</option>
              </select>
            </div>
          </div>

          {/* Row 6: Exercise Angina & Fasting Blood Sugar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label>EXERCISE ANGINA</label>
              <select
                className="select"
                value={form.exang}
                onChange={(e) => handleChange('exang', Number(e.target.value))}
              >
                <option value={0}>No</option>
                <option value={1}>Yes (Exercise Angina)</option>
              </select>
            </div>
            <div className="field">
              <label>FASTING SUGAR &gt; 120</label>
              <select
                className="select"
                value={form.fbs}
                onChange={(e) => handleChange('fbs', Number(e.target.value))}
              >
                <option value={0}>Normal (≤ 120)</option>
                <option value={1}>Elevated (&gt; 120)</option>
              </select>
            </div>
          </div>

          {/* Submit Run Bar */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="btn btn--primary flex-1 py-3 text-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" /> COMPUTING…
                </>
              ) : (
                <>▶ RUN INFERENCE</>
              )}
            </button>
            <button
              type="button"
              className="btn btn--outline"
              onClick={handleReset}
            >
              RESET
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono rounded">
              ⚠ {error}
            </div>
          )}
        </form>
      </section>

      {/* ==================== OUTPUT (RIGHT) ==================== */}
      <section className="output">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              className="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Hero Telemetry Card */}
              <div
                className={`result__hero panel panel--notch panel-pad ${
                  isHighRisk ? 'panel--alert' : 'panel--highlight'
                }`}
              >
                <div className="section-label">
                  <span>ESTIMATED CARDIOVASCULAR RISK</span>
                  <b>RANDOM FOREST</b>
                </div>

                <div className="flex items-baseline gap-2">
                  <div
                    className="result__time"
                    style={{ color: isHighRisk ? 'var(--red)' : 'var(--green)' }}
                  >
                    {probPercent.toFixed(1)}%
                  </div>
                </div>

                <div className="result__meta mt-1">
                  <span className={`badge ${isHighRisk ? 'badge--red' : 'badge--green'}`}>
                    {isHighRisk ? '● HIGH RISK (CLASS 1)' : '● LOW RISK (CLASS 0)'}
                  </span>
                </div>

                <p className="mt-3 text-xs font-mono text-gray-300 leading-relaxed border-t border-[var(--line)] pt-3">
                  {result.interpretation}
                </p>
              </div>

              {/* Patient Key Telemetry Readouts */}
              <div className="stat-grid">
                <StatReadout
                  label="Blood Pressure"
                  value={form.trestbps}
                  unit="mmHg"
                  accent={form.trestbps >= 140 ? 'var(--red)' : 'var(--text)'}
                  subtitle={bpCategory}
                  animate={false}
                />
                <StatReadout
                  label="Max Heart Rate"
                  value={form.thalach}
                  unit="bpm"
                  accent={form.thalach < 120 ? 'var(--amber)' : 'var(--text)'}
                  subtitle={`${hrPercent}% target`}
                  animate={false}
                />
                <StatReadout
                  label="ST Depression"
                  value={form.oldpeak}
                  unit="mm"
                  accent={form.oldpeak >= 1.5 ? 'var(--red)' : 'var(--green)'}
                  subtitle={form.oldpeak >= 1.0 ? 'Ischemic Shift' : 'Normal'}
                  animate={false}
                />
                <StatReadout
                  label="Fluoroscopy Ca"
                  value={form.ca}
                  unit="vessels"
                  accent={form.ca > 0 ? 'var(--red)' : 'var(--cyan)'}
                  subtitle={form.ca > 0 ? 'Calcified' : 'Clear'}
                  animate={false}
                />
              </div>

              {/* Live SHAP Waterfall Attributions */}
              {shapData && shapData.contributions && (
                <div className="panel panel-pad">
                  <div className="section-label">
                    <span>SHAP ATTRIBUTION FACTORS</span>
                    <b>MARGINAL INFLUENCE</b>
                  </div>
                  <div className="space-y-2 mt-2">
                    {shapData.contributions.slice(0, 5).map((c: any, idx: number) => {
                      const isPos = c.shap_value > 0;
                      const absVal = Math.abs(c.shap_value);
                      const pct = Math.min(Math.round((absVal / 0.15) * 100), 100);
                      const cleanName = c.feature.replace(/^(num__|cat__)/, '');
                      return (
                        <motion.div
                          key={idx}
                          className="shap-bar"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <span className="shap-bar__label" title={cleanName}>
                            {cleanName}
                          </span>
                          <div className="shap-bar__track">
                            <div
                              className={`shap-bar__fill ${
                                isPos ? 'shap-bar__fill--pos' : 'shap-bar__fill--neg'
                              }`}
                              style={{ width: `${Math.max(pct, 12)}%` }}
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
                  <p className="text-[10px] font-mono text-gray-500 mt-2">
                    Red indicates features pushing risk higher; green indicates protective factors.
                  </p>
                </div>
              )}

              {/* Action: Consult Medical AI */}
              <button
                type="button"
                className="btn btn--cyan w-full py-3"
                onClick={() =>
                  onConsultAI(
                    `Patient Profile (${form.age}yo ${form.sex === 1 ? 'Male' : 'Female'}): Resting BP ${
                      form.trestbps
                    } mmHg, Cholesterol ${form.chol} mg/dl, ST depression ${
                      form.oldpeak
                    } mm, Max HR ${form.thalach} bpm. The model predicted ${probPercent.toFixed(
                      1
                    )}% risk (${isHighRisk ? 'Class 1 - Risk Present' : 'Class 0 - Low Risk'}). What lifestyle interventions and guideline tests are recommended?`
                  )
                }
              >
                ASK MEDICAL AI ABOUT THIS PATIENT CASE →
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="empty panel panel--notch"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="empty__grid" />
              <div className="empty__inner">
                <span className="empty__mark">◎</span>
                <p className="empty__title">TELEMETRY STANDBY</p>
                <p className="empty__sub">
                  Select a preset patient profile or customize clinical biomarkers, then click{' '}
                  <strong className="text-white">RUN INFERENCE</strong>.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
