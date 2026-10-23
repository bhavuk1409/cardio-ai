import React from 'react';
import { motion } from 'framer-motion';

export default function About() {
  const team = [
    { name: 'Bhavuk Agrawal', id: 'E23CSEU1938', role: 'Full-Stack AI & ML Engineer' },
    { name: 'Goyal Annayan', id: 'E23CSEU1937', role: 'RAG Pipeline & Systems Tester' },
  ];

  const milestones = [
    {
      m: 'Milestone 1',
      window: 'Sep 8 – Sep 11',
      title: 'Problem Domain Identification and Analysis',
      marks: '3 Marks',
      status: 'Completed',
      file: 'docs/M1_REPORT.md',
    },
    {
      m: 'Milestone 2',
      window: 'Sep 21 – Sep 25',
      title: 'Review of Existing Systems, Feasibility, Objectives & Algorithmic Relevance',
      marks: '9 Marks',
      status: 'Completed',
      file: 'docs/M2_REPORT.md',
    },
    {
      m: 'Milestone 3',
      window: 'Oct 12 – Oct 16',
      title: 'Synchronization of Project Design & Implementation (Data & Baseline Model)',
      marks: '3 Marks',
      status: 'Completed',
      file: 'docs/M3_REPORT.md',
    },
    {
      m: 'Milestone 4',
      window: 'Oct 26 – Oct 30',
      title: 'Implementation & Demonstration of Trained-Model Modules (SHAP & RAG)',
      marks: '3 Marks',
      status: 'Completed',
      file: 'docs/M4_REPORT.md',
    },
    {
      m: 'Milestone 5',
      window: 'Nov 16 – Nov 20',
      title: 'Organization of Report/Research Paper, Format Compliance & Presentation',
      marks: '12 Marks',
      status: 'Completed',
      file: 'docs/M5_REPORT.md',
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <div className="eyebrow eyebrow--green">BENNETT UNIVERSITY · ACADEMIC SESSION 2026–2027</div>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-wider text-white mt-1">
          PROJECT ARCHITECTURE & EVALUATION RUBRIC
        </h1>
        <p className="mt-1 text-xs font-mono text-gray-400">
          Course: CSET343 (Artificial Intelligence and Machine Learning Applications) · School of Engineering & Applied Sciences
        </p>
      </div>

      {/* Team */}
      <div className="panel panel-pad">
        <div className="section-label">
          <span>PROJECT TEAM AUTHORS</span>
          <b>BENNETT UNIVERSITY</b>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {team.map((member) => (
            <div
              key={member.id}
              className="p-4 bg-black/30 border border-[var(--line)] rounded flex items-center justify-between"
            >
              <div>
                <div className="font-display font-bold text-lg text-white">
                  {member.name}
                </div>
                <div className="text-xs font-mono text-cyan-400 mt-0.5">
                  Enrollment: {member.id}
                </div>
              </div>
              <span className="badge badge--approx">{member.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CSET343 Milestone Timeline */}
      <div className="panel panel--notch panel-pad">
        <div className="section-label">
          <span>CSET343 COURSE MILESTONE ROADMAP</span>
          <b>SESSION 2026–2027 RUBRIC TIMELINE</b>
        </div>
        <div className="table-wrap">
          <table className="telemetry-table">
            <thead>
              <tr>
                <th>Milestone</th>
                <th>Evaluation Window</th>
                <th>Rubric Focus & Assessment Component</th>
                <th>Evaluation Weight</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((ms, i) => (
                <tr key={i}>
                  <td className="font-semibold text-white">{ms.m}</td>
                  <td className="text-cyan-400 font-mono text-xs">{ms.window}</td>
                  <td className="text-gray-300">{ms.title}</td>
                  <td className="text-gray-400 font-mono">{ms.marks}</td>
                  <td>
                    <span className="badge badge--green">VERIFIED</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-Stack Technology Architecture */}
      <div className="panel panel-pad">
        <div className="section-label">
          <span>ENGINEERING ARCHITECTURE STACK</span>
          <b>LOCAL RUNTIME</b>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-black/40 rounded border border-[var(--line)]">
            <span className="text-cyan-400 font-bold block mb-1">FRONTEND SUBSYSTEM</span>
            <p className="text-gray-300">
              React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Recharts · IBM Plex Mono & Chakra Petch
            </p>
          </div>

          <div className="p-3 bg-black/40 rounded border border-[var(--line)]">
            <span className="text-emerald-400 font-bold block mb-1">BACKEND API SUBSYSTEM</span>
            <p className="text-gray-300">
              FastAPI · Uvicorn · Pydantic v2 · Python 3.11 · Thread-Safe OpenMP / PyTorch Optimization
            </p>
          </div>

          <div className="p-3 bg-black/40 rounded border border-[var(--line)]">
            <span className="text-amber-400 font-bold block mb-1">MACHINE LEARNING & SHAP</span>
            <p className="text-gray-300">
              scikit-learn · Random Forest (Champion) · XGBoost · Logistic Regression · SHAP TreeExplainer
            </p>
          </div>

          <div className="p-3 bg-black/40 rounded border border-[var(--line)]">
            <span className="text-purple-400 font-bold block mb-1">RETRIEVAL-AUGMENTED GENERATION (RAG)</span>
            <p className="text-gray-300">
              ChromaDB (30 chunks) · sentence-transformers (all-MiniLM-L6-v2) · Groq API (openai/gpt-oss-120b)
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
