import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { C, flagTexture, launchDeckGlowTexture, launchDeckTexture, launchHullTexture, signTexture } from '../textures'
import { ROAD } from '../zones'
import { player } from '../state'
import { useGame } from '../../store/useGame'
import { launchHorn } from '../../audio/sound'

// Sadarghat, Dhaka's river port on the Buriganga: floating pontoons along the bank, multi-deck
// passenger launches moored bow-in side by side, and more launches and wooden boats out on the river.

const BANK = ROAD.riverZ
const PONTOON = { z: BANK - 9, depth: 6, length: 24, xs: [-28, 0, 28] }
const WATER_Y = -0.15

interface LaunchSpec {
  name: { en: string; bn: string }
  route: string
  a: string
  b: string
  decks: number
  roof: string
}

const LAUNCHES: LaunchSpec[] = [
  { name: { en: 'Sundarban-10', bn: 'সুন্দরবন-১০' }, route: 'ঢাকা ⇄ বরিশাল', a: C.red, b: C.green, decks: 3, roof: '#9fd3e6' },
  { name: { en: 'Padma Rani', bn: 'পদ্মা রানী' }, route: 'ঢাকা ⇄ চাঁদপুর', a: C.blue, b: C.yellow, decks: 3, roof: '#f2e3b3' },
  { name: { en: 'Meghna Express', bn: 'মেঘনা এক্সপ্রেস' }, route: 'ঢাকা ⇄ ভোলা', a: C.green, b: C.red, decks: 2, roof: '#bfe0c6' },
  { name: { en: 'Kirtonkhola-2', bn: 'কীর্তনখোলা-২' }, route: 'ঢাকা ⇄ বরিশাল', a: C.purple, b: C.orange, decks: 3, roof: '#e6d3f2' },
  { name: { en: 'Shapla-7', bn: 'শাপলা-৭' }, route: 'ঢাকা ⇄ পটুয়াখালী', a: C.pink, b: C.teal, decks: 2, roof: '#f6cfe0' },
  { name: { en: 'Jamuna Pari', bn: 'যমুনা পরী' }, route: 'ঢাকা ⇄ হাতিয়া', a: C.teal, b: C.red, decks: 3, roof: '#cde9ea' },
  { name: { en: 'Barishal Queen', bn: 'বরিশাল কুইন' }, route: 'ঢাকা ⇄ বরিশাল', a: C.orange, b: C.blue, decks: 3, roof: '#f8dcb8' },
  { name: { en: 'Surma-4', bn: 'সুরমা-৪' }, route: 'ঢাকা ⇄ বরগুনা', a: C.green, b: C.yellow, decks: 2, roof: '#d4ecc0' },
  { name: { en: 'Karnaphuli', bn: 'কর্ণফুলী' }, route: 'ঢাকা ⇄ ঝালকাঠি', a: C.red, b: C.blue, decks: 3, roof: '#f2c9c9' },
]

const HULL = { length: 22, width: 6.4, height: 2.4, bow: 5 }
const DECK_H = 2

const bowGeometry = (() => {
  const s = new THREE.Shape()
  s.moveTo(0, -HULL.width / 2)
  s.lineTo(HULL.bow, 0)
  s.lineTo(0, HULL.width / 2)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: HULL.height, bevelEnabled: false })
  g.rotateX(-Math.PI / 2)
  return g
})()

/** A V of churned water spreading out behind the stern. */
const wakeGeometry = (() => {
  const s = new THREE.Shape()
  s.moveTo(0, -HULL.width / 2)
  s.lineTo(-20, -HULL.width * 1.6)
  s.lineTo(-20, HULL.width * 1.6)
  s.lineTo(0, HULL.width / 2)
  s.closePath()
  const g = new THREE.ShapeGeometry(s)
  g.rotateX(-Math.PI / 2)
  return g
})()

