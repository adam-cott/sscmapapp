import { useEffect } from 'react'

export default function UseToast({ dealName, onUndo, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleUndo() {
    onUndo()
    onDismiss()
  }

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>✓</span>
          <span style={{ fontSize: '14px', color: '#1e293b', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {dealName ? `Used: ${dealName}` : 'Deal marked as used'}
          </span>
        </div>
        <button
          onClick={handleUndo}
          style={{
            flexShrink: 0,
            fontSize: '13px',
            fontWeight: 700,
            color: '#059669',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Undo
        </button>
      </div>
    </div>
  )
}
