import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { RickshawModel, Rod, Wheel, type RickshawAnim } from './Rickshaw'
import { makeLook, pedestrians, People, type Look } from './People'
import { pedReact, placeBox, player, vehicleBoxes, vehicleReact } from './state'
import { ROUNDABOUTS } from './zones'
import { C, rng } from './textures'
import { bell } from '../audio/sound'
import { useGame } from '../store/useGame'

type Kind = 'cycle' | 'rickshaw'
type LoopId = 'inner' | 'curb'

interface Vehicle {
  kind: Kind
  loop: LoopId
  speed: number
  start: number // starting point along the loop, 0..1
}

// Bangladesh drives on the left, so each loop runs down the x < 0 lane, keeps the island on
// its right around the south roundabout, comes back up the x > 0 lane and circles the north one.
// Bicycles take the faster inner lane; rickshaws trundle along the curb.
const VEHICLES: Vehicle[] = [
  { kind: 'cycle', loop: 'inner', speed: 5.2, start: 0.1 },
  { kind: 'cycle', loop: 'inner', speed: 4.6, start: 0.34 },
  { kind: 'rickshaw', loop: 'inner', speed: 3.8, start: 0.58 },
  { kind: 'cycle', loop: 'inner', speed: 5.6, start: 0.8 },
  { kind: 'rickshaw', loop: 'curb', speed: 3.4, start: 0.22 },
  { kind: 'rickshaw', loop: 'curb', speed: 3.0, start: 0.55 },
  { kind: 'rickshaw', loop: 'curb', speed: 3.6, start: 0.86 },
  { kind: 'cycle', loop: 'curb', speed: 3.9, start: 0.4 },
]

// Collider half-extents and their z offset from the body origin.
const SIZES: Record<Kind, { half: [number, number, number]; z: number }> = {
  cycle: { half: [0.3, 0.8, 0.9], z: 0 },
  rickshaw: { half: [0.75, 0.9, 1.4], z: -0.6 },
}

function makeLoop(offset: number, radius: number) {
  const [north, south] = ROUNDABOUTS
  const a = Math.asin(offset / radius)
  const zTop = north.z - radius * Math.cos(a) - 2
  const zBottom = south.z + radius * Math.cos(a) + 2
  const pts: THREE.Vector3[] = []
  const lane = (x: number, from: number, to: number) => {
    const n = Math.ceil(Math.abs(to - from) / 12)
    for (let i = 0; i <= n; i++) pts.push(new THREE.Vector3(x, 0, from + ((to - from) * i) / n))
  }
  const arc = (cz: number, from: number, to: number) => {
    const n = Math.ceil(Math.abs(to - from) / 0.2)
    for (let i = 1; i < n; i++) {
      const th = from + ((to - from) * i) / n
      pts.push(new THREE.Vector3(Math.sin(th) * radius, 0, cz + Math.cos(th) * radius))
    }
  }
  lane(-offset, zTop, zBottom)
  arc(south.z, -a, -Math.PI * 2 + a)
  lane(offset, zBottom, zTop)
  arc(north.z, Math.PI - a, -Math.PI + a)
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal')
  curve.arcLengthDivisions = 2000
  return { curve, length: curve.getLength() }
}

const LOOPS: Record<LoopId, ReturnType<typeof makeLoop>> = {
  inner: makeLoop(2.5, 9),
  curb: makeLoop(3.9, 12),
}

// Distance along the loop of every vehicle, so they queue behind each other instead of overlapping.
const progress: { loop: LoopId; s: number; half: number }[] = VEHICLES.map((v) => ({
  loop: v.loop,
  s: v.start * LOOPS[v.loop].length,
  half: SIZES[v.kind].half[2],
}))

const tmpPos = new THREE.Vector3()
const tmpTan = new THREE.Vector3()
const tmpQuat = new THREE.Quaternion()
const UP = new THREE.Vector3(0, 1, 0)

// Bicycle geometry in the (y, z) plane; the bike faces -z.
const BIKE = {
  wheelR: 0.34,
  rear: [0.34, 0.52] as const,
  front: [0.34, -0.56] as const,
  bb: [0.3, 0.04] as const,
  seat: [0.92, 0.2] as const,
  headTop: [0.95, -0.42] as const,
  headBottom: [0.7, -0.47] as const,
  bar: [1.05, -0.36] as const,
  crank: 0.16,
}
const FRAMES = [C.red, C.blue, C.green, '#222', C.teal]
const HIP: [number, number] = [1.02, 0.22]
const LEG = 0.47

/** Two-bone leg from the hip (y, z) to the foot, knee bending forward (-z). */
function solveLeg(fy: number, fz: number, thigh: THREE.Group, shin: THREE.Group) {
  const dy = fy - HIP[0]
  const dz = fz - HIP[1]
  const d = Math.min(Math.hypot(dy, dz), LEG * 2 - 0.001)
  const base = Math.atan2(-dz, -dy)
  const bend = Math.acos(THREE.MathUtils.clamp(d / (2 * LEG), -1, 1))
  const a1 = base + bend
  const a2 = base - bend
  // rotation.x = a points a bone hanging down along (-cos a, -sin a); the knee goes the way with smaller z
  const t = Math.sin(a1) > Math.sin(a2) ? a1 : a2
  thigh.rotation.x = t
  shin.rotation.x = 2 * base - 2 * t
}

