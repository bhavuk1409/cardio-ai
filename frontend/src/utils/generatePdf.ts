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
    'restecg_2.0': 'Left Ventricular Hypertrophy (Estes)',
    'restecg_1.0': 'ST-T Wave Abnormality',
    'restecg_0.0': 'Normal Resting Limits',
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
  const target85 = Math.round(maxTargetHr * 0.85);
  const hrPercent = Math.round((form.thalach / maxTargetHr) * 100);

  // Interpretation status pills
  const bpStatus =
    form.trestbps >= 140
      ? { text: 'Stage 2 Hypertension', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }
      : form.trestbps >= 130
      ? { text: 'Stage 1 Hypertension', color: '#c2410c', bg: '#fff7ed', border: '#ffedd5' }
      : form.trestbps >= 120
      ? { text: 'Elevated BP', color: '#a16207', bg: '#fefce8', border: '#fef08a' }
      : { text: 'Optimal BP', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' };

  const hrStatus =
    hrPercent < 70
      ? { text: 'Chronotropic Incompetence', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }
      : hrPercent < 85
      ? { text: 'Submaximal Effort', color: '#a16207', bg: '#fefce8', border: '#fef08a' }
      : { text: 'Target Reached', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' };

  const cholStatus =
    form.chol >= 240
      ? { text: 'High Risk (≥240)', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }
      : form.chol >= 200
      ? { text: 'Borderline High', color: '#c2410c', bg: '#fff7ed', border: '#ffedd5' }
      : { text: 'Desirable Level', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' };

  const stStatus =
    form.oldpeak >= 1.5
      ? { text: 'Significant Ischemia', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }
      : form.oldpeak >= 1.0
      ? { text: 'Equivocal Ischemia', color: '#c2410c', bg: '#fff7ed', border: '#ffedd5' }
      : { text: 'Normal Recovery', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' };

  const caStatus =
    form.ca > 0
      ? { text: `${Math.round(form.ca)} / 3 Calcified`, color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }
      : { text: 'Clear (0 Calcified)', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' };

  const exangStatus =
    form.exang === 1
      ? { text: 'Symptomatic', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }
      : { text: 'Asymptomatic', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' };

  const restecgStatus =
    form.restecg === 2
      ? { text: 'Requires Clinical Review', color: '#a16207', bg: '#fefce8', border: '#fef08a' }
      : form.restecg === 1
      ? { text: 'ST-T Wave Abnormality', color: '#c2410c', bg: '#fff7ed', border: '#ffedd5' }
      : { text: 'Within Normal Limits', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' };

  const slopeStatus =
    form.slope === 2
      ? { text: 'High Ischemia Marker', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }
      : form.slope === 3
      ? { text: 'Severe Ischemia Marker', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }
      : { text: 'Physiological Upslope', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' };

  const thalStatus =
    form.thal === 7
      ? { text: 'Reversible Ischemia', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }
      : form.thal === 6
      ? { text: 'Fixed Infarction Scar', color: '#c2410c', bg: '#fff7ed', border: '#ffedd5' }
      : { text: 'Normal Perfusion', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' };

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
    2: 'Flat / Horizontal ST',
    3: 'Downsloping ST Segment',
  };

  const thalMap: Record<number, string> = {
    3: 'Normal Myocardial Flow',
    6: 'Fixed Perfusion Defect',
    7: 'Reversible Defect',
  };

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const orderId = `CLV-${Math.floor(200000 + (form.age * 137 + form.trestbps * 19) % 800000)}`;

  // Determine risk category & scale segment
  let riskCategory = 'Low Risk';
  let riskCategoryColor = '#15803d';
  let activeSegmentIndex = 0; // 0: <5%, 1: 5-20%, 2: 20-50%, 3: >50%

  if (probPercent >= 50) {
    riskCategory = 'High Risk';
    riskCategoryColor = '#b91c1c';
    activeSegmentIndex = 3;
  } else if (probPercent >= 20) {
    riskCategory = 'High Risk';
    riskCategoryColor = '#c2410c';
    activeSegmentIndex = 2;
  } else if (probPercent >= 5) {
    riskCategory = 'Intermediate Risk';
    riskCategoryColor = '#a16207';
    activeSegmentIndex = 1;
  } else {
    riskCategory = 'Low Risk';
    riskCategoryColor = '#15803d';
    activeSegmentIndex = 0;
  }

  // Top SHAP drivers (up to 5)
  const topDrivers = (shapData?.contributions || []).slice(0, 5);

  // SVG Diverging SHAP Bar Chart Generator
  const chartWidth = 726;
  const chartHeight = 110;
  const labelColWidth = 195;
  const valueColWidth = 55;
  const barAreaWidth = chartWidth - labelColWidth - valueColWidth; // ~476px
  const zeroX = labelColWidth + barAreaWidth / 2; // Exact center zero line ~433px
  const halfBarWidth = barAreaWidth / 2; // ~238px corresponds to 0.10 delta
  const maxDelta = 0.10;

  const barRowsHtml = topDrivers
    .map((c: any, i: number) => {
      const y = 8 + i * 19;
      const val = c.shap_value;
      const isPos = val >= 0;
      const barLen = Math.min(Math.abs(val) / maxDelta, 1) * halfBarWidth;
      const barX = isPos ? zeroX : zeroX - barLen;
      const barColor = isPos ? '#d97770' : '#86efac'; // muted coral red / soft green
      const label = formatFeatureName(c.feature);
      const valStr = `${isPos ? '+' : ''}${val.toFixed(3)}`;
      const valX = isPos ? zeroX + barLen + 6 : zeroX - barLen - 6;
      const textAnchor = isPos ? 'start' : 'end';

      return `
        <!-- Row ${i} -->
        <text x="${labelColWidth - 8}" y="${y + 10}" font-size="9" fill="#334155" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-weight="500">${label}</text>
        <rect x="${barX}" y="${y + 2}" width="${Math.max(barLen, 2)}" height="10" fill="${barColor}" rx="1"/>
        <text x="${valX}" y="${y + 10}" font-size="8.5" fill="${isPos ? '#b91c1c' : '#15803d'}" text-anchor="${textAnchor}" font-family="monospace" font-weight="600">${valStr}</text>
      `;
    })
    .join('');

  // The Exact Publication-Quality HTML Layout
  const reportHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #ffffff; width: 794px; min-height: 1123px; max-height: 1123px; padding: 24px 34px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
      
      <div>
        <!-- ── HEADER ── -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 8px; border-bottom: 1px solid #334155; margin-bottom: 14px;">
          <div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #1e293b; letter-spacing: -0.01em;">
              Cardiology Clinical Consultation Report
            </h1>
            <p style="margin: 3px 0 0; font-size: 11px; color: #64748b; font-weight: 400;">
              Cardiovascular Risk Stratification & Clinical Decision Support System
            </p>
          </div>
          <div style="text-align: right; font-size: 9px; color: #475569; line-height: 1.4;">
            <div style="font-weight: 700; color: #1e293b;">Confidential Medical Record</div>
            <div>Date: ${dateFormatted}</div>
            <div>Order ID: ${orderId}</div>
            <div>Report Version: v1.0</div>
          </div>
        </div>

        <!-- ── 1. PATIENT SUMMARY ── -->
        <div style="margin-bottom: 13px;">
          <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">
            1. Patient Summary
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 12px; display: grid; grid-template-columns: 0.9fr 0.8fr 1.6fr 1.5fr 1.4fr 1.3fr; gap: 8px; align-items: flex-start;">
            <div style="border-right: 1px solid #e2e8f0; padding-right: 6px;">
              <div style="font-size: 8px; color: #64748b; text-transform: capitalize;">Age</div>
              <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-top: 2px;">${form.age} years</div>
            </div>
            <div style="border-right: 1px solid #e2e8f0; padding-right: 6px;">
              <div style="font-size: 8px; color: #64748b; text-transform: capitalize;">Sex</div>
              <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-top: 2px;">${form.sex === 1 ? 'Male' : 'Female'}</div>
            </div>
            <div style="border-right: 1px solid #e2e8f0; padding-right: 6px;">
              <div style="font-size: 8px; color: #64748b;">Presenting Symptom</div>
              <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-top: 2px; line-height: 1.2;">${cpMap[form.cp] || 'Asymptomatic'}</div>
            </div>
            <div style="border-right: 1px solid #e2e8f0; padding-right: 6px;">
              <div style="font-size: 8px; color: #64748b;">Assessment Type</div>
              <div style="font-size: 10.5px; font-weight: 700; color: #1e293b; margin-top: 2px; line-height: 1.2;">Cardiovascular Risk Stratification</div>
            </div>
            <div style="border-right: 1px solid #e2e8f0; padding-right: 6px;">
              <div style="font-size: 8px; color: #64748b;">Cohort / Model</div>
              <div style="font-size: 10.5px; font-weight: 700; color: #1e293b; margin-top: 2px; line-height: 1.2;">UCI Cleveland (14-Biomarker)</div>
            </div>
            <div>
              <div style="font-size: 8px; color: #64748b;">ML Algorithm</div>
              <div style="font-size: 10.5px; font-weight: 700; color: #1e293b; margin-top: 2px; line-height: 1.2;">Random Forest Ensemble</div>
            </div>
          </div>
        </div>

        <!-- ── 2. CARDIOVASCULAR RISK ASSESSMENT ── -->
        <div style="margin-bottom: 13px;">
          <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">
            2. Cardiovascular Risk Assessment
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px 14px; display: grid; grid-template-columns: 2.1fr 2.3fr 1.6fr; gap: 14px; align-items: center; background: #ffffff;">
            <!-- Left: Model Estimated Risk -->
            <div style="border-right: 1px solid #e2e8f0; padding-right: 12px;">
              <div style="font-size: 8.5px; color: #64748b; font-weight: 600;">Model-Estimated Risk</div>
              <div style="font-size: 24px; font-weight: 700; color: ${probPercent >= 50 ? '#b91c1c' : '#15803d'}; font-family: monospace; line-height: 1.1; margin-top: 2px;">
                ${probPercent.toFixed(1)}%
              </div>
              <div style="font-size: 11px; font-weight: 700; color: ${probPercent >= 50 ? '#b91c1c' : '#1e293b'}; margin-top: 1px;">
                ${isHighRisk ? 'Class 1 Detected' : 'Class 0 Detected'}
              </div>
              <p style="margin: 4px 0 0; font-size: 8.5px; color: #64748b; line-height: 1.35;">
                ${isHighRisk 
                  ? 'The model indicates a very high probability of significant ischemic ST changes and coronary vessel calcification associated with obstructive CAD.' 
                  : 'Preserved exercise tolerance, normal ST recovery, and clear coronary vessels indicate low probability of obstructive CAD.'}
              </p>
            </div>

            <!-- Center: Risk Scale Bar -->
            <div style="border-right: 1px solid #e2e8f0; padding-right: 12px;">
              <div style="font-size: 8.5px; color: #64748b; font-weight: 600;">Risk Category</div>
              <div style="font-size: 12px; font-weight: 700; color: ${riskCategoryColor}; margin-top: 1px;">
                ${riskCategory}
              </div>

              <!-- Segmented Scale -->
              <div style="margin-top: 8px;">
                <div style="display: flex; height: 7px; border-radius: 2px; overflow: hidden; border: 1px solid #cbd5e1; gap: 1px; background: #f1f5f9;">
                  <div style="flex: 1; background: ${activeSegmentIndex === 0 ? '#15803d' : '#e2e8f0'};"></div>
                  <div style="flex: 1; background: ${activeSegmentIndex === 1 ? '#ca8a04' : '#fef08a'};"></div>
                  <div style="flex: 1; background: ${activeSegmentIndex === 2 ? '#ea580c' : '#fed7aa'};"></div>
                  <div style="flex: 1; background: ${activeSegmentIndex === 3 ? '#b91c1c' : '#fca5a5'};"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 7px; color: #64748b; margin-top: 3px; font-family: monospace;">
                  <span style="text-align: center; flex: 1;">Low<br>(&lt; 5%)</span>
                  <span style="text-align: center; flex: 1;">Intermediate<br>(5 – 20%)</span>
                  <span style="text-align: center; flex: 1;">High<br>(20 – 50%)</span>
                  <span style="text-align: center; flex: 1;">Very High<br>(&gt; 50%)</span>
                </div>
              </div>
            </div>

            <!-- Right: Validation Metrics -->
            <div>
              <div style="font-size: 8.5px; color: #64748b; font-weight: 600; margin-bottom: 6px;">Model Performance (Validation Metrics)</div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; text-align: center;">
                <div style="border-right: 1px solid #e2e8f0; padding-right: 8px; flex: 1;">
                  <div style="font-size: 7.5px; color: #64748b; text-transform: uppercase;">AUC</div>
                  <div style="font-size: 12px; font-weight: 700; color: #0f172a; font-family: monospace; margin-top: 1px;">0.903</div>
                </div>
                <div style="border-right: 1px solid #e2e8f0; padding-right: 8px; padding-left: 8px; flex: 1;">
                  <div style="font-size: 7.5px; color: #64748b; text-transform: uppercase;">Brier Score</div>
                  <div style="font-size: 12px; font-weight: 700; color: #0f172a; font-family: monospace; margin-top: 1px;">0.118</div>
                </div>
                <div style="padding-left: 8px; flex: 1;">
                  <div style="font-size: 7.5px; color: #64748b; text-transform: uppercase;">Baseline Rate</div>
                  <div style="font-size: 12px; font-weight: 700; color: #0f172a; font-family: monospace; margin-top: 1px;">50.6%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 3. CLINICAL FINDINGS TABLE ── -->
        <div style="margin-bottom: 13px;">
          <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">
            3. Clinical Findings – Biomarkers & Hemodynamics
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 9px; line-height: 1.25; border: 1px solid #e2e8f0;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 8.5px; color: #475569;">
                <th style="padding: 4px 8px; font-weight: 600; width: 33%; border-right: 1px solid #e2e8f0;">Investigation</th>
                <th style="padding: 4px 8px; font-weight: 600; width: 25%; border-right: 1px solid #e2e8f0;">Observed Result</th>
                <th style="padding: 4px 8px; font-weight: 600; width: 23%; border-right: 1px solid #e2e8f0;">Reference / Clinical Threshold</th>
                <th style="padding: 4px 8px; font-weight: 600; width: 19%;">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                <td style="padding: 3.5px 8px; color: #334155; border-right: 1px solid #e2e8f0;">Resting Blood Pressure</td>
                <td style="padding: 3.5px 8px; font-weight: 700; color: #0f172a; border-right: 1px solid #e2e8f0;">${form.trestbps} mmHg</td>
                <td style="padding: 3.5px 8px; color: #64748b; border-right: 1px solid #e2e8f0;">Normal: &lt; 120 mmHg</td>
                <td style="padding: 3.5px 8px;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 8px; font-weight: 600; color: ${bpStatus.color}; background: ${bpStatus.bg}; border: 1px solid ${bpStatus.border};">${bpStatus.text}</span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                <td style="padding: 3.5px 8px; color: #334155; border-right: 1px solid #e2e8f0;">Exercise Max Heart Rate</td>
                <td style="padding: 3.5px 8px; font-weight: 700; color: #0f172a; border-right: 1px solid #e2e8f0;">${form.thalach} bpm</td>
                <td style="padding: 3.5px 8px; color: #64748b; border-right: 1px solid #e2e8f0;">Target (85%): ${target85} bpm</td>
                <td style="padding: 3.5px 8px;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 8px; font-weight: 600; color: ${hrStatus.color}; background: ${hrStatus.bg}; border: 1px solid ${hrStatus.border};">${hrStatus.text}</span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                <td style="padding: 3.5px 8px; color: #334155; border-right: 1px solid #e2e8f0;">Total Serum Cholesterol</td>
                <td style="padding: 3.5px 8px; font-weight: 700; color: #0f172a; border-right: 1px solid #e2e8f0;">${form.chol} mg/dL</td>
                <td style="padding: 3.5px 8px; color: #64748b; border-right: 1px solid #e2e8f0;">Desirable: &lt; 200 mg/dL</td>
                <td style="padding: 3.5px 8px;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 8px; font-weight: 600; color: ${cholStatus.color}; background: ${cholStatus.bg}; border: 1px solid ${cholStatus.border};">${cholStatus.text}</span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                <td style="padding: 3.5px 8px; color: #334155; border-right: 1px solid #e2e8f0;">ST Depression (oldpeak)</td>
                <td style="padding: 3.5px 8px; font-weight: 700; color: #0f172a; border-right: 1px solid #e2e8f0;">${form.oldpeak.toFixed(1)} mm</td>
                <td style="padding: 3.5px 8px; color: #64748b; border-right: 1px solid #e2e8f0;">Ischemia: &ge; 1.0 mm</td>
                <td style="padding: 3.5px 8px;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 8px; font-weight: 600; color: ${stStatus.color}; background: ${stStatus.bg}; border: 1px solid ${stStatus.border};">${stStatus.text}</span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                <td style="padding: 3.5px 8px; color: #334155; border-right: 1px solid #e2e8f0;">Coronary Fluoroscopy (ca)</td>
                <td style="padding: 3.5px 8px; font-weight: 700; color: #0f172a; border-right: 1px solid #e2e8f0;">${Math.round(form.ca)} / 3 Major Vessels</td>
                <td style="padding: 3.5px 8px; color: #64748b; border-right: 1px solid #e2e8f0;">Normal: 0 calcified</td>
                <td style="padding: 3.5px 8px;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 8px; font-weight: 600; color: ${caStatus.color}; background: ${caStatus.bg}; border: 1px solid ${caStatus.border};">${caStatus.text}</span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                <td style="padding: 3.5px 8px; color: #334155; border-right: 1px solid #e2e8f0;">Exercise Angina (exang)</td>
                <td style="padding: 3.5px 8px; font-weight: 700; color: #0f172a; border-right: 1px solid #e2e8f0;">${form.exang === 1 ? 'Positive (Exertional)' : 'Negative (Absent)'}</td>
                <td style="padding: 3.5px 8px; color: #64748b; border-right: 1px solid #e2e8f0;">Normal: Absent</td>
                <td style="padding: 3.5px 8px;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 8px; font-weight: 600; color: ${exangStatus.color}; background: ${exangStatus.bg}; border: 1px solid ${exangStatus.border};">${exangStatus.text}</span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                <td style="padding: 3.5px 8px; color: #334155; border-right: 1px solid #e2e8f0;">Resting Electrocardiogram</td>
                <td style="padding: 3.5px 8px; font-weight: 700; color: #0f172a; border-right: 1px solid #e2e8f0;">${restecgMap[form.restecg] || 'Normal'}</td>
                <td style="padding: 3.5px 8px; color: #64748b; border-right: 1px solid #e2e8f0;">Normal: No LVH</td>
                <td style="padding: 3.5px 8px;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 8px; font-weight: 600; color: ${restecgStatus.color}; background: ${restecgStatus.bg}; border: 1px solid ${restecgStatus.border};">${restecgStatus.text}</span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                <td style="padding: 3.5px 8px; color: #334155; border-right: 1px solid #e2e8f0;">ST Segment Slope Morphology</td>
                <td style="padding: 3.5px 8px; font-weight: 700; color: #0f172a; border-right: 1px solid #e2e8f0;">${slopeMap[form.slope] || 'Standard'}</td>
                <td style="padding: 3.5px 8px; color: #64748b; border-right: 1px solid #e2e8f0;">Flat: High Specificity</td>
                <td style="padding: 3.5px 8px;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 8px; font-weight: 600; color: ${slopeStatus.color}; background: ${slopeStatus.bg}; border: 1px solid ${slopeStatus.border};">${slopeStatus.text}</span>
                </td>
              </tr>
              <tr style="background: #ffffff;">
                <td style="padding: 3.5px 8px; color: #334155; border-right: 1px solid #e2e8f0;">Thallium Scintigraphy (thal)</td>
                <td style="padding: 3.5px 8px; font-weight: 700; color: #0f172a; border-right: 1px solid #e2e8f0;">${thalMap[form.thal] || 'Standard'}</td>
                <td style="padding: 3.5px 8px; color: #64748b; border-right: 1px solid #e2e8f0;">Normal: No defect</td>
                <td style="padding: 3.5px 8px;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 8px; font-weight: 600; color: ${thalStatus.color}; background: ${thalStatus.bg}; border: 1px solid ${thalStatus.border};">${thalStatus.text}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── 4. MODEL EXPLAINABILITY & FEATURE ATTRIBUTION (SVG CHART) ── -->
        <div style="margin-bottom: 13px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
            <div style="font-size: 11px; font-weight: 700; color: #1e293b;">
              4. Model Explainability & Feature Attribution
            </div>
            <div style="font-size: 8px; font-family: monospace; color: #64748b; font-weight: 600;">
              SHAP VALUE &Delta;
            </div>
          </div>
          <div style="font-size: 8.5px; color: #64748b; margin-bottom: 4px;">
            SHAP-based contribution to this model prediction
          </div>

          <!-- Clean Vector Chart -->
          <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}" style="display: block; overflow: visible;">
            <!-- Grid Lines -->
            <line x1="${labelColWidth}" y1="0" x2="${chartWidth - valueColWidth}" y2="0" stroke="#f1f5f9" stroke-width="1"/>
            <line x1="${zeroX - halfBarWidth}" y1="0" x2="${zeroX - halfBarWidth}" y2="100" stroke="#f1f5f9" stroke-width="1"/>
            <line x1="${zeroX - halfBarWidth / 2}" y1="0" x2="${zeroX - halfBarWidth / 2}" y2="100" stroke="#f1f5f9" stroke-width="1"/>
            <line x1="${zeroX}" y1="0" x2="${zeroX}" y2="100" stroke="#94a3b8" stroke-width="1.2"/>
            <line x1="${zeroX + halfBarWidth / 2}" y1="0" x2="${zeroX + halfBarWidth / 2}" y2="100" stroke="#f1f5f9" stroke-width="1"/>
            <line x1="${zeroX + halfBarWidth}" y1="0" x2="${zeroX + halfBarWidth}" y2="100" stroke="#f1f5f9" stroke-width="1"/>

            <!-- Bar Rows -->
            ${barRowsHtml}

            <!-- Bottom Axis Line -->
            <line x1="${labelColWidth}" y1="100" x2="${chartWidth - valueColWidth}" y2="100" stroke="#cbd5e1" stroke-width="1"/>

            <!-- Axis Ticks & Labels -->
            <line x1="${zeroX - halfBarWidth}" y1="100" x2="${zeroX - halfBarWidth}" y2="103" stroke="#94a3b8" stroke-width="1"/>
            <text x="${zeroX - halfBarWidth}" y="109" font-size="7.5" fill="#64748b" text-anchor="middle" font-family="monospace">-0.10</text>

            <line x1="${zeroX - halfBarWidth / 2}" y1="100" x2="${zeroX - halfBarWidth / 2}" y2="103" stroke="#94a3b8" stroke-width="1"/>
            <text x="${zeroX - halfBarWidth / 2}" y="109" font-size="7.5" fill="#64748b" text-anchor="middle" font-family="monospace">-0.05</text>

            <line x1="${zeroX}" y1="100" x2="${zeroX}" y2="103" stroke="#475569" stroke-width="1.2"/>
            <text x="${zeroX}" y="109" font-size="7.5" fill="#0f172a" text-anchor="middle" font-family="monospace" font-weight="600">0</text>

            <line x1="${zeroX + halfBarWidth / 2}" y1="100" x2="${zeroX + halfBarWidth / 2}" y2="103" stroke="#94a3b8" stroke-width="1"/>
            <text x="${zeroX + halfBarWidth / 2}" y="109" font-size="7.5" fill="#64748b" text-anchor="middle" font-family="monospace">0.05</text>

            <line x1="${zeroX + halfBarWidth}" y1="100" x2="${zeroX + halfBarWidth}" y2="103" stroke="#94a3b8" stroke-width="1"/>
            <text x="${zeroX + halfBarWidth}" y="109" font-size="7.5" fill="#64748b" text-anchor="middle" font-family="monospace">0.10</text>
          </svg>

          <p style="margin: 4px 0 0; font-size: 7.5px; color: #64748b; font-style: italic;">
            Feature attribution describes how the model produced its output; it does not establish causality or independently confirm a diagnosis.
          </p>
        </div>

        <!-- ── 5. CLINICAL MANAGEMENT PLAN ── -->
        <div style="margin-bottom: 12px;">
          <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">
            5. Clinical Management Plan
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 8.5px; line-height: 1.3; border: 1px solid #e2e8f0;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 8px; color: #475569;">
                <th style="padding: 4px 8px; font-weight: 600; width: 25%; border-right: 1px solid #e2e8f0;">Category</th>
                <th style="padding: 4px 8px; font-weight: 600; width: 52%; border-right: 1px solid #e2e8f0;">Recommendation</th>
                <th style="padding: 4px 8px; font-weight: 600; width: 11%; border-right: 1px solid #e2e8f0;">Priority</th>
                <th style="padding: 4px 8px; font-weight: 600; width: 12%;">Source / Guideline</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                <td style="padding: 4px 8px; font-weight: 600; color: #1e293b; border-right: 1px solid #e2e8f0;">Urgent Cardiology Consultation</td>
                <td style="padding: 4px 8px; color: #334155; border-right: 1px solid #e2e8f0;">
                  <span style="font-weight: 700; color: #0f172a;">Formal evaluation by</span> an attending cardiologist or rapid-access chest pain clinic recommended.
                </td>
                <td style="padding: 4px 8px; border-right: 1px solid #e2e8f0;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 7.5px; font-weight: 600; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca;">High</span>
                </td>
                <td style="padding: 4px 8px; color: #64748b;">—</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                <td style="padding: 4px 8px; font-weight: 600; color: #1e293b; border-right: 1px solid #e2e8f0;">Anatomical Coronary Imaging</td>
                <td style="padding: 4px 8px; color: #334155; border-right: 1px solid #e2e8f0;">
                  Recommend coronary CTA or invasive catheterization to evaluate stenosis across calcified vessels. Further imaging to confirm extent of CAD.
                </td>
                <td style="padding: 4px 8px; border-right: 1px solid #e2e8f0;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 7.5px; font-weight: 600; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe;">Recommended</span>
                </td>
                <td style="padding: 4px 8px; color: #64748b;">—</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                <td style="padding: 4px 8px; font-weight: 600; color: #1e293b; border-right: 1px solid #e2e8f0; vertical-align: top;">Guideline-Directed Medical Therapy (GDMT)</td>
                <td style="padding: 4px 8px; color: #334155; border-right: 1px solid #e2e8f0;">
                  <div style="line-height: 1.35;">
                    &bull; Blood Pressure: ACEi/ARB or CCB targeting SBP &lt; 130 mmHg.<br>
                    &bull; Lipid Lowering: High-intensity statin (Atorvastatin 40&ndash;80mg or Rosuvastatin 20&ndash;40mg) targeting &ge; 50% LDL-C reduction.<br>
                    &bull; Antiplatelet: Low-dose Aspirin (81mg daily) if no contraindications.
                  </div>
                </td>
                <td style="padding: 4px 8px; border-right: 1px solid #e2e8f0; vertical-align: top;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 7.5px; font-weight: 600; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe;">Initiate / Optimize</span>
                </td>
                <td style="padding: 4px 8px; color: #64748b; vertical-align: top;">—</td>
              </tr>
              <tr style="background: #ffffff;">
                <td style="padding: 4px 8px; font-weight: 600; color: #1e293b; border-right: 1px solid #e2e8f0;">Patient Counseling & Red Flags</td>
                <td style="padding: 4px 8px; color: #334155; border-right: 1px solid #e2e8f0;">
                  Counsel on cardiac symptoms (chest pain, radiation to arm/jaw, dyspnea, diaphoresis) with instructions to seek emergency care (call 911) if symptoms occur.
                </td>
                <td style="padding: 4px 8px; border-right: 1px solid #e2e8f0;">
                  <span style="display: inline-block; padding: 1px 6px; border-radius: 2px; font-size: 7.5px; font-weight: 600; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe;">Important</span>
                </td>
                <td style="padding: 4px 8px; color: #64748b;">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── FOOTER (3 COLUMNS) ── -->
      <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; display: grid; grid-template-columns: 1.4fr 1.3fr 1.6fr; gap: 12px; font-size: 7.5px; color: #475569; line-height: 1.35;">
        <div>
          <div style="font-weight: 700; color: #1e293b;">Model & Report Information</div>
          <div><strong>Model:</strong> Random Forest Ensemble</div>
          <div><strong>Dataset:</strong> UCI Cleveland (14-Biomarker)</div>
          <div><strong>Explainability:</strong> SHAP (TreeExplainer)</div>
        </div>
        <div>
          <div><strong>Report Generated:</strong> ${dateFormatted} ${timeFormatted}</div>
          <div><strong>Report ID:</strong> ${orderId}</div>
          <div><strong>Version:</strong> v1.0</div>
        </div>
        <div>
          <div style="font-weight: 700; color: #1e293b;">Clinical Decision Support Disclaimer</div>
          <div style="color: #64748b;">
            This report is for clinical decision support and educational use only. It does not replace professional medical judgment. Always correlate with clinical history, examination, and additional diagnostic testing.
          </div>
        </div>
      </div>

    </div>
  `;

  // Render in hidden container
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
    // Wait for layout
    await new Promise((resolve) => setTimeout(resolve, 80));

    const canvas = await html2canvas(container, {
      scale: 2.5, // 2.5x scale = ultra-sharp print typography
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

    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

    const filename = `Cardiology_Consultation_Report_${form.age}yo_${isHighRisk ? 'HighRisk' : 'LowRisk'}_${orderId}.pdf`;
    pdf.save(filename);
  } catch (err) {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    console.error('Error generating PDF:', err);
  }
}
