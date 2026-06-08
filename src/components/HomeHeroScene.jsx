import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Line, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

function ParticleField(){
  const pointsRef = useRef()

  const positions = useMemo(()=>{
    const count = 260
    const array = new Float32Array(count * 3)

    for(let index = 0; index < count; index += 1){
      const radius = 4.6 + Math.random() * 5.2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      array[index * 3] = radius * Math.sin(phi) * Math.cos(theta)
      array[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      array[index * 3 + 2] = radius * Math.cos(phi)
    }

    return array
  }, [])

  useFrame(({ clock, pointer })=>{
    if(!pointsRef.current) return
    const elapsed = clock.getElapsedTime()
    pointsRef.current.rotation.y = elapsed * 0.015 + pointer.x * 0.08
    pointsRef.current.rotation.x = elapsed * 0.008 + pointer.y * 0.05
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.016} sizeAttenuation transparent opacity={0.5} />
    </points>
  )
}

function AbstractObject(){
  const groupRef = useRef()
  const ringRef = useRef()
  const neuralRef = useRef()

  const orbitPoints = useMemo(()=>{
    return new Array(96).fill(0).map((_, index)=>{
      const angle = (index / 96) * Math.PI * 2
      return new THREE.Vector3(Math.cos(angle) * 2.25, Math.sin(angle) * 2.25, Math.sin(angle * 3) * 0.42)
    })
  }, [])

  const neuralPoints = useMemo(()=>{
    return new Array(16).fill(0).map((_, index)=>{
      const angle = (index / 16) * Math.PI * 2
      return new THREE.Vector3(Math.cos(angle) * 1.1, Math.sin(angle) * 0.85, Math.sin(angle * 2) * 0.55)
    })
  }, [])

  useFrame(({ clock, pointer })=>{
    if(!groupRef.current || !ringRef.current || !neuralRef.current) return
    const elapsed = clock.getElapsedTime()
    groupRef.current.rotation.y = elapsed * 0.1 + pointer.x * 0.18
    groupRef.current.rotation.x = elapsed * 0.05 + pointer.y * 0.12
    ringRef.current.rotation.z = -elapsed * 0.055
    neuralRef.current.rotation.y = elapsed * 0.04
  })

  return (
    <group ref={groupRef}>
      <Float speed={0.55} rotationIntensity={0.08} floatIntensity={0.16}>
        <mesh>
          <icosahedronGeometry args={[2.0, 3]} />
          <MeshDistortMaterial color="#f0f0f0" roughness={0.34} metalness={0.08} distort={0.05} speed={0.55} wireframe={false} />
        </mesh>
      </Float>

      <mesh>
        <sphereGeometry args={[2.85, 36, 36]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.11} />
      </mesh>

      <mesh ref={ringRef} rotation={[0.9, 0.2, 0]}>
        <torusGeometry args={[3.35, 0.018, 8, 160]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.14} />
      </mesh>

      <Line points={orbitPoints} color="#ffffff" lineWidth={1} transparent opacity={0.16} />

      <group ref={neuralRef}>
        <Line points={neuralPoints} color="#ffffff" lineWidth={1} transparent opacity={0.12} />
      </group>
    </group>
  )
}

export default function HomeHeroScene(){
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#040404]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.04),transparent_22%),radial-gradient(circle_at_70%_78%,rgba(255,255,255,0.03),transparent_20%)] blur-2xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.012),transparent_64%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,4,0.12),rgba(4,4,4,0.44)_68%,rgba(4,4,4,0.82))]" />

      <Canvas camera={{ position: [0, 0, 8], fov: 31 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={['#040404']} />
        <fog attach="fog" args={['#040404', 6, 18]} />
        <ambientLight intensity={0.48} />
        <directionalLight position={[4, 6, 8]} intensity={1.35} color="#ffffff" />
        <pointLight position={[-4, -2, 7]} intensity={1.05} color="#ffffff" />
        <ParticleField />
        <AbstractObject />
      </Canvas>

    </div>
  )
}