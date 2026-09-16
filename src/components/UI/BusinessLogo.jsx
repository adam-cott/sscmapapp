import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { slugify } from '../../utils/dealHelpers'

export default function BusinessLogo({ name, size = 56, radius = 12, iconSize, padding = 6, maxWidth, align = 'flex-start', bare = false, background, shadow = false }) {
  const [failed, setFailed] = useState(false)
  const src = `/logos/${slugify(name)}.png`
  const fallbackIconSize = iconSize ?? (typeof size === 'number' ? Math.round(size * 0.4) : 28)

  return (
    <div
      style={{
        width: size,
        maxWidth,
        // An explicit height (when size is a number) pins the box square even
        // inside a flex row that would otherwise stretch it to a sibling's
        // height; aspectRatio is the fallback for size="100%"/maxWidth, where
        // a fixed height can't be known up front — it's derived from the
        // resolved width, never a percentage of the parent's height, so it
        // can't collapse if the parent's own height is content-driven.
        height: typeof size === 'number' ? size : undefined,
        aspectRatio: '1 / 1',
        flexShrink: 0,
        // 'flex-start' anchors the tile in a row layout (DealCard) so a
        // taller sibling can't stretch it; 'center' balances it in a column
        // layout (HomeCard) when maxWidth leaves the tile narrower than the
        // card, instead of it sticking to one edge.
        alignSelf: align,
        borderRadius: radius,
        overflow: 'hidden',
        // A fixed pixel padding, not a percentage: percentage padding is
        // resolved against the containing block's (parent's) width, not this
        // box's own size, which previously produced padding many times larger
        // than the tile itself and collapsed the image to 0x0.
        padding,
        boxSizing: 'border-box',
        // White matches the background nearly every logo file is already
        // flattened onto, so the tile doesn't read as a box inside a box; a
        // hairline border keeps the tile legible for the missing-logo
        // fallback and for the handful of logos rendered on a dark tile.
        // 'bare' drops both so the logo sits directly on the parent card's
        // own background instead of a nested framed tile; 'background' lets
        // a bare tile still have its own fill (e.g. HomeCard's page-level
        // tile) without the default white/hairline-border framed look.
        backgroundColor: background ?? (bare ? 'transparent' : '#ffffff'),
        border: bare ? 'none' : '1px solid #e8edf3',
        boxShadow: shadow ? '0 2px 8px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)' : undefined,
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
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      )}
    </div>
  )
}
