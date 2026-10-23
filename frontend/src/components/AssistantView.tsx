import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../services/api';
import { ChatResponse, Passage } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  passages?: Passage[];
  provider?: string;
  error?: string;
}

const PRESET_QUERIES = [
  'What are the warning signs of myocardial infarction and acute coronary syndrome?',
  'What lifestyle modifications does the AHA recommend to reduce elevated blood pressure?',
  'What does ST depression indicate during a peak exercise stress test?',
  'What are the optimal LDL cholesterol targets for individuals with cardiovascular risk?',
  'How does diabetes accelerate atherosclerosis and coronary artery disease?',
];

interface Props {
  initialQuery?: string;
}

export function AssistantView({ initialQuery }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Welcome. I provide context-aware cardiovascular answers synthesized through Groq LLM, grounded strictly in curated guidelines from the WHO, CDC, AHA, and NIH. Select a clinical question or transmit a custom query.',
    },
  ]);
  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  async function handleSend(textToSend?: string) {
    const text = textToSend || query;
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res: ChatResponse = await api.chat(text, 4);
      const assistantMsg: Message = {
        role: 'assistant',
        content: res.answer || 'No response generated.',
        passages: res.passages,
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

  function handleClear() {
    setMessages([
      {
        role: 'assistant',
        content: 'Clinical dialogue reset. How can I assist with your cardiology inquiry?',
      },
    ]);
  }

  return (
    <div className="layout">
      {/* ==================== CONSOLE (LEFT) ==================== */}
      <section className="console">
        <div className="panel panel-pad space-y-3">
          <div className="section-label">
            <span>RECOMMENDED TOPICS</span>
            <b>1-CLICK TRANSMIT</b>
          </div>
          <div className="flex flex-col gap-2">
            {PRESET_QUERIES.map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn--outline btn--sm text-left font-mono justify-start py-2.5 px-3"
                onClick={() => handleSend(q)}
                disabled={loading}
              >
                › {q}
              </button>
            ))}
          </div>
        </div>

        <div className="panel panel-pad space-y-2">
          <div className="section-label">
            <span>RAG SUBSYSTEM STATUS</span>
            <b>LOCAL VECTOR STORE</b>
          </div>
          <div className="text-xs font-mono text-gray-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Vector Database:</span>
              <span className="text-cyan-400 font-semibold">ChromaDB</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Corpus Index:</span>
              <span className="text-emerald-400 font-semibold">30 Guideline Chunks</span>
            </div>
            <div className="flex items-center justify-between">
              <span>LLM Engine:</span>
              <span className="text-white font-semibold">Groq API</span>
            </div>
          </div>
          <div className="pt-2">
            <button
              type="button"
              className="btn btn--outline btn--sm w-full"
              onClick={handleClear}
            >
              CLEAR CHAT HISTORY
            </button>
          </div>
        </div>
      </section>

      {/* ==================== OUTPUT (RIGHT) ==================== */}
      <section className="output">
        <div className="panel panel--notch panel-pad space-y-4">
          <div className="section-label">
            <span>CLINICAL DIALOGUE TERMINAL</span>
            <b>GROQ · RAG PIPELINE</b>
          </div>

          <div className="chat-terminal space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`chat-msg ${
                  m.role === 'user' ? 'chat-msg--user' : 'chat-msg--bot'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-2 text-gray-400">
                  <span className="font-semibold uppercase tracking-wider text-cyan-400">
                    {m.role === 'user' ? '► QUERY' : '◄ ASSISTANT (GROQ)'}
                  </span>
                  {m.provider && <span className="badge badge--cyan">{m.provider}</span>}
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

                {/* Evidence Passages */}
                {m.passages && m.passages.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[var(--line)] space-y-2">
                    <div className="text-[9.5px] font-mono text-gray-400 uppercase tracking-wider">
                      RETRIEVED CLINICAL EVIDENCE:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {m.passages.slice(0, 2).map((p, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-2 bg-black/40 rounded border border-[var(--line)] text-xs font-mono"
                        >
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-white font-semibold truncate max-w-[200px]">
                              {p.title}
                            </span>
                            <span className="badge badge--green text-[8.5px]">
                              {(p.similarity_score * 100).toFixed(0)}% MATCH
                            </span>
                          </div>
                          <p className="text-[10.5px] text-gray-400 line-clamp-2">
                            "{p.text}"
                          </p>
                          <div className="mt-1 text-[9px] text-cyan-400 truncate">
                            {p.organization}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chat-msg chat-msg--bot animate-pulse text-xs font-mono text-cyan-400 flex items-center gap-2">
                <span className="spinner" /> RETRIEVING GUIDELINES & GENERATING RESPONSE…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="pt-1 flex items-center gap-2"
          >
            <input
              type="text"
              className="input flex-1 font-mono text-xs md:text-sm"
              placeholder="Ask a question about cardiovascular risk factors, ECG biomarkers, or AHA guidelines…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn--primary py-2.5 px-5 font-mono text-xs"
              disabled={loading || !query.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner" /> TRANSMITTING…
                </>
              ) : (
                <>▶ TRANSMIT</>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
