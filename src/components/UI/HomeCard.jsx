import { CATEGORY_COLORS, CATEGORY_LIGHT } from '../../utils/categoryColors'
import BusinessLogo from './BusinessLogo'

export default function HomeCard({ deal, onClick }) {
  const { usage } = deal
  const isExhausted = usage.status === 'exhausted'
  const catColor = CATEGORY_COLORS[deal.category] || '#64748b'

  return (
    <button
      onClick={onClick}
      style={{
        width: 'min(40vw, 164px)',
        flexShrink: 0,
        textAlign: 'left',
        backgroundColor: isExhausted ? '#f8fafc' : '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        border: `1px solid #e8edf3`,
        borderTop: `3px solid ${isExhausted ? '#e2e8f0' : catColor}`,
        opacity: isExhausted ? 0.6 : 1,
        cursor: 'pointer',
        padding: 'var(--hc-pad, 10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--hc-gap, 8px)',
      }}
    >
      <BusinessLogo name={deal.name} size="100%" radius={10} />

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
          display: 'inline-block',
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
    </button>
  )
}
