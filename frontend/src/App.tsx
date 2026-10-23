import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Colophon } from './components/Colophon';
import Overview from './pages/Overview';
import RiskPrediction from './pages/RiskPrediction';
import ModelPerformance from './pages/ModelPerformance';
import Explainability from './pages/Explainability';
import MedicalAssistant from './pages/MedicalAssistant';
import KnowledgeSources from './pages/KnowledgeSources';
import About from './pages/About';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="w-full">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/predict" element={<RiskPrediction />} />
          <Route path="/performance" element={<ModelPerformance />} />
          <Route path="/models" element={<Navigate to="/performance" replace />} />
          <Route path="/explain" element={<Explainability />} />
          <Route path="/assistant" element={<MedicalAssistant />} />
          <Route path="/sources" element={<KnowledgeSources />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <Colophon />
    </BrowserRouter>
  );
}
