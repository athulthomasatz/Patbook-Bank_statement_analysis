import { useState } from "react";

export default function Table({ transactions, allTransactions, updateTransaction }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  if (!transactions.length) {
    return <p className="text-[var(--text-muted)] text-sm p-4 text-center">No transactions to display.</p>;
  }

  // Get all unique categories from all transactions
  const allCategories = [...new Set(allTransactions.map((t) => t.Category))].filter(Boolean).sort();

  function formatAmount(val) {
    if (val == null) return "—";
    return "₹" + Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2 });
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  // Find original index in allTransactions
  const getOriginalIndex = (filteredIndex) => {
    return allTransactions.indexOf(transactions[filteredIndex]);
  };

  // Sorting logic
  const sortedTransactions = [...transactions];
  if (sortConfig.key) {
    sortedTransactions.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "Date") {
        aVal = new Date(aVal + "T00:00:00").getTime();
        bVal = new Date(bVal + "T00:00:00").getTime();
      } else if (sortConfig.key === "Amount" || sortConfig.key === "Balance") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal || "").toLowerCase();
        bVal = String(bVal || "").toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  function handleSort(key) {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  }

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return (
        <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === "asc" ? (
      <svg className="w-3.5 h-3.5 text-[var(--primary-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3.5 h-3.5 text-[var(--primary-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const headers = [
    { key: "Date", label: "Date", align: "left" },
    { key: "Payee", label: "Payee", align: "left" },
    { key: "Category", label: "Category", align: "left" },
    { key: "Type", label: "Type", align: "left" },
    { key: "Amount", label: "Amount", align: "right" },
    { key: "Balance", label: "Balance", align: "right" },
    { key: "Notes", label: "Notes", align: "left", noSort: true },
  ];

  return (
    <div>
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto w-full">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 z-10 bg-[var(--bg-color)]/95 backdrop-blur shadow-sm">
            <tr className="text-xs uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-color)]">
              {headers.map((h) => (
                <th
                  key={h.key}
                  onClick={() => !h.noSort && handleSort(h.key)}
                  className={`px-6 py-4 font-semibold group select-none ${
                    h.align === "right" ? "text-right" : "text-left"
                  } ${!h.noSort ? "cursor-pointer hover:text-[var(--text-main)]" : ""}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {h.label}
                    {!h.noSort && <SortIcon column={h.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] bg-[var(--card-bg)]">
            {sortedTransactions.map((t, i) => {
              const originalIndex = getOriginalIndex(transactions.indexOf(t));
              return (
                <tr key={i} className="table-row-hover group transition-colors hover:bg-[var(--bg-color)]">
                  <td className="whitespace-nowrap px-6 py-3.5 text-[var(--text-muted)]">{formatDate(t.Date)}</td>
                  <td className="max-w-[200px] truncate px-6 py-3.5 font-medium text-[var(--text-main)]" title={t.Payee}>{t.Payee}</td>

                  {/* Editable Category */}
                  <td className="px-6 py-3.5 group/edit">
                    {editingIndex === i && editingField === "Category" ? (
                      <select
                        autoFocus
                        className="appearance-none rounded-xl border border-[var(--primary-accent)] bg-[var(--bg-color)] px-3 py-1.5 text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--primary-accent)]/20 shadow-sm"
                        value={t.Category}
                        onChange={(e) => updateTransaction(originalIndex, "Category", e.target.value)}
                        onBlur={() => { setEditingIndex(null); setEditingField(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { setEditingIndex(null); setEditingField(null); } }}
                      >
                        {allCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <div 
                        className="flex items-center gap-2 cursor-pointer group-hover/edit:text-[var(--primary-accent)] transition-colors"
                        onClick={() => { setEditingIndex(i); setEditingField("Category"); }}
                      >
                        <span className="inline-block rounded-full bg-[var(--bg-color)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] border border-[var(--border-color)] group-hover/edit:border-[var(--primary-accent)]/30">
                          {t.Category}
                        </span>
                        <svg className="w-3.5 h-3.5 opacity-0 group-hover/edit:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-3.5">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${
                      t.Type === "Credit"
                        ? "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-rose-100/50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                    }`}>
                      {t.Type}
                    </span>
                  </td>

                  <td className="px-6 py-3.5 text-right font-mono font-medium text-[var(--text-main)]">{formatAmount(t.Amount)}</td>
                  <td className="px-6 py-3.5 text-right font-mono text-[var(--text-muted)]">{formatAmount(t.Balance)}</td>

                  {/* Editable Notes */}
                  <td className="px-6 py-3.5 group/edit">
                    {editingIndex === i && editingField === "Notes" ? (
                      <input
                        type="text"
                        autoFocus
                        className="w-full min-w-[150px] rounded-xl border border-[var(--primary-accent)] bg-[var(--bg-color)] px-3 py-1.5 text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-[var(--primary-accent)]/20 shadow-sm"
                        value={t.Notes || ""}
                        onChange={(e) => updateTransaction(originalIndex, "Notes", e.target.value)}
                        onBlur={() => { setEditingIndex(null); setEditingField(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { setEditingIndex(null); setEditingField(null); } }}
                      />
                    ) : (
                      <div 
                        className="flex items-center gap-2 cursor-pointer group-hover/edit:text-[var(--primary-accent)] transition-colors"
                        onClick={() => { setEditingIndex(i); setEditingField("Notes"); }}
                      >
                        <span className="text-sm text-[var(--text-muted)] group-hover/edit:text-[var(--text-main)]">
                          {t.Notes || <span className="italic opacity-50">Add note...</span>}
                        </span>
                        <svg className="w-3.5 h-3.5 opacity-0 group-hover/edit:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 px-2">
        <p className="text-xs font-medium text-[var(--text-muted)]">{transactions.length} of {allTransactions.length} transactions</p>
        {sortConfig.key && (
          <button
            onClick={() => setSortConfig({ key: null, direction: "asc" })}
            className="text-xs font-medium text-[var(--primary-accent)] hover:underline"
          >
            Clear sort
          </button>
        )}
      </div>
    </div>
  );
}
