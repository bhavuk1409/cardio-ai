import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { PredictionInput, PredictionResponse, SAMPLE_RECORDS } from '../types';
import { StatReadout } from '../components/StatReadout';

const EMPTY: PredictionInput = {
  age: 55,
  sex: 1,
  cp: 4,
  trestbps: 140,
  chol: 250,
  fbs: 0,
  restecg: 1,
  thalach: 145,
  exang: 1,
  oldpeak: 2.2,
  slope: 2,
  ca: 1,
  thal: 7,
};

export default function RiskPrediction() {
  const navigate = useNavigate();
  const [form, setForm] = useState<PredictionInput>(EMPTY);
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

      // Concurrently fetch SHAP explanation for the patient
      try {
        const shap = await api.explain({ input_data: form, top_k: 6 });
        setShapData(shap);
      } catch {
        // Non-blocking if SHAP has an issue
      }
    } catch (err: any) {
      setError(err.message || 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setForm(EMPTY);
    setResult(null);
    setShapData(null);
    setError(null);
  }

  const probPercent = result && result.probability_positive_class !== null
    ? result.probability_positive_class * 100
    : result?.predicted_class === 1 ? 95 : 5;

  const isHighRisk = result?.predicted_class === 1;

  // Derived cardiovascular indicators
  const maxTargetHr = 220 - form.age;
  const hrPercent = Math.round((form.thalach / maxTargetHr) * 100);
  const bpCategory =
    form.trestbps < 120 ? 'Optimal' : form.trestbps <= 129 ? 'Elevated' : form.trestbps <= 139 ? 'Stage 1 HTN' : 'Stage 2 HTN';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="eyebrow">MILESTONE 4 · TRAINED-MODEL DEMONSTRATION</div>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-wider text-white mt-1">
          CARDIOVASCULAR RISK TELEMETRY CONSOLE
        </h1>
        <p className="mt-1 text-xs font-mono text-gray-400">
          Supervised inference via Random Forest classifier with continuous probabilistic outputs and real-time SHAP attribution.
        </p>
      </div>

      <div className="layout">
        {/* ==================== CONSOLE (LEFT) ==================== */}
        <section className="console">
          {/* Preset Clinical Profiles */}
          <div className="panel panel-pad">
            <div className="section-label">
              <span>PRELOAD CLINICAL CASE</span>
              <b>VALIDATION SAMPLES</b>
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
                      {isPos ? 'CLASS 1' : 'CLASS 0'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handlePredict} className="panel panel-pad space-y-5">
            <div className="section-label">
              <span>PATIENT CLINICAL BIOMARKERS</span>
              <b>13 UCI FEATURES</b>
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <label>AGE <b>YEARS</b></label>
                <input
                  type="number"
                  className="input"
                  min={18}
                  max={100}
                  value={form.age}
                  onChange={(e) => handleChange('age', Number(e.target.value))}
                  required
                />
              </div>

              <div className="field">
                <label>BIOLOGICAL SEX <b>GENDER</b></label>
                <select
                  className="select"
                  value={form.sex}
                  onChange={(e) => handleChange('sex', Number(e.target.value))}
                >
                  <option value={1}>1 — Male</option>
                  <option value={0}>0 — Female</option>
                </select>
              </div>
            </div>

            {/* Hemodynamics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <label>RESTING BP <b>MM HG</b></label>
                <input
                  type="number"
                  className="input"
                  min={80}
                  max={240}
                  value={form.trestbps}
                  onChange={(e) => handleChange('trestbps', Number(e.target.value))}
                  required
                />
              </div>

              <div className="field">
                <label>SERUM CHOLESTEROL <b>MG/DL</b></label>
                <input
                  type="number"
                  className="input"
                  min={100}
                  max={600}
                  value={form.chol}
                  onChange={(e) => handleChange('chol', Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Cardiac Symptoms & Stress Telemetry */}
            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <label>CHEST PAIN TYPE <b>CP</b></label>
                <select
                  className="select"
                  value={form.cp}
                  onChange={(e) => handleChange('cp', Number(e.target.value))}
                >
                  <option value={1}>1 — Typical Angina</option>
                  <option value={2}>2 — Atypical Angina</option>
                  <option value={3}>3 — Non-Anginal Pain</option>
                  <option value={4}>4 — Asymptomatic (High Risk)</option>
                </select>
              </div>

              <div className="field">
                <label>FASTING BLOOD SUGAR <b>FBS &gt; 120</b></label>
                <select
                  className="select"
                  value={form.fbs}
                  onChange={(e) => handleChange('fbs', Number(e.target.value))}
                >
                  <option value={0}>0 — Normal (≤ 120 mg/dl)</option>
                  <option value={1}>1 — Elevated (&gt; 120 mg/dl)</option>
                </select>
              </div>
            </div>

            {/* Stress Test ECG biomarkers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <label>MAX HEART RATE <b>THALACH (BPM)</b></label>
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

              <div className="field">
                <label>EXERCISE ANGINA <b>EXANG</b></label>
                <select
                  className="select"
                  value={form.exang}
                  onChange={(e) => handleChange('exang', Number(e.target.value))}
                >
                  <option value={0}>0 — No Exercise Angina</option>
                  <option value={1}>1 — Exercise-Induced Angina</option>
                </select>
              </div>
            </div>

            {/* ST Depression & Slope */}
            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <label>ST DEPRESSION <b>OLDPEAK (MM)</b></label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  min={0}
                  max={8}
                  value={form.oldpeak}
                  onChange={(e) => handleChange('oldpeak', Number(e.target.value))}
                  required
                />
              </div>

              <div className="field">
                <label>PEAK ST SLOPE <b>SLOPE</b></label>
                <select
                  className="select"
                  value={form.slope}
                  onChange={(e) => handleChange('slope', Number(e.target.value))}
                >
                  <option value={1}>1 — Upsloping</option>
                  <option value={2}>2 — Flat (Ischemia Risk)</option>
                  <option value={3}>3 — Downsloping</option>
                </select>
              </div>
            </div>

            {/* Fluoroscopy & Thallium Scan */}
            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <label>MAJOR VESSELS <b>CA (0–3)</b></label>
                <select
                  className="select"
                  value={form.ca}
                  onChange={(e) => handleChange('ca', Number(e.target.value))}
                >
                  <option value={0}>0 Major Vessels Colored</option>
                  <option value={1}>1 Major Vessel Colored</option>
                  <option value={2}>2 Major Vessels Colored</option>
                  <option value={3}>3 Major Vessels Colored</option>
                </select>
              </div>

              <div className="field">
                <label>THALLIUM SCAN <b>THAL</b></label>
                <select
                  className="select"
                  value={form.thal}
                  onChange={(e) => handleChange('thal', Number(e.target.value))}
                >
                  <option value={3}>3 — Normal Blood Flow</option>
                  <option value={6}>6 — Fixed Defect</option>
                  <option value={7}>7 — Reversible Defect</option>
                </select>
              </div>
            </div>

            {/* Resting ECG */}
            <div className="field">
              <label>RESTING ECG RESULT <b>RESTECG</b></label>
              <select
                className="select"
                value={form.restecg}
                onChange={(e) => handleChange('restecg', Number(e.target.value))}
              >
                <option value={0}>0 — Normal</option>
                <option value={1}>1 — ST-T Wave Abnormality</option>
                <option value={2}>2 — Probable/Definite LV Hypertrophy</option>
              </select>
            </div>

            {/* Submit Bar */}
            <div className="pt-3 flex items-center gap-3">
              <button
                type="submit"
                className="btn btn--primary flex-1 py-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> COMPUTING INFERENCE…
                  </>
                ) : (
                  <>▶ RUN CLINICAL INFERENCE</>
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Hero Telemetry Card */}
                <div
                  className={`result__hero panel panel--notch panel-pad ${
                    isHighRisk ? 'panel--alert' : 'panel--highlight'
                  }`}
                >
                  <div className="section-label">
                    <span>PREDICTED RISK PROBABILITY</span>
                    <b>MODEL: {result.model_name.toUpperCase()}</b>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <div
                      className="result__time"
                      style={{ color: isHighRisk ? 'var(--red)' : 'var(--green)' }}
                    >
                      {probPercent.toFixed(1)}%
                    </div>
                    <span className="text-xs font-mono text-gray-400">ESTIMATED PROBABILITY</span>
                  </div>

                  <div className="result__meta mt-2">
                    <span
                      className={`badge ${isHighRisk ? 'badge--red' : 'badge--green'}`}
                    >
                      {isHighRisk
                        ? '● RISK DETECTED — CLASS 1'
                        : '● NO DISEASE DETECTED — CLASS 0'}
                    </span>
                    <span className="result__spread">
                      DATASET THRESHOLD: 50.0%
                    </span>
                  </div>

                  <p className="mt-3 text-xs font-mono text-gray-300 leading-relaxed border-t border-[var(--line)] pt-3">
                    {result.interpretation}
                  </p>
                </div>

                {/* Patient Biomarker Summary Readouts */}
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
                    subtitle={`${hrPercent}% of target`}
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
                    subtitle={form.ca > 0 ? 'Plaque Calcification' : 'Clear'}
                    animate={false}
                  />
                </div>

                {/* Live SHAP Waterfall Attributions */}
                {shapData && shapData.contributions && (
                  <div className="panel panel-pad">
                    <div className="section-label">
                      <span>PATIENT SHAP ATTRIBUTION FACTORS</span>
                      <b>MARGINAL CONTRIBUTIONS</b>
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
                            transition={{ delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
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
                    <p className="text-[10.5px] font-mono text-gray-500 mt-3">
                      Red values indicate features pushing risk upwards; green values indicate protective factors.
                    </p>
                  </div>
                )}

                {/* Medical Assistant Call-To-Action */}
                <div className="panel panel-pad bg-purple-950/20 border-purple-800/40">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-display font-semibold text-sm text-purple-200">
                        Context-Aware Medical Retrieval (RAG)
                      </div>
                      <div className="text-xs font-mono text-purple-300/70 mt-0.5">
                        Consult the Groq AI Assistant regarding this patient's profile and guideline recommendations.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn--cyan btn--sm"
                      onClick={() =>
                        navigate('/assistant', {
                          state: {
                            prefilledQuery: `Patient Profile (${form.age}yo ${
                              form.sex === 1 ? 'Male' : 'Female'
                            }): Resting BP ${form.trestbps} mmHg, Cholesterol ${
                              form.chol
                            } mg/dl, ST depression ${form.oldpeak} mm, Max HR ${
                              form.thalach
                            } bpm. The model predicted ${probPercent.toFixed(
                              1
                            )}% cardiovascular risk (${
                              isHighRisk
                                ? 'Class 1 - Risk Detected'
                                : 'Class 0 - Low Risk'
                            }). What clinical lifestyle interventions and guideline diagnostic tests are recommended?`,
                          },
                        })
                      }
                    >
                      QUERY MEDICAL AI →
                    </button>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="text-[11px] font-mono text-gray-500 bg-black/30 p-3 rounded border border-[var(--line)]">
                  {result.disclaimer}
                </div>
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
                    Configure patient parameters or select a validation sample profile and click{' '}
                    <strong className="text-white">RUN CLINICAL INFERENCE</strong> to evaluate cardiovascular risk.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
