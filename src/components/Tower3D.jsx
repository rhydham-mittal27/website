import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Edges, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useInView } from 'motion/react'
import * as THREE from 'three'

// v2: one slender tower of 62 floors, sky deck on 60, glass crown above.
const LEVEL_H = 0.14
const FLOORS = 61 // floors clad in the façade texture; the crown sits above
const TOWER_H = FLOORS * LEVEL_H
const TOWER_W = 1.25
const TOWER_D = 1.25
const PODIUM_TOP = 5 * LEVEL_H
const GOLD = '#E4B96A'

// Seeded random so the façade and city look the same on every visit.
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function useFacadeTextures() {
  return useMemo(() => {
    const rand = rng(7)
    const W = 160
    const H = 1024
    const base = document.createElement('canvas')
    const glow = document.createElement('canvas')
    base.width = glow.width = W
    base.height = glow.height = H
    const b = base.getContext('2d')
    const g = glow.getContext('2d')
    b.fillStyle = '#d9cfbd'
    b.fillRect(0, 0, W, H)
    g.fillStyle = '#000'
    g.fillRect(0, 0, W, H)

    const rows = FLOORS
    const cols = 8
    const rh = H / rows
    const cw = W / cols
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cw + 1
        const y = r * rh + 4
        const lit = rand() < 0.32
        b.fillStyle = lit ? '#e8c38c' : '#22324a'
        b.fillRect(x, y, cw - 2, rh - 5)
        if (lit) {
          g.fillStyle = `rgba(255, 190, 115, ${0.35 + rand() * 0.5})`
          g.fillRect(x, y, cw - 2, rh - 5)
        }
      }
      // Balcony slab across each floor
      b.fillStyle = '#efe6d6'
      b.fillRect(0, r * rh, W, 3.2)
    }
    // Stone piers at the edges
    b.fillStyle = '#e6dccb'
    b.fillRect(0, 0, 6, H)
    b.fillRect(W - 6, 0, 6, H)

    const map = new THREE.CanvasTexture(base)
    const emissiveMap = new THREE.CanvasTexture(glow)
    map.colorSpace = THREE.SRGBColorSpace
    emissiveMap.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = emissiveMap.anisotropy = 4
    return { map, emissiveMap }
  }, [])
}

// Idle life: the windows breathe and the crown pulses slowly
let facade = null
let crownMat = null
function Life() {
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (facade) facade.emissiveIntensity = 1.7 + Math.sin(t * 1.1) * 0.18 + Math.sin(t * 2.9) * 0.06
    if (crownMat) crownMat.emissiveIntensity = 1.4 + (0.5 + 0.5 * Math.sin(t * 1.6)) * 1.2
  })
  return null
}

