import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Experience } from './game/Experience'
import { Intro, RideOverlay } from './ui/Overlay'
import { ClassicView } from './ui/ClassicView'
import { useGame } from './store/useGame'
import { input } from './game/state'
import { bell, setMuted, setRain } from './audio/sound'

const KEYS: Record<string, keyof typeof input> = {
  KeyW: 'fwd',
  ArrowUp: 'fwd',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
}

function useKeyboard() {
  useEffect(() => {
    const typing = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
    }
    const down = (e: KeyboardEvent) => {
      if (typing(e) || useGame.getState().phase !== 'ride') return
      const k = KEYS[e.code]
      if (k) {
        input[k] = true
        e.preventDefault()
      } else if (e.code === 'Space') {
        e.preventDefault()
        if (!e.repeat) bell()
      } else if (e.code === 'Escape') useGame.getState().dismiss()
    }
    const up = (e: KeyboardEvent) => {
      const k = KEYS[e.code]
      if (k) input[k] = false
    }
    const clear = () => {
      input.fwd = input.back = input.left = input.right = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])
}

/** Canvas textures are painted with web fonts, so wait (briefly) for them first. */
function useFonts() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    const done = () => setOk(true)
    const t = setTimeout(done, 2500)
    Promise.all([
      document.fonts.load('800 40px "Baloo Da 2"', 'Aঅ'),
      document.fonts.load('800 40px "Baloo Da 2"', 'রিকশা'),
    ])
      .then(() => document.fonts.ready)
      .then(done, done)
    return () => clearTimeout(t)
  }, [])
  return ok
}

export default function App() {
  const phase = useGame((s) => s.phase)
  const muted = useGame((s) => s.muted)
  const rain = useGame((s) => s.rain)
  const fonts = useFonts()
  const [touch, setTouch] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  useKeyboard()
  // Hybrid devices report a fine pointer; show the touch controls as soon as the screen is touched.
  useEffect(() => {
    if (touch) return
    const on = () => setTouch(true)
    window.addEventListener('touchstart', on, { once: true, passive: true })
    return () => window.removeEventListener('touchstart', on)
  }, [touch])
  useEffect(() => setMuted(muted), [muted])
  useEffect(() => setRain(rain), [rain])
  useEffect(() => {
    document.body.classList.toggle('scrollable', phase === 'classic')
  }, [phase])

  return (
    <>
      <div className="stage" hidden={phase === 'classic'}>
        {fonts && (
          <Canvas
            shadows
            dpr={[1, touch ? 1.5 : 1.75]}
            camera={{ fov: 50, near: 0.1, far: 450, position: [6, 4, 10] }}
            frameloop={phase === 'classic' ? 'never' : 'always'}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
          >
            <Suspense fallback={null}>
              <Experience />
            </Suspense>
          </Canvas>
        )}
      </div>
      {phase === 'intro' && <Intro touch={touch} />}
      {phase === 'ride' && <RideOverlay touch={touch} />}
      {phase === 'classic' && <ClassicView />}
    </>
  )
}
