import { Link } from "react-router-dom";
import PageTransition from "../components/PageTransition";

export default function NotFound() {
  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="relative mb-8">
          <div className="absolute -inset-8 bg-[var(--primary-accent)]/10 rounded-full blur-3xl"></div>
          <div className="relative text-8xl font-bold text-[var(--primary-accent)] opacity-80">404</div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-4">Page Not Found</h1>
        <p className="text-[var(--text-muted)] max-w-md mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Check the URL or head back home.
        </p>
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
    </PageTransition>
  );
}
