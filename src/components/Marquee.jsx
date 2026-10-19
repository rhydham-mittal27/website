import { useRef } from 'react'
import { motion, useAnimationFrame, useInView, useMotionValue, useScroll, useTransform } from 'motion/react'

// Two quiet rows of very large, light type. Each phrase is followed by a small
// still of what it describes, so the words and the place read together.
// Rows are tied to scroll (forwards/backwards) and drift slowly at rest.
const ROWS = [
  {
    tone: 'bright',
    items: [
      { text: 'The Meridian', img: '/stills/s_0_4.jpg' },
      { text: 'East to the hills', img: '/stills/s_2_4.jpg' },
      { text: 'West to the city lights', img: '/stills/s_9_0.jpg' },
    ],
  },
  {
    tone: 'soft',
    items: [
      { text: 'Glass, stone and bronze', img: '/stills/s_4_4.jpg' },
      { text: 'A reflecting pool at the door', img: '/stills/s_5_6.jpg' },
      { text: 'Four homes to a floor', img: '/stills/s_2_4.jpg' },
    ],
  },
]
const COPIES = 4
const TRAVEL = 1.1 // copies each row travels across the whole scroll
const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Marquee() {
  const ref = useRef(null)
  const { scrollYProgress: raw } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const p = useTransform(raw, (v) => v)
  const live = useInView(ref, { margin: '10% 0px' })

  return (
    <section ref={ref} className="mwall" aria-hidden="true">
      <div className="mwall__sticky">
        <div className="mwall__rows">
          {ROWS.map((row, i) => (
            <Row key={i} p={p} row={row} reverse={i % 2 === 1} live={live} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Row({ p, row, reverse, live }) {
  const copy = 100 / COPIES // % of the track that is one copy of the row
  const span = TRAVEL * copy
  const drift = useMotionValue(0)
  useAnimationFrame((_, delta) => {
    if (reduced || !live) return
    drift.set((drift.get() + (delta / 1000) * 0.25) % copy)
  })
  const x = useTransform([p, drift], ([v, d]) => {
    const moved = (v * span + d) % copy
    return `${reverse ? moved - copy : -moved}%`
  })
  // the stills drift inside their pills, against the row's direction
  const imgX = useTransform(p, [0, 1], reverse ? ['12%', '-12%'] : ['-12%', '12%'])

  return (
    <div className={`mrow mrow--${row.tone}`}>
      <motion.div className="mrow__track" style={{ x }}>
        {Array.from({ length: COPIES }, (_, c) =>
          row.items.map((it, i) => (
            <span key={`${c}-${i}`} className="mrow__item">
              {it.text}
              <span className="mrow__pill">
                <motion.img src={it.img} alt="" style={{ x: imgX }} loading="lazy" />
              </span>
            </span>
          )),
        )}
      </motion.div>
    </div>
  )
}
