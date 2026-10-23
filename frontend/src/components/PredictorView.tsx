import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { PredictionInput, PredictionResponse, SAMPLE_RECORDS } from '../types';
import { StatReadout } from './StatReadout';
import { CustomSelect } from './CustomSelect';

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
              <CustomSelect
                value={form.sex}
                onChange={(val) => handleChange('sex', Number(val))}
                options={[
                  { value: 1, label: 'Male' },
                  { value: 0, label: 'Female' },
                ]}
              />
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
              <CustomSelect
                value={form.cp}
                onChange={(val) => handleChange('cp', Number(val))}
                options={[
                  { value: 1, label: '1 — Typical Angina' },
                  { value: 2, label: '2 — Atypical Angina' },
                  { value: 3, label: '3 — Non-Anginal' },
                  { value: 4, label: '4 — Asymptomatic', badge: 'HIGH RISK', badgeColor: 'red' },
                ]}
              />
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
              <CustomSelect
                value={form.slope}
                onChange={(val) => handleChange('slope', Number(val))}
                options={[
                  { value: 1, label: '1 — Upsloping' },
                  { value: 2, label: '2 — Flat', badge: 'ISCHEMIC', badgeColor: 'amber' },
                  { value: 3, label: '3 — Downsloping' },
                ]}
              />
            </div>
          </div>

          {/* Row 5: Vessels & Thalassemia */}
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label>MAJOR VESSELS <b>(0–3)</b></label>
              <CustomSelect
                value={form.ca}
                onChange={(val) => handleChange('ca', Number(val))}
                options={[
                  { value: 0, label: '0 Vessels' },
                  { value: 1, label: '1 Vessel', badge: 'PLAQUE', badgeColor: 'red' },
                  { value: 2, label: '2 Vessels', badge: 'PLAQUE', badgeColor: 'red' },
                  { value: 3, label: '3 Vessels', badge: 'PLAQUE', badgeColor: 'red' },
                ]}
              />
            </div>
            <div className="field">
              <label>THALLIUM SCAN</label>
              <CustomSelect
                value={form.thal}
                onChange={(val) => handleChange('thal', Number(val))}
                options={[
                  { value: 3, label: 'Normal Flow', badge: 'NORMAL', badgeColor: 'green' },
                  { value: 6, label: 'Fixed Defect', badge: 'DEFECT', badgeColor: 'amber' },
                  { value: 7, label: 'Reversible Defect', badge: 'ISCHEMIA', badgeColor: 'red' },
                ]}
              />
            </div>
          </div>

          {/* Row 6: Exercise Angina & Fasting Blood Sugar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label>EXERCISE ANGINA</label>
              <CustomSelect
                value={form.exang}
                onChange={(val) => handleChange('exang', Number(val))}
                options={[
                  { value: 0, label: 'No' },
                  { value: 1, label: 'Yes (Angina)', badge: 'ISCHEMIC', badgeColor: 'red' },
                ]}
              />
            </div>
            <div className="field">
              <label>FASTING SUGAR &gt; 120</label>
              <CustomSelect
                value={form.fbs}
                onChange={(val) => handleChange('fbs', Number(val))}
                options={[
                  { value: 0, label: 'Normal (≤ 120)' },
                  { value: 1, label: 'Elevated (> 120)', badge: 'ELEVATED', badgeColor: 'amber' },
                ]}
              />
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
                <svg
                  className="empty__mark mark"
                  viewBox="0 0 32 32"
                  style={{ width: 52, height: 52, margin: '0 auto 16px', display: 'block' }}
                  aria-hidden="true"
                >
                  <circle cx="16" cy="16" r="10" fill="none" stroke="var(--red)" strokeWidth="3" />
                  <circle cx="16" cy="16" r="4" fill="none" stroke="var(--text)" strokeWidth="2" />
                  <g stroke="var(--text)" strokeWidth="1.4" strokeLinecap="round">
                    <line x1="16" y1="6" x2="16" y2="9.5" />
                    <line x1="16" y1="22.5" x2="16" y2="26" />
                    <line x1="6" y1="16" x2="9.5" y2="16" />
                    <line x1="22.5" y1="16" x2="26" y2="16" />
                  </g>
                </svg>
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
