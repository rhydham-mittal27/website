import { useEffect, useRef } from 'react'
import { drawGlow } from './glowSprite.js'

const LIFE = 720 // ms a point of the ribbon stays visible
const SPARK_LIFE = 950
const FOLLOW = 0.3 // how quickly the ribbon's head catches the pointer (per 60fps frame)
const MAX_W = 12 // ribbon half-width at the head, px

// A glowing champagne ribbon that follows the cursor on a soft spring, drawn as one
// continuous tapered shape. The tail drifts and shimmers like smoke, the tip breathes,
// and quick moves shed a few sparks. Lives only inside the hero and sleeps when idle.
export default function Trail() {
  const ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let scale = innerWidth < 700 ? 0.6 : 1
    let points = []
    let sparks = []
    let target = null // where the pointer is (null = outside the hero)
    let head = null // where the ribbon's tip is drawn
    let lastT = performance.now()
    let lastMove = 0
    let raf = 0
    let running = false

    const resize = () => {
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      scale = innerWidth < 700 ? 0.6 : 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    // Closed outline of a tapered ribbon through the points (tail -> head)
    const ribbon = (pts, widthAt) => {
      const n = pts.length
      const left = []
      const right = []
      for (let i = 0; i < n; i++) {
        const a = pts[Math.max(0, i - 1)]
        const b = pts[Math.min(n - 1, i + 1)]
        let nx = -(b.y - a.y)
        let ny = b.x - a.x
        const len = Math.hypot(nx, ny) || 1
        nx /= len
        ny /= len
        const w = widthAt(i)
        left.push([pts[i].x + nx * w, pts[i].y + ny * w])
        right.push([pts[i].x - nx * w, pts[i].y - ny * w])
      }
      const side = [...left, ...right.reverse()]
      ctx.beginPath()
      ctx.moveTo(side[0][0], side[0][1])
      for (let i = 1; i < side.length - 1; i++) {
        const mx = (side[i][0] + side[i + 1][0]) / 2
        const my = (side[i][1] + side[i + 1][1]) / 2
        ctx.quadraticCurveTo(side[i][0], side[i][1], mx, my)
      }
      ctx.closePath()
    }

    const frame = (now) => {
      const dt = Math.min(64, now - lastT)
      lastT = now
      const f = dt / 16.67

      // Spring the head toward the pointer and lay a point every frame -> even, smooth curve
      if (target) {
        if (!head) head = { ...target }
        const k = 1 - Math.pow(1 - FOLLOW, f)
        const px = head.x
        const py = head.y
        head.x += (target.x - head.x) * k
        head.y += (target.y - head.y) * k
        const speed = Math.hypot(head.x - px, head.y - py) / f
        if (speed > 0.15) points.push({ x: head.x, y: head.y, t: now })
        // quick moves shed a few sparks
        if (speed > 9 && Math.random() < Math.min(0.9, speed / 40)) {
          sparks.push({
            x: head.x, y: head.y, t: now, r: 0.8 + Math.random() * 1.3,
            vx: -(head.x - px) * 0.05 + (Math.random() - 0.5) * 1.4,
            vy: -(head.y - py) * 0.05 + (Math.random() - 0.5) * 1.4,
          })
        }
      }

      points = points.filter((p) => now - p.t < LIFE)
      sparks = sparks.filter((s) => now - s.t < SPARK_LIFE)
      if (points.length > 90) points.splice(0, points.length - 90)
      if (sparks.length > 70) sparks.splice(0, sparks.length - 70)

      // The tail drifts upward and sways a little, like smoke
      for (const p of points) {
        const age = (now - p.t) / LIFE
        p.y -= 0.18 * age * f
        p.x += Math.sin(p.t * 0.004 + now * 0.002) * 0.12 * age * f
      }

      ctx.clearRect(0, 0, innerWidth, innerHeight)
      ctx.globalCompositeOperation = 'lighter'

      if (points.length > 2) {
        const n = points.length
        const width = (i, mult) => {
          const along = i / (n - 1) // 0 tail -> 1 head
          const life = 1 - (now - points[i].t) / LIFE
          const shimmer = 1 + 0.18 * Math.sin(now * 0.009 - i * 0.55)
          return Math.max(0, MAX_W * scale * mult * Math.pow(along, 1.3) * life * shimmer)
        }
        const tail = points[0]
        const tip = points[n - 1]
        // outer glow
        let g = ctx.createLinearGradient(tail.x, tail.y, tip.x, tip.y)
        g.addColorStop(0, 'rgba(201, 149, 74, 0)')
        g.addColorStop(1, 'rgba(214, 160, 82, 0.42)')
        ribbon(points, (i) => width(i, 1.7))
        ctx.fillStyle = g
        ctx.fill()
        // warm body
        g = ctx.createLinearGradient(tail.x, tail.y, tip.x, tip.y)
        g.addColorStop(0, 'rgba(232, 186, 118, 0)')
        g.addColorStop(1, 'rgba(240, 200, 136, 0.55)')
        ribbon(points, (i) => width(i, 0.85))
        ctx.fillStyle = g
        ctx.fill()
        // bright core
        g = ctx.createLinearGradient(tail.x, tail.y, tip.x, tip.y)
        g.addColorStop(0, 'rgba(255, 236, 196, 0)')
        g.addColorStop(1, 'rgba(255, 244, 222, 0.95)')
        ribbon(points, (i) => width(i, 0.28))
        ctx.fillStyle = g
        ctx.fill()
      }

      // a soft glow breathes at the tip while the pointer is in the hero
      if (head && target) {
        const idle = Math.min(1, (now - lastMove) / 1200)
        const breathe = 1 + 0.12 * Math.sin(now * 0.004)
        drawGlow(ctx, head.x, head.y, 20 * scale * breathe, 0.6 - 0.3 * idle)
      }

      for (const s of sparks) {
        const age = (now - s.t) / SPARK_LIFE
        s.x += s.vx * f
        s.y += s.vy * f
        s.vx *= Math.pow(0.94, f)
        s.vy = s.vy * Math.pow(0.94, f) + 0.025 * f
        drawGlow(ctx, s.x, s.y, s.r * 4 * (1 - age * 0.5), (1 - age) * 0.9)
      }
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1

      const settled = !target || (head && Math.hypot(target.x - head.x, target.y - head.y) < 0.5 && now - lastMove > 1600)
      if (points.length || sparks.length || !settled) {
        raf = requestAnimationFrame(frame)
      } else {
        running = false
        ctx.clearRect(0, 0, innerWidth, innerHeight)
      }
    }

    const wake = () => {
      if (!running) {
        running = true
        lastT = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }

    const point = (cx, cy) => {
      const hero = document.querySelector('.hero')
      if (!hero || cy > hero.getBoundingClientRect().bottom) {
        target = null
        head = null
        return
      }
      target = { x: cx, y: cy }
      lastMove = performance.now()
      wake()
    }
    const move = (e) => {
      if (e.pointerType === 'mouse') point(e.clientX, e.clientY)
    }
    const touchMove = (e) => {
      const t = e.touches[0]
      if (t) point(t.clientX, t.clientY)
    }
    const leave = () => {
      target = null
      head = null
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('touchmove', touchMove, { passive: true })
    window.addEventListener('touchend', leave, { passive: true })
    document.addEventListener('pointerleave', leave)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('touchmove', touchMove)
      window.removeEventListener('touchend', leave)
      document.removeEventListener('pointerleave', leave)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="trail" aria-hidden="true" />
}
