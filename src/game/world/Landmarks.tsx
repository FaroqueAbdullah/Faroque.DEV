import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { alponaTexture, C, checkTexture, signTexture, stripeTexture, type SignLine } from '../textures'
import { ZONES, type ZoneId } from '../zones'
import { RickshawModel } from '../Rickshaw'
import { education, experience, profile, projects, skills } from '../../content/content'
import { useGame } from '../../store/useGame'
import { Sadarghat } from './Sadarghat'

const zoneZ = (id: ZoneId) => ZONES.find((z) => z.id === id)!.z

/** A painted board. Local front is +z. */
function Board({
  id,
  lines,
  w,
  h,
  opts,
  position,
  rotation,
  doubleSided,
}: {
  id: string
  lines: SignLine[]
  w: number
  h: number
  opts?: Parameters<typeof signTexture>[2]
  position?: [number, number, number]
  rotation?: [number, number, number]
  /** Paint the back of the board too, for signs seen from both directions. */
  doubleSided?: boolean
}) {
  const tex = signTexture(id, lines, { w: 1024, h: Math.round((1024 * h) / w), ...opts })
  const night = useGame((s) => s.night)
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.06]} castShadow>
        <boxGeometry args={[w + 0.12, h + 0.12, 0.1]} />
        <meshStandardMaterial color="#3b2a1a" />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.8} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={night ? 0.5 : 0} />
      </mesh>
      {doubleSided && (
        <mesh position={[0, 0, -0.12]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial map={tex} roughness={0.8} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={night ? 0.5 : 0} />
        </mesh>
      )}
    </group>
  )
}

function Post({ x, z, h, r = 0.08, color = '#5b3a1e' }: { x: number; z: number; h: number; r?: number; color?: string }) {
  return (
    <mesh position={[x, h / 2, z]} castShadow>
      <cylinderGeometry args={[r, r, h, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

/** Side structures are authored facing +x (towards the road from the left side). */
function Side({ side, z, children }: { side: -1 | 1; z: number; children: ReactNode }) {
  return (
    <group position={[side * 10, 0, z]} rotation={[0, side < 0 ? 0 : Math.PI, 0]}>
      {children}
    </group>
  )
}

function Solid({ size, position }: { size: [number, number, number]; position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
    </RigidBody>
  )
}

function Garland({ width, y }: { width: number; y: number }) {
  const night = useGame((s) => s.night)
  const flags = useMemo(() => Array.from({ length: Math.floor(width / 0.5) }, (_, i) => i), [width])
  const colors = [C.red, C.yellow, C.green, C.pink, C.blue, C.orange]
  return (
    <group>
      {flags.map((i) => {
        const x = -width / 2 + 0.25 + i * 0.5
        const sag = Math.sin(((i + 0.5) / flags.length) * Math.PI) * 0.5
        return (
          <group key={i} position={[x, y - sag, 0]}>
            <mesh rotation={[0, 0, Math.PI]}>
              <coneGeometry args={[0.16, 0.36, 3]} />
              <meshStandardMaterial color={colors[i % colors.length]} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0.25, 0.05, 0]}>
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshStandardMaterial
                color={colors[(i + 2) % colors.length]}
                emissive={colors[(i + 2) % colors.length]}
                emissiveIntensity={night ? 3 : 0.2}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/** Decorated gate ("tor") over the road marking each stop. */
function ZoneGate({ id }: { id: ZoneId }) {
  const zone = ZONES.find((z) => z.id === id)!
  const ring = useRef<THREE.Mesh>(null)
  const active = useGame((s) => s.activeZone === id)
  const alpona = alponaTexture()
  useFrame(({ clock }) => {
    if (!ring.current) return
    const s = active ? 1 + Math.sin(clock.elapsedTime * 3) * 0.04 : 1
    ring.current.scale.setScalar(s)
    ;(ring.current.material as THREE.MeshBasicMaterial).opacity = active ? 0.95 : 0.6
  })
  // The start gate stands ahead of the spawn point; the others are passed on the way in.
  const gz = id === 'start' ? zone.z - 7 : zone.z + 5
  return (
    <group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, zone.z]}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial map={alpona} transparent depthWrite={false} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 6.4, 3.8, gz]} castShadow>
            <cylinderGeometry args={[0.22, 0.26, 7.6, 10]} />
            <meshStandardMaterial map={stripeTexture('gatepole', [C.red, C.yellow], false)} />
          </mesh>
          <mesh position={[s * 6.4, 7.8, gz]}>
            <sphereGeometry args={[0.38, 12, 10]} />
            <meshStandardMaterial color={C.yellow} metalness={0.3} roughness={0.4} />
          </mesh>
        </group>
      ))}
      <Board
        id={'gate-' + id}
        lines={[{ text: zone.gate.en.toUpperCase(), size: 170 }]}
        w={10}
        h={1.9}
        opts={{ bg: C.cream, fg: C.red, border: C.red, dots: C.yellow }}
        position={[0, 6.8, gz]}
        doubleSided
      />
      {/* kept above the chase camera's highest point so it never clips through */}
      <group position={[0, 5.75, gz + 0.1]}>
        <Garland width={12.4} y={0} />
      </group>
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[3.8, 0.3]} position={[-6.4, 3.8, gz]} />
        <CylinderCollider args={[3.8, 0.3]} position={[6.4, 3.8, gz]} />
      </RigidBody>
    </group>
  )
}

