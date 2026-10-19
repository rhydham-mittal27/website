import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

const MARK = 'The Meridian'

export default function Footer() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  return (
    <footer className="footer">
      <div className="footer__cols">
        <p>
          Sales gallery: Plot 14, Sector 21, Hill Road
          <br />
          Open daily, 10 am to 7 pm
        </p>
        <p>
          RERA registration no. to be added
          <br />© {new Date().getFullYear()} The Meridian
        </p>
      </div>
      <p ref={ref} className="footer__mark" aria-label={MARK}>
        {MARK.split('').map((ch, i) => (
          <span className="split__mask" key={i} aria-hidden="true">
            <motion.span
              className="split__char"
              initial={{ y: '105%' }}
              animate={inView ? { y: '0%' } : {}}
              transition={{ duration: 1.2, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            >
              {ch === ' ' ? ' ' : ch}
            </motion.span>
          </span>
        ))}
      </p>
      <p className="footer__legal">
        All images and films are artist’s impressions and are indicative only. Specifications, sizes and prices
        are subject to change and do not form part of any offer or contract.
      </p>
    </footer>
  )
}
