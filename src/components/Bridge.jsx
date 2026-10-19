import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

// Zoom-on-scroll: a small window on the sky deck opens to full bleed,
// through the giant level number.
export default function Bridge() {
  const ref = useRef(null)
  const { scrollYProgress: raw } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const p = useTransform(raw, (v) => v)

  const clipPath = useTransform(p, [0, 0.55], ['inset(24% 34% 24% 34% round 6px)', 'inset(0% 0% 0% 0% round 0px)'])
  const scale = useTransform(p, [0, 0.7], [1.35, 1])
  const numberY = useTransform(p, [0, 0.55], ['0%', '-12%'])
  const numberOpacity = useTransform(p, [0.35, 0.55], [1, 0])
  const textOpacity = useTransform(p, [0.6, 0.72], [0, 1])
  const textY = useTransform(p, [0.6, 0.8], [40, 0])
  const shade = useTransform(p, [0.5, 0.75], [0, 1])

  return (
    <section ref={ref} className="bridge" aria-labelledby="bridge-title">
      <div className="bridge__sticky">
        <motion.p className="bridge__number" style={{ y: numberY, opacity: numberOpacity }} aria-hidden="true">
          60
        </motion.p>
        <motion.div className="bridge__frame" style={{ clipPath }}>
          <motion.img src="/stills/s_9_0.jpg" alt="The glass-edged sky deck at sunset, artist’s impression" style={{ scale }} />
          <motion.div className="bridge__shade" style={{ opacity: shade }} />
        </motion.div>
        <motion.div className="bridge__copy" style={{ opacity: textOpacity, y: textY }}>
          <p className="bridge__level">Level 60</p>
          <h2 id="bridge-title">A terrace around the whole sixtieth floor.</h2>
          <p>
            Glass balustrades and no columns, so nothing stands between you and the hills. Residents book the
            private dining room for up to twelve guests.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
