import { useEffect } from "react";

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, removeToast }) {
  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  const icon =
    toast.type === "success" ? (
      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ) : toast.type === "error" ? (
      <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ) : toast.type === "warning" ? (
      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-[var(--primary-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 min-w-[300px] max-w-md rounded-xl border px-4 py-3 shadow-lg animate-[slideIn_0.3s_ease-out] backdrop-blur-md
        ${toast.type === "success"
          ? "bg-emerald-50/90 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-500/20"
          : toast.type === "error"
          ? "bg-rose-50/90 dark:bg-rose-900/20 border-rose-200/50 dark:border-rose-500/20"
          : toast.type === "warning"
          ? "bg-amber-50/90 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-500/20"
          : "bg-[var(--card-bg)]/90 border-[var(--border-color)]"
        }`}
    >
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1">
        {toast.title && (
          <p className={`text-sm font-semibold ${
            toast.type === "success" ? "text-emerald-800 dark:text-emerald-300"
            : toast.type === "error" ? "text-rose-800 dark:text-rose-300"
            : toast.type === "warning" ? "text-amber-800 dark:text-amber-300"
            : "text-[var(--text-main)]"
          }`}>
            {toast.title}
          </p>
        )}
        <p className={`text-sm ${
          toast.type === "success" ? "text-emerald-700 dark:text-emerald-400"
          : toast.type === "error" ? "text-rose-700 dark:text-rose-400"
          : toast.type === "warning" ? "text-amber-700 dark:text-amber-400"
          : "text-[var(--text-muted)]"
        }`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className={`flex-shrink-0 mt-0.5 rounded-lg p-1 transition-colors ${
          toast.type === "success" ? "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100"
          : toast.type === "error" ? "text-rose-400 hover:text-rose-600 hover:bg-rose-100"
          : toast.type === "warning" ? "text-amber-400 hover:text-amber-600 hover:bg-amber-100"
          : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-color)]"
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
