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
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-900 transition-all hover:bg-indigo-100 hover:border-indigo-300"
      >
        {label}
        <svg
          className={`h-4 w-4 transition-transform text-indigo-600`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-indigo-200 bg-white shadow-lg">
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
              className="block w-full px-4 py-3 text-left text-sm text-indigo-900 transition-colors hover:bg-indigo-50 hover:text-indigo-950 first:rounded-t-2xl last:rounded-b-2xl"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
