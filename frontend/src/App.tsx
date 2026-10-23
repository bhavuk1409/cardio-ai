import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { Colophon } from './components/Colophon';
import Overview from './pages/Overview';
import RiskPrediction from './pages/RiskPrediction';
import ModelPerformance from './pages/ModelPerformance';
import Explainability from './pages/Explainability';
import MedicalAssistant from './pages/MedicalAssistant';
import KnowledgeSources from './pages/KnowledgeSources';
import About from './pages/About';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Overview />} />
        <Route path="/predict" element={<RiskPrediction />} />
        <Route path="/performance" element={<ModelPerformance />} />
        <Route path="/models" element={<Navigate to="/performance" replace />} />
        <Route path="/explain" element={<Explainability />} />
        <Route path="/assistant" element={<MedicalAssistant />} />
        <Route path="/sources" element={<KnowledgeSources />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="w-full">
        <AnimatedRoutes />
      </main>
      <Colophon />
    </BrowserRouter>
  );
}
