import { lazy, Suspense, useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { CAMERA, CHAPTERS, keyframe } from './storyPath.js'
import { AssembleLines } from './textFx.jsx'

const StoryScene = lazy(() => import('./StoryScene.jsx'))

const chapters = [
  { at: CHAPTERS.rise, lines: ['Most towers here', 'share their plot.'] },
  { at: CHAPTERS.clear, lines: ['The Meridian stands', 'alone on four acres.'] },
  { at: CHAPTERS.views, lines: ['Hills to the east.', 'The city to the west.'] },
  { at: CHAPTERS.light, lines: ['Four homes to a floor,', 'and light on every side.'], last: true },
]

const figures = [
  { to: 228, unit: 'm', label: 'from the street to the crown' },
  { to: 62, unit: '', label: 'floors' },
  { to: 183, unit: '', label: 'homes, never more than four to a floor' },
  { to: 4, unit: 'acres', label: 'of private grounds' },
]

// A pinned, scroll-driven 3D sequence that acts out why the tower stands alone.
export default function Story() {
  const ref = useRef(null)
  const { scrollYProgress: raw } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const p = useTransform(raw, (v) => v)

  return (
    <section ref={ref} className="story" aria-label="Why the Meridian stands alone">
      <div className="story__sticky">
        <div className="story__canvas">
          <Suspense fallback={null}>
            <StoryScene progress={p} />
          </Suspense>
        </div>
        <div className="story__shade" aria-hidden="true" />

        <div className="story__chapters">
          {chapters.map((c, i) => (
            <Chapter key={i} p={p} index={i} {...c} />
          ))}
        </div>

        <Rail p={p} />
        <Compass p={p} />
        <Figures p={p} />
      </div>
    </section>
  )
}

function Chapter({ p, at: [a, b], lines, last, index }) {
  const visibility = useTransform(p, (v) => (v >= a - 0.005 && (last || v <= b + 0.005) ? 'visible' : 'hidden'))
  return (
    <motion.h2 className="chapter" style={{ visibility }}>
      <AssembleLines
        p={p}
        lines={lines}
        inAt={[a, a + Math.min(0.1, (b - a) * 0.5)]}
        outAt={last ? null : [b - 0.06, b]}
        exit={index === 0 ? 'sink' : 'lift'}
      />
    </motion.h2>
  )
}

// Four segments, one per chapter, filling as you scroll.
function Rail({ p }) {
  return (
    <div className="story__rail" aria-hidden="true">
      {Object.values(CHAPTERS).map(([a, b], i) => (
        <RailSegment key={i} p={p} a={a} b={b} />
      ))}
    </div>
  )
}

function RailSegment({ p, a, b }) {
  const scaleY = useTransform(p, [a, b], [0, 1])
  return (
    <span className="rail__seg">
      <motion.i style={{ scaleY }} />
    </span>
  )
}

// Dial that turns with the 3D camera, so east and west stay honest.
function Compass({ p }) {
  const rotate = useTransform(p, (v) => (keyframe(v, CAMERA.at, CAMERA.angle) * 180) / Math.PI)
  const opacity = useTransform(p, [CHAPTERS.clear[1] - 0.04, CHAPTERS.views[0]], [0, 1])
  return (
    <motion.div className="compass" style={{ opacity }} aria-hidden="true">
      <motion.div className="compass__dial" style={{ rotate }}>
        <span className="compass__n">N</span>
        <span className="compass__e">E</span>
        <span className="compass__s">S</span>
        <span className="compass__w">W</span>
      </motion.div>
      <i className="compass__needle" />
    </motion.div>
  )
}

function Figures({ p }) {
  const [a, b] = CHAPTERS.light
  const opacity = useTransform(p, [a, a + 0.05], [0, 1])
  const y = useTransform(p, [a, a + 0.08], [40, 0])
  return (
    <motion.dl className="story__figures" style={{ opacity, y }}>
      {figures.map((f, i) => (
        <Figure key={f.label} p={p} a={a + i * 0.02} b={b - 0.03} {...f} />
      ))}
    </motion.dl>
  )
}

function Figure({ p, a, b, to, unit, label }) {
  const value = useTransform(p, [a, b], [0, to], { clamp: true })
  const text = useTransform(value, (v) => String(Math.round(v)))
  return (
    <div className="sfig">
      <dt>{label}</dt>
      <dd>
        <motion.span>{text}</motion.span>
        {unit && <span className="sfig__unit">{unit}</span>}
      </dd>
    </div>
  )
}
