import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 w-full border-t border-[var(--border-color)] bg-[var(--bg-color)]/50 backdrop-blur-sm transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2 group w-fit">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary-accent)] text-white flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                P
              </div>
              <span className="text-xl font-bold tracking-tight text-[var(--text-main)]">
                Patbook
              </span>
            </Link>
            <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed">
              A calm, responsive, and secure way to read, analyze, and understand your bank statements.
            </p>
            <div className="flex gap-4 mt-2">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--text-main)] hover:-translate-y-1 transition-all duration-300">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--text-main)] hover:-translate-y-1 transition-all duration-300">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>

          {/* Spacer to keep 'Built With' in the third column */}
          <div className="hidden md:block"></div>

          {/* Credits & Tech Stack */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-[var(--text-main)] tracking-wide">Built With</h3>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-lg bg-[var(--card-bg)] px-3 py-1.5 text-xs font-black text-[var(--text-main)] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1)] border border-[var(--border-color)]">
                React.js
              </span>
              <span className="inline-flex items-center rounded-lg bg-[var(--card-bg)] px-3 py-1.5 text-xs font-black text-[var(--text-main)] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1)] border border-[var(--border-color)]">
                FastAPI
              </span>
              <span className="inline-flex items-center rounded-lg bg-[var(--card-bg)] px-3 py-1.5 text-xs font-black text-[var(--text-main)] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1)] border border-[var(--border-color)]">
                Tailwind CSS
              </span>
              <span className="inline-flex items-center rounded-lg bg-[var(--card-bg)] px-3 py-1.5 text-xs font-black text-[var(--text-main)] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1)] border border-[var(--border-color)]">
                Vite
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              <p className="text-xs text-[var(--text-muted)]">
                Developed by <a href="https://athulthomasatz.github.io/" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-[var(--primary-accent)] transition-colors">Athul Thomas</a> and <a href="https://www.booleantechnologies.in/" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-[var(--primary-accent)] transition-colors">Boolean technologies</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
