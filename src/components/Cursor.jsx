import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

// Gold dot + trailing ring. Grows over interactive elements; shows a label
// for anything marked with data-cursor="Label". Fine pointers only.
export default function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const [state, setState] = useState({ hover: false, label: '' })
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const rx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.5 })
  const ry = useSpring(y, { stiffness: 380, damping: 32, mass: 0.5 })

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return
    setEnabled(true)
    document.documentElement.classList.add('has-cursor')

    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const over = (e) => {
      const labelled = e.target.closest('[data-cursor]')
      const interactive = e.target.closest('a, button, [role="tab"], select, label')
      const away = !!e.target.closest('.visit, input, select, textarea')
      setState({ hover: !!(labelled || interactive), label: labelled?.dataset.cursor || '', away })
    }
    const leave = () => {
      x.set(-100)
      y.set(-100)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerover', over)
    document.addEventListener('pointerleave', leave)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      document.removeEventListener('pointerleave', leave)
    }
  }, [x, y])

  if (!enabled) return null
  const size = state.label ? 92 : state.hover ? 56 : 34

  return (
    <>
      <motion.div
        className={`cursor-ring ${state.label ? 'cursor-ring--label' : ''}`}
        style={{ x: rx, y: ry }}
        animate={{ width: size, height: size, opacity: state.away ? 0 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        aria-hidden="true"
      >
        {state.label && <span>{state.label}</span>}
      </motion.div>
    </>
  )
}