function Tower({ textures }) {
  const glass = { color: '#1d3550', metalness: 0.9, roughness: 0.12, envMapIntensity: 1.4 }
  return (
    <group>
      <mesh position={[0, PODIUM_TOP + TOWER_H / 2, 0]}>
        <boxGeometry args={[TOWER_W, TOWER_H, TOWER_D]} />
        <meshStandardMaterial
          map={textures.map}
          emissiveMap={textures.emissiveMap}
          emissive="#ffffff"
          emissiveIntensity={1.7}
          onUpdate={(m) => (facade = m)}
          roughness={0.32}
          metalness={0.3}
          envMapIntensity={0.9}
        />
      </mesh>
      {/* Full-height strip of blue-black glass on two faces, as in the film */}
      <mesh position={[-TOWER_W * 0.22, PODIUM_TOP + TOWER_H / 2, TOWER_D / 2 + 0.012]}>
        <boxGeometry args={[TOWER_W * 0.26, TOWER_H, 0.02]} />
        <meshStandardMaterial {...glass} />
      </mesh>
      <mesh position={[TOWER_W / 2 + 0.012, PODIUM_TOP + TOWER_H / 2, TOWER_D * 0.22]}>
        <boxGeometry args={[0.02, TOWER_H, TOWER_D * 0.26]} />
        <meshStandardMaterial {...glass} />
      </mesh>
      {/* Gold corner fins */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * TOWER_W) / 2, PODIUM_TOP + TOWER_H / 2 + 0.2, (sz * TOWER_D) / 2]}>
            <boxGeometry args={[0.05, TOWER_H + 0.4, 0.05]} />
            <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.25} emissive={GOLD} emissiveIntensity={0.25} />
          </mesh>
        )),
      )}
      {/* Sky deck at level 60: a glass balustrade ring around the floor */}
      <mesh position={[0, 60 * LEVEL_H, 0]}>
        <boxGeometry args={[TOWER_W + 0.34, 0.07, TOWER_D + 0.34]} />
        <meshStandardMaterial color="#efe6d6" emissive="#ffcf8f" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 60 * LEVEL_H + 0.1, 0]}>
        <boxGeometry args={[TOWER_W + 0.34, 0.14, TOWER_D + 0.34]} />
        <meshStandardMaterial color="#bfe0f2" transparent opacity={0.35} metalness={0.2} roughness={0.05} depthWrite={false} />
        <Edges color={GOLD} />
      </mesh>
      {/* Glass crown, lit from inside */}
      <mesh position={[0, PODIUM_TOP + TOWER_H + 0.24, 0]}>
        <boxGeometry args={[TOWER_W * 0.92, 0.48, TOWER_D * 0.92]} />
        <meshStandardMaterial onUpdate={(m) => (crownMat = m)} color="#cfe6f5" emissive="#ffd9a0" emissiveIntensity={1.4} transparent opacity={0.85} metalness={0.4} roughness={0.08} />
        <Edges color={GOLD} />
      </mesh>
    </group>
  )
}

// Glass podium, gold-columned porte-cochère and the long reflecting pool.
function Podium() {
  return (
    <group>
      <mesh position={[0, PODIUM_TOP / 2, -0.2]}>
        <boxGeometry args={[3.2, PODIUM_TOP, 2.4]} />
        <meshStandardMaterial color="#2c6668" metalness={0.75} roughness={0.14} envMapIntensity={1.2} emissive="#ffb86b" emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[0, PODIUM_TOP + 0.01, -0.2]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3.2, 2.4]} />
        <meshStandardMaterial color="#3f5a3a" roughness={0.9} />
      </mesh>
      {/* Porte-cochère canopy on four gold columns */}
      <group position={[1.15, 0, 1.45]}>
        <mesh position={[0, 0.46, 0]}>
          <boxGeometry args={[1.1, 0.05, 0.65]} />
          <meshStandardMaterial color="#efe6d6" emissive="#ffcf8f" emissiveIntensity={0.35} />
        </mesh>
        {[-0.45, 0.45].map((x) =>
          [-0.24, 0.24].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.22, z]}>
              <cylinderGeometry args={[0.025, 0.025, 0.44, 12]} />
              <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD} emissiveIntensity={0.3} />
            </mesh>
          )),
        )}
      </group>
      {/* Reflecting pool */}
      <mesh position={[-0.5, 0.012, 2.25]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[4.6, 0.7]} />
        <meshStandardMaterial color="#284f6e" emissive="#2a6c95" emissiveIntensity={0.45} metalness={0.9} roughness={0.05} envMapIntensity={1.5} />
      </mesh>
    </group>
  )
}

