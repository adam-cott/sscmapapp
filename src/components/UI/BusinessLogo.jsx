import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { slugify } from '../../utils/dealHelpers'

function aspectRatioToPercent(ratio) {
  const [w, h] = ratio.split('/').map(Number)
  return (h / w) * 100
}

export default function BusinessLogo({ name, size = 56, radius = 12, iconSize, padding = 6, maxWidth, align = 'flex-start', bare = false, background, shadow = false, aspectRatio = '1 / 1' }) {
  const [failed, setFailed] = useState(false)
  const src = `/logos/${slugify(name)}.png`
  const fallbackIconSize = iconSize ?? (typeof size === 'number' ? Math.round(size * 0.4) : 28)
  const isFixedSize = typeof size === 'number'

  // A single soft, wide shadow rather than a tight double layer: a small,
  // low-blur layer (e.g. 0 1px 3px with no spread) renders as a crisp hard
  // edge rather than a soft falloff, especially since the tile's own fill
  // (#f1f5f9) is barely distinguishable from the page background — that
  // edge was being seen as a hairline "outline" even though no border or
  // outline CSS property is actually set anywhere on this element.
  const shadowStyle = shadow ? '0 6px 16px rgba(15, 23, 42, 0.14)' : undefined

  // The shadow lives on the outer box, deliberately NOT clipped by
  // overflow:hidden: combining box-shadow with overflow:hidden on the same
  // rounded box produces a faint seam/border artifact on some renderers.
  // This inner "fill" layer (which does have overflow:hidden) handles
  // clipping the image to the rounded corners instead. When bare and
  // padding is 0 (HomeCard's tile), this layer has no fill of its own, so
  // the image reads as the tile itself rather than a picture floating
  // inside a separate colored box.
  const fillStyle = {
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
    // hairline border keeps the tile legible for the missing-logo fallback
    // and for the handful of logos rendered on a dark tile. 'bare' drops
    // both so the logo sits directly on the parent card's own background;
    // 'background' lets a bare tile still have its own fill without the
    // default white/hairline-border framed look.
    backgroundColor: background ?? (bare ? 'transparent' : '#ffffff'),
    border: bare ? 'none' : '1px solid #e8edf3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const content = failed ? (
    <ImageOff size={fallbackIconSize} color="#cbd5e1" strokeWidth={1.5} />
  ) : (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  )

  if (isFixedSize) {
    // Fixed pixel width+height (DealCard's list-row tiles): both dimensions
    // are already definite, so there's no sizing ambiguity for the browser
    // to resolve.
    return (
      <div style={{ width: size, maxWidth, height: size, flexShrink: 0, alignSelf: align, borderRadius: radius, boxShadow: shadowStyle }}>
        <div style={{ ...fillStyle, width: '100%', height: '100%' }}>{content}</div>
      </div>
    )
  }

  // Percentage-width tile (HomeCard): height must be derived from the
  // resolved width and a target aspect ratio. The CSS `aspect-ratio`
  // property here turned out to be unreliable in practice: once a real
  // <img> loads inside it, Chrome lets the image's OWN intrinsic ratio
  // (every logo file is a native 512x512 square) win over the declared
  // aspect-ratio, silently forcing the tile back to 1:1 regardless of what
  // aspect-ratio requested — reproduced directly against the live
  // production page. The classic padding-top-percentage technique
  // sidesteps this: a padding-top percentage always resolves against the
  // box's own WIDTH, never against any child's content or intrinsic size,
  // so it can't be hijacked by an image that happens to load inside it.
  return (
    <div style={{ width: size, maxWidth, flexShrink: 0, alignSelf: align, position: 'relative', borderRadius: radius, boxShadow: shadowStyle }}>
      <div style={{ paddingTop: `${aspectRatioToPercent(aspectRatio)}%` }} />
      <div style={{ ...fillStyle, position: 'absolute', inset: 0 }}>{content}</div>
    </div>
  )
}
