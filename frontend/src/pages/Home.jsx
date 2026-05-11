import { useState, useMemo, useRef, useEffect } from "react";
import Upload from "../components/Upload";
import Summary from "../components/Summary";
import Filters from "../components/Filters";
import Table from "../components/Table";
import DebugLogs from "../components/DebugLogs";
import ExportDialog from "../components/ExportDialog";
import Analytics from "../components/Analytics";
import { downloadCSV } from "../api";
import PageTransition from "../components/PageTransition";
import { trackEvent } from "../analytics";

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
  const resultsRef = useRef(null);

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [transactions]);

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
    trackEvent("export_csv", "export", includeNotes ? "with_notes" : "without_notes");
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
    return data.map((t) => {
      const originalIndex = txns.indexOf(t);
      return {
        ...t,
        Category: getTransactionValue(originalIndex, "Category"),
        Notes: getTransactionValue(originalIndex, "Notes") || "",
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txns, editedTransactions, typeFilter, category, search]);

  return (
    <PageTransition>
      <div className="space-y-12">
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

        {/* Hero & Upload Section - Redesigned Split Layout */}
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
            {/* Ambient background glow */}
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
                  setView("transactions");
                }}
                loading={loading}
                setLoading={setLoading}
              />
              {logs && <div className="mt-8 pt-6 border-t border-[var(--border-color)]"><DebugLogs logs={logs} /></div>}
            </div>
          </div>
        </section>

        {/* Data Section - Redesigned Dashboard Layout */}
        {txns && (
          <section ref={resultsRef} className="space-y-8 animate-[fadeIn_0.5s_ease-out] scroll-mt-24">
            {txns.length === 0 ? (
              <div className="glass-card p-8 border-amber-200/50 bg-amber-50/5">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <svg className="h-6 w-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400">No transactions found</h3>
                    <p className="mt-1 text-sm text-[var(--text-muted)] leading-relaxed">Possible bank mismatch. Please verify you selected the correct bank for this statement.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card p-6 md:p-10">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-[var(--border-color)]">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-main)]">Financial Analysis</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Real-time breakdown of your processed statement</p>
                  </div>
                  
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

                {view === "transactions" && (
                  <div className="space-y-10">
                    <Summary summary={summary} />
                    
                    <div className="pt-6 border-t border-[var(--border-color)]">
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
            )}
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
