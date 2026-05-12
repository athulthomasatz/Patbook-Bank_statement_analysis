/**
 * Logo2 — Bank Pillars + Chart (Classic Fintech)
 * Icon: Bank building with 3 pillars, each a colored bar, dotted trend line on top.
 * All colors use CSS variables for automatic theme switching.
 */
export default function Logo2({ iconOnly = false, height = 40 }) {
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
        {/* Icon background */}
        <rect
          x="1"
          y="1"
          width="42"
          height="42"
          rx="10"
          fill="var(--logo-accent-bg, #EFF6FF)"
        />

        {/* Roof / Pediment triangle */}
        <polygon
          points="22,5 5,14 39,14"
          fill="var(--logo-accent, #2563EB)"
        />

        {/* Entablature (top base under pediment) */}
        <rect
          x="5"
          y="13"
          width="34"
          height="3"
          rx="0"
          fill="var(--logo-accent, #2563EB)"
        />

        {/* Stylobate (base) */}
        <rect
          x="4"
          y="36"
          width="36"
          height="3"
          rx="1"
          fill="var(--logo-subtle, #64748B)"
          opacity="0.6"
        />

        {/* Pillar 1 — left / short bar */}
        <rect
          x="8"
          y="27"
          width="7"
          height="9"
          rx="1"
          fill="var(--logo-accent, #2563EB)"
          opacity="0.5"
        />

        {/* Pillar 2 — center / medium bar */}
        <rect
          x="18.5"
          y="21"
          width="7"
          height="15"
          rx="1"
          fill="var(--logo-accent, #2563EB)"
          opacity="0.75"
        />

        {/* Pillar 3 — right / tall bar */}
        <rect
          x="29"
          y="16"
          width="7"
          height="20"
          rx="1"
          fill="var(--logo-accent, #2563EB)"
        />

        {/* Dotted trend line connecting tops of bars */}
        <polyline
          points="11.5,26  22,20  32.5,15"
          fill="none"
          stroke="var(--logo-text, #0F172A)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="2 2.8"
          opacity="0.7"
        />

        {/* Trend dot markers */}
        <circle cx="11.5" cy="26"  r="1.8" fill="var(--logo-text, #0F172A)" opacity="0.7" />
        <circle cx="22"   cy="20"  r="1.8" fill="var(--logo-text, #0F172A)" opacity="0.7" />
        <circle cx="32.5" cy="15"  r="1.8" fill="var(--logo-text, #0F172A)" opacity="0.7" />

        {/* Border ring */}
        <rect
          x="1"
          y="1"
          width="42"
          height="42"
          rx="10"
          fill="none"
          stroke="var(--logo-accent, #2563EB)"
          strokeWidth="1.5"
          opacity="0.4"
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
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontWeight: 700,
              fontSize: `${height * 0.52}px`,
              color: "var(--logo-text, #0F172A)",
              letterSpacing: "-0.3px",
              lineHeight: 1.1,
            }}
          >
            Patbook
          </span>
          <span
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 500,
              fontSize: `${height * 0.245}px`,
              color: "var(--logo-subtle, #64748B)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              lineHeight: 1.3,
              marginTop: "2px",
            }}
          >
            Bank Statement Analyzer
          </span>
        </div>
      )}
    </div>
  );
}
