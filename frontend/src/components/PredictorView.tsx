import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { PredictionInput, PredictionResponse, SAMPLE_RECORDS } from '../types';
import { StatReadout } from './StatReadout';
import { CustomSelect } from './CustomSelect';
import { downloadClinicalReportPdf } from '../utils/generatePdf';
import { Download } from 'lucide-react';

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

function formatFeatureName(raw: string): string {
  const clean = raw.replace(/^(num__|cat__)/, '');
  const map: Record<string, string> = {
    'thal_7.0': 'Reversible Defect (Thal)',
    'thal_3.0': 'Normal Flow (Thal)',
    'thal_6.0': 'Fixed Defect (Thal)',
    'thal': 'Thallium Scan',
    'ca': 'Major Vessels (0–3)',
    'cp_4.0': 'Asymptomatic Angina',
    'cp_1.0': 'Typical Angina',
    'cp_2.0': 'Atypical Angina',
    'cp_3.0': 'Non-Anginal Pain',
    'cp': 'Chest Pain Type',
    'oldpeak': 'ST Depression (mm)',
    'thalach': 'Max Heart Rate (bpm)',
    'trestbps': 'Resting BP (mmHg)',
    'chol': 'Serum Cholesterol',
    'age': 'Patient Age',
    'sex': 'Biological Sex',
    'sex_1': 'Male Sex',
    'sex_0': 'Female Sex',
    'exang': 'Exercise Angina',
    'exang_1': 'Exercise Angina Present',
    'exang_0': 'No Exercise Angina',
    'slope_2.0': 'Flat ST Slope',
    'slope_1.0': 'Upsloping ST Slope',
    'slope_3.0': 'Downsloping ST Slope',
    'slope': 'Peak ST Slope',
    'fbs': 'Fasting Blood Sugar',
    'fbs_1': 'Fasting Sugar > 120',
    'fbs_0': 'Fasting Sugar ≤ 120',
    'restecg_2.0': 'LV Hypertrophy (ECG)',
    'restecg_1.0': 'ST-T Abnormality (ECG)',
    'restecg_0.0': 'Normal Resting ECG',
    'restecg': 'Resting ECG',
  };
  return map[clean] || clean.replace(/_/g, ' ').replace(/\.0$/, '');
}