function Person({ position, shirt, rotation = 0, seated = true }: { position: [number, number, number]; shirt: string; rotation?: number; seated?: boolean }) {
  const y = seated ? 0.45 : 0.9
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, y + 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.4, 4, 8]} />
        <meshStandardMaterial color={shirt} />
      </mesh>
      <mesh position={[0, y + 0.82, 0]} castShadow>
        <sphereGeometry args={[0.14, 12, 10]} />
        <meshStandardMaterial color="#8d5524" />
      </mesh>
      <mesh position={[0, y + 0.88, -0.02]}>
        <sphereGeometry args={[0.145, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {seated ? (
        <mesh position={[0.2, y - 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.08, 0.3, 4, 6]} />
          <meshStandardMaterial color="#d9cfb8" />
        </mesh>
      ) : (
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.16, 0.2, 0.9, 10]} />
          <meshStandardMaterial map={checkTexture('lungi2', '#2e7d4f', '#e9eef5', 8)} />
        </mesh>
      )}
    </group>
  )
}

function RickshawStand() {
  const z = zoneZ('start')
  return (
    <group>
      {[6.5, 2.8, -0.9].map((dz, i) => (
        <group key={dz} position={[9.6, 0, z + dz]} rotation={[0, Math.PI / 2 + 0.35, 0]}>
          <RickshawModel withPuller={i === 1} idlePuller seed={11 + i * 5} />
        </group>
      ))}
      <Solid size={[3.2, 2.5, 11]} position={[9.6, 1.25, z + 2.8]} />
      <Board
        id="stand"
        lines={[{ text: 'RICKSHAW STAND', size: 130 }, { text: 'রিকশা স্ট্যান্ড', size: 80, color: C.green }]}
        w={3}
        h={1.2}
        position={[8.3, 2.6, z - 4]}
        rotation={[0, -0.9, 0]}
      />
      <Post x={8.3} z={z - 4.05} h={2} />
      {/* Name billboard */}
      <group position={[-10, 0, z - 3]} rotation={[0, 0.7, 0]}>
        <Post x={-1.8} z={0} h={4} r={0.12} />
        <Post x={1.8} z={0} h={4} r={0.12} />
        <Board
          id="name"
          lines={[
            { text: profile.name.en, size: 130 },
            { text: profile.role.en, size: 70, color: C.green },
            { text: profile.name.bn, size: 70, color: C.blue },
          ]}
          w={5}
          h={2.6}
          opts={{ bg: C.yellow, border: C.red }}
          position={[0, 4.6, 0]}
        />
      </group>
      <Solid size={[4.2, 6, 1.2]} position={[-10, 3, z - 3]} />
    </group>
  )
}

