import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import AnalyticsPage from "./pages/Analytics";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Pattubook Analytics", path: "/analytics" },
];

function Navigation() {
  const location = useLocation();

  return (
    <nav aria-label="Primary" className="flex flex-wrap items-center gap-2">
      {navLinks.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            location.pathname === item.path
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default function App() {
  const [transactions, setTransactions] = useState(null);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(224,232,255,0.55),_transparent_45%),linear-gradient(180deg,_#f7f9fb_0%,_#eef3f8_100%)] text-slate-900">
        <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <Link to="/" className="text-2xl font-semibold tracking-tight text-slate-900">
                Pattubook
              </Link>
              <p className="mt-1 text-sm text-slate-500">A calm, responsive way to read bank statements.</p>
            </div>

            <Navigation />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <Routes>
            <Route path="/" element={<Home transactions={transactions} setTransactions={setTransactions} />} />
            <Route path="/about" element={<About />} />
            <Route path="/analytics" element={<AnalyticsPage transactions={transactions} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
