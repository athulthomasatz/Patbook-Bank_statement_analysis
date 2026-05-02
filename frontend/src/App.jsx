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
    <div className="min-h-screen bg-gray-50 relative">
      {/* Global Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-700 font-medium">Processing your statement...</p>
            <p className="text-gray-500 text-sm">This may take a few moments</p>
          </div>
        </div>
      )}
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
                {/* Bank Mismatch Warning - No transactions found */}
                {transactions.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h3 className="text-sm font-semibold text-yellow-800 mb-1">No Transactions Found</h3>
                        <p className="text-sm text-yellow-700">
                          Possible bank mismatch. Please verify you selected the correct bank for this statement.
                        </p>
                        <p className="text-xs text-yellow-600 mt-2">
                          Check the Debug Logs below for more details about the parsing attempt.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {transactions.length > 0 ? (
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
                    <p className="text-gray-400 text-sm">No transactions to display</p>
                  </div>
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