function Steam({ position }: { position: [number, number, number] }) {
  const puffs = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    puffs.current?.children.forEach((m, i) => {
      m.position.y += dt * (0.35 + i * 0.05)
      m.position.x = Math.sin(m.position.y * 3 + i) * 0.08
      if (m.position.y > 1.2) m.position.y = 0
      const s = 0.06 + m.position.y * 0.12
      m.scale.setScalar(s / 0.1)
      ;((m as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.55 * (1 - m.position.y / 1.2)
    })
  })
  return (
    <group ref={puffs} position={position}>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0, i * 0.2, 0]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshStandardMaterial color="#ffffff" transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function TeaStall() {
  const z = zoneZ('about')
  const tin = stripeTexture('tin', ['#7d93a6', '#93a8ba'])
  return (
    <group>
      <Side side={-1} z={z}>
        {/* stall body */}
        <mesh position={[-0.6, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 1.2, 4]} />
          <meshStandardMaterial color="#7a4a24" />
        </mesh>
        <mesh position={[0.15, 1.22, 0]}>
          <boxGeometry args={[0.3, 0.06, 4]} />
          <meshStandardMaterial color="#5b3a1e" />
        </mesh>
        <mesh position={[-1.25, 1.8, 0]}>
          <boxGeometry args={[0.1, 2.4, 4]} />
          <meshStandardMaterial color="#c9a46b" />
        </mesh>
        {[-1.9, 1.9].map((pz) => (
          <group key={pz}>
            <Post x={0.2} z={pz} h={2.9} />
            <Post x={-1.2} z={pz} h={3.1} />
          </group>
        ))}
        <mesh position={[-0.5, 3.05, 0]} rotation={[0, 0, -0.18]} castShadow>
          <boxGeometry args={[2.4, 0.06, 4.6]} />
          <meshStandardMaterial map={tin} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* kettle on clay stove */}
        <mesh position={[-0.2, 1.4, 1.2]}>
          <cylinderGeometry args={[0.22, 0.26, 0.3, 12]} />
          <meshStandardMaterial color="#9b5a37" />
        </mesh>
        <mesh position={[-0.2, 1.7, 1.2]} castShadow>
          <sphereGeometry args={[0.2, 14, 10]} />
          <meshStandardMaterial color="#c0c6cc" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0.02, 1.76, 1.2]} rotation={[0, 0, -0.9]}>
          <cylinderGeometry args={[0.025, 0.04, 0.3, 6]} />
          <meshStandardMaterial color="#c0c6cc" metalness={0.8} />
        </mesh>
        <Steam position={[-0.2, 1.95, 1.2]} />
        {/* biscuit jars and cups */}
        {[-1.4, -0.9, -0.4, 0.1].map((jz, i) => (
          <mesh key={jz} position={[-0.3, 1.45, jz]}>
            <cylinderGeometry args={[0.15, 0.15, 0.4, 10]} />
            <meshStandardMaterial color={[C.yellow, C.orange, C.pink, C.cream][i]} transparent opacity={0.8} />
          </mesh>
        ))}
        {[0.4, 0.6, 0.8].map((cz) => (
          <mesh key={cz} position={[0.1, 1.3, cz]}>
            <cylinderGeometry args={[0.05, 0.04, 0.1, 8]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
        ))}
        {/* hanging banana bunch */}
        <mesh position={[0.1, 2.5, -1.5]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#e6c229" />
        </mesh>
        {/* bench & customers */}
        <mesh position={[1.6, 0.42, 0]} castShadow>
          <boxGeometry args={[0.5, 0.08, 3.4]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        {[-1.4, 1.4].map((bz) => (
          <mesh key={bz} position={[1.6, 0.2, bz]}>
            <boxGeometry args={[0.4, 0.4, 0.08]} />
            <meshStandardMaterial color="#6b4423" />
          </mesh>
        ))}
        <Person position={[1.65, 0, -0.8]} shirt={C.blue} rotation={-Math.PI / 2} />
        <Person position={[1.65, 0, 0.6]} shirt={C.orange} rotation={-Math.PI / 2} />
        <Person position={[-0.6, 1.25, -0.5]} shirt="#f1efe6" rotation={Math.PI / 2} seated={false} />
        <Board
          id="teastall"
          lines={[{ text: 'TEA STALL · ABOUT ME', size: 130 }, { text: 'চায়ের দোকান', size: 70, color: C.blue }]}
          w={3.6}
          h={1.1}
          position={[0.2, 3.7, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
      </Side>
      <Solid size={[4, 3, 4.8]} position={[-9.6, 1.5, z]} />
    </group>
  )
}

function SkillBoards() {
  const z = zoneZ('skills')
  return (
    <group>
      {skills.map((s, i) => {
        const side = i % 2 === 0 ? 1 : -1
        const bz = z + 13 - Math.floor(i / 2) * 7
        const stars = Math.round(s.level / 20)
        const colors = [
          { bg: C.yellow, fg: C.red, border: C.green },
          { bg: C.cream, fg: C.blue, border: C.pink },
          { bg: C.green, fg: C.yellow, border: C.red },
          { bg: C.pink, fg: C.cream, border: C.blue },
        ][i % 4]
        return (
          <group key={s.name} position={[side * 10, 0, bz]} rotation={[0, side > 0 ? -0.9 : 0.9, 0]}>
            <Post x={-1.2} z={0} h={3.4} r={0.09} />
            <Post x={1.2} z={0} h={3.4} r={0.09} />
            <Board
              id={'skill-' + s.name}
              lines={[
                { text: s.name, size: 140 },
                { text: '★'.repeat(stars) + '☆'.repeat(5 - stars), size: 80, color: colors.fg },
              ]}
              w={3.2}
              h={1.6}
              opts={{ ...colors, dots: C.cream, flowers: false }}
              position={[0, 3.7, 0]}
            />
            <RigidBody type="fixed" colliders={false}>
              <CuboidCollider args={[1.4, 2, 0.2]} position={[0, 2, 0]} />
            </RigidBody>
          </group>
        )
      })}
    </group>
  )
}

function Stall({ title, seed }: { title: string; seed: number }) {
  const awning = stripeTexture('awning' + (seed % 3), [[C.red, C.cream], [C.green, C.yellow], [C.blue, C.cream]][seed % 3])
  const goods = useMemo(() => {
    const out: { p: [number, number, number]; c: string; round: boolean }[] = []
    for (let i = 0; i < 10; i++) {
      out.push({
        p: [-0.2 + (i % 2) * 0.4, 1.2, -1.2 + Math.floor(i / 2) * 0.6],
        c: [C.orange, C.red, C.yellow, C.green, C.pink][(i + seed) % 5],
        round: (i + seed) % 3 !== 0,
      })
    }
    return out
  }, [seed])
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1, 3.2]} />
        <meshStandardMaterial color="#8a5a32" />
      </mesh>
      {goods.map((g, i) => (
        <mesh key={i} position={g.p} castShadow>
          {g.round ? <sphereGeometry args={[0.16, 10, 8]} /> : <boxGeometry args={[0.3, 0.25, 0.3]} />}
          <meshStandardMaterial color={g.c} />
        </mesh>
      ))}
      {[-1.5, 1.5].map((pz) => (
        <group key={pz}>
          <Post x={0.6} z={pz} h={2.6} r={0.05} />
          <Post x={-0.6} z={pz} h={2.9} r={0.05} />
        </group>
      ))}
      <mesh position={[0.4, 2.7, 0]} rotation={[0, 0, -0.35]} castShadow>
        <boxGeometry args={[2.2, 0.05, 3.4]} />
        <meshStandardMaterial map={awning} />
      </mesh>
      <Board
        id={'proj-' + title}
        lines={[{ text: title, size: 120 }, { text: 'PROJECT', size: 70, color: C.green }]}
        w={3}
        h={0.9}
        position={[-0.5, 3.4, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <Person position={[-0.3, 0, 1.0]} shirt={[C.teal, C.purple, C.orange][seed % 3]} rotation={Math.PI / 2} seated={false} />
    </group>
  )
}

function Bazaar() {
  const z = zoneZ('projects')
  return (
    <group>
      {projects.map((p, i) => {
        const side = i % 2 === 0 ? -1 : 1
        const pz = z + 11 - Math.floor(i / 2) * 8 - (side > 0 ? 3 : 0)
        return (
          <group key={p.title}>
            <Side side={side} z={pz}>
              <Stall title={p.title} seed={i} />
            </Side>
            <Solid size={[2.4, 3, 3.6]} position={[side * 10, 1.5, pz]} />
          </group>
        )
      })}
    </group>
  )
}

function ShaheedMinar() {
  const frames = [
    { z: -3.4, h: 3.4 },
    { z: -1.8, h: 4.4 },
    { z: 0, h: 6.2, bent: true },
    { z: 1.8, h: 4.4 },
    { z: 3.4, h: 3.4 },
  ]
  const white = <meshStandardMaterial color="#f4f4f0" roughness={0.6} />
  return (
    <group>
      <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
        <boxGeometry args={[3, 0.5, 9.5]} />
        <meshStandardMaterial color="#d9d4c7" />
      </mesh>
      <mesh position={[-1.1, 3.4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[2.5, 40]} />
        <meshStandardMaterial color="#d2232a" side={THREE.DoubleSide} />
      </mesh>
      {frames.map((f) => {
        const half = f.z === 0 ? 0.7 : 0.45
        const straight = f.bent ? f.h * 0.72 : f.h
        return (
          <group key={f.z} position={[0, 0.5, f.z]} rotation={[0, f.z === 0 ? 0 : -Math.sign(f.z) * 0.25, 0]}>
            {[-half, half].map((dz) => (
              <mesh key={dz} position={[0, straight / 2, dz]} castShadow>
                <boxGeometry args={[0.18, straight, 0.18]} />
                {white}
              </mesh>
            ))}
            {[0.25, 0.5, 0.75].map((t) => (
              <mesh key={t} position={[0, straight * t, 0]}>
                <boxGeometry args={[0.1, 0.06, half * 2]} />
                {white}
              </mesh>
            ))}
            {f.bent ? (
              <group position={[0, straight, 0]} rotation={[0, 0, 0.55]}>
                {[-half, half].map((dz) => (
                  <mesh key={dz} position={[0, f.h * 0.15, dz]} castShadow>
                    <boxGeometry args={[0.18, f.h * 0.3, 0.18]} />
                    {white}
                  </mesh>
                ))}
                <mesh position={[0, f.h * 0.3, 0]}>
                  <boxGeometry args={[0.18, 0.18, half * 2 + 0.18]} />
                  {white}
                </mesh>
              </group>
            ) : (
              <mesh position={[0, straight, 0]}>
                <boxGeometry args={[0.18, 0.18, half * 2 + 0.18]} />
                {white}
              </mesh>
            )}
          </group>
        )
      })}
      {/* flowers laid at the base */}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[1.2, 0.6, -3 + i * 0.45]}>
          <icosahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color={[C.red, C.yellow, C.orange][i % 3]} />
        </mesh>
      ))}
    </group>
  )
}

