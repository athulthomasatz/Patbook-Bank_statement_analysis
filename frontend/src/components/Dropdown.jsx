import { useState, useRef, useEffect } from "react";

export default function Dropdown({ label, items, onSelect, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative inline-block w-full ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] px-4 py-2.5 text-sm font-medium text-[var(--text-main)] transition-all duration-300 hover:border-[var(--primary-accent)]/50 focus:border-[var(--primary-accent)] focus:ring-2 focus:ring-[var(--primary-accent)]/20"
      >
        <span className="truncate">{label}</span>
        <svg
          className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 text-[var(--text-muted)] ${isOpen ? 'rotate-180 text-[var(--primary-accent)]' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-full min-w-[200px] rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg shadow-[var(--card-shadow)] animate-[fadeIn_0.2s_ease-out] max-h-60 overflow-y-auto">
          {items.map((item) => (
            <button
              type="button"
              key={item.value}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(item.value);
                setIsOpen(false);
              }}
              className="block w-full px-4 py-3 text-left text-sm text-[var(--text-main)] transition-colors hover:bg-[var(--primary-accent)]/10 hover:text-[var(--primary-accent)] first:rounded-t-xl last:rounded-b-xl"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
