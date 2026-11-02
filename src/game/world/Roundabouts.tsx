import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { BuildingMesh, type Building } from './Street'
import { C, flagTexture, rng } from '../textures'
import { ROAD, ROUNDABOUT, ROUNDABOUTS } from '../zones'
import { useGame } from '../../store/useGame'

type Roundabout = (typeof ROUNDABOUTS)[number]

const R = ROUNDABOUT.outer
const SEGMENTS = 48
const WALL_COLORS = ['#f4d7a1', '#e8b4a0', '#bcd9c8', '#a9c4e8', '#f2c4d6', '#e9e3c9']

// Angles are measured from +z towards +x: a point at angle θ is (sin θ, cos θ) · r from the centre.
const at = (cz: number, th: number, r: number) => ({ x: Math.sin(th) * r, z: cz + Math.cos(th) * r })
const angleTo = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))
const inStreet = (x: number, z: number) => Math.abs(x) < ROAD.wall && z <= ROAD.start && z >= ROAD.end

/** Ring geometries lie in their XY plane; this converts our angle to theirs after rotating flat. */
const ringTheta = (th: number) => th - Math.PI / 2

function Surface({ r }: { r: Roundabout }) {
  const gap = 0.9 // footpath opening towards the street, in radians each side
  const dashes = useMemo(() => Array.from({ length: 30 }, (_, i) => (i / 30) * Math.PI * 2), [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, r.z]} receiveShadow>
        <ringGeometry args={[ROUNDABOUT.island, R, 72]} />
        <meshStandardMaterial color="#3b3d42" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, r.z]} receiveShadow>
        <ringGeometry args={[R, R + ROUNDABOUT.footpath, 72, 1, ringTheta(r.streetAngle + gap), Math.PI * 2 - gap * 2]} />
        <meshStandardMaterial color="#b9b2a2" roughness={1} />
      </mesh>
      {dashes.map((th) => {
        const p = at(r.z, th, 10)
        return (
          <mesh key={th} position={[p.x, 0.02, p.z]} rotation={[0, th, 0]}>
            <boxGeometry args={[1.2, 0.01, 0.16]} />
            <meshStandardMaterial color="#f5f0e0" />
          </mesh>
        )
      })}
      {/* island curb and lawn */}
      <mesh position={[0, 0.15, r.z]} castShadow receiveShadow>
        <cylinderGeometry args={[ROUNDABOUT.island, ROUNDABOUT.island, 0.3, 48]} />
        <meshStandardMaterial color="#e6e0cf" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.31, r.z]} receiveShadow>
        <circleGeometry args={[ROUNDABOUT.island - 0.3, 48]} />
        <meshStandardMaterial color="#4f9c3f" />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const p = at(r.z, (i / 16) * Math.PI * 2, ROUNDABOUT.island - 0.6)
        return (
          <mesh key={i} position={[p.x, 0.5, p.z]}>
            <icosahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial color={[C.red, C.yellow, C.pink, C.orange][i % 4]} flatShading />
          </mesh>
        )
      })}
    </group>
  )
}

/** Railings and colliders around the outer edge, open where the street joins. */
function Boundary({ r }: { r: Roundabout }) {
  const segs = useMemo(() => {
    const out: { x: number; z: number; th: number }[] = []
    for (let i = 0; i < SEGMENTS; i++) {
      const th = ((i + 0.5) / SEGMENTS) * Math.PI * 2
      const p = at(r.z, th, R)
      if (!inStreet(p.x, p.z)) out.push({ ...p, th })
    }
    return out
  }, [r.z])
  const segLen = 2 * R * Math.sin(Math.PI / SEGMENTS) + 0.1
  // Close the small gap between the circle and the street walls where they meet.
  const joinZ = r.streetAngle === 0 ? ROAD.end : ROAD.start
  const halfOpen = Math.sqrt(R * R - (r.z - joinZ) ** 2)
  const joinLen = ROAD.wall + 0.3 - halfOpen
  return (
    <group>
      {segs.map((s) => (
        <group key={s.th} position={[s.x, 0, s.z]} rotation={[0, s.th, 0]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[segLen, 0.1, 0.1]} />
            <meshStandardMaterial color={C.green} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[segLen, 0.06, 0.06]} />
            <meshStandardMaterial color={C.yellow} />
          </mesh>
          <mesh position={[segLen / 2, 0.5, 0]}>
            <boxGeometry args={[0.1, 1, 0.1]} />
            <meshStandardMaterial color={C.green} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (halfOpen + joinLen / 2), 0.5, joinZ]}>
          <boxGeometry args={[joinLen, 1, 0.3]} />
          <meshStandardMaterial color="#d8d2c4" />
        </mesh>
      ))}
      <RigidBody type="fixed" colliders={false}>
        {segs.map((s) => (
          <CuboidCollider key={s.th} args={[segLen / 2, 2, 0.2]} position={[s.x, 2, s.z]} rotation={[0, s.th, 0]} />
        ))}
        {[-1, 1].map((side) => (
          <CuboidCollider key={side} args={[joinLen / 2, 2, 0.3]} position={[side * (halfOpen + joinLen / 2), 2, joinZ]} />
        ))}
        <CylinderCollider args={[1.5, ROUNDABOUT.island + 0.2]} position={[0, 1.5, r.z]} />
      </RigidBody>
    </group>
  )
}

