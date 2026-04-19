'use client';

import { useState } from 'react';

export function ExportButton() {
  const [copying, setCopying] = useState(false);

  function handlePrint() {
    window.print();
  }

  async function handleCopyLink() {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Clipboard API not available — silently ignore
    }
    setTimeout(() => setCopying(false), 2000);
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        📄 Export PDF
      </button>
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        {copying ? '✅ Copied!' : '🔗 Copy Link'}
      </button>
    </div>
  );
}
