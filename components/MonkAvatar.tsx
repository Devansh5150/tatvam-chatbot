'use client'

import { useRef, Suspense, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Stars, useGLTF, AdaptiveDpr, Sparkles, useTexture } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { MeshoptDecoder } from 'meshoptimizer'

type PortalState = 'connecting' | 'idle' | 'listening' | 'thinking' | 'speaking'

const AURA_COLOR: Record<PortalState, string> = {
  connecting: '#888888',
  idle:       '#FFB347',
  listening:  '#00CFFF',
  thinking:   '#9B59B6',
  speaking:   '#FF6B00',
}

// ── Wave ring (expands outward while speaking) ─────────────────────────────
function WaveRing({ phase, state }: { phase: number; state: PortalState }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (!ref.current) return
    if (state !== 'speaking') { ref.current.visible = false; return }
    ref.current.visible = true
    const t = ((performance.now() * 0.001 * 0.7) + phase) % 1
    const s = 1.2 + t * 2.5
    ref.current.scale.set(s, s, s)
    ;(ref.current.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.7 * (1 - t))
  })
  return (
    <mesh ref={ref} position={[0, -0.2, 0]} visible={false}>
      <torusGeometry args={[0.7, 0.015, 8, 80]} />
      <meshStandardMaterial color="#FF6B00" emissive="#FF6B00" emissiveIntensity={1.5} transparent opacity={0.7} />
    </mesh>
  )
}

// ── Eldritch Mandala (Dr. Strange Style) ──────────────────────────────────
function EldritchMandala({ state }: { state: PortalState }) {
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const mandalaTex = useTexture('/textures/mandala.png')

  useFrame((stateObj) => {
    const t = stateObj.clock.getElapsedTime()
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.15
      ;(ring1Ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 
        (state === 'speaking' ? 8 : 4) + Math.sin(t * 20) * 1.5 // Dr Strange Flicker
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.25
      ;(ring2Ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 
        (state === 'speaking' ? 6 : 3) + Math.cos(t * 25) * 1.2
    }
  })

  // Dr. Strange style is consistently Orange/Gold energy
  const magicColor = new THREE.Color('#FF8C00') 

  return (
    <group position={[0, 0.55, -0.6]}>
      {/* Outer Rotating Ring */}
      <mesh ref={ring1Ref}>
        <ringGeometry args={[1.7, 2.0, 64]} />
        <meshStandardMaterial 
          map={mandalaTex}
          transparent
          alphaMap={mandalaTex}
          emissive={magicColor}
          emissiveIntensity={4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner Counter-Rotating Ring */}
      <mesh ref={ring2Ref}>
        <ringGeometry args={[1.3, 1.6, 64]} />
        <meshStandardMaterial 
          map={mandalaTex}
          transparent
          alphaMap={mandalaTex}
          emissive={magicColor}
          emissiveIntensity={3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Core Glow Center */}
      <mesh position={[0, 0, -0.1]}>
        <circleGeometry args={[0.05, 32]} />
        <meshStandardMaterial 
          emissive={magicColor}
          emissiveIntensity={15}
        />
      </mesh>
    </group>
  )
}


// ── Main monk mesh (Loaded from GLB) ───────────────────────────────────────
function MonkMesh({ state }: { state: PortalState }) {
  const groupRef = useRef<THREE.Group>(null)
  const auraRef  = useRef<THREE.Mesh>(null)
  const haloRef  = useRef<THREE.Mesh>(null)

  // Mouth/jaw animation refs
  const mouthMeshRef     = useRef<THREE.Mesh | null>(null)
  const jawBoneRef       = useRef<THREE.Bone | null>(null)
  const mouthMorphIdxs   = useRef<number[]>([])
  const jawRestRotX      = useRef<number>(0)

  // Load the model with Meshopt decoder
  const { scene } = useGLTF('/models/monk.glb', false, MeshoptDecoder)

  const targetColor  = useRef(new THREE.Color(AURA_COLOR.idle))
  const currentColor = useRef(new THREE.Color(AURA_COLOR.idle))

  useFrame((_, dt) => {
    const t = performance.now() * 0.001
    targetColor.current.set(AURA_COLOR[state])
    currentColor.current.lerp(targetColor.current, dt * 3)

    // Aura glow logic removed

    // Halo logic removed

    // Gentle floating motion for the whole group if needed (Float component does this too)
    if (groupRef.current) {
      const targetScale = state === 'listening' ? 1.05 : 1.0
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), dt * 2)
    }

    // Mouth animation — irregular speech rhythm
    const rawOpen = state === 'speaking'
      ? Math.max(0, Math.sin(t * 9.3) * 0.55 + Math.sin(t * 14.7) * 0.3 + 0.15)
      : 0
    const mouthTarget = Math.min(1, rawOpen)

    if (mouthMeshRef.current?.morphTargetInfluences) {
      for (const idx of mouthMorphIdxs.current) {
        mouthMeshRef.current.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
          mouthMeshRef.current.morphTargetInfluences[idx],
          mouthTarget,
          dt * 12,
        )
      }
    }

    if (jawBoneRef.current) {
      const jawTarget = jawRestRotX.current + (state === 'speaking'
        ? Math.max(0, Math.sin(t * 9.3) * 0.07 + Math.sin(t * 14.7) * 0.04 + 0.02)
        : 0)
      jawBoneRef.current.rotation.x = THREE.MathUtils.lerp(jawBoneRef.current.rotation.x, jawTarget, dt * 12)
    }
  })

  // Adjust materials and detect mouth/jaw elements
  useEffect(() => {
    const MOUTH_MORPH_KEYS = ['mouthOpen', 'jawOpen', 'mouth_open', 'Mouth_Open', 'jaw_open', 'viseme_O', 'viseme_aa', 'viseme_E']
    const JAW_BONE_KEYWORDS = ['jaw', 'mouth']

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const m = mesh.material as THREE.MeshStandardMaterial
        if (m) {
          m.roughness = Math.max(m.roughness, 0.6)
          m.envMapIntensity = 0.5
        }

        // Find morph targets for mouth opening
        if (mesh.morphTargetDictionary && !mouthMeshRef.current) {
          const found: number[] = []
          for (const key of MOUTH_MORPH_KEYS) {
            const idx = mesh.morphTargetDictionary[key]
            if (idx !== undefined) found.push(idx)
          }
          if (found.length > 0) {
            mouthMeshRef.current = mesh
            mouthMorphIdxs.current = found
          }
        }
      }

      // Find jaw bone
      if ((child as THREE.Bone).isBone && !jawBoneRef.current) {
        const bone = child as THREE.Bone
        if (JAW_BONE_KEYWORDS.some(k => bone.name.toLowerCase().includes(k))) {
          jawBoneRef.current = bone
          jawRestRotX.current = bone.rotation.x
        }
      }
    })
  }, [scene])

  return (
    <group ref={groupRef}>
      {/* Aura removed */}

      {/* ── Eldritch Mandala Halo (Dr. Strange Style) ── */}
      <EldritchMandala state={state} />

      {/* ── The Monk Model (Balanced Size) ── */}
      <primitive 
        object={scene} 
        scale={10} 
        position={[0, -3.6, 0.5]} 
        rotation={[0, Math.PI, 0]} 
      />

      {/* Halo removed */}

      {/* ── Speaking wave rings (Centered on heart/upper chest) ── */}
      <WaveRing phase={0}    state={state} />
      <WaveRing phase={0.33} state={state} />
      <WaveRing phase={0.66} state={state} />

      {/* ── Scene light following state ── */}
      <pointLight 
        position={[0, 0.35, 2.2]}
        intensity={state === 'speaking' ? 4 : state === 'listening' ? 3 : 2}
        color={AURA_COLOR[state]} 
        distance={8} 
      />
    </group>
  )
}

