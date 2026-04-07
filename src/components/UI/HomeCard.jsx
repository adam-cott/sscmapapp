import { MapPin } from 'lucide-react'
import { CATEGORY_COLORS, CATEGORY_LIGHT } from '../../utils/categoryColors'
import { getNearestDistance, formatDistance } from '../../utils/dealHelpers'

export default function HomeCard({ deal, onClick, userCoords }) {
  const { usage } = deal
  const isExhausted = usage.status === 'exhausted'
  const catColor = CATEGORY_COLORS[deal.category] || '#64748b'
  const distanceMiles = getNearestDistance(deal, userCoords)
  const distanceStr = distanceMiles !== null ? formatDistance(distanceMiles) : null

  return (
    <button
      onClick={onClick}
      style={{
        width: '148px',
        flexShrink: 0,
        textAlign: 'left',
        backgroundColor: isExhausted ? '#f8fafc' : '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        border: `1px solid #e8edf3`,
        borderTop: `3px solid ${isExhausted ? '#e2e8f0' : catColor}`,
        opacity: isExhausted ? 0.6 : 1,
        cursor: 'pointer',
        padding: 'var(--hc-pad, 14px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--hc-gap, 3px)',
      }}
    >
      <span
        style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          fontSize: 'var(--hc-name, 13px)',
          color: isExhausted ? '#94a3b8' : '#0f172a',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'block',
        }}
      >
        {deal.name}
      </span>

      <span
        style={{
          fontSize: 'var(--hc-desc, 12px)',
          color: isExhausted ? '#94a3b8' : '#475569',
          lineHeight: 'var(--hc-desc-lh, 1.3)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {deal.deal.title}
      </span>

      <span
        style={{
          display: 'inline-block',
          marginTop: 'var(--hc-badge-mt, 1px)',
          fontSize: 'var(--hc-badge, 11px)',
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          backgroundColor: isExhausted ? '#f1f5f9' : CATEGORY_LIGHT[deal.category] || '#f1f5f9',
          color: isExhausted ? '#94a3b8' : catColor,
          borderRadius: '6px',
          padding: 'var(--hc-badge-pad, 3px 8px)',
          alignSelf: 'flex-start',
        }}
      >
        {deal.deal.value}
      </span>

      {distanceStr && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: 'var(--hc-dist, 10px)',
            color: '#94a3b8',
            marginTop: 'var(--hc-dist-mt, 0px)',
          }}
        >
          <MapPin size={9} color="#94a3b8" />
          {distanceStr}
        </span>
      )}
    </button>
  )
}
