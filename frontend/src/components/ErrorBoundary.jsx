import { Component } from "react";
import { Link } from "react-router-dom";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="relative mb-8">
            <div className="absolute -inset-8 bg-rose-500/10 rounded-full blur-3xl"></div>
            <div className="relative text-8xl font-bold text-rose-500 opacity-80">500</div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-4">Something Went Wrong</h1>
          <p className="text-[var(--text-muted)] max-w-md mb-8 leading-relaxed">
            An unexpected error occurred. Try refreshing the page or return home.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] px-6 py-3 font-medium text-[var(--text-main)] transition-all duration-300 hover:border-[var(--primary-accent)]/50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Page
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary-accent)] px-6 py-3 font-medium text-white transition-all duration-300 hover:bg-[var(--primary-accent-hover)] hover:shadow-lg hover:shadow-[var(--primary-accent)]/20 hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
