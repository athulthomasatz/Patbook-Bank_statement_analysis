import PageTransition from "../components/PageTransition";

export default function About() {
  return (
    <PageTransition>
      <div className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_60px_rgba(25,28,30,0.08)] sm:p-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">About Pattubook</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Built to make statement review feel calm and clear.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Pattubook turns bank PDFs into a readable, editable transaction view, with a soft interface that stays usable on laptops, tablets, and small phones. The goal is to keep the important decisions front and center without crowding the page.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Clear flow</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Upload, review, filter, and export in a straight path with minimal visual noise.</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Responsive layout</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">The layout stacks naturally on mobile and expands into a clean two-column dashboard on larger screens.</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Gentle contrast</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Soft surfaces, rounded corners, and restrained accent colors make the screen easier to scan for long sessions.</p>
        </div>
      </div>
      </div>
    </PageTransition>
  );
}
