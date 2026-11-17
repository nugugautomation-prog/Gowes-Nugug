// Membuat ikon PNG (roda sepeda neon di latar gelap) tanpa pustaka gambar.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const BG = [0x0c, 0x10, 0x0d]
const NEON = [0x39, 0xff, 0x14]

function crc32(buf) {
  let crc = 0xffffffff
  for (let n = 0; n < buf.length; n++) {
    let c = (crc ^ buf[n]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function png(size, coverage) {
  const stride = size * 4 + 1
  const raw = Buffer.alloc(stride * size)
  const SS = 3
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0
    for (let x = 0; x < size; x++) {
      let a = 0
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++)
          a += coverage(
            ((x + (sx + 0.5) / SS) / size) * 2 - 1,
            ((y + (sy + 0.5) / SS) / size) * 2 - 1,
          )
      a /= SS * SS
      const o = y * stride + 1 + x * 4
      for (let i = 0; i < 3; i++) raw[o + i] = Math.round(BG[i] + (NEON[i] - BG[i]) * a)
      raw[o + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
// koordinat -1..1; gambar di dalam radius 0.68 (aman untuk ikon maskable)
function wheel(px, py) {
  const r = Math.hypot(px, py)
  const ring = r > 0.54 && r < 0.68 ? 1 : 0
  const hub = r < 0.1 ? 1 : 0
  const unit = Math.atan2(py, px) / (Math.PI / 4)
  const frac = unit - Math.floor(unit)
  const distToSpoke = Math.min(frac, 1 - frac) * (Math.PI / 4) * r
  const spoke = r < 0.56 && distToSpoke < 0.012 ? 1 : 0
  return ring || hub || spoke ? 1 : 0
}
mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', png(192, wheel))
writeFileSync('public/icons/icon-512.png', png(512, wheel))
writeFileSync('public/icons/icon-maskable-512.png', png(512, wheel))
console.log('Ikon dibuat di public/icons')
