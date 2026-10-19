import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

// Leans toward the cursor in 3D with a moving glare. Children fill the frame.
export default function Tilt({ children, className = '', max = 7, ...rest }) {
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const sx = useSpring(px, { stiffness: 150, damping: 18 })
  const sy = useSpring(py, { stiffness: 150, damping: 18 })
  const rotateY = useTransform(sx, [0, 1], [-max, max])
  const rotateX = useTransform(sy, [0, 1], [max, -max])
  const glare = useTransform(
    [sx, sy],
    ([x, y]) => `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255, 236, 200, 0.28), transparent 55%)`,
  )

  const move = (e) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  const leave = () => {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <div className={`tilt ${className}`} onPointerMove={move} onPointerLeave={leave}>
      <motion.div className="tilt__inner" style={{ rotateX, rotateY }} {...rest}>
        {children}
        <motion.span className="tilt__glare" style={{ background: glare }} aria-hidden="true" />
      </motion.div>
    </div>
  )
}