/** A Bangladeshi river launch: white hull, two or three stacked passenger decks, wheelhouse on top. Bow is +x. */
function LaunchModel({ spec }: { spec: LaunchSpec }) {
  const night = useGame((s) => s.night)
  const { hull, deck, plain, roof } = useMemo(() => {
    const white = new THREE.MeshStandardMaterial({ color: '#fbfaf6', roughness: 0.6 })
    const hullSide = new THREE.MeshStandardMaterial({ map: launchHullTexture(spec.name, spec.route, spec.a, spec.b), roughness: 0.6 })
    const deckSide = new THREE.MeshStandardMaterial({
      map: launchDeckTexture(spec.a, spec.b),
      emissiveMap: launchDeckGlowTexture(),
      emissive: new THREE.Color('#ffffff'),
      roughness: 0.7,
    })
    const roofMat = new THREE.MeshStandardMaterial({ color: spec.roof, roughness: 0.8 })
    return {
      hull: [white, white, white, white, hullSide, hullSide],
      deck: [white, white, roofMat, white, deckSide, deckSide],
      plain: white,
      roof: roofMat,
    }
  }, [spec])
  deck[4].emissiveIntensity = night ? 1.1 : 0
  const nameTex = signTexture('launch:' + spec.name.en, [
    { text: spec.name.bn, size: 130 },
    { text: 'M.V. ' + spec.name.en.toUpperCase(), size: 70, color: C.ink },
  ], { w: 1024, h: 256, bg: C.cream, fg: spec.a, border: spec.a, dots: spec.b, flowers: false })

  const decks = Array.from({ length: spec.decks }, (_, i) => {
    const len = HULL.length - 2 - i * 3
    return { i, len, x: -1 - i * 1.5, y: HULL.height - 0.7 + 0.18 + i * (DECK_H + 0.18) + DECK_H / 2, w: HULL.width - 0.4 - i * 0.2 }
  })
  const top = decks[decks.length - 1]
  const topY = top.y + DECK_H / 2 + 0.18
  const whX = top.x + top.len / 2 - 2

  return (
    <group>
      <mesh position={[0, HULL.height / 2 - 0.7, 0]} material={hull} castShadow receiveShadow>
        <boxGeometry args={[HULL.length, HULL.height, HULL.width]} />
      </mesh>
      <mesh geometry={bowGeometry} material={plain} position={[HULL.length / 2, -0.7, 0]} castShadow />
      {/* bow rail */}
      <mesh position={[HULL.length / 2 + 1.2, HULL.height - 0.3, 0]}>
        <boxGeometry args={[0.12, 0.6, HULL.width * 0.75]} />
        <meshStandardMaterial color={spec.a} />
      </mesh>
      {decks.map((d) => (
        <group key={d.i}>
          <mesh position={[d.x, d.y - DECK_H / 2 - 0.09, 0]}>
            <boxGeometry args={[d.len + 0.6, 0.18, d.w + 0.5]} />
            <meshStandardMaterial color={d.i % 2 ? spec.b : spec.a} />
          </mesh>
          <mesh position={[d.x, d.y, 0]} material={deck} castShadow>
            <boxGeometry args={[d.len, DECK_H, d.w]} />
          </mesh>
          {d.i === 0 &&
            [-1, 1].flatMap((side) =>
              [-4, 4].map((bx) => (
                <mesh key={`${side}:${bx}`} position={[d.x + bx, d.y + 0.2, side * (d.w / 2 + 0.05)]}>
                  <torusGeometry args={[0.3, 0.08, 6, 14]} />
                  <meshStandardMaterial color={C.orange} />
                </mesh>
              )),
            )}
        </group>
      ))}
      <mesh position={[top.x, topY, 0]}>
        <boxGeometry args={[top.len + 0.6, 0.18, top.w + 0.5]} />
        <meshStandardMaterial color={spec.b} />
      </mesh>
      {/* wheelhouse */}
      <group position={[whX, topY + 0.8, 0]}>
        <mesh material={roof} castShadow>
          <boxGeometry args={[3, 1.4, 3.6]} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[3.05, 0.5, 3.65]} />
          <meshStandardMaterial color="#1f4a5e" emissive="#ffd98a" emissiveIntensity={night ? 0.8 : 0} />
        </mesh>
        <mesh position={[1.56, 1.35, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4.4, 1.1]} />
          <meshStandardMaterial map={nameTex} emissiveMap={nameTex} emissive="#ffffff" emissiveIntensity={night ? 0.6 : 0} />
        </mesh>
        <mesh position={[1.3, 0.85, 0]}>
          <sphereGeometry args={[0.18, 10, 8]} />
          <meshStandardMaterial color="#fff6d0" emissive="#fff1b0" emissiveIntensity={night ? 3 : 0.3} />
        </mesh>
        <mesh position={[-0.5, 1.9, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 2.4, 6]} />
          <meshStandardMaterial color="#d9dde2" />
        </mesh>
        <mesh position={[-0.5 + 0.62, 2.75, 0]}>
          <planeGeometry args={[1.2, 0.72]} />
          <meshStandardMaterial map={flagTexture()} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* funnel */}
      <group position={[whX - 4, topY + 0.8, 0]}>
        <mesh>
          <cylinderGeometry args={[0.38, 0.42, 1.6, 12]} />
          <meshStandardMaterial color={spec.a} />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.2, 12]} />
          <meshStandardMaterial color="#1d1a2f" />
        </mesh>
      </group>
    </group>
  )
}

