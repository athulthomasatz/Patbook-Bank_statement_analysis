import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import AnalyticsPage from "./pages/Analytics";
import Footer from "./components/Footer";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Pattubook Analytics", path: "/analytics" },
];

function Navigation({ mobile = false, onLinkClick = () => {} }) {
  const location = useLocation();

  return (
    <nav aria-label="Primary" className={`flex ${mobile ? "flex-col gap-1" : "flex-nowrap items-center gap-3"}`}>
      {navLinks.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onLinkClick}
          className={`rounded-full px-4 py-2 text-sm font-medium transform-gpu transition-all duration-200 ease-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
            location.pathname === item.path
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          } ${mobile ? "block w-full text-left" : ""}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default function App() {
  const [transactions, setTransactions] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(224,232,255,0.55),_transparent_45%),linear-gradient(180deg,_#f7f9fb_0%,_#eef3f8_100%)] text-slate-900">
        <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <Link to="/" className="text-2xl font-semibold tracking-tight text-slate-900">
                  Pattubook
                </Link>
                <p className="text-sm text-slate-500">A calm, responsive way to read bank statements.</p>
              </div>
              
              {/* Hamburger menu button - only visible on mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Toggle menu"
              >
                <svg
                  className={`h-6 w-6 transition-transform ${mobileMenuOpen ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex md:items-center md:justify-end">
              <Navigation />
            </div>
          </div>

          {/* Mobile navigation */}
          {mobileMenuOpen && (
            <div className="border-t border-slate-200 bg-white/95 px-4 py-3 md:hidden">
              <Navigation mobile onLinkClick={() => setMobileMenuOpen(false)} />
            </div>
          )}
        </header>

        <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <Routes>
            <Route path="/" element={<Home transactions={transactions} setTransactions={setTransactions} />} />
            <Route path="/about" element={<About />} />
            <Route path="/analytics" element={<AnalyticsPage transactions={transactions} />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
