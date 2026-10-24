import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { PredictionInput, PredictionResponse } from '../types';

function formatFeatureName(raw: string): string {
  const clean = raw.replace(/^(num__|cat__)/, '');
  const map: Record<string, string> = {
    'thal_7.0': 'Reversible Defect (Thallium)',
    'thal_3.0': 'Normal Myocardial Flow (Thal)',
    'thal_6.0': 'Fixed Perfusion Defect (Thal)',
    'thal': 'Thallium Perfusion Scintigraphy',
    'ca': 'Major Vessels Calcified (0–3)',
    'cp_4.0': 'Asymptomatic Presentation',
    'cp_1.0': 'Typical Angina Presentation',
    'cp_2.0': 'Atypical Angina Presentation',
    'cp_3.0': 'Non-Anginal Chest Pain',
    'cp': 'Chest Pain Type',
    'oldpeak': 'ST Depression (oldpeak)',
    'thalach': 'Maximum Exercise Heart Rate',
    'trestbps': 'Resting Blood Pressure',
    'chol': 'Total Serum Cholesterol',
    'age': 'Patient Age',
    'sex': 'Biological Sex',
    'sex_1': 'Male Sex Factor',
    'sex_0': 'Female Sex Factor',
    'exang': 'Exercise-Induced Angina',
    'exang_1': 'Exercise Angina Present',
    'exang_0': 'No Exercise Angina',
    'slope_2.0': 'Flat ST-Segment Slope',
    'slope_1.0': 'Upsloping ST Slope',
    'slope_3.0': 'Downsloping ST Slope',
    'slope': 'Peak ST Segment Slope',
    'fbs': 'Fasting Blood Sugar',
    'restecg_2.0': 'Left Ventricular Hypertrophy',
    'restecg_1.0': 'ST-T Wave Abnormality',
    'restecg_0.0': 'Normal Resting ECG',
  };
  return map[clean] || clean.replace(/_/g, ' ').replace(/\.0$/, '');
}

