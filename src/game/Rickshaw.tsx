import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { CoefficientCombineRule, CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { artPanelTexture, C, checkTexture, hoodTexture } from './textures'
import { boxContact, input, pedReact, placeBox, player, REACT_TIME, SPAWN, vehicleReact } from './state'
import { insideWorld, ZONES, ZONE_HALF_LENGTH } from './zones'
import { useGame } from '../store/useGame'
import { pedestrians } from './People'
import { pedalTick } from '../audio/sound'

export interface RickshawAnim {
  wheel: number
  pedal: number
  steer: number
  lean: number
  /** 0..1: how far the puller's hand is raised (after being bumped). */
  wave?: number
}

const SKIN = '#8d5524'
const METAL = '#3d4a5c'
const UP = new THREE.Vector3(0, 1, 0)

/** A cylinder stretched between two points. */
export function Rod({ a, b, r = 0.035, color = METAL }: { a: [number, number, number]; b: [number, number, number]; r?: number; color?: string }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const dir = vb.clone().sub(va)
    return {
      pos: va.clone().add(vb).multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()),
      len: dir.length(),
    }
  }, [a, b])
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      <cylinderGeometry args={[r, r, len, 8]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
    </mesh>
  )
}

export function Wheel({ radius, spin }: { radius: number; spin: MutableRefObject<THREE.Group | null> }) {
  return (
    <group ref={spin}>
      <group rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow>
          <torusGeometry args={[radius, 0.045, 8, 28]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        <mesh>
          <torusGeometry args={[radius - 0.05, 0.015, 6, 28]} />
          <meshStandardMaterial color="#c9ced6" metalness={0.8} roughness={0.3} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, (i / 8) * Math.PI]}>
            <boxGeometry args={[radius * 2 - 0.1, 0.012, 0.012]} />
            <meshStandardMaterial color="#c9ced6" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.12, 10]} />
          <meshStandardMaterial color={C.red} />
        </mesh>
      </group>
    </group>
  )
}

const L1 = 0.46
const L2 = 0.46
const CRANK = new THREE.Vector2(0.52, -1.2) // (y, z)
const CRANK_R = 0.16
const HIP = new THREE.Vector2(1.22, -1.02)

function solveLeg(phase: number, thigh: THREE.Group, knee: THREE.Group) {
  const fy = CRANK.x - CRANK_R * Math.cos(phase)
  const fz = CRANK.y - CRANK_R * Math.sin(phase)
  const dy = fy - HIP.x
  const dz = fz - HIP.y
  const d = Math.min(Math.hypot(dy, dz), L1 + L2 - 0.001)
  const target = Math.atan2(-dz, -dy)
  const a = Math.acos(THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1))
  const k = Math.acos(THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1))
  thigh.rotation.x = target + a
  knee.rotation.x = -(Math.PI - k)
}

