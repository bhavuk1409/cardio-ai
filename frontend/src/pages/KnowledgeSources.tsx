import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { KnowledgeSource } from '../types';

export default function KnowledgeSources() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.knowledgeSources()
      .then((r) => setSources(r.sources))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = sources.filter((s) => {
    if (filter === 'ALL') return true;
    if (filter === 'WHO') return s.organization.includes('WHO') || s.organization.includes('World Health');
    if (filter === 'CDC') return s.organization.includes('CDC') || s.organization.includes('Centers for Disease');
    if (filter === 'AHA') return s.organization.includes('AHA') || s.organization.includes('American Heart');
    if (filter === 'NIH') return s.organization.includes('NIH') || s.organization.includes('National Institutes');
    return true;
  });

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <div className="eyebrow eyebrow--cyan">KNOWLEDGE BASE</div>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-wider text-white mt-1">
          CARDIOVASCULAR GUIDELINE REPOSITORY
        </h1>
        <p className="mt-1 text-xs font-mono text-gray-400">
          Curated clinical evidence from WHO, CDC, AHA, and NIH embedded in ChromaDB.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="panel panel-pad flex flex-wrap items-center justify-between gap-4">
        <div className="seg">
          {['ALL', 'WHO', 'CDC', 'AHA', 'NIH'].map((cat) => (
            <button
              key={cat}
              className={filter === cat ? 'active' : ''}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-gray-400 flex items-center gap-3">
          <span className="badge badge--green">30 CHUNKS EMBEDDED</span>
          <span className="badge badge--cyan">ALL-MINILM-L6-V2</span>
        </div>
      </div>

      {/* Table */}
      <div className="panel panel--notch panel-pad">
        <div className="section-label">
          <span>CURATED CLINICAL MANIFEST</span>
          <b>{filtered.length} DOCUMENTS DISPLAYED</b>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-cyan-400 animate-pulse">
            LOADING KNOWLEDGE BASE REPOSITORY…
          </div>
        ) : (
          <div className="table-wrap">
            <table className="telemetry-table">
              <thead>
                <tr>
                  <th>Guideline Title</th>
                  <th>Issuing Organization</th>
                  <th>Clinical Section</th>
                  <th>Chunks</th>
                  <th>Direct Provenance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold text-white">{s.title}</td>
                    <td>
                      <span
                        className={`badge ${
                          s.organization.includes('WHO')
                            ? 'badge--cyan'
                            : s.organization.includes('CDC')
                            ? 'badge--red'
                            : s.organization.includes('AHA')
                            ? 'badge--amber'
                            : 'badge--green'
                        }`}
                      >
                        {s.organization.split('(')[0].trim()}
                      </span>
                    </td>
                    <td className="text-gray-400">{s.section || 'General'}</td>
                    <td className="text-gray-300 font-mono">{s.chunks_count || 2}</td>
                    <td>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-cyan-400 hover:underline inline-flex items-center gap-1"
                      >
                        Source Link ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