/** Moored launches bob gently and sway a little against their neighbours. */
function DockedLaunch({ spec, x, phase }: { spec: LaunchSpec; x: number; phase: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime + phase
    g.position.y = WATER_Y + Math.sin(t * 0.9) * 0.07
    g.rotation.x = Math.sin(t * 0.7) * 0.012
  })
  const z = PONTOON.z - PONTOON.depth / 2 - HULL.length / 2 - HULL.bow + 0.6
  return (
    <group ref={ref} position={[x, WATER_Y, z]} rotation={[0, -Math.PI / 2, 0]}>
      <LaunchModel spec={spec} />
    </group>
  )
}

/** A launch out on the river, steaming across and coming round again. */
function SailingLaunch({ spec, z, dir, speed, offset }: { spec: LaunchSpec; z: number; dir: 1 | -1; speed: number; offset: number }) {
  const ref = useRef<THREE.Group>(null)
  const span = 340
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime
    const s = (((t * speed + offset) % span) + span) % span
    g.position.x = dir * (s - span / 2)
    g.position.y = WATER_Y + Math.sin(t * 1.1 + offset) * 0.1
    g.rotation.z = Math.sin(t * 0.8 + offset) * 0.015
  })
  return (
    <group ref={ref} position={[0, WATER_Y, z]} rotation={[0, dir > 0 ? 0 : Math.PI, 0]}>
      <LaunchModel spec={spec} />
      {/* wake */}
      <mesh geometry={wakeGeometry} position={[-HULL.length / 2, 0.08, 0]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** A wooden country boat with a bamboo hood, rowed from the stern. */
function Nouka({ start, dir, speed, color, z, moored = false }: { start: number; dir: 1 | -1; speed: number; color: string; z: number; moored?: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const oar = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime
    g.position.y = WATER_Y + Math.sin(t * 1.6 + start) * 0.06
    g.rotation.z = Math.sin(t * 1.3 + start) * 0.04
    if (moored) return
    const span = 160
    const s = (((start + t * speed) % span) + span) % span
    g.position.x = dir * (s - span / 2)
    if (oar.current) oar.current.rotation.z = -0.5 + Math.sin(t * 2.2) * 0.35
  })
  return (
    <group ref={ref} position={[start, WATER_Y, z]} rotation={[0, dir > 0 ? 0 : Math.PI, 0]}>
      <mesh scale={[2.6, 0.7, 0.75]} position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[1, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#6b4423" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.5, 0.72, 1]}>
        <circleGeometry args={[1, 18]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.1, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.6, 0.6, 1.8, 12, 1, true, 0, Math.PI]} />
        <meshStandardMaterial color="#c8a45e" side={THREE.DoubleSide} roughness={1} />
      </mesh>
      {!moored && (
        <group position={[-1.9, 0.5, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.16, 0.2, 1, 8]} />
            <meshStandardMaterial color={C.blue} />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshStandardMaterial color="#8d5524" />
          </mesh>
          <group ref={oar} position={[0.1, 0.9, 0.2]}>
            <mesh position={[0, -0.8, 0]}>
              <boxGeometry args={[0.05, 1.8, 0.05]} />
              <meshStandardMaterial color="#5b3a1e" />
            </mesh>
          </group>
        </group>
      )}
    </group>
  )
}

/** Floating steel pontoon with a green tin-roofed shed, joined to the ghat steps by a gangway. */
function Pontoon({ x, n }: { x: number; n: number }) {
  const night = useGame((s) => s.night)
  const { length: L, depth: D, z } = PONTOON
  const sign = signTexture('pontoon' + n, [{ text: `পন্টুন নং ${'০১২৩৪৫৬৭৮৯'[n]}`, size: 110 }, { text: `PONTOON ${n}`, size: 70, color: C.green }], {
    w: 768,
    h: 256,
    flowers: false,
  })
  const posts = [-L / 2 + 0.6, -L / 4, 0, L / 4, L / 2 - 0.6]
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, -0.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[L, 1.2, D]} />
        <meshStandardMaterial color="#2c2f33" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.41, 0]} receiveShadow>
        <boxGeometry args={[L, 0.02, D]} />
        <meshStandardMaterial color="#8a7f6e" roughness={1} />
      </mesh>
      {/* tyre fenders */}
      {[-L / 2 + 2, -L / 6, L / 6, L / 2 - 2].map((fx) => (
        <mesh key={fx} position={[fx, 0, -D / 2 - 0.1]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.35, 0.14, 6, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      {posts.flatMap((px) =>
        [-1, 1].map((s) => (
          <mesh key={`${px}:${s}`} position={[px, 2.2, s * (D / 2 - 0.4)]} castShadow>
            <boxGeometry args={[0.18, 3.6, 0.18]} />
            <meshStandardMaterial color={C.yellow} />
          </mesh>
        )),
      )}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 4.35, s * (D / 4)]} rotation={[s * 0.22, 0, 0]} castShadow>
          <boxGeometry args={[L + 0.6, 0.1, D / 2 + 0.6]} />
          <meshStandardMaterial color="#2f7d4f" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      {/* railing on the river side, open where the launches tie up */}
      {[-L / 2 + 1, L / 2 - 1].map((rx) => (
        <mesh key={rx} position={[rx, 0.95, -D / 2 + 0.15]}>
          <boxGeometry args={[2, 0.08, 0.08]} />
          <meshStandardMaterial color={C.yellow} />
        </mesh>
      ))}
      <mesh position={[0, 3.55, D / 2 - 0.3]}>
        <planeGeometry args={[4.2, 1.4]} />
        <meshStandardMaterial map={sign} emissiveMap={sign} emissive="#ffffff" emissiveIntensity={night ? 0.5 : 0} />
      </mesh>
      {[-L / 3, L / 3].map((lx) => (
        <mesh key={lx} position={[lx, 4.05, 0]}>
          <sphereGeometry args={[0.2, 10, 8]} />
          <meshStandardMaterial color="#fff6d0" emissive="#ffcf73" emissiveIntensity={night ? 3 : 0.2} />
        </mesh>
      ))}
      {/* gangway up from the ghat steps */}
      <group position={[0, 0, D / 2 + 1.5]} rotation={[-0.12, 0, 0]}>
        <mesh position={[0, 0.2, 0]} receiveShadow>
          <boxGeometry args={[2.4, 0.14, 3.4]} />
          <meshStandardMaterial color="#6d5a45" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 1.15, 0.85, 0]}>
            <boxGeometry args={[0.08, 0.08, 3.4]} />
            <meshStandardMaterial color={C.yellow} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** BIWTA terminal building on the bank beside the ghat. */
