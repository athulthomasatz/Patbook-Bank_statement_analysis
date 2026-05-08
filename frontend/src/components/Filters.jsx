import Dropdown from "./Dropdown";

export default function Filters({ typeFilter, setTypeFilter, category, setCategory, categories, search, setSearch, onExport }) {
  return (
    <div className="flex flex-col md:flex-row flex-wrap items-center gap-4">
      {/* Type buttons */}
      <div className="flex overflow-hidden rounded-full border border-[var(--border-color)] bg-[var(--bg-color)] p-1 w-full md:w-auto">
        {["All", "Credit", "Debit"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`flex-1 md:flex-none rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
              typeFilter === t
                ? "bg-[var(--primary-accent)] text-white shadow-md shadow-[var(--primary-accent)]/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-muted)]/10"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Category dropdown */}
      <div className="w-full md:w-auto min-w-[200px] relative z-10">
        <Dropdown
          label={category === "All" ? "All Categories" : category}
          items={categories.map((c) => ({ 
            label: c === "All" ? "All Categories" : c, 
            value: c 
          }))}
          onSelect={setCategory}
        />
      </div>

      {/* Search */}
      <div className="relative flex-1 w-full md:w-auto min-w-[200px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search payee..."
          className="w-full rounded-full border border-[var(--border-color)] bg-[var(--bg-color)] pl-10 pr-4 py-2.5 text-sm text-[var(--text-main)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--primary-accent)] focus:ring-2 focus:ring-[var(--primary-accent)]/20"
        />
      </div>

      {/* Download CSV button */}
      <button
        onClick={onExport}
        className="w-full md:w-auto flex items-center justify-center gap-2 rounded-full border border-[var(--primary-accent)] bg-[var(--primary-accent)]/10 px-5 py-2.5 text-sm font-semibold text-[var(--primary-accent)] transition-all duration-300 hover:bg-[var(--primary-accent)] hover:text-white hover:shadow-lg hover:shadow-[var(--primary-accent)]/20"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download CSV
      </button>
    </div>
  );
}
