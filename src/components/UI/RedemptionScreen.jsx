import { useState, useEffect, useRef } from 'react'
import { CheckCircle } from 'lucide-react'

const DURATION = 30
const RADIUS = 58
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function RedemptionScreen({ deal, onDone }) {
  const [seconds, setSeconds] = useState(DURATION)
  const hasFiredRef = useRef(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          if (!hasFiredRef.current) {
            hasFiredRef.current = true
            // Defer to avoid setState-during-render in parent
            setTimeout(onDone, 0)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [onDone])

  const handleDone = () => {
    if (hasFiredRef.current) return
    hasFiredRef.current = true
    clearInterval(intervalRef.current)
    onDone()
  }

  const progress = seconds / DURATION
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div
      className="animate-redemption-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      {/* Business name */}
      <div
        style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: '24px',
          fontWeight: 700,
          color: '#0f172a',
          textAlign: 'center',
          marginBottom: '8px',
          lineHeight: 1.3,
          maxWidth: '320px',
        }}
      >
        {deal.name}
      </div>

      {/* Deal description */}
      <div
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '16px',
          color: '#64748b',
          textAlign: 'center',
          marginBottom: '40px',
          lineHeight: 1.5,
          maxWidth: '300px',
        }}
      >
        {deal.deal.value}
      </div>

      {/* Countdown ring */}
      <div style={{ position: 'relative', width: '140px', height: '140px', marginBottom: '36px' }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Background ring */}
          <circle
            cx="70" cy="70" r={RADIUS}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="70" cy="70" r={RADIUS}
            fill="none"
            stroke={seconds > 5 ? '#059669' : '#ef4444'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
          />
        </svg>
        {/* Seconds display */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: '40px',
              fontWeight: 700,
              color: seconds > 5 ? '#059669' : '#ef4444',
              lineHeight: 1,
              transition: 'color 0.3s ease',
            }}
          >
            {seconds}
          </div>
          <div
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginTop: '4px',
            }}
          >
            seconds
          </div>
        </div>
      </div>

      {/* Instruction */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px 20px',
          marginBottom: '40px',
          maxWidth: '300px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#059669',
            flexShrink: 0,
            animation: 'pulse-dot 2s ease-in-out infinite',
          }}
        />
        <span
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#475569',
            lineHeight: 1.4,
          }}
        >
          Show this screen to the employee
        </span>
      </div>

      {/* Done button */}
      <button
        onClick={handleDone}
        style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 600,
          fontSize: '16px',
          color: 'white',
          backgroundColor: '#059669',
          border: 'none',
          borderRadius: '16px',
          padding: '16px 48px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(5, 150, 105, 0.3)',
          transition: 'background-color 0.15s ease, transform 0.1s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#047857'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#059669'}
        onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
        onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <CheckCircle size={18} strokeWidth={2.5} />
        Done
      </button>
    </div>
  )
}
