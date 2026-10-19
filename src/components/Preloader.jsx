import { useEffect, useRef, useState } from 'react'
import { motion, useAnimate, useMotionValue, useMotionValueEvent, useSpring } from 'motion/react'

const EASE = [0.7, 0, 0.2, 1]
const MIN_MS = 2200 // let the mark finish drawing even on a fast connection

// First moment: a hairline drawing of the tower draws itself, the name settles
// in, and a single hairline fills with real load progress. Then it lifts away
// and the hero's film opens behind it. Calls onFinish when it's gone.
export default function Preloader({ progress, onFinish }) {
  const [scope, animate] = useAnimate()
  const target = useMotionValue(0)
  const fill = useSpring(target, { stiffness: 60, damping: 20 })
  const [loaded, setLoaded] = useState(false)
  const [minDone, setMinDone] = useState(false)
  const played = useRef(false)

  useEffect(() => {
    target.set(progress)
  }, [progress, target])

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), MIN_MS)
    return () => clearTimeout(t)
  }, [])

  useMotionValueEvent(fill, 'change', (v) => {
    if (v > 0.995) setLoaded(true)
  })

  useEffect(() => {
    if (!loaded || !minDone || played.current) return
    played.current = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const out = async () => {
      if (!reduced) {
        await animate('.pre__brand', { y: -28, opacity: 0 }, { duration: 0.7, ease: EASE })
      }
      await animate(scope.current, { opacity: 0 }, { duration: reduced ? 0.4 : 0.55, ease: 'easeOut' })
      onFinish()
    }
    out()
  }, [loaded, minDone, animate, scope, onFinish])

  const draw = (delay, duration = 1.3) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { pathLength: { delay, duration, ease: [0.65, 0, 0.35, 1] }, opacity: { delay, duration: 0.2 } },
  })

  return (
    <div ref={scope} className="intro pre" role="status" aria-live="polite" aria-label="Loading The Meridian">
      <div className="pre__brand">
        <svg className="pre__mark" viewBox="0 0 40 100" aria-hidden="true">
          {/* ground, tower, sky deck, crown */}
          <motion.path d="M4 96 H36" {...draw(0.1, 0.7)} />
          <motion.path d="M13 96 V20 H27 V96" {...draw(0.3)} />
          <motion.path d="M10 28 H30" className="pre__gold" {...draw(1.0, 0.6)} />
          <motion.path d="M15 20 V11 H25 V20" className="pre__gold" {...draw(1.2, 0.6)} />
        </svg>
        <motion.p
          className="pre__name"
          initial={{ opacity: 0, letterSpacing: '0.62em' }}
          animate={{ opacity: 1, letterSpacing: '0.34em' }}
          transition={{ delay: 0.5, duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        >
          The Meridian
        </motion.p>
        <div className="pre__line" aria-hidden="true">
          <motion.span style={{ scaleX: fill }} />
        </div>
      </div>
    </div>
  )
}
