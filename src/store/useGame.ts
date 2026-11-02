import { create } from 'zustand'
import type { Lang } from '../content/content'
import type { ZoneId } from '../game/zones'

type Phase = 'intro' | 'ride' | 'classic'

interface GameState {
  phase: Phase
  ready: boolean
  lang: Lang
  muted: boolean
  rain: boolean
  night: boolean
  activeZone: ZoneId | null
  dismissed: ZoneId | null
  progressZ: number
  heading: 1 | -1
  collected: number[]
  toast: string | null
  setPhase: (p: Phase) => void
  setReady: (r: boolean) => void
  toggleLang: () => void
  toggleMuted: () => void
  toggleRain: () => void
  toggleNight: () => void
  setActiveZone: (z: ZoneId | null) => void
  dismiss: () => void
  setProgressZ: (z: number) => void
  setHeading: (h: 1 | -1) => void
  collect: (id: number) => void
  showToast: (t: string | null) => void
}

const hour = new Date().getHours()
const savedLang = (() => {
  try {
    return localStorage.getItem('lang') as Lang | null
  } catch {
    return null
  }
})()

export const useGame = create<GameState>((set, get) => ({
  phase: 'intro',
  ready: false,
  lang: savedLang === 'bn' ? 'bn' : 'en',
  muted: false,
  rain: false,
  night: hour < 6 || hour >= 18,
  activeZone: null,
  dismissed: null,
  progressZ: 4,
  heading: 1,
  collected: [],
  toast: null,
  setPhase: (phase) => set({ phase }),
  setReady: (ready) => set({ ready }),
  toggleLang: () => {
    const lang = get().lang === 'en' ? 'bn' : 'en'
    try {
      localStorage.setItem('lang', lang)
    } catch {}
    set({ lang })
  },
  toggleMuted: () => set({ muted: !get().muted }),
  toggleRain: () => set({ rain: !get().rain }),
  toggleNight: () => set({ night: !get().night }),
  setActiveZone: (activeZone) =>
    set(activeZone === null ? { activeZone, dismissed: null } : { activeZone }),
  dismiss: () => set({ dismissed: get().activeZone }),
  setProgressZ: (progressZ) => set({ progressZ }),
  setHeading: (heading) => set({ heading }),
  collect: (id) => {
    if (get().collected.includes(id)) return
    set({ collected: [...get().collected, id] })
  },
  showToast: (toast) => set({ toast }),
}))
