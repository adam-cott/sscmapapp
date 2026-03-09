const SEGMENTS = [
  { key: 'nearest',  icon: '📍', label: 'Nearest'  },
  { key: 'category', icon: '🏷️', label: 'Category' },
  { key: 'az',       icon: '🔤', label: 'A–Z'      },
]

export default function SortControl({ sortBy, setSortBy, permissionDenied, geoLoading }) {
  return (
    <div
      role="group"
      aria-label="Sort deals by"
      className="flex w-full rounded-xl overflow-hidden"
      style={{ border: '1.5px solid #e2e8f0' }}
    >
      {SEGMENTS.map((seg, i) => {
        const isActive   = sortBy === seg.key
        const isDisabled = seg.key === 'nearest' && permissionDenied
        const isLoading  = seg.key === 'nearest' && geoLoading

        return (
          <button
            key={seg.key}
            aria-pressed={isActive}
            aria-label={isDisabled ? `${seg.label} (location unavailable)` : seg.label}
            disabled={isDisabled}
            onClick={() => setSortBy(seg.key)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold transition-colors"
            style={{
              fontFamily: 'Sora, sans-serif',
              backgroundColor: isActive ? '#0170B9' : '#ffffff',
              color: isActive ? 'white' : isDisabled ? '#cbd5e1' : '#475569',
              borderRight: i < SEGMENTS.length - 1 ? '1.5px solid #e2e8f0' : 'none',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              letterSpacing: '0.01em',
            }}
          >
            <span className={isLoading ? 'animate-pulse' : ''}>{seg.icon}</span>
            <span className={isLoading ? 'animate-pulse' : ''}>{seg.label}</span>
          </button>
        )
      })}
    </div>
  )
}
