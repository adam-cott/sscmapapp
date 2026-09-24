#!/usr/bin/env node
// Download a logo per business into public/logos/{slug}.png, using the domains
// resolved by scripts/resolve-domains.js. No Google API involved — these are
// plain fetches to each business's own site.
//
// Output is always a 512x512 PNG on white. Because every file is square,
// BusinessLogo.jsx's objectFit:'cover' behaves like 'contain' and no React
// component needs to change.
//
// Usage (PowerShell):
//   node scripts/fetch-logos.js --limit=10          # dry run, downloads nothing
//   node scripts/fetch-logos.js --limit=10 --live   # writes 10 logos
//   node scripts/fetch-logos.js --live              # writes all
//   node scripts/fetch-logos.js --live --force      # re-download existing
//   node scripts/fetch-logos.js --only="Wingstop;MidiCi" --live   # redo just these

import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const OUT_SIZE = 512
const MIN_SOURCE = 64
const GOOD_SOURCE = 180
const DARK_THRESHOLD = 100
const CONCURRENCY = 5
const TIMEOUT_MS = 10000
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const INPUT_PATH = path.join(__dirname, 'domains-output.json')
const OUTPUT_PATH = path.join(__dirname, 'logos-output.json')
const LOGOS_DIR = path.join(__dirname, '../public/logos')
// Drop <slug>.png|jpg|webp|svg here to force that image for a business. Beats
// every other source, so anything you save is exactly what ships.
const MANUAL_DIR = path.join(__dirname, 'manual-logos')
const MANUAL_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.avif']

function manualFileFor(slug) {
  for (const ext of MANUAL_EXT) {
    const f = path.join(MANUAL_DIR, slug + ext)
    if (fs.existsSync(f)) return f
  }
  return null
}

// Flagged rows you approved by hand. A bare domain is treated like any other;
// a full URL is scraped directly, since the brand lives in the subdomain/path
// rather than the registrable domain.
const INCLUDE_FLAGGED = {
  'Game Grid': 'gglehi.com',
  'Chiropractic Access Accident Center': 'axcessac.com',
  'Red Fuego': 'https://www.facebook.com/redfuegoutah/',
  'Sip-N': 'http://sipnspot.weebly.com/',
  "Rhyno's Axe & Archery": 'https://rhynos-axe-throwing.square.site/',
}

