// All sounds are synthesized with the Web Audio API, so no audio files are needed.

let ctx: AudioContext | null = null
let master: GainNode
let rainGain: GainNode
let ambienceTimer = 0

function noiseBuffer(c: AudioContext, seconds: number, brown = false) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate)
  const d = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < d.length; i++) {
    const white = Math.random() * 2 - 1
    if (brown) {
      last = (last + 0.02 * white) / 1.02
      d[i] = last * 3.5
    } else d[i] = white
  }
  return buf
}

function loop(buf: AudioBuffer, filter: BiquadFilterType, freq: number, gain: number) {
  const c = ctx!
  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true
  const f = c.createBiquadFilter()
  f.type = filter
  f.frequency.value = freq
  const g = c.createGain()
  g.gain.value = gain
  src.connect(f).connect(g).connect(master)
  src.start()
  return g
}

export function initAudio(muted: boolean) {
  if (ctx) {
    ctx.resume()
    return
  }
  const AC = window.AudioContext || (window as any).webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = muted ? 0 : 0.8
  master.connect(ctx.destination)
  loop(noiseBuffer(ctx, 4, true), 'lowpass', 450, 0.06) // distant city rumble
  rainGain = loop(noiseBuffer(ctx, 3), 'highpass', 1200, 0)
  scheduleAmbience()
}

function scheduleAmbience() {
  window.clearTimeout(ambienceTimer)
  ambienceTimer = window.setTimeout(() => {
    if (Math.random() < 0.6) bell(0.25) // a rickshaw ringing somewhere down the street
    else crow()
    scheduleAmbience()
  }, 5000 + Math.random() * 9000)
}

export function setMuted(m: boolean) {
  if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.05)
}

export function setRain(on: boolean) {
  if (ctx) rainGain.gain.setTargetAtTime(on ? 0.18 : 0, ctx.currentTime, 0.5)
}

function tone(type: OscillatorType, freq: number, start: number, dur: number, vol: number, endFreq?: number) {
  const c = ctx!
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, start)
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, start + dur)
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(vol, start + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  o.connect(g).connect(master)
  o.start(start)
  o.stop(start + dur + 0.05)
}

/** The classic rickshaw bell: "tring tring". */
export function bell(vol = 1) {
  if (!ctx) return
  const t = ctx.currentTime
  for (const offset of [0, 0.16]) {
    for (let k = 0; k < 6; k++) {
      const s = t + offset + k * 0.022
      tone('sine', 2350, s, 0.5, 0.12 * vol)
      tone('sine', 3530, s, 0.35, 0.05 * vol)
      tone('triangle', 5900, s, 0.12, 0.03 * vol)
    }
  }
}

function crow() {
  if (!ctx) return
  const t = ctx.currentTime
  tone('sawtooth', 820, t, 0.22, 0.03, 520)
  tone('sawtooth', 800, t + 0.32, 0.22, 0.03, 500)
}

export function pedalTick() {
  if (!ctx) return
  tone('square', 1800, ctx.currentTime, 0.02, 0.008)
}

export function pop() {
  if (!ctx) return
  tone('sine', 500, ctx.currentTime, 0.18, 0.2, 1300)
}

export function chime() {
  if (!ctx) return
  const t = ctx.currentTime
  ;[660, 880, 1320].forEach((f, i) => tone('triangle', f, t + i * 0.09, 0.5, 0.08))
}

/** A river launch's deep horn, sounding across the water at Sadarghat. */
export function launchHorn(vol = 1) {
  if (!ctx) return
  const c = ctx
  const t = c.currentTime
  const f = c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 600
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.09 * vol, t + 0.25)
  g.gain.setValueAtTime(0.09 * vol, t + 1.5)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2)
  f.connect(g).connect(master)
  for (const freq of [98, 123.5, 147]) {
    const o = c.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = freq
    o.connect(f)
    o.start(t)
    o.stop(t + 2.3)
  }
}
