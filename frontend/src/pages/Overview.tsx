import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { StatReadout } from '../components/StatReadout';

export default function Overview() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    api.modelMetrics()
      .then((m) => setMetrics(m))
      .catch(() => {});
  }, []);

  const rf = metrics?.models?.random_forest;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Hero Header */}
      <div className="panel panel--notch panel-pad relative overflow-hidden">
        <div className="eyebrow mb-2">DECISION SUPPORT SYSTEM</div>
        <h1 className="text-3xl md:text-4xl font-bold font-display tracking-wider text-white">
          CLINICAL RISK PREDICTION & RAG
        </h1>
        <p className="mt-2 text-xs md:text-sm text-gray-400 font-mono max-w-2xl leading-relaxed">
          Cardiovascular risk classification using supervised ML (Random Forest champion), game-theoretic SHAP explainability, and context-aware medical QA powered by Groq & ChromaDB.
        </p>
      </div>

      {/* Model Benchmark Telemetry Readouts */}
      <div>
        <div className="section-label">
          <span>CHAMPION MODEL PERFORMANCE</span>
          <b>TEST SET EVALUATION ($n=61$)</b>
        </div>
        <div className="stat-grid">
          <StatReadout
            label="Accuracy"
            value={rf ? rf.accuracy * 100 : 90.16}
            unit="%"
            accent="var(--green)"
            subtitle="55 / 61 correct predictions"
          />
          <StatReadout
            label="Sensitivity"
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
            label="ROC-AUC"
            value={rf?.roc_auc ? rf.roc_auc * 100 : 93.72}
            unit="%"
            accent="var(--amber)"
            subtitle="Discrimination index"
          />
        </div>
      </div>

      {/* Interactive Core Workspaces Grid */}
      <div>
        <div className="section-label">
          <span>WORKSPACES</span>
          <b>QUICK ACCESS</b>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Risk Prediction */}
          <Link
            to="/predict"
            className="panel panel-pad hover:border-[var(--line-strong)] transition-all group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow">INFERENCE</span>
              <span className="badge badge--red">MODEL PREDICT</span>
            </div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-red-400 transition-colors">
              Risk Prediction Console
            </h3>
            <p className="mt-1.5 text-xs font-mono text-gray-400 leading-relaxed">
              Input 13 cardiovascular biomarkers or load patient profiles to generate real-time probabilistic risk scores.
            </p>
            <div className="mt-3 flex items-center text-xs font-mono text-red-400 group-hover:translate-x-1 transition-transform">
              OPEN CONSOLE →
            </div>
          </Link>

          {/* Card 2: SHAP Explainability */}
          <Link
            to="/explain"
            className="panel panel-pad hover:border-[var(--line-strong)] transition-all group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow eyebrow--cyan">ATTRIBUTION</span>
              <span className="badge badge--cyan">SHAPLEY VALUES</span>
            </div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-cyan-400 transition-colors">
              SHAP Explainability
            </h3>
            <p className="mt-1.5 text-xs font-mono text-gray-400 leading-relaxed">
              Decompose individual patient predictions into marginal contributions and review global feature importance.
            </p>
            <div className="mt-3 flex items-center text-xs font-mono text-cyan-400 group-hover:translate-x-1 transition-transform">
              VIEW ATTRIBUTIONS →
            </div>
          </Link>

          {/* Card 3: Model Performance */}
          <Link
            to="/performance"
            className="panel panel-pad hover:border-[var(--line-strong)] transition-all group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow eyebrow--green">BENCHMARK</span>
              <span className="badge badge--green">3 MODELS</span>
            </div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">
              Model Benchmark
            </h3>
            <p className="mt-1.5 text-xs font-mono text-gray-400 leading-relaxed">
              Compare Random Forest against XGBoost and the Logistic Regression baseline across confusion matrices and ROC curves.
            </p>
            <div className="mt-3 flex items-center text-xs font-mono text-emerald-400 group-hover:translate-x-1 transition-transform">
              COMPARE BENCHMARKS →
            </div>
          </Link>

          {/* Card 4: Medical AI Assistant */}
          <Link
            to="/assistant"
            className="panel panel-pad hover:border-[var(--line-strong)] transition-all group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow">RETRIEVAL</span>
              <span className="badge badge--approx">GROQ RAG</span>
            </div>
            <h3 className="font-display font-bold text-lg text-white group-hover:text-purple-400 transition-colors">
              Medical AI Assistant
            </h3>
            <p className="mt-1.5 text-xs font-mono text-gray-400 leading-relaxed">
              Interactive clinical QA grounded in 15 peer-reviewed guidelines from WHO, CDC, AHA, and NIH.
            </p>
            <div className="mt-3 flex items-center text-xs font-mono text-purple-400 group-hover:translate-x-1 transition-transform">
              LAUNCH ASSISTANT →
            </div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
