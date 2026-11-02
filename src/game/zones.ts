import type { L } from '../content/content'

export type ZoneId = 'start' | 'about' | 'skills' | 'projects' | 'experience' | 'education' | 'contact'

export interface Zone {
  id: ZoneId
  z: number
  title: L
  gate: L
}

// The road runs from z = +14 towards negative z. Zones are ordered along it.
export const ZONES: Zone[] = [
  { id: 'start', z: 2, title: { en: 'Rickshaw Stand', bn: 'রিকশা স্ট্যান্ড' }, gate: { en: 'Welcome', bn: 'স্বাগতম' } },
  { id: 'about', z: -42, title: { en: 'Tea Stall · About Me', bn: 'চায়ের দোকান · আমার কথা' }, gate: { en: 'About Me', bn: 'আমার কথা' } },
  { id: 'skills', z: -88, title: { en: 'Signboard Lane · Skills', bn: 'সাইনবোর্ড গলি · দক্ষতা' }, gate: { en: 'Skills', bn: 'দক্ষতা' } },
  { id: 'projects', z: -136, title: { en: 'The Bazaar · Projects', bn: 'বাজার · প্রজেক্ট' }, gate: { en: 'Projects', bn: 'প্রজেক্ট' } },
  { id: 'experience', z: -186, title: { en: 'Milestones · Experience', bn: 'মাইলফলক · অভিজ্ঞতা' }, gate: { en: 'Experience', bn: 'অভিজ্ঞতা' } },
  { id: 'education', z: -234, title: { en: 'University · Education', bn: 'বিশ্ববিদ্যালয় · শিক্ষা' }, gate: { en: 'Education', bn: 'শিক্ষা' } },
  { id: 'contact', z: -282, title: { en: 'Post Office · Contact', bn: 'ডাকঘর · যোগাযোগ' }, gate: { en: 'Contact', bn: 'যোগাযোগ' } },
]

export const ROAD = {
  start: 14,
  end: -300,
  halfWidth: 5,
  footpath: 7.5,
  wall: 12.8,
  riverZ: -328,
}

// A roundabout at each end of the street lets the driver turn around.
export const ROUNDABOUT = { outer: 15, island: 5, footpath: 2.5 }
export const ROUNDABOUTS = [
  { id: 'north' as const, z: ROAD.start + 10, streetAngle: Math.PI },
  { id: 'south' as const, z: ROAD.end - 10, streetAngle: 0 },
]

const inStreet = (x: number, z: number) => Math.abs(x) < ROAD.wall + 1 && z <= ROAD.start && z >= ROAD.end

/** True if (x, z) is on the drivable street or inside one of the roundabouts. */
export function insideWorld(x: number, z: number) {
  return inStreet(x, z) || ROUNDABOUTS.some((r) => Math.hypot(x, z - r.z) < ROUNDABOUT.outer + 1.5)
}

export const ZONE_HALF_LENGTH = 6
