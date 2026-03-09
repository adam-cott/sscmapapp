export default function LocationPrompt({ onAllow, onDecline }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '72px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1500,
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(1,112,185,0.12)',
        overflow: 'hidden',
        minWidth: '300px',
        maxWidth: '380px',
        width: 'calc(100% - 32px)',
        animation: 'toast-in 0.25s ease',
      }}
    >
      {/* SSC blue accent bar */}
      <div style={{ height: '4px', backgroundColor: '#0170B9' }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '22px', lineHeight: 1 }}>📍</span>
          <span
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: '700',
              fontSize: '15px',
              color: '#0f172a',
            }}
          >
            See deals nearest to you?
          </span>
        </div>

        {/* Description */}
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: '#64748b',
            lineHeight: '1.5',
            marginBottom: '14px',
            paddingLeft: '32px',
          }}
        >
          Allow location access to sort deals by distance and see how far away each one is.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onDecline}
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: '600',
              fontSize: '13px',
              color: '#94a3b8',
              background: 'none',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              padding: '7px 14px',
              cursor: 'pointer',
            }}
          >
            Not now
          </button>
          <button
            onClick={onAllow}
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: '700',
              fontSize: '13px',
              color: 'white',
              backgroundColor: '#0170B9',
              border: 'none',
              borderRadius: '10px',
              padding: '7px 16px',
              cursor: 'pointer',
            }}
          >
            Allow location
          </button>
        </div>
      </div>
    </div>
  )
}
