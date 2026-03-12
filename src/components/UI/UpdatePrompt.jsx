import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1500,
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(1,112,185,0.12)',
        overflow: 'hidden',
        minWidth: '280px',
        maxWidth: '360px',
        width: 'calc(100% - 32px)',
        animation: 'toast-in 0.2s ease',
      }}
    >
      <div style={{ height: '3px', backgroundColor: '#0170B9' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', gap: '12px' }}>
        <span style={{ fontSize: '14px', color: '#1e293b', fontFamily: 'DM Sans, sans-serif', flex: 1 }}>
          New version available
        </span>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => setNeedRefresh(false)}
            style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'Sora, sans-serif', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
          >
            Later
          </button>
          <button
            onClick={() => updateServiceWorker(true)}
            style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'Sora, sans-serif', color: '#0170B9', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  )
}
