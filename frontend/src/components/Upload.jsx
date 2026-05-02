import { useState } from "react";

const BANKS = ["HDFC", "Canara", "Union Bank", "Federal Bank"];

export default function Upload({ onResult, loading, setLoading }) {
  const [bank, setBank] = useState("HDFC");
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"

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
        <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
        <select
          value={bank}
          onChange={(e) => {
            setBank(e.target.value);
            setError(null);
            setStatus("idle");
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {BANKS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* File upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Statement PDF</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input").click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          {file ? (
            <p className="text-sm text-gray-700">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
          ) : (
            <p className="text-sm text-gray-500">Drop PDF here or click to browse</p>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password <span className="text-gray-400">(if encrypted)</span>
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Optional"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!file || loading}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Statement processed successfully!
        </div>
      )}

      {error && (
        <div className={`border px-4 py-3 rounded-lg text-sm flex items-start gap-2 ${
          status === "warning"
            ? "bg-yellow-50 border-yellow-200 text-yellow-800"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            status === "warning" ? "text-yellow-600" : "text-red-600"
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}
    </form>
  );
}
