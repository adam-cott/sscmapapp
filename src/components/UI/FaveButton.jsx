import { useState } from 'react'
import { Heart } from 'lucide-react'

export default function FaveButton({ isFave, onToggle, size = 30 }) {
  const [burst, setBurst] = useState(0)

  const handleClick = () => {
    if (!isFave) {
      setBurst(b => b + 1)
      navigator.vibrate?.(15)
    }
    onToggle()
  }

  return (
    <button
      onClick={handleClick}
      aria-label={isFave ? 'Remove from faves' : 'Add to faves'}
      className="relative flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 press"
      style={{ width: size, height: size, border: 'none', cursor: 'pointer' }}
    >
      <Heart
        key={burst}
        className={burst ? 'fave-pop' : undefined}
        size={Math.round(size / 2.1)}
        strokeWidth={2}
        fill={isFave ? '#ef4444' : 'none'}
        color={isFave ? '#ef4444' : '#94a3b8'}
      />
      {burst > 0 && isFave && (
        <span key={`b${burst}`} className="fave-burst" aria-hidden="true">
          {[0, 60, 120, 180, 240, 300].map(a => <i key={a} style={{ '--a': `${a}deg` }} />)}
        </span>
      )}
    </button>
  )
}
