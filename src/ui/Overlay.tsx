import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { useGame } from '../store/useGame'
import { ZONES, ROAD } from '../game/zones'
import { input } from '../game/state'
import { FUCHKA_COUNT } from '../game/Collectibles'
import { bell, initAudio } from '../audio/sound'
import { profile, ui } from '../content/content'
import { SectionContent } from './Sections'

const Icon = {
  bell: (
    <path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6Zm-2 15a2 2 0 0 0 4 0" />
  ),
  sound: <path d="M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />,
  mute: <path d="M4 9h4l5-4v14l-5-4H4zM16 9l5 6M21 9l-5 6" />,
  rain: <path d="M6 14a4 4 0 0 1 1-7.9A5 5 0 0 1 17 7a3.5 3.5 0 0 1 1 7H6Zm2 3-1 3m5-3-1 3m5-3-1 3" />,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
  sun: <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0-5v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17m10-10 1.4-1.4" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  book: <path d="M4 19V5a2 2 0 0 1 2-2h14v14H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h14M8 7h8M8 11h6" />,
}

function IconButton({ label, onClick, children, pressed, className = '' }: { label: string; onClick: () => void; children: ReactNode; pressed?: boolean; className?: string }) {
  return (
    <button className={'icon-btn ' + className} aria-label={label} title={label} aria-pressed={pressed} onClick={onClick}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  )
}

function Route() {
  const z = useGame((s) => s.progressZ)
  const lang = useGame((s) => s.lang)
  const heading = useGame((s) => s.heading)
  const total = ROAD.start - ROAD.end
  const frac = (pos: number) => Math.min(1, Math.max(0, (ROAD.start - pos) / total))
  const next = heading > 0 ? ZONES.find((zone) => zone.z < z - 6) : [...ZONES].reverse().find((zone) => zone.z > z + 6)
  return (
    <div className="route" aria-label="Route progress">
      <div className="track">
        {ZONES.map((zone) => (
          <span key={zone.id} className={'stop' + (zone.z >= z - 6 ? ' done' : '')} style={{ left: `${frac(zone.z) * 100}%` }} title={zone.title[lang]} />
        ))}
        <span className={'me' + (heading < 0 ? ' back' : '')} style={{ left: `${frac(z) * 100}%` }} />
      </div>
      <div className="next">
        {next ? (
          <>
            {ui.nextStop[lang]}: <b>{next.gate[lang]}</b> · {Math.max(0, Math.round(Math.abs(z - next.z)))} m
          </>
        ) : heading > 0 ? (
          ui.endOfRoad[lang]
        ) : (
          ui.backAtStart[lang]
        )}
      </div>
    </div>
  )
}

function Hud() {
  const g = useGame()
  const lang = g.lang
  const ref = useRef<HTMLElement>(null)
  // The HUD wraps differently per screen size; publish its height so the panel can sit just below it.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const root = document.documentElement.style
    const ro = new ResizeObserver(() => root.setProperty('--hud-h', `${el.getBoundingClientRect().bottom}px`))
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.removeProperty('--hud-h')
    }
  }, [])
  return (
    <header className="hud" ref={ref}>
      <div className="brand painted-chip">{profile.name[lang]}</div>
      <Route />
      <div className="hud-actions">
        <IconButton label="Ring the bell" onClick={bell} className="hud-bell">
          {Icon.bell}
        </IconButton>
        <IconButton label={g.muted ? 'Unmute' : 'Mute'} onClick={g.toggleMuted} pressed={g.muted}>
          {g.muted ? Icon.mute : Icon.sound}
        </IconButton>
        <IconButton label="Monsoon rain" onClick={g.toggleRain} pressed={g.rain}>
          {Icon.rain}
        </IconButton>
        <IconButton label={g.night ? 'Day' : 'Night'} onClick={g.toggleNight}>
          {g.night ? Icon.sun : Icon.moon}
        </IconButton>
        <button className="icon-btn lang" onClick={g.toggleLang} aria-label="Switch language">
          {lang === 'en' ? 'বাং' : 'EN'}
        </button>
        <button className="btn small hud-classic" onClick={() => g.setPhase('classic')}>
          {ui.classic[lang]}
        </button>
        <IconButton label={ui.classic[lang]} onClick={() => g.setPhase('classic')} className="hud-classic-icon">
          {Icon.book}
        </IconButton>
      </div>
      <div className="fuchka-count painted-chip" aria-live="polite">
        <span className="fuchka-dot" /> <span className="fuchka-label">{ui.fuchka[lang]}</span> {g.collected.length}/{FUCHKA_COUNT}
      </div>
    </header>
  )
}

