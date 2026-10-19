import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Reveal from './Reveal.jsx'
import { ReadText } from './textFx.jsx'
import { amenities, specs } from '../data.js'
import { scrollToId } from '../scroll.js'

// What the building offers and what it's built from: the two lists a buyer checks.
export default function Amenities() {
  const [tab, setTab] = useState(0)
  const group = amenities[tab]

  const brochure = (e) => {
    e.preventDefault()
    window.dispatchEvent(new CustomEvent('want-brochure'))
    scrollToId('visit')
  }

  return (
    <section className="amenities" id="amenities" aria-labelledby="amenities-title">
      <div className="amenities__intro">
        <Reveal id="amenities-title" lines={['Everything within', 'the building']} />
        <ReadText text="Amenities on the podium and the sky deck, and the specifications behind every home." />
      </div>

      <div className="amenities__grid">
        <div className="amen">
          <div className="amen__tabs" role="tablist" aria-label="Amenity groups">
            {amenities.map((g, i) => (
              <button key={g.group} role="tab" aria-selected={tab === i} className={`amen__tab ${tab === i ? 'is-on' : ''}`} onClick={() => setTab(i)}>
                {g.group}
                {tab === i && <motion.span layoutId="amen-underline" className="amen__underline" />}
              </button>
            ))}
          </div>
          <p className="amen__where">{group.where}</p>
          <AnimatePresence mode="wait">
            <motion.ul
              key={group.group}
              className="amen__list"
              initial="hide"
              animate="show"
              exit="hide"
              variants={{ show: { transition: { staggerChildren: 0.05 } }, hide: {} }}
            >
              {group.items.map((it) => (
                <motion.li
                  key={it.name}
                  variants={{ hide: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="amen__name">{it.name}</span>
                  <span className="amen__detail">{it.detail}</span>
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>

        <div className="specs">
          <h3 className="specs__title">Specifications</h3>
          <dl className="specs__list">
            {specs.map((s) => (
              <div key={s.label} className="spec">
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
          <a href="#visit" className="btn btn--dark specs__cta" onClick={brochure}>
            Get the full brochure
          </a>
        </div>
      </div>
    </section>
  )
}
