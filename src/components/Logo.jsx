function Logo({ variant = 'horizontal', size = 44, className = '' }) {
  const mark = (
    <img
      src={`${import.meta.env.BASE_URL}assets/images/logo-image.png`}
      alt="Jivanaut Test Prep"
      width={size}
      height={size}
      className={className}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        objectFit: 'contain',
        borderRadius: '12px'
      }}
    />
  )

  if (variant === 'mark') {
    return mark
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
            color: 'var(--text, #FFFFFF)',
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
            color: 'var(--mint, #FF5C5C)',
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
