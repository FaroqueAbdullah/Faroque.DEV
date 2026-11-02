import * as THREE from 'three'

// Every texture in the world is painted at runtime on a <canvas>,
// in the spirit of Bangladeshi rickshaw art. Results are cached by key.

export const C = {
  red: '#d7263d',
  green: '#0b8a4f',
  yellow: '#ffc83d',
  pink: '#e8378c',
  blue: '#2459b8',
  orange: '#f2780c',
  teal: '#14a3a3',
  purple: '#7b2fbf',
  cream: '#fff3d6',
  ink: '#1d1a2f',
}
const ART = [C.red, C.green, C.yellow, C.pink, C.blue, C.orange, C.teal, C.purple]
export const FONT = '"Baloo Da 2", "Hind Siliguri", "Noto Sans Bengali", system-ui, sans-serif'

const cache = new Map<string, THREE.Texture>()

type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void

function make(key: string, w: number, h: number, draw: Draw, repeat = false) {
  const hit = cache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  draw(canvas.getContext('2d')!, w, h)
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  cache.set(key, t)
  return t
}

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function flower(g: CanvasRenderingContext2D, x: number, y: number, r: number, petal: string, center: string, n = 8) {
  g.fillStyle = petal
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    g.beginPath()
    g.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.48, r * 0.22, a, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = center
  g.beginPath()
  g.arc(x, y, r * 0.28, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#fff'
  g.beginPath()
  g.arc(x - r * 0.08, y - r * 0.08, r * 0.08, 0, Math.PI * 2)
  g.fill()
}

/** Painted frame of alternating triangles and dots. */
function frame(g: CanvasRenderingContext2D, w: number, h: number, s: number, a: string, b: string) {
  g.fillStyle = a
  g.fillRect(0, 0, w, s)
  g.fillRect(0, h - s, w, s)
  g.fillRect(0, 0, s, h)
  g.fillRect(w - s, 0, s, h)
  g.fillStyle = b
  const step = s * 1.6
  for (let x = step / 2; x < w; x += step) {
    dot(g, x, s / 2, s * 0.28)
    dot(g, x, h - s / 2, s * 0.28)
  }
  for (let y = step / 2; y < h; y += step) {
    dot(g, s / 2, y, s * 0.28)
    dot(g, w - s / 2, y, s * 0.28)
  }
}
function dot(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath()
  g.arc(x, y, r, 0, Math.PI * 2)
  g.fill()
}

function fitText(g: CanvasRenderingContext2D, text: string, maxW: number, size: number, weight = 800) {
  let s = size
  do {
    g.font = `${weight} ${s}px ${FONT}`
    s -= 2
  } while (g.measureText(text).width > maxW && s > 10)
}

export interface SignLine {
  text: string
  size?: number
  color?: string
}

/** A hand-painted shop signboard. */
export function signTexture(
  key: string,
  lines: SignLine[],
  opts: { w?: number; h?: number; bg?: string; fg?: string; border?: string; dots?: string; flowers?: boolean } = {},
) {
  const { w = 1024, h = 384, bg = C.yellow, fg = C.red, border = C.green, dots = C.yellow, flowers = true } = opts
  return make('sign:' + key, w, h, (g) => {
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    const s = Math.round(h * 0.07)
    frame(g, w, h, s, border, dots)
    if (flowers) {
      flower(g, s * 3, h / 2, h * 0.16, C.pink, C.yellow)
      flower(g, w - s * 3, h / 2, h * 0.16, C.pink, C.yellow)
    }
    const total = lines.reduce((acc, l) => acc + (l.size ?? 100), 0) * 1.08
    let y = h / 2 - total / 2
    const inner = w - (flowers ? s * 8 : s * 3)
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    for (const l of lines) {
      const size = l.size ?? 100
      y += (size * 1.08) / 2
      fitText(g, l.text, inner, size)
      g.lineWidth = size * 0.12
      g.strokeStyle = 'rgba(255,255,255,0.85)'
      g.strokeText(l.text, w / 2, y + size * 0.04)
      g.fillStyle = l.color ?? fg
      g.fillText(l.text, w / 2, y + size * 0.04)
      y += (size * 1.08) / 2
    }
  })
}

/** The painted plate on the back of a rickshaw. */
export function artPanelTexture(seed: number) {
  return make('art:' + seed, 512, 256, (g, w, h) => {
    const r = rng(seed)
    const bg = ART[Math.floor(r() * ART.length)]
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    frame(g, w, h, 18, C.cream, C.red)
    // sun-burst behind central motif
    g.save()
    g.translate(w / 2, h / 2)
    for (let i = 0; i < 24; i++) {
      g.rotate(Math.PI / 12)
      g.fillStyle = i % 2 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)'
      g.beginPath()
      g.moveTo(0, 0)
      g.lineTo(200, -26)
      g.lineTo(200, 26)
      g.fill()
    }
    g.restore()
    // peacock-like bird: body + fanned tail of eyes
    g.save()
    g.translate(w / 2, h / 2 + 30)
    for (let i = -5; i <= 5; i++) {
      const a = -Math.PI / 2 + i * 0.22
      const x = Math.cos(a) * 95
      const y = Math.sin(a) * 95
      g.strokeStyle = C.green
      g.lineWidth = 6
      g.beginPath()
      g.moveTo(0, 0)
      g.lineTo(x, y)
      g.stroke()
      g.fillStyle = C.teal
      dot(g, x, y, 15)
      g.fillStyle = C.blue
      dot(g, x, y, 9)
      g.fillStyle = C.yellow
      dot(g, x, y, 4)
    }
    g.fillStyle = C.blue
    g.beginPath()
    g.ellipse(0, -10, 18, 38, 0, 0, Math.PI * 2)
    g.fill()
    dot(g, 0, -55, 13)
    g.fillStyle = C.yellow
    g.beginPath()
    g.moveTo(10, -58)
    g.lineTo(26, -54)
    g.lineTo(10, -50)
    g.fill()
    g.restore()
    flower(g, 70, h / 2, 46, C.pink, C.yellow, 9)
    flower(g, w - 70, h / 2, 46, C.pink, C.yellow, 9)
    flower(g, 140, 60, 20, C.yellow, C.red, 7)
    flower(g, w - 140, 60, 20, C.yellow, C.red, 7)
    flower(g, 140, h - 60, 20, C.cream, C.blue, 7)
    flower(g, w - 140, h - 60, 20, C.cream, C.blue, 7)
  })
}

