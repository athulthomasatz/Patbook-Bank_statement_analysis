import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export default function Analytics({ transactions }) {
  // Group transactions by category (debit only)
  const categoryData = useMemo(() => {
    const grouped = {};
    transactions
      .filter((t) => t.Type === "Debit")
      .forEach((t) => {
        const cat = t.Category || "Other";
        grouped[cat] = (grouped[cat] || 0) + t.Amount;
      });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [transactions]);

  // Get transaction method from narration
  const getTransactionMethod = (narration) => {
    if (!narration) return "Other";
    const upper = narration.toUpperCase();
    if (upper.includes("UPI")) return "UPI";
    if (upper.includes("IMPS")) return "IMPS";
    if (upper.includes("IFN")) return "IFN";
    if (upper.includes("ATM")) return "ATM";
    if (upper.includes("NEFT")) return "NEFT";
    if (upper.includes("RTGS")) return "RTGS";
    if (upper.includes("CHEQUE")) return "Cheque";
    return "Other";
  };

  // Group transactions by method (debit only)
  const methodData = useMemo(() => {
    const grouped = {};
    transactions
      .filter((t) => t.Type === "Debit")
      .forEach((t) => {
        const method = getTransactionMethod(t.Narration);
        grouped[method] = (grouped[method] || 0) + t.Amount;
      });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Count transactions by date
  const dateData = useMemo(() => {
    const grouped = {};
    transactions.forEach((t) => {
      grouped[t.Date] = (grouped[t.Date] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions]);

  // Debit vs Credit totals
  const debitCreditData = useMemo(() => {
    let debit = 0;
    let credit = 0;
    transactions.forEach((t) => {
      if (t.Type === "Debit") debit += t.Amount;
      if (t.Type === "Credit") credit += t.Amount;
    });
    return [
      { name: "Debit", value: debit },
      { name: "Credit", value: credit },
    ];
  }, [transactions]);

  const totalDebit = debitCreditData[0].value;
  const totalCredit = debitCreditData[1].value;
  const netBalance = totalCredit - totalDebit;

  if (transactions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <p className="text-gray-400 text-sm">Upload a bank statement to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debit vs Credit Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Debit</p>
            <p className="text-2xl font-bold text-red-600">₹{totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Credit</p>
            <p className="text-2xl font-bold text-green-600">₹{totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Net Balance</p>
            <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
              ₹{netBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Debit vs Credit */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Debit vs Credit</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={debitCreditData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill="#ef4444" />
                <Cell fill="#10b981" />
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transactions by Date */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Transactions by Date</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dateData.slice(-14)}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Spending by Method */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Spending by Payment Method</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={methodData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {methodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
