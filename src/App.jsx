import { useCallback, useEffect, useState } from 'react'
import Lenis from 'lenis'
import { setLenis, lockScroll } from './scroll.js'
import Nav from './components/Nav.jsx'
import Preloader from './components/Preloader.jsx'
import Hero from './components/Hero.jsx'
import Story from './components/Story.jsx'
import Bridge from './components/Bridge.jsx'
import Residences from './components/Residences.jsx'
import Levels from './components/Levels.jsx'
import Marquee from './components/Marquee.jsx'
import Gallery from './components/Gallery.jsx'
import Location from './components/Location.jsx'
import Visit from './components/Visit.jsx'
import Amenities from './components/Amenities.jsx'
import Developer from './components/Developer.jsx'
import Footer from './components/Footer.jsx'
import Cursor from './components/Cursor.jsx'
import Spotlight from './components/Spotlight.jsx'
import Trail from './components/Trail.jsx'
import AutoScroll from './components/AutoScroll.jsx'

export default function App() {
  const [loaded, setLoaded] = useState(0)
  // The site starts once the intro has finished (not just when frames are loaded)
  const [ready, setReady] = useState(false)
  const finishIntro = useCallback(() => setReady(true), [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ autoRaf: true, lerp: 0.075 })
    setLenis(lenis)
    return () => {
      setLenis(null)
      lenis.destroy()
    }
  }, [])

  useEffect(() => {
    lockScroll(!ready)
    document.documentElement.classList.toggle('site-ready', ready)
  }, [ready])

  return (
    <>
      {!ready && <Preloader progress={loaded} onFinish={finishIntro} />}
      <Nav />
      <main>
        <Hero ready={ready} onProgress={setLoaded} />
        <div className="hero-fade" aria-hidden="true" />
        <Story />
        <Bridge />
        <Residences />
        <Amenities />
        <Levels />
        <Marquee />
        <Gallery />
        <Location />
        <Developer />
        <Visit />
      </main>
      <Footer />

      <Spotlight />
      <Trail />
      <Cursor />
      {ready && <AutoScroll />}
    </>
  )
}
