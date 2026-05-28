import { useState } from "react";

export default function ExportDialog({ isOpen, onClose, onExport }) {
  const [includeNotes, setIncludeNotes] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-main)]">
              Export to CSV
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-color)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 rounded-md border-2 border-[var(--border-color)] bg-[var(--bg-color)] peer-checked:bg-[var(--primary-accent)] peer-checked:border-[var(--primary-accent)] transition-all flex items-center justify-center">
                  {includeNotes && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-[var(--text-main)] group-hover:text-[var(--primary-accent)] transition-colors">
                Include custom notes
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] bg-[var(--bg-color)] rounded-xl hover:bg-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)]/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onExport(includeNotes)}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary-accent)] rounded-xl hover:bg-[var(--primary-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)]/40 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
