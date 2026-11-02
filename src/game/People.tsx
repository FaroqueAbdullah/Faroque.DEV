import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { boxContact, pedReact, player, vehicleBoxes, type GroundBox } from './state'
import { ROAD, ZONES } from './zones'
import { C, checkTexture, rng } from './textures'

type PedKind = 'walker' | 'skater'
type Dress = 'pants' | 'lungi' | 'saree'

export interface Look {
  skin: string
  shirt: string
  bottom: string
  hair: string
  dress: Dress
  cap: boolean
}

/** Live position and body radius of everyone on foot, so traffic and the rickshaw can treat them as solid. */
export const pedestrians: { x: number; z: number; r: number }[] = []

const SKINS = ['#8d5524', '#a8693a', '#7a4a24', '#c68a5a', '#6b3f1f']
const SHIRTS = [C.cream, '#f5f5f0', C.blue, C.teal, C.orange, '#6d8fb3', '#b5651d', C.purple, '#e0d36a']
const BOTTOMS = ['#2b2f3a', '#40382e', '#5a6b7d', '#1f2a44', '#6b5a43']
const SAREES = [C.red, C.pink, C.green, C.orange, C.purple, C.teal]
const HAIR = ['#141414', '#1f1712', '#2a2a2a']

const FOOT_IN = ROAD.halfWidth + 0.45 // footpath lanes people walk in, measured from the road centre
const FOOT_OUT = ROAD.footpath - 0.35
const Z_MAX = ROAD.start - 3
const Z_MIN = ROAD.end + 3
// Gate pillars stand on the footpath; people step around them.
const POLES = ZONES.map((z) => (z.id === 'start' ? z.z - 7 : z.z + 5))
const POLE_X = 6.4

export function makeLook(r: () => number, allowDress = true): Look {
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
  const roll = r()
  const dress: Dress = !allowDress ? 'pants' : roll < 0.2 ? 'saree' : roll < 0.4 ? 'lungi' : 'pants'
  return {
    skin: pick(SKINS),
    shirt: dress === 'saree' ? pick(SAREES) : pick(SHIRTS),
    bottom: dress === 'saree' ? pick(SAREES) : dress === 'lungi' ? pick([C.green, C.blue, '#7b3b3b', C.purple]) : pick(BOTTOMS),
    hair: pick(HAIR),
    dress,
    cap: dress !== 'saree' && r() < 0.25,
  }
}

export interface Rig {
  body: MutableRefObject<THREE.Group | null>
  legL: MutableRefObject<THREE.Group | null>
  legR: MutableRefObject<THREE.Group | null>
  armL: MutableRefObject<THREE.Group | null>
  armR: MutableRefObject<THREE.Group | null>
  skirt: MutableRefObject<THREE.Group | null>
}

/** Lungi and saree are a tube of cloth from the waist to the ankles; the legs must stay inside it. */
export const isWrapped = (look: Look) => look.dress !== 'pants'
// Hip-to-hem: the cloth hangs from the waist down to just above the ankles.
const SKIRT_TOP = 0.91
const SKIRT_HEM = 0.13
const SKIRT_R_TOP = 0.2
const SKIRT_R_HEM = 0.27
/** Max leg swing (radians) in a wrapped dress: short steps keep both legs under the hem. */
export const WRAPPED_STRIDE = 0.16

function useRig(): Rig {
  return {
    body: useRef<THREE.Group>(null),
    legL: useRef<THREE.Group>(null),
    legR: useRef<THREE.Group>(null),
    armL: useRef<THREE.Group>(null),
    armR: useRef<THREE.Group>(null),
    skirt: useRef<THREE.Group>(null),
  }
}

