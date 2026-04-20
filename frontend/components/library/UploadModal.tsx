'use client';

import { useRef, useState } from 'react';
import { uploadMaterialFile, uploadMaterialUrl } from '@/lib/api';
import type { Material } from '@/types';
import { Loader } from '@/components/ui/Loader';

type UploadTab = 'file' | 'url' | 'youtube';

interface Props {
  token: string;
  onUploaded: (material: Material) => void;
  onClose: () => void;
}

const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400";
const labelCls = "block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1";

export function UploadModal({ token, onUploaded, onClose }: Props) {
  const [tab, setTab] = useState<UploadTab>('file');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await uploadMaterialFile(token, file, title || undefined);
      onUploaded(data as Material);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleUrlUpload() {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await uploadMaterialUrl(token, url.trim(), tab as 'url' | 'youtube', title || undefined);
      onUploaded(data as Material);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white">Add Material</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="px-6 pt-4 pb-2">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-4">
            {(['file', 'url', 'youtube'] as UploadTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize ${
                  tab === t
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}>
                {t === 'file' ? '📎 File' : t === 'url' ? '🌐 URL' : '▶️ YouTube'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className={labelCls}>Title (optional)</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Chapter 3 Notes"
                className={inputCls} />
            </div>

            {tab === 'file' && (
              <div>
                <label className={labelCls}>Upload file</label>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt"
                  className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm file:font-medium" />
                <p className="text-xs text-gray-400 mt-1">Supported: .pdf, .docx, .txt</p>
              </div>
            )}

            {(tab === 'url' || tab === 'youtube') && (
              <div>
                <label className={labelCls}>
                  {tab === 'youtube' ? 'YouTube URL' : 'Web page URL'}
                </label>
                <input type="url" value={url} onChange={e => setUrl(e.target.value)}
                  placeholder={tab === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://example.com/article'}
                  className={inputCls} />
              </div>
            )}

            {error && <p className="text-red-600 text-xs">{error}</p>}

            {loading ? (
              <Loader message="Processing your material…" />
            ) : (
              <button
                onClick={tab === 'file' ? handleFileUpload : handleUrlUpload}
                disabled={tab === 'file' ? !fileRef.current?.files?.length : !url.trim()}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                Upload (+10 pts)
              </button>
            )}
          </div>
        </div>

        <div className="px-6 pb-4" />
      </div>
    </div>
  );
}
