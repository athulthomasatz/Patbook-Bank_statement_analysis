import Analytics from "../components/Analytics";
import PageTransition from "../components/PageTransition";

export default function AnalyticsPage({ transactions }) {
  return (
    <PageTransition>
      <div className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_60px_rgba(25,28,30,0.08)] sm:p-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Patbook Analytics</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">A dedicated space for trends and spending patterns.</h2>
      </div>

      <div className="mt-6">
        {transactions && transactions.length > 0 ? (
          <Analytics transactions={transactions} />
        ) : (
          <div className="rounded-2xl bg-slate-50 p-8 text-sm leading-6 text-slate-500">
            Upload a statement first to see charts, category trends, and balance insights here.
          </div>
        )}
      </div>
      </div>
    </PageTransition>
  );
}
