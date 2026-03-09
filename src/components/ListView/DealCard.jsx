import { CATEGORY_COLORS, CATEGORY_LIGHT } from '../../utils/categoryColors'
import { getNearestDistance, formatDistance } from '../../utils/dealHelpers'
import Badge from '../UI/Badge'

export default function DealCard({ deal, onClick, userCoords }) {
  const { usage } = deal
  const isExhausted = usage.status === 'exhausted'
  const isPartial   = usage.status === 'partial'
  const catColor    = CATEGORY_COLORS[deal.category] || '#64748b'
  const isUnlimited = deal.deal.maxUses === null

  const distanceMiles = getNearestDistance(deal, userCoords)
  const distanceStr   = distanceMiles !== null ? formatDistance(distanceMiles) : null

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl transition-all duration-200 group"
      style={{
        backgroundColor: isExhausted ? '#f8fafc' : '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        border: `1px solid ${isExhausted ? '#f1f5f9' : '#f1f5f9'}`,
        borderLeft: `4px solid ${isExhausted ? '#e2e8f0' : catColor}`,
        opacity: isExhausted ? 0.65 : 1,
      }}
      onMouseEnter={e => {
        if (!isExhausted) {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <span
            className="font-bold text-sm leading-snug"
            style={{
              fontFamily: 'Sora, sans-serif',
              color: isExhausted ? '#94a3b8' : '#0f172a',
            }}
          >
            {deal.name}
          </span>
          <Badge category={deal.category} />
        </div>

        {/* Distance badge */}
        {distanceStr && (
          <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>
            📍 {distanceStr}
          </p>
        )}

        {/* Deal title */}
        <p
          className="text-sm line-clamp-2 mb-3"
          style={{ color: isExhausted ? '#94a3b8' : '#475569', lineHeight: '1.4' }}
        >
          {deal.deal.title}
        </p>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          {/* Value pill */}
          <span
            className="text-xs font-bold rounded-lg px-2.5 py-1"
            style={{
              fontFamily: 'Sora, sans-serif',
              backgroundColor: isExhausted ? '#f1f5f9' : CATEGORY_LIGHT[deal.category] || '#f1f5f9',
              color: isExhausted ? '#94a3b8' : catColor,
            }}
          >
            {deal.deal.value}
          </span>

          {/* Usage indicator */}
          <div className="flex items-center gap-1.5">
            {isUnlimited ? (
              <span
                className="text-xs font-semibold"
                style={{ fontFamily: 'Sora, sans-serif', color: '#059669' }}
              >
                ∞ Unlimited
              </span>
            ) : (
              <>
                <div className="flex gap-1">
                  {Array.from({ length: deal.deal.maxUses }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full"
                      style={{
                        width: '7px',
                        height: '7px',
                        backgroundColor: i < usage.usedCount
                          ? '#e2e8f0'
                          : isExhausted ? '#fca5a5' : catColor,
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{
                    fontFamily: 'Sora, sans-serif',
                    color: isExhausted ? '#ef4444' : isPartial ? '#d97706' : '#059669',
                  }}
                >
                  {isExhausted ? 'Done' : `${usage.remaining}/${deal.deal.maxUses}`}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
