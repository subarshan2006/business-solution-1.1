function Logo({ variant = 'horizontal', size = 44, className = '' }) {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="jivanaut-helix-mark"
      aria-hidden={variant === 'horizontal'}
      role={variant === 'mark' ? 'img' : undefined}
      aria-label={variant === 'mark' ? 'Jivanaut Helix-J Logo' : undefined}
    >
      <defs>
        <linearGradient id="helixMintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id="helixBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0E2219" />
          <stop offset="100%" stopColor="#07130E" />
        </linearGradient>
      </defs>

      {/* Deep Moss Background Badge */}
      <rect width="64" height="64" rx="14" fill="url(#helixBgGrad)" stroke="#24493A" strokeWidth="1.5" />

      {/* DNA Base pair rungs (connecting lines) */}
      <line x1="28" y1="18" x2="42" y2="18" stroke="#A9C2B5" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <line x1="24" y1="26" x2="42" y2="26" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="26" y1="34" x2="42" y2="34" stroke="#A9C2B5" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

      {/* Secondary entwining strand (dashed biological ribbon) */}
      <path
        d="M26 12 C26 17 38 20 42 26 C46 32 38 36 30 38"
        stroke="#6EE7B7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 3"
        opacity="0.65"
      />

      {/* Primary Helix-J strand (forming the solid upright trunk and classic J terminal hook) */}
      <path
        d="M42 12 V34 C42 42.5 35 48 25 48 C16.5 48 13 41.5 13 36 C13 32 16.5 30 19.5 32 C22 33.7 22.5 36.5 25 37 C28.5 37.5 32 35 32 30.5 V12"
        fill="none"
        stroke="url(#helixMintGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Nucleotide terminal nodes */}
      <circle cx="42" cy="12" r="3.5" fill="#EAF5EE" stroke="#07130E" strokeWidth="1.5" />
      <circle cx="32" cy="12" r="2.5" fill="#34D399" />
      <circle cx="16" cy="35" r="2" fill="#6EE7B7" />
    </svg>
  )

  if (variant === 'mark') {
    return <div className={`jivanaut-logo-wrap ${className}`.trim()}>{mark}</div>
  }

  return (
    <div className={`jivanaut-logo-horizontal ${className}`.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
      {mark}
      <div className="jivanaut-wordmark" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span
          className="wordmark-title"
          style={{
            fontFamily: "var(--ff-sora, 'Sora', sans-serif)",
            fontWeight: 800,
            fontSize: `${Math.max(16, Math.round(size * 0.42))}px`,
            letterSpacing: '0.08em',
            color: 'var(--text, #EAF5EE)',
            textTransform: 'uppercase'
          }}
        >
          Jivanaut
        </span>
        <span
          className="wordmark-subtitle"
          style={{
            fontFamily: "var(--ff-mono, 'IBM Plex Mono', monospace)",
            fontWeight: 600,
            fontSize: `${Math.max(10, Math.round(size * 0.22))}px`,
            letterSpacing: '0.18em',
            color: 'var(--mint, #34D399)',
            textTransform: 'uppercase',
            marginTop: '3px'
          }}
        >
          Test Prep
        </span>
      </div>
    </div>
  )
}

export default Logo
