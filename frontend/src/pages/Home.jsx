import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Upload from "../components/Upload";
import Summary from "../components/Summary";
import Filters from "../components/Filters";
import Table from "../components/Table";
import DebugLogs from "../components/DebugLogs";
import ExportDialog from "../components/ExportDialog";
import Analytics from "../components/Analytics";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { downloadCSV } from "../api";
import PageTransition from "../components/PageTransition";
import { trackEvent } from "../analytics";

function getStatementKey(transactions) {
  if (!transactions || transactions.length === 0) return null;
  const sample = transactions.slice(0, 3).map((t) => `${t.Date}-${t.Payee}-${t.Amount}`).join("|");
  return `patbook-edits-${sample}`;
}

function loadEditsFromStorage(transactions) {
  const key = getStatementKey(transactions);
  if (!key) return new Map();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Map();
    const obj = JSON.parse(raw);
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

function saveEditsToStorage(transactions, edits) {
  const key = getStatementKey(transactions);
  if (!key) return;
  if (edits.size === 0) {
    localStorage.removeItem(key);
    return;
  }
  const obj = Object.fromEntries(edits);
  localStorage.setItem(key, JSON.stringify(obj));
}

export default function Home({ transactions, setTransactions }) {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("transactions");
  const [typeFilter, setTypeFilter] = useState("All");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editedTransactions, setEditedTransactions] = useState(() => loadEditsFromStorage(transactions));
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [logs, setLogs] = useState(null);
  const [summary, setSummary] = useState(null);
  const resultsRef = useRef(null);
  const { toasts, removeToast, success } = useToast();

  // Persist edits to localStorage
  useEffect(() => {
    saveEditsToStorage(transactions, editedTransactions);
  }, [editedTransactions, transactions]);

  // Warn before leaving with unsaved edits
  useEffect(() => {
    if (editedTransactions.size === 0) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "You have unsaved edits. Are you sure you want to leave?";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editedTransactions.size]);

  // Scroll to results when transactions arrive
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [transactions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setExportDialogOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const txns = useMemo(() => transactions || [], [transactions]);

  const getTransactionValue = (index, field) => {
    const edit = editedTransactions.get(`${index}-${field}`);
    return edit !== undefined ? edit.value : txns[index]?.[field];
  };

  const updateTransaction = (index, field, value) => {
    setEditedTransactions((prev) => {
      const newMap = new Map(prev);
      newMap.set(`${index}-${field}`, { value, timestamp: Date.now() });
      return newMap;
    });
  };

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

  const handleExport = (includeNotes) => {
    const txnsForExport = getTransactionsForExport();
    if (!includeNotes) {
      txnsForExport.forEach((t) => delete t.Notes);
    }
    downloadCSV(txnsForExport, includeNotes);
    setExportDialogOpen(false);
    success("CSV exported successfully!", "Export Complete");
    trackEvent("export_csv", "export", includeNotes ? "with_notes" : "without_notes");
  };

  const clearData = useCallback(() => {
    if (editedTransactions.size > 0) {
      if (!window.confirm("You have unsaved edits. Are you sure you want to clear all data?")) {
        return;
      }
    }
    setTransactions(null);
    setLogs(null);
    setSummary(null);
    setTypeFilter("All");
    setCategory("All");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setView("transactions");
    setEditedTransactions(new Map());
    success("Data cleared. Ready for a new statement.", "New Statement");
  }, [setTransactions, editedTransactions.size, success]);

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
    if (dateFrom) {
      data = data.filter((t) => t.Date >= dateFrom);
    }
    if (dateTo) {
      data = data.filter((t) => t.Date <= dateTo);
    }
    return data.map((t) => {
      const originalIndex = txns.indexOf(t);
      return {
        ...t,
        Category: getTransactionValue(originalIndex, "Category"),
        Notes: getTransactionValue(originalIndex, "Notes") || "",
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txns, editedTransactions, typeFilter, category, search, dateFrom, dateTo]);

  return (
    <PageTransition>
      <div className="space-y-12">
        <Toast toasts={toasts} removeToast={removeToast} />

        {/* Global Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-color)]/60 px-4 backdrop-blur-sm">
            <div className="glass-card flex w-full max-w-sm flex-col items-center gap-4 p-8">
              <svg className="h-12 w-12 animate-spin text-[var(--primary-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="font-medium text-[var(--text-main)]">Processing your statement...</p>
              <p className="text-sm text-[var(--text-muted)]">This may take a few moments</p>
            </div>
          </div>
        )}

        {/* Hero & Upload Section */}
        <section className="grid lg:grid-cols-2 gap-12 items-center pt-4 pb-12">
          <div className="text-left animate-[slideInLeft_0.6s_ease-out]">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--primary-accent)] mb-4">Financial Intelligence</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[var(--text-main)] mb-6 leading-[1.1]">
              Bank Statements,<br />
              <span className="text-[var(--primary-accent)] opacity-90">Beautifully</span> Analyzed.
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-muted)] mb-10 leading-relaxed max-w-lg">
              A stunning, secure, and intuitive way to extract insights from your PDF bank statements. Simply upload to unlock detailed analytics and easy categorization.
            </p>
            <div className="flex items-center gap-4 text-sm font-medium text-[var(--text-muted)]">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Privacy Focused
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Instant Results
              </span>
            </div>
          </div>

          <div className="relative animate-[slideInRight_0.6s_ease-out]">
            <div className="absolute -inset-4 bg-[var(--primary-accent)]/5 rounded-[3rem] blur-3xl pointer-events-none"></div>
            <div className="glass-card p-6 md:p-10 relative">
              <Upload
                onResult={(r) => {
                  setTransactions(r.transactions);
                  setLogs(r.logs);
                  setSummary(r.summary);
                  setTypeFilter("All");
                  setCategory("All");
                  setSearch("");
                  setDateFrom("");
                  setDateTo("");
                  setView("transactions");
                  const loaded = loadEditsFromStorage(r.transactions);
                  setEditedTransactions(loaded);
                  if (r.transactions && r.transactions.length > 0) {
                    success(`Parsed ${r.transactions.length} transactions successfully!`, "Statement Parsed");
                  }
                }}
                loading={loading}
                setLoading={setLoading}
              />
              {logs && <div className="mt-8 pt-6 border-t border-[var(--border-color)]"><DebugLogs logs={logs} /></div>}
            </div>
          </div>
        </section>

        {/* Data Section */}
        {txns && txns.length > 0 && (
          <section ref={resultsRef} className="space-y-8 animate-[fadeIn_0.5s_ease-out] scroll-mt-24">
            <div className="glass-card p-6 md:p-10">
              {/* Dashboard Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-[var(--border-color)]">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-main)]">Financial Analysis</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Real-time breakdown of your processed statement</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* New Statement button */}
                  <button
                    onClick={clearData}
                    className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 transition-all duration-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    New Statement
                  </button>

                  {/* Segmented Control Toggle */}
                  <div className="flex bg-[var(--bg-color)] p-1.5 rounded-2xl border border-[var(--border-color)] shadow-inner">
                    <button
                      onClick={() => { setView("transactions"); trackEvent("view_toggle", "dashboard", "transactions"); }}
                      className={`rounded-xl px-5 py-2 text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                        view === "transactions"
                          ? "bg-[var(--card-bg)] text-[var(--primary-accent)] shadow-sm"
                          : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                      Transactions
                    </button>
                    <button
                      onClick={() => { setView("analytics"); trackEvent("view_toggle", "dashboard", "analytics"); }}
                      className={`rounded-xl px-5 py-2 text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                        view === "analytics"
                          ? "bg-[var(--card-bg)] text-[var(--primary-accent)] shadow-sm"
                          : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      Analytics
                    </button>
                  </div>
                </div>
              </div>

              {view === "transactions" && (
                <div className="space-y-10">
                  <Summary summary={summary} />

                  <div className="sticky top-[72px] z-30 pt-4 pb-4 -mx-4 px-4 bg-[var(--bg-color)]/80 backdrop-blur-md border-y border-[var(--border-color)]">
                    <Filters
                      typeFilter={typeFilter}
                      setTypeFilter={setTypeFilter}
                      category={category}
                      setCategory={setCategory}
                      categories={categories}
                      search={search}
                      setSearch={setSearch}
                      onExport={() => setExportDialogOpen(true)}
                      dateFrom={dateFrom}
                      setDateFrom={setDateFrom}
                      dateTo={dateTo}
                      setDateTo={setDateTo}
                    />
                  </div>

                  <div className="rounded-2xl border border-[var(--border-color)] overflow-hidden bg-[var(--bg-color)]/30">
                    <Table
                      transactions={filtered}
                      allTransactions={txns}
                      updateTransaction={updateTransaction}
                    />
                  </div>
                </div>
              )}

              {view === "analytics" && (
                <div className="animate-[fadeIn_0.4s_ease-out]">
                  <Analytics transactions={txns} />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Export Dialog */}
        <ExportDialog
          isOpen={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          onExport={handleExport}
        />
      </div>
    </PageTransition>
  );
}
