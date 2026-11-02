import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { facadeTexture, litWindowsTexture, rng, shopFrontTexture } from '../textures'
import { ROAD, ZONES } from '../zones'
import { useGame } from '../../store/useGame'

const LENGTH = ROAD.start - ROAD.end
const MID_Z = (ROAD.start + ROAD.end) / 2
const WALL_COLORS = ['#f4d7a1', '#e8b4a0', '#bcd9c8', '#a9c4e8', '#f2c4d6', '#e9e3c9', '#f6b96b', '#c9b8e8', '#d7e0a8']

const nearZone = (z: number, pad: number) => ZONES.some((zone) => Math.abs(zone.z - z) < pad)

function Ground() {
  return (
    <>
      {/* land stops at the riverbank just past the south roundabout */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, (ROAD.start + 50 + ROAD.riverZ) / 2]} receiveShadow>
        <planeGeometry args={[120, ROAD.start + 50 - ROAD.riverZ]} />
        <meshStandardMaterial color="#9c8f6b" roughness={1} />
      </mesh>
      {/* asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, MID_Z]} receiveShadow>
        <planeGeometry args={[ROAD.halfWidth * 2, LENGTH]} />
        <meshStandardMaterial color="#3b3d42" roughness={0.95} />
      </mesh>
      {/* footpaths */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[s * (ROAD.halfWidth + 1.25), 0.005, MID_Z]} receiveShadow>
            <planeGeometry args={[2.5, LENGTH]} />
            <meshStandardMaterial color="#b9b2a2" roughness={1} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[s * (ROAD.halfWidth + 0.1), 0.008, MID_Z]}>
            <planeGeometry args={[0.2, LENGTH]} />
            <meshStandardMaterial color="#e8e3d4" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[s * ((ROAD.footpath + ROAD.wall) / 2), 0.004, MID_Z]} receiveShadow>
            <planeGeometry args={[ROAD.wall - ROAD.footpath, LENGTH]} />
            <meshStandardMaterial color="#8f8a6d" roughness={1} />
          </mesh>
        </group>
      ))}
      <CenterDashes />
    </>
  )
}

function CenterDashes() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const count = Math.floor(LENGTH / 4)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    for (let i = 0; i < count; i++) {
      m.makeTranslation(0, 0.01, ROAD.start - 2 - i * 4)
      ref.current!.setMatrixAt(i, m)
    }
    ref.current!.instanceMatrix.needsUpdate = true
  }, [count])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.18, 0.01, 2]} />
      <meshStandardMaterial color="#f5f0e0" />
    </instancedMesh>
  )
}

function Colliders() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[60, 0.5, LENGTH / 2 + 60]} position={[0, -0.5, MID_Z]} friction={0.5} />
      <CuboidCollider args={[0.3, 4, LENGTH / 2]} position={[-ROAD.wall, 4, MID_Z]} />
      <CuboidCollider args={[0.3, 4, LENGTH / 2]} position={[ROAD.wall, 4, MID_Z]} />
    </RigidBody>
  )
}

export interface Building {
  x: number
  z: number
  w: number
  d: number
  h: number
  color: string
  seed: number
  tank: boolean
  /** Rotation for buildings around the roundabouts; their shop front then faces local +x. */
  rot?: number
}

function Buildings() {
  const night = useGame((s) => s.night)
  const list = useMemo(() => {
    const r = rng(42)
    const out: Building[] = []
    for (const side of [-1, 1]) {
      let z = ROAD.start
      while (z > ROAD.end + 3) {
        const w = 6 + r() * 5
        const d = 8 + r() * 6
        out.push({
          x: side * (ROAD.wall + 0.6 + d / 2),
          z: z - w / 2,
          w,
          d,
          h: 3 * Math.floor(2 + r() * 5),
          color: WALL_COLORS[Math.floor(r() * WALL_COLORS.length)],
          seed: Math.floor(r() * 4),
          tank: r() < 0.6,
        })
        z -= w + 0.15
      }
    }
    return out
  }, [])

  return (
    <group>
      {list.map((b, i) => (
        <BuildingMesh key={i} b={b} night={night} />
      ))}
    </group>
  )
}

