import { useState, useEffect } from "react";
import { getBanks } from "../api";
import Dropdown from "./Dropdown";
import { trackEvent } from "../analytics";

export default function Upload({ onResult, loading, setLoading }) {
  const [bank, setBank] = useState("HDFC");
  const [banks, setBanks] = useState(["HDFC"]);
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setLoading(true);
    setStatus("loading");
    trackEvent("upload_statement", "upload", bank);

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        {/* Bank selector */}
        <div className="relative">
          <label className="mb-1.5 block text-sm font-semibold text-[var(--text-main)]">Select Bank</label>
          <Dropdown
            label={bank}
            items={banks.map(b => ({ label: b, value: b }))}
            onSelect={(selectedBank) => {
              setBank(selectedBank);
              setError(null);
              setStatus("idle");
              trackEvent("select_bank", "upload", selectedBank);
            }}
          />
        </div>

        {/* Password */}
        <div className="relative">
          <label className="mb-1.5 block text-sm font-semibold text-[var(--text-main)]">
            Password <span className="font-normal text-[var(--text-muted)]">(if encrypted)</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] px-4 py-2.5 text-sm text-[var(--text-main)] outline-none transition-all focus:border-[var(--primary-accent)] focus:ring-2 focus:ring-[var(--primary-accent)]/20 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--primary-accent)] transition-colors"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* File upload */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[var(--text-main)]">Statement PDF</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input").click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
            dragOver 
              ? "border-[var(--primary-accent)] bg-[var(--primary-accent)]/5 scale-[1.02]" 
              : "border-[var(--border-color)] bg-[var(--bg-color)]/50 hover:border-[var(--primary-accent)]/50 hover:bg-[var(--bg-color)]"
          }`}
        >
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-10 h-10 text-[var(--primary-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-medium text-[var(--text-main)]">{file.name}</p>
              <p className="text-sm text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className={`p-3 rounded-full bg-[var(--primary-accent)]/10 text-[var(--primary-accent)] transition-transform duration-300 ${dragOver ? 'scale-110' : ''}`}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[var(--text-main)]">Click to upload or drag and drop</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">PDF bank statements only</p>
              </div>
            </div>
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

      {/* Submit */}
      <button
        type="submit"
        disabled={!file || loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary-accent)] py-3.5 font-medium text-white transition-all duration-300 hover:bg-[var(--primary-accent-hover)] hover:shadow-lg hover:shadow-[var(--primary-accent)]/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none hover:-translate-y-0.5"
      >
        {loading ? (
          <>
            <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Statement...
          </>
        ) : (
          <>
            Upload & Analyze
            <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </>
        )}
      </button>

      {/* Status Messages */}
      {status === "success" && !error && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200/50 bg-emerald-50/50 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 animate-[slideIn_0.3s_ease-out]">
          <div className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-medium">Statement processed successfully!</span>
        </div>
      )}

      {error && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm animate-[slideIn_0.3s_ease-out] ${
          status === "warning"
            ? "border-amber-200/50 bg-amber-50/50 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400"
            : "border-rose-200/50 bg-rose-50/50 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400"
        }`}>
          <div className={`rounded-full p-1 mt-0.5 flex-shrink-0 ${
            status === "warning" ? "bg-amber-100 dark:bg-amber-500/20" : "bg-rose-100 dark:bg-rose-500/20"
          }`}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span className="font-medium">{error}</span>
        </div>
      )}
    </form>
  );
}
