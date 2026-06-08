import React, { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, Html, useGLTF } from '@react-three/drei'

function Model({ url }){
  const { scene } = useGLTF(url, true)
  return <primitive object={scene} />
}

export default function ModelViewer({ modelUrl }){
  const [showFullscreen, setShowFullscreen] = useState(false)

  if(!modelUrl) return <div className="flex items-center justify-center h-full opacity-60">No model available</div>

  const isSketchfabEmbed = typeof modelUrl === 'string' && modelUrl.includes('sketchfab.com')

  if (isSketchfabEmbed) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[inherit] bg-black/35">
        <iframe
          title="Sketchfab 3D model"
          src={modelUrl}
          className="h-full w-full"
          allow="autoplay; fullscreen; xr-spatial-tracking; accelerometer; gyroscope; magnetometer"
          allowFullScreen
          loading="lazy"
        />
        <button
          type="button"
          onClick={() => setShowFullscreen(true)}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/75 backdrop-blur-md transition hover:bg-black/75"
        >
          Fullscreen
        </button>

        {showFullscreen ? (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-2xl">
            <div className="relative h-[88vh] w-[min(96vw,1200px)] overflow-hidden rounded-[1.35rem] border border-white/10 bg-black shadow-[0_0_80px_rgba(0,0,0,0.5)]">
              <button
                type="button"
                onClick={() => setShowFullscreen(false)}
                className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/75 backdrop-blur-md transition hover:bg-black/75"
              >
                Close
              </button>
              <iframe
                title="Sketchfab 3D model fullscreen"
                src={modelUrl}
                className="h-full w-full"
                allow="autoplay; fullscreen; xr-spatial-tracking; accelerometer; gyroscope; magnetometer"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <Canvas camera={{ position: [0, 0, 3] }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10,10,5]} intensity={1} />
      <Suspense fallback={<Html>Loading model...</Html>}>
        <Stage environment="city" intensity={0.6} contactShadow={true} preset="soft">
          <Model url={modelUrl} />
        </Stage>
      </Suspense>
      <OrbitControls enablePan={false} />
    </Canvas>
  )
}
