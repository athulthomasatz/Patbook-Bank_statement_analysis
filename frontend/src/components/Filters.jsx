export default function Filters({ typeFilter, setTypeFilter, category, setCategory, categories, search, setSearch }) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Type buttons */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200">
        {["All", "Credit", "Debit"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              typeFilter === t
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Category dropdown */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {categories.map((c) => (
          <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
        ))}
      </select>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search payee..."
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
