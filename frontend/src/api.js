const API = "/api";

export async function getBanks() {
  const res = await fetch(`${API}/banks`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function parseStatement(file, bank, password = "") {
  const form = new FormData();
  form.append("file", file);
  form.append("bank", bank);
  form.append("password", password);

  const res = await fetch(`${API}/parse`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

export function downloadCSV(transactions, includeNotes = false) {
  if (!transactions.length) return;

  const headers = includeNotes
    ? ["Date", "Payee", "Category", "Type", "Amount", "Balance", "Bank", "Narration", "Notes"]
    : ["Date", "Payee", "Category", "Type", "Amount", "Balance", "Bank", "Narration"];

  const rows = transactions.map((t) =>
    headers.map((h) => {
      const v = t[h] ?? "";
      return String(v).includes(",") ? `"${v}"` : v;
    }).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.csv";
  a.click();
  URL.revokeObjectURL(url);
}