/** Striped, flowered fabric of the rickshaw hood. */
export function hoodTexture() {
  return make('hood', 512, 512, (g, w, h) => {
    const bands = [C.red, C.ink, C.yellow, C.ink, C.green, C.ink, C.pink, C.ink, C.blue, C.ink]
    const bh = h / bands.length
    bands.forEach((c, i) => {
      g.fillStyle = c
      g.fillRect(0, i * bh, w, bh)
    })
    for (let i = 0; i < bands.length; i += 2) {
      for (let x = 32; x < w; x += 64) flower(g, x, i * bh + bh / 2, bh * 0.42, C.cream, C.orange, 6)
    }
  })
}

export function checkTexture(key: string, a: string, b: string, cells = 8) {
  return make('check:' + key, 128, 128, (g, w) => {
    const s = w / cells
    g.fillStyle = a
    g.fillRect(0, 0, w, w)
    g.fillStyle = b
    g.globalAlpha = 0.6
    for (let i = 0; i < cells; i += 2) {
      g.fillRect(i * s, 0, s, w)
      g.fillRect(0, i * s, w, s)
    }
  }, true)
}

export function stripeTexture(key: string, colors: string[], vertical = true) {
  return make('stripe:' + key, 256, 256, (g, w, h) => {
    const n = colors.length * 2
    for (let i = 0; i < n; i++) {
      g.fillStyle = colors[i % colors.length]
      if (vertical) g.fillRect((i * w) / n, 0, w / n + 1, h)
      else g.fillRect(0, (i * h) / n, w, h / n + 1)
    }
  }, true)
}