function Milestones() {
  const z = zoneZ('experience')
  return (
    <group>
      <Side side={-1} z={z - 2}>
        <ShaheedMinar />
      </Side>
      <Solid size={[3, 7, 9.5]} position={[-10, 3.5, z - 2]} />
      {experience.map((e, i) => {
        const mz = z + 10 - i * 7
        return (
          <group key={e.period} position={[9.2, 0, mz]} rotation={[0, -0.9, 0]}>
            {/* Bangladeshi road milestone: white stone with yellow cap */}
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.6, 1, 0.3]} />
              <meshStandardMaterial color="#f4f4f0" />
            </mesh>
            <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.3, 0.3, 16, 1, false, -Math.PI / 2, Math.PI]} />
              <meshStandardMaterial color={C.yellow} />
            </mesh>
            <Post x={0} z={-0.3} h={3.2} r={0.06} />
            <Board
              id={'exp-' + i}
              lines={[
                { text: e.period, size: 90, color: C.blue },
                { text: e.company, size: 110 },
                { text: e.role.en, size: 70, color: C.green },
              ]}
              w={2.8}
              h={1.4}
              opts={{ bg: C.cream, border: C.blue, flowers: false }}
              position={[0, 3.4, -0.25]}
            />
            <RigidBody type="fixed" colliders={false}>
              <CuboidCollider args={[0.4, 1, 0.3]} position={[0, 1, 0]} />
            </RigidBody>
          </group>
        )
      })}
    </group>
  )
}

