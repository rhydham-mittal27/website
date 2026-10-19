import { useEffect, useRef } from 'react'
import { useMotionValueEvent } from 'motion/react'

// Flocks of birds crossing the dusk sky in the opening frame. They flap, glide,
// bob, and fly in loose V formations at different depths. `visibility` (0..1)
// fades them out once the visitor starts scrolling; at 0 the loop stops.
export default function Birds({ visibility }) {
  const ref = useRef(null)
  const state = useRef({ alpha: 1, wake: null })

  useMotionValueEvent(visibility, 'change', (v) => {
    state.current.alpha = v
    if (v > 0 && state.current.wake) state.current.wake()
  })

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let birds = []
    let raf = 0
    let running = false
    let lastT = performance.now()
    let nextFlock = 0
    let flockCount = 0

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const spawnFlock = (first) => {
      const dir = first || flockCount % 3 !== 2 ? 1 : -1 // mostly left to right
      flockCount++
      const n = 4 + Math.floor(Math.random() * 4)
      const depth = 0.55 + Math.random() * 0.6 // bigger = closer
      const speed = (38 + Math.random() * 26) * depth * (w / 1440 + 0.4)
      const leadX = first ? w * (0.08 + Math.random() * 0.12) : dir > 0 ? -60 : w + 60
      const leadY = h * (0.12 + Math.random() * 0.28)
      const gap = 26 * depth * Math.max(0.7, w / 1440)
      for (let i = 0; i < n; i++) {
        // V formation: alternate sides behind the leader, with jitter
        const rank = Math.ceil(i / 2)
        const side = i === 0 ? 0 : i % 2 ? -1 : 1
        const s = (5 + Math.random() * 2.5) * depth * Math.max(0.9, w / 1440)
        birds.push({
          x: leadX - dir * rank * gap * (1 + Math.random() * 0.4),
          y: leadY + side * rank * gap * 0.55 + (Math.random() - 0.5) * gap * 0.4,
          vx: dir * speed * (0.95 + Math.random() * 0.1),
          vy: -speed * (0.02 + Math.random() * 0.05),
          s,
          phase: Math.random() * Math.PI * 2,
          flapRate: 10 + Math.random() * 4,
          glideSeed: Math.random() * 100,
          bob: Math.random() * Math.PI * 2,
          a: 0.35 + depth * 0.3,
        })
      }
    }

    const drawBird = (b, t) => {
      // Glide now and then: flapping amplitude eases toward zero
      const glide = 0.5 + 0.5 * Math.sin(t * 0.6 + b.glideSeed)
      const amp = 0.25 + 0.75 * Math.min(1, glide * 1.6)
      const flap = Math.sin(b.phase) * amp
      const s = b.s
      const tip = flap * s * 0.75
      const x = b.x
      const y = b.y + Math.sin(t * 1.3 + b.bob) * s * 0.35
      // A filled silhouette: swept wings tapering to the tips, small body
      ctx.fillStyle = `rgba(14, 18, 30, ${b.a})`
      ctx.beginPath()
      ctx.moveTo(x - s, y + tip)
      ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.28 - tip * 0.3, x - s * 0.08, y - s * 0.02)
      ctx.lineTo(x + s * 0.08, y - s * 0.02)
      ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.28 - tip * 0.3, x + s, y + tip)
      ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.12 - tip * 0.2, x + s * 0.06, y + s * 0.12)
      ctx.lineTo(x - s * 0.06, y + s * 0.12)
      ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.12 - tip * 0.2, x - s, y + tip)
      ctx.fill()
    }

    const tick = (now) => {
      const dt = Math.min(0.05, (now - lastT) / 1000)
      lastT = now
      const t = now / 1000
      const alpha = state.current.alpha
      if (alpha <= 0) {
        running = false
        ctx.clearRect(0, 0, w, h)
        return
      }
      if (t > nextFlock) {
        spawnFlock(false)
        nextFlock = t + 7 + Math.random() * 6
      }
      ctx.clearRect(0, 0, w, h)
      ctx.globalAlpha = alpha
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (const b of birds) {
        b.phase += b.flapRate * dt
        b.x += b.vx * dt
        b.y += b.vy * dt
        drawBird(b, t)
      }
      ctx.globalAlpha = 1
      birds = birds.filter((b) => b.x > -120 && b.x < w + 120 && b.y > -60)
      raf = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (running) return
      running = true
      lastT = performance.now()
      raf = requestAnimationFrame(tick)
    }
    state.current.wake = wake

    spawnFlock(true)
    nextFlock = performance.now() / 1000 + 5
    wake()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      state.current.wake = null
    }
  }, [])

  return <canvas ref={ref} className="birds" aria-hidden="true" />
}
