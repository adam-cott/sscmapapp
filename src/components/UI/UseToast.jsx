import { useEffect } from 'react'

export default function UseToast({ onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 2000)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        position: 'fixed',
        top: '64px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1500,
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(5,150,105,0.15)',
        overflow: 'hidden',
        minWidth: '260px',
        maxWidth: '360px',
        width: 'calc(100% - 32px)',
        animation: 'toast-in 0.2s ease',
      }}
    >
      <div style={{ height: '3px', backgroundColor: '#059669' }} />
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '10px' }}>
        <span style={{ fontSize: '16px' }}>✓</span>
        <span style={{ fontSize: '14px', color: '#1e293b', fontFamily: 'DM Sans, sans-serif' }}>
          Deal marked as used
        </span>
      </div>
    </div>
  )
}