function Bicycle({ anim, look, frame }: { anim: MutableRefObject<RickshawAnim>; look: Look; frame: string }) {
  const front = useRef<THREE.Group>(null)
  const rear = useRef<THREE.Group>(null)
  const crank = useRef<THREE.Group>(null)
  const thighs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null)]
  const shins = [useRef<THREE.Group>(null), useRef<THREE.Group>(null)]
  const armR = useRef<THREE.Group>(null)
  const p = (yz: readonly [number, number], x = 0): [number, number, number] => [x, yz[0], yz[1]]

  useFrame(() => {
    const a = anim.current
    if (front.current) front.current.rotation.x = a.wheel
    if (rear.current) rear.current.rotation.x = a.wheel
    if (crank.current) crank.current.rotation.x = a.pedal
    for (let i = 0; i < 2; i++) {
      const th = thighs[i].current
      const sh = shins[i].current
      if (!th || !sh) continue
      const s = i === 0 ? -1 : 1
      // matches the crank arm on that side, which hangs at y = -s * crank before rotating
      const fy = BIKE.bb[0] - s * BIKE.crank * Math.cos(a.pedal)
      const fz = BIKE.bb[1] - s * BIKE.crank * Math.sin(a.pedal)
      solveLeg(fy, fz, th, sh)
    }
    // Take the right hand off the bar and shake it when bumped.
    const wave = a.wave ?? 0
    if (armR.current) {
      armR.current.rotation.x = wave * (2.3 + Math.sin(performance.now() * 0.013) * 0.15)
      armR.current.rotation.z = wave * 0.25
    }
  })

  const shoulder: [number, number] = [1.44, -0.1]
  return (
    <group>
      <group position={p(BIKE.rear)}>
        <Wheel radius={BIKE.wheelR} spin={rear} />
      </group>
      <group position={p(BIKE.front)}>
        <Wheel radius={BIKE.wheelR} spin={front} />
      </group>
      <Rod a={p(BIKE.bb)} b={p(BIKE.seat)} r={0.025} color={frame} />
      <Rod a={p(BIKE.seat)} b={p(BIKE.headTop)} r={0.025} color={frame} />
      <Rod a={p(BIKE.bb)} b={p(BIKE.headBottom)} r={0.028} color={frame} />
      <Rod a={p(BIKE.headBottom)} b={p(BIKE.headTop)} r={0.03} color={frame} />
      <Rod a={p(BIKE.rear)} b={p(BIKE.bb)} r={0.018} color={frame} />
      <Rod a={p(BIKE.rear)} b={p(BIKE.seat)} r={0.018} color={frame} />
      <Rod a={p(BIKE.headBottom)} b={p(BIKE.front)} r={0.02} />
      <Rod a={p(BIKE.headTop)} b={p(BIKE.bar)} r={0.02} />
      <Rod a={p(BIKE.bar, -0.26)} b={p(BIKE.bar, 0.26)} r={0.018} />
      <mesh position={[0, BIKE.seat[0] + 0.04, BIKE.seat[1] + 0.02]}>
        <boxGeometry args={[0.14, 0.05, 0.26]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <group ref={crank} position={p(BIKE.bb)}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.07, s * -BIKE.crank * 0.5, 0]}>
            <boxGeometry args={[0.025, BIKE.crank, 0.03]} />
            <meshStandardMaterial color="#9aa0a8" metalness={0.6} />
          </mesh>
        ))}
      </group>

      {/* rider */}
      {[-1, 1].map((s, i) => (
        <group key={s} ref={thighs[i]} position={[s * 0.1, HIP[0], HIP[1]]}>
          <mesh position={[0, -LEG / 2, 0]}>
            <boxGeometry args={[0.12, LEG, 0.13]} />
            <meshStandardMaterial color={look.bottom} />
          </mesh>
          <group ref={shins[i]} position={[0, -LEG, 0]}>
            <mesh position={[0, -LEG / 2, 0]}>
              <boxGeometry args={[0.1, LEG, 0.11]} />
              <meshStandardMaterial color={look.bottom} />
            </mesh>
            <mesh position={[0, -LEG, -0.04]}>
              <boxGeometry args={[0.1, 0.06, 0.22]} />
              <meshStandardMaterial color="#2a1d14" />
            </mesh>
          </group>
        </group>
      ))}
      <Rod a={[0, HIP[0], HIP[1]]} b={[0, shoulder[0], shoulder[1]]} r={0.17} color={look.shirt} />
      {[-1, 1].map((s) => (
        // pivots at the shoulder
        <group key={s} ref={s > 0 ? armR : undefined} position={[s * 0.2, shoulder[0], shoulder[1]]}>
          <Rod a={[0, 0, 0]} b={[s * 0.04, BIKE.bar[0] - shoulder[0], BIKE.bar[1] - shoulder[1]]} r={0.045} color={look.shirt} />
        </group>
      ))}
      <mesh position={[0, shoulder[0] + 0.2, shoulder[1] - 0.08]} castShadow>
        <sphereGeometry args={[0.12, 14, 12]} />
        <meshStandardMaterial color={look.skin} />
      </mesh>
      <mesh position={[0, shoulder[0] + 0.24, shoulder[1] - 0.06]}>
        <sphereGeometry args={[0.125, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={look.hair} />
      </mesh>
    </group>
  )
}