export function PredictorView({ onConsultAI }: Props) {
  const [form, setForm] = useState<PredictionInput>(DEFAULT_PATIENT);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [shapData, setShapData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<string>('');
  const [pdfGenerating, setPdfGenerating] = useState(false);

  async function handleDownloadPdf() {
    if (!result || pdfGenerating) return;
    setPdfGenerating(true);
    try {
      await downloadClinicalReportPdf(form, result, shapData);
    } finally {
      setPdfGenerating(false);
    }
  }

  function handleChange(key: keyof PredictionInput, val: number) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setSelectedSample('');
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
    if (loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShapData(null);

    const minAnimationWait = new Promise((resolve) => setTimeout(resolve, 550));

    try {
      const [pred, shap] = await Promise.all([
        api.predict(form),
        api.explain({ input_data: form, top_k: 5 }).catch((err) => {
          console.warn('SHAP non-blocking warning:', err);
          return null;
        }),
        minAnimationWait,
      ]);

      // Reveal everything simultaneously ("ek sath")
      setShapData(shap);
      setResult(pred);
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
    setSelectedSample('');
  }

  const probPercent =
    result && result.probability_positive_class !== null
      ? result.probability_positive_class * 100
      : result?.predicted_class === 1 ? 95 : 5;

  const isHighRisk = result?.predicted_class === 1;

  const maxTargetHr = 220 - form.age;
  const hrPercent = Math.round((form.thalach / maxTargetHr) * 100);
  const bpCategory =
    form.trestbps < 120 ? 'Optimal'
    : form.trestbps <= 129 ? 'Elevated'
    : form.trestbps <= 139 ? 'Stage 1'
    : 'Stage 2';

  const PRESET_LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div className="layout" style={{ height: '100%' }}>
      {/* ── CONSOLE (LEFT) ── */}
      <section className="console" style={{ height: '100%', minHeight: 0 }}>
        <form onSubmit={handlePredict} className="panel panel-pad">

          {/* Preset row */}
          <div style={{ marginBottom: 10 }}>
            <p className="eyebrow" style={{ marginBottom: 6 }}>Case Presets</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {SAMPLE_RECORDS.map((s, i) => {
                const isPos = s.risk === 'HIGH';
                const sel = selectedSample === String(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => loadSample(i)}
                    style={{
                      flex: 1,
                      padding: '5px 4px',
                      background: sel ? 'var(--text)' : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${sel ? 'var(--text)' : 'var(--line)'}`,
                      borderRadius: 4,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10.5,
                      letterSpacing: '0.08em',
                      color: sel ? '#08090b' : 'var(--muted)',
                      cursor: 'pointer',
                      transition: 'all 0.18s var(--ease)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 12 }}>
                      {PRESET_LABELS[i]}
                    </span>
                    <span style={{
                      fontSize: 8.5,
                      color: isPos ? 'var(--red)' : 'var(--green)',
                      opacity: 0.85,
                    }}>
                      {isPos ? '▲ HIGH' : '▼ LOW'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Biomarker inputs — compact 2-col grid */}
          <p className="eyebrow" style={{ marginBottom: 6 }}>Biomarkers</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>

            <div className="field">
              <label>Age <b>yrs</b></label>
              <input type="number" className="input" min={20} max={90}
                value={form.age} onChange={(e) => handleChange('age', Number(e.target.value))} required />
            </div>
            <div className="field">
              <label>Sex</label>
              <CustomSelect value={form.sex} onChange={(v) => handleChange('sex', Number(v))}
                options={[{ value: 1, label: 'Male' }, { value: 0, label: 'Female' }]} />
            </div>

            <div className="field">
              <label>Resting BP <b>mmHg</b></label>
              <input type="number" className="input" min={80} max={220}
                value={form.trestbps} onChange={(e) => handleChange('trestbps', Number(e.target.value))} required />
            </div>
            <div className="field">
              <label>Cholesterol <b>mg/dL</b></label>
              <input type="number" className="input" min={100} max={500}
                value={form.chol} onChange={(e) => handleChange('chol', Number(e.target.value))} required />
            </div>

            <div className="field">
              <label>Chest Pain</label>
              <CustomSelect value={form.cp} onChange={(v) => handleChange('cp', Number(v))}
                options={[
                  { value: 1, label: 'Typical Angina' },
                  { value: 2, label: 'Atypical Angina' },
                  { value: 3, label: 'Non-Anginal' },
                  { value: 4, label: 'Asymptomatic', badge: 'HIGH', badgeColor: 'red' },
                ]} />
            </div>
            <div className="field">
              <label>Max HR <b>bpm</b></label>
              <input type="number" className="input" min={60} max={220}
                value={form.thalach} onChange={(e) => handleChange('thalach', Number(e.target.value))} required />
            </div>

            <div className="field">
              <label>ST Depression <b>mm</b></label>
              <input type="number" step="0.1" className="input" min={0} max={6}
                value={form.oldpeak} onChange={(e) => handleChange('oldpeak', Number(e.target.value))} required />
            </div>
            <div className="field">
              <label>ST Slope</label>
              <CustomSelect value={form.slope} onChange={(v) => handleChange('slope', Number(v))}
                options={[
                  { value: 1, label: 'Upsloping' },
                  { value: 2, label: 'Flat', badge: 'WARN', badgeColor: 'amber' },
                  { value: 3, label: 'Downsloping' },
                ]} />
            </div>

            <div className="field">
              <label>Major Vessels</label>
              <CustomSelect value={form.ca} onChange={(v) => handleChange('ca', Number(v))}
                options={[
                  { value: 0, label: '0' },
                  { value: 1, label: '1', badge: '●', badgeColor: 'red' },
                  { value: 2, label: '2', badge: '●', badgeColor: 'red' },
                  { value: 3, label: '3', badge: '●', badgeColor: 'red' },
                ]} />
            </div>
            <div className="field">
              <label>Thal Scan</label>
              <CustomSelect value={form.thal} onChange={(v) => handleChange('thal', Number(v))}
                options={[
                  { value: 3, label: 'Normal', badge: 'OK', badgeColor: 'green' },
                  { value: 6, label: 'Fixed Defect', badge: 'FIXED', badgeColor: 'amber' },
                  { value: 7, label: 'Reversible', badge: 'ISCH', badgeColor: 'red' },
                ]} />
            </div>

            <div className="field">
              <label>Exercise Angina</label>
              <CustomSelect value={form.exang} onChange={(v) => handleChange('exang', Number(v))}
                options={[
                  { value: 0, label: 'No' },
                  { value: 1, label: 'Yes', badge: 'RISK', badgeColor: 'red' },
                ]} />
            </div>
            <div className="field">
              <label>Fasting BG</label>
              <CustomSelect value={form.fbs} onChange={(v) => handleChange('fbs', Number(v))}
                options={[
                  { value: 0, label: '≤ 120 mg/dL' },
                  { value: 1, label: '> 120 mg/dL', badge: 'HIGH', badgeColor: 'amber' },
                ]} />
            </div>
          </div>

          {/* Run bar */}
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
              style={{ flex: 1, letterSpacing: '0.12em', padding: '9px 18px', fontSize: 12 }}
            >
              {loading ? <><span className="spinner" /> COMPUTING…</> : <>▶ RUN INFERENCE</>}
            </button>
            <button type="button" className="btn btn--outline" onClick={handleReset}
              style={{ fontSize: 11, padding: '9px 14px' }}>
              RESET
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: 10, padding: '10px 14px',
              background: 'rgba(225,6,0,0.08)',
              border: '1px solid rgba(225,6,0,0.35)',
              borderRadius: 4,
              fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--red)',
            }}>
              ⚠ {error}
            </div>
          )}
        </form>
      </section>

      {/* ── OUTPUT (RIGHT) ── */}
      <section className="output" style={{ height: '100%', minHeight: 0 }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              className="empty panel panel--notch"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="empty__grid" />
              <div className="empty__inner">
                {/* Fast Blinking / Beating Cardiac Pulse Logo */}
                <svg
                  className="cardiac-beat--fast"
                  viewBox="0 0 40 40"
                  style={{ width: 56, height: 56, margin: '0 auto 16px', display: 'block' }}
                  aria-hidden="true"
                >
                  <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinejoin="round" />
                  <polygon points="20,9 31,20 20,31 9,20" fill="none" stroke="var(--red)" strokeWidth="0.8" strokeLinejoin="round" opacity="0.4" />
                  <polyline points="7,20 12,20 14.5,12.5 17,27.5 20,11 23,27.5 25.5,20 33,20"
                    fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="20" cy="11" r="1.6" fill="var(--red)" />
                </svg>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                  <div className="chat-dots">
                    <span className="chat-dot" />
                    <span className="chat-dot" />
                    <span className="chat-dot" />
                  </div>
                  <p className="empty__title" style={{ margin: 0, letterSpacing: '0.14em', color: '#fff' }}>
                    RUNNING INFERENCE…
                  </p>
                </div>
                <p className="empty__sub">
                  Evaluating biomarkers and calculating SHAP contributions…
                </p>
              </div>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              className="result"
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Hero risk card */}
              <div className={`result__hero panel panel--notch ${isHighRisk ? 'panel--alert' : 'panel--highlight'}`}>
                <div className="section-label" style={{ marginBottom: 4 }}>
                  <span>CARDIAC RISK PROJECTION</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`badge ${isHighRisk ? 'badge--red' : 'badge--green'}`} style={{ fontSize: 9 }}>
                      {isHighRisk ? '● HIGH CARDIAC RISK' : '● LOW CARDIAC RISK'}
                    </span>
                    <span className="badge badge--approx" style={{ fontSize: 8.5 }}>Random Forest</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div className="result__time" style={{ color: isHighRisk ? 'var(--red)' : 'var(--green)' }}>
                    {probPercent.toFixed(1)}%
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                    {isHighRisk ? 'Class 1 (Disease Present)' : 'Class 0 (Normal Limits)'}
                  </span>
                </div>

                <p style={{
                  marginTop: 6, fontSize: 11, fontFamily: 'var(--font-body)',
                  color: 'var(--muted)', lineHeight: 1.5,
                  borderTop: '1px solid var(--line)', paddingTop: 6,
                }}>
                  {isHighRisk
                    ? 'Pathological risk markers detected — significant ischemic ST shifts and coronary vessel calcification.'
                    : 'Low clinical probability — normal ST recovery, preserved exercise tolerance, and clear coronary vessels.'}
                </p>
              </div>

              {/* Vitals readouts */}
              <div className="stat-grid">
                <StatReadout
                  label="Blood Pressure"
                  value={form.trestbps}
                  format={(n) => `${Math.round(n)}`}
                  unit="mmHg"
                  accent={form.trestbps >= 140 ? 'var(--red)' : 'var(--text)'}
                  subtitle={bpCategory}
                  animate={false}
                />
                <StatReadout
                  label="Max Heart Rate"
                  value={form.thalach}
                  format={(n) => `${Math.round(n)}`}
                  unit="bpm"
                  accent={form.thalach < 120 ? 'var(--amber)' : 'var(--text)'}
                  subtitle={`${hrPercent}% target`}
                  animate={false}
                />
                <StatReadout
                  label="ST Depression"
                  value={form.oldpeak}
                  format={(n) => n.toFixed(1)}
                  unit="mm"
                  accent={form.oldpeak >= 1.5 ? 'var(--red)' : 'var(--green)'}
                  subtitle={form.oldpeak >= 1.0 ? 'Ischemic' : 'Normal'}
                  animate={false}
                />
                <StatReadout
                  label="Major Vessels"
                  value={form.ca}
                  format={(n) => `${Math.round(n)}`}
                  unit="/ 3"
                  accent={form.ca > 0 ? 'var(--red)' : 'var(--text)'}
                  subtitle={form.ca > 0 ? 'Calcified' : 'Clear'}
                  animate={false}
                />
              </div>

              {/* SHAP attribution */}
              {shapData?.contributions && (
                <div className="panel panel-pad" style={{ padding: '10px 14px' }}>
                  <div className="section-label" style={{ marginBottom: 6 }}>
                    <span>KEY FEATURE CONTRIBUTIONS</span>
                    <b>SHAP MARGINAL Δ</b>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {shapData.contributions.slice(0, 5).map((c: any, idx: number) => {
                      const isPos = c.shap_value > 0;
                      const absVal = Math.abs(c.shap_value);
                      const pct = Math.min(Math.round((absVal / 0.12) * 100), 100);
                      const formattedName = formatFeatureName(c.feature);
                      return (
                        <motion.div key={idx} className="shap-bar"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <span className="shap-bar__label" title={formattedName}>{formattedName}</span>
                          <div className="shap-bar__track">
                            <div className={`shap-bar__fill ${isPos ? 'shap-bar__fill--pos' : 'shap-bar__fill--neg'}`}
                              style={{ width: `${Math.max(pct, 8)}%` }} />
                          </div>
                          <span className="shap-bar__val" style={{ color: isPos ? 'var(--red)' : 'var(--green)' }}>
                            {isPos ? '+' : ''}{c.shap_value.toFixed(3)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions: Direct PDF Download & Copilot Consultation */}
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                <button
                  type="button"
                  className="btn btn--outline"
                  disabled={pdfGenerating}
                  style={{
                    flex: 1,
                    letterSpacing: '0.06em',
                    padding: '8px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    borderColor: 'rgba(255, 255, 255, 0.22)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    gap: 6,
                  }}
                  onClick={handleDownloadPdf}
                  title="Directly download clinical risk report and referral as PDF"
                >
                  {pdfGenerating ? (
                    <>
                      <span className="spinner" style={{ width: 11, height: 11, borderWidth: 1.5 }} />
                      <span>GENERATING PDF…</span>
                    </>
                  ) : (
                    <>
                      <Download size={13} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                      <span>DOWNLOAD PDF</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn--primary"
                  style={{
                    flex: 1.25,
                    letterSpacing: '0.06em',
                    padding: '8px 12px',
                    fontSize: 11,
                    gap: 6,
                  }}
                  onClick={() =>
                    onConsultAI(
                      `Patient (${form.age}yo ${form.sex === 1 ? 'M' : 'F'}): BP ${form.trestbps} mmHg, Chol ${form.chol} mg/dL, ST depression ${form.oldpeak} mm, Max HR ${form.thalach} bpm. Risk score ${probPercent.toFixed(1)}% (${isHighRisk ? 'elevated' : 'low risk'}). What interventions and guideline workup are recommended?`
                    )
                  }
                >
                  <span style={{ fontSize: 12 }}>◈</span>
                  <span>ASK CARDIOLOGY COPILOT →</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" className="empty panel panel--notch"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="empty__grid" />
              <div className="empty__inner">
                {/* Cardiac Beating Pulse Logo */}
                <svg
                  className="cardiac-beat"
                  viewBox="0 0 40 40"
                  style={{ width: 52, height: 52, margin: '0 auto 16px', display: 'block' }}
                  aria-hidden="true"
                >
                  <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="var(--red)" strokeWidth="1.6" strokeLinejoin="round" />
                  <polygon points="20,9 31,20 20,31 9,20" fill="none" stroke="var(--red)" strokeWidth="0.6" strokeLinejoin="round" opacity="0.3" />
                  <polyline points="7,20 12,20 14.5,12.5 17,27.5 20,11 23,27.5 25.5,20 33,20"
                    fill="none" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="20" cy="11" r="1.4" fill="var(--red)" />
                </svg>
                <p className="empty__title">AWAITING PATIENT DATA</p>
                <p className="empty__sub">
                  Select a preset or enter biomarkers, then run inference to see the risk prediction.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