function University() {
  const z = zoneZ('education')
  const e = education[0]
  return (
    <group>
      <Side side={-1} z={z}>
        <mesh position={[-1.6, 2.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 5.2, 9]} />
          <meshStandardMaterial color="#e3b97a" roughness={0.9} />
        </mesh>
        {/* steps and a white portico */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0.9 - i * 0.3, 0.1 + i * 0.2, 0]} receiveShadow>
            <boxGeometry args={[0.6, 0.2, 5]} />
            <meshStandardMaterial color="#d9d4c7" />
          </mesh>
        ))}
        {[-2, -0.7, 0.7, 2].map((cz) => (
          <mesh key={cz} position={[0.4, 2.3, cz]} castShadow>
            <cylinderGeometry args={[0.2, 0.22, 3.8, 12]} />
            <meshStandardMaterial color="#f4f4f0" />
          </mesh>
        ))}
        <mesh position={[0, 4.4, 0]} castShadow>
          <boxGeometry args={[1.4, 0.5, 5.4]} />
          <meshStandardMaterial color="#f4f4f0" />
        </mesh>
        {[-3.4, 3.4].map((wz) => (
          <mesh key={wz} position={[0.02, 2.6, wz]}>
            <boxGeometry args={[0.06, 1.4, 1]} />
            <meshStandardMaterial color="#f4e6c4" emissive="#ffcf73" emissiveIntensity={0.15} />
          </mesh>
        ))}
        <Board
          id="university"
          lines={[
            { text: 'UNIVERSITY', size: 130 },
            { text: e.degree.en.toUpperCase(), size: 56, color: C.green },
            { text: e.institution + ' · ' + e.period, size: 50, color: C.blue },
          ]}
          w={5}
          h={1.5}
          opts={{ bg: C.cream, fg: C.red, border: C.green, dots: C.yellow }}
          position={[0.75, 5.5, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
      </Side>
      <Solid size={[4.4, 5.2, 9.2]} position={[-11, 2.6, z]} />
    </group>
  )
}