function TrafficVehicle({ v, index }: { v: Vehicle; index: number }) {
  const body = useRef<RapierRigidBody>(null)
  const visual = useRef<THREE.Group>(null)
  const lastBell = useRef(0)
  const anim = useRef<RickshawAnim>({ wheel: 0, pedal: 0, steer: 0, lean: 0 })
  const { curve, length } = LOOPS[v.loop]
  const me = progress[index]
  // Stable initial transform: a fresh array every render would make the body jump back to its start.
  const startPos = useMemo(() => {
    const p = curve.getPointAt(v.start)
    return [p.x, 0, p.z] as [number, number, number]
  }, [curve, v.start])
  const look = useMemo(() => makeLook(rng(500 + index * 13), false), [index])
  const size = SIZES[v.kind]
  if (!vehicleBoxes[index]) vehicleBoxes[index] = { x: startPos[0], z: startPos[2], yaw: 0, hx: size.half[0], hz: size.half[2] }

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const u = (me.s % length) / length
    curve.getPointAt(u, tmpPos)
    curve.getTangentAt(u, tmpTan)

    // Stop for the player or anyone crossing right in front of us.
    const blocks = (x: number, z: number, reach: number) => {
      const dx = x - tmpPos.x
      const dz = z - tmpPos.z
      const ahead = dx * tmpTan.x + dz * tmpTan.z
      const lateral = Math.abs(dx * tmpTan.z - dz * tmpTan.x)
      return ahead > 0 && ahead < me.half + reach && lateral < 1.5
    }
    const playerBlocks = blocks(player.pos.x, player.pos.z, 5)
    // Bumped by the player: stop and raise a hand for a moment.
    const reacting = (vehicleReact[index] ?? 0) > 0
    if (reacting) vehicleReact[index] -= dt
    anim.current.wave = THREE.MathUtils.lerp(anim.current.wave ?? 0, reacting ? 1 : 0, 1 - Math.exp(-dt * 10))
    const pedBlocks = pedestrians.some((p) => blocks(p.x, p.z, 2.5))
    // ...and queue behind slower vehicles on the same loop.
    const queued = progress.some((o) => {
      if (o === me || o.loop !== me.loop) return false
      const gap = (((o.s - me.s) % length) + length) % length
      return gap > 0 && gap < me.half + o.half + 2.5
    })

    if (!playerBlocks && !pedBlocks && !queued && !reacting) {
      me.s = (me.s + v.speed * dt) % length
      anim.current.wheel -= (v.speed * dt) / (v.kind === 'cycle' ? BIKE.wheelR : 0.45)
      anim.current.pedal -= v.speed * dt * (v.kind === 'cycle' ? 2.2 : 1.4)
    } else if (playerBlocks && clock.elapsedTime - lastBell.current > 3 && useGame.getState().phase === 'ride') {
      lastBell.current = clock.elapsedTime
      bell(0.5)
    }

    const yaw = Math.atan2(-tmpTan.x, -tmpTan.z) // models face -z
    placeBox(vehicleBoxes[index], tmpPos.x, tmpPos.z, yaw, size.z)
    // The model is moved directly so it always shows where the vehicle really is; the kinematic
    // body only carries the collider. Kinematic bodies can fall asleep while stopped and then stop
    // following their target, so keep it awake.
    const g = visual.current
    if (g) {
      g.position.set(tmpPos.x, 0, tmpPos.z)
      g.rotation.set(0, yaw, 0)
    }
    const b = body.current
    if (b) {
      tmpQuat.setFromAxisAngle(UP, yaw)
      b.wakeUp()
      b.setNextKinematicTranslation({ x: tmpPos.x, y: 0, z: tmpPos.z })
      b.setNextKinematicRotation(tmpQuat)
    }
  })

  return (
    <>
      <RigidBody ref={body} type="kinematicPosition" colliders={false} position={startPos} canSleep={false} userData={{ vehicle: index }}>
        <CuboidCollider args={size.half} position={[0, size.half[1], size.z]} />
      </RigidBody>
      <group ref={visual} position={startPos}>
        {v.kind === 'rickshaw' ? <RickshawModel anim={anim} seed={30 + index * 3} /> : <Bicycle anim={anim} look={look} frame={FRAMES[index % FRAMES.length]} />}
      </group>
    </>
  )
}

export function Traffic() {
  return (
    <>
      {VEHICLES.map((v, i) => (
        <TrafficVehicle key={i} v={v} index={i} />
      ))}
      <People />
    </>
  )
}

// Handy for debugging and automated tests in development builds only.
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__world = { player, pedestrians, pedReact, vehicleBoxes, vehicleReact }
}