export function BuildingMesh({ b, night }: { b: Building; night: boolean }) {
  const { map, emissiveMap } = useMemo(() => {
    const map = facadeTexture(b.color, b.seed).clone()
    const emissiveMap = litWindowsTexture(b.seed + b.h).clone()
    for (const t of [map, emissiveMap]) {
      t.repeat.set(b.w / 6, (b.h - 3) / 3)
      t.offset.set(0, 0)
      t.needsUpdate = true
    }
    return { map, emissiveMap }
  }, [b])
  const shop = shopFrontTexture(Math.floor(b.z * 7 + b.x))
  const facing = b.rot !== undefined ? 1 : b.x < 0 ? 1 : -1
  return (
    <group position={[b.x, 0, b.z]} rotation={[0, b.rot ?? 0, 0]}>
      <mesh position={[0, 3 + (b.h - 3) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[b.d, b.h - 3, b.w]} />
        <meshStandardMaterial
          map={map}
          emissiveMap={emissiveMap}
          emissive="#ffffff"
          emissiveIntensity={night ? 1.1 : 0}
          roughness={0.95}
        />
      </mesh>
      {/* ground-floor shop */}
      <mesh position={[0, 1.5, 0]} receiveShadow>
        <boxGeometry args={[b.d, 3, b.w]} />
        <meshStandardMaterial color="#5a5045" />
      </mesh>
      <mesh position={[facing * (b.d / 2 + 0.01), 1.5, 0]} rotation={[0, facing * Math.PI / 2, 0]}>
        <planeGeometry args={[b.w - 0.4, 2.8]} />
        <meshStandardMaterial map={shop} emissive={night ? '#553311' : '#000'} />
      </mesh>
      {/* roof parapet & water tank */}
      <mesh position={[0, b.h + 0.25, 0]}>
        <boxGeometry args={[b.d + 0.2, 0.5, b.w + 0.2]} />
        <meshStandardMaterial color="#d8d2c4" />
      </mesh>
      {b.tank && (
        <mesh position={[b.d * 0.2, b.h + 1.1, b.w * 0.2]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 1.6, 14]} />
          <meshStandardMaterial color="#1b1b1b" roughness={0.6} />
        </mesh>
      )}
    </group>
  )
}

/** Electric poles with the famous tangled wires, plus street lamps. */
function PolesAndWires() {
  const night = useGame((s) => s.night)
  const poles = useMemo(() => {
    const out: { x: number; z: number }[] = []
    for (const side of [-1, 1]) for (let z = ROAD.start - 4; z > ROAD.end; z -= 18) out.push({ x: side * 7.8, z: z - (side > 0 ? 9 : 0) })
    // Keep the roundabout junctions clear so there is room to turn in and out.
    return out.filter((p) => p.z < ROAD.start - 6 && p.z > ROAD.end + 8)
  }, [])

  const wires = useMemo(() => {
    const r = rng(7)
    const pts: number[] = []
    const addCurve = (a: THREE.Vector3, b: THREE.Vector3, sag: number) => {
      const seg = 14
      for (let i = 0; i < seg; i++) {
        const t0 = i / seg
        const t1 = (i + 1) / seg
        const p0 = a.clone().lerp(b, t0)
        const p1 = a.clone().lerp(b, t1)
        p0.y -= Math.sin(t0 * Math.PI) * sag
        p1.y -= Math.sin(t1 * Math.PI) * sag
        pts.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z)
      }
    }
    for (const side of [-1, 1]) {
      const sp = poles.filter((p) => Math.sign(p.x) === side)
      for (let i = 0; i < sp.length - 1; i++) {
        for (let k = 0; k < 5; k++) {
          const h = 6.2 + k * 0.25
          addCurve(new THREE.Vector3(sp[i].x + (r() - 0.5) * 0.5, h, sp[i].z), new THREE.Vector3(sp[i + 1].x + (r() - 0.5) * 0.5, h + (r() - 0.5) * 0.4, sp[i + 1].z), 0.4 + r() * 0.9)
        }
      }
    }
    // wires crossing the road
    for (let i = 0; i < poles.length / 2; i += 2) {
      const a = poles[i]
      const b = poles.find((p) => p.x > 0 && Math.abs(p.z - a.z) < 10)
      if (b) addCurve(new THREE.Vector3(a.x, 6.6, a.z), new THREE.Vector3(b.x, 6.4, b.z), 0.8)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [poles])

  return (
    <group>
      <lineSegments geometry={wires}>
        <lineBasicMaterial color="#141414" />
      </lineSegments>
      {poles.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position={[0, 3.6, 0]} castShadow>
            <boxGeometry args={[0.22, 7.2, 0.22]} />
            <meshStandardMaterial color="#9a978f" />
          </mesh>
          <mesh position={[0, 6.6, 0]}>
            <boxGeometry args={[1.4, 0.1, 0.1]} />
            <meshStandardMaterial color="#6d6a63" />
          </mesh>
          {/* lamp arm towards the road */}
          <mesh position={[-Math.sign(p.x) * 0.8, 5.6, 0]}>
            <boxGeometry args={[1.6, 0.08, 0.08]} />
            <meshStandardMaterial color="#6d6a63" />
          </mesh>
          <mesh position={[-Math.sign(p.x) * 1.55, 5.45, 0]}>
            <boxGeometry args={[0.5, 0.15, 0.3]} />
            <meshStandardMaterial color="#fff6d8" emissive="#ffcf7a" emissiveIntensity={night ? 4 : 0} />
          </mesh>
          {night && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-Math.sign(p.x) * 2.2, 0.02, 0]}>
              <circleGeometry args={[3.2, 24]} />
              <meshBasicMaterial color="#ffcf7a" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
          )}
        </group>
      ))}
      <RigidBody type="fixed" colliders={false}>
        {poles.map((p, i) => (
          <CuboidCollider key={i} args={[0.15, 3.6, 0.15]} position={[p.x, 3.6, p.z]} />
        ))}
      </RigidBody>
    </group>
  )
}

