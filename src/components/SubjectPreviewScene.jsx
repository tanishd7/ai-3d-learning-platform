import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Line } from '@react-three/drei'
import * as THREE from 'three'

function PreviewCore(){
  const coreRef = useRef()
  const ringRef = useRef()

  const orbitPoints = useMemo(()=>{
    return new Array(48).fill(0).map((_, index)=>{
      const angle = (index / 48) * Math.PI * 2
      return new THREE.Vector3(Math.cos(angle) * 1.1, Math.sin(angle) * 1.1, Math.sin(angle * 2) * 0.18)
    })
  }, [])

  useFrame(({ clock, pointer })=>{
    const elapsed = clock.getElapsedTime()
    if(coreRef.current){
      coreRef.current.rotation.y = elapsed * 0.34 + pointer.x * 0.2
      coreRef.current.rotation.x = elapsed * 0.14 + pointer.y * 0.16
    }
    if(ringRef.current){
      ringRef.current.rotation.z = elapsed * 0.18
    }
  })

  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.35}>
        <mesh ref={coreRef}>
          <octahedronGeometry args={[0.95, 1]} />
          <meshStandardMaterial color="#efefef" roughness={0.34} metalness={0.08} />
        </mesh>
      </Float>

      <mesh>
        <sphereGeometry args={[1.38, 24, 24]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.14} />
      </mesh>

      <mesh ref={ringRef} rotation={[0.7, 0.1, 0]}>
        <torusGeometry args={[1.75, 0.02, 8, 96]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
      </mesh>

      <Line points={orbitPoints} color="#ffffff" lineWidth={1} transparent opacity={0.22} />
    </group>
  )
}

export default function SubjectPreviewScene(){
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[1.2rem] bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.1),transparent_32%),linear-gradient(180deg,#080808_0%,#030303_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.035)_18%,transparent_34%,transparent_66%,rgba(255,255,255,0.02)_82%,transparent_100%)] opacity-60" />
      <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/55">
        <span>Live preview</span>
        <span>3D</span>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(255,255,255,0.08),transparent_18%)]" />
      <Canvas camera={{ position: [0, 0, 4.8], fov: 34 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 4, 10]} />
        <ambientLight intensity={1.35} />
        <directionalLight position={[4, 5, 5]} intensity={2.1} color="#ffffff" />
        <directionalLight position={[-3, -1, 4]} intensity={0.7} color="#ffffff" />
        <pointLight position={[0, 0, 5]} intensity={1.7} color="#ffffff" />
        <PreviewCore />
      </Canvas>
    </div>
  )
}