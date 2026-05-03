export default function Filters({ typeFilter, setTypeFilter, category, setCategory, categories, search, setSearch, onExport }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Type buttons */}
      <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-1">
        {["All", "Credit", "Debit"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              typeFilter === t
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Category dropdown */}
      <div className="relative min-w-[200px]">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search payee..."
        className="min-w-[180px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
      />

      {/* Download CSV button */}
      <button
        onClick={onExport}
        className="rounded-2xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
      >
        Download CSV
      </button>
    </div>
  );
}
