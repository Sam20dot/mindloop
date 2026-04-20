'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getMaterials, getMaterial, deleteMaterial } from '@/lib/api';
import type { Material } from '@/types';
import { Loader } from '@/components/ui/Loader';
import { MaterialCard } from '@/components/library/MaterialCard';
import { UploadModal } from '@/components/library/UploadModal';
import { LatexText } from '@/components/ui/LatexText';

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const token = (session as any)?.accessToken as string;

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Material | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  const fetchMaterials = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getMaterials(token);
      setMaterials(data as Material[]);
    } catch { /* non-fatal */ }
  }, [token]);

  useEffect(() => {
    if (token) fetchMaterials().finally(() => setLoading(false));
  }, [token, fetchMaterials]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteMaterial(token, id);
    setMaterials(m => m.filter(x => x.id !== id));
    if (viewing?.id === id) setViewing(null);
    setDeletingId(null);
  }

  async function handleView(material: Material) {
    if (material.content_text) {
      setViewing(material);
      return;
    }
    setViewLoading(true);
    try {
      const full = await getMaterial(token, material.id);
      setViewing(full as Material);
    } catch { /* non-fatal */ } finally {
      setViewLoading(false);
    }
  }

  function handleStartSession(material: Material) {
    const topic = material.title;
    const text = material.content_text ?? '';
    router.push(`/learn?topic=${encodeURIComponent(topic)}&material=${encodeURIComponent(text.slice(0, 8000))}`);
  }

  function handleUploaded(m: Material) {
    setMaterials(prev => [m, ...prev]);
    setShowUpload(false);
  }

  const filtered = materials.filter(m => m.title.toLowerCase().includes(search.toLowerCase()));

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Material Library</h1>
            <p className="text-gray-500 text-sm mt-1">Upload study materials and start AI-powered learning sessions</p>
          </div>
          <button onClick={() => setShowUpload(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            + Add Material
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search materials…"
            className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {viewLoading && <Loader message="Loading material…" />}

        {/* Viewer panel */}
        {viewing && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-start justify-between mb-4 gap-3">
              <h2 className="font-bold text-gray-900 text-lg">{viewing.title}</h2>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleStartSession(viewing)}
                  className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium">
                  📚 Start Session
                </button>
                <button onClick={() => setViewing(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2.5 py-1.5 rounded-lg">
                  Close
                </button>
              </div>
            </div>
            {viewing.source_url && (
              <a href={viewing.source_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline block mb-3">
                🔗 {viewing.source_url}
              </a>
            )}
            <div className="max-h-80 overflow-y-auto text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4">
              {viewing.content_text
                ? <LatexText text={viewing.content_text} />
                : <span className="text-gray-400 italic">No text content available.</span>
              }
            </div>
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">📚</div>
            <p className="font-medium text-gray-600">
              {search ? 'No materials match your search.' : 'No materials yet.'}
            </p>
            {!search && (
              <p className="text-sm mt-1">Upload a PDF, paste a URL, or add a YouTube video to get started.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(m => (
              <div key={m.id} onClick={() => handleView(m)} className="cursor-pointer">
                <MaterialCard
                  material={m}
                  onStartSession={() => { handleStartSession(m); }}
                  onDelete={id => { handleDelete(id); }}
                  deleting={deletingId === m.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          token={token}
          onUploaded={handleUploaded}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