function Leg({ side, thighRef, kneeRef }: { side: number; thighRef: MutableRefObject<THREE.Group | null>; kneeRef: MutableRefObject<THREE.Group | null> }) {
  return (
    <group ref={thighRef} position={[side * 0.11, HIP.x, HIP.y]}>
      <mesh position={[0, -L1 / 2, 0]} castShadow>
        <capsuleGeometry args={[0.065, L1 - 0.1, 4, 8]} />
        <meshStandardMaterial color={SKIN} />
      </mesh>
      <group ref={kneeRef} position={[0, -L1, 0]}>
        <mesh position={[0, -L2 / 2, 0]} castShadow>
          <capsuleGeometry args={[0.055, L2 - 0.1, 4, 8]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
        <mesh position={[0, -L2, -0.05]}>
          <boxGeometry args={[0.09, 0.05, 0.2]} />
          <meshStandardMaterial color="#5b3a1e" />
        </mesh>
      </group>
    </group>
  )
}

function Puller({ anim, idle }: { anim?: MutableRefObject<RickshawAnim>; idle?: boolean }) {
  const torso = useRef<THREE.Group>(null)
  const lt = useRef<THREE.Group>(null)
  const lk = useRef<THREE.Group>(null)
  const rt = useRef<THREE.Group>(null)
  const rk = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const lungi = checkTexture('lungi', '#2f6db5', '#e9eef5', 10)
  const gamchha = checkTexture('gamchha', C.red, '#fff', 6)

  useFrame((state) => {
    const p = anim ? anim.current.pedal : idle ? 0.6 : state.clock.elapsedTime
    if (lt.current && lk.current) solveLeg(p, lt.current, lk.current)
    if (rt.current && rk.current) solveLeg(p + Math.PI, rt.current, rk.current)
    if (torso.current) {
      torso.current.rotation.z = Math.sin(p) * 0.05
      torso.current.position.y = Math.abs(Math.sin(p)) * 0.015
    }
    // Lift the right hand off the handlebar and shake it when bumped.
    const wave = anim?.current.wave ?? 0
    if (armR.current) {
      armR.current.rotation.x = wave * (1.9 + Math.sin(state.clock.elapsedTime * 13) * 0.15)
      armR.current.rotation.z = wave * 0.25
    }
  })

  return (
    <group>
      <Leg side={-1} thighRef={lt} kneeRef={lk} />
      <Leg side={1} thighRef={rt} kneeRef={rk} />
      <group ref={torso}>
        {/* lungi tucked up for pedaling */}
        <mesh position={[0, 1.24, -1.04]} castShadow>
          <cylinderGeometry args={[0.17, 0.21, 0.24, 12]} />
          <meshStandardMaterial map={lungi} />
        </mesh>
        {/* vest */}
        <Rod a={[0, 1.28, -1.04]} b={[0, 1.66, -1.3]} r={0.16} color="#f1efe6" />
        <mesh position={[0, 1.88, -1.42]} castShadow>
          <sphereGeometry args={[0.13, 16, 12]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
        <mesh position={[0, 1.93, -1.41]} rotation={[Math.PI / 2 - 0.2, 0, 0]}>
          <torusGeometry args={[0.12, 0.04, 8, 16]} />
          <meshStandardMaterial map={gamchha} />
        </mesh>
        <mesh position={[0, 1.97, -1.4]}>
          <sphereGeometry args={[0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {[-1, 1].map((s) => (
          // pivots at the shoulder
          <group key={s} ref={s > 0 ? armR : undefined} position={[s * 0.2, 1.68, -1.3]}>
            <Rod a={[0, 0, 0]} b={[s * 0.07, -0.22, -0.22]} r={0.05} color={SKIN} />
            <Rod a={[s * 0.07, -0.22, -0.22]} b={[s * 0.12, -0.36, -0.46]} r={0.045} color={SKIN} />
          </group>
        ))}
      </group>
    </group>
  )
}

export function RickshawModel({
  anim,
  withPuller = true,
  idlePuller = false,
  seed = 7,
  lantern = false,
}: {
  anim?: MutableRefObject<RickshawAnim>
  withPuller?: boolean
  idlePuller?: boolean
  seed?: number
  lantern?: boolean
}) {
  const lean = useRef<THREE.Group>(null)
  const steer = useRef<THREE.Group>(null)
  const front = useRef<THREE.Group>(null)
  const rearL = useRef<THREE.Group>(null)
  const rearR = useRef<THREE.Group>(null)
  const crank = useRef<THREE.Group>(null)
  const art = artPanelTexture(seed)
  const hood = hoodTexture()
  const seat = checkTexture('seat', C.red, C.pink, 4)

  useFrame(() => {
    if (!anim) return
    const a = anim.current
    if (front.current) front.current.rotation.x = a.wheel * (0.45 / 0.36)
    if (rearL.current) rearL.current.rotation.x = a.wheel
    if (rearR.current) rearR.current.rotation.x = a.wheel
    if (crank.current) crank.current.rotation.x = a.pedal
    if (steer.current) steer.current.rotation.y = a.steer * 0.45
    if (lean.current) lean.current.rotation.z = a.lean
  })

  const tassels = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        const x = -0.6 + i * 0.12
        return { x, color: [C.red, C.yellow, C.green, C.pink, C.blue][i % 5] }
      }),
    [],
  )

  return (
    <group ref={lean}>
      {/* rear wheels and axle */}
      <group position={[-0.68, 0.45, 0.55]}>
        <Wheel radius={0.45} spin={rearL} />
      </group>
      <group position={[0.68, 0.45, 0.55]}>
        <Wheel radius={0.45} spin={rearR} />
      </group>
      <Rod a={[-0.68, 0.45, 0.55]} b={[0.68, 0.45, 0.55]} r={0.03} />

      {/* steering assembly: fork, front wheel, handlebar */}
      <group ref={steer} position={[0, 0, -1.9]}>
        <group position={[0, 0.36, -0.05]}>
          <Wheel radius={0.36} spin={front} />
        </group>
        <Rod a={[0.06, 0.36, -0.05]} b={[0, 1.28, 0.08]} r={0.025} />
        <Rod a={[-0.06, 0.36, -0.05]} b={[0, 1.28, 0.08]} r={0.025} />
        <Rod a={[-0.36, 1.32, 0.13]} b={[0.36, 1.32, 0.13]} r={0.025} color="#c9ced6" />
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 0.38, 1.32, 0.13]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.12, 8]} />
              <meshStandardMaterial color={C.green} />
            </mesh>
            {/* little flag */}
            <Rod a={[s * 0.36, 1.32, 0.13]} b={[s * 0.36, 1.75, 0.13]} r={0.008} color="#ddd" />
            <mesh position={[s * 0.36 + s * 0.08, 1.68, 0.13]}>
              <planeGeometry args={[0.16, 0.12]} />
              <meshStandardMaterial color={s < 0 ? C.green : C.red} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
        {/* the bell */}
        <mesh position={[0.22, 1.37, 0.13]}>
          <sphereGeometry args={[0.04, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e5e9f0" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* plastic flowers */}
        {[-0.12, 0, 0.12].map((x, i) => (
          <mesh key={x} position={[x, 1.38, 0.1]}>
            <icosahedronGeometry args={[0.045, 0]} />
            <meshStandardMaterial color={[C.pink, C.yellow, C.orange][i]} />
          </mesh>
        ))}
      </group>

      {/* frame */}
      <Rod a={[0, 1.05, -1.82]} b={[0, CRANK.x, CRANK.y]} r={0.035} color={C.green} />
      <Rod a={[0, CRANK.x, CRANK.y]} b={[0, 1.12, -1.02]} r={0.035} color={C.green} />
      <Rod a={[0, 1.12, -1.82]} b={[0, 1.12, -1.02]} r={0.03} color={C.green} />
      <Rod a={[0, CRANK.x, CRANK.y]} b={[0, 0.58, -0.15]} r={0.035} color={C.green} />
      <Rod a={[0, 1.12, -1.02]} b={[0, 0.8, -0.15]} r={0.03} color={C.green} />
      {/* saddle */}
      <mesh position={[0, 1.16, -1.02]} castShadow>
        <boxGeometry args={[0.2, 0.06, 0.3]} />
        <meshStandardMaterial color="#2a1a10" />
      </mesh>
      {/* crank and pedals */}
      <group ref={crank} position={[0, CRANK.x, CRANK.y]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.03, 16]} />
          <meshStandardMaterial color="#c9ced6" metalness={0.8} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} rotation={[s < 0 ? 0 : Math.PI, 0, 0]}>
            <mesh position={[s * 0.1, -CRANK_R / 2, 0]}>
              <boxGeometry args={[0.02, CRANK_R, 0.03]} />
              <meshStandardMaterial color="#c9ced6" metalness={0.8} />
            </mesh>
            <mesh position={[s * 0.13, -CRANK_R, 0]}>
              <boxGeometry args={[0.08, 0.025, 0.06]} />
              <meshStandardMaterial color="#222" />
            </mesh>
          </group>
        ))}
      </group>

      {/* passenger carriage */}
      <mesh position={[0, 0.6, -0.15]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.06, 0.5]} />
        <meshStandardMaterial color={C.blue} />
      </mesh>
      <mesh position={[0, 0.8, 0.55]} castShadow>
        <boxGeometry args={[1.25, 0.42, 0.65]} />
        <meshStandardMaterial color={C.red} />
      </mesh>
      <mesh position={[0, 1.06, 0.53]} castShadow>
        <boxGeometry args={[1.32, 0.14, 0.7]} />
        <meshStandardMaterial map={seat} />
      </mesh>
      <mesh position={[0, 1.42, 0.87]} castShadow>
        <boxGeometry args={[1.3, 0.6, 0.08]} />
        <meshStandardMaterial map={seat} />
      </mesh>
      {/* the famous painted back plate */}
      <mesh position={[0, 0.8, 0.885]}>
        <planeGeometry args={[1.2, 0.42]} />
        <meshStandardMaterial map={art} />
      </mesh>
      {/* folded hood */}
      <mesh position={[0, 1.38, 0.55]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.68, 0.68, 1.38, 24, 1, true, 0, Math.PI * 0.62]} />
        <meshStandardMaterial map={hood} side={THREE.DoubleSide} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.69, 1.38, 0.55]} rotation={[0, s * Math.PI / 2, 0]}>
          <circleGeometry args={[0.68, 20, s < 0 ? 0 : Math.PI * 0.38, Math.PI * 0.62]} />
          <meshStandardMaterial map={art} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {tassels.map((t) => (
        <mesh key={t.x} position={[t.x, 1.38 + 0.68 * Math.sin(Math.PI * 0.62) - 0.06, 0.55 + 0.68 * Math.cos(Math.PI * 0.62)]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.035, 0.14, 6]} />
          <meshStandardMaterial color={t.color} />
        </mesh>
      ))}
      {lantern && (
        <>
          <mesh position={[0, 0.5, -0.2]}>
            <boxGeometry args={[0.12, 0.16, 0.12]} />
            <meshStandardMaterial color="#ffd27a" emissive="#ffb347" emissiveIntensity={3} />
          </mesh>
          <pointLight position={[0, 0.9, -2.4]} intensity={40} distance={16} color="#ffd9a0" />
        </>
      )}

      {withPuller && (
        <group>
          <Puller anim={idlePuller ? undefined : anim} idle={idlePuller} />
        </group>
      )}
    </group>
  )
}

