import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import CircularGallery from './CircularGallery.jsx'
import Reveal from './Reveal.jsx'
import { gallery } from '../data.js'

const items = gallery.map((g) => ({ image: g.src, text: g.short }))
const pad = (n) => String(n).padStart(2, '0')

// Pinned WebGL gallery (React Bits): page scroll turns it from the first image
// to the last, and the page only moves on once every image has been shown.
export default function Gallery() {
  const ref = useRef(null)
  const { scrollYProgress: raw } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  // Short holds at each end so the first and last images settle in the centre
  const progress = useTransform(raw, [0.06, 0.94], [0, 1], { clamp: true })
  const bar = useTransform(progress, (v) => v)
  const [index, setIndex] = useState(0)

  useMotionValueEvent(progress, 'change', (v) => setIndex(Math.round(v * (items.length - 1))))

  return (
    <section
      ref={ref}
      className="gallery"
      id="gallery"
      aria-labelledby="gallery-title"
      style={{ height: `${100 + items.length * 70}vh` }}
    >
      <div className="gallery__sticky">
        <div className="gallery__head">
          <Reveal id="gallery-title" lines={['From dawn to dusk', 'at the Meridian']} />
          <p>Keep scrolling to move through the gallery. All images are artist’s impressions.</p>
        </div>

        <div className="gallery__stage">
          <CircularGallery
            items={items}
            progress={progress}
            bend={2.2}
            textColor="#ECE5D8"
            borderRadius={0.02}
            font="500 24px 'Manrope Variable'"
            scrollEase={0.08}
          />
        </div>

        <div className="gallery__meter" aria-hidden="true">
          <span className="gallery__count">
            {pad(index + 1)} <i>/ {pad(items.length)}</i>
          </span>
          <span className="gallery__track">
            <motion.span style={{ scaleX: bar }} />
          </span>
          <span className="gallery__caption">{gallery[index].caption}</span>
        </div>
      </div>
    </section>
  )
}
