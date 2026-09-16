import BusinessLogo from './BusinessLogo'

export default function HomeCard({ deal, onClick }) {
  const { usage } = deal
  const isExhausted = usage.status === 'exhausted'

  return (
    <button
      onClick={onClick}
      style={{
        // Square tile height == this width, so this also sets the card's
        // vertical footprint. Scaled down from the old 4:3 tile's
        // min(52vw, 210px) by 0.75 (its aspect ratio) so a square tile
        // takes up the same height as before, keeping 3 stacked sections
        // reachable without excessive scrolling.
        width: 'min(39vw, 158px)',
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
        padding={0}
        align="center"
        bare
        shadow
      />

      {/* overflow:hidden here clips name/description to the button's own
          width no matter what causes a line to want to render wider (long
          text, clamp quirks, etc) - it doesn't depend on any width
          computation being exactly right, so it stays correct at any tile
          size. */}
      <div style={{ width: '100%', overflow: 'hidden', marginTop: '8px' }}>
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
            width: '100%',
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
            width: '100%',
          }}
        >
          {deal.deal.title}
        </p>
      </div>
    </button>
  )
}