// ── Canvas wrapper (exported) ──────────────────────────────────────────────
export default function MonkAvatar({ state, onClick }: { state: PortalState; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="w-full h-full cursor-pointer relative"
      aria-label={state === 'listening' ? 'Stop listening' : 'Start listening'}
    >
      <Canvas
        camera={{ position: [0, 0.5, 6], fov: 45 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        style={{ background: 'transparent' }}
        shadows
      >
        <AdaptiveDpr />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#FFF5E0" castShadow />
        <directionalLight position={[-5, 2, -2]} intensity={0.4} color="#4466CC" />
        <pointLight position={[0, -2, 2]} intensity={0.5} color="#FFB347" />

        <Suspense fallback={null}>
          <Stars radius={120} depth={60} count={2000} factor={6} fade speed={0.8} />
          <Float speed={2} rotationIntensity={0.15} floatIntensity={0.5}>
            <MonkMesh state={state} />
          </Float>
          
          <EffectComposer disableNormalPass>
            <Bloom 
              luminanceThreshold={0.5} 
              mipmapBlur 
              intensity={1.2} 
              radius={0.4}
            />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>
      </Canvas>
      
      {/* Mathematically perfect soft CSS fade for the edges */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          background: 'radial-gradient(circle at center, transparent 35%, rgba(8,7,6,0.9) 75%, rgba(0,0,0,1) 100%)' 
        }} 
      />
      
      {/* Loading overlay if needed, though Suspense handles it */}
    </div>
  )
}

// Preload the model
useGLTF.preload('/models/monk.glb', false, MeshoptDecoder)
