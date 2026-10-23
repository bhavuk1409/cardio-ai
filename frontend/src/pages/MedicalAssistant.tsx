import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../services/api';
import { ChatResponse, Passage } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  passages?: Passage[];
  sources_used?: string[];
  provider?: string;
  error?: string;
}

const PRESET_QUERIES = [
  'What are the warning signs of myocardial infarction and acute coronary syndromes?',
  'What lifestyle modifications does the AHA recommend to lower elevated blood pressure?',
  'What does ST depression indicate during a peak exercise stress test?',
  'What are the optimal LDL cholesterol targets for individuals with cardiovascular risk?',
  'How does diabetes accelerate atherosclerosis and coronary artery disease?',
];

export default function MedicalAssistant() {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Welcome to the Clinical AI Assistant. I provide context-aware cardiovascular answers synthesized through Groq LLM, grounded strictly in curated clinical guidelines from the World Health Organization (WHO), Centers for Disease Control and Prevention (CDC), American Heart Association (AHA), and National Institutes of Health (NIH). How can I assist with your cardiology research today?',
    },
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Pre-fill query if navigated from Risk Prediction console
  useEffect(() => {
    if (location.state && (location.state as any).prefilledQuery) {
      setQuery((location.state as any).prefilledQuery);
    }
  }, [location.state]);

  async function handleSend(qToSend?: string) {
    const text = qToSend || query;
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res: ChatResponse = await api.chat(text, 5);
      const assistantMsg: Message = {
        role: 'assistant',
        content: res.answer || 'No response generated.',
        passages: res.passages,
        sources_used: res.sources_used,
        provider: res.provider,
        error: res.error || undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '',
          error: err.message || 'Failed to connect to Medical Assistant API.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <div className="eyebrow eyebrow--cyan">RAG ARCHITECTURE · CONTEXT-AWARE INTELLIGENCE</div>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-wider text-white mt-1">
          MEDICAL INFORMATION RETRIEVAL TERMINAL
        </h1>
        <p className="mt-1 text-xs font-mono text-gray-400">
          Dense retrieval over ChromaDB with all-MiniLM-L6-v2 embeddings and prompt-constrained generation via Groq API.
        </p>
      </div>

      {/* Suggested Queries */}
      <div className="panel panel-pad">
        <div className="section-label">
          <span>RECOMMENDED CARDIOLOGY TOPICS</span>
          <b>GUIDELINE QUERIES</b>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUERIES.map((q, idx) => (
            <button
              key={idx}
              type="button"
              className="btn btn--outline btn--sm text-left font-mono"
              onClick={() => handleSend(q)}
              disabled={loading}
            >
              › {q}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal View */}
      <div className="panel panel--notch panel-pad space-y-4">
        <div className="section-label">
          <span>CLINICAL DIALOGUE TERMINAL</span>
          <b>GROQ · RAG PIPELINE</b>
        </div>

        <div className="chat-terminal space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`chat-msg ${
                m.role === 'user' ? 'chat-msg--user' : 'chat-msg--bot'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono mb-2 text-gray-400">
                <span className="font-semibold uppercase tracking-wider text-cyan-400">
                  {m.role === 'user' ? '► USER TELEMETRY QUERY' : '◄ GROQ MEDICAL ASSISTANT'}
                </span>
                {m.provider && (
                  <span className="badge badge--cyan">{m.provider}</span>
                )}
              </div>

              {m.error ? (
                <div className="text-red-400 text-xs font-mono">⚠ {m.error}</div>
              ) : (
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              )}

              {/* Retrieved Context Passages */}
              {m.passages && m.passages.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[var(--line)] space-y-2">
                  <div className="text-[10px] font-mono text-gray-400 tracking-wider uppercase">
                    RETRIEVED CLINICAL EVIDENCE (CHROMADB VECTOR STORE):
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {m.passages.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-2.5 bg-black/40 rounded border border-[var(--line)] text-xs font-mono"
                      >
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-white font-semibold truncate max-w-[200px]" title={p.title}>
                            {p.title}
                          </span>
                          <span className="badge badge--green">
                            SIM: {(p.similarity_score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-3">
                          "{p.text}"
                        </p>
                        <div className="mt-1.5 text-[9.5px] text-cyan-400 truncate">
                          {p.organization} · {p.section}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-msg chat-msg--bot animate-pulse text-xs font-mono text-cyan-400">
              RETRIEVING GUIDELINE CHUNKS FROM CHROMADB & SYNTHESIZING RESPONSE VIA GROQ…
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="pt-2 flex items-center gap-3"
        >
          <input
            type="text"
            className="input flex-1 font-mono"
            placeholder="Ask a question about cardiovascular risk factors, ECG biomarkers, or AHA guidelines…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn--primary py-2.5 px-5 font-mono"
            disabled={loading || !query.trim()}
          >
            {loading ? 'TRANSMITTING…' : '▶ TRANSMIT'}
          </button>
        </form>
      </div>

      {/* Educational Notice */}
      <div className="panel panel-pad border-gray-800 bg-black/30 text-xs font-mono text-gray-500">
        Medical disclaimer: Responses are synthesized via large language model using similarity-retrieved snippets from public health guidelines. This tool does not provide diagnosis, personalized prognosis, or medical prescription.
      </div>
    </motion.div>
  );
}
