import { useMemo, useState } from "react";
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
  LineChart,
  Line,
} from "recharts";

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export default function Analytics({ transactions }) {
  const [expandedSection, setExpandedSection] = useState("all");

  // ========== HELPER FUNCTIONS ==========

  // Get month from date string (YYYY-MM-DD -> YYYY-MM)
  const getMonth = (dateStr) => dateStr?.substring(0, 7) || "";

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

  // Get unique months in transactions
  const getUniqueMonths = (txns) => {
    const months = new Set();
    txns.forEach((t) => {
      if (t.Date) months.add(getMonth(t.Date));
    });
    return Array.from(months).sort().reverse();
  };

  // ========== CALCULATED DATA ==========

  const insights = useMemo(() => {
    if (transactions.length === 0) return {};

    const debitTxs = transactions.filter((t) => t.Type === "Debit");
    const creditTxs = transactions.filter((t) => t.Type === "Credit");

    // Get unique months
    const months = getUniqueMonths(transactions);
    const currentMonth = months[0];
    const previousMonth = months[1];

    // 1. Category Drift
    const categoryDrift = [];
    if (currentMonth && previousMonth) {
      const currentMonthTxs = debitTxs.filter((t) => getMonth(t.Date) === currentMonth);
      const previousMonthTxs = debitTxs.filter((t) => getMonth(t.Date) === previousMonth);

      const currentByCategory = {};
      currentMonthTxs.forEach((t) => {
        const cat = t.Category || "Other";
        currentByCategory[cat] = (currentByCategory[cat] || 0) + t.Amount;
      });

      const previousByCategory = {};
      previousMonthTxs.forEach((t) => {
        const cat = t.Category || "Other";
        previousByCategory[cat] = (previousByCategory[cat] || 0) + t.Amount;
      });

      const allCategories = new Set([...Object.keys(currentByCategory), ...Object.keys(previousByCategory)]);
      allCategories.forEach((cat) => {
        const current = currentByCategory[cat] || 0;
        const previous = previousByCategory[cat] || 0;
        if (previous > 0) {
          const change = ((current - previous) / previous) * 100;
          categoryDrift.push({ category: cat, current, previous, change });
        }
      });
    }

    // 2. Top Growing Category
    const topGrowingCategory = categoryDrift.length > 0
      ? categoryDrift.reduce((max, cat) => cat.change > max.change ? cat : max, categoryDrift[0])
      : null;

    // 3. Unusual Transactions (amount > 2x category average)
    const categoryAverages = {};
    debitTxs.forEach((t) => {
      const cat = t.Category || "Other";
      if (!categoryAverages[cat]) {
        categoryAverages[cat] = { sum: 0, count: 0 };
      }
      categoryAverages[cat].sum += t.Amount;
      categoryAverages[cat].count += 1;
    });

    const categoryAvgs = {};
    Object.entries(categoryAverages).forEach(([cat, data]) => {
      categoryAvgs[cat] = data.sum / data.count;
    });

    const unusualTransactions = debitTxs.filter((t) => {
      const cat = t.Category || "Other";
      const avg = categoryAvgs[cat] || 0;
      return avg > 0 && t.Amount > 2 * avg;
    });

    // 4. Low Balance Warning (balance < 1000)
    const lowBalancePeriods = [];
    transactions.forEach((t) => {
      if (t.Balance && t.Balance < 1000) {
        lowBalancePeriods.push({
          date: t.Date,
          balance: t.Balance,
          payee: t.Payee,
        });
      }
    });

    // 5. High Frequency Days (> 5 transactions per day)
    const txnsByDate = {};
    transactions.forEach((t) => {
      if (!txnsByDate[t.Date]) {
        txnsByDate[t.Date] = [];
      }
      txnsByDate[t.Date].push(t);
    });

    const highFrequencyDays = Object.entries(txnsByDate)
      .filter(([_, txns]) => txns.length > 5)
      .map(([date, txns]) => ({ date, count: txns.length, txns }));

    // 6. Top Merchants by Amount
    const merchantAmounts = {};
    debitTxs.forEach((t) => {
      const payee = t.Payee || "Unknown";
      merchantAmounts[payee] = (merchantAmounts[payee] || 0) + t.Amount;
    });
    const topMerchants = Object.entries(merchantAmounts)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // 7. Merchant Frequency
    const merchantFrequency = {};
    debitTxs.forEach((t) => {
      const payee = t.Payee || "Unknown";
      merchantFrequency[payee] = (merchantFrequency[payee] || 0) + 1;
    });
    const topFrequentMerchants = Object.entries(merchantFrequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 8. Hidden Spending (₹10-₹50)
    const hiddenSpending = debitTxs.filter((t) => t.Amount >= 10 && t.Amount <= 50);
    const hiddenByCategory = {};
    hiddenSpending.forEach((t) => {
      const cat = t.Category || "Other";
      hiddenByCategory[cat] = (hiddenByCategory[cat] || 0) + t.Amount;
    });
    const hiddenTotal = hiddenSpending.reduce((sum, t) => sum + t.Amount, 0);

    // 9. Savings Rate
    const totalDebit = debitTxs.reduce((sum, t) => sum + t.Amount, 0);
    const totalCredit = creditTxs.reduce((sum, t) => sum + t.Amount, 0);
    const savingsRate = totalCredit > 0 ? ((totalCredit - totalDebit) / totalCredit) * 100 : 0;

    // 10. Expense Ratio by Category
    const expenseRatio = [];
    if (totalCredit > 0) {
      Object.entries(categoryAverages).forEach(([cat, data]) => {
        const percent = (data.sum / totalCredit) * 100;
        expenseRatio.push({ category: cat, amount: data.sum, percent });
      });
      expenseRatio.sort((a, b) => b.percent - a.percent);
    }

    // 11. Payment Method Percentages
    const methodAmounts = {};
    debitTxs.forEach((t) => {
      const method = getTransactionMethod(t.Narration);
      methodAmounts[method] = (methodAmounts[method] || 0) + t.Amount;
    });
    const paymentMethodPercentages = Object.entries(methodAmounts)
      .map(([name, amount]) => ({ name, amount, percent: (amount / totalDebit) * 100 }))
      .sort((a, b) => b.percent - a.percent);

    // 12. ATM vs Digital
    const atmTotal = (methodAmounts["ATM"] || 0);
    const digitalTotal = totalDebit - atmTotal;

    return {
      categoryDrift,
      topGrowingCategory,
      unusualTransactions,
      lowBalancePeriods,
      highFrequencyDays,
      topMerchants,
      topFrequentMerchants,
      hiddenSpending,
      hiddenByCategory,
      hiddenTotal,
      savingsRate,
      expenseRatio,
      paymentMethodPercentages,
      atmVsDigital: { atmTotal, digitalTotal },
      months,
      currentMonth,
      previousMonth,
    };
  }, [transactions]);

  // Chart data
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

  const dateData = useMemo(() => {
    const grouped = {};
    transactions.forEach((t) => {
      grouped[t.Date] = (grouped[t.Date] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions]);

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
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-400 text-sm">No transactions available for analytics</p>
        <p className="text-gray-300 text-xs mt-1">Upload a valid bank statement to view insights</p>
      </div>
    );
  }

  const Section = ({ title, icon, children, id }) => {
    const isExpanded = expandedSection === "all" || expandedSection === id;
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setExpandedSection(isExpanded ? "none" : id)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="text-md font-semibold text-gray-900">{title}</h3>
          </div>
          <span className="text-gray-400">{isExpanded ? "▼" : "▶"}</span>
        </button>
        {isExpanded && <div className="px-6 pb-6">{children}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Expand/Collapse All */}
      <div className="flex gap-2">
        <button
          onClick={() => setExpandedSection("all")}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Expand All
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => setExpandedSection("none")}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Collapse All
        </button>
      </div>

      {/* Financial Overview */}
      <Section title="Financial Overview" icon="💰" id="overview">
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
      </Section>

      {/* Smart Category Insights */}
      <Section title="Smart Category Insights" icon="📊" id="insights">
        {insights.topGrowingCategory ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Top Growing Category:</span>{" "}
              {insights.topGrowingCategory.category} spending{" "}
              {insights.topGrowingCategory.change > 0 ? "increased" : "decreased"} by{" "}
              <span className={insights.topGrowingCategory.change > 0 ? "text-red-600" : "text-green-600"}>
                {Math.abs(insights.topGrowingCategory.change).toFixed(1)}%
              </span>{" "}
              this month
              ({insights.previousMonth} → {insights.currentMonth})
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">Need at least 2 months of data for category insights</p>
        )}

        {insights.categoryDrift.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Month-over-Month Category Changes</h4>
            {insights.categoryDrift.slice(0, 5).map((cat) => (
              <div key={cat.category} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{cat.category}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">₹{cat.previous.toFixed(0)} → ₹{cat.current.toFixed(0)}</span>
                  <span className={cat.change > 0 ? "text-red-600" : "text-green-600"}>
                    {cat.change > 0 ? "+" : ""}{cat.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Risk & Alert System */}
      <Section title="Risk & Alerts" icon="⚠️" id="alerts">
        <div className="space-y-4">
          {/* Unusual Transactions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Unusual Transactions (Amount &gt; 2x Category Average)</h4>
            {insights.unusualTransactions?.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {insights.unusualTransactions.slice(0, 10).map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{t.Payee}</p>
                      <p className="text-gray-500">{t.Date} • {t.Category}</p>
                    </div>
                    <p className="font-semibold text-red-600">₹{t.Amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-green-600">✓ No unusual transactions detected</p>
            )}
          </div>

          {/* Low Balance Warning */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Low Balance Periods (Balance &lt; ₹1,000)</h4>
            {insights.lowBalancePeriods?.length > 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <p className="text-red-800">
                  Found {insights.lowBalancePeriods.length} instances where balance dropped below ₹1,000
                </p>
                <p className="text-gray-600 mt-1">Lowest balance: ₹{Math.min(...insights.lowBalancePeriods.map(b => b.balance)).toFixed(2)}</p>
              </div>
            ) : (
              <p className="text-sm text-green-600">✓ Balance never dropped below ₹1,000</p>
            )}
          </div>

          {/* High Frequency Spending */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">High Frequency Days (&gt;5 transactions)</h4>
            {insights.highFrequencyDays?.length > 0 ? (
              <div className="space-y-2">
                {insights.highFrequencyDays.map((day) => (
                  <div key={day.date} className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                    <span className="text-gray-700">{day.date}</span>
                    <span className="font-semibold text-orange-600">{day.count} transactions</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-green-600">✓ No high-frequency spending days detected</p>
            )}
          </div>
        </div>
      </Section>

      {/* Payment Method Intelligence */}
      <Section title="Payment Method Intelligence" icon="💳" id="payment">
        <div className="grid grid-cols-2 gap-6">
          {/* ATM vs Digital */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">ATM vs Digital Spending</h4>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">ATM Withdrawals</p>
                <p className="text-xl font-bold text-gray-900">₹{insights.atmVsDigital?.atmTotal?.toFixed(2) || "0"}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Digital Payments</p>
                <p className="text-xl font-bold text-blue-600">₹{insights.atmVsDigital?.digitalTotal?.toFixed(2) || "0"}</p>
              </div>
              {insights.atmVsDigital?.atmTotal > 0 && (
                <p className="text-xs text-gray-500">
                  Digital transactions: {((insights.atmVsDigital.digitalTotal / totalDebit) * 100).toFixed(1)}% of total spending
                </p>
              )}
            </div>
          </div>

          {/* Payment Method Percentages */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preferred Payment Methods</h4>
            <div className="space-y-2">
              {insights.paymentMethodPercentages?.slice(0, 5).map((method) => (
                <div key={method.name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{method.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${method.percent}%` }}
                      />
                    </div>
                    <span className="text-gray-600 w-12 text-right">{method.percent.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Merchant Intelligence */}
      <Section title="Merchant Intelligence" icon="🏪" id="merchants">
        <div className="grid grid-cols-2 gap-6">
          {/* Top Merchants by Amount */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Top Merchants by Amount</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {insights.topMerchants?.map((merchant, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate">{merchant.name}</span>
                  <span className="text-gray-900 font-medium">₹{merchant.amount.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Merchant Frequency */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Most Frequently Used Merchants</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {insights.topFrequentMerchants?.map((merchant, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate">{merchant.name}</span>
                  <span className="text-gray-900 font-medium">{merchant.count} times</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hidden Spending */}
        <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-purple-800 mb-2">Hidden Spending (₹10-₹50 small purchases)</h4>
          <p className="text-2xl font-bold text-purple-900 mb-2">
            ₹{insights.hiddenTotal?.toFixed(2) || "0"}
          </p>
          {Object.entries(insights.hiddenByCategory || {}).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(insights.hiddenByCategory).map(([cat, amount]) => (
                <span key={cat} className="text-xs bg-white px-2 py-1 rounded-full text-purple-800">
                  {cat}: ₹{amount.toFixed(0)}
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Savings & Efficiency */}
      <Section title="Savings & Efficiency" icon="📈" id="savings">
        <div className="grid grid-cols-2 gap-6">
          {/* Savings Rate */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Savings Rate</h4>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 text-center">
              <p className={`text-4xl font-bold ${insights.savingsRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                {insights.savingsRate?.toFixed(1) || "0"}%
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {insights.savingsRate >= 0 ? "You're saving money!" : "Spending exceeds income"}
              </p>
            </div>
          </div>

          {/* Expense Ratio */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Expense Ratio by Category</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {insights.expenseRatio?.slice(0, 6).map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{cat.category}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${Math.min(cat.percent, 100)}%` }}
                      />
                    </div>
                    <span className="text-gray-600 w-12 text-right">{cat.percent.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Visual Charts */}
      <Section title="Visual Charts" icon="📉" id="charts">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spending by Category */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Spending by Category</h4>
            <ResponsiveContainer width="100%" height={250}>
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
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Debit vs Credit</h4>
            <ResponsiveContainer width="100%" height={250}>
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

        {/* Transactions by Date */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Transactions by Date</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dateData.slice(-14)}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>
    </div>
  );
}