function City() {
  const ref = useRef()
  const COUNT = 160
  useEffect(() => {
    const rand = rng(42)
    const m = new THREE.Matrix4()
    for (let i = 0; i < COUNT; i++) {
      const a = rand() * Math.PI * 2
      const r = 4 + rand() * 13
      const h = 0.2 + rand() * rand() * 2.2
      const s = 0.4 + rand() * 0.7
      m.compose(
        new THREE.Vector3(Math.cos(a) * r, h / 2, Math.sin(a) * r),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand() * Math.PI),
        new THREE.Vector3(s, h, s),
      )
      ref.current.setMatrixAt(i, m)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={ref} args={[null, null, COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#1d2c44" emissive="#3a2f22" emissiveIntensity={0.4} roughness={0.9} />
    </instancedMesh>
  )
}

// Gold band that glides to whichever levels are being described.
function Band({ range }) {
  const ref = useRef()
  useFrame((_, dt) => {
    const [lo, hi] = range
    const h = Math.max(0.12, (hi - lo) * LEVEL_H)
    const y = lo * LEVEL_H + h / 2
    const low = hi <= 5
    const w = low ? 3.5 : TOWER_W + 0.5
    const d = low ? 2.8 : TOWER_D + 0.5
    const z = low ? -0.2 : 0
    const k = 1 - Math.exp(-dt * 6)
    const o = ref.current
    o.position.y += (y - o.position.y) * k
    o.position.z += (z - o.position.z) * k
    o.scale.x += (w - o.scale.x) * k
    o.scale.y += (h - o.scale.y) * k
    o.scale.z += (d - o.scale.z) * k
  })
  return (
    <mesh ref={ref} position={[0, 0.3, 0]} scale={[3.5, 0.2, 2.8]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={GOLD} transparent opacity={0.16} depthWrite={false} />
      <Edges color={GOLD} />
    </mesh>
  )
}

function Rig({ progress, children }) {
  const group = useRef()
  useFrame(({ camera, clock }, dt) => {
    const p = progress.get()
    const k = 1 - Math.exp(-dt * 4)
    const targetRot = -0.95 + p * 1.9 + Math.sin(clock.elapsedTime * 0.35) * 0.06
    group.current.rotation.y += (targetRot - group.current.rotation.y) * k
    camera.position.y += (3 + p * 5 - camera.position.y) * k
    camera.lookAt(0, 4 + p * 2.4, 0)
  })
  return <group ref={group}>{children}</group>
}

function Scene({ progress, band }) {
  const textures = useFacadeTextures()
  return (
    <>
      <color attach="background" args={['#081126']} />
      <fog attach="fog" args={['#081126', 16, 38]} />
      <ambientLight intensity={0.35} color="#9fb2d4" />
      <directionalLight position={[-8, 6, 5]} intensity={2.4} color="#ffb877" />
      <directionalLight position={[6, 9, -6]} intensity={0.9} color="#7f9cc9" />
      <pointLight position={[0, 60 * LEVEL_H, 1.2]} intensity={2} distance={3} color="#ffd59a" />

      {/* Studio light rig baked into an env map: soft reflections on glass and gold, no network fetch */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} color="#ffb877" position={[-7, 4, 5]} scale={[8, 4, 1]} target={[0, 3, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#8fb0de" position={[7, 6, -5]} scale={[6, 6, 1]} target={[0, 3, 0]} />
        <Lightformer form="ring" intensity={2} color="#ffe2b8" position={[0, 12, 2]} scale={4} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.6} color="#081126" position={[0, -2, 0]} rotation-x={Math.PI / 2} scale={[30, 30, 1]} />
      </Environment>

      <Rig progress={progress}>
        <mesh rotation-x={-Math.PI / 2}>
          <circleGeometry args={[30, 64]} />
          <meshStandardMaterial color="#060d1e" roughness={1} />
        </mesh>
        <Podium />
        <Tower textures={textures} />
        <Life />

        <Band range={band} />
        <City />
      </Rig>

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
        <Vignette darkness={0.6} offset={0.22} />
      </EffectComposer>
    </>
  )
}

export default function Tower3D({ progress, band }) {
  const wrap = useRef(null)
  const visible = useInView(wrap, { margin: '20% 0px' })
  // Drop render resolution on slower GPUs, raise it again when there's headroom
  const [dpr, setDpr] = useState(1.5)
  return (
    <div ref={wrap} className="tower3d">
      <Canvas
        frameloop={visible ? 'always' : 'demand'}
        dpr={dpr}
        camera={{ position: [10, 3, 14.5], fov: 34 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        aria-label="3D model of the tower, highlighting the level described alongside"
        role="img"
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <Scene progress={progress} band={band} />
      </Canvas>
    </div>
  )
}
