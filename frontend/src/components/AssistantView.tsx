import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../services/api';
import { ChatResponse, Passage } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  passages?: Passage[];
  provider?: string;
  error?: string;
  isStreaming?: boolean;
}

const QUICK_TOPICS = [
  { label: 'MI warning signs', q: 'What are the cardinal symptoms of acute myocardial infarction and when should a patient call emergency services?' },
  { label: 'AHA BP targets', q: 'What blood pressure targets and lifestyle changes does the AHA recommend for hypertension management?' },
  { label: 'ST depression', q: 'What does horizontal or downsloping ST depression mean on an exercise stress test ECG?' },
  { label: 'LDL thresholds', q: 'What are the guideline-recommended LDL-C targets for patients with established cardiovascular disease?' },
  { label: 'Diabetes & CAD', q: 'How does uncontrolled diabetes accelerate coronary artery disease and endothelial dysfunction?' },
];

interface Props {
  initialQuery?: string;
}

export function AssistantView({ initialQuery }: Props) {
  const [messages, setMessages] = useState<Message[]>([{
    id: 'msg-init',
    role: 'assistant',
    content: 'Ready. Ask a clinical question or select a topic — I draw from WHO, AHA, CDC, and NIH guidelines.',
  }]);
  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamTimerRef = useRef<any>(null);
  const activeFullAnswerRef = useRef<string>('');
  const endRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  const stopStreaming = (flushFull = false) => {
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    if (flushFull && activeFullAnswerRef.current) {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'assistant') {
          next[next.length - 1] = {
            ...last,
            content: activeFullAnswerRef.current,
            isStreaming: false,
          };
        }
        return next;
      });
    }
    setIsStreaming(false);
  };

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    // scroll only inside the chat box — never the page
    if (chatRef.current) {
      const isNearBottom = chatRef.current.scrollHeight - chatRef.current.scrollTop - chatRef.current.clientHeight < 140;
      if (isNearBottom) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  async function handleSend(textToSend?: string) {
    const text = (textToSend || query).trim();
    if (!text || loading || isStreaming) return;

    stopStreaming(true);

    const userMsgId = 'u-' + Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', content: text }]);
    setQuery('');
    setLoading(true);

    // Build multi-turn memory history from completed turns
    const history = messages
      .filter((m) => !m.error && m.content && m.id !== 'msg-init')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res: ChatResponse = await api.chat(text, 4, history);
      setLoading(false);

      if (res.error) {
        setMessages((prev) => [...prev, {
          id: 'b-' + Date.now(),
          role: 'assistant',
          content: '',
          error: typeof res.error === 'string' ? res.error : JSON.stringify(res.error),
          passages: res.passages,
          provider: res.provider,
        }]);
        return;
      }

      const fullAnswer = res.answer || 'No response generated.';
      activeFullAnswerRef.current = fullAnswer;

      const botMsgId = 'b-' + Date.now();
      setMessages((prev) => [...prev, {
        id: botMsgId,
        role: 'assistant',
        content: '',
        passages: res.passages,
        provider: res.provider,
        isStreaming: true,
      }]);
      setIsStreaming(true);

      // Break into tokens (words and spaces/newlines preserved)
      const tokens = fullAnswer.match(/(\s+|\S+)/g) || [fullAnswer];
      let currentIdx = 0;
      // Stream speed: 1 to ~4 tokens per 16ms tick (~60fps smooth typewriter)
      const tokensPerTick = Math.max(1, Math.ceil(tokens.length / 85));
      const tickIntervalMs = 16;

      streamTimerRef.current = setInterval(() => {
        currentIdx = Math.min(tokens.length, currentIdx + tokensPerTick);
        const streamedText = tokens.slice(0, currentIdx).join('');
        const stillStreaming = currentIdx < tokens.length;

        setMessages((prev) => {
          const next = [...prev];
          const targetIdx = next.findIndex((m) => m.id === botMsgId);
          if (targetIdx !== -1) {
            next[targetIdx] = {
              ...next[targetIdx],
              content: streamedText,
              isStreaming: stillStreaming,
            };
          }
          return next;
        });

        if (chatRef.current) {
          const isNearBottom = chatRef.current.scrollHeight - chatRef.current.scrollTop - chatRef.current.clientHeight < 160;
          if (isNearBottom) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
          }
        }

        if (!stillStreaming) {
          if (streamTimerRef.current) {
            clearInterval(streamTimerRef.current);
            streamTimerRef.current = null;
          }
          setIsStreaming(false);
        }
      }, tickIntervalMs);

    } catch (err: any) {
      setLoading(false);
      const errMsg = typeof err?.message === 'string' ? err.message : (typeof err === 'string' ? err : 'Connection failed.');
      setMessages((prev) => [...prev, {
        id: 'b-' + Date.now(),
        role: 'assistant',
        content: '',
        error: errMsg,
      }]);
    }
  }

  return (
    <div className="layout" style={{ height: '100%' }}>
      {/* ── CONSOLE (LEFT) ── */}
      <section className="console" style={{ height: '100%', minHeight: 0 }}>
        <div className="panel panel-pad">
          <p className="eyebrow" style={{ marginBottom: 12 }}>Quick Topics</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {QUICK_TOPICS.map((item, idx) => (
              <button key={idx} type="button"
                className="btn btn--outline"
                disabled={loading || isStreaming}
                onClick={() => handleSend(item.q)}
                style={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  padding: '9px 12px',
                  fontSize: 12,
                  letterSpacing: '0.04em',
                  textTransform: 'none',
                  fontWeight: 400,
                  color: 'var(--muted)',
                  gap: 10,
                }}
              >
                <span style={{ color: 'var(--faint)', fontSize: 10, flexShrink: 0 }}>›</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="panel panel-pad">
          <p className="eyebrow" style={{ marginBottom: 12 }}>RAG Subsystem</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Vector DB', 'ChromaDB', 'var(--text)'],
              ['LLM', 'Groq API', 'var(--text)'],
              ['Memory', `${messages.filter((m) => m.role === 'user').length} Turns`, 'var(--text)'],
              ['Guidelines', 'WHO · AHA · NIH', 'var(--green)'],
            ].map(([label, val, col]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: col }}>{val}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            <button type="button" className="btn btn--outline"
              style={{ width: '100%', fontSize: 11, padding: '8px 12px' }}
              onClick={() => {
                stopStreaming(false);
                setMessages([{ id: 'msg-init', role: 'assistant', content: 'Dialogue reset. How can I help?' }]);
              }}>
              CLEAR HISTORY
            </button>
          </div>
        </div>
      </section>

      {/* ── CHAT (RIGHT) ── */}
      <section className="output" style={{ height: '100%', minHeight: 0 }}>
        <div className="panel panel--notch panel-pad" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p className="eyebrow">Cardiology Copilot</p>
            <span className="badge badge--approx">Groq · RAG · Memory</span>
          </div>

          {/* Messages */}
          <div className="chat-terminal" ref={chatRef}>
            {messages.map((m, idx) => (
              <motion.div key={m.id || idx}
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`chat-msg ${m.role === 'user' ? 'chat-msg--user' : 'chat-msg--bot'} ${m.isStreaming ? 'chat-msg--streaming' : ''}`}
              >
                {/* Message header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 8, gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {m.role === 'user' ? (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--muted)', fontWeight: 600 }}>
                        QUERY
                      </span>
                    ) : (
                      <>
                        <span style={{ color: 'var(--red)', fontSize: 12 }}>◈</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--text)', fontWeight: 600 }}>
                          COPILOT
                        </span>
                      </>
                    )}
                  </div>
                  {m.isStreaming ? (
                    <span className="badge badge--approx" style={{ fontSize: 8, color: 'var(--text)', borderColor: 'rgba(255,255,255,0.2)' }}>
                      <span className="spinner" style={{ width: 8, height: 8, borderWidth: 1.5, marginRight: 2 }} />
                      STREAMING
                    </span>
                  ) : m.provider ? (
                    <span className="badge badge--approx" style={{ fontSize: 8 }}>{m.provider}</span>
                  ) : null}
                </div>

                {/* Content */}
                {m.error ? (
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--red)' }}>⚠ {m.error}</p>
                ) : (
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    {m.isStreaming && !m.content && (
                      <span style={{ color: '#fff', fontSize: 13, animation: 'streamBlink 0.75s infinite' }}>▍</span>
                    )}
                  </div>
                )}

                {/* Evidence citations */}
                {!m.isStreaming && m.passages && m.passages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--line)' }}
                  >
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', color: 'var(--faint)', marginBottom: 8, textTransform: 'uppercase' }}>
                      Source Citations
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {m.passages.slice(0, 2).map((p, pIdx) => (
                        <div key={pIdx} style={{
                          padding: '8px 10px',
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: 4,
                          border: '1px solid var(--line)',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.title}
                            </span>
                            <span className="badge badge--green" style={{ fontSize: 8, flexShrink: 0 }}>
                              {(p.similarity_score * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--faint)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {p.text}
                          </p>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.organization}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}

            {/* Thinking indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="chat-msg chat-msg--bot"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}
              >
                <div className="chat-dots">
                  <span className="chat-dot" />
                  <span className="chat-dot" />
                  <span className="chat-dot" />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)', letterSpacing: '0.08em' }}>
                  Retrieving guidelines…
                </span>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <input
              type="text"
              className="input"
              placeholder="Ask about cardiovascular risk, ECG findings, or AHA guidelines…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading || isStreaming}
              style={{ flex: 1, fontSize: 13 }}
            />
            {isStreaming ? (
              <button
                type="button"
                className="btn stream-stop-btn"
                onClick={() => stopStreaming(true)}
                title="Stop streaming and reveal full response"
              >
                <span>■</span> STOP
              </button>
            ) : (
              <button type="submit" className="btn btn--primary"
                disabled={loading || !query.trim()}
                style={{ padding: '0 20px', fontSize: 12, letterSpacing: '0.1em', flexShrink: 0 }}>
                {loading ? <span className="spinner" /> : <>▶</>}
              </button>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