/** Building facade with a grid of windows; one tile = 2 windows wide x 1 floor tall. */
export function facadeTexture(color: string, seed: number) {
  return make(`facade:${color}:${seed}`, 256, 128, (g, w, h) => {
    const r = rng(seed)
    g.fillStyle = color
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `rgba(0,0,0,${r() * 0.06})`
      g.fillRect(r() * w, r() * h, 3 + r() * 10, 3 + r() * 10)
    }
    g.fillStyle = 'rgba(0,0,0,0.18)'
    g.fillRect(0, h - 10, w, 10) // floor slab
    for (let i = 0; i < 2; i++) {
      const x = 28 + i * 128
      g.fillStyle = '#2b3446'
      g.fillRect(x, 26, 72, 70)
      g.fillStyle = 'rgba(160,200,230,0.35)'
      g.fillRect(x + 6, 32, 28, 58)
      g.strokeStyle = '#d9d2c0'
      g.lineWidth = 5
      g.strokeRect(x, 26, 72, 70)
      // window grill
      g.strokeStyle = 'rgba(30,30,30,0.7)'
      g.lineWidth = 2
      for (let k = 1; k < 5; k++) {
        g.beginPath()
        g.moveTo(x + k * 14.4, 26)
        g.lineTo(x + k * 14.4, 96)
        g.stroke()
      }
    }
  }, true)
}

/** Emissive map that lights up some of the facade windows at night. */
export function litWindowsTexture(seed: number) {
  return make('lit:' + seed, 256, 128, (g, w, h) => {
    const r = rng(seed)
    g.fillStyle = '#000'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 2; i++) {
      if (r() < 0.55) {
        g.fillStyle = r() < 0.7 ? '#ffcf73' : '#bfe3ff'
        g.fillRect(28 + i * 128, 26, 72, 70)
      }
    }
  }, true)
}

export function shopFrontTexture(seed: number) {
  return make('shop:' + seed, 512, 128, (g, w, h) => {
    const r = rng(seed)
    g.fillStyle = '#3a3a3a'
    g.fillRect(0, 0, w, h)
    // rolling shutter lines
    g.fillStyle = '#8c8c8c'
    for (let y = 40; y < h; y += 8) g.fillRect(10, y, w - 20, 4)
    g.fillStyle = ART[Math.floor(r() * ART.length)]
    g.fillRect(0, 0, w, 36)
    g.fillStyle = '#fff'
    g.font = `800 26px ${FONT}`
    g.textAlign = 'center'
    const names = ['মায়ের দোয়া স্টোর', 'বিসমিল্লাহ হোটেল', 'নিউ ফ্যাশন', 'ভাই ভাই ট্রেডার্স', 'জননী ফার্মেসী', 'সততা টেলিকম']
    g.fillText(names[Math.floor(r() * names.length)], w / 2, 27)
  })
}

/** White rice-paste style alpona pattern painted on the road at every stop. */
export function alponaTexture() {
  return make('alpona', 512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    g.translate(w / 2, h / 2)
    g.strokeStyle = 'rgba(255,255,255,0.92)'
    g.fillStyle = 'rgba(255,255,255,0.92)'
    g.lineWidth = 7
    for (const r of [235, 200, 70]) {
      g.beginPath()
      g.arc(0, 0, r, 0, Math.PI * 2)
      g.stroke()
    }
    for (let i = 0; i < 16; i++) {
      g.save()
      g.rotate((i / 16) * Math.PI * 2)
      g.beginPath()
      g.ellipse(0, -135, 22, 60, 0, 0, Math.PI * 2)
      g.stroke()
      dot(g, 0, -218, 9)
      g.restore()
    }
    for (let i = 0; i < 8; i++) {
      g.save()
      g.rotate((i / 8) * Math.PI * 2 + Math.PI / 8)
      g.beginPath()
      g.ellipse(0, -38, 12, 26, 0, 0, Math.PI * 2)
      g.fill()
      g.restore()
    }
  })
}

/** The flag of Bangladesh: red disc on bottle green, set slightly towards the hoist. */
export function flagTexture() {
  return make('flag', 500, 300, (g, w, h) => {
    g.fillStyle = '#006a4e'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#f42a41'
    dot(g, w * 0.45, h / 2, h * 0.33)
  })
}