// Hand-picked image URLs for businesses whose scraped logo was wrong or ugly.
// These point straight at an image file and skip candidate discovery entirely,
// so whatever you put here is exactly what ships.
const MANUAL_LOGOS = {
  // Their own sites publish nothing usable; these are the real marks.
  'Dairy Queen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Dairy_Queen_logo.svg/960px-Dairy_Queen_logo.svg.png',
  'Daylight Donuts': 'https://upload.wikimedia.org/wikipedia/en/8/82/Daylight_Donuts_%28logo%29.svg',
  // WordPress site icons: a square crop of a wide logo. Use the full original.
  'The Hive Trampoline Park': 'https://www.hiveparks.com/wp-content/uploads/2021/08/HIVE-PARKS-3-scaled.png',
  'Mandalyn Academy': 'https://mandalynacademy.com/storage/2024/10/Mandalyn-Academy-Logo-1.webp',
  // Their largest published mark; small, but it is genuinely all they ship.
  'ZAGG': 'https://cdn11.bigcommerce.com/s-uv4dd6xvbk/images/stencil/original/zagg-logo-3x_1720645208__33925.original.png',

  // National chains whose own sites only serve a ~100px favicon. These are the
  // brands' App Store icons: square, 512px, and verified against the app's
  // seller name so a same-named app from another company can't slip in.
  // McDonald's, Wingstop and Cold Stone were checked one by one, not bulk-imported.
  'Wingstop': 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/55/8f/e6/558fe62d-c69a-b001-50b7-90e857b9e5d2/AppIcon-prodWingstopOrdering-0-0-1x_U007emarketing-0-11-0-P3-85-220.png/512x512bb.png',
  "Papa Murphy's": 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/4d/71/99/4d7199c3-4d40-fa89-d900-9da8d28ebbfe/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.png',
  'Outback Steakhouse': 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/16/47/a9/1647a98d-5aa7-9031-720a-4f2f513e0758/AppIcon-1x_U007emarketing-0-8-0-85-220-0.png/512x512bb.png',
  'Tropical Smoothie Cafe': 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/69/77/96/697796d0-2065-63e8-6d56-3cd17f4ae14d/AppIcon-0-0-1x_U007emarketing-0-6-0-85-220.png/512x512bb.png',
  'Cold Stone Creamery': 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/83/71/1d/83711ddd-a77d-ed93-247a-e50ab3f1db4b/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png/512x512bb.png',
  "McDonald's": 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/0f/06/71/0f0671a7-106e-d866-f7cd-7328aabdb6d3/AppIcon-US-0-0-1x_U007ephone-0-1-0-sRGB-0-0-85-220.png/512x512bb.png',
  "Bubbakoo's Burritos": 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/18/e6/b3/18e6b32d-f8a7-1c04-8e53-3a3af3117122/AppIcon-bubbakoos-0-0-1x_U007ephone-0-1-sRGB-85-220.png/512x512bb.png',
  'Twisted Sugar': 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/c9/bf/73/c9bf73af-d669-74a7-3db0-043540b82c01/AppIcon-0-0-1x_U007emarketing-0-7-0-0-85-220.png/512x512bb.png',
  'MidiCi The Neapolitan Pizza Company': 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/72/e1/d0/72e1d077-c503-3c25-85e0-812937d37f10/AppIcon-0-0-1x_U007ephone-0-1-85-220.png/512x512bb.png',
  'FatCats': 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/15/23/bc/1523bc99-2b50-d082-ae40-53471d6fa32e/AppIcon-1x_U007emarketing-0-8-0-85-220-0.png/512x512bb.png',
  'Paul Mitchell the School Provo': 'https://is1-ssl.mzstatic.com/image/thumb/Purple118/v4/b2/36/fd/b236fd4b-75d0-d6da-9e07-f0c57e17ca5d/AppIcon-1x_U007emarketing-85-220-5.png/512x512bb.png',
  "Carrabba's Italian Grill": 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/c1/b4/92/c1b492c6-bc09-73a9-d97d-5af9385590fe/AppIcon-1x_U007emarketing-0-11-0-85-220-0.png/512x512bb.png',
  'Crumbl': 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/91/74/5c/91745cac-598e-8263-0e0f-33d9a3f77898/AppIcon-0-0-1x_U007ephone-0-0-0-1-0-0-sRGB-0-85-220.png/512x512bb.png',
  'MOD Pizza': 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/32/ee/ae/32eeaeb4-8486-9beb-fbb9-073d63d1be27/AppIcon-0-0-1x_U007emarketing-0-1-0-85-220.png/512x512bb.png',
  'Habit Burger & Grill': 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/cc/51/5a/cc515ab5-a0e5-d4f0-7572-a373dd7ab644/AppIcon-0-0-1x_U007emarketing-0-6-0-85-220.png/512x512bb.png',
  'Firehouse Subs': 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/de/8a/f7/de8af70d-fdb4-6cee-1a5f-a8ad4c7b79f0/AppIcon-0-0-1x_U007epad-0-1-85-220.png/512x512bb.png',

  // Local sites whose scraped pick was wrong; these are their real marks.
  "Shirley's Bakery & Cafe": 'https://shirleysbakerycafe.com/wp-content/uploads/2022/02/1396289938.png',
  'ComedyBox Utah': 'https://static.wixstatic.com/media/bd446e_479a8d04914d4dd4b7d75e6504d6a4d5~mv2.png',

  // Businesses with no usable website. App icons, eyeballed one by one on the
  // review sheet before being added here.
  "Auntie Anne's": 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/02/30/f2/0230f2f0-3d0d-38dc-1bbe-53f83d54e2d9/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png/512x512bb.png', // Auntie Anne's Rewards
  "Dirty Dough's": 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/42/00/4d/42004da6-bb02-1a3d-d382-d4a2c5eb692e/AppIcon-dirtydough-0-0-1x_U007emarketing-0-6-0-85-220.png/512x512bb.png', // Craveworthy, their parent
  "Dippin' Dots Fab Freddy's": 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/e2/5f/c4/e25fc404-b997-cbd3-afa4-53b9379da439/AppIcon-0-0-1x_U007ephone-0-11-0-85-220.png/512x512bb.png', // Dippin' Dots
  'Provo Bakery': 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/c2/26/f2/c226f29b-53e2-2eaa-c1e9-3dcce6009fb1/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.png', // via Incentivio
  'LoLo Hawaiian BBQ': 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/e1/93/a9/e193a9aa-4650-61f0-cec8-12fe3e497dc8/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png/512x512bb.png', // via Chowbus
  "Chubby's": 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/e2/3b/00/e23b00fd-42e9-8b41-8ec1-0014c2571b35/AppIcon-0-0-1x_U007emarketing-0-8-0-0-85-220.png/512x512bb.png', // Chubby's App
  'Havoline': 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/bd/d1/04/bdd1043d-f0c3-2421-3cb3-aaa673a0463e/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/512x512bb.png', // Chevron Havoline CO-OP
  'Healing Vibes': 'https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/fe/83/e4/fe83e440-88c4-7f0d-c86d-96cb6824b292/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/512x512bb.png', // Healing Vibes Mind Body Health
  'Stadium Cinemas': 'https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/d3/2a/60/d32a601c-e86a-124a-e32c-d3a2c9b12916/appicon_ios-1x_U007emarketing-0-7-0-85-220.png/512x512bb.png', // Stadium Cinema
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'))
  return m ? m[1] : null
}

