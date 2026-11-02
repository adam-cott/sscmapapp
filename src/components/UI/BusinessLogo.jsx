import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { slugify } from '../../utils/dealHelpers'

// iPhone-app-icon squircle: a superellipse (|x|^5 + |y|^5 = 1), whose corners
// curve in gradually instead of border-radius's abrupt quarter circle. CSS
// can't draw it directly, so it's an SVG mask stretched over each tile layer.
const SQUIRCLE = (() => {
  const axis = v => (50 + 50 * Math.sign(v) * Math.abs(v) ** 0.4).toFixed(2)
  const pts = []
  for (let deg = 0; deg < 360; deg += 2) {
    const t = deg * Math.PI / 180
    pts.push(`${axis(Math.cos(t))},${axis(Math.sin(t))}`)
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='M${pts.join('L')}Z'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
})()

const MASK = { WebkitMaskImage: SQUIRCLE, maskImage: SQUIRCLE, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }

function aspectRatioToPercent(ratio) {
  const [w, h] = ratio.split('/').map(Number)
  return (h / w) * 100
}

export default function BusinessLogo({ name, size = 56, iconSize, padding = 6, maxWidth, align = 'flex-start', bare = false, background, shadow = false, aspectRatio = '1 / 1' }) {
  const [failed, setFailed] = useState(false)
  const src = `/logos/${slugify(name)}.png`
  const fallbackIconSize = iconSize ?? (typeof size === 'number' ? Math.round(size * 0.4) : 28)
  const isFixedSize = typeof size === 'number'

  // A mask clips box-shadow away, so the shadow is a drop-shadow filter on the
  // outer box instead — it follows the masked squircle's outline. One soft,
  // wide shadow: a tight low-blur one reads as a hard hairline "outline".
  const outerStyle = { flexShrink: 0, alignSelf: align, maxWidth, filter: shadow ? 'drop-shadow(0 6px 16px rgba(15, 23, 42, 0.14))' : undefined }

  // A border would be clipped off the curved corners too, so the hairline
  // frame is a squircle filled with the border color, with the tile inset
  // 1px inside it. 'bare' drops the frame and white fill so the logo sits
  // directly on the parent card (HomeCard's tile); 'background' gives a bare
  // tile its own fill without the framed look.
  const frameStyle = { ...MASK, padding: bare ? 0 : 1, backgroundColor: bare ? 'transparent' : '#e8edf3', boxSizing: 'border-box' }

  const fillStyle = {
    ...MASK,
    width: '100%',
    height: '100%',
    // A fixed pixel padding, not a percentage: percentage padding is
    // resolved against the containing block's (parent's) width, not this
    // box's own size, which previously produced padding many times larger
    // than the tile itself and collapsed the image to 0x0.
    padding,
    boxSizing: 'border-box',
    backgroundColor: background ?? (bare ? 'transparent' : '#ffffff'),
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
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  )

  if (isFixedSize) {
    // Fixed pixel width+height (DealCard's list-row tiles).
    return (
      <div style={{ ...outerStyle, width: size, height: size }}>
        <div style={{ ...frameStyle, width: '100%', height: '100%' }}>
          <div style={fillStyle}>{content}</div>
        </div>
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
    <div style={{ ...outerStyle, width: size, position: 'relative' }}>
      <div style={{ paddingTop: `${aspectRatioToPercent(aspectRatio)}%` }} />
      <div style={{ ...frameStyle, position: 'absolute', inset: 0 }}>
        <div style={fillStyle}>{content}</div>
      </div>
    </div>
  )
}
