import { useEffect, useRef } from 'react'

// A soft champagne light that trails the cursor across the page (fine pointers only).
export default function Spotlight() {
  const ref = useRef(null)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = ref.current
    if (!fine || reduced) {
      el.style.display = 'none'
      return
    }
    let tx = innerWidth / 2
    let ty = innerHeight / 2
    let x = tx
    let y = ty
    let raf = 0
    const move = (e) => {
      tx = e.clientX
      ty = e.clientY
      el.style.opacity = '1'
      if (!running) {
        running = true
        raf = requestAnimationFrame(tick)
      }
    }
    let running = false
    const tick = () => {
      x += (tx - x) * 0.08
      y += (ty - y) * 0.08
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.5) raf = requestAnimationFrame(tick)
      else running = false
    }
    window.addEventListener('pointermove', move)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
    }
  }, [])

  return <div ref={ref} className="spotlight" aria-hidden="true" />
}
