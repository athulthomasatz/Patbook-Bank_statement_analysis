import { useState } from "react";

export default function DebugLogs({ logs }) {
  const [open, setOpen] = useState(false);

  if (!logs || !logs.length) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        Debug Logs ({logs.length})
      </button>
      {open && (
        <div className="mt-2 bg-gray-900 text-green-400 rounded-xl p-4 text-xs font-mono max-h-64 overflow-y-auto">
          {logs.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
