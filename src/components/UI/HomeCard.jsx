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
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: `1px solid #e8edf3`,
        borderTop: `3px solid ${isExhausted ? '#e2e8f0' : catColor}`,
        opacity: isExhausted ? 0.6 : 1,
        cursor: 'pointer',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}
    >
      <span
        style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          fontSize: '12px',
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
          fontSize: '11px',
          color: isExhausted ? '#94a3b8' : '#475569',
          lineHeight: '1.3',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {deal.deal.title}
      </span>

      <span
        style={{
          display: 'inline-block',
          marginTop: '3px',
          fontSize: '10px',
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          backgroundColor: isExhausted ? '#f1f5f9' : CATEGORY_LIGHT[deal.category] || '#f1f5f9',
          color: isExhausted ? '#94a3b8' : catColor,
          borderRadius: '5px',
          padding: '2px 6px',
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
            fontSize: '10px',
            color: '#94a3b8',
            marginTop: '1px',
          }}
        >
          <MapPin size={9} color="#94a3b8" />
          {distanceStr}
        </span>
      )}
    </button>
  )
}
