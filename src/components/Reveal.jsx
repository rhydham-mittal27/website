import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

// Section headline revealed by a beam of light sweeping across each line,
// scrubbed by scroll (like sunlight crossing a façade). Plays back in reverse.
export default function Reveal({ as: Tag = 'h2', lines, className = '', ...rest }) {
  const ref = useRef(null)
  const { scrollYProgress: raw } = useScroll({ target: ref, offset: ['start 0.95', 'start 0.42'] })
  const p = useTransform(raw, (v) => v)
  const MotionTag = motion[Tag] || motion.h2
  return (
    <MotionTag ref={ref} className={`reveal ${className}`} aria-label={lines.join(' ')} {...rest}>
      {lines.map((line, i) => (
        <SweepLine key={i} p={p} i={i} n={lines.length}>
          {line}
        </SweepLine>
      ))}
    </MotionTag>
  )
}

function SweepLine({ p, i, n, children }) {
  const step = n > 1 ? 0.35 / (n - 1) : 0
  const t = useTransform(p, [i * step, i * step + 0.65], [0, 1], { clamp: true })
  const clipPath = useTransform(t, (v) => `inset(-0.25em ${(1 - v) * 100}% -0.25em 0)`)
  const x = useTransform(t, [0, 1], ['-0.35em', '0em'])
  const beamLeft = useTransform(t, (v) => `${v * 100}%`)
  const beamOpacity = useTransform(t, [0, 0.04, 0.9, 1], [0, 1, 1, 0])
  return (
    <span className="reveal__line" aria-hidden="true">
      <motion.span className="reveal__inner" style={{ clipPath, x }}>
        {children}
      </motion.span>
      <motion.i className="reveal__beam" style={{ left: beamLeft, opacity: beamOpacity }} />
    </span>
  )
}