function TerminalBuilding({ x }: { x: number }) {
  const night = useGame((s) => s.night)
  const sign = signTexture('biwta', [{ text: 'যাত্রী টার্মিনাল', size: 110 }, { text: 'BIWTA PASSENGER TERMINAL', size: 60, color: C.green }], {
    w: 1024,
    h: 240,
    flowers: false,
  })
  return (
    <group position={[x, 0, BANK + 3.6]}>
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[22, 6, 6]} />
        <meshStandardMaterial color="#f1ead8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 6.15, 0]}>
        <boxGeometry args={[22.4, 0.3, 6.4]} />
        <meshStandardMaterial color={C.green} />
      </mesh>
      {/* arched doors below, windows above, on both the river and the city side */}
      {[-1, 1].flatMap((side) =>
        Array.from({ length: 7 }, (_, i) => -9 + i * 3).flatMap((ax) => [
          <mesh key={`d${side}:${ax}`} position={[ax, 1.3, side * 3.01]} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
            <planeGeometry args={[1.8, 2.6]} />
            <meshStandardMaterial color="#3a2d22" emissive="#ffcf73" emissiveIntensity={night ? 0.6 : 0} />
          </mesh>,
          <mesh key={`w${side}:${ax}`} position={[ax, 4.3, side * 3.01]} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
            <planeGeometry args={[1.6, 1.2]} />
            <meshStandardMaterial color="#5e8fa6" emissive="#ffcf73" emissiveIntensity={night ? 0.8 : 0} />
          </mesh>,
        ]),
      )}
      <mesh position={[0, 7, 3.05]}>
        <planeGeometry args={[9, 2.1]} />
        <meshStandardMaterial map={sign} emissiveMap={sign} emissive="#ffffff" emissiveIntensity={night ? 0.5 : 0} />
      </mesh>
    </group>
  )
}

