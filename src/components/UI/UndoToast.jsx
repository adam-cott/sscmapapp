import { useEffect, useRef, useState } from 'react'

export default function UndoToast({ message, onUndo, onDismiss, duration = 4000 }) {
  const [progress, setProgress] = useState(100)
  const startRef = useRef(Date.now())
  const rafRef = useRef(null)

  useEffect(() => {
    startRef.current = Date.now()

    const tick = () => {
      const elapsed = Date.now() - startRef.current
      const pct = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(pct)
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    const timer = setTimeout(onDismiss, duration)
    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(timer)
    }
  }, [duration, onDismiss])

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
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(1,112,185,0.12)',
        overflow: 'hidden',
        minWidth: '280px',
        maxWidth: '360px',
        width: 'calc(100% - 32px)',
        animation: 'toast-in 0.2s ease',
      }}
    >
      <div style={{ height: '3px', backgroundColor: '#0170B9' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', gap: '12px' }}>
        <span style={{ fontSize: '14px', color: '#1e293b', fontFamily: 'DM Sans, sans-serif', flex: 1 }}>
          {message}
        </span>
        <button
          onClick={onUndo}
          style={{
            flexShrink: 0,
            fontSize: '13px',
            fontWeight: '700',
            fontFamily: 'Sora, sans-serif',
            color: '#0170B9',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '4px',
          }}
        >
          Undo
        </button>
      </div>
      {/* Progress bar */}
      <div style={{ height: '3px', backgroundColor: '#e6f2fb' }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: '#0170B9',
            transition: 'width 0.05s linear',
          }}
        />
      </div>
    </div>
  )
}
