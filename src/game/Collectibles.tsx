import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { player } from './state'
import { rng } from './textures'
import { ZONES } from './zones'
import { useGame } from '../store/useGame'
import { chime, pop } from '../audio/sound'
import { funFact } from '../content/content'

export const FUCHKA_COUNT = 12

export function Collectibles() {
  const collected = useGame((s) => s.collected)
  const spots = useMemo(() => {
    const r = rng(2024)
    const out: { x: number; z: number }[] = []
    for (let i = 0; i < FUCHKA_COUNT; i++) {
      let z = -12 - i * 19.5 - r() * 6
      if (ZONES.some((zone) => Math.abs(zone.z - z) < 5)) z -= 8
      out.push({ x: (r() - 0.5) * 8, z })
    }
    return out
  }, [])
  const group = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const g = useGame.getState()
    group.current?.children.forEach((child, i) => {
      child.rotation.y = clock.elapsedTime * 1.5 + i
      child.position.y = 1 + Math.sin(clock.elapsedTime * 2 + i) * 0.15
      if (g.phase !== 'ride' || g.collected.includes(i)) return
      const s = spots[i]
      if (Math.hypot(player.pos.x - s.x, player.pos.z - s.z) < 1.9) {
        g.collect(i)
        if (g.collected.length + 1 === FUCHKA_COUNT) {
          chime()
          g.showToast(funFact[g.lang])
        } else pop()
      }
    })
  })

  return (
    <group ref={group}>
      {spots.map((s, i) => (
        <group key={i} position={[s.x, 1, s.z]} visible={!collected.includes(i)}>
          <mesh scale={[1, 0.82, 1]} castShadow>
            <sphereGeometry args={[0.32, 16, 12]} />
            <meshStandardMaterial color="#d9a441" roughness={0.6} emissive="#5a3a00" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.12, 12]} />
            <meshStandardMaterial color="#5b3a1e" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
            <ringGeometry args={[0.5, 0.65, 24]} />
            <meshBasicMaterial color="#ffc83d" transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
