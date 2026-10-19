import { places } from '../data.js'
import Reveal from './Reveal.jsx'
import { ReadText } from './textFx.jsx'

export default function Location() {
  return (
    <section className="location" id="location" aria-labelledby="location-title">
      <div className="location__intro">
        <Reveal id="location-title" lines={['Close to the city,', 'with the hills', 'behind you']} />
        <ReadText text="The Meridian sits on the green edge of the city, on the main arterial road, six minutes’ walk from the metro." />
        <address>
          The Meridian Sales Gallery
          <br />
          Plot 14, Sector 21, Hill Road
        </address>
      </div>
      <dl className="location__list">
        {places.map((p) => (
          <div key={p.name} className="place">
            <dt>{p.name}</dt>
            <dd>{p.time}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