const MAX_SPEED = 13
const REVERSE_SPEED = -4
const ACCEL = 7
const BRAKE = 20
const DRAG = 3.5
const TURN_RATE = 1.7

const quat = new THREE.Quaternion()
const euler = new THREE.Euler()
/** After bumping into someone the rickshaw stays stopped this long, so you can't push through them. */
const STUN_TIME = 0.6

export function Player() {
  const body = useRef<RapierRigidBody>(null)
  const anim = useRef<RickshawAnim>({ wheel: 0, pedal: 0, steer: 0, lean: 0 })
  const speed = useRef(0)
  const stun = useRef(0)
  const lastProgress = useRef(0)
  const night = useGame((s) => s.night)

  useFrame((_, rawDt) => {
    const b = body.current
    if (!b) return
    const dt = Math.min(rawDt, 1 / 20)
    const game = useGame.getState()
    const riding = game.phase === 'ride'
    if (stun.current > 0) stun.current -= dt
    const stunned = stun.current > 0
    const fwd = riding && !stunned && input.fwd
    const back = riding && !stunned && input.back
    const steerIn = riding ? (input.left ? 1 : 0) - (input.right ? 1 : 0) : 0

    let s = speed.current
    if (fwd) s += (s < 0 ? BRAKE : ACCEL) * dt
    else if (back) s -= (s > 0 ? BRAKE : ACCEL * 0.6) * dt
    else s -= Math.sign(s) * Math.min(Math.abs(s), DRAG * dt)
    s = THREE.MathUtils.clamp(s, REVERSE_SPEED, MAX_SPEED)

    // When we hit something, the real velocity drops: don't keep pushing at full speed.
    const lv = b.linvel()
    const actual = Math.hypot(lv.x, lv.z)
    if (Math.abs(s) > actual + 2.5) s = Math.sign(s) * (actual + 2.5)
    speed.current = s

    const r = b.rotation()
    euler.setFromQuaternion(quat.set(r.x, r.y, r.z, r.w), 'YXZ')
    const yaw = euler.y
    // Need some speed to turn; steering also gets gentler at top speed.
    const t = b.translation()
    placeBox(player.box, t.x, t.z, yaw, -0.65)

    // People are solid: if we're rolling into someone, stop dead. A real bump makes them react.
    if (s !== 0) {
      const fx = -Math.sin(yaw) * Math.sign(s)
      const fz = -Math.cos(yaw) * Math.sign(s)
      // look ahead by the distance we're about to travel this frame, so we stop before touching
      const reach = 0.05 + Math.abs(s) * dt
      for (let i = 0; i < pedestrians.length; i++) {
        const p = pedestrians[i]
        if (!p || !boxContact(player.box, p.x, p.z, p.r + reach)) continue
        if ((p.x - player.box.x) * fx + (p.z - player.box.z) * fz <= 0) continue // they're behind us
        if (Math.abs(s) > 0.3 && !(pedReact[i] > 0)) pedReact[i] = REACT_TIME
        s = 0
        speed.current = 0
        stun.current = STUN_TIME
      }
    }
    if (stunned) {
      s = 0
      speed.current = 0
    }

    const turnFactor = THREE.MathUtils.clamp(s / 3, -1, 1) * (1 - 0.35 * (Math.abs(s) / MAX_SPEED))
    b.setAngvel({ x: 0, y: steerIn * TURN_RATE * turnFactor, z: 0 }, true)
    b.setLinvel({ x: -Math.sin(yaw) * s, y: lv.y, z: -Math.cos(yaw) * s }, true)

    // Animation state for the model.
    const a = anim.current
    a.wheel -= (s * dt) / 0.45
    const prevPedal = a.pedal
    a.pedal -= s * dt * 1.4
    if (Math.floor(prevPedal / Math.PI) !== Math.floor(a.pedal / Math.PI) && !game.muted) pedalTick()
    a.steer = THREE.MathUtils.lerp(a.steer, steerIn, 1 - Math.exp(-dt * 8))
    a.lean = THREE.MathUtils.lerp(a.lean, -steerIn * (s / MAX_SPEED) * 0.08, 1 - Math.exp(-dt * 5))

    player.pos.set(t.x, t.y, t.z)
    player.yaw = yaw
    player.speed = s

    // Safety net: if we somehow escape the street, bring the rickshaw back to the stand.
    if (t.y < -5 || !insideWorld(t.x, t.z)) {
      b.setTranslation({ x: SPAWN.x, y: 0.3, z: SPAWN.z }, true)
      b.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
      b.setLinvel({ x: 0, y: 0, z: 0 }, true)
      speed.current = 0
    }

    // Which way along the route are we facing? (+1 = towards the river)
    const facingZ = -Math.cos(yaw)
    if (facingZ < -0.3 && game.heading !== 1) game.setHeading(1)
    else if (facingZ > 0.3 && game.heading !== -1) game.setHeading(-1)

    // Zone detection.
    let found: (typeof ZONES)[number]['id'] | null = null
    for (const z of ZONES) if (Math.abs(t.z - z.z) < ZONE_HALF_LENGTH) found = z.id
    if (found !== game.activeZone) game.setActiveZone(found)

    if (Math.abs(t.z - lastProgress.current) > 0.5) {
      lastProgress.current = t.z
      game.setProgressZ(t.z)
    }
  })

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[SPAWN.x, 0.05, SPAWN.z]}
      enabledRotations={[false, true, false]}
      linearDamping={0.2}
      angularDamping={2}
      ccd
      onCollisionEnter={({ other }) => {
        // Ran into a cyclist or another rickshaw: stop, and the rider raises a hand.
        const hit = other.rigidBody?.userData as { vehicle?: number } | undefined
        if (hit?.vehicle === undefined) return
        vehicleReact[hit.vehicle] = REACT_TIME
        speed.current = 0
        stun.current = STUN_TIME
      }}
    >
      <CuboidCollider
        args={[0.75, 0.55, 1.45]}
        position={[0, 0.6, -0.65]}
        friction={0}
        frictionCombineRule={CoefficientCombineRule.Min}
        restitution={0.1}
      />
      <RickshawModel anim={anim} lantern={night} />
    </RigidBody>
  )
}
