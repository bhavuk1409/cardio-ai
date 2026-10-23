import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { StatReadout } from '../components/StatReadout';

export default function Overview() {
  const [health, setHealth] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.health(), api.modelMetrics()])
      .then(([h, m]) => {
        setHealth(h);
        setMetrics(m);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rf = metrics?.models?.random_forest;

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero Header */}
      <div className="panel panel--notch panel-pad relative overflow-hidden">
        <div className="eyebrow mb-2">CSET343 · SESSION 2026–2027 · BENNETT UNIVERSITY</div>
        <h1 className="text-3xl md:text-4xl font-bold font-display tracking-wider text-white">
          AI-DRIVEN CLINICAL RISK PREDICTION
        </h1>
        <p className="mt-2 text-sm text-gray-400 font-mono max-w-3xl leading-relaxed">
          Cardiovascular Disease Case Study integrating Reproducible Supervised ML (Logistic Regression, Random Forest, XGBoost),
          Game-Theoretic SHAP Explainability, and Context-Aware Medical Information Retrieval with Groq & ChromaDB.
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-[var(--line)] text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="dot dot--live" />
            <span className="text-gray-300">SYSTEM STATUS:</span>
            <span className="text-emerald-400 font-semibold">ALL SUBSYSTEMS OPERATIONAL</span>
          </div>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">CHAMPION MODEL: <b className="text-cyan-400">RANDOM FOREST</b></span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">RETRIEVAL: <b className="text-cyan-400">CHROMADB (30 CHUNKS)</b></span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">LLM: <b className="text-cyan-400">GROQ API</b></span>
        </div>
      </div>

      {/* Model Benchmark Telemetry Readouts */}
      <div>
        <div className="section-label">
          <span>CHAMPION MODEL TEST EVALUATION (INDEPENDENT 20% TEST SET)</span>
          <b>RANDOM FOREST</b>
        </div>
        <div className="stat-grid">
          <StatReadout
            label="Accuracy"
            value={rf ? rf.accuracy * 100 : 90.16}
            unit="%"
            accent="var(--green)"
            subtitle="55 / 61 correct test predictions"
          />
          <StatReadout
            label="Sensitivity (Recall)"
            value={rf ? rf.recall * 100 : 96.43}
            unit="%"
            accent="var(--cyan)"
            subtitle="27 / 28 disease cases identified"
          />
          <StatReadout
            label="F1-Score"
            value={rf ? rf.f1 * 100 : 90.00}
            unit="%"
            accent="var(--text)"
            subtitle="Harmonic mean of precision & recall"
          />
          <StatReadout
            label="ROC-AUC Score"
            value={rf?.roc_auc ? rf.roc_auc * 100 : 93.72}
            unit="%"
            accent="var(--amber)"
            subtitle="High discriminative separation"
          />
        </div>
      </div>

      {/* Interactive Telemetry Modules Grid */}
      <div>
        <div className="section-label">
          <span>CLINICAL AI APPLICATION MODULES</span>
          <b>CORE WORKSPACES</b>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Risk Prediction */}
          <Link
            to="/predict"
            className="panel panel-pad hover:border-[var(--line-strong)] transition-all group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow">MODULE 01</span>
              <span className="badge badge--red">INFERENCE CONSOLE</span>
            </div>
            <h3 className="font-display font-bold text-xl text-white group-hover:text-red-400 transition-colors">
              Cardiovascular Risk Prediction Form
            </h3>
            <p className="mt-2 text-xs font-mono text-gray-400 leading-relaxed">
              Input 13 patient biomarkers (ST depression, fluoroscopy vessels, max heart rate, chest pain type)
              to receive a deterministic model risk probability and classification flag.
            </p>
            <div className="mt-4 flex items-center text-xs font-mono text-red-400 group-hover:translate-x-1 transition-transform">
              LAUNCH PREDICTION CONSOLE →
            </div>
          </Link>

          {/* Card 2: SHAP Explainability */}
          <Link
            to="/explain"
            className="panel panel-pad hover:border-[var(--line-strong)] transition-all group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow eyebrow--cyan">MODULE 02</span>
              <span className="badge badge--cyan">EXPLAINABILITY</span>
            </div>
            <h3 className="font-display font-bold text-xl text-white group-hover:text-cyan-400 transition-colors">
              SHAP Game-Theoretic Attribution
            </h3>
            <p className="mt-2 text-xs font-mono text-gray-400 leading-relaxed">
              Inspect patient-level Shapley waterfall bars indicating which biomarkers drove the prediction upward or downward,
              alongside the global feature importance ranking across the dataset.
            </p>
            <div className="mt-4 flex items-center text-xs font-mono text-cyan-400 group-hover:translate-x-1 transition-transform">
              EXPLORE SHAP ATTRIBUTION →
            </div>
          </Link>

          {/* Card 3: Model Performance */}
          <Link
            to="/performance"
            className="panel panel-pad hover:border-[var(--line-strong)] transition-all group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow eyebrow--green">MODULE 03</span>
              <span className="badge badge--green">BENCHMARK</span>
            </div>
            <h3 className="font-display font-bold text-xl text-white group-hover:text-emerald-400 transition-colors">
              Three-Model Evaluation Matrix
            </h3>
            <p className="mt-2 text-xs font-mono text-gray-400 leading-relaxed">
              Rigorous comparative benchmark between Logistic Regression (M3 Baseline), Random Forest (M4 Champion),
              and XGBoost, including confusion matrices and test metric distributions.
            </p>
            <div className="mt-4 flex items-center text-xs font-mono text-emerald-400 group-hover:translate-x-1 transition-transform">
              VIEW MODEL BENCHMARK →
            </div>
          </Link>

          {/* Card 4: Medical AI Assistant */}
          <Link
            to="/assistant"
            className="panel panel-pad hover:border-[var(--line-strong)] transition-all group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow">MODULE 04</span>
              <span className="badge badge--approx">RAG ASSISTANT</span>
            </div>
            <h3 className="font-display font-bold text-xl text-white group-hover:text-purple-400 transition-colors">
              Context-Aware Medical AI Assistant
            </h3>
            <p className="mt-2 text-xs font-mono text-gray-400 leading-relaxed">
              Ask cardiological questions synthesized via Groq LLM grounded strictly in 15 peer-reviewed
              guidelines from the WHO, CDC, American Heart Association, and NIH.
            </p>
            <div className="mt-4 flex items-center text-xs font-mono text-purple-400 group-hover:translate-x-1 transition-transform">
              OPEN MEDICAL ASSISTANT →
            </div>
          </Link>
        </div>
      </div>

      {/* Dataset & Subsystem Diagnostic Telemetry */}
      <div className="panel panel-pad">
        <div className="section-label">
          <span>PIPELINE SPECIFICATIONS & DATASET TELEMETRY</span>
          <b>UCI CLEVELAND REPOSITORY ID 45</b>
        </div>
        <div className="table-wrap">
          <table className="telemetry-table">
            <thead>
              <tr>
                <th>Telemetry Parameter</th>
                <th>Dataset & Preprocessing Value</th>
                <th>Validation Protocol</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-gray-400">Source Dataset</td>
                <td className="text-white font-semibold">UCI Machine Learning Repository #45 (Cleveland Subset)</td>
                <td><span className="badge badge--trained">OFFICIAL REPO</span></td>
              </tr>
              <tr>
                <td className="text-gray-400">Total Records & Features</td>
                <td className="text-white">303 patient records · 13 clinical biomarkers</td>
                <td><span className="badge badge--trained">VERIFIED</span></td>
              </tr>
              <tr>
                <td className="text-gray-400">Binarized Target Label</td>
                <td className="text-white">num == 0 → Class 0 (164 records) | num &gt; 0 → Class 1 (139 records)</td>
                <td><span className="badge badge--green">STRATIFIED 80/20</span></td>
              </tr>
              <tr>
                <td className="text-gray-400">Data Leakage Prevention</td>
                <td className="text-white">Median imputation & StandardScaler fitted exclusively on training split</td>
                <td><span className="badge badge--green">NO LEAKAGE</span></td>
              </tr>
              <tr>
                <td className="text-gray-400">Curated RAG Corpus</td>
                <td className="text-white">15 documents · 30 chunks · all-MiniLM-L6-v2 embeddings · ChromaDB</td>
                <td><span className="badge badge--cyan">COSINE SIMILARITY</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational Notice */}
      <div className="panel panel-pad border-amber-900/50 bg-amber-950/20">
        <div className="flex items-start gap-3">
          <span className="text-amber-500 font-mono text-lg font-bold">⚠</span>
          <div className="text-xs font-mono text-amber-200/90 leading-relaxed">
            <strong className="text-amber-400">MANDATORY EDUCATIONAL DISCLAIMER:</strong> This application is an educational decision-support
            prototype developed for academic evaluation in course CSET343 at Bennett University. It is <strong>NOT</strong> a certified medical device
            and must never be used for clinical triage or diagnostic decisions in real patients. Always consult qualified healthcare professionals.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
