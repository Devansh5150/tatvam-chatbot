'use client'

import { useRef, Suspense, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Stars, useGLTF, AdaptiveDpr, useTexture } from '@react-three/drei'
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

// Primitive transform — applied to the <primitive> tag.
// World = (-m.x * 10 + 0,  m.y * 10 - 3.6,  -m.z * 10 + 0.5)
const PRIM_SCALE = 10
const PRIM_POS   = new THREE.Vector3(0, -3.6, 0.5)
function m2w(mx: number, my: number, mz: number): THREE.Vector3 {
  return new THREE.Vector3(-mx * PRIM_SCALE + PRIM_POS.x, my * PRIM_SCALE + PRIM_POS.y, -mz * PRIM_SCALE + PRIM_POS.z)
}

// ── Wave ring ─────────────────────────────────────────────────────────────
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

// ── Eldritch Mandala ──────────────────────────────────────────────────────
function EldritchMandala({ state }: { state: PortalState }) {
  const ring1 = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  const tex   = useTexture('/textures/mandala.png')
  const gold  = new THREE.Color('#FF8C00')
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ring1.current) {
      ring1.current.rotation.z = t * 0.15
      ;(ring1.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        (state === 'speaking' ? 8 : 4) + Math.sin(t * 20) * 1.5
    }
    if (ring2.current) {
      ring2.current.rotation.z = -t * 0.25
      ;(ring2.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        (state === 'speaking' ? 6 : 3) + Math.cos(t * 25) * 1.2
    }
  })
  return (
    <group position={[0, 0.55, -0.6]}>
      <mesh ref={ring1}>
        <ringGeometry args={[1.7, 2.0, 64]} />
        <meshStandardMaterial map={tex} transparent alphaMap={tex} emissive={gold} emissiveIntensity={4} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2}>
        <ringGeometry args={[1.3, 1.6, 64]} />
        <meshStandardMaterial map={tex} transparent alphaMap={tex} emissive={gold} emissiveIntensity={3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -0.1]}>
        <circleGeometry args={[0.05, 32]} />
        <meshStandardMaterial emissive={gold} emissiveIntensity={15} />
      </mesh>
    </group>
  )
}