function Lamps({ r }: { r: Roundabout }) {
  const night = useGame((s) => s.night)
  const angles = useMemo(
    () => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2 + Math.PI / 8).filter((th) => angleTo(th, r.streetAngle) > 1.1),
    [r.streetAngle],
  )
  return (
    <group>
      {angles.map((th) => {
        const p = at(r.z, th, R + 1.2)
        return (
          <group key={th} position={[p.x, 0, p.z]} rotation={[0, th + Math.PI / 2, 0]}>
            <mesh position={[0, 3, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.12, 6, 8]} />
              <meshStandardMaterial color="#6d6a63" />
            </mesh>
            <mesh position={[0.6, 5.9, 0]}>
              <boxGeometry args={[1.2, 0.07, 0.07]} />
              <meshStandardMaterial color="#6d6a63" />
            </mesh>
            <mesh position={[1.2, 5.78, 0]}>
              <boxGeometry args={[0.45, 0.14, 0.28]} />
              <meshStandardMaterial color="#fff6d8" emissive="#ffcf7a" emissiveIntensity={night ? 4 : 0} />
            </mesh>
            {night && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.6, 0.03, 0]}>
                <circleGeometry args={[3, 24]} />
                <meshBasicMaterial color="#ffcf7a" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}

function RingBuildings({ r, ranges }: { r: Roundabout; ranges: [number, number][] }) {
  const night = useGame((s) => s.night)
  const list = useMemo(() => {
    const rand = rng(r.id === 'north' ? 71 : 113)
    const out: Building[] = []
    for (const [from, to] of ranges) {
      for (let th = from; th <= to + 1e-6; th += 0.38) {
        const d = 7 + rand() * 4
        const p = at(r.z, th, R + ROUNDABOUT.footpath + 0.8 + d / 2)
        out.push({
          x: p.x,
          z: p.z,
          w: 7.6,
          d,
          h: 3 * Math.floor(3 + rand() * 4),
          color: WALL_COLORS[Math.floor(rand() * WALL_COLORS.length)],
          seed: Math.floor(rand() * 4),
          tank: rand() < 0.6,
          rot: th + Math.PI / 2,
        })
      }
    }
    return out
  }, [r, ranges])
  return (
    <group>
      {list.map((b, i) => (
        <BuildingMesh key={i} b={b} night={night} />
      ))}
    </group>
  )
}

/** Shapla Chattar: the water lily, national flower of Bangladesh, rising from a fountain pool. */
function Shapla({ z }: { z: number }) {
  const water = useRef<THREE.MeshStandardMaterial>(null)
  const jets = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (water.current) water.current.color.setHSL(0.53, 0.55, 0.45 + Math.sin(t * 1.5) * 0.03)
    jets.current?.children.forEach((m, i) => {
      const k = ((t * 0.9 + i / 12) % 1) // 0..1 along each arc
      const a = (i / 12) * Math.PI * 2
      const rad = 1.2 + k * 2.2
      m.position.set(Math.sin(a) * rad, 0.6 + Math.sin(k * Math.PI) * 1.6, Math.cos(a) * rad)
    })
  })
  return (
    <group position={[0, 0.3, z]}>
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <cylinderGeometry args={[3.9, 3.9, 0.4, 40]} />
        <meshStandardMaterial color="#e6e0cf" />
      </mesh>
      <mesh position={[0, 0.41, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.6, 40]} />
        <meshStandardMaterial ref={water} color="#3aa0c8" roughness={0.1} metalness={0.2} />
      </mesh>
      {/* lily pads */}
      {[0.6, 2.1, 3.4, 4.8].map((a, i) => (
        <mesh key={a} position={[Math.sin(a) * 2.6, 0.43, Math.cos(a) * 2.6]} rotation={[-Math.PI / 2, 0, a]}>
          <circleGeometry args={[0.45 + i * 0.05, 16, 0.4, Math.PI * 1.8]} />
          <meshStandardMaterial color="#2f7a33" side={THREE.DoubleSide} />
        </mesh>
      ))}
      <group ref={jets}>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.09, 6, 6]} />
            <meshStandardMaterial color="#dff3ff" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.35, 0.6, 1.6, 16]} />
        <meshStandardMaterial color="#f4f4f0" />
      </mesh>
      {/* the flower: stretched spheres as petals */}
      <group position={[0, 2, 0]}>
        <group>
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2
            return (
              <group key={'o' + i} rotation={[0, a, 0]}>
                <mesh position={[0, 0.55, 0.75]} rotation={[0.75, 0, 0]} scale={[0.55, 1.6, 0.22]} castShadow>
                  <sphereGeometry args={[0.6, 14, 10]} />
                  <meshStandardMaterial color="#fbe3ee" roughness={0.5} emissive="#ff9cc4" emissiveIntensity={0.25} />
                </mesh>
              </group>
            )
          })}
          {Array.from({ length: 7 }, (_, i) => {
            const a = (i / 7) * Math.PI * 2 + 0.3
            return (
              <group key={'i' + i} rotation={[0, a, 0]}>
                <mesh position={[0, 0.75, 0.35]} rotation={[0.35, 0, 0]} scale={[0.45, 1.5, 0.2]} castShadow>
                  <sphereGeometry args={[0.6, 14, 10]} />
                  <meshStandardMaterial color="#f29bbf" roughness={0.5} emissive="#ff6fa8" emissiveIntensity={0.25} />
                </mesh>
              </group>
            )
          })}
          <mesh position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.35, 14, 10]} />
            <meshStandardMaterial color={C.yellow} emissive="#a06b00" emissiveIntensity={0.3} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function Flag() {
  const geo = useMemo(() => new THREE.PlaneGeometry(3, 1.8, 16, 6), [])
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo])
  const tex = flagTexture()
  useFrame(({ clock }) => {
    const pos = geo.attributes.position as THREE.BufferAttribute
    const t = clock.elapsedTime
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3]
      const k = (x + 1.5) / 3 // 0 at the pole, 1 at the free edge
      pos.setZ(i, Math.sin(x * 2.2 - t * 4) * 0.18 * k)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
  })
  return (
    <group>
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 8, 8]} />
        <meshStandardMaterial color="#d9dde2" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh geometry={geo} position={[1.55, 7, 0]} castShadow>
        <meshStandardMaterial map={tex} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/** A giant painted rickshaw wheel, slowly turning. */
