import { useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useTransform } from 'motion/react'

// ---------------------------------------------------------------------------
// Elevation: a hairline drawing of the tower (62 floors, sky deck, crown).
// A gold marker rides it at the film camera's real level and height.

const ELEV = { top: 30, base: 382, x: 30, w: 22 } // tower body in SVG units
const FLOORS = 62

export function Elevation({ level, topLevel, topMetres, play }) {
  const yAt = (l) => ELEV.base - (l / topLevel) * (ELEV.base - ELEV.top)
  const markerTop = useTransform(level, (l) => `${(yAt(l) / 400) * 100}%`)
  const lvlText = useTransform(level, (l) => String(Math.round(l)).padStart(2, '0'))
  const mText = useTransform(level, (l) => `${Math.round((l / topLevel) * topMetres)} m up`)
  const fillH = useTransform(level, (l) => ELEV.base - yAt(l))
  const fillY = useTransform(level, (l) => yAt(l))

  const draw = (delay) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: play ? { pathLength: 1, opacity: 1 } : {},
    transition: { pathLength: { delay: delay + 1.9, duration: 1.6, ease: [0.65, 0, 0.35, 1] }, opacity: { delay: delay + 1.9, duration: 0.2 } },
  })

  const floors = []
  for (let f = 1; f < FLOORS; f++) {
    const y = yAt(f)
    const major = f % 10 === 0
    floors.push(
      <motion.line
        key={f}
        x1={major ? ELEV.x - 5 : ELEV.x}
        x2={ELEV.x + ELEV.w}
        y1={y}
        y2={y}
        className={major ? 'elev__floor elev__floor--major' : 'elev__floor'}
        initial={{ opacity: 0 }}
        animate={play ? { opacity: 1 } : {}}
        transition={{ delay: 2.5 + (f / FLOORS) * 1.1, duration: 0.3 }}
      />,
    )
  }

  return (
    <div className="elev" aria-hidden="true">
      <p className="elev__caption elev__caption--top">Crown, 228 m</p>
      <div className="elev__stage">
        <svg className="elev__svg" viewBox="0 0 70 400" preserveAspectRatio="xMidYMid meet">
          {/* climbed height, filled gold up to the camera */}
          <motion.rect x={ELEV.x} width={ELEV.w} y={fillY} height={fillH} className="elev__fill" />
          {floors}
          {/* body */}
          <motion.path d={`M${ELEV.x} ${ELEV.base} V${ELEV.top} H${ELEV.x + ELEV.w} V${ELEV.base}`} className="elev__line" {...draw(0.2)} />
          {/* sky deck balustrade, level 60 */}
          <motion.path
            d={`M${ELEV.x - 5} ${yAt(60)} H${ELEV.x + ELEV.w + 5}`}
            className="elev__line elev__line--gold"
            {...draw(1.3)}
          />
          {/* glass crown */}
          <motion.path
            d={`M${ELEV.x + 2} ${ELEV.top} V${ELEV.top - 12} H${ELEV.x + ELEV.w - 2} V${ELEV.top}`}
            className="elev__line elev__line--gold"
            {...draw(1.5)}
          />
          {/* podium and ground */}
          <motion.path d={`M6 ${ELEV.base} V${ELEV.base - 12} H64 V${ELEV.base}`} className="elev__line" {...draw(0.1)} />
          <motion.path d={`M0 ${ELEV.base} H70`} className="elev__line" {...draw(0)} />
        </svg>
        <motion.div className="elev__marker" style={{ top: markerTop }}>
          <i />
          <span className="elev__tag">Level</span>
          <motion.span className="elev__level">{lvlText}</motion.span>
          <motion.span className="elev__m">{mText}</motion.span>
        </motion.div>
      </div>
      <p className="elev__caption">Street level</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// The film's five moments, in order. The current one is lit, and its line
// fills as you scroll through it.

export const FILM_CHAPTERS = [
  { name: 'Dusk over the valley', at: [0, 0.14] },
  { name: 'First light', at: [0.14, 0.34] },
  { name: 'The lobby', at: [0.34, 0.53] },
  { name: 'The reflecting pool', at: [0.53, 0.8] },
  { name: 'The sky deck', at: [0.8, 1] },
]

export function FilmChapters({ p }) {
  const [i, setI] = useState(0)
  useMotionValueEvent(p, 'change', (v) => {
    const k = FILM_CHAPTERS.findIndex(({ at: [a, b] }) => v >= a && (v < b || b === 1))
    if (k !== -1 && k !== i) setI(k)
  })
  return (
    <div className="scene" aria-live="polite">
      <div className="scene__bars" aria-hidden="true">
        {FILM_CHAPTERS.map((c) => (
          <SceneBar key={c.name} p={p} at={c.at} />
        ))}
      </div>
      <div className="scene__name">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={i}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {FILM_CHAPTERS[i].name}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  )
}

function SceneBar({ p, at: [a, b] }) {
  const scaleX = useTransform(p, [a, b], [0, 1], { clamp: true })
  return (
    <span className="scene__bar">
      <motion.i style={{ scaleX }} />
    </span>
  )
}

// ---------------------------------------------------------------------------
// A quiet info bar along the bottom of the hero: how to come and see it.

export function InfoBar() {
  return (
    <div className="infobar">
      <span>Sales gallery open daily, 10 am to 7 pm</span>
      <span>Plot 14, Sector 21, Hill Road</span>
      <span>6 minutes’ walk to Metro Line 2</span>
      <a className="infobar__wa" href="https://wa.me/910000000000" target="_blank" rel="noreferrer">
        Message us on WhatsApp
      </a>
    </div>
  )
}
