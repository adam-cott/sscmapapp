#!/usr/bin/env node
// Preview logo files the way the app shows them: masked to the same iPhone
// squircle as BusinessLogo.jsx, 4 per row (pass before/after pairs to compare).
// Usage: node scripts/logo-preview.js <sheet.png> <logo.png> [logo.png ...]

import sharp from 'sharp'

const [, , sheet, ...files] = process.argv

const axis = v => (50 + 50 * Math.sign(v) * Math.abs(v) ** 0.4).toFixed(2)
const pts = []
for (let deg = 0; deg < 360; deg += 2) {
  const t = deg * Math.PI / 180
  pts.push(`${axis(Math.cos(t))},${axis(Math.sin(t))}`)
}
const squircle = s => Buffer.from(`<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='M${pts.join('L')}Z'/></svg>`)

const T = 150, G = 16, N = 4
const comps = []
for (const [i, f] of files.entries()) {
  const tile = await sharp(await sharp(f).resize(T, T).png().toBuffer()).composite([{ input: squircle(T), blend: 'dest-in' }]).png().toBuffer()
  comps.push({ input: tile, left: G + (i % N) * (T + G), top: G + Math.floor(i / N) * (T + G) })
}
await sharp({ create: { width: G + N * (T + G), height: G + Math.ceil(files.length / N) * (T + G), channels: 3, background: '#f0f4f8' } })
  .composite(comps).png().toFile(sheet)
