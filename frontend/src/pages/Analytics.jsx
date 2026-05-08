import Analytics from "../components/Analytics";
import PageTransition from "../components/PageTransition";

export default function AnalyticsPage({ transactions }) {
  return (
    <PageTransition>
      <div className="glass-card p-6 md:p-8 animate-[fadeIn_0.5s_ease-out]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary-accent)]">Patbook Analytics</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-main)]">A dedicated space for trends and spending patterns.</h2>
        </div>

        <div className="mt-8">
          {transactions && transactions.length > 0 ? (
            <Analytics transactions={transactions} />
          ) : (
            <div className="rounded-2xl bg-[var(--bg-color)] border border-[var(--border-color)] p-12 text-center text-sm leading-6 text-[var(--text-muted)] flex flex-col items-center justify-center min-h-[300px]">
              <svg className="w-16 h-16 text-[var(--text-muted)] opacity-50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Upload a statement first to see charts, category trends, and balance insights here.
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
