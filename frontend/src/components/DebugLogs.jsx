import { useState } from "react";

export default function DebugLogs({ logs }) {
  const [open, setOpen] = useState(false);

  if (!logs || !logs.length) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 transition-colors"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        Debug Logs ({logs.length})
      </button>
      {open && (
        <div className="mt-2 bg-[var(--bg-color)] border border-[var(--border-color)] text-emerald-600 dark:text-emerald-400 rounded-xl p-4 text-xs font-mono max-h-64 overflow-y-auto">
          {logs.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
