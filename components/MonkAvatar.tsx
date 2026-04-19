'use client'

import { useRef, Suspense, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Stars, useGLTF, AdaptiveDpr, useTexture } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

type PortalState = 'connecting' | 'idle' | 'listening' | 'thinking' | 'speaking'

const AURA_COLOR: Record<PortalState, string> = {
  connecting: '#888888',
  idle:       '#FFB347',
  listening:  '#00CFFF',
  thinking:   '#9B59B6',
  speaking:   '#FF6B00',
}

// Primitive transform constants
const PRIM_SCALE = 10
const PRIM_OFFSET = new THREE.Vector3(0, -3.6, 0.5)

// Model-space → group(world)-space conversion
function m2w(mx: number, my: number, mz: number) {
  return new THREE.Vector3(
    -mx * PRIM_SCALE + PRIM_OFFSET.x,
     my * PRIM_SCALE + PRIM_OFFSET.y,
    -mz * PRIM_SCALE + PRIM_OFFSET.z,
  )
}

// ── Wave ring ─────────────────────────────────────────────────────────────────
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

// ── Eldritch Mandala ──────────────────────────────────────────────────────────
function EldritchMandala({ state }: { state: PortalState }) {
  const ring1 = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  const tex   = useTexture('/textures/mandala.png')
  const gold  = new THREE.Color('#FF8C00')
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ring1.current) {
      ring1.current.rotation.z = t * 0.075
      ;(ring1.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        (state === 'speaking' ? 8 : 4) + Math.sin(t * 4) * 1.5
    }
    if (ring2.current) {
      ring2.current.rotation.z = -t * 0.125
      ;(ring2.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        (state === 'speaking' ? 6 : 3) + Math.cos(t * 5) * 1.2
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

// ── Monk Mesh ─────────────────────────────────────────────────────────────────
function MonkMesh({ state }: { state: PortalState }) {
  const groupRef = useRef<THREE.Group>(null)
  const sceneRef = useRef<THREE.Object3D>(null)   // for body bob animation

  const { scene } = useGLTF('/models/monk.glb')

  // ── Morph / bone refs (rigged models) ─────────────────────────────────────
  const mouthMeshRef   = useRef<THREE.Mesh | null>(null)
  const mouthMorphIdxs = useRef<number[]>([])
  const jawBoneRef     = useRef<THREE.Bone | null>(null)
  const jawRestRotX    = useRef(0)
  const eyeMeshRef     = useRef<THREE.Mesh | null>(null)
  const eyeMorphIdxs   = useRef<number[]>([])

  // ── Procedural overlay refs ────────────────────────────────────────────────
  const muscLRef = useRef<THREE.Mesh | null>(null)
  const muscRRef = useRef<THREE.Mesh | null>(null)

  // Jaw mesh fallback (found by position)
  const jawMeshRef  = useRef<THREE.Object3D | null>(null)
  const jawRestY    = useRef(0)

  // ── Blink state machine ────────────────────────────────────────────────────
  const blink = useRef({ next: 5 + Math.random() * 1, phase: 0 as 0|1|2, val: 0 })

  // ── Per-frame animation ────────────────────────────────────────────────────
  useFrame((_, dt) => {
    const t = performance.now() * 0.001

    if (groupRef.current) {
      const s = state === 'listening' ? 1.05 : 1.0
      groupRef.current.scale.lerp(new THREE.Vector3(s, s, s), dt * 2)
    }

    // ── Body / head subtle bob (gives life to any model, no rigging needed) ─
    if (sceneRef.current) {
      const speakBobX = state === 'speaking'
        ? Math.sin(t * 4.5) * 0.022 + Math.sin(t * 7.3) * 0.010
        : 0
      const speakBobZ = state === 'speaking'
        ? Math.sin(t * 3.1) * 0.012
        : 0
      const listenTilt = state === 'listening' ? Math.sin(t * 1.4) * 0.008 : 0
      const thinkTilt  = state === 'thinking'  ? -0.04 + Math.sin(t * 0.8) * 0.005 : 0

      sceneRef.current.rotation.x = THREE.MathUtils.lerp(sceneRef.current.rotation.x, speakBobX + thinkTilt, dt * 6)
      sceneRef.current.rotation.z = THREE.MathUtils.lerp(sceneRef.current.rotation.z, speakBobZ + listenTilt, dt * 4)
    }

    // ── Mouth via morph targets ────────────────────────────────────────────
    const rawOpen = state === 'speaking'
      ? Math.max(0, Math.sin(t * 9.3) * 0.55 + Math.sin(t * 14.7) * 0.30 + 0.15)
      : 0
    const mouthTarget = Math.min(1, rawOpen)

    if (mouthMeshRef.current?.morphTargetInfluences) {
      for (const idx of mouthMorphIdxs.current) {
        mouthMeshRef.current.morphTargetInfluences[idx] =
          THREE.MathUtils.lerp(mouthMeshRef.current.morphTargetInfluences[idx], mouthTarget, dt * 12)
      }
    }

    // ── Mouth via jaw bone ─────────────────────────────────────────────────
    if (jawBoneRef.current) {
      const target = jawRestRotX.current + (state === 'speaking'
        ? Math.max(0, Math.sin(t * 9.3) * 0.07 + Math.sin(t * 14.7) * 0.04 + 0.02)
        : 0)
      jawBoneRef.current.rotation.x =
        THREE.MathUtils.lerp(jawBoneRef.current.rotation.x, target, dt * 12)
    }

    // ── Mouth via positional mesh fallback (voxel jaw mesh) ───────────────
    if (jawMeshRef.current && !jawBoneRef.current && !mouthMeshRef.current) {
      const drop = state === 'speaking'
        ? Math.max(0, Math.sin(t * 9.3) * 0.010 + Math.sin(t * 14.7) * 0.006)
        : 0
      jawMeshRef.current.position.y =
        THREE.MathUtils.lerp(jawMeshRef.current.position.y, jawRestY.current - drop, dt * 12)
    }

    // ── Blink ──────────────────────────────────────────────────────────────
    const bs = blink.current
    if      (bs.phase === 0) { bs.next -= dt; if (bs.next <= 0) bs.phase = 1 }
    else if (bs.phase === 1) { bs.val = Math.min(1, bs.val + dt * 11); if (bs.val >= 1) bs.phase = 2 }
    else                     { bs.val = Math.max(0, bs.val - dt *  7); if (bs.val <= 0) { bs.phase = 0; bs.next = 5 + Math.random() * 1 } }

    // Blink via morph targets
    if (eyeMeshRef.current?.morphTargetInfluences) {
      for (const idx of eyeMorphIdxs.current) {
        eyeMeshRef.current.morphTargetInfluences[idx] =
          THREE.MathUtils.lerp(eyeMeshRef.current.morphTargetInfluences[idx], bs.val, dt * 22)
      }
    }

    // ── Neck muscle pulse ──────────────────────────────────────────────────
    if (muscLRef.current && muscRRef.current) {
      const pump = state === 'speaking'
        ? 1.0 + Math.max(0, Math.sin(t * 9.3) * 0.25 + Math.sin(t * 5.1) * 0.10)
        : 0.88
      const tenseZ = state === 'speaking' ? Math.sin(t * 3.7) * 0.03 : 0
      for (const m of [muscLRef.current, muscRRef.current]) {
        m.scale.x = THREE.MathUtils.lerp(m.scale.x, pump, dt * 7)
        m.scale.z = THREE.MathUtils.lerp(m.scale.z, pump, dt * 7)
      }
      muscLRef.current.rotation.z = THREE.MathUtils.lerp(muscLRef.current.rotation.z,  0.22 + tenseZ, dt * 4)
      muscRRef.current.rotation.z = THREE.MathUtils.lerp(muscRRef.current.rotation.z, -0.22 - tenseZ, dt * 4)
    }
  })

  // ── Scene setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!groupRef.current) return

    const MOUTH_MORPHS = ['mouthOpen','jawOpen','mouth_open','Mouth_Open','jaw_open','viseme_O','viseme_aa','jawDrop']
    const EYE_MORPHS   = ['eyesClosed','eyeClosedL','eyeClosedR','blink','Blink','eyeBlink_L','eyeBlink_R',
                          'eye_closed','Eye_Closed','Blink_L','Blink_R','blinkLeft','blinkRight','eyeClose']

    // ── Collect all meshes ──────────────────────────────────────────────────
    const allMeshes: THREE.Mesh[] = []
    scene.traverse(child => {
      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh
      const mat  = mesh.material as THREE.MeshStandardMaterial
      if (mat) { mat.roughness = Math.max(mat.roughness ?? 0, 0.6); mat.envMapIntensity = 0.4 }
      allMeshes.push(mesh)

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
    })

    // ── Bones ──────────────────────────────────────────────────────────────
    scene.traverse(child => {
      if (!(child as THREE.Bone).isBone) return
      const bone = child as THREE.Bone
      const n = bone.name.toLowerCase()
      if (!jawBoneRef.current && ['jaw','chin','mandible','mouth'].some(k => n.includes(k))) {
        jawBoneRef.current = bone; jawRestRotX.current = bone.rotation.x
      }
    })

    // ── Full-body bounding box (model space) ───────────────────────────────
    const fullBox  = new THREE.Box3().setFromObject(scene)
    const fullSize = fullBox.getSize(new THREE.Vector3())
    const fullCen  = fullBox.getCenter(new THREE.Vector3())

    // ── Find head mesh: prefer named, fallback to topmost-center mesh ─────
    let headMesh: THREE.Mesh | null =
      allMeshes.find(m => /^head|face|skull/i.test(m.name)) ?? null

    if (!headMesh) {
      // Sort by bounding-box center Y, pick the topmost one
      const sorted = [...allMeshes].sort((a, b) => {
        const ca = new THREE.Box3().setFromObject(a).getCenter(new THREE.Vector3())
        const cb = new THREE.Box3().setFromObject(b).getCenter(new THREE.Vector3())
        return cb.y - ca.y
      })
      headMesh = sorted[0] ?? null
    }

    // ── Head bounding box (model space) ───────────────────────────────────
    const headBox  = headMesh
      ? new THREE.Box3().setFromObject(headMesh)
      : new THREE.Box3(
          new THREE.Vector3(fullCen.x - fullSize.x / 2, fullBox.max.y - fullSize.y * 0.22, fullCen.z - 0.05),
          new THREE.Vector3(fullCen.x + fullSize.x / 2, fullBox.max.y,                     fullCen.z + 0.05),
        )

    const headSize = headBox.getSize(new THREE.Vector3())
    const headTopW  = m2w(0, headBox.max.y, 0).y
    const headBotW  = m2w(0, headBox.min.y, 0).y
    const headHW    = Math.abs(headTopW - headBotW)      // head height in world units
    const headWidW  = headSize.x * PRIM_SCALE             // head width in world units

    // ── Face front Z ──────────────────────────────────────────────────────
    // model face is at +Z (large model Z) → world Z = -model_z*10 + 0.5 (smaller world Z)
    // Overlays must be at LARGER world Z (closer to camera at z=6) = faceW.z + offset
    const faceWZ    = m2w(0, 0, headBox.max.z).z
    const overlayZ  = faceWZ + 0.12          // 0.12 world units in front of face surface

    // ── Landmark positions (world Y) ──────────────────────────────────────
    // Using head bounding box so percentages are of HEAD height, not full body
    const eyeY   = headTopW - headHW * 0.32   // 32% down from head top
    const mouthY = headTopW - headHW * 0.68   // 68% down from head top (near chin)
    const neckY  = headBotW - headHW * 0.18   // just below head, into neck area

    // ── Clamp horizontal spans ─────────────────────────────────────────────
    const eyeSpanX  = Math.min(headWidW * 0.24, 0.12)   // max 0.12 wu between eyes
    const neckSpanX = Math.min(headWidW * 0.22, 0.10)   // max 0.10 wu for muscles

    // ── Jaw fallback mesh (only if no morph/bone) ──────────────────────────
    if (!jawBoneRef.current && !mouthMeshRef.current) {
      const mouthY_model = (mouthY - PRIM_OFFSET.y) / PRIM_SCALE
      let best: THREE.Mesh | null = null; let bestDist = Infinity
      for (const m of allMeshes) {
        const cy = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3()).y
        const d  = Math.abs(cy - mouthY_model)
        if (cy > fullCen.y && d < bestDist) { bestDist = d; best = m }
      }
      if (best && bestDist < fullSize.y * 0.1) {
        jawMeshRef.current = best; jawRestY.current = best.position.y
      }
    }

    // ── Skin colour for neck muscles ──────────────────────────────────────
    let skinColor = new THREE.Color(0xC8855A)
    if (headMesh) {
      const hm = headMesh.material as THREE.MeshStandardMaterial
      if (hm?.color) skinColor = hm.color.clone().multiplyScalar(0.88)
    }

    // ── Add neck muscle cylinders ──────────────────────────────────────────
    const muscLen = Math.min(headHW * 0.28, 0.18)
    const mGeo = new THREE.CylinderGeometry(0.009, 0.014, muscLen, 10)
    const mMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.72, metalness: 0.0 })

    const mL = new THREE.Mesh(mGeo, mMat)
    mL.renderOrder = 1
    mL.position.set(-neckSpanX, neckY, overlayZ + 0.04)
    mL.rotation.set(-0.08, 0.06, 0.22)
    groupRef.current.add(mL)
    muscLRef.current = mL

    const mR = new THREE.Mesh(mGeo, mMat.clone())
    mR.renderOrder = 1
    mR.position.set( neckSpanX, neckY, overlayZ + 0.04)
    mR.rotation.set(-0.08, -0.06, -0.22)
    groupRef.current.add(mR)
    muscRRef.current = mR

    // Debug — helps calibrate if positions are off
    console.log('[MonkAvatar] head bounds (world):', { headTopW: headTopW.toFixed(2), headBotW: headBotW.toFixed(2), headHW: headHW.toFixed(2), headWidW: headWidW.toFixed(2) })
    console.log('[MonkAvatar] overlay positions:', { eyeY: eyeY.toFixed(2), mouthY: mouthY.toFixed(2), neckY: neckY.toFixed(2), overlayZ: overlayZ.toFixed(2) })
    console.log('[MonkAvatar] meshes:', allMeshes.map(m => m.name || '(unnamed)'))

    return () => {
      for (const m of [mL, mR]) {
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
        ref={sceneRef}
        object={scene}
        scale={PRIM_SCALE}
        position={[PRIM_OFFSET.x, PRIM_OFFSET.y, PRIM_OFFSET.z]}
        rotation={[0, Math.PI, 0]}
      />


      <pointLight
        position={[0, 0.35, 2.2]}
        intensity={state === 'speaking' ? 4 : state === 'listening' ? 3 : 2}
        color={AURA_COLOR[state]}
        distance={8}
      />
    </group>
  )
}

// ── CSS Blink overlay — sits on top of the canvas, always works ───────────────
function BlinkOverlay() {
  const [val, setVal] = useState(0)

  useEffect(() => {
    let phase: 0 | 1 | 2 = 0
    let v = 0
    let nextAt = Date.now() + 5000 + Math.random() * 1000
    let raf: number
    let last = Date.now()

    function tick() {
      const now = Date.now()
      const dt  = Math.min((now - last) / 1000, 0.05)
      last = now

      if (phase === 0) {
        if (now >= nextAt) phase = 1
      } else if (phase === 1) {
        v = Math.min(1, v + dt * 14)
        if (v >= 1) phase = 2
      } else {
        v = Math.max(0, v - dt * 9)
        if (v <= 0) { phase = 0; nextAt = Date.now() + 5000 + Math.random() * 1000 }
      }

      setVal(v)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (val < 0.01) return null

  const lidStyle = (left: string): React.CSSProperties => ({
    position: 'absolute',
    top:    '30%',
    left,
    width:  '9%',
    height: '5%',
    background: 'linear-gradient(180deg, #b07850 0%, #8a5c38 100%)',
    borderRadius: '0 0 50% 50%',
    transformOrigin: 'top center',
    transform: `scaleY(${val})`,
    pointerEvents: 'none',
    zIndex: 20,
  })

  return (
    <>
      <div style={lidStyle('41%')} />
      <div style={lidStyle('51%')} />
    </>
  )
}

// ── Canvas ────────────────────────────────────────────────────────────────────
export default function MonkAvatar({ state, onClick }: { state: PortalState; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="w-full h-full cursor-pointer relative"
      aria-label={state === 'listening' ? 'Stop listening' : 'Start listening'}>
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
          <EffectComposer enableNormalPass={false}>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.2} radius={0.4} />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      <BlinkOverlay />

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, transparent 35%, rgba(8,7,6,0.9) 75%, rgba(0,0,0,1) 100%)' }} />

      {/* Bottom fade — monk dissolves into darkness */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{ height: '35%', background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 40%, transparent 100%)' }} />
    </div>
  )
}

useGLTF.preload('/models/monk.glb')