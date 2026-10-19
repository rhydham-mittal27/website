import { useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import Reveal from './Reveal.jsx'
import { ReadText } from './textFx.jsx'
import Tilt from './Tilt.jsx'
import { residences } from '../data.js'

export default function Residences() {
  const [active, setActive] = useState(0)
  const home = residences[active]
  const picRef = useRef(null)
  const picInView = useInView(picRef, { once: true, margin: '0px 0px -20% 0px' })

  return (
    <section className="residences" id="residences" aria-labelledby="residences-title">
      <div className="residences__intro">
        <Reveal id="residences-title" lines={['Four ways to live', 'at the Meridian']} />
        <ReadText text="Every home faces two directions and starts at least eight floors above the street. Choose a type to see it." />
      </div>

      <div className="residences__grid">
        <Tilt className="residences__tilt">
        <motion.div
          ref={picRef}
          className="residences__picture"
          data-cursor="View"
          initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
          animate={picInView ? { clipPath: 'inset(0% 0% 0% 0%)' } : {}}
          transition={{ duration: 1.6, ease: [0.76, 0, 0.24, 1] }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.img
              key={home.image}
              src={home.image}
              alt={`${home.name}, artist’s impression`}
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </AnimatePresence>
          <span className="residences__tag">{home.levels}</span>
        </motion.div>
        </Tilt>

        <ul className="residences__list" role="tablist" aria-label="Residence types">
          {residences.map((r, i) => (
            <li key={r.name}>
              <button
                role="tab"
                aria-selected={active === i}
                className={`home ${active === i ? 'home--active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
              >
                <span className="home__name">{r.name}</span>
                <span className="home__facts">
                  <span>{r.size}</span>
                  <span>{r.levels}</span>
                  <span className="home__price">{r.price}</span>
                </span>
                <AnimatePresence initial={false}>
                  {active === i && (
                    <motion.span
                      className="home__note"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <span>{r.note}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
