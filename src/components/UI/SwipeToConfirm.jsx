import { useState, useRef, useCallback } from 'react'
import { ChevronRight } from 'lucide-react'

export default function SwipeToConfirm({ onConfirm, disabled = false, label = 'Slide to Redeem' }) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const trackRef = useRef(null)
  const startXRef = useRef(0)
  const confirmedRef = useRef(false)

  const HANDLE_SIZE = 48
  const THRESHOLD = 0.92

  const getMaxOffset = useCallback(() => {
    if (!trackRef.current) return 0
    return trackRef.current.offsetWidth - HANDLE_SIZE - 8 // 8 = padding (4px each side)
  }, [])

  const handlePointerDown = (e) => {
    if (disabled || confirmedRef.current) return
    e.preventDefault()
    startXRef.current = e.clientX - offset
    setDragging(true)
    trackRef.current?.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!dragging || disabled) return
    e.preventDefault()
    const max = getMaxOffset()
    const raw = e.clientX - startXRef.current
    setOffset(Math.max(0, Math.min(raw, max)))
  }

  const handlePointerUp = (e) => {
    if (!dragging) return
    e.preventDefault()
    setDragging(false)
    trackRef.current?.releasePointerCapture(e.pointerId)

    const max = getMaxOffset()
    if (max > 0 && offset / max >= THRESHOLD) {
      confirmedRef.current = true
      setOffset(max)
      onConfirm()
    } else {
      setOffset(0)
    }
  }

  const progress = getMaxOffset() > 0 ? offset / getMaxOffset() : 0

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: 'relative',
        height: '56px',
        borderRadius: '28px',
        backgroundColor: disabled ? '#f1f5f9' : '#ecfdf5',
        border: disabled ? '1.5px solid #e2e8f0' : '1.5px solid #a7f3d0',
        touchAction: 'none',
        userSelect: 'none',
        cursor: disabled ? 'not-allowed' : 'grab',
        overflow: 'hidden',
        padding: '4px',
      }}
    >
      {/* Progress fill */}
      {!disabled && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: `${(offset + HANDLE_SIZE + 8)}px`,
            backgroundColor: 'rgba(5, 150, 105, 0.08)',
            borderRadius: '28px',
            transition: dragging ? 'none' : 'width 0.35s cubic-bezier(0.32, 1.2, 0.54, 1)',
          }}
        />
      )}

      {/* Label */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Sora, sans-serif',
          fontWeight: 600,
          fontSize: '14px',
          color: disabled ? '#94a3b8' : '#059669',
          letterSpacing: '0.02em',
          opacity: disabled ? 1 : 1 - progress * 1.8,
          transition: dragging ? 'none' : 'opacity 0.35s ease',
          pointerEvents: 'none',
        }}
      >
        {disabled ? 'No Uses Remaining' : label}
      </div>

      {/* Handle */}
      <div
        style={{
          position: 'relative',
          width: `${HANDLE_SIZE}px`,
          height: `${HANDLE_SIZE}px`,
          borderRadius: '50%',
          backgroundColor: disabled ? '#e2e8f0' : '#059669',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.32, 1.2, 0.54, 1)',
          boxShadow: disabled
            ? 'none'
            : dragging
              ? '0 4px 20px rgba(5, 150, 105, 0.4)'
              : '0 2px 10px rgba(5, 150, 105, 0.3)',
          zIndex: 2,
          cursor: disabled ? 'not-allowed' : dragging ? 'grabbing' : 'grab',
        }}
      >
        <ChevronRight
          size={22}
          color={disabled ? '#94a3b8' : 'white'}
          strokeWidth={2.5}
        />
      </div>
    </div>
  )
}
