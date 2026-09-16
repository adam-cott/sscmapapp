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
        backgroundColor: 'transparent',
        border: 'none',
        opacity: isExhausted ? 0.6 : 1,
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      <BusinessLogo
        name={deal.name}
        size="100%"
        radius={18}
        padding={20}
        align="center"
        bare
        shadow
        background="#f1f5f9"
      />

      <span
        style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          fontSize: 'var(--hc-name, 13px)',
          color: '#0f172a',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'block',
          marginTop: '8px',
        }}
      >
        {deal.name}
      </span>

      <p
        className="line-clamp-2"
        style={{
          margin: '2px 0 0',
          fontSize: 'var(--hc-desc, 12px)',
          color: '#64748b',
          lineHeight: 1.35,
        }}
      >
        {deal.deal.title}
      </p>
    </button>
  )
}
