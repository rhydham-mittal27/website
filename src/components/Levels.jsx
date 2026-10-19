import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useScroll } from 'motion/react'
import { levels } from '../data.js'
import Reveal from './Reveal.jsx'

const Tower3D = lazy(() => import('./Tower3D.jsx'))

export default function Levels() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [active, setActive] = useState(0)
  const items = useRef([])

  // The item crossing a reading line becomes active. On phones the line sits
  // below the pinned 3D stage (top 55% of the screen) so the active text is visible.
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 900px)').matches
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number(e.target.dataset.i))
      },
      { rootMargin: mobile ? '-62% 0px -30% 0px' : '-45% 0px -45% 0px' },
    )
    items.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} className="levels" id="levels" aria-labelledby="levels-title">
      <div className="levels__stage">
        <div className="levels__canvas">
          <Suspense fallback={<div className="levels__fallback" />}>
            <Tower3D progress={scrollYProgress} band={levels[active].range} />
          </Suspense>
        </div>
      </div>

      <div className="levels__copy">
        <Reveal id="levels-title" lines={['What’s on', 'each level']} />
        <ol className="levels__list">
          {levels.map((l, i) => (
            <li key={l.name} ref={(el) => (items.current[i] = el)} data-i={i} className={`lvl ${i === active ? 'lvl--active' : ''}`} aria-current={i === active ? 'step' : undefined}>
              <span className="lvl__level">{l.level}</span>
              <h3>{l.name}</h3>
              <p>{l.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
