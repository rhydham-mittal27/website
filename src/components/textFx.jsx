import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

// Scroll-scrubbed text effects. Everything here is driven by a progress
// MotionValue, so it plays forwards and backwards with the scroll.

const seeded = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// ---------------------------------------------------------------------------
// Words that rise and tilt into place one after another, then tip and roll
// away. mode="read" keeps words in place and lights them up instead.

export function ScrubWords({ p, text, inAt, outAt, mode = 'rise', className = '' }) {
  const words = text.split(' ')
  return (
    <span className={`scrub ${className}`} aria-label={text}>
      {words.map((w, i) => (
        <span key={i}>
          <Word p={p} i={i} n={words.length} inAt={inAt} outAt={outAt} mode={mode}>
            {w}
          </Word>{' '}
        </span>
      ))}
    </span>
  )
}

function Word({ p, i, n, inAt: [a0, a1], outAt, mode, children }) {
  const span = a1 - a0
  const s = a0 + span * 0.55 * (i / Math.max(1, n - 1))
  const e = s + span * 0.45
  let os, oe
  if (outAt) {
    const [b0, b1] = outAt
    const ospan = b1 - b0
    os = b0 + ospan * 0.5 * (i / Math.max(1, n - 1))
    oe = os + ospan * 0.5
  }
  const at = outAt ? [s, e, os, oe] : [s, e]
  const pick = (inV, mid, outV) => (outAt ? [inV, mid, mid, outV] : [inV, mid])

  const opacity = useTransform(p, at, mode === 'read' ? pick(0.14, 1, 0) : pick(0, 1, 0))
  const y = useTransform(p, at, mode === 'read' ? pick('0%', '0%', '-30%') : pick('105%', '0%', '-105%'))
  const rotate = useTransform(p, at, mode === 'read' ? pick(0, 0, 0) : pick(9, 0, -7))

  if (mode === 'read') {
    return (
      <motion.span className="scrub__word" style={{ opacity, y }} aria-hidden="true">
        {children}
      </motion.span>
    )
  }
  return (
    <span className="scrub__mask" aria-hidden="true">
      <motion.span className="scrub__word" style={{ opacity, y, rotate }}>
        {children}
      </motion.span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Letters that fly in from scattered positions and assemble the line, then
// leave: "sink" drops them like the towers sinking, "lift" floats them away.

export function AssembleLines({ p, lines, inAt, outAt, exit = 'lift' }) {
  const all = lines.join('')
  let k = 0
  return (
    <span className="assemble" aria-label={lines.join(' ')}>
      {lines.map((line, li) => (
        <span className="assemble__line" key={li} aria-hidden="true">
          {line.split(' ').map((word, wi) => (
            <span className="assemble__word" key={wi}>
              {word.split('').map((ch) => {
                const idx = k++
                return (
                  <Char key={idx} p={p} idx={idx} n={all.length} inAt={inAt} outAt={outAt} exit={exit}>
                    {ch}
                  </Char>
                )
              })}
              {wi < line.split(' ').length - 1 ? ' ' : ''}
            </span>
          ))}
        </span>
      ))}
    </span>
  )
}

function Char({ p, idx, n, inAt: [a0, a1], outAt, exit, children }) {
  const r1 = seeded(idx + 1)
  const r2 = seeded(idx + 101)
  const r3 = seeded(idx + 202)
  const t = idx / Math.max(1, n - 1)

  const span = a1 - a0
  const s = a0 + span * 0.5 * t + span * 0.08 * r1
  const e = Math.min(a1, s + span * 0.42)
  const at = [s, e]
  const xs = [(r1 - 0.5) * 220, 0]
  const ys = [(r2 - 0.5) * 160, 0]
  const rs = [(r3 - 0.5) * 70, 0]
  const os = [0, 1]
  if (outAt) {
    const [b0, b1] = outAt
    const ospan = b1 - b0
    const q0 = b0 + ospan * 0.55 * (exit === 'sink' ? seeded(idx + 303) : t)
    at.push(Math.max(e + 0.0001, q0), Math.max(e + 0.0002, Math.min(b1, q0 + ospan * 0.45)))
    if (exit === 'sink') {
      xs.push(0, 0)
      ys.push(0, 90 + r2 * 60)
      rs.push(0, (r3 - 0.5) * 30)
    } else {
      xs.push(0, (r1 - 0.5) * 120)
      ys.push(0, -70 - r2 * 50)
      rs.push(0, (r3 - 0.5) * 40)
    }
    os.push(1, 0)
  }
  const x = useTransform(p, at, xs)
  const y = useTransform(p, at, ys)
  const rotate = useTransform(p, at, rs)
  const opacity = useTransform(p, at, os)
  return (
    <motion.span className="assemble__ch" style={{ x, y, rotate, opacity }}>
      {children}
    </motion.span>
  )
}

// ---------------------------------------------------------------------------
// Body copy that lights up word by word as it scrolls past.

export function ReadText({ text, className = '', as: Tag = 'p' }) {
  const ref = useRef(null)
  const { scrollYProgress: raw } = useScroll({ target: ref, offset: ['start 0.92', 'end 0.6'] })
  const p = useTransform(raw, (v) => v)
  const words = text.split(' ')
  const MotionTag = motion[Tag] || motion.p
  return (
    <MotionTag ref={ref} className={`readtext ${className}`} aria-label={text}>
      {words.map((w, i) => (
        <ReadWord key={i} p={p} at={[i / words.length, (i + 1.5) / words.length]}>
          {w}
        </ReadWord>
      ))}
    </MotionTag>
  )
}

function ReadWord({ p, at, children }) {
  const opacity = useTransform(p, at, [0.18, 1])
  return (
    <>
      <motion.span style={{ opacity }} aria-hidden="true">
        {children}
      </motion.span>{' '}
    </>
  )
}
