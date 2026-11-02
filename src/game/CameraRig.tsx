import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { player } from './state'
import { useGame } from '../store/useGame'

const target = new THREE.Vector3()
const look = new THREE.Vector3()

export function CameraRig() {
  const lookCur = useRef(new THREE.Vector3(0, 1, 0))
  const { camera, size } = useThree()
  const portrait = size.width < size.height

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.fov = portrait ? 68 : 50
    cam.updateProjectionMatrix()
  }, [camera, portrait])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const { pos, yaw, speed } = player
    if (useGame.getState().phase === 'intro') {
      const t = state.clock.elapsedTime * 0.12
      target.set(pos.x + Math.sin(t) * 8, 3.2, pos.z + Math.cos(t) * 8)
      look.set(pos.x, 1.3, pos.z)
    } else {
      const d = 8 + Math.abs(speed) * 0.18
      target.set(pos.x + Math.sin(yaw) * d, 4.2 + Math.abs(speed) * 0.04, pos.z + Math.cos(yaw) * d)
      // In portrait the content panel covers the upper half, so aim higher to keep the rickshaw low on screen.
      const ahead = portrait ? 9 : 5
      look.set(pos.x - Math.sin(yaw) * ahead, portrait ? 2.6 : 1.5, pos.z - Math.cos(yaw) * ahead)
    }
    camera.position.lerp(target, 1 - Math.exp(-dt * 3.5))
    lookCur.current.lerp(look, 1 - Math.exp(-dt * 6))
    camera.lookAt(lookCur.current)
  })
  return null
}