function sizeOf(tag) {
  const s = attr(tag, 'sizes')
  if (!s) return 0
  const m = s.match(/(\d+)\s*x/i)
  return m ? Number(m[1]) : 0
}

// Badges, payment marks and partner logos all carry "logo" in their filename.
// Grabbing one ships a Google Play badge as the business's identity.
const NOT_A_LOGO = /app-?store|google-?play|badge|payment|visa|mastercard|amex|paypal|yelp|facebook|instagram|twitter|tiktok|tripadvisor|doordash|ubereats|grubhub|partner|sponsor|award|placeholder|spinner|loading|trustindex|gosite|powered-?by|built-?with|cnet|as-?seen|press|featured-?in|review|wix|squarespace-?logo|godaddy|shopify|gdpr|cookie|consent|privacy|\babc\b|\bnbc\b|\bcbs\b|\bfox\b|forbes|usa-?today|buzzfeed/i

// Hosts that only ever serve someone else's mark — a reviews widget, a
// site-builder credit. Nothing under them is the business's own logo.
// Camera and social-feed filenames are photographs, never logos. og:image is
// the usual culprit — sites point it at a hero shot of the food.
const IS_PHOTO = /\b(dsc|img|dscf|dji|pxl)[-_]?\d{3,}|_mg_\d|feed-?\d|slide-?\d|hero|banner|storefront|interior|gallery|unsplash|pexels/i

const FOREIGN_ASSET_HOSTS = /trustindex\.io|app-sources\.com|gosite|trustpilot|birdeye/i

// Domains whose favicon is the platform's logo, not the business's.
const SOCIAL_HOSTS = /facebook\.com|instagram\.com|twitter\.com|x\.com|tiktok\.com|linkedin\.com|yelp\.com/i

// White-on-transparent artwork disappears on a white tile. Filenames usually
// announce it, which lets a colored variant win before we ever fetch pixels.
const WHITE_VARIANT = /(^|[^a-z])(wht|white|blanco|inverse|inverted|reverse|reversed|light|knockout)([^a-z]|$)/i

// Ordered safest-first, then by quality. apple-touch-icon is square and
// purpose-built so it leads; a scraped header logo is far higher resolution
// but riskier, so it backs it up rather than overriding it.
function candidatesFromHtml(html, baseUrl) {
  const apple = []
  const icons = []
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attr(tag, 'rel') || '').toLowerCase()
    const href = attr(tag, 'href')
    if (!href) continue
    if (rel.includes('apple-touch-icon')) apple.push({ href, size: sizeOf(tag) })
    else if (rel.includes('icon')) icons.push({ href, size: sizeOf(tag) })
  }

  const og = []
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (attr(tag, 'property') || attr(tag, 'name') || '').toLowerCase()
    const content = attr(tag, 'content')
    if (content && (key === 'og:image' || key === 'twitter:image')) og.push({ href: content, size: 0 })
  }

  // Earliest match wins — the real logo sits in the header, badges sit in the footer.
  const logos = []
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const href = attr(tag, 'src') || attr(tag, 'data-src')
    if (!href) continue
    const haystack = `${href} ${attr(tag, 'alt') || ''} ${attr(tag, 'class') || ''}`
    if (!/logo|brand/i.test(haystack)) continue
    if (NOT_A_LOGO.test(haystack)) continue
    logos.push({ href, size: 0 })
  }

  const bySize = (a, b) => b.size - a.size
  const urls = [...apple.sort(bySize), ...logos, ...og, ...icons.sort(bySize)]
    .map((c) => {
      try {
        return new URL(c.href, baseUrl).href
      } catch {
        return null
      }
    })
    .filter((u) => u && !u.toLowerCase().endsWith('.ico') && !FOREIGN_ASSET_HOSTS.test(u) && !IS_PHOTO.test(u))

  // WordPress serves cropped-log-180x180.png alongside the full-size
  // cropped-log.png at the same path. Try the original first, for free.
  const out = []
  for (const u of urls) {
    const full = u.replace(/-\d{2,4}x\d{2,4}(\.[a-z]{3,4})(\?|$)/i, '$1$2')
    if (full !== u) out.push(full)
    out.push(u)
  }
  return [...new Set(out)]
}

