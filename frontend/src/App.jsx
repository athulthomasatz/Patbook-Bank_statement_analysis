import { useState, useMemo } from "react";
import Upload from "./components/Upload";
import Summary from "./components/Summary";
import Filters from "./components/Filters";
import Table from "./components/Table";
import DebugLogs from "./components/DebugLogs";

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("All");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const transactions = result?.transactions || [];

  const categories = useMemo(() => {
    if (!transactions.length) return ["All"];
    const cats = [...new Set(transactions.map((t) => t.Category))];
    return ["All", ...cats.sort()];
  }, [transactions]);

  const filtered = useMemo(() => {
    let data = transactions;
    if (typeFilter !== "All") data = data.filter((t) => t.Type === typeFilter);
    if (category !== "All") data = data.filter((t) => t.Category === category);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((t) => t.Payee?.toLowerCase().includes(q));
    }
    return data;
  }, [transactions, typeFilter, category, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Bank Statement Analyzer</h1>
          <p className="text-sm text-gray-500 mt-0.5">Upload your bank statement PDF and get a clean transaction list</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
          {/* Sidebar: Upload */}
          <div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Upload Statement</h2>
              <Upload
                onResult={(r) => {
                  setResult(r);
                  setTypeFilter("All");
                  setCategory("All");
                  setSearch("");
                }}
                loading={loading}
                setLoading={setLoading}
              />
            </div>
            {result?.logs && <DebugLogs logs={result.logs} />}
          </div>

          {/* Main content */}
          <div className="space-y-5">
            {result ? (
              <>
                <Summary summary={result.summary} />
                <Filters
                  typeFilter={typeFilter}
                  setTypeFilter={setTypeFilter}
                  category={category}
                  setCategory={setCategory}
                  categories={categories}
                  search={search}
                  setSearch={setSearch}
                />
                <Table transactions={filtered} allTransactions={transactions} />
              </>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <p className="text-gray-400 text-sm">Upload a bank statement PDF to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