/** A standing person about 1.65 m tall, facing -z, feet at y = 0. Limbs pivot at hip and shoulder. */
export function Person({ look, rig }: { look: Look; rig: Rig }) {
  const lungi = look.dress === 'lungi' ? checkTexture('lungi' + look.bottom, look.bottom, '#f2efe4', 6) : null
  const wrapped = isWrapped(look)
  return (
    <group ref={rig.body}>
      {[-1, 1].map((s) => (
        // Under a lungi or saree the legs sit closer together and are slimmer, so they fit inside the cloth.
        <group key={s} ref={s < 0 ? rig.legL : rig.legR} position={[s * (wrapped ? 0.07 : 0.1), 0.88, 0]}>
          <mesh position={[0, -0.42, 0]} castShadow>
            <boxGeometry args={[wrapped ? 0.1 : 0.13, 0.84, 0.15]} />
            <meshStandardMaterial color={look.dress === 'pants' ? look.bottom : look.skin} />
          </mesh>
          <mesh position={[0, -0.85, -0.05]}>
            <boxGeometry args={[0.12, 0.06, 0.24]} />
            <meshStandardMaterial color="#2a1d14" />
          </mesh>
        </group>
      ))}
      {look.dress === 'pants' ? (
        <mesh position={[0, 0.88, 0]}>
          <boxGeometry args={[0.36, 0.16, 0.2]} />
          <meshStandardMaterial color={look.bottom} />
        </mesh>
      ) : (
        // Hung from the waist so the hem can sway with each step.
        <group ref={rig.skirt} position={[0, SKIRT_TOP, 0]}>
          <mesh position={[0, -(SKIRT_TOP - SKIRT_HEM) / 2, 0]} castShadow>
            <cylinderGeometry args={[SKIRT_R_TOP, SKIRT_R_HEM, SKIRT_TOP - SKIRT_HEM, 14]} />
            {lungi ? <meshStandardMaterial map={lungi} /> : <meshStandardMaterial color={look.bottom} />}
          </mesh>
        </group>
      )}
      <mesh position={[0, 1.18, 0]} castShadow>
        <boxGeometry args={[0.4, 0.5, 0.22]} />
        <meshStandardMaterial color={look.shirt} />
      </mesh>
      {look.dress === 'saree' && (
        // the anchal over the left shoulder
        <mesh position={[0.06, 1.2, 0]} rotation={[0, 0, -0.55]}>
          <boxGeometry args={[0.16, 0.62, 0.24]} />
          <meshStandardMaterial color={look.bottom} />
        </mesh>
      )}
      {[-1, 1].map((s) => (
        <group key={s} ref={s < 0 ? rig.armL : rig.armR} position={[s * 0.25, 1.4, 0]}>
          <mesh position={[0, -0.27, 0]}>
            <boxGeometry args={[0.09, 0.52, 0.1]} />
            <meshStandardMaterial color={look.shirt} />
          </mesh>
          <mesh position={[0, -0.56, 0]}>
            <sphereGeometry args={[0.05, 8, 6]} />
            <meshStandardMaterial color={look.skin} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.48, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.1, 8]} />
        <meshStandardMaterial color={look.skin} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.12, 14, 12]} />
        <meshStandardMaterial color={look.skin} />
      </mesh>
      {look.cap ? (
        // a white tupi
        <mesh position={[0, 1.69, 0]}>
          <cylinderGeometry args={[0.11, 0.12, 0.08, 14]} />
          <meshStandardMaterial color="#f4f1e8" />
        </mesh>
      ) : (
        <mesh position={[0, 1.64, 0.025]}>
          <sphereGeometry args={[0.125, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={look.hair} />
        </mesh>
      )}
      {look.dress === 'saree' && (
        <mesh position={[0, 1.58, 0.13]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshStandardMaterial color={look.hair} />
        </mesh>
      )}
    </group>
  )
}

function Skateboard() {
  return (
    <group>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.24, 0.03, 0.84]} />
        <meshStandardMaterial color={C.yellow} />
      </mesh>
      {[-0.28, 0.28].flatMap((z) =>
        [-0.08, 0.08].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 0.04, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 0.04, 10]} />
            <meshStandardMaterial color="#e8e2d0" />
          </mesh>
        )),
      )}
    </group>
  )
}

interface PedConfig {
  kind: PedKind
  seed: number
  side: -1 | 1
  home: number
}