async function fetchBuf(url) {
  // A hand-dropped file is read straight off disk, never fetched.
  if (!/^https?:/i.test(url)) {
    try {
      return fs.readFileSync(url)
    } catch {
      return null
    }
  }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': UA } })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function fetchText(url) {
  const buf = await fetchBuf(url)
  return buf ? buf.toString('utf8') : null
}

// Charcoal, for the few brands that only publish a white-on-transparent mark.
const DARK_BG = { r: 31, g: 41, b: 55, alpha: 1 }
const WHITE_BG = { r: 255, g: 255, b: 255, alpha: 1 }

// Is the artwork itself white? Sample the opaque pixels only — a white wordmark
// on transparency is invisible once flattened onto a white tile.
async function looksWhite(buf) {
  try {
    const { data } = await sharp(buf, { density: 300 })
      .resize(64, 64, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    let sum = 0
    let n = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 200) continue
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      n++
    }
    // Almost fully transparent counts as white — there is nothing dark to show.
    if (n < 16) return true
    return sum / n > 205
  } catch {
    return false
  }
}

// Strip uniform padding so the mark fills the tile instead of floating in it.
async function trimmed(buf) {
  try {
    const out = await sharp(buf, { density: 300 }).trim({ threshold: 12 }).toBuffer()
    const m = await sharp(out).metadata()
    if (!m.width || !m.height || Math.max(m.width, m.height) < 24) return null
    return { buf: out, width: m.width, height: m.height }
  } catch {
    return null
  }
}

// Measure a candidate without committing to it. Sources under MIN_SOURCE are
// rejected so we fall through rather than shipping a blurry upscale.
async function inspect(buf, url) {
  let meta
  try {
    meta = await sharp(buf, { density: 300 }).metadata()
  } catch {
    return null
  }
  if (!meta.width || !meta.height) return null

  // Trimming usually helps, but on an app icon it strips the colored plate and
  // leaves a bare wordmark. Keep the original whenever trimming makes the
  // shape substantially worse than the square it started as.
  const t = await trimmed(buf)
  const rawAr = Math.max(meta.width, meta.height) / Math.min(meta.width, meta.height)
  const trimAr = t ? Math.max(t.width, t.height) / Math.min(t.width, t.height) : Infinity
  const keepRaw = t && rawAr <= 1.5 && trimAr > rawAr * 1.5
  const src = keepRaw || !t ? { buf, width: meta.width, height: meta.height } : t
  const srcSize = Math.max(src.width, src.height)
  if (srcSize < MIN_SOURCE) return { tooSmall: true, srcSize }

  const aspect = Math.max(src.width, src.height) / Math.min(src.width, src.height)
  // Only artwork with real transparency can vanish on a white tile. An opaque
  // image already carries its own background, so flattening it onto charcoal
  // would just frame a white box in grey.
  const isWhite = meta.hasAlpha && ((await looksWhite(src.buf)) || WHITE_VARIANT.test(url))
  return { buf: src.buf, srcSize, aspect, isWhite, format: meta.format }
}

