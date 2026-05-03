import { useState, useEffect } from "react";
import { getBanks } from "../api";

export default function Upload({ onResult, loading, setLoading }) {
  const [bank, setBank] = useState("HDFC");
  const [banks, setBanks] = useState(["HDFC"]);
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"

  // Fetch banks on mount
  useEffect(() => {
    async function fetchBanks() {
      try {
        const fetchedBanks = await getBanks();
        setBanks(fetchedBanks);
        // Set default bank to first bank if current selection is not in list
        if (fetchedBanks.length > 0 && !fetchedBanks.includes(bank)) {
          setBank(fetchedBanks[0]);
        }
      } catch (err) {
        console.error("Failed to fetch banks:", err);
      }
    }
    fetchBanks();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setLoading(true);
    setStatus("loading");

    try {
      const { parseStatement } = await import("../api");
      const result = await parseStatement(file, bank, password);

      // Check if no transactions were parsed - possible bank mismatch
      if (result.transactions && result.transactions.length === 0) {
        setStatus("warning");
        setError("No transactions found. Possible bank mismatch - please verify you selected the correct bank for this statement.");
        onResult(result);
      } else {
        setStatus("success");
        onResult(result);
      }
    } catch (err) {
      setStatus("error");
      setError(err.message || "Failed to process statement. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") setFile(f);
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      setError(null);
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Bank selector */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Bank</label>
        <div className="relative">
          <select
            value={bank}
            onChange={(e) => {
              setBank(e.target.value);
              setError(null);
              setStatus("idle");
            }}
            className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          >
            {banks.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* File upload */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Statement PDF</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input").click()}
          className={`cursor-pointer rounded-3xl border-2 border-dashed p-6 text-center transition-colors ${
            dragOver ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
          }`}
        >
          {file ? (
            <p className="text-sm text-slate-700">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
          ) : (
            <p className="text-sm text-slate-500">Drop PDF here or click to browse</p>
          )}
          <input
            id="file-input"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Password <span className="text-slate-400">(if encrypted)</span>
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Optional"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!file || loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          "Process Statement"
        )}
      </button>

      {/* Status Messages */}
      {status === "success" && !error && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Statement processed successfully!
        </div>
      )}

      {error && (
        <div className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
          status === "warning"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-rose-200 bg-rose-50 text-rose-700"
        }`}>
          <svg className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
            status === "warning" ? "text-amber-600" : "text-rose-600"
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}
    </form>
  );
}
