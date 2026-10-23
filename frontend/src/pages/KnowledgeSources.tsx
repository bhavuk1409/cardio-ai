import { useEffect, useState } from 'react';
import { Library, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { KnowledgeSource } from '../types';

const ORG_COLORS: Record<string, string> = {
  'World Health Organization (WHO)': 'bg-blue-100 text-blue-700',
  'Centers for Disease Control and Prevention (CDC)': 'bg-red-100 text-red-700',
  'American Heart Association (AHA)': 'bg-rose-100 text-rose-700',
  'National Institutes of Health (NIH) / NHLBI': 'bg-green-100 text-green-700',
};

export default function KnowledgeSources() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.knowledgeSources()
      .then(r => setSources(r.sources))
      .finally(() => setLoading(false));
  }, []);

  const grouped = sources.reduce<Record<string, KnowledgeSource[]>>((acc, s) => {
    (acc[s.organization] = acc[s.organization] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Sources</h1>
        <p className="mt-1 text-gray-500">
          Curated cardiovascular health documents used by the RAG retrieval pipeline.
          All sources are from trusted public health organisations.
        </p>
      </div>

      <div className="card p-4 flex items-center gap-3 text-sm text-gray-600">
        <Library className="w-4 h-4 text-blue-600 flex-shrink-0" />
        {loading ? 'Loading sources…' : `${sources.length} unique sources · 4 organisations · All documents are publicly accessible`}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : (
        Object.entries(grouped).map(([org, orgSources]) => (
          <div key={org} className="space-y-2">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className={`badge ${ORG_COLORS[org] || 'bg-gray-100 text-gray-700'}`}>
                {org}
              </span>
            </h2>
            <div className="space-y-2">
              {orgSources.map((s, i) => (
                <div key={i} className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm">{s.title}</div>
                      {s.section && (
                        <div className="text-xs text-gray-400 mt-0.5">Section: {s.section}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">Retrieved: {s.retrieved_date}</div>
                    </div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline flex-shrink-0 mt-1"
                    >
                      Visit source <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <div className="card p-4 text-sm text-gray-500">
        <strong className="text-gray-700">Data ingestion:</strong> All documents are chunked (400 chars, 80-char overlap),
        embedded with <code className="bg-gray-100 px-1 rounded">all-MiniLM-L6-v2</code>,
        and stored in a local ChromaDB vector database.
        The knowledge base can be rebuilt at any time with: <code className="bg-gray-100 px-1 rounded">python -m scripts.build_kb</code>
      </div>
    </div>
  );
}