function GiantWheel() {
  const wheel = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (wheel.current) wheel.current.rotation.z -= dt * 0.4
  })
  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.6, 1, 1]} />
        <meshStandardMaterial color={C.red} />
      </mesh>
      <group ref={wheel} position={[0, 3.6, 0]}>
        <mesh castShadow>
          <torusGeometry args={[2.4, 0.18, 10, 40]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh>
          <torusGeometry args={[2.15, 0.07, 8, 40]} />
          <meshStandardMaterial color={C.yellow} metalness={0.4} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, (i / 12) * Math.PI]}>
            <boxGeometry args={[4.3, 0.06, 0.06]} />
            <meshStandardMaterial color="#d9dde2" metalness={0.7} />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
          <meshStandardMaterial color={C.green} />
        </mesh>
      </group>
    </group>
  )
}

export function Roundabouts() {
  const [north, south] = ROUNDABOUTS
  return (
    <group>
      {ROUNDABOUTS.map((r) => (
        <group key={r.id}>
          <Surface r={r} />
          <Boundary r={r} />
          <Lamps r={r} />
        </group>
      ))}
      <RingBuildings r={north} ranges={[[-1.75, 1.75]]} />
      <RingBuildings r={south} ranges={[[1.3, 2.06], [-2.06, -1.3]]} />
      <Shapla z={north.z} />
      <group position={[0, 0.3, south.z]}>
        <group position={[-1.6, 0, 1]}>
          <Flag />
        </group>
        <group position={[1.2, 0, -0.8]} rotation={[0, 0.5, 0]}>
          <GiantWheel />
        </group>
      </group>
    </group>
  )
}
