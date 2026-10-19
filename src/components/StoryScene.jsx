import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Grid, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useInView } from 'motion/react'
import * as THREE from 'three'
import { CAMERA, CHAPTERS, ease, keyframe, lerp, range } from './storyPath.js'

const GOLD = new THREE.Color('#E4B96A')
const PLOT = 5.2 // spacing between plots
const BOUNDARY = 4.4 // side of the Meridian's 4-acre plot

function rng(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function windowTexture(seed, litChance, litColor, darkColor, base) {
  const rand = rng(seed)
  const W = 64
  const H = 256
  const c = document.createElement('canvas')
  const e = document.createElement('canvas')
  c.width = e.width = W
  c.height = e.height = H
  const b = c.getContext('2d')
  const g = e.getContext('2d')
  b.fillStyle = base
  b.fillRect(0, 0, W, H)
  g.fillStyle = '#000'
  g.fillRect(0, 0, W, H)
  const rows = 40
  const cols = 6
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = col * (W / cols) + 1.5
      const y = r * (H / rows) + 1.5
      const w = W / cols - 3
      const h = H / rows - 3
      const lit = rand() < litChance
      b.fillStyle = lit ? litColor : darkColor
      b.fillRect(x, y, w, h)
      if (lit) {
        g.fillStyle = litColor
        g.fillRect(x, y, w, h)
      }
    }
  }
  const map = new THREE.CanvasTexture(c)
  const emissiveMap = new THREE.CanvasTexture(e)
  map.colorSpace = emissiveMap.colorSpace = THREE.SRGBColorSpace
  return { map, emissiveMap }
}

