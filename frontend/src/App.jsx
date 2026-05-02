import { useState, useMemo } from "react";
import Upload from "./components/Upload";
import Summary from "./components/Summary";
import Filters from "./components/Filters";
import Table from "./components/Table";
import DebugLogs from "./components/DebugLogs";
import ExportDialog from "./components/ExportDialog";
import Analytics from "./components/Analytics";
import { downloadCSV } from "./api";

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("transactions"); // "transactions" | "analytics"
  const [typeFilter, setTypeFilter] = useState("All");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [editedTransactions, setEditedTransactions] = useState(new Map());
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const transactions = result?.transactions || [];

  // Helper to get edited value or original value
  const getTransactionValue = (index, field) => {
    const edit = editedTransactions.get(`${index}-${field}`);
    return edit !== undefined ? edit.value : transactions[index]?.[field];
  };

  // Update a transaction field
  const updateTransaction = (index, field, value) => {
    setEditedTransactions(prev => {
      const newMap = new Map(prev);
      newMap.set(`${index}-${field}`, { value, timestamp: Date.now() });
      return newMap;
    });
  };

  // Apply edits to transactions for export
  const getTransactionsForExport = () => {
    return transactions.map((t, idx) => {
      const editedCat = editedTransactions.get(`${idx}-Category`);
      const editedNotes = editedTransactions.get(`${idx}-Notes`);
      const result = { ...t };
      if (editedCat) result.Category = editedCat.value;
      if (editedNotes) result.Notes = editedNotes.value;
      return result;
    });
  };

  // Handle export with include notes flag
  const handleExport = (includeNotes) => {
    const txnsForExport = getTransactionsForExport();
    if (!includeNotes) {
      txnsForExport.forEach(t => delete t.Notes);
    }
    downloadCSV(txnsForExport, includeNotes);
    setExportDialogOpen(false);
  };

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
    // Apply edits to filtered transactions
    return data.map((t, idx) => {
      const originalIndex = transactions.indexOf(t);
      return {
        ...t,
        Category: getTransactionValue(originalIndex, "Category"),
        Notes: getTransactionValue(originalIndex, "Notes") || "",
      };
    });
  }, [transactions, editedTransactions, typeFilter, category, search]);

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
        {/* Navigation Tabs */}
        {result && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setView("transactions")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === "transactions"
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setView("analytics")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === "analytics"
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Analytics
            </button>
          </div>
        )}

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
                {view === "transactions" ? (
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
                      onExport={() => setExportDialogOpen(true)}
                    />
                    <Table
                      transactions={filtered}
                      allTransactions={transactions}
                      updateTransaction={updateTransaction}
                      getTransactionValue={getTransactionValue}
                    />
                  </>
                ) : (
                  <Analytics transactions={transactions} />
                )}
              </>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <p className="text-gray-400 text-sm">Upload a bank statement PDF to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
}
