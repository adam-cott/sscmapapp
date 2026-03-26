import { MapPin, Tag, ArrowDownAZ } from 'lucide-react'

const SEGMENTS = [
  { key: 'nearest',  Icon: MapPin,      label: 'Nearest'  },
  { key: 'category', Icon: Tag,         label: 'Category' },
  { key: 'az',       Icon: ArrowDownAZ, label: 'A–Z'      },
]

export default function SortControl({ sortBy, setSortBy, permissionDenied, geoLoading, hasCoords, onNearestRequest }) {
  return (
    <div>
      <div
        role="group"
        aria-label="Sort deals by"
        className="flex w-full rounded-xl overflow-hidden"
        style={{ border: '1.5px solid #e2e8f0' }}
      >
        {SEGMENTS.map((seg, i) => {
          const isDisabled = seg.key === 'nearest' && permissionDenied
          // "Nearest" only counts as active when coords are actually available
          const isActive   = sortBy === seg.key && (seg.key !== 'nearest' || hasCoords)
          // Waiting state: user tapped Nearest (or it's loading) but coords not yet available
          const isPending  = seg.key === 'nearest' && geoLoading && !hasCoords

          const handleClick = () => {
            if (seg.key === 'nearest' && !hasCoords && !permissionDenied) {
              onNearestRequest()
            } else {
              setSortBy(seg.key)
            }
          }

          return (
            <button
              key={seg.key}
              aria-pressed={isActive}
              aria-label={isDisabled ? `${seg.label} (location unavailable)` : seg.label}
              disabled={isDisabled}
              onClick={handleClick}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold transition-colors"
              style={{
                fontFamily: 'Sora, sans-serif',
                backgroundColor: isActive ? '#0170B9' : isPending ? '#e6f2fb' : '#ffffff',
                color: isActive ? 'white' : isPending ? '#0170B9' : isDisabled ? '#cbd5e1' : '#475569',
                borderRight: i < SEGMENTS.length - 1 ? '1.5px solid #e2e8f0' : 'none',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                letterSpacing: '0.01em',
              }}
            >
              <seg.Icon size={12} className={isPending ? 'animate-pulse' : ''} />
              <span className={isPending ? 'animate-pulse' : ''}>{isPending ? 'Getting location…' : seg.label}</span>
            </button>
          )
        })}
      </div>

      {/* Honest hint when location is denied — browser won't show a re-prompt */}
      {permissionDenied && (
        <p style={{
          margin: '5px 0 0',
          fontSize: '11px',
          color: '#94a3b8',
          fontFamily: 'DM Sans, sans-serif',
          textAlign: 'center',
          lineHeight: '1.4',
        }}>
          <MapPin size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Location denied — enable in browser settings to use Nearest
        </p>
      )}
    </div>
  )
}