const PEDS: PedConfig[] = (() => {
  const r = rng(4242)
  const out: PedConfig[] = []
  const n = 22
  for (let i = 0; i < n; i++) {
    out.push({
      kind: i % 5 === 2 ? 'skater' : 'walker',
      seed: 100 + i * 17,
      side: r() < 0.5 ? -1 : 1,
      home: Z_MAX - ((Z_MAX - Z_MIN) * (i + r() * 0.8)) / n,
    })
  }
  return out
})()

const clampZ = (z: number) => THREE.MathUtils.clamp(z, Z_MIN, Z_MAX)
const laneX = (side: number, r: () => number) => side * THREE.MathUtils.lerp(FOOT_IN, FOOT_OUT, r())

function Pedestrian({ cfg, index }: { cfg: PedConfig; index: number }) {
  const root = useRef<THREE.Group>(null)
  const rig = useRig()
  const r = useMemo(() => rng(cfg.seed), [cfg.seed])
  const look = useMemo(() => makeLook(rng(cfg.seed + 1), cfg.kind === 'walker'), [cfg.seed, cfg.kind])
  const skater = cfg.kind === 'skater'
  const cruise = skater ? 3 + r() * 1.4 : 1 + r() * 0.5
  const range = skater ? 45 : 22

  const st = useMemo(() => {
    const x = laneX(cfg.side, r)
    const s = {
      x,
      z: cfg.home,
      lane: x,
      tz: clampZ(cfg.home + (r() - 0.5) * range),
      crossing: false,
      idle: r() * 3,
      speed: 0,
      yaw: Math.PI * (r() < 0.5 ? 0 : 1),
      phase: r() * 10,
      kick: 0,
      raise: 0, // 0..1, how far the hand is raised after being bumped
    }
    pedestrians[index] = { x: s.x, z: s.z, r: skater ? 0.42 : 0.28 }
    return s
  }, [cfg, index, r, range, skater])

  useFrame(({ clock }, rawDt) => {
    const g = root.current
    if (!g) return
    const dt = Math.min(rawDt, 1 / 20)
    const me = pedestrians[index]

    // Pick what to do next once the current errand is done.
    if (st.idle > 0) {
      st.idle -= dt
      if (st.idle <= 0) {
        const farFromPlayer = Math.abs(player.pos.z - st.z) > 14
        if (!skater && farFromPlayer && r() < 0.3) {
          // cross over to the other footpath
          st.crossing = true
          st.lane = laneX(-Math.sign(st.x), r)
          st.tz = clampZ(st.z - (r() - 0.5) * 4)
        } else {
          st.lane = laneX(Math.sign(st.x), r)
          st.tz = clampZ(cfg.home + (r() - 0.5) * range * 2)
        }
      }
    }

    let vx = 0
    let vz = 0
    let want = 0
    if (st.idle <= 0) {
      const dz = st.tz - st.z
      const dxLane = st.lane - st.x
      if (st.crossing) {
        // walk straight across, a little quicker, drifting towards the target z
        want = cruise * 1.25
        const d = Math.hypot(dxLane, dz) || 1
        vx = dxLane / d
        vz = dz / d
        if (Math.abs(dxLane) < 0.15) {
          st.crossing = false
          st.idle = 1 + r() * 3
        }
      } else {
        want = Math.abs(dz) < 0.3 ? 0 : cruise
        vz = Math.sign(dz)
        // keep to the lane, stepping around gate pillars
        let lane = st.lane
        for (const pz of POLES) {
          if (Math.abs(pz - st.z) < 1.6 && Math.abs(Math.abs(lane) - POLE_X) < 0.55) {
            lane = Math.sign(lane) * (Math.abs(lane) < POLE_X ? POLE_X - 0.6 : POLE_X + 0.6)
          }
        }
        vx = THREE.MathUtils.clamp((lane - st.x) * 2, -0.8, 0.8)
        if (want === 0) st.idle = skater ? 0.5 + r() * 1.5 : 1.5 + r() * 5
      }
    }

    // Walk around other people instead of through them.
    if (want > 0 && Math.hypot(vx, vz) > 0.01) {
      const vl = Math.hypot(vx, vz)
      const dirx = vx / vl
      const dirz = vz / vl
      for (let j = 0; j < pedestrians.length; j++) {
        const o = pedestrians[j]
        if (j === index || !o) continue
        const rx = o.x - st.x
        const rz = o.z - st.z
        const ahead = rx * dirx + rz * dirz
        if (ahead <= 0 || ahead > 1.6) continue
        // lateral offset along our right-hand perpendicular (dirz, -dirx)
        const lat = rx * dirz - rz * dirx
        if (Math.abs(lat) > me.r + o.r + 0.15) continue
        const side = lat > 0 ? -1 : 1
        vx += side * dirz * 0.9
        vz -= side * dirx * 0.9
        want = Math.min(want, cruise * 0.75)
      }
    }

    // Step aside out of the path of the player's rickshaw and the traffic. Riders stop for anyone in
    // front of them, so someone who keeps walking into their path would leave both stuck face to face.
    let dodging = false
    const dodge = (b: GroundBox | undefined, dir: number, reach: number) => {
      if (!b || dodging) return
      // heading (models face -z), flipped when reversing, and its right-hand perpendicular
      const fx = -Math.sin(b.yaw) * dir
      const fz = -Math.cos(b.yaw) * dir
      const rx = st.x - b.x
      const rz = st.z - b.z
      const ahead = rx * fx + rz * fz
      const lat = rx * -fz + rz * fx
      if (ahead < -b.hz || ahead > b.hz + reach || Math.abs(lat) > Math.max(1.7, b.hx + me.r + 0.6)) return
      // move to whichever side we're already on; dead centre, head for our own footpath
      const side = Math.abs(lat) > 0.15 ? Math.sign(lat) : Math.sign(-fz * st.x) || 1
      vx = -fz * side
      vz = fx * side
      want = Math.max(want, cruise)
      dodging = true
    }
    dodge(player.box, player.speed < -0.1 ? -1 : 1, 2 + Math.abs(player.speed) * 0.8)
    for (const vb of vehicleBoxes) dodge(vb, 1, 3.5)

    // Bumped by the rickshaw or a rider: stop, turn to face the rickshaw and raise a hand.
    const reacting = (pedReact[index] ?? 0) > 0
    if (reacting) {
      pedReact[index] -= dt
      want = 0
      vx = 0
      vz = 0
      st.speed *= Math.exp(-dt * 8)
      const face = Math.atan2(-(player.pos.x - st.x), -(player.pos.z - st.z))
      let d = face - st.yaw
      d = Math.atan2(Math.sin(d), Math.cos(d))
      st.yaw += d * (1 - Math.exp(-dt * 8))
    }
    st.raise = THREE.MathUtils.lerp(st.raise, reacting ? 1 : 0, 1 - Math.exp(-dt * 10))

    // Get out of the way of the player's rickshaw.
    const px = st.x - player.pos.x
    const pz = st.z - player.pos.z
    const pd = Math.hypot(px, pz)
    if (pd < 3) {
      const push = (3 - pd) * 1.6
      st.x += (px / (pd || 1)) * push * dt
      st.z += (pz / (pd || 1)) * push * dt
      if (!st.crossing && !dodging) want = Math.min(want, cruise * 0.3)
    }

    st.speed = THREE.MathUtils.lerp(st.speed, want, 1 - Math.exp(-dt * (skater && !dodging ? 1.5 : 6)))
    const vlen = Math.hypot(vx, vz)
    if (vlen > 0.01) {
      st.x += (vx / Math.max(vlen, 1)) * st.speed * dt
      st.z += (vz / Math.max(vlen, 1)) * st.speed * dt
      if (st.speed > 0.15) {
        const targetYaw = Math.atan2(-vx, -vz)
        let d = targetYaw - st.yaw
        d = Math.atan2(Math.sin(d), Math.cos(d))
        st.yaw += d * (1 - Math.exp(-dt * 6))
      }
    }
    // Nobody overlaps: step apart from other people, and out of the rickshaw and the traffic.
    for (let j = 0; j < pedestrians.length; j++) {
      const o = pedestrians[j]
      if (j === index || !o) continue
      const dx = st.x - o.x
      const dz = st.z - o.z
      const min = me.r + o.r
      const d2 = dx * dx + dz * dz
      if (d2 >= min * min) continue
      const d = Math.sqrt(d2)
      // each of the two moves half the overlap; break exact ties by index
      const nx = d > 1e-4 ? dx / d : index < j ? 1 : -1
      const nz = d > 1e-4 ? dz / d : 0
      st.x += nx * (min - d) * 0.5
      st.z += nz * (min - d) * 0.5
    }
    const pushOut = (b: GroundBox | undefined) => {
      const c = b && boxContact(b, st.x, st.z, me.r)
      if (!c) return
      st.x += c.nx * c.depth
      st.z += c.nz * c.depth
    }
    pushOut(player.box)
    for (const vb of vehicleBoxes) pushOut(vb)

    // Never leave the street: footpaths and the road between them.
    st.x = THREE.MathUtils.clamp(st.x, -FOOT_OUT - 0.2, FOOT_OUT + 0.2)
    st.z = clampZ(st.z)
    pedestrians[index].x = st.x
    pedestrians[index].z = st.z

    g.position.set(st.x, 0, st.z)
    g.rotation.y = st.yaw

    // Limbs.
    const { legL, legR, armL, armR, body, skirt } = rig
    if (!legL.current || !legR.current || !armL.current || !armR.current || !body.current) return
    if (skater) {
      // glide, and kick off with the back foot when slowing down
      if (st.kick <= 0 && want > 0 && st.speed < cruise * 0.8) st.kick = 0.7
      if (st.kick > 0) {
        st.kick -= dt
        st.speed += dt * 2.2
      }
      const k = st.kick > 0 ? Math.sin((1 - st.kick / 0.7) * Math.PI) : 0
      legL.current.rotation.z = -0.15 - k * 0.5
      legR.current.rotation.z = 0.15
      body.current.position.y = 0.11 - k * 0.06
      armL.current.rotation.z = -0.5
      armR.current.rotation.z = 0.5
    } else {
      // In a lungi or saree people take short, quicker steps so their legs stay under the cloth.
      const wrapped = isWrapped(look)
      const stride = wrapped ? WRAPPED_STRIDE : 0.55
      st.phase += st.speed * dt * 4.2 * (0.55 / stride) ** 0.5
      const effort = Math.min(st.speed / 1.2, 1)
      const a = Math.sin(st.phase) * effort * stride
      legL.current.rotation.x = a
      legR.current.rotation.x = -a
      const arm = wrapped ? Math.sin(st.phase) * effort * 0.35 : a
      armL.current.rotation.x = -arm * 0.8
      armR.current.rotation.x = arm * 0.8
      body.current.position.y = Math.abs(Math.cos(st.phase)) * 0.025 * Math.min(st.speed, 1)
      if (skirt.current) skirt.current.rotation.x = Math.sin(st.phase * 2) * 0.025 * effort
    }
    // A raised, shaking hand: "hey, watch where you're going!"
    if (st.raise > 0.01) {
      const shake = Math.sin(clock.elapsedTime * 13) * 0.18 * st.raise
      armR.current.rotation.x = THREE.MathUtils.lerp(armR.current.rotation.x, 2.7, st.raise) + shake
      armR.current.rotation.z *= 1 - st.raise
    }
  })

  return (
    <group ref={root} position={[st.x, 0, st.z]}>
      {skater ? (
        <>
          <Skateboard />
          {/* stand sideways on the board */}
          <group rotation={[0, Math.PI / 2, 0]}>
            <Person look={look} rig={rig} />
          </group>
        </>
      ) : (
        <Person look={look} rig={rig} />
      )}
    </group>
  )
}

export function People() {
  return (
    <>
      {PEDS.map((cfg, i) => (
        <Pedestrian key={i} cfg={cfg} index={i} />
      ))}
    </>
  )
}
