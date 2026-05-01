export default function Summary({ summary }) {
  const cards = [
    { label: "Transactions", value: summary.count, color: "text-gray-900" },
    { label: "Total Credits", value: `₹${summary.credits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, color: "text-green-600" },
    { label: "Total Debits", value: `₹${summary.debits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, color: "text-red-600" },
    { label: "Net Flow", value: `₹${summary.net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, color: summary.net >= 0 ? "text-green-600" : "text-red-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
          <p className={`text-xl font-semibold mt-1 ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
