import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { player } from './state'

const COUNT = 3000
const BOX = { x: 50, y: 25, z: 60 }

export function Rain() {
  const lines = useRef<THREE.LineSegments>(null)
  const { geometry, drops } = useMemo(() => {
    const drops = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      drops[i * 3] = (Math.random() - 0.5) * BOX.x
      drops[i * 3 + 1] = Math.random() * BOX.y
      drops[i * 3 + 2] = (Math.random() - 0.5) * BOX.z
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 6), 3))
    return { geometry, drops }
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const pos = geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    for (let i = 0; i < COUNT; i++) {
      let y = drops[i * 3 + 1] - dt * 22
      if (y < 0) y += BOX.y
      drops[i * 3 + 1] = y
      const x = drops[i * 3]
      const z = drops[i * 3 + 2]
      arr.set([x, y, z, x + 0.05, y + 0.55, z], i * 6)
    }
    pos.needsUpdate = true
    lines.current?.position.set(player.pos.x, 0, player.pos.z - 10)
  })

  return (
    <lineSegments ref={lines} geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial color="#cfe3f5" transparent opacity={0.45} />
    </lineSegments>
  )
}
