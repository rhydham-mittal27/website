import { useEffect, useState } from 'react'
import { motion, useScroll, useMotionValueEvent, useSpring } from 'motion/react'
import { scrollToId } from '../scroll.js'
import Magnet from './Magnet.jsx'

const links = [
  ['residences', 'Residences'],
  ['amenities', 'Amenities'],
  ['levels', 'Levels'],
  ['gallery', 'Gallery'],
  ['location', 'Location'],
]

// Floating glass bar: tower mark + name, a pill that follows the section you're
// in, and a thin progress line along its lower edge.
export default function Nav() {
  const { scrollY, scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40 })
  const [compact, setCompact] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [active, setActive] = useState(null)
  const [hover, setHover] = useState(null)

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setHidden(y > prev + 2 && y > 600)
    setCompact(y > 80)
  })

  // The section crossing the middle of the screen is the active one
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    const ids = ['top', ...links.map(([id]) => id), 'developer', 'visit']
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  const go = (id) => (e) => {
    e.preventDefault()
    scrollToId(id)
  }

  const pill = hover ?? (links.some(([id]) => id === active) ? active : null)

  return (
    <motion.header
      className={`nav ${compact ? 'nav--compact' : ''}`}
      animate={{ y: hidden ? '-140%' : '0%' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="nav__bar">
        <a href="#top" className="nav__brand" onClick={go('top')} aria-label="The Meridian, back to top">
          <svg className="nav__logo" viewBox="0 0 40 100" aria-hidden="true">
            <path d="M4 96 H36" />
            <path d="M13 96 V20 H27 V96" />
            <path d="M10 28 H30" className="gold" />
            <path d="M15 20 V11 H25 V20" className="gold" />
          </svg>
          <span className="nav__name">The Meridian</span>
        </a>

        <nav aria-label="Sections" onMouseLeave={() => setHover(null)}>
          <ul className="nav__links">
            {links.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={go(id)}
                  onMouseEnter={() => setHover(id)}
                  className={`nav__link ${active === id ? 'is-active' : ''}`}
                  aria-current={active === id ? 'location' : undefined}
                >
                  {pill === id && (
                    <motion.span
                      layoutId="nav-pill"
                      className="nav__pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  )}
                  <span className="nav__label">{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Magnet padding={30} magnetStrength={5}>
          <a href="#visit" className="nav__cta" onClick={go('visit')}>
            <span className="nav__dot" aria-hidden="true" />
            Book a site visit
          </a>
        </Magnet>

        <motion.span className="nav__progress" style={{ scaleX: progress }} aria-hidden="true" />
      </div>
    </motion.header>
  )
}
