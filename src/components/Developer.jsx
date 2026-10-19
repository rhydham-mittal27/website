import Reveal from './Reveal.jsx'
import { ReadText } from './textFx.jsx'
import { developer } from '../data.js'

// Who is building it: the track record a buyer weighs before the brochure.
export default function Developer() {
  return (
    <section className="developer" id="developer" aria-labelledby="developer-title">
      <div className="developer__intro">
        <p className="developer__by">Developed by</p>
        <Reveal id="developer-title" lines={[developer.name]} />
        <ReadText className="developer__text" text={developer.text} />
      </div>
      <dl className="developer__facts">
        {developer.facts.map((f) => (
          <div key={f.label} className="dfact">
            <dd>{f.value}</dd>
            <dt>{f.label}</dt>
          </div>
        ))}
      </dl>
      <ul className="developer__past" aria-label="Completed projects">
        {developer.past.map((p) => (
          <li key={p.name}>
            <span className="past__name">{p.name}</span>
            <span className="past__meta">{p.meta}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