function Panel() {
  const active = useGame((s) => s.activeZone)
  const dismissed = useGame((s) => s.dismissed)
  const lang = useGame((s) => s.lang)
  const dismiss = useGame((s) => s.dismiss)
  const zone = ZONES.find((z) => z.id === active)
  if (!zone || dismissed === active) return null
  return (
    <aside className="panel painted" key={zone.id} aria-live="polite">
      <div className="panel-head">
        <h2>{zone.title[lang]}</h2>
        <IconButton label={ui.close[lang]} onClick={dismiss}>
          {Icon.close}
        </IconButton>
      </div>
      <div className="panel-body">
        <SectionContent id={zone.id} lang={lang} />
      </div>
    </aside>
  )
}

function Hold({ dir, label, children }: { dir: keyof typeof input; label: string; children: ReactNode }) {
  const on = (e: PointerEvent) => {
    e.preventDefault()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    input[dir] = true
  }
  const off = () => {
    input[dir] = false
  }
  return (
    <button className={'touch-btn ' + dir} aria-label={label} onPointerDown={on} onPointerUp={off} onPointerCancel={off} onLostPointerCapture={off} onContextMenu={(e) => e.preventDefault()}>
      {children}
    </button>
  )
}

function TouchControls() {
  return (
    <div className="touch">
      <div className="pad">
        <Hold dir="left" label="Steer left">◀</Hold>
        <Hold dir="right" label="Steer right">▶</Hold>
      </div>
      <div className="pad right">
        <button className="touch-btn bell" aria-label="Ring the bell" onPointerDown={() => bell()}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {Icon.bell}
          </svg>
        </button>
        <Hold dir="back" label="Brake">▼</Hold>
        <Hold dir="fwd" label="Pedal">▲</Hold>
      </div>
    </div>
  )
}

function Toast() {
  const toast = useGame((s) => s.toast)
  const showToast = useGame((s) => s.showToast)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => showToast(null), 6000)
    return () => clearTimeout(t)
  }, [toast, showToast])
  return toast ? (
    <div className="toast painted" role="status">
      {toast}
    </div>
  ) : null
}

function ControlsHint({ touch }: { touch: boolean }) {
  const lang = useGame((s) => s.lang)
  const z = useGame((s) => s.progressZ)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    if (z < -4) setGone(true)
  }, [z])
  if (gone) return null
  return <div className={'controls-hint' + (touch ? ' above-touch' : '')}>{touch ? ui.touchControls[lang] : ui.controls[lang]}</div>
}

export function RideOverlay({ touch }: { touch: boolean }) {
  return (
    <>
      <Hud />
      <Panel />
      <Toast />
      <ControlsHint touch={touch} />
      {touch && <TouchControls />}
    </>
  )
}

export function Intro({ touch }: { touch: boolean }) {
  const lang = useGame((s) => s.lang)
  const ready = useGame((s) => s.ready)
  const muted = useGame((s) => s.muted)
  const setPhase = useGame((s) => s.setPhase)
  const toggleLang = useGame((s) => s.toggleLang)
  const start = () => {
    initAudio(muted)
    bell()
    setPhase('ride')
  }
  return (
    <div className="intro">
      <div className="intro-card painted">
        <button className="icon-btn lang corner" onClick={toggleLang} aria-label="Switch language">
          {lang === 'en' ? 'বাং' : 'EN'}
        </button>
        <p className="eyebrow">রিকশা রাইড · Rickshaw Ride</p>
        <h1 className="display">{profile.name[lang]}</h1>
        <p className="role">{profile.role[lang]}</p>
        <p>{profile.tagline[lang]}</p>
        <div className="intro-actions">
          <button className="btn primary big" onClick={start} disabled={!ready}>
            {ready ? ui.ride[lang] : ui.loading[lang]}
          </button>
          <button className="btn" onClick={() => setPhase('classic')}>
            {ui.classic[lang]}
          </button>
        </div>
        <p className="hint">{touch ? ui.touchControls[lang] : ui.controls[lang]}</p>
      </div>
    </div>
  )
}
