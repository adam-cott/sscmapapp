export default function UsageTracker({ used, maxUses, inline = false }) {
  // null maxUses = unlimited
  if (maxUses === null) {
    return (
      <div className={inline ? 'flex items-center gap-3' : ''}>
        <div
          className={`text-xs font-semibold ${inline ? 'flex-shrink-0' : 'mb-2'}`}
          style={{ color: '#059669' }}
        >
          {used > 0 ? `Used ${used} time${used !== 1 ? 's' : ''} — unlimited remaining` : 'Unlimited uses'}
        </div>
        <div className={`flex gap-1 ${inline ? '' : ''}`}>
          <div
            className="rounded-full transition-all duration-300"
            style={{ width: inline ? '8px' : '10px', height: inline ? '8px' : '10px', backgroundColor: '#059669' }}
          />
          <div
            className="rounded-full transition-all duration-300"
            style={{ width: inline ? '8px' : '10px', height: inline ? '8px' : '10px', backgroundColor: '#059669' }}
          />
          <div
            className="rounded-full transition-all duration-300"
            style={{ width: inline ? '8px' : '10px', height: inline ? '8px' : '10px', backgroundColor: '#059669' }}
          />
          <span style={{ fontSize: inline ? '8px' : '10px', color: '#059669', fontWeight: '700', lineHeight: 1, alignSelf: 'center' }}>∞</span>
        </div>
      </div>
    )
  }

  const remaining = Math.max(0, maxUses - used)
  const isExhausted = remaining === 0
  const allFresh = used === 0

  const label = isExhausted
    ? 'All uses redeemed'
    : allFresh
      ? `${maxUses} use${maxUses !== 1 ? 's' : ''} available`
      : `${remaining} of ${maxUses} remaining`

  const labelColor = isExhausted ? '#ef4444' : allFresh ? '#059669' : '#d97706'

  return (
    <div className={inline ? 'flex items-center gap-3' : ''}>
      <div
        className={`text-xs font-semibold ${inline ? 'flex-shrink-0' : 'mb-2'}`}
        style={{ color: labelColor }}
      >
        {label}
      </div>
      <div className={`flex gap-1 ${inline ? '' : ''}`}>
        {Array.from({ length: maxUses }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: inline ? '8px' : '10px',
              height: inline ? '8px' : '10px',
              backgroundColor: i < used ? '#e2e8f0' : (isExhausted ? '#fca5a5' : '#059669'),
              transform: i >= used && !isExhausted ? 'scale(1)' : 'scale(0.85)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
