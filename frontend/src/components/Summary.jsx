export default function Summary({ summary }) {
  if (!summary) return null;

  const cards = [
    { 
      label: "Transactions", 
      value: summary.count, 
      colorClass: "text-[var(--text-main)]",
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      bgClass: "bg-blue-500/10"
    },
    { 
      label: "Total Credits", 
      value: `₹${summary.credits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 
      colorClass: "text-emerald-600 dark:text-emerald-400",
      icon: (
        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      ),
      bgClass: "bg-emerald-500/10"
    },
    { 
      label: "Total Debits", 
      value: `₹${summary.debits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 
      colorClass: "text-rose-600 dark:text-rose-400",
      icon: (
        <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      ),
      bgClass: "bg-rose-500/10"
    },
    { 
      label: "Net Flow", 
      value: `₹${summary.net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 
      colorClass: summary.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      icon: (
        <svg className={`w-5 h-5 ${summary.net >= 0 ? "text-emerald-500" : "text-rose-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgClass: summary.net >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {cards.map((c) => (
        <div key={c.label} className="flex flex-col p-5 rounded-2xl bg-[var(--bg-color)]/50 border border-[var(--border-color)]">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-xl ${c.bgClass}`}>
              {c.icon}
            </div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{c.label}</p>
          </div>
          <p className={`text-2xl font-bold tracking-tight ${c.colorClass}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