function PostOffice() {
  const z = zoneZ('contact')
  return (
    <group>
      <Side side={1} z={z}>
        <mesh position={[-1.2, 2.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 4.4, 8]} />
          <meshStandardMaterial color="#b5432f" roughness={0.9} />
        </mesh>
        <mesh position={[0.45, 1.2, 0]}>
          <boxGeometry args={[0.1, 2.4, 1.6]} />
          <meshStandardMaterial color="#3b2a1a" />
        </mesh>
        {[-2.6, 2.6].map((wz) => (
          <mesh key={wz} position={[0.42, 2.4, wz]}>
            <boxGeometry args={[0.06, 1.2, 1.2]} />
            <meshStandardMaterial color="#f4e6c4" emissive="#ffcf73" emissiveIntensity={0.15} />
          </mesh>
        ))}
        <Board
          id="postoffice"
          lines={[{ text: 'POST OFFICE · CONTACT', size: 150 }, { text: 'ডাকঘর', size: 70, color: C.cream }]}
          w={5}
          h={1.3}
          opts={{ bg: C.red, fg: C.yellow, border: C.yellow, dots: C.red }}
          position={[0.5, 3.8, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
        {/* red post box */}
        <group position={[2.2, 0, 4.6]}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.35, 0.35, 1.4, 16]} />
            <meshStandardMaterial color="#d2232a" />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <sphereGeometry args={[0.36, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#d2232a" />
          </mesh>
          <mesh position={[0.34, 1.05, 0]}>
            <boxGeometry args={[0.04, 0.06, 0.3]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      </Side>
      <Solid size={[3.4, 4.4, 8.2]} position={[11.2, 2.2, z]} />
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[0.8, 0.4]} position={[7.8, 0.8, z - 4.6]} />
      </RigidBody>
    </group>
  )
}

export function Landmarks() {
  return (
    <group>
      {ZONES.map((z) => (
        <ZoneGate key={z.id} id={z.id} />
      ))}
      <RickshawStand />
      <TeaStall />
      <SkillBoards />
      <Bazaar />
      <Milestones />
      <University />
      <PostOffice />
      <Sadarghat />
    </group>
  )
}