function TerminalGate() {
  const night = useGame((s) => s.night)
  const tex = signTexture(
    'sadarghat-terminal',
    [
      { text: 'সদরঘাট লঞ্চ টার্মিনাল', size: 120 },
      { text: 'SADARGHAT LAUNCH TERMINAL', size: 70, color: C.green },
      { text: 'Road ends here · turn around', size: 44, color: C.ink },
    ],
    { w: 1024, h: 330 },
  )
  const z = BANK - 1.6
  return (
    <group position={[0, 0, z]}>
      {[-5, 5].map((x) => (
        <mesh key={x} position={[x, 2.6, 0]} castShadow>
          <boxGeometry args={[0.5, 5.2, 0.5]} />
          <meshStandardMaterial color={C.green} />
        </mesh>
      ))}
      <mesh position={[0, 5.4, -0.08]}>
        <boxGeometry args={[10.6, 3.3, 0.12]} />
        <meshStandardMaterial color="#3b2a1a" />
      </mesh>
      <mesh position={[0, 5.4, 0]}>
        <planeGeometry args={[10.3, 3.3]} />
        <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={night ? 0.5 : 0} />
      </mesh>
    </group>
  )
}

/** Sounds a launch horn now and then while the rider is near the river. */
function Horns() {
  const next = useRef(4)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (t < next.current) return
    next.current = t + 14 + Math.random() * 16
    const d = player.pos.z - BANK
    if (useGame.getState().phase === 'ride' && d < 90) launchHorn(Math.min(1, 1.2 - d / 90))
  })
  return null
}

export function Sadarghat() {
  const docked = [-37, -28, -19, 19, 28, 37]
  return (
    <group>
      <TerminalGate />
      {[-40, 40].map((x) => (
        <TerminalBuilding key={x} x={x} />
      ))}
      {PONTOON.xs.map((x, i) => (
        <Pontoon key={x} x={x} n={i + 1} />
      ))}
      {docked.map((x, i) => (
        <DockedLaunch key={x} spec={LAUNCHES[i]} x={x} phase={i * 1.7} />
      ))}
      <SailingLaunch spec={LAUNCHES[6]} z={BANK - 62} dir={1} speed={4} offset={150} />
      <SailingLaunch spec={LAUNCHES[7]} z={BANK - 84} dir={-1} speed={3.2} offset={40} />
      <SailingLaunch spec={LAUNCHES[8]} z={BANK - 108} dir={1} speed={3.6} offset={260} />
      <Nouka start={10} dir={1} speed={1.6} color={C.red} z={BANK - 44} />
      <Nouka start={70} dir={-1} speed={1.3} color={C.green} z={BANK - 48} />
      <Nouka start={120} dir={1} speed={1.1} color={C.yellow} z={BANK - 52} />
      <Nouka start={0} dir={1} speed={0} color={C.blue} z={BANK - 13} moored />
      <group position={[50, 0, 0]}>
        <Nouka start={0} dir={-1} speed={0} color={C.pink} z={BANK - 12} moored />
      </group>
      <Horns />
    </group>
  )
}