// A 400x400 icon beats a 1500x437 banner: the app renders logos in a hard
// square (BusinessLogo.jsx:13), so a wide wordmark shrinks to an unreadable
// sliver no matter how many pixels it has. Aspect ratio dominates the score,
// size breaks ties, and a white-only variant is taken only as a last resort.
function score(c) {
  const aspect = c.aspect <= 1.2 ? 1 : c.aspect <= 2 ? 0.7 : c.aspect <= 2.5 ? 0.45 : c.aspect <= 4 ? 0.2 : 0.08
  // Below GOOD_SOURCE the image is visibly soft, so the curve drops off a
  // cliff there rather than sloping — a 64px favicon should never beat a real
  // logo, even a white-only one that has to sit on a dark tile.
  const size =
    c.srcSize >= GOOD_SOURCE
      ? 0.7 + 0.3 * (Math.min(c.srcSize, 512) / 512)
      : 0.25 * (c.srcSize / GOOD_SOURCE)
  return aspect * size * (c.isWhite ? 0.35 : 1)
}

// Render the winner into the square tile the app expects.
async function render(c) {
  const bg = c.isWhite ? DARK_BG : WHITE_BG
  try {
    const out = await sharp(c.buf, { density: 300 })
      .resize(OUT_SIZE, OUT_SIZE, { fit: 'contain', background: bg })
      .flatten({ background: bg })
      .png({ compressionLevel: 9, palette: true, quality: 90 })
      .toBuffer()
    const stats = await sharp(out).stats()
    const brightness = Math.round(stats.channels.slice(0, 3).reduce((s, c2) => s + c2.mean, 0) / 3)
    return { buf: out, brightness }
  } catch {
    return null
  }
}

export async function candidatesFor(target, exact) {
  if (exact) return [target]
  const isUrl = target.startsWith('http')
  if (isUrl) {
    const html = await fetchText(target)
    const list = html ? candidatesFromHtml(html, target) : []
    const host = new URL(target).hostname
    if (SOCIAL_HOSTS.test(host)) return list
    return [...list, `https://www.google.com/s2/favicons?domain=${host}&sz=256`]
  }

  const direct = [
    `https://${target}/apple-touch-icon.png`,
    `https://${target}/apple-touch-icon-precomposed.png`,
  ]
  const html = await fetchText(`https://${target}/`)
  const parsed = html ? candidatesFromHtml(html, `https://${target}/`) : []
  return [...direct, ...parsed, `https://www.google.com/s2/favicons?domain=${target}&sz=256`]
}

// Score every viable candidate and take the best, short-circuiting as soon as
// one is clearly good enough (square-ish, sharp, not a white-only variant).
async function resolveLogo(row) {
  const candidates = await candidatesFor(row.target, row.via.startsWith('manual'))
  let best = null
  let smallestSeen = null

  for (const url of candidates.slice(0, 14)) {
    const buf = await fetchBuf(url)
    if (!buf || buf.length === 0) continue
    const c = await inspect(buf, url)
    if (!c) continue
    if (c.tooSmall) {
      smallestSeen = Math.max(smallestSeen ?? 0, c.srcSize)
      continue
    }
    const cand = { url, ...c, score: score(c) }
    if (!best || cand.score > best.score) best = cand
    if (best.score >= 0.85) break
  }

  if (best) {
    const out = await render(best)
    if (out) {
      return {
        ...row,
        status: 'SAVED',
        sourceUrl: best.url,
        srcSize: best.srcSize,
        aspect: Number(best.aspect.toFixed(2)),
        whiteOnDark: best.isWhite,
        format: best.format,
        brightness: out.brightness,
        buf: out.buf,
      }
    }
  }
  return {
    ...row,
    status: smallestSeen ? 'TOO_SMALL' : 'NO_SOURCE',
    sourceUrl: null,
    srcSize: smallestSeen,
    aspect: null,
    whiteOnDark: false,
    format: null,
    brightness: null,
    buf: null,
  }
}

async function mapLimit(items, limit, fn) {
  const results = []
  let cursor = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++
        results[i] = await fn(items[i])
      }
    })
  )
  return results
}