// ── Monk Mesh ─────────────────────────────────────────────────────────────
function MonkMesh({ state }: { state: PortalState }) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/models/monk.glb', false, MeshoptDecoder)

  // ── Morph / bone refs (work on rigged models) ──────────────────────────
  const mouthMeshRef   = useRef<THREE.Mesh | null>(null)
  const mouthMorphIdxs = useRef<number[]>([])
  const jawBoneRef     = useRef<THREE.Bone | null>(null)
  const jawRestRotX    = useRef(0)
  const eyeMeshRef     = useRef<THREE.Mesh | null>(null)
  const eyeMorphIdxs   = useRef<number[]>([])

  // ── Procedural overlay refs (work on ALL models, including voxel) ──────
  // Jaw: a single scene-mesh found by position, animated by Y translate
  const jawMeshRef     = useRef<THREE.Object3D | null>(null)
  const jawRestY       = useRef(0)
  // Eyelid planes added imperatively — cover the eye area each blink
  const lidLRef        = useRef<THREE.Mesh | null>(null)
  const lidRRef        = useRef<THREE.Mesh | null>(null)
  // Neck muscle cylinders added imperatively
  const muscLRef       = useRef<THREE.Mesh | null>(null)
  const muscRRef       = useRef<THREE.Mesh | null>(null)

  // ── Blink state machine ────────────────────────────────────────────────
  const blink = useRef({ next: 1.5 + Math.random() * 2, phase: 0 as 0|1|2, val: 0 })

  // ── Colour ref ────────────────────────────────────────────────────────
  const targetColor  = useRef(new THREE.Color(AURA_COLOR.idle))
  const currentColor = useRef(new THREE.Color(AURA_COLOR.idle))

  // ── Per-frame animation ────────────────────────────────────────────────
  useFrame((_, dt) => {
    const t = performance.now() * 0.001

    targetColor.current.set(AURA_COLOR[state])
    currentColor.current.lerp(targetColor.current, dt * 3)

    if (groupRef.current) {
      const s = state === 'listening' ? 1.05 : 1.0
      groupRef.current.scale.lerp(new THREE.Vector3(s, s, s), dt * 2)
    }

    // ── Mouth (morph targets or jaw bone — rigged models) ────────────
    const rawOpen = state === 'speaking'
      ? Math.max(0, Math.sin(t * 9.3) * 0.55 + Math.sin(t * 14.7) * 0.3 + 0.15)
      : 0
    const mouthTarget = Math.min(1, rawOpen)

    if (mouthMeshRef.current?.morphTargetInfluences) {
      for (const idx of mouthMorphIdxs.current) {
        mouthMeshRef.current.morphTargetInfluences[idx] =
          THREE.MathUtils.lerp(mouthMeshRef.current.morphTargetInfluences[idx], mouthTarget, dt * 12)
      }
    }
    if (jawBoneRef.current) {
      const target = jawRestRotX.current + (state === 'speaking'
        ? Math.max(0, Math.sin(t * 9.3) * 0.07 + Math.sin(t * 14.7) * 0.04 + 0.02)
        : 0)
      jawBoneRef.current.rotation.x = THREE.MathUtils.lerp(jawBoneRef.current.rotation.x, target, dt * 12)
    }

    // ── Jaw mesh translate (voxel / positional fallback) ─────────────
    if (jawMeshRef.current && !jawBoneRef.current && !mouthMeshRef.current) {
      const drop = state === 'speaking'
        ? Math.max(0, Math.sin(t * 9.3) * 0.012 + Math.sin(t * 14.7) * 0.008)
        : 0
      jawMeshRef.current.position.y = THREE.MathUtils.lerp(
        jawMeshRef.current.position.y, jawRestY.current - drop, dt * 12,
      )
    }

    // ── Blink state machine ───────────────────────────────────────────
    const bs = blink.current
    if      (bs.phase === 0) { bs.next -= dt;  if (bs.next <= 0) bs.phase = 1 }
    else if (bs.phase === 1) { bs.val = Math.min(1, bs.val + dt * 11); if (bs.val >= 1) bs.phase = 2 }
    else                     { bs.val = Math.max(0, bs.val - dt * 7);  if (bs.val <= 0) { bs.phase = 0; bs.next = 2.5 + Math.random() * 3.5 } }

    // Apply via morph targets (rigged)
    if (eyeMeshRef.current?.morphTargetInfluences) {
      for (const idx of eyeMorphIdxs.current) {
        eyeMeshRef.current.morphTargetInfluences[idx] =
          THREE.MathUtils.lerp(eyeMeshRef.current.morphTargetInfluences[idx], bs.val, dt * 22)
      }
    }

    // Apply via eyelid overlay planes (always — works on voxel models)
    if (lidLRef.current) {
      lidLRef.current.scale.y = THREE.MathUtils.lerp(lidLRef.current.scale.y, 1 - bs.val * 0.9, dt * 22)
      lidRRef.current!.scale.y = lidLRef.current.scale.y
    }

    // ── Neck muscles ─────────────────────────────────────────────────
    if (muscLRef.current && muscRRef.current) {
      // Pulse thickness on each speech beat
      const pump = state === 'speaking'
        ? 1.0 + Math.max(0, Math.sin(t * 9.3) * 0.22 + Math.sin(t * 5.1) * 0.1)
        : 0.85
      for (const m of [muscLRef.current, muscRRef.current]) {
        m.scale.x = THREE.MathUtils.lerp(m.scale.x, pump, dt * 7)
        m.scale.z = THREE.MathUtils.lerp(m.scale.z, pump, dt * 7)
      }
      // Subtle lateral tension during speech
      const tense = state === 'speaking' ? Math.sin(t * 3.7) * 0.025 : 0
      muscLRef.current.rotation.z = THREE.MathUtils.lerp(muscLRef.current.rotation.z, 0.22 + tense, dt * 4)
      muscRRef.current.rotation.z = THREE.MathUtils.lerp(muscRRef.current.rotation.z, -0.22 - tense, dt * 4)
    }
  })

  // ── Scene setup: detect morph/bones AND add procedural overlays ────────
  useEffect(() => {
    if (!groupRef.current) return

    const MOUTH_MORPHS = ['mouthOpen','jawOpen','mouth_open','Mouth_Open','jaw_open','viseme_O','viseme_aa','jawDrop']
    const EYE_MORPHS   = ['eyesClosed','eyeClosedL','eyeClosedR','blink','Blink','eyeBlink_L','eyeBlink_R',
                          'eye_closed','Eye_Closed','Blink_L','Blink_R','blinkLeft','blinkRight']

    // ── Pass 1: morph targets + bones ──────────────────────────────────
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const mat  = mesh.material as THREE.MeshStandardMaterial
        if (mat) { mat.roughness = Math.max(mat.roughness ?? 0, 0.6); mat.envMapIntensity = 0.5 }

        if (mesh.morphTargetDictionary) {
          if (!mouthMeshRef.current) {
            const found = MOUTH_MORPHS.map(k => mesh.morphTargetDictionary![k]).filter(i => i !== undefined)
            if (found.length) { mouthMeshRef.current = mesh; mouthMorphIdxs.current = found }
          }
          if (!eyeMeshRef.current) {
            const found = EYE_MORPHS.map(k => mesh.morphTargetDictionary![k]).filter(i => i !== undefined)
            if (found.length) { eyeMeshRef.current = mesh; eyeMorphIdxs.current = found }
          }
        }
      }
      if ((child as THREE.Bone).isBone) {
        const bone = child as THREE.Bone
        const n = bone.name.toLowerCase()
        if (!jawBoneRef.current  && ['jaw','mouth','chin','mandible'].some(k => n.includes(k))) { jawBoneRef.current = bone; jawRestRotX.current = bone.rotation.x }
      }
    })

    // ── Pass 2: compute scene bounds in MODEL space ────────────────────
    // Box3.setFromObject works in world space — but the scene hasn't been
    // transformed yet (it's the raw GLB). So this IS model space.
    const box  = new THREE.Box3().setFromObject(scene)
    const size = box.getSize(new THREE.Vector3())
    const cen  = box.getCenter(new THREE.Vector3())

    // Convert key landmark positions to group (world) space using m2w()
    // Face FRONT: in the GLB the face usually faces +Z → modelBox.max.z is the front face depth.
    // After rotation [0,π,0]: world_z = -model_z * 10 + 0.5
    // So world_z of face front = -box.max.z * 10 + 0.5  (smaller z = further from camera which is at z=6)
    // Overlays placed "in front" from camera = larger z (closer to camera at z=6) = face_z + 0.1 to 0.4

    const faceZ_world = m2w(0, 0, box.max.z).z          // world z of face surface
    const overlayZ    = faceZ_world + 0.14               // slightly in front (toward camera)

    const headTopY    = m2w(0, box.max.y, 0).y
    const headH       = size.y * PRIM_SCALE               // head+body height in world units

    // Eye Y: 15% below head top, narrow horizontal span
    const eyeY       = headTopY - headH * 0.14
    const eyeSpanX   = size.x * PRIM_SCALE * 0.22        // half-distance between eyes

    // Mouth / jaw Y: 28% below head top
    const mouthY     = headTopY - headH * 0.27

    // Neck Y: 38% below head top
    const neckY      = headTopY - headH * 0.38
    const neckSpanX  = size.x * PRIM_SCALE * 0.18        // half-distance of neck muscles

    // Lid size proportional to model
    const lidW = size.x * PRIM_SCALE * 0.14
    const lidH = size.y * PRIM_SCALE * 0.045

    // ── Pass 3: find jaw mesh by position (lowest face mesh) ───────────
    // Only if no bone/morph jaw found
    if (!jawBoneRef.current && !mouthMeshRef.current) {
      let best: THREE.Object3D | null = null
      let bestDist = Infinity
      scene.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return
        const b2 = new THREE.Box3().setFromObject(child)
        const cy  = b2.getCenter(new THREE.Vector3()).y
        // We want the mesh whose center is near mouthY (in model space)
        const mouthY_model = (mouthY - PRIM_POS.y) / PRIM_SCALE
        const dist = Math.abs(cy - mouthY_model)
        // Only consider meshes in upper half (face area)
        if (cy > cen.y && dist < bestDist) { bestDist = dist; best = child as THREE.Object3D }
      })
      if (best && bestDist < size.y * 0.12) {
        jawMeshRef.current = best
        jawRestY.current   = (best as THREE.Object3D).position.y
      }
    }

    // ── Pass 4: add procedural overlay meshes to the group ─────────────
    const skinColor = new THREE.Color(0xC8855A)  // warm tan matching voxel skin

    // Eyelid L
    const lidGeo = new THREE.BoxGeometry(lidW, lidH, 0.01)
    const lidMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7, metalness: 0.0, depthTest: true })
    const lL = new THREE.Mesh(lidGeo, lidMat)
    lL.position.set(-eyeSpanX, eyeY, overlayZ)
    groupRef.current.add(lL)
    lidLRef.current = lL

    // Eyelid R
    const lR = new THREE.Mesh(lidGeo, lidMat.clone())
    lR.position.set(eyeSpanX, eyeY, overlayZ)
    groupRef.current.add(lR)
    lidRRef.current = lR

    // Neck muscle L (sternocleidomastoid shape)
    const muscLen = headH * 0.13
    const mGeo    = new THREE.CylinderGeometry(0.010, 0.016, muscLen, 10)
    const mMat    = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.72, metalness: 0.0 })
    const mL      = new THREE.Mesh(mGeo, mMat)
    mL.position.set(-neckSpanX, neckY, overlayZ + 0.1)
    mL.rotation.set(-0.08, 0.06, 0.22)
    groupRef.current.add(mL)
    muscLRef.current = mL

    // Neck muscle R
    const mR = new THREE.Mesh(mGeo, mMat.clone())
    mR.position.set(neckSpanX, neckY, overlayZ + 0.1)
    mR.rotation.set(-0.08, -0.06, -0.22)
    groupRef.current.add(mR)
    muscRRef.current = mR

    // Cleanup on unmount
    return () => {
      for (const m of [lL, lR, mL, mR]) {
        groupRef.current?.remove(m)
        m.geometry.dispose()
        ;(m.material as THREE.Material).dispose()
      }
    }
  }, [scene])

  return (
    <group ref={groupRef}>
      <EldritchMandala state={state} />

      <primitive
        object={scene}
        scale={PRIM_SCALE}
        position={[PRIM_POS.x, PRIM_POS.y, PRIM_POS.z]}
        rotation={[0, Math.PI, 0]}
      />

      <WaveRing phase={0}    state={state} />
      <WaveRing phase={0.33} state={state} />
      <WaveRing phase={0.66} state={state} />

      <pointLight
        position={[0, 0.35, 2.2]}
        intensity={state === 'speaking' ? 4 : state === 'listening' ? 3 : 2}
        color={AURA_COLOR[state]}
        distance={8}
      />
    </group>
  )
}

// ── Canvas wrapper ─────────────────────────────────────────────────────────
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
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.2} radius={0.4} />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 35%, rgba(8,7,6,0.9) 75%, rgba(0,0,0,1) 100%)',
        }}
      />
    </div>
  )
}

useGLTF.preload('/models/monk.glb', false, MeshoptDecoder)