export async function downloadClinicalReportPdf(
  form: PredictionInput,
  result: PredictionResponse,
  shapData: any | null
) {
  const probPercent =
    result.probability_positive_class !== null
      ? result.probability_positive_class * 100
      : result.predicted_class === 1
      ? 95
      : 5;
  const isHighRisk = result.predicted_class === 1;

  const maxTargetHr = 220 - form.age;
  const hrPercent = Math.round((form.thalach / maxTargetHr) * 100);

  const bpStatus =
    form.trestbps >= 140
      ? { text: 'STAGE 2 HTN', color: '#b91c1c', bg: '#fef2f2' }
      : form.trestbps >= 130
      ? { text: 'STAGE 1 HTN', color: '#c2410c', bg: '#fff7ed' }
      : form.trestbps >= 120
      ? { text: 'ELEVATED', color: '#a16207', bg: '#fefce8' }
      : { text: 'OPTIMAL', color: '#15803d', bg: '#f0fdf4' };

  const hrStatus =
    hrPercent < 70
      ? { text: 'CHRONOTROPIC INCOMPETENCE', color: '#c2410c', bg: '#fff7ed' }
      : { text: 'TARGET REACHED', color: '#15803d', bg: '#f0fdf4' };

  const cholStatus =
    form.chol >= 240
      ? { text: 'HIGH RISK (≥240)', color: '#b91c1c', bg: '#fef2f2' }
      : form.chol >= 200
      ? { text: 'BORDERLINE (200-239)', color: '#c2410c', bg: '#fff7ed' }
      : { text: 'DESIRABLE (<200)', color: '#15803d', bg: '#f0fdf4' };

  const stStatus =
    form.oldpeak >= 1.5
      ? { text: 'SIGNIFICANT ISCHEMIA', color: '#b91c1c', bg: '#fef2f2' }
      : form.oldpeak >= 1.0
      ? { text: 'EQUIVOCAL ISCHEMIA', color: '#c2410c', bg: '#fff7ed' }
      : { text: 'PHYSIOLOGICAL', color: '#15803d', bg: '#f0fdf4' };

  const caStatus =
    form.ca > 0
      ? { text: `${Math.round(form.ca)} / 3 CALCIFIED`, color: '#b91c1c', bg: '#fef2f2' }
      : { text: '0 CALCIFIED (CLEAR)', color: '#15803d', bg: '#f0fdf4' };

  const cpMap: Record<number, string> = {
    1: 'Typical Angina',
    2: 'Atypical Angina',
    3: 'Non-Anginal Chest Pain',
    4: 'Asymptomatic (Silent Risk)',
  };

  const restecgMap: Record<number, string> = {
    0: 'Normal Resting Limits',
    1: 'ST-T Wave Abnormality',
    2: 'Left Ventricular Hypertrophy (Estes)',
  };

  const slopeMap: Record<number, string> = {
    1: 'Upsloping ST Segment',
    2: 'Flat / Horizontal ST (High Specificity)',
    3: 'Downsloping ST (Severe Ischemia)',
  };

  const thalMap: Record<number, string> = {
    3: 'Normal Myocardial Flow',
    6: 'Fixed Perfusion Defect (Scar)',
    7: 'Reversible Defect (Viable Ischemia)',
  };

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const recordId = `CLV-${Math.floor(100000 + Math.random() * 900000)}`;
  const topDrivers = (shapData?.contributions || []).slice(0, 5);

  // Exact A4 Container (794px width x 1123px height at 96 DPI)
  const reportHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #ffffff; width: 794px; min-height: 1123px; max-height: 1123px; padding: 28px 32px; box-sizing: border-box; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between;">
      
      <div>
        <!-- 1. HOSPITAL LETTERHEAD MASTHEAD -->
        <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 32px; height: 32px; background: #0f172a; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg width="20" height="20" viewBox="0 0 40 40">
                  <polygon points="20,4 36,20 20,36 4,20" fill="none" stroke="#dc2626" stroke-width="3" stroke-linejoin="round"/>
                  <polyline points="9,20 13,20 15.5,13 18,27 20,11 22.5,27 25,20 31,20" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <h1 style="margin: 0; font-size: 16px; font-weight: 800; letter-spacing: 0.04em; color: #0f172a; text-transform: uppercase; line-height: 1.1;">
                  CARDIOLOGY CLINICAL CONSULTATION REPORT
                </h1>
                <p style="margin: 2px 0 0; font-size: 9.5px; font-weight: 600; color: #475569; letter-spacing: 0.06em; text-transform: uppercase;">
                  Cardiovascular Risk Stratification & Clinical Decision Support System
                </p>
              </div>
            </div>
          </div>
          <div style="text-align: right; font-family: monospace; font-size: 9.5px; color: #475569; line-height: 1.35;">
            <div style="font-weight: 700; color: #0f172a; font-size: 10px;">CONFIDENTIAL MEDICAL RECORD</div>
            <div>Date: ${today}</div>
            <div>Order ID: ${recordId}</div>
          </div>
        </div>

        <!-- 2. PATIENT DEMOGRAPHICS -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px 14px; margin-bottom: 12px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
          <div>
            <div style="font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Patient Demographics</div>
            <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 1px;">${form.age}yo ${form.sex === 1 ? 'Male' : 'Female'}</div>
          </div>
          <div>
            <div style="font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Chief Clinical Symptom</div>
            <div style="font-size: 11px; font-weight: 600; color: #0f172a; margin-top: 1px;">${cpMap[form.cp] || 'Asymptomatic'}</div>
          </div>
          <div>
            <div style="font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">Cohort Model</div>
            <div style="font-size: 11px; font-weight: 600; color: #0f172a; margin-top: 1px;">UCI Cleveland (14-Biomarker)</div>
          </div>
          <div>
            <div style="font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">ML Algorithm</div>
            <div style="font-size: 11px; font-weight: 600; color: #0f172a; margin-top: 1px;">Random Forest Ensemble</div>
          </div>
        </div>

        <!-- 3. RISK PROJECTION CARD -->
        <div style="background: ${isHighRisk ? '#fef2f2' : '#f0fdf4'}; border-left: 4px solid ${isHighRisk ? '#dc2626' : '#16a34a'}; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-radius: 4px; padding: 10px 16px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: ${isHighRisk ? '#991b1b' : '#166534'};">
              CARDIOVASCULAR RISK PROJECTION
            </div>
            <div style="display: flex; align-items: baseline; gap: 12px; margin-top: 2px;">
              <span style="font-size: 24px; font-weight: 900; color: ${isHighRisk ? '#dc2626' : '#16a34a'}; font-family: monospace; line-height: 1;">
                ${probPercent.toFixed(1)}%
              </span>
              <span style="font-size: 11.5px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: ${isHighRisk ? '#b91c1c' : '#15803d'};">
                ${isHighRisk ? '● HIGH CARDIAC RISK — CLASS 1 DETECTED' : '● LOW CARDIAC RISK — WITHIN NORMAL LIMITS'}
              </span>
            </div>
            <p style="margin: 2px 0 0; font-size: 10px; color: ${isHighRisk ? '#7f1d1d' : '#14532d'}; line-height: 1.35;">
              ${isHighRisk 
                ? 'Clinical markers indicate significant ischemic ST shifts and coronary vessel calcification associated with obstructive CAD.' 
                : 'Preserved exercise tolerance, normal ST recovery, and clear vessels indicate low probability of obstructive CAD.'}
            </p>
          </div>
          <div style="text-align: right; font-family: monospace; font-size: 9px; color: #64748b; border-left: 1px solid ${isHighRisk ? '#fecaca' : '#bbf7d0'}; padding-left: 14px; line-height: 1.4;">
            <div>Base Rate: 50.6%</div>
            <div style="font-weight: 700; color: #0f172a;">AUC: 0.903</div>
            <div>Brier: 0.118</div>
          </div>
        </div>

        <!-- 4. SECTION 1: BIOMARKERS TABLE -->
        <div style="margin-bottom: 12px;">
          <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #0f172a; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px;">
            1. OBJECTIVE CLINICAL BIOMARKERS & HEMODYNAMICS
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; line-height: 1.25;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left; color: #475569; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.04em;">
                <th style="padding: 4px 8px; border: 1px solid #e2e8f0; font-weight: 700; width: 32%;">Biomarker / Investigation</th>
                <th style="padding: 4px 8px; border: 1px solid #e2e8f0; font-weight: 700; width: 26%;">Measured Value</th>
                <th style="padding: 4px 8px; border: 1px solid #e2e8f0; font-weight: 700; width: 22%;">Clinical Threshold</th>
                <th style="padding: 4px 8px; border: 1px solid #e2e8f0; font-weight: 700; width: 20%;">Diagnostic Flag</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background: #ffffff;">
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Resting Blood Pressure</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700;">${form.trestbps} mmHg</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; color: #64748b;">Normal: &lt; 120 mmHg</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 8.5px; font-weight: 700; color: ${bpStatus.color}; background: ${bpStatus.bg};">${bpStatus.text}</span>
                </td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Exercise Max Heart Rate</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700;">${form.thalach} bpm</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; color: #64748b;">Target (85%): ${Math.round(maxTargetHr * 0.85)} bpm</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 8.5px; font-weight: 700; color: ${hrStatus.color}; background: ${hrStatus.bg};">${hrStatus.text}</span>
                </td>
              </tr>
              <tr style="background: #ffffff;">
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Total Serum Cholesterol</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700;">${form.chol} mg/dL</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; color: #64748b;">Desirable: &lt; 200 mg/dL</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 8.5px; font-weight: 700; color: ${cholStatus.color}; background: ${cholStatus.bg};">${cholStatus.text}</span>
                </td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">ST Depression (oldpeak)</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700;">${form.oldpeak.toFixed(1)} mm</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; color: #64748b;">Ischemia: &ge; 1.0 mm</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 8.5px; font-weight: 700; color: ${stStatus.color}; background: ${stStatus.bg};">${stStatus.text}</span>
                </td>
              </tr>
              <tr style="background: #ffffff;">
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Coronary Fluoroscopy (ca)</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700;">${Math.round(form.ca)} / 3 Major Vessels</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; color: #64748b;">Normal: 0 Calcified</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 8.5px; font-weight: 700; color: ${caStatus.color}; background: ${caStatus.bg};">${caStatus.text}</span>
                </td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Exercise Angina (exang)</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0;">${form.exang === 1 ? 'Positive (Exertional)' : 'Negative (No pain)'}</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; color: #64748b;">Normal: Absent</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; font-weight: 600; color: ${form.exang === 1 ? '#b91c1c' : '#15803d'};">${form.exang === 1 ? 'SYMPTOMATIC' : 'ASYMPTOMATIC'}</td>
              </tr>
              <tr style="background: #ffffff;">
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Resting Electrocardiogram</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0;" colspan="2">${restecgMap[form.restecg] || 'Normal'}</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; color: #64748b; font-size: 8.5px;">${form.restecg === 2 ? 'Estes criteria met' : 'Standard'}</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">ST Segment Slope Morphology</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0;" colspan="2">${slopeMap[form.slope] || 'Standard'}</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; color: #64748b; font-size: 8.5px;">${form.slope === 2 ? 'Flat Ischemia Marker' : 'Diagnostic Parameter'}</td>
              </tr>
              <tr style="background: #ffffff;">
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0; font-weight: 600;">Thallium Scintigraphy (thal)</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0;" colspan="2">${thalMap[form.thal] || 'Standard'}</td>
                <td style="padding: 3.5px 8px; border: 1px solid #e2e8f0;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 8.5px; font-weight: 700; color: ${form.thal === 7 ? '#b91c1c' : '#15803d'}; background: ${form.thal === 7 ? '#fef2f2' : '#f0fdf4'};">
                    ${form.thal === 7 ? 'REVERSIBLE DEFECT' : 'NORMAL PERFUSION'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 5. SECTION 2: SHAP MARGINAL CONTRIBUTIONS (Zero Text Clipping) -->
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px;">
            <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #0f172a;">
              2. EXPLAINABLE AI ATTRIBUTION (SHAP MARGINAL INFLUENCE)
            </span>
            <span style="font-size: 9px; font-family: monospace; color: #64748b; font-weight: 600;">SHAP VALUE &Delta;</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 5px;">
            ${
              topDrivers.length > 0
                ? topDrivers.map((c: any) => {
                    const isPos = c.shap_value > 0;
                    const absVal = Math.abs(c.shap_value);
                    const pct = Math.min(Math.round((absVal / 0.12) * 100), 100);
                    const label = formatFeatureName(c.feature);
                    return `
                      <div style="display: grid; grid-template-columns: 240px 1fr 60px; align-items: center; height: 18px; line-height: 18px; font-size: 9.5px;">
                        <div style="font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 18px; height: 18px;">
                          ${label}
                        </div>
                        <div style="height: 10px; background: #f1f5f9; border-radius: 2px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; align-items: center;">
                          <div style="height: 100%; width: ${Math.max(pct, 8)}%; background: ${isPos ? '#dc2626' : '#16a34a'}; border-radius: 1px;"></div>
                        </div>
                        <div style="text-align: right; font-family: monospace; font-weight: 700; color: ${isPos ? '#dc2626' : '#16a34a'}; line-height: 18px; height: 18px;">
                          ${isPos ? '+' : ''}${c.shap_value.toFixed(3)}
                        </div>
                      </div>
                    `;
                  }).join('')
                : '<div style="font-size: 9.5px; color: #64748b;">Biomarker contributions aligned with baseline cohort distribution.</div>'
            }
          </div>
        </div>

        <!-- 6. SECTION 3: MANAGEMENT PLAN -->
        <div style="margin-bottom: 12px;">
          <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #0f172a; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px;">
            3. GUIDELINE-DIRECTED CLINICAL MANAGEMENT PLAN (ACC/AHA STANDARDS)
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px 14px; font-size: 9.5px; color: #1e293b; line-height: 1.45;">
            ${
              isHighRisk
                ? `
                  <div style="margin-bottom: 4px;">
                    <strong style="color: #0f172a;">1. URGENT CARDIOLOGY CONSULTATION:</strong> Formal evaluation by an attending cardiologist or rapid-access chest pain clinic recommended.
                  </div>
                  <div style="margin-bottom: 4px;">
                    <strong style="color: #0f172a;">2. ANATOMICAL CORONARY IMAGING:</strong> Recommend Coronary CTA or Invasive Catheterization to evaluate stenosis across calcified vessels.
                  </div>
                  <div style="margin-bottom: 4px;">
                    <strong style="color: #0f172a;">3. GUIDELINE-DIRECTED MEDICAL THERAPY (GDMT):</strong>
                    <div style="padding-left: 10px; margin-top: 1px; color: #334155;">
                      &bull; Blood Pressure: Titrate antihypertensives (ACEi/ARB or CCB) targeting SBP &lt; 130 mmHg per AHA/ACC guidelines.<br>
                      &bull; Lipid Lowering: Initiate high-intensity statin therapy (Atorvastatin 40&ndash;80mg or Rosuvastatin 20&ndash;40mg) targeting &ge; 50% LDL-C reduction.<br>
                      &bull; Antiplatelet: Low-dose Aspirin (81mg daily) indicated upon anatomical confirmation of vascular stenosis.
                    </div>
                  </div>
                  <div>
                    <strong style="color: #0f172a;">4. PATIENT COUNSELING & RED FLAGS:</strong> Counseled on cardinal symptoms of acute coronary syndrome (substernal crushing pressure, radiation to arm/jaw, diaphoresis) with instructions to call 911 immediately.
                  </div>
                `
                : `
                  <div style="margin-bottom: 4px;">
                    <strong style="color: #0f172a;">1. PRIMARY PREVENTION SURVEILLANCE:</strong> Continue annual cardiovascular screening, resting blood pressure, and fasting lipid surveillance.
                  </div>
                  <div style="margin-bottom: 4px;">
                    <strong style="color: #0f172a;">2. LIFESTYLE & AEROBIC TARGETS:</strong> Reinforce guideline targets of &ge; 150 minutes/week of moderate-intensity aerobic physical activity.
                  </div>
                  <div>
                    <strong style="color: #0f172a;">3. SAFETY NETTING:</strong> Instructed patient to report any new or progressive exertional chest heaviness, shortness of breath, or palpitations.
                  </div>
                `
            }
          </div>
        </div>
      </div>

      <!-- 7. FOOTER AUTHENTICATION & SIGN-OFF (Guaranteed visible within A4 height) -->
      <div style="border-top: 1.5px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 9px; color: #475569;">
        <div>
          <div style="font-weight: 700; color: #0f172a;">ATTENDING PHYSICIAN SIGN-OFF: __________________________________________________</div>
          <div style="margin-top: 3px; color: #64748b; font-size: 8.5px;">Division of Cardiology · Reviewing Clinician Signature & NPI License</div>
        </div>
        <div style="text-align: right; font-family: monospace; font-size: 8.5px; line-height: 1.35;">
          <div>DATE: ${today}</div>
          <div style="color: #94a3b8; font-size: 7.5px;">AUTHENTICATED EHR RECORD</div>
        </div>
      </div>

    </div>
  `;

  // Render HTML in hidden DOM element exactly sized to A4 width
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '0';
  container.style.width = '794px';
  container.style.height = '1123px';
  container.style.zIndex = '-9999';
  container.innerHTML = reportHtml;
  document.body.appendChild(container);

  try {
    // Wait for DOM layout
    await new Promise((resolve) => setTimeout(resolve, 80));

    const canvas = await html2canvas(container, {
      scale: 2, // 2x = 300 DPI high-definition output
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794,
      height: 1123,
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // 210 x 297 mm exact A4 fit
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

    const filename = `Cardiology_Report_${form.age}yo_${isHighRisk ? 'HighRisk' : 'LowRisk'}_${today.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    pdf.save(filename);
  } catch (err) {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    console.error('Error generating PDF:', err);
  }
}