async function main() {
  const live = process.argv.includes('--live')
  const force = process.argv.includes('--force')
  const onlyArg = process.argv.find((a) => a.startsWith('--only='))
  const only = onlyArg
    ? onlyArg.slice('--only='.length).split(';').map((n) => n.trim().toLowerCase()).filter(Boolean)
    : null
  const limitArg = process.argv.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity
  if (limitArg && (!Number.isInteger(limit) || limit < 1)) {
    console.error(`Error: --limit must be a positive integer, got "${limitArg.split('=')[1]}".`)
    process.exit(1)
  }

  const input = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'))
  const targets = []
  for (const r of input.results) {
    const slug = slugify(r.businessName)
    const file = manualFileFor(slug)
    const manual = file ?? MANUAL_LOGOS[r.businessName]
    const flagged = INCLUDE_FLAGGED[r.businessName]
    const target = manual ?? flagged ?? ((r.status === 'OVERRIDE' || r.status === 'RESOLVED') ? r.domain : null)
    if (!target) continue
    if (only && !only.some((n) => r.businessName.toLowerCase().includes(n))) continue
    targets.push({
      businessName: r.businessName,
      slug,
      target,
      via: file ? 'manual-file' : manual ? 'manual' : flagged ? 'approved-flagged' : r.status.toLowerCase(),
    })
  }
  if (only && targets.length === 0) {
    console.error(`Error: --only matched no business in domains-output.json.`)
    process.exit(1)
  }

  fs.mkdirSync(LOGOS_DIR, { recursive: true })
  const existing = new Set(fs.readdirSync(LOGOS_DIR).filter((f) => f.endsWith('.png')))
  const overwrite = force || Boolean(only)
  const skipped = overwrite ? [] : targets.filter((t) => existing.has(`${t.slug}.png`))
  const queue = (overwrite ? targets : targets.filter((t) => !existing.has(`${t.slug}.png`))).slice(0, limit)

  console.log('========================================')
  console.log('LOGO FETCH — PLAN')
  console.log('========================================')
  console.log(`Mode:              ${live ? 'live' : 'dry-run  (nothing written)'}`)
  console.log(`Businesses w/ domain: ${targets.length}`)
  console.log(`  already on disk: ${skipped.length}${overwrite ? ' (will be overwritten)' : ' (skipped)'}`)
  console.log(`  to fetch:        ${queue.length}`)
  console.log(`Output:            public/logos/{slug}.png @ ${OUT_SIZE}x${OUT_SIZE} on white`)
  console.log(`Concurrency:       ${CONCURRENCY}`)
  console.log('')

  if (!live) {
    console.log('DRY RUN — re-run with --live to download.')
    console.log(`\nWould fetch ${queue.length} logos. First 10:`)
    for (const t of queue.slice(0, 10)) console.log(`  ${t.slug.padEnd(34)} <- ${t.target}`)
    return
  }

  let done = 0
  const results = await mapLimit(queue, CONCURRENCY, async (t) => {
    const r = await resolveLogo(t)
    if (r.buf) fs.writeFileSync(path.join(LOGOS_DIR, `${r.slug}.png`), r.buf)
    done++
    if (done % 20 === 0) console.log(`  ...${done}/${queue.length}`)
    const { buf, ...rest } = r
    return rest
  })

  const tally = (s) => results.filter((r) => r.status === s).length
  const summary = {
    generatedAt: new Date().toISOString(),
    businessesWithDomain: targets.length,
    attempted: queue.length,
    skippedExisting: skipped.length,
    saved: tally('SAVED'),
    tooSmall: tally('TOO_SMALL'),
    noSource: tally('NO_SOURCE'),
    lowRes: results.filter((r) => r.status === 'SAVED' && r.srcSize < GOOD_SOURCE).length,
    dark: results.filter((r) => r.status === 'SAVED' && !r.whiteOnDark && r.brightness != null && r.brightness < DARK_THRESHOLD).length,
    whiteOnDark: results.filter((r) => r.whiteOnDark).length,
    wide: results.filter((r) => r.aspect != null && r.aspect > 2.5).length,
    outputSize: OUT_SIZE,
  }

  let merged = results
  if (only && fs.existsSync(OUTPUT_PATH)) {
    const prev = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8')).results
    const touched = new Set(results.map((r) => r.businessName))
    merged = [...prev.filter((r) => !touched.has(r.businessName)), ...results]
  }
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ summary, results: merged }, null, 2))

  console.log('\n========================================')
  console.log('SUMMARY')
  console.log('========================================')
  console.log(`Saved:        ${summary.saved}`)
  console.log(`Too small:    ${summary.tooSmall}`)
  console.log(`No source:    ${summary.noSource}`)
  console.log(`Wrote ${path.relative(process.cwd(), OUTPUT_PATH)}`)
  console.log('========================================')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}
