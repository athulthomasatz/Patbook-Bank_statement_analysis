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
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Payee</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((t, i) => {
              const originalIndex = getOriginalIndex(i);
              return (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{formatDate(t.Date)}</td>
                  <td className="px-4 py-2.5 text-gray-900 font-medium max-w-[200px] truncate" title={t.Payee}>{t.Payee}</td>

                  {/* Editable Category */}
                  <td className="px-4 py-2.5">
                    {editingIndex === i && editingField === "Category" ? (
                      <select
                        autoFocus
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full cursor-pointer hover:bg-gray-200"
                        onClick={() => { setEditingIndex(i); setEditingField("Category"); }}
                      >
                        {t.Category}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.Type === "Credit"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {t.Type}
                    </span>
                  </td>

                  <td className="px-4 py-2.5 text-right text-gray-900 font-mono">{formatAmount(t.Amount)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500 font-mono">{formatAmount(t.Balance)}</td>

                  {/* Editable Notes */}
                  <td className="px-4 py-2.5">
                    {editingIndex === i && editingField === "Notes" ? (
                      <input
                        type="text"
                        autoFocus
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={t.Notes || ""}
                        onChange={(e) => updateTransaction(originalIndex, "Notes", e.target.value)}
                        onBlur={() => { setEditingIndex(null); setEditingField(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { setEditingIndex(null); setEditingField(null); } }}
                      />
                    ) : (
                      <span
                        className="text-gray-600 text-xs cursor-pointer hover:text-gray-900"
                        onClick={() => { setEditingIndex(i); setEditingField("Notes"); }}
                      >
                        {t.Notes || <span className="text-gray-300 italic">Add note</span>}
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
        <p className="text-xs text-gray-500">{transactions.length} of {allTransactions.length} transactions</p>
      </div>
    </div>
  );
}
