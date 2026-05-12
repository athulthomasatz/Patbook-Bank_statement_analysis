/**
 * Logo1 — Magnifying Glass + Bars (Modern SaaS)
 * Icon: Magnifying glass with 3 rising bar chart bars inside the lens.
 * All colors use CSS variables for automatic theme switching.
 */
export default function Logo1({ iconOnly = false, height = 40 }) {
  return (
    <div
      className="patbook-logo"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        height: `${height}px`,
        userSelect: "none",
      }}
    >
      {/* Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 44 44"
        height={height}
        width={height}
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Lens background circle */}
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="var(--logo-accent-bg, #EFF6FF)"
          stroke="var(--logo-accent, #2563EB)"
          strokeWidth="2.2"
        />

        {/* Bar 1 — shortest */}
        <rect
          x="9"
          y="21"
          width="3.5"
          height="5"
          rx="1"
          fill="var(--logo-accent, #2563EB)"
          opacity="0.55"
        />
        {/* Bar 2 — medium */}
        <rect
          x="14.5"
          y="18"
          width="3.5"
          height="8"
          rx="1"
          fill="var(--logo-accent, #2563EB)"
          opacity="0.75"
        />
        {/* Bar 3 — tallest */}
        <rect
          x="20"
          y="14"
          width="3.5"
          height="12"
          rx="1"
          fill="var(--logo-accent, #2563EB)"
        />

        {/* Clip bars to lens */}
        <clipPath id="lens-clip-1">
          <circle cx="18" cy="18" r="12.5" />
        </clipPath>

        {/* Lens rim (re-draw on top to cover overflow) */}
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke="var(--logo-accent, #2563EB)"
          strokeWidth="2.2"
        />

        {/* Handle */}
        <line
          x1="28.5"
          y1="28.5"
          x2="38"
          y2="38"
          stroke="var(--logo-accent, #2563EB)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>

      {/* Wordmark + Tagline — hidden on mobile */}
      {!iconOnly && (
        <div
          className="patbook-wordmark"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: `${height * 0.52}px`,
              color: "var(--logo-text, #0F172A)",
              letterSpacing: "0.01em",
              lineHeight: 1.1,
            }}
          >
            Patbook
          </span>
          <span
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 400,
              fontSize: `${height * 0.275}px`,
              color: "var(--logo-subtle, #64748B)",
              letterSpacing: "0.01em",
              lineHeight: 1.3,
              marginTop: "1px",
            }}
          >
            Bank Statement Analyzer
          </span>
        </div>
      )}
    </div>
  );
}
