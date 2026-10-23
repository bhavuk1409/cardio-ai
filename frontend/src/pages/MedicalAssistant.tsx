import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, BookOpen, ExternalLink, AlertCircle, Bot, User } from 'lucide-react';
import { api } from '../services/api';
import { ChatResponse, Passage } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  passages?: Passage[];
  error?: string;
  provider?: string;
}

const SUGGESTED_QUESTIONS = [
  'What are the main risk factors for cardiovascular disease?',
  'How does high blood pressure affect heart health?',
  'What is the significance of cholesterol levels for heart disease?',
  'What does ST depression mean in a stress test?',
  'How can lifestyle changes reduce heart disease risk?',
];

export default function MedicalAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(q: string) {
    if (!q.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);
    try {
      const res: ChatResponse = await api.chat(q);
      const assistantMsg: Message = {
        role: 'assistant',
        content: res.answer || '',
        passages: res.passages,
        error: res.error || undefined,
        provider: res.provider,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        error: e.message,
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medical AI Assistant</h1>
        <p className="mt-1 text-gray-500">
          Ask cardiovascular health questions. Answers are grounded in curated sources from WHO, CDC, AHA and NIH.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        Educational information only — not medical advice. Consult a qualified physician for health decisions.
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && (
        <div className="card p-4">
          <div className="text-sm font-medium text-gray-700 mb-3">Try a question:</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q)}
                className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="card min-h-[400px] flex flex-col">
        <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[600px]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                {msg.role === 'user' && (
                  <div className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm">
                    {msg.content}
                  </div>
                )}
                {msg.role === 'assistant' && (
                  <>
                    {msg.error && !msg.content && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                        <div className="font-medium mb-1">LLM unavailable</div>
                        {msg.error}
                      </div>
                    )}
                    {msg.content && (
                      <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-gray-700 whitespace-pre-wrap shadow-sm">
                        {msg.content}
                      </div>
                    )}
                    {msg.provider && msg.provider !== 'none' && (
                      <span className="text-xs text-gray-400 px-1">via {msg.provider}</span>
                    )}
                    {/* Retrieved passages */}
                    {msg.passages && msg.passages.length > 0 && (
                      <div className="w-full">
                        <button
                          onClick={() => setShowDebug(!showDebug)}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3" />
                          {showDebug ? 'Hide' : 'Show'} {msg.passages.length} retrieved source(s)
                        </button>
                        {showDebug && (
                          <div className="mt-2 space-y-2">
                            {msg.passages.map((p, j) => (
                              <div key={j} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="font-medium text-gray-800">{p.title}</div>
                                  <span className="text-gray-400 flex-shrink-0">
                                    sim: {p.similarity_score.toFixed(3)}
                                  </span>
                                </div>
                                <div className="text-gray-500 mb-1">{p.organization} · {p.section}</div>
                                <p className="text-gray-600 leading-relaxed">{p.text}</p>
                                <a
                                  href={p.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                  Source <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-4">
          <form
            onSubmit={e => { e.preventDefault(); send(query); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask about cardiovascular health…"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn-primary flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
