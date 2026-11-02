import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sky, Stars } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import * as THREE from 'three'
import { Street } from './world/Street'
import { Landmarks } from './world/Landmarks'
import { Roundabouts } from './world/Roundabouts'
import { Player } from './Rickshaw'
import { Traffic } from './Traffic'
import { Collectibles } from './Collectibles'
import { Rain } from './Rain'
import { CameraRig } from './CameraRig'
import { player } from './state'
import { useGame } from '../store/useGame'

// Phones get a smaller shadow map; it is the most expensive part of the frame on mobile GPUs.
const SHADOW_SIZE = window.matchMedia('(pointer: coarse)').matches ? 1024 : 2048

function Lights() {
  const night = useGame((s) => s.night)
  const rain = useGame((s) => s.rain)
  const sun = useRef<THREE.DirectionalLight>(null)
  useFrame(() => {
    const l = sun.current
    if (!l) return
    l.position.set(player.pos.x + 18, 30, player.pos.z + 12)
    l.target.position.set(player.pos.x, 0, player.pos.z - 6)
    l.target.updateMatrixWorld()
  })
  const sunIntensity = night ? 0.8 : rain ? 0.9 : 2.4
  return (
    <>
      <hemisphereLight args={[night ? '#3b4a7a' : '#dbeeff', night ? '#1a1a22' : '#8a7a5a', night ? 1.0 : rain ? 0.8 : 1.1]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={sunIntensity}
        color={night ? '#9fb4ff' : '#fff1d6'}
        shadow-mapSize={[SHADOW_SIZE, SHADOW_SIZE]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
      />
    </>
  )
}

function Atmosphere() {
  const night = useGame((s) => s.night)
  const rain = useGame((s) => s.rain)
  const color = night ? '#0a1230' : rain ? '#7f8b96' : '#cfe3ef'
  return (
    <>
      <color attach="background" args={[color]} />
      <fog attach="fog" args={[color, rain ? 25 : 45, rain ? 110 : 170]} />
      {!night && !rain && <Sky distance={4000} sunPosition={[120, 45, 60]} turbidity={7} rayleigh={1.2} />}
      {night && (
        <>
          <Stars radius={200} depth={40} count={2500} factor={5} fade />
          <mesh position={[60, 80, -260]}>
            <sphereGeometry args={[6, 24, 16]} />
            <meshBasicMaterial color="#fff6d8" fog={false} />
          </mesh>
        </>
      )}
    </>
  )
}

function Ready() {
  const setReady = useGame((s) => s.setReady)
  useEffect(() => setReady(true), [setReady])
  return null
}

export function Experience() {
  const rain = useGame((s) => s.rain)
  return (
    <>
      <Atmosphere />
      <Lights />
      <Physics gravity={[0, -20, 0]}>
        <Street />
        <Landmarks />
        <Roundabouts />
        <Traffic />
        <Player />
        <Ready />
      </Physics>
      <Collectibles />
      {rain && <Rain />}
      <CameraRig />
    </>
  )
}
