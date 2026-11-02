import * as THREE from 'three'

// Mutable per-frame state shared between game systems (kept out of React to avoid re-renders).
export const input = { fwd: false, back: false, left: false, right: false }

/** A footprint on the ground: centre (x, z), heading yaw (models face -z), half width and half length. */
export interface GroundBox {
  x: number
  z: number
  yaw: number
  hx: number
  hz: number
}

export const player = {
  pos: new THREE.Vector3(-1.8, 0, 4),
  yaw: 0,
  speed: 0,
  /** The rickshaw's footprint, matching its collider. */
  box: { x: -1.8, z: 3.35, yaw: 0, hx: 0.75, hz: 1.45 } as GroundBox,
}

/** Footprints of the traffic vehicles, indexed like the vehicles in Traffic. */
export const vehicleBoxes: GroundBox[] = []

/** How long someone who gets bumped stands there with a raised hand. */
export const REACT_TIME = 2.2
/** Seconds left of each pedestrian's / traffic rider's reaction to being bumped. */
export const pedReact: number[] = []
export const vehicleReact: number[] = []

/** Place a footprint whose centre is `offset` along the model's local z from (x, z). */
export function placeBox(box: GroundBox, x: number, z: number, yaw: number, offset: number) {
  box.x = x + Math.sin(yaw) * offset
  box.z = z + Math.cos(yaw) * offset
  box.yaw = yaw
}

const contact = { depth: 0, nx: 0, nz: 0 }

/**
 * Overlap between a footprint and a circle of radius r at (x, z). Returns how deep the circle is
 * inside and the world direction to push it out, or null when they don't touch. Reuses one object.
 */
export function boxContact(b: GroundBox, x: number, z: number, r: number) {
  const c = Math.cos(b.yaw)
  const s = Math.sin(b.yaw)
  // local axes: X = (cos, -sin), Z = (sin, cos)
  const dx = x - b.x
  const dz = z - b.z
  const lx = dx * c - dz * s
  const lz = dx * s + dz * c
  let ex = lx - THREE.MathUtils.clamp(lx, -b.hx, b.hx)
  let ez = lz - THREE.MathUtils.clamp(lz, -b.hz, b.hz)
  const d = Math.hypot(ex, ez)
  let depth: number
  if (d > 1e-6) {
    depth = r - d
    ex /= d
    ez /= d
  } else {
    // centre inside the box: push out through the nearest side
    const px = b.hx - Math.abs(lx)
    const pz = b.hz - Math.abs(lz)
    if (px < pz) {
      ex = Math.sign(lx) || 1
      ez = 0
      depth = px + r
    } else {
      ex = 0
      ez = Math.sign(lz) || 1
      depth = pz + r
    }
  }
  if (depth <= 0) return null
  contact.depth = depth
  contact.nx = ex * c + ez * s
  contact.nz = -ex * s + ez * c
  return contact
}

export const SPAWN = { x: 9, z: -306 }

// Handy for debugging and automated tests in development builds only.
if (import.meta.env.DEV) (window as unknown as { __player: typeof player }).__player = player