// The crowded city: four towers to a plot. Rises in chapter 1, then sinks
// back into the ground in a wave moving outward from the Meridian.
function Neighbours({ progress }) {
  const ref = useRef()
  const tex = useMemo(() => windowTexture(3, 0.3, '#f1c890', '#252b38', '#6e6a64'), [])
  const towers = useMemo(() => {
    const r = rng(11)
    const list = []
    for (let gx = -3; gx <= 3; gx++) {
      for (let gz = -3; gz <= 3; gz++) {
        if (gx === 0 && gz === 0) continue
        const cx = gx * PLOT
        const cz = gz * PLOT
        for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          list.push({
            x: cx + ox * 1.15 + (r() - 0.5) * 0.3,
            z: cz + oz * 1.15 + (r() - 0.5) * 0.3,
            h: 1.8 + r() * 3.4,
            w: 0.75 + r() * 0.35,
            dist: Math.hypot(cx, cz),
            jitter: r(),
          })
        }
      }
    }
    return list
  }, [])
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const [a0, a1] = CHAPTERS.rise
  const [b0] = CHAPTERS.clear
  const maxDist = Math.hypot(3 * PLOT, 3 * PLOT)

  const lastP = useRef(-1)
  useFrame(() => {
    const p = progress.get()
    // Only re-upload tower matrices when the scroll position actually changed
    if (Math.abs(p - lastP.current) < 0.0002) return
    lastP.current = p
    towers.forEach((t, i) => {
      const start = a0 + (t.dist / maxDist) * 0.08 + t.jitter * 0.03
      const rise = ease(range(p, start, a1))
      const sinkStart = b0 + (t.dist / maxDist) * 0.13 + t.jitter * 0.02
      const sink = ease(range(p, sinkStart, sinkStart + 0.08))
      const s = Math.max(0.0001, rise * (1 - sink))
      tmp.position.set(t.x, (t.h * s) / 2, t.z)
      tmp.scale.set(t.w, t.h * s, t.w)
      tmp.updateMatrix()
      ref.current.setMatrixAt(i, tmp.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[null, null, towers.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        map={tex.map}
        emissiveMap={tex.emissiveMap}
        emissive="#ffffff"
        emissiveIntensity={0.7}
        metalness={0.15}
        roughness={0.65}
      />
    </instancedMesh>
  )
}

// The Meridian: rises with the city, then outgrows it and turns gold.
// In the last chapter a band of light climbs it floor by floor.
function Meridian({ progress }) {
  const body = useRef()
  const mat = useRef()
  const crown = useRef()
  const fill = useRef()
  const scan = useRef()
  const tex = useMemo(() => windowTexture(7, 0.45, '#ffcf8f', '#22324a', '#e6dccb'), [])

  useFrame(({ clock }) => {
    const p = progress.get()
    const t = clock.elapsedTime
    const rise = ease(range(p, 0.02, CHAPTERS.rise[1]))
    const grow = ease(range(p, CHAPTERS.clear[0] + 0.05, CHAPTERS.clear[1]))
    const H = Math.max(0.001, lerp(0, 4.4, rise) + grow * 5)
    body.current.scale.set(1.15, H, 1.15)
    body.current.position.y = H / 2
    mat.current.emissiveIntensity = 0.25 + grow * 1.5 + Math.sin(t * 1.2) * 0.12 * grow

    crown.current.position.y = H + 0.22
    crown.current.scale.setScalar(Math.max(0.001, rise * (1 + Math.sin(t * 1.8) * 0.04)))

    const lit = ease(range(p, CHAPTERS.light[0], CHAPTERS.light[1] - 0.04))
    const fh = Math.max(0.0001, H * lit)
    fill.current.scale.set(1.24, fh, 1.24)
    fill.current.position.y = fh / 2
    scan.current.position.y = fh
    scan.current.visible = lit > 0.001 && lit < 0.999
  })

  return (
    <group>
      <mesh ref={body}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          ref={mat}
          map={tex.map}
          emissiveMap={tex.emissiveMap}
          emissive="#ffffff"
          emissiveIntensity={0.25}
          metalness={0.3}
          roughness={0.3}
        />
      </mesh>
      <mesh ref={crown}>
        <boxGeometry args={[1.05, 0.44, 1.05]} />
        <meshStandardMaterial color="#cfe6f5" emissive="#ffd9a0" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <mesh ref={fill}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={scan}>
        <boxGeometry args={[1.5, 0.05, 1.5]} />
        <meshBasicMaterial color="#ffe4b5" toneMapped={false} />
      </mesh>
    </group>
  )
}

// Gold plot boundary that draws itself edge by edge.
function Boundary({ progress }) {
  const edges = useRef([])
  const plane = useRef()
  const half = BOUNDARY / 2
  const sides = [
    { from: [-half, half], dir: [1, 0] },
    { from: [half, half], dir: [0, -1] },
    { from: [half, -half], dir: [-1, 0] },
    { from: [-half, -half], dir: [0, 1] },
  ]
  useFrame(() => {
    const p = progress.get()
    const t = range(p, CHAPTERS.clear[0] + 0.1, CHAPTERS.clear[1] - 0.02) * 4
    sides.forEach((s, i) => {
      const f = Math.min(1, Math.max(0, t - i))
      const len = Math.max(0.0001, f * BOUNDARY)
      const m = edges.current[i]
      m.scale.x = len
      m.position.set(s.from[0] + (s.dir[0] * len) / 2, 0.03, s.from[1] + (s.dir[1] * len) / 2)
      m.rotation.y = s.dir[0] !== 0 ? 0 : Math.PI / 2
    })
    plane.current.material.opacity = 0.1 * range(p, CHAPTERS.clear[1] - 0.06, CHAPTERS.clear[1])
  })
  return (
    <group>
      {sides.map((_, i) => (
        <mesh key={i} ref={(el) => (edges.current[i] = el)}>
          <boxGeometry args={[1, 0.03, 0.05]} />
          <meshBasicMaterial color="#f3d39c" toneMapped={false} />
        </mesh>
      ))}
      <mesh ref={plane} rotation-x={-Math.PI / 2} position-y={0.015}>
        <planeGeometry args={[BOUNDARY, BOUNDARY]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

// East: low sun behind a ridge of hills. West: a field of city lights.
function Horizons({ progress }) {
  const sun = useRef()
  const sunLight = useRef()
  const lights = useRef()
  const points = useMemo(() => {
    const r = rng(5)
    return Array.from({ length: 420 }, () => [-(10 + r() * 30), 0.06, (r() - 0.5) * 50, 0.04 + r() * 0.06])
  }, [])
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const hills = useMemo(() => {
    const r = rng(9)
    return Array.from({ length: 9 }, (_, i) => ({ z: -24 + i * 6 + r() * 2, h: 3 + r() * 4, w: 6 + r() * 5 }))
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const p = progress.get()
    const v = range(p, CHAPTERS.views[0] - 0.04, CHAPTERS.views[0] + 0.08)
    sun.current.children[0].material.opacity = v
    sun.current.children[1].material.opacity = v * 0.18
    sunLight.current.intensity = 0.2 + v * 2.6
    const city = range(p, CHAPTERS.views[0] + 0.05, CHAPTERS.views[1])
    points.forEach((pt, i) => {
      const on = city > (i / points.length) * 0.9 ? 1 : 0
      tmp.position.set(pt[0], pt[1], pt[2])
      const twinkle = 0.65 + 0.35 * Math.sin(t * (1.5 + (i % 7) * 0.4) + i)
      tmp.scale.setScalar(Math.max(0.0001, pt[3] * on * twinkle))
      tmp.updateMatrix()
      lights.current.setMatrixAt(i, tmp.matrix)
    })
    lights.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <group ref={sun} position={[46, 4.5, 0]} rotation-y={-Math.PI / 2}>
        <mesh>
          <circleGeometry args={[3.2, 48]} />
          <meshBasicMaterial color="#ffc48a" transparent opacity={0} toneMapped={false} />
        </mesh>
        <mesh position-z={-0.1}>
          <circleGeometry args={[11, 48]} />
          <meshBasicMaterial color="#ff9a5a" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      <directionalLight ref={sunLight} position={[30, 6, 0]} color="#ffb877" intensity={0.2} />
      {hills.map((h, i) => (
        <mesh key={i} position={[36, h.h / 2 - 0.2, h.z]} rotation-y={Math.PI / 2}>
          <coneGeometry args={[h.w, h.h, 4]} />
          <meshStandardMaterial color="#0d1626" roughness={1} />
        </mesh>
      ))}
      <instancedMesh ref={lights} args={[null, null, points.length]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color="#ffd59a" toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

function CameraRig({ progress }) {
  const target = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const aim = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, size }, dt) => {
    const p = progress.get()
    // Portrait screens: no sideways framing (text sits above), and pull back to fit the width
    const aspect = size.width / size.height
    const wide = Math.min(1, Math.max(0, (aspect - 0.75) / 0.75))
    const fit = 1 + (1 - wide) * 0.45
    const a = keyframe(p, CAMERA.at, CAMERA.angle)
    const r = keyframe(p, CAMERA.at, CAMERA.radius) * fit
    const y = keyframe(p, CAMERA.at, CAMERA.height) * (1 + (fit - 1) * 0.6)
    const ly = keyframe(p, CAMERA.at, CAMERA.lookY)
    const side = keyframe(p, CAMERA.at, CAMERA.side) * wide
    target.set(Math.sin(a) * r, y, Math.cos(a) * r)
    // Look slightly left of the tower (along the camera's right axis) so it frames right of centre
    aim.set(-Math.cos(a) * side, ly, Math.sin(a) * side)
    const k = 1 - Math.exp(-dt * 5)
    camera.position.lerp(target, k)
    look.lerp(aim, k)
    camera.lookAt(look)
  })
  return null
}

export default function StoryScene({ progress }) {
  const wrap = useRef(null)
  const visible = useInView(wrap, { margin: '10% 0px' })
  // Drop render resolution on slower GPUs, raise it again when there's headroom
  const [dpr, setDpr] = useState(1.25)
  return (
    <div ref={wrap} className="story3d">
      <Canvas
        frameloop={visible ? 'always' : 'demand'}
        dpr={dpr}
        camera={{ position: [-10, 19, 28], fov: 35, near: 0.1, far: 200 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        aria-hidden="true"
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <color attach="background" args={['#081126']} />
        <fog attach="fog" args={['#1a2033', 20, 66]} />
        <hemisphereLight args={['#e9c9a8', '#1b2335', 0.9]} />
        <directionalLight position={[-12, 9, 8]} intensity={1.6} color="#ffc48e" />
        <directionalLight position={[10, 12, -8]} intensity={0.6} color="#8fa6cf" />

        <Grid
          infiniteGrid
          cellSize={1}
          sectionSize={PLOT}
          cellThickness={0.5}
          sectionThickness={1}
          cellColor="#2a2f3d"
          sectionColor="#4d4a4a"
          fadeDistance={70}
          fadeStrength={1.4}
          position={[0, 0.001, 0]}
        />
        <Neighbours progress={progress} />
        <Meridian progress={progress} />
        <Boundary progress={progress} />
        <Horizons progress={progress} />
        <CameraRig progress={progress} />

        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.75} luminanceSmoothing={0.2} />
          <Vignette darkness={0.7} offset={0.18} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
