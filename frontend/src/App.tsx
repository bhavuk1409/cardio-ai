import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header, AppMode } from './components/Header';
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
      <main style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {mode === 'predict' && (
            <motion.div
              key="predict"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: '100%' }}
            >
              <PredictorView onConsultAI={handleConsultAI} />
            </motion.div>
          )}

          {mode === 'assistant' && (
            <motion.div
              key="assistant"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: '100%' }}
            >
              <AssistantView initialQuery={aiPrompt} />
            </motion.div>
          )}

          {mode === 'benchmark' && (
            <motion.div
              key="benchmark"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: '100%' }}
            >
              <BenchmarkView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
