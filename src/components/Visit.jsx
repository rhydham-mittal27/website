import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { residences } from '../data.js'
import Reveal from './Reveal.jsx'
import Magnet from './Magnet.jsx'

// Front-end only for now: connect `submit` to the CRM or a form endpoint before launch.
export default function Visit() {
  const [sent, setSent] = useState(null)
  const [error, setError] = useState('')
  const [brochure, setBrochure] = useState(false)

  useEffect(() => {
    const want = () => setBrochure(true)
    window.addEventListener('want-brochure', want)
    return () => window.removeEventListener('want-brochure', want)
  }, [])

  const submit = (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget))
    if (!/^[+\d][\d\s-]{7,}$/.test(data.phone.trim())) {
      setError('Enter a phone number with at least 8 digits so we can call you to confirm.')
      return
    }
    setError('')
    setSent(data)
  }

  return (
    <section className="visit" id="visit" aria-labelledby="visit-title">
      <div className="visit__intro">
        <Reveal id="visit-title" lines={['See the tower', 'in person']} />
        <p>
          Visits run daily from 10 am to 7 pm and take about an hour, including the show apartment and the
          podium gardens.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="done"
            className="visit__done"
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3>Visit requested</h3>
            <p>
              Thank you, {sent.name.split(' ')[0]}. Our sales team will call {sent.phone} within one working day
              to confirm your time.
            </p>
            <button className="btn btn--ghost" onClick={() => setSent(null)}>
              Request another visit
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" className="visit__form" onSubmit={submit} exit={{ opacity: 0, y: -10 }} noValidate={false}>
            <label>
              <span>Full name</span>
              <input name="name" required autoComplete="name" />
            </label>
            <label>
              <span>Phone</span>
              <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" aria-invalid={!!error} aria-describedby={error ? 'phone-error' : undefined} />
            </label>
            <label>
              <span>Preferred date</span>
              <input name="date" type="date" required min={new Date().toISOString().slice(0, 10)} />
            </label>
            <label>
              <span>Interested in</span>
              <select name="type" defaultValue={residences[0].name}>
                {residences.map((r) => (
                  <option key={r.name}>{r.name}</option>
                ))}
                <option>Not sure yet</option>
              </select>
            </label>
            <label className="visit__check">
              <input type="checkbox" name="brochure" checked={brochure} onChange={(e) => setBrochure(e.target.checked)} />
              <span>Also send me the brochure and floor plans on WhatsApp</span>
            </label>
            {error && (
              <p className="visit__error" id="phone-error" role="alert">
                {error}
              </p>
            )}
            <Magnet padding={40} magnetStrength={4} wrapperClassName="visit__submit-wrap">
              <button type="submit" className="btn visit__submit">
                Request a site visit
              </button>
            </Magnet>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  )
}
