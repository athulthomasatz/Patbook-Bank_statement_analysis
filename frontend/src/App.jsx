import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import AnalyticsPage from "./pages/Analytics";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { trackPageView } from "./analytics";

function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
  return null;
}

export default function App() {
  const [transactions, setTransactions] = useState(null);
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, fallback to system preference
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    // Apply theme class to html element
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <BrowserRouter>
      <RouteTracker />
      <div className="min-h-screen flex flex-col bg-[var(--bg-color)] text-[var(--text-main)] transition-colors duration-300">
        <Navbar theme={theme} toggleTheme={toggleTheme} />

        <main className="flex-1 mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
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
