import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header, AppMode } from './components/Header';
import { Colophon } from './components/Colophon';
import { PredictorView } from './components/PredictorView';
import { AssistantView } from './components/AssistantView';
import { BenchmarkView } from './components/BenchmarkView';

export default function App() {
  const [mode, setMode] = useState<AppMode>('predict');
  const [aiPrompt, setAiPrompt] = useState<string>('');

  function handleConsultAI(prompt: string) {
    setAiPrompt(prompt);
    setMode('assistant');
  }

  return (
    <>
      <Header mode={mode} onMode={setMode} />
      <main className="w-full">
        <AnimatePresence mode="wait">
          {mode === 'predict' && (
            <motion.div
              key="predict"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <PredictorView onConsultAI={handleConsultAI} />
            </motion.div>
          )}

          {mode === 'assistant' && (
            <motion.div
              key="assistant"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <AssistantView initialQuery={aiPrompt} />
            </motion.div>
          )}

          {mode === 'benchmark' && (
            <motion.div
              key="benchmark"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <BenchmarkView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Colophon />
    </>
  );
}