/**
 * One passenger deck of a river launch, seen from the side: open railings with
 * benches and passengers above, a row of cabin windows below, a painted stripe at the foot.
 */
export function launchDeckTexture(stripe: string, trim: string) {
  return make(`launch-deck:${stripe}:${trim}`, 1024, 128, (g, w, h) => {
    g.fillStyle = '#f7f5ee'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#2b3a4a'
    g.fillRect(0, 10, w, 58) // shaded open deck
    const r = rng(stripe.length * 31 + trim.length)
    const shirts = [C.red, C.yellow, C.green, C.blue, C.pink, C.orange, '#ffffff', C.teal]
    for (let x = 14; x < w; x += 22) {
      if (r() < 0.45) continue
      g.fillStyle = shirts[Math.floor(r() * shirts.length)]
      g.fillRect(x, 38, 12, 26)
      g.fillStyle = '#5a3a22'
      g.beginPath()
      g.arc(x + 6, 32, 6, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = '#e9e6dc'
    for (let x = 0; x < w; x += 16) g.fillRect(x, 44, 3, 26) // railing balusters
    g.fillRect(0, 42, w, 4)
    g.fillStyle = trim
    g.fillRect(0, 0, w, 10)
    for (let x = 18; x < w; x += 56) {
      g.fillStyle = '#1f5f7a'
      g.fillRect(x, 76, 36, 22) // cabin windows
      g.fillStyle = 'rgba(255,255,255,0.35)'
      g.fillRect(x + 3, 79, 12, 6)
    }
    g.fillStyle = stripe
    g.fillRect(0, h - 22, w, 22)
    g.fillStyle = trim
    g.fillRect(0, h - 26, w, 4)
  })
}

/** Night glow for `launchDeckTexture`: the lit cabins and strings of fairy lights along the rails. */
export function launchDeckGlowTexture() {
  return make('launch-deck-glow', 1024, 128, (g, w, h) => {
    g.fillStyle = '#000'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ffd98a'
    g.fillRect(0, 12, w, 30)
    for (let x = 18; x < w; x += 56) g.fillRect(x, 76, 36, 22)
    const bulbs = [C.red, C.yellow, C.green, C.blue, C.pink]
    for (let x = 6, i = 0; x < w; x += 18, i++) {
      g.fillStyle = bulbs[i % bulbs.length]
      g.beginPath()
      g.arc(x, h - 24, 4, 0, Math.PI * 2)
      g.fill()
    }
  })
}

/** Painted hull side with the launch's name in Bangla and English and its route. */
export function launchHullTexture(name: { en: string; bn: string }, route: string, a: string, b: string) {
  return make(`launch-hull:${name.en}`, 1024, 128, (g, w, h) => {
    g.fillStyle = '#fbfaf6'
    g.fillRect(0, 0, w, h)
    g.fillStyle = a
    g.fillRect(0, 0, w, 16)
    g.fillStyle = b
    g.fillRect(0, 16, w, 8)
    g.fillStyle = '#7a1d1d'
    g.fillRect(0, h - 26, w, 26) // anti-fouling red at the waterline
    g.fillStyle = a
    g.fillRect(0, h - 34, w, 8)
    g.textBaseline = 'middle'
    g.textAlign = 'left'
    fitText(g, name.bn, 360, 52)
    g.fillStyle = a
    g.fillText(name.bn, 150, 60)
    g.textAlign = 'right'
    fitText(g, 'M.V. ' + name.en.toUpperCase(), 360, 40)
    g.fillStyle = C.ink
    g.fillText('M.V. ' + name.en.toUpperCase(), w - 140, 54)
    fitText(g, route, 300, 24, 700)
    g.fillStyle = b
    g.fillText(route, w - 140, 82)
    g.fillStyle = '#1d1a2f'
    for (let x = 30; x < 120; x += 36) {
      g.beginPath()
      g.arc(x, 62, 9, 0, Math.PI * 2)
      g.fill() // portholes
    }
  })
}
