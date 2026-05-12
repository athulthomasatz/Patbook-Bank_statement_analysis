import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo2 from "./Logo2";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Analytics", path: "/analytics" },
  { label: "About", path: "/about" },
];

export default function Navbar({ theme, toggleTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${scrolled
        ? "bg-[var(--card-bg)]/80 backdrop-blur-md shadow-[var(--card-shadow)] border-b border-[var(--border-color)]"
        : "bg-transparent border-b border-transparent"
        }`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="hover:opacity-85 transition-opacity"
            aria-label="Patbook — Bank Statement Analyzer"
          >
            <Logo2 height={40} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors ${isActive ? "text-[var(--primary-accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-muted)]/10 rounded-full"
                    }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-[var(--primary-accent)] rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-muted)]/10 transition-all duration-300 group overflow-hidden active:scale-90"
              aria-label="Toggle theme"
            >
              <div className="relative w-5 h-5 flex items-center justify-center pointer-events-none">
                {/* Sun Icon (Dark Theme Active) */}
                <div
                  className={`absolute transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${theme === "dark"
                    ? "translate-y-0 rotate-0 opacity-100 scale-100"
                    : "translate-y-8 -rotate-180 opacity-0 scale-50"
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                {/* Moon Icon (Light Theme Active) */}
                <div
                  className={`absolute transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${theme === "light"
                    ? "translate-y-0 rotate-0 opacity-100 scale-100"
                    : "-translate-y-8 rotate-180 opacity-0 scale-50"
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
              </div>
            </button>



            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--text-muted)]/10"
              aria-label="Toggle menu"
            >
              <svg className={`h-6 w-6 transition-transform ${mobileMenuOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? "max-h-64 border-b border-[var(--border-color)] bg-[var(--card-bg)]/95 backdrop-blur-md" : "max-h-0"
          }`}
      >
        <nav className="flex flex-col px-4 py-3 gap-2">
          {navLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-lg px-4 py-3 text-sm font-medium ${location.pathname === item.path
                ? "bg-[var(--primary-accent)]/10 text-[var(--primary-accent)]"
                : "text-[var(--text-main)] hover:bg-[var(--text-muted)]/10"
                }`}
            >
              {item.label}
            </Link>
          ))}

        </nav>
      </div>
    </header>
  );
}
