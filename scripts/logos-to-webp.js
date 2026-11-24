#!/usr/bin/env node
// Convert public/logos/*.png to .webp (same 512 px, ~72% smaller) and remove
// the PNGs. Local only. Run after adding PNG logos by hand.
import sharp from 'sharp'
import fs from 'fs'

const dir = 'public/logos'
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.png'))) {
  await sharp(`${dir}/${f}`).webp({ quality: 85 }).toFile(`${dir}/${f.replace(/\.png$/, '.webp')}`)
  fs.unlinkSync(`${dir}/${f}`)
}
