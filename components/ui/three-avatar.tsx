'use client'

import { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, OrbitControls, Environment } from '@react-three/drei'
import { cn } from '@/lib/utils'
import * as THREE from 'three'

function AvatarModel({ isHovered }: { isHovered: boolean }) {
  const group = useRef<THREE.Group>(null!)
  const { scene, animations } = useGLTF('/avatar.glb')
  const { actions, names } = useAnimations(animations, group)

  useEffect(() => {
    // Play the first animation if available (walk cycle)
    if (names.length > 0) {
      const action = actions[names[0]]
      if (action) {
        action.reset().fadeIn(0.3).play()
      }
    }
  }, [actions, names])

  // Gentle bob + hover effect
  useFrame((state) => {
    if (group.current) {
      const t = state.clock.getElapsedTime()
      group.current.position.y = Math.sin(t * 2) * 0.05
      // Scale up slightly on hover
      const targetScale = isHovered ? 1.15 : 1.0
      group.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.08
      )
    }
  })

  return (
    <group ref={group} dispose={null}>
      <primitive
        object={scene}
        scale={1.8}
        position={[0, -0.1, 0]}
        rotation={[0, Math.PI * 0.1, 0]}
      />
    </group>
  )
}

useGLTF.preload('/avatar.glb')

interface ThreeAvatarProps {
  className?: string
  isHovered?: boolean
  isEthereal?: boolean
  onClick?: () => void
}

export function ThreeAvatar({ className, isHovered = false, isEthereal = false, onClick }: ThreeAvatarProps) {
  return (
    <div 
      className={cn("relative group", className)} 
      onClick={onClick}
    >
      {/* Invisible Hit Area for onClick triggers to prevent 3D canvas from stealing events */}
      {onClick && (
        <div className="absolute inset-0 z-20 cursor-pointer" />
      )}
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin opacity-60" />
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 0.5, 3], fov: 40 }}
          style={{ 
            background: 'transparent', 
            pointerEvents: onClick ? 'auto' : 'none',
            filter: isEthereal ? 'drop-shadow(0 0 20px rgba(201, 151, 110, 0.4))' : 'none'
          }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={isEthereal ? 2 : 1.2} />
          <directionalLight position={[2, 4, 2]} intensity={isEthereal ? 2 : 1.5} />
          <Environment preset="city" />
          <AvatarModel isHovered={isHovered} />
          {isEthereal && <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />}
        </Canvas>
      </Suspense>
    </div>
  )
}
