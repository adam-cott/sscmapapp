import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { slugify } from '../../utils/dealHelpers'

export default function BusinessLogo({ name, size = 56, radius = 12, iconSize }) {
  const [failed, setFailed] = useState(false)
  const src = `/logos/${slugify(name)}.png`
  const fallbackIconSize = iconSize ?? (typeof size === 'number' ? Math.round(size * 0.4) : 28)

  return (
    <div
      style={{
        width: size,
        aspectRatio: '1 / 1',
        flexShrink: 0,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {failed ? (
        <ImageOff size={fallbackIconSize} color="#cbd5e1" strokeWidth={1.5} />
      ) : (
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  )
}