function Palm({ seed }: { seed: number }) {
  const r = rng(seed)
  const lean = (r() - 0.5) * 0.3
  const h = 5 + r() * 2
  return (
    <group rotation={[0, r() * Math.PI * 2, lean]}>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[i * i * 0.012, (i + 0.5) * (h / 6), 0]} rotation={[0, 0, -i * 0.03]} castShadow>
          <cylinderGeometry args={[0.16 - i * 0.012, 0.2 - i * 0.012, h / 6 + 0.05, 7]} />
          <meshStandardMaterial color="#7a5c3c" roughness={1} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i} position={[0.4, h, 0]} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
          <mesh position={[1.1, -0.35, 0]} rotation={[0, 0, -0.5]} castShadow>
            <boxGeometry args={[2.3, 0.04, 0.5]} />
            <meshStandardMaterial color={i % 2 ? '#3f8f3a' : '#2f7a33'} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function RoundTree({ seed }: { seed: number }) {
  const r = rng(seed)
  const s = 1.6 + r() * 0.8
  return (
    <group>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 2.8, 7]} />
        <meshStandardMaterial color="#6b4e33" />
      </mesh>
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[(r() - 0.5) * 1.2, 3.2 + k * 0.6, (r() - 0.5) * 1.2]} castShadow>
          <icosahedronGeometry args={[s - k * 0.35, 1]} />
          <meshStandardMaterial color={['#3e8a3a', '#4f9c3f', '#357a35'][k]} flatShading />
        </mesh>
      ))}
    </group>
  )
}

function Trees() {
  const trees = useMemo(() => {
    const r = rng(99)
    const out: { x: number; z: number; palm: boolean; seed: number }[] = []
    for (let z = ROAD.start - 8; z > ROAD.end + 6; z -= 11) {
      for (const side of [-1, 1]) {
        const tz = z - r() * 5
        if (nearZone(tz, 18) || r() < 0.35) continue
        out.push({ x: side * (10.8 + r() * 1.2), z: tz, palm: r() < 0.5, seed: Math.floor(r() * 1000) })
      }
    }
    return out
  }, [])
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          {t.palm ? <Palm seed={t.seed} /> : <RoundTree seed={t.seed} />}
        </group>
      ))}
      <RigidBody type="fixed" colliders={false}>
        {trees.map((t, i) => (
          <CylinderCollider key={i} args={[2, 0.3]} position={[t.x, 2, t.z]} />
        ))}
      </RigidBody>
    </group>
  )
}

/** Wide river at the end of the road, the Buriganga. */
function River() {
  const water = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (water.current) water.current.color.setHSL(0.55, 0.45, 0.36 + Math.sin(clock.elapsedTime * 0.8) * 0.02)
  })
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, ROAD.riverZ - 110]}>
        <planeGeometry args={[400, 220]} />
        <meshStandardMaterial ref={water} color="#2f7a8c" roughness={0.15} metalness={0.3} />
      </mesh>
      {/* ghat steps */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, -0.05 - i * 0.12, ROAD.riverZ - 0.4 - i * 1.1]} receiveShadow>
          <boxGeometry args={[100, 0.25, 1.1]} />
          <meshStandardMaterial color={i % 2 ? '#a8462e' : '#b8573a'} />
        </mesh>
      ))}
    </group>
  )
}

export function Street() {
  return (
    <group>
      <Ground />
      <Colliders />
      <Buildings />
      <PolesAndWires />
      <Trees />
      <River />
    </group>
  )
}
