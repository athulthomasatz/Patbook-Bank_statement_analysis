import { useState, useMemo } from "react";
import Upload from "../components/Upload";
import Summary from "../components/Summary";
import Filters from "../components/Filters";
import Table from "../components/Table";
import DebugLogs from "../components/DebugLogs";
import ExportDialog from "../components/ExportDialog";
import Analytics from "../components/Analytics";
import { downloadCSV } from "../api";

export default function Home({ transactions, setTransactions }) {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("transactions"); // "transactions" | "analytics"
  const [typeFilter, setTypeFilter] = useState("All");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [editedTransactions, setEditedTransactions] = useState(new Map());
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [logs, setLogs] = useState(null);
  const [summary, setSummary] = useState(null);

  const txns = transactions || [];

  // Helper to get edited value or original value
  const getTransactionValue = (index, field) => {
    const edit = editedTransactions.get(`${index}-${field}`);
    return edit !== undefined ? edit.value : txns[index]?.[field];
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
    return txns.map((t, idx) => {
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
    if (!txns.length) return ["All"];
    const cats = [...new Set(txns.map((t) => t.Category))];
    return ["All", ...cats.sort()];
  }, [txns]);

  const filtered = useMemo(() => {
    let data = txns;
    if (typeFilter !== "All") data = data.filter((t) => t.Type === typeFilter);
    if (category !== "All") data = data.filter((t) => t.Category === category);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((t) => t.Payee?.toLowerCase().includes(q));
    }
    // Apply edits to filtered transactions
    return data.map((t, idx) => {
      const originalIndex = txns.indexOf(t);
      return {
        ...t,
        Category: getTransactionValue(originalIndex, "Category"),
        Notes: getTransactionValue(originalIndex, "Notes") || "",
      };
    });
  }, [txns, editedTransactions, typeFilter, category, search]);

  return (
    <div className="space-y-8">
      {/* Global Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-white/60 bg-white p-8 shadow-[0_24px_80px_rgba(25,28,30,0.18)]">
            <svg className="h-12 w-12 animate-spin text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="font-medium text-slate-800">Processing your statement...</p>
            <p className="text-sm text-slate-500">This may take a few moments</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_60px_rgba(25,28,30,0.08)]">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Start here</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Upload a statement and keep the view uncluttered.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">A clean flow for reviewing transactions, checking analytics, and exporting data without visual noise.</p>
          </div>

          <Upload
            onResult={(r) => {
              setTransactions(r.transactions);
              setLogs(r.logs);
              setSummary(r.summary);
              setTypeFilter("All");
              setCategory("All");
              setSearch("");
              setView("transactions");
            }}
            loading={loading}
            setLoading={setLoading}
          />

          {logs && <DebugLogs logs={logs} />}
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_60px_rgba(25,28,30,0.08)] sm:p-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Eye-friendly finance</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">A simple, responsive dashboard for Pattubook.</h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The layout keeps the important actions visible, uses soft contrast, and adapts cleanly to smaller screens so the statement workflow stays easy to scan.
              </p>
            </div>

            {txns && txns.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-slate-50 p-2">
                <button
                  onClick={() => setView("transactions")}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    view === "transactions"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  Transactions
                </button>
                <button
                  onClick={() => setView("analytics")}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    view === "analytics"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  Analytics
                </button>
              </div>
            )}
          </div>

          {txns ? (
            <div className="space-y-6">
              {txns.length === 0 && (
                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6 shadow-[0_12px_40px_rgba(25,28,30,0.06)]">
                  <div className="flex items-start gap-3">
                    <svg className="h-6 w-6 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-semibold text-amber-900">No transactions found</h3>
                      <p className="mt-1 text-sm text-amber-800">Possible bank mismatch. Please verify you selected the correct bank for this statement.</p>
                      <p className="mt-2 text-xs text-amber-700">Check the Debug Logs below for more details about the parsing attempt.</p>
                    </div>
                  </div>
                </div>
              )}

              {txns.length > 0 ? (
                view === "transactions" ? (
                  <div className="space-y-6">
                    <div className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_60px_rgba(25,28,30,0.08)]">
                      <Summary summary={summary} />
                    </div>
                    <div className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_60px_rgba(25,28,30,0.08)]">
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
                    </div>
                    <div className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-[0_18px_60px_rgba(25,28,30,0.08)]">
                      <Table
                        transactions={filtered}
                        allTransactions={txns}
                        updateTransaction={updateTransaction}
                        getTransactionValue={getTransactionValue}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_60px_rgba(25,28,30,0.08)]">
                    <Analytics transactions={txns} />
                  </div>
                )
              ) : (
                <div className="rounded-[1.5rem] border border-white/80 bg-white p-12 text-center shadow-[0_18px_60px_rgba(25,28,30,0.08)]">
                  <p className="text-sm text-slate-500">No transactions to display</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 p-12 text-center shadow-[0_18px_60px_rgba(25,28,30,0.05)]">
              <p className="text-sm text-slate-500">Upload a bank statement PDF to get started.</p>
            </div>
          )}
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
