import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { scrollStep } from '../scroll.js'

// Hands-free tour for demos: P starts or pauses a steady glide through the whole
// site, + and - change the speed. Scrolling, touching or Esc stops it.
const SPEEDS = [60, 90, 130, 180, 250] // pixels per second
const DEFAULT = 1

export default function AutoScroll() {
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(DEFAULT)
  const [flash, setFlash] = useState(false)
  const state = useRef({ playing: false, speed: DEFAULT, v: 0 })

  useEffect(() => {
    let raf = 0
    let last = 0
    const s = state.current

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      // ease the velocity in and out so starts and stops are smooth
      const target = s.playing ? SPEEDS[s.speed] : 0
      s.v += (target - s.v) * Math.min(1, dt * 3)
      if (s.playing || s.v > 0.5) {
        const max = document.documentElement.scrollHeight - innerHeight
        if (scrollY >= max - 1) {
          setState(false)
        } else {
          scrollStep(s.v * dt)
        }
        raf = requestAnimationFrame(tick)
      } else {
        s.v = 0
        raf = 0
      }
    }
    const run = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const setState = (on) => {
      s.playing = on
      setPlaying(on)
      if (on) run()
    }
    const bump = () => {
      setFlash(true)
      clearTimeout(bump.t)
      bump.t = setTimeout(() => setFlash(false), 1600)
    }

    const key = (e) => {
      const t = e.target
      if (t.closest && t.closest('input, select, textarea, [contenteditable]')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        setState(!s.playing)
        bump()
      } else if (e.key === '+' || e.key === '=') {
        s.speed = Math.min(SPEEDS.length - 1, s.speed + 1)
        setSpeed(s.speed)
        bump()
      } else if (e.key === '-' || e.key === '_') {
        s.speed = Math.max(0, s.speed - 1)
        setSpeed(s.speed)
        bump()
      } else if (e.key === 'Escape' && s.playing) {
        setState(false)
        bump()
      }
    }
    const manual = () => {
      if (s.playing) {
        setState(false)
        bump()
      }
    }

    window.addEventListener('keydown', key)
    window.addEventListener('wheel', manual, { passive: true })
    window.addEventListener('touchstart', manual, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', key)
      window.removeEventListener('wheel', manual)
      window.removeEventListener('touchstart', manual)
    }
  }, [])

  return (
    <AnimatePresence>
      {(playing || flash) && (
        <motion.div
          className="demo-hud"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="demo-hud__count">{playing ? 'Auto scroll' : 'Paused'}</span>
          <span className="demo-hud__label">Speed {speed + 1} / {SPEEDS.length}</span>
          <span className="demo-hud__mode">P to {playing ? 'pause' : 'play'} · + / − speed</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
