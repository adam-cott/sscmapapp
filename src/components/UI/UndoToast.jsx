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
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        minWidth: '280px',
        maxWidth: '360px',
        width: 'calc(100% - 32px)',
        animation: 'toast-in 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', gap: '12px' }}>
        <span style={{ fontSize: '14px', color: '#e2e8f0', fontFamily: 'DM Sans, sans-serif', flex: 1 }}>
          {message}
        </span>
        <button
          onClick={onUndo}
          style={{
            flexShrink: 0,
            fontSize: '13px',
            fontWeight: '700',
            fontFamily: 'Sora, sans-serif',
            color: '#38bdf8',
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
      <div style={{ height: '3px', backgroundColor: '#334155' }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: '#38bdf8',
            transition: 'width 0.05s linear',
          }}
        />
      </div>
    </div>
  )
}
