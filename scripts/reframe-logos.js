#!/usr/bin/env node
// Re-frame logo tiles to 512x512 PNGs in an output folder (never in place —
// preview first, then copy the approved files into public/logos/ AND
// scripts/manual-logos/). Local only: no network, no API calls.
//
// Usage: node scripts/reframe-logos.js <outDir> '<json spec>'
// Spec maps each slug to one of:
//   { fit: 0.86, bg: [x, y] }   find the mark against the background color
//                               sampled at (x, y), scale it to fill 86% of the
//                               tile, and pad with that color. Optional:
//                               region [x0, y0, x1, y1] limits where the mark
//                               is looked for (e.g. a colored band in a
//                               letterboxed file); threshold (default 60) is
//                               how different a pixel must be to count.
//   { zoom: 1.1 }               center-crop zoom, for photo/texture backgrounds.
//   { crop: [x, y, w, h], fit } photo banners: keep that rectangle sharp and
//                               centered over a blurred copy of itself.
// Any entry may set src to read a different file than public/logos/<slug>.png
// (e.g. a downloaded source image). Example:
//   node scripts/reframe-logos.js out '{"culver-s":{"fit":0.88,"bg":[6,150],"region":[0,140,512,370]}}'

import sharp from 'sharp'

const [, , outDir, spec] = process.argv

for (const [slug, o] of Object.entries(JSON.parse(spec))) {
  const src = o.src ?? `public/logos/${slug}.png`
  let img
  if (o.crop) {
    const [x, y, w, h] = o.crop
    const rect = await sharp(src).extract({ left: x, top: y, width: w, height: h }).toBuffer()
    const side = Math.round(Math.max(w, h) / (o.fit ?? 1))
    const backdrop = await sharp(rect).resize(side, side, { fit: 'cover' }).blur(25).modulate({ brightness: 0.8 }).toBuffer()
    img = sharp(await sharp(backdrop).composite([{ input: rect, left: Math.round((side - w) / 2), top: Math.round((side - h) / 2) }]).toBuffer())
  } else if (o.zoom) {
    const { width } = await sharp(src).metadata()
    const crop = Math.round(width / o.zoom), off = Math.round((width - crop) / 2)
    img = sharp(src).extract({ left: off, top: off, width: crop, height: crop })
  } else {
    const { data, info } = await sharp(src).flatten({ background: '#fff' }).raw().toBuffer({ resolveWithObject: true })
    const { width: W, height: H, channels: C } = info
    const [sx, sy] = o.bg ?? [256, 6]
    const bg = [0, 1, 2].map(k => data[(sy * W + sx) * C + k])
    const differs = i => Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) > (o.threshold ?? 60)
    let x0 = W, y0 = H, x1 = -1, y1 = -1
    const [rx0, ry0, rx1, ry1] = o.region ?? [0, 0, W, H]
    for (let y = ry0; y < ry1; y++) for (let x = rx0; x < rx1; x++) if (differs((y * W + x) * C)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
    const w = x1 - x0 + 1, h = y1 - y0 + 1
    const side = Math.round(Math.max(w, h) / o.fit)
    const background = { r: bg[0], g: bg[1], b: bg[2] }
    console.log(`${slug}: bg rgb(${bg}) mark ${w}x${h} -> ${Math.round(100 * Math.max(w, h) / W)}% of tile now, ${Math.round(o.fit * 100)}% after`)
    // sharp runs extend after resize, so the padding gets its own pass.
    img = sharp(await sharp(await sharp(src).flatten({ background }).extract({ left: x0, top: y0, width: w, height: h }).toBuffer())
      .extend({ top: Math.floor((side - h) / 2), bottom: Math.ceil((side - h) / 2), left: Math.floor((side - w) / 2), right: Math.ceil((side - w) / 2), background })
      .toBuffer())
  }
  await img.resize(512, 512, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(`${outDir}/${slug}.png`)
}
