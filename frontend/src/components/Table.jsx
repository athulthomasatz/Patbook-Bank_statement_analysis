import { useState } from "react";

export default function Table({ transactions, allTransactions, updateTransaction, getTransactionValue }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingField, setEditingField] = useState(null);

  if (!transactions.length) {
    return <p className="text-gray-500 text-sm">No transactions to display.</p>;
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

  return (
    <div>
      <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200/70 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Payee</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t, i) => {
              const originalIndex = getOriginalIndex(i);
              return (
                <tr key={i} className="transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{formatDate(t.Date)}</td>
                  <td className="max-w-[200px] truncate px-4 py-2.5 font-medium text-slate-900" title={t.Payee}>{t.Payee}</td>

                  {/* Editable Category */}
                  <td className="px-4 py-2.5">
                    {editingIndex === i && editingField === "Category" ? (
                      <select
                        autoFocus
                        className="appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
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
                      <span
                        className="inline-block cursor-pointer rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 transition hover:bg-slate-200"
                        onClick={() => { setEditingIndex(i); setEditingField("Category"); }}
                      >
                        {t.Category}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.Type === "Credit"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}>
                      {t.Type}
                    </span>
                  </td>

                  <td className="px-4 py-2.5 text-right font-mono text-slate-900">{formatAmount(t.Amount)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">{formatAmount(t.Balance)}</td>

                  {/* Editable Notes */}
                  <td className="px-4 py-2.5">
                    {editingIndex === i && editingField === "Notes" ? (
                      <input
                        type="text"
                        autoFocus
                        className="w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        value={t.Notes || ""}
                        onChange={(e) => updateTransaction(originalIndex, "Notes", e.target.value)}
                        onBlur={() => { setEditingIndex(null); setEditingField(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { setEditingIndex(null); setEditingField(null); } }}
                      />
                    ) : (
                      <span
                        className="cursor-pointer text-xs text-slate-600 transition hover:text-slate-900"
                        onClick={() => { setEditingIndex(i); setEditingField("Notes"); }}
                      >
                        {t.Notes || <span className="italic text-slate-300">Add note</span>}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-3">
        <p className="text-xs text-slate-500">{transactions.length} of {allTransactions.length} transactions</p>
      </div>
    </div>
  );
}
