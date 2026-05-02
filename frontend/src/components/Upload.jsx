import { useState } from "react";

const BANKS = ["HDFC", "Canara", "Union Bank", "Federal Bank"];

export default function Upload({ onResult, loading, setLoading }) {
  const [bank, setBank] = useState("HDFC");
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setLoading(true);

    try {
      const { parseStatement } = await import("../api");
      const result = await parseStatement(file, bank, password);
      onResult(result);
    } catch (err) {
      setError(err.message);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Bank selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
        <select
          value={bank}
          onChange={(e) => setBank(e.target.value)}
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
            onChange={(e) => setFile(e.target.files[0])}
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
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Processing..." : "Process Statement"}
      </button>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </form>
  );
}
