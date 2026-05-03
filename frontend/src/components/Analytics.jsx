import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#15196c",
  "#4b6700",
  "#54000a",
  "#5156a7",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#6366f1",
];

function formatAmount(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function getMonth(dateStr) {
  return dateStr?.substring(0, 7) || "";
}

function getTransactionMethod(narration) {
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
}

function MetricCard({ label, value, detail, tone = "indigo" }) {
  const toneClasses = {
    indigo: "bg-indigo-50 text-indigo-900 border-indigo-100",
    green: "bg-emerald-50 text-emerald-900 border-emerald-100",
    rose: "bg-rose-50 text-rose-900 border-rose-100",
    amber: "bg-amber-50 text-amber-900 border-amber-100",
  };

  return (
    <div className={`rounded-[1.5rem] border p-5 shadow-[0_10px_40px_rgba(25,28,30,0.06)] ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      {detail ? <p className="mt-2 text-sm text-slate-600">{detail}</p> : null}
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200/70 bg-white p-5 shadow-[0_10px_40px_rgba(25,28,30,0.06)] sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">{subtitle}</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export default function Analytics({ transactions }) {
  const [expandedSection, setExpandedSection] = useState("all");

  const insights = useMemo(() => {
    if (transactions.length === 0) return {};

    const debitTxs = transactions.filter((transaction) => transaction.Type === "Debit");
    const creditTxs = transactions.filter((transaction) => transaction.Type === "Credit");

    const totalDebit = debitTxs.reduce((sum, transaction) => sum + transaction.Amount, 0);
    const totalCredit = creditTxs.reduce((sum, transaction) => sum + transaction.Amount, 0);
    const savingsRate = totalCredit > 0 ? ((totalCredit - totalDebit) / totalCredit) * 100 : 0;

    const months = Array.from(new Set(transactions.map((transaction) => getMonth(transaction.Date)).filter(Boolean))).sort().reverse();
    const currentMonth = months[0];
    const previousMonth = months[1];

    const categoryAverages = {};
    debitTxs.forEach((transaction) => {
      const category = transaction.Category || "Other";
      if (!categoryAverages[category]) {
        categoryAverages[category] = { sum: 0, count: 0 };
      }
      categoryAverages[category].sum += transaction.Amount;
      categoryAverages[category].count += 1;
    });

    const categoryAverageValues = Object.fromEntries(
      Object.entries(categoryAverages).map(([category, data]) => [category, data.sum / data.count]),
    );

    const unusualTransactions = debitTxs.filter((transaction) => {
      const category = transaction.Category || "Other";
      const average = categoryAverageValues[category] || 0;
      return average > 0 && transaction.Amount > average * 2;
    });

    const lowBalancePeriods = transactions.filter((transaction) => transaction.Balance && transaction.Balance < 1000);

    const txnsByDate = {};
    transactions.forEach((transaction) => {
      if (!txnsByDate[transaction.Date]) txnsByDate[transaction.Date] = [];
      txnsByDate[transaction.Date].push(transaction);
    });

    const highFrequencyDays = Object.entries(txnsByDate)
      .filter(([, dailyTransactions]) => dailyTransactions.length > 5)
      .map(([date, dailyTransactions]) => ({ date, count: dailyTransactions.length }));

    const merchantAmounts = {};
    const merchantFrequency = {};
    debitTxs.forEach((transaction) => {
      const payee = transaction.Payee || "Unknown";
      merchantAmounts[payee] = (merchantAmounts[payee] || 0) + transaction.Amount;
      merchantFrequency[payee] = (merchantFrequency[payee] || 0) + 1;
    });

    const topMerchants = Object.entries(merchantAmounts)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    const topFrequentMerchants = Object.entries(merchantFrequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const hiddenSpending = debitTxs.filter((transaction) => transaction.Amount >= 10 && transaction.Amount <= 50);
    const hiddenByCategory = hiddenSpending.reduce((accumulator, transaction) => {
      const category = transaction.Category || "Other";
      accumulator[category] = (accumulator[category] || 0) + transaction.Amount;
      return accumulator;
    }, {});

    const expenseRatio = Object.entries(categoryAverages)
      .map(([category, data]) => ({
        category,
        amount: data.sum,
        percent: totalCredit > 0 ? (data.sum / totalCredit) * 100 : 0,
      }))
      .sort((a, b) => b.percent - a.percent);

    const methodAmounts = debitTxs.reduce((accumulator, transaction) => {
      const method = getTransactionMethod(transaction.Narration);
      accumulator[method] = (accumulator[method] || 0) + transaction.Amount;
      return accumulator;
    }, {});

    const paymentMethods = Object.entries(methodAmounts)
      .map(([name, amount]) => ({ name, amount, percent: totalDebit > 0 ? (amount / totalDebit) * 100 : 0 }))
      .sort((a, b) => b.percent - a.percent);

    const categoryChange = [];
    if (currentMonth && previousMonth) {
      const currentMonthSpend = {};
      const previousMonthSpend = {};

      debitTxs.forEach((transaction) => {
        const month = getMonth(transaction.Date);
        const bucket = month === currentMonth ? currentMonthSpend : month === previousMonth ? previousMonthSpend : null;
        if (!bucket) return;
        const category = transaction.Category || "Other";
        bucket[category] = (bucket[category] || 0) + transaction.Amount;
      });

      const allCategories = new Set([...Object.keys(currentMonthSpend), ...Object.keys(previousMonthSpend)]);
      allCategories.forEach((category) => {
        const previous = previousMonthSpend[category] || 0;
        const current = currentMonthSpend[category] || 0;
        if (previous > 0) {
          const change = ((current - previous) / previous) * 100;
          categoryChange.push({ category, previous, current, change });
        }
      });
    }

    const topGrowingCategory = categoryChange.length
      ? categoryChange.reduce((winner, item) => (item.change > winner.change ? item : winner), categoryChange[0])
      : null;

    return {
      totalDebit,
      totalCredit,
      savingsRate,
      unusualTransactions,
      lowBalancePeriods,
      highFrequencyDays,
      topMerchants,
      topFrequentMerchants,
      hiddenSpending,
      hiddenByCategory,
      expenseRatio,
      paymentMethods,
      categoryChange,
      topGrowingCategory,
      months,
      currentMonth,
      previousMonth,
    };
  }, [transactions]);

  const categoryData = useMemo(() => {
    const grouped = {};
    transactions.filter((transaction) => transaction.Type === "Debit").forEach((transaction) => {
      const category = transaction.Category || "Other";
      grouped[category] = (grouped[category] || 0) + transaction.Amount;
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions]);

  const dateData = useMemo(() => {
    const grouped = {};
    transactions.forEach((transaction) => {
      grouped[transaction.Date] = (grouped[transaction.Date] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions]);

  const debitCreditData = useMemo(() => ([
    { name: "Debit", value: insights.totalDebit || 0 },
    { name: "Credit", value: insights.totalCredit || 0 },
  ]), [insights.totalDebit, insights.totalCredit]);

  const totalDebit = insights.totalDebit || 0;
  const totalCredit = insights.totalCredit || 0;
  const netBalance = totalCredit - totalDebit;

  if (transactions.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-12 text-center shadow-[0_10px_40px_rgba(25,28,30,0.06)]">
        <svg className="mx-auto mb-4 h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm text-slate-500">No transactions available for analytics</p>
        <p className="mt-1 text-xs text-slate-400">Upload a valid bank statement to view insights</p>
      </div>
    );
  }

  const Section = ({ title, icon, children, id }) => {
    const isExpanded = expandedSection === "all" || expandedSection === id;

    return (
      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-white shadow-[0_10px_40px_rgba(25,28,30,0.06)]">
        <button
          onClick={() => setExpandedSection(isExpanded ? "none" : id)}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <h3 className="text-md font-semibold text-slate-900">{title}</h3>
          </div>
          <span className="text-slate-400">{isExpanded ? "▼" : "▶"}</span>
        </button>
        {isExpanded ? <div className="px-6 pb-6">{children}</div> : null}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 p-6 shadow-[0_10px_40px_rgba(25,28,30,0.06)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Pattubook Analytics</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">A calm financial dashboard with clear spending signals.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The layout favors soft contrast, rounded surfaces, and quick scanning so transaction patterns feel readable on every screen size.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setExpandedSection("all")} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800">Expand all</button>
            <button onClick={() => setExpandedSection("none")} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">Collapse all</button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Debit" value={formatAmount(totalDebit)} detail="Money spent in the selected statement" tone="rose" />
          <MetricCard label="Total Credit" value={formatAmount(totalCredit)} detail="Money received in the selected statement" tone="green" />
          <MetricCard label="Net Balance" value={formatAmount(netBalance)} detail={netBalance >= 0 ? "Credits outweigh debits" : "Debits exceed credits"} tone="indigo" />
          <MetricCard label="Savings Rate" value={`${insights.savingsRate?.toFixed(1) || "0.0"}%`} detail={insights.savingsRate >= 0 ? "Healthy cash flow" : "Spending above income"} tone={insights.savingsRate >= 0 ? "green" : "rose"} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Spending by Category" subtitle="Charts">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={45}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`category-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatAmount(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Debit vs Credit" subtitle="Charts">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={debitCreditData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={6} dataKey="value">
                  <Cell fill="#ef4444" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip formatter={(value) => formatAmount(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Transactions Over Time" subtitle="Charts">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dateData.slice(-14)}>
              <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} allowDecimals={false} />
              <Tooltip labelFormatter={(label) => label} />
              <Line type="monotone" dataKey="count" stroke="#15196c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <Section title="Smart Category Insights" icon="📊" id="insights">
        {insights.topGrowingCategory ? (
          <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-sm text-indigo-900">
              <span className="font-semibold">Top Growing Category:</span> {insights.topGrowingCategory.category} spending {insights.topGrowingCategory.change > 0 ? "increased" : "decreased"} by{" "}
              <span className={insights.topGrowingCategory.change > 0 ? "font-semibold text-rose-700" : "font-semibold text-emerald-700"}>
                {Math.abs(insights.topGrowingCategory.change).toFixed(1)}%
              </span>{" "}
              ({insights.previousMonth} → {insights.currentMonth})
            </p>
          </div>
        ) : (
          <p className="mb-5 text-sm text-slate-500">Need at least 2 months of data for category drift analysis.</p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {insights.categoryChange.slice(0, 6).map((item) => (
            <div key={item.category} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-900">{item.category}</span>
                <span className={`text-sm font-semibold ${item.change >= 0 ? "text-rose-700" : "text-emerald-700"}`}>
                  {item.change >= 0 ? "+" : ""}{item.change.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">{formatAmount(item.previous)} → {formatAmount(item.current)}</div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Risk & Alerts" icon="⚠️" id="alerts">
          <div className="space-y-5">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900">Unusual Transactions</h4>
              {insights.unusualTransactions.length ? (
                <div className="space-y-2">
                  {insights.unusualTransactions.slice(0, 6).map((transaction, index) => (
                    <div key={`${transaction.Payee}-${index}`} className="flex items-start justify-between rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm">
                      <div>
                        <p className="font-medium text-slate-900">{transaction.Payee}</p>
                        <p className="text-slate-500">{transaction.Date} • {transaction.Category}</p>
                      </div>
                      <span className="font-semibold text-amber-900">{formatAmount(transaction.Amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-emerald-700">No unusual transactions detected.</p>
              )}
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900">Low Balance Periods</h4>
              {insights.lowBalancePeriods.length ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                  Found {insights.lowBalancePeriods.length} instances where the balance dropped below ₹1,000.
                </div>
              ) : (
                <p className="text-sm text-emerald-700">Balance never dropped below ₹1,000.</p>
              )}
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900">High Frequency Days</h4>
              {insights.highFrequencyDays.length ? (
                <div className="space-y-2">
                  {insights.highFrequencyDays.slice(0, 5).map((day) => (
                    <div key={day.date} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                      <span className="text-slate-700">{day.date}</span>
                      <span className="font-semibold text-slate-900">{day.count} transactions</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-emerald-700">No high-frequency spending days detected.</p>
              )}
            </div>
          </div>
        </Section>

        <Section title="Merchant Intelligence" icon="🏪" id="merchants">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900">Top Merchants by Amount</h4>
              <div className="space-y-2">
                {insights.topMerchants.map((merchant) => (
                  <div key={merchant.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <span className="truncate text-slate-700">{merchant.name}</span>
                    <span className="font-semibold text-slate-900">{formatAmount(merchant.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900">Frequent Merchants</h4>
              <div className="space-y-2">
                {insights.topFrequentMerchants.map((merchant) => (
                  <div key={merchant.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <span className="truncate text-slate-700">{merchant.name}</span>
                    <span className="font-semibold text-slate-900">{merchant.count} times</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <h4 className="text-sm font-semibold text-indigo-900">Hidden Spending</h4>
            <p className="mt-2 text-2xl font-semibold text-indigo-900">{formatAmount(insights.hiddenSpending.reduce((sum, item) => sum + item.Amount, 0))}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(insights.hiddenByCategory).map(([category, amount]) => (
                <span key={category} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-900">
                  {category}: ₹{amount.toFixed(0)}
                </span>
              ))}
            </div>
          </div>
        </Section>
      </div>

      <Section title="Payment Method Intelligence" icon="💳" id="payment">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-900">ATM vs Digital</h4>
            <div className="space-y-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">ATM Withdrawals</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{formatAmount((insights.paymentMethods.find((method) => method.name === "ATM") || {}).amount)}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Digital Payments</p>
                <p className="mt-1 text-xl font-semibold text-indigo-700">{formatAmount(totalDebit - ((insights.paymentMethods.find((method) => method.name === "ATM") || {}).amount || 0))}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-900">Preferred Payment Methods</h4>
            <div className="space-y-3">
              {insights.paymentMethods.slice(0, 6).map((method) => (
                <div key={method.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{method.name}</span>
                    <span className="text-slate-500">{method.percent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${Math.min(method.percent, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Savings & Efficiency" icon="📈" id="savings">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-6 text-center">
            <p className={`text-4xl font-semibold ${insights.savingsRate >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {insights.savingsRate.toFixed(1)}%
            </p>
            <p className="mt-2 text-sm text-slate-600">{insights.savingsRate >= 0 ? "You're saving money." : "Spending exceeds income."}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-900">Expense Ratio by Category</h4>
            <div className="space-y-3">
              {insights.expenseRatio.slice(0, 6).map((item) => (
                <div key={item.category}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{item.category}</span>
                    <span className="text-slate-500">{item.percent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-rose-500" style={{ width: `${Math.min(item.percent, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
