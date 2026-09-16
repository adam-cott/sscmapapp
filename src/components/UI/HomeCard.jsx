import BusinessLogo from './BusinessLogo'

export default function HomeCard({ deal, onClick }) {
  const { usage } = deal
  const isExhausted = usage.status === 'exhausted'

  return (
    <button
      onClick={onClick}
      style={{
        width: 'min(52vw, 210px)',
        flexShrink: 0,
        textAlign: 'left',
        backgroundColor: isExhausted ? '#f8fafc' : '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid #e8edf3',
        opacity: isExhausted ? 0.6 : 1,
        cursor: 'pointer',
        padding: 'var(--hc-pad, 10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--hc-gap, 8px)',
      }}
    >
      <BusinessLogo name={deal.name} size="100%" maxWidth={120} padding={14} align="center" bare />

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

      <p
        className="line-clamp-2"
        style={{
          margin: 0,
          fontSize: 'var(--hc-desc, 12px)',
          color: isExhausted ? '#94a3b8' : '#64748b',
          lineHeight: 1.35,
        }}
      >
        {deal.deal.title}
      </p>
    </button>
  )
}
