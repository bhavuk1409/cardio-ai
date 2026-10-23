import { Info, Github, Users, BookOpen } from 'lucide-react';

export default function About() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">About This Project</h1>
        <p className="mt-1 text-gray-500">CSET343 — Milestone 3 & 4 Academic Submission</p>
      </div>

      {/* Team */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" /> Team
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'Bhavuk Agrawal', id: 'E23CSEU1938' },
            { name: 'Goyal Annayan', id: 'E23CSEU1937' },
          ].map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                {m.name[0]}
              </div>
              <div>
                <div className="font-medium text-gray-800 text-sm">{m.name}</div>
                <div className="text-xs text-gray-500">{m.id}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project details */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" /> Project Overview
        </h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <strong className="text-gray-800">Title:</strong> AI-Driven Clinical Risk Prediction and
            Context-Aware Medical Information Retrieval
          </p>
          <p>
            <strong className="text-gray-800">Subtitle:</strong> A Cardiovascular Risk Prediction Case Study
            using Machine Learning, Retrieval-Augmented Generation (RAG), SHAP and Large Language Models
          </p>
          <p>
            <strong className="text-gray-800">Dataset:</strong> UCI Machine Learning Repository —
            Heart Disease Dataset (ID 45), Cleveland subset (303 records, 13 features)
          </p>
          <p>
            <strong className="text-gray-800">Objective:</strong> Build a complete, locally runnable academic
            application combining ML-based cardiovascular risk classification with an RAG-powered medical
            information chatbot, SHAP explainability, and a modern React dashboard.
          </p>
        </div>
      </div>

      {/* Architecture */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" /> System Architecture
        </h2>
        <div className="space-y-4 text-sm">
          {[
            {
              layer: 'Frontend',
              tech: 'React 18 · TypeScript · Vite · Tailwind CSS · Recharts · React Router',
            },
            {
              layer: 'Backend API',
              tech: 'FastAPI · Uvicorn · Pydantic v2 · Python 3.11',
            },
            {
              layer: 'ML Pipeline',
              tech: 'scikit-learn · XGBoost · SHAP · pandas · NumPy · joblib',
            },
            {
              layer: 'RAG Pipeline',
              tech: 'sentence-transformers (all-MiniLM-L6-v2) · ChromaDB · LangChain',
            },
            {
              layer: 'LLM Integration',
              tech: 'Groq API (Llama 3.3 / Llama 3.1) · Ollama (optional fallback)',
            },
            {
              layer: 'Dataset',
              tech: 'UCI Cleveland Heart Disease · 303 records · Binary classification (num > 0)',
            },
          ].map((row) => (
            <div key={row.layer} className="flex gap-3">
              <div className="w-28 flex-shrink-0 font-medium text-gray-700">{row.layer}</div>
              <div className="text-gray-500">{row.tech}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations */}
      <div className="card p-5 border-l-4 border-l-amber-400">
        <h2 className="font-semibold text-gray-800 mb-3">Limitations</h2>
        <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
          <li>Dataset: 303 records — too small for production clinical deployment.</li>
          <li>Cleveland subset only; generalisation to other populations not validated.</li>
          <li>Binary target (num &gt; 0) is not a validated clinical risk score.</li>
          <li>SHAP contributions indicate model behaviour, not medical causation.</li>
          <li>RAG knowledge base is curated manually; live web fetching is not implemented.</li>
          <li>LLM responses depend on the quality of retrieved context and Groq API availability.</li>
          <li>No patient data is collected, stored, or used in this application.</li>
        </ul>
      </div>

      {/* Ethical / Safety disclaimer */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <strong>Medical Safety Disclaimer:</strong> This application is an academic educational prototype.
        It is NOT a clinically validated medical device, diagnostic tool, or substitute for professional
        medical advice. Do not use model predictions or chatbot responses for personal health decisions.
        If you have a medical emergency, contact emergency services immediately.
        All model outputs are dataset classification results for educational and demonstration purposes only.
      </div>
    </div>
  );
}
