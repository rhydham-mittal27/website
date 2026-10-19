import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { scrollToId } from '../scroll.js'
import Magnet from './Magnet.jsx'
import Birds from './Birds.jsx'
import { Elevation, FilmChapters, InfoBar } from './HeroExtras.jsx'
import { ScrubWords } from './textFx.jsx'

// Experiment switch: ?video=v1 plays the original real_estate.mp4 (1920x1080) instead of the v2 film.
const FILMS = {
  v2: { count: 219, w: 3832, h: 2164, loDir: 'frames-lo', hiDir: 'frames-4k', hiExt: 'avif' },
  v1: { count: 219, w: 1920, h: 1080, loDir: 'frames-v1-lo', hiDir: 'frames-v1-hd', hiExt: 'webp' },
}
const FILM = FILMS[new URLSearchParams(location.search).get('video')] || FILMS.v2
const FRAME_COUNT = FILM.count
const SRC_W = FILM.w // full-resolution layer; the light layer is 1280px
const SRC_H = FILM.h
const frameSrc = (i) => `/${FILM.loDir}/f_${String(i + 1).padStart(4, '0')}.webp`

// Download coarse frames first so scrubbing works early, then fill the gaps.
const LOAD_STEPS = [16, 8, 4, 2, 1]
const loadOrder = (() => {
  const seen = new Set()
  const order = []
  for (const step of LOAD_STEPS) {
    for (let i = 0; i < FRAME_COUNT; i += step) {
      if (!seen.has(i)) {
        seen.add(i)
        order.push(i)
      }
    }
  }
  return order
})()
// Mobile keeps a smaller decoded frame cache and skips the 4K enhancement layer.
// This avoids promoting hundreds of large bitmaps on devices with limited memory.
const isMobilePlayback = () => window.matchMedia('(max-width: 700px), (pointer: coarse)').matches
const playbackWidth = () => (isMobilePlayback() ? 640 : Math.min(innerWidth, innerHeight) < 700 || navigator.deviceMemory <= 4 ? 960 : 1280)
const READY_AFTER = Math.ceil(FRAME_COUNT / 16) // first coarse pass is enough to start; the rest streams in
const CONCURRENCY = 6

const TOP_LEVEL = 62
const TOP_METRES = 228

// The film's camera is not a straight climb: an aerial at dusk, down to the
// lobby and reflecting pool, then up to the sky deck. The altimeter follows it.
const CAMERA_PATH = {
  at: [0, 0.3, 0.36, 0.46, 0.66, 0.7, 0.98, 1],
  level: [34, 41, 30, 4, 0, 0, 60, 60],
}

export default function Hero({ ready, onProgress }) {
  const sectionRef = useRef(null)
  const hostRef = useRef(null)
  const canvasRef = useRef(null)
  const worker = useRef(null)
  const frames = useRef([]) // fallback path only
  const current = useRef(0)
  const pending = useRef(false)

  const { scrollYProgress: rawProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })
  // A JS-driven copy keeps every overlay in lockstep with the canvas
  // (motion would otherwise hand some of them to native ScrollTimeline).
  const scrollYProgress = useTransform(rawProgress, (v) => v)

  // Fallback renderer for browsers without OffscreenCanvas
  const draw = useCallback(() => {
    pending.current = false
    const canvas = canvasRef.current
    if (!canvas || worker.current) return
    const idx = current.current
    let img = null
    for (let d = 0; d < FRAME_COUNT && !img; d++) {
      img = frames.current[idx - d] || frames.current[idx + d] || null
    }
    if (!img) return
    const ctx = canvas.getContext('2d')
    const { width: cw, height: ch } = canvas
    const scale = Math.max(cw / SRC_W, ch / SRC_H)
    const w = SRC_W * scale
    const h = SRC_H * scale
    const focusX = cw < ch ? 0.56 : 0.5
    ctx.drawImage(img, (cw - w) * focusX, (ch - h) / 2, w, h)
  }, [])

  const requestDraw = useCallback(() => {
    if (pending.current) return
    pending.current = true
    requestAnimationFrame(draw)
  }, [draw])

  // The 4K frames are downloaded, decoded and drawn in a worker that owns the
  // canvas, so scrubbing the film never blocks the main thread.
  useEffect(() => {
    // A fresh canvas per mount: a canvas can only be handed to a worker once
    const canvas = document.createElement('canvas')
    canvas.className = 'hero__canvas'
    hostRef.current.appendChild(canvas)
    canvasRef.current = canvas
    const mobile = isMobilePlayback()
    const dpr = () => Math.min(window.devicePixelRatio || 1, mobile ? 1 : 2)
    const size = () => ({ cw: Math.round(canvas.clientWidth * dpr()), ch: Math.round(canvas.clientHeight * dpr()) })
    let cancelled = false
    let ro

    if (typeof canvas.transferControlToOffscreen === 'function' && typeof OffscreenCanvas !== 'undefined') {
      const w = new Worker(new URL('./frameWorker.js', import.meta.url), { type: 'module' })
      worker.current = w
      const off = canvas.transferControlToOffscreen()
      w.onmessage = ({ data }) => {
        if (data.type === 'decoded') onProgress(Math.min(1, data.count / READY_AFTER))
      }
      w.postMessage(
        { type: 'init', canvas: off, frameCount: FRAME_COUNT, srcW: SRC_W, srcH: SRC_H, order: loadOrder, base: location.origin, lowW: playbackWidth(), mobile,
          loDir: FILM.loDir, hiDir: FILM.hiDir, hiExt: FILM.hiExt, ...size() },
        [off],
      )
      w.postMessage({ type: 'frame', index: current.current })
      let last = size()
      ro = new ResizeObserver(() => {
        const s = size()
        if (s.cw === last.cw && s.ch === last.ch) return
        last = s
        w.postMessage({ type: 'resize', ...s })
      })
      ro.observe(canvas)
      return () => {
        ro.disconnect()
        w.terminate()
        worker.current = null
        canvas.remove()
      }
    }

    // Fallback: plain images on the main thread
    const resize = () => {
      const s = size()
      canvas.width = s.cw
      canvas.height = s.ch
      requestDraw()
    }
    resize()
    ro = new ResizeObserver(resize)
    ro.observe(canvas)
    let next = 0
    let loaded = 0
    const loadOne = () => {
      if (cancelled || next >= loadOrder.length) return
      const i = loadOrder[next++]
      const img = new Image()
      img.decoding = 'async'
      img.onload = async () => {
        if (cancelled) return
        try {
          frames.current[i] =
            mobile && typeof createImageBitmap === 'function'
              ? await createImageBitmap(img, { resizeWidth: 640, resizeHeight: Math.round((640 * SRC_H) / SRC_W), resizeQuality: 'medium' })
              : img
        } catch {
          frames.current[i] = img
        }
        loaded++
        onProgress(Math.min(1, loaded / READY_AFTER))
        requestDraw()
        loadOne()
      }
      img.onerror = loadOne
      img.src = frameSrc(i)
    }
    for (let k = 0; k < CONCURRENCY; k++) loadOne()
    return () => {
      cancelled = true
      ro.disconnect()
      canvas.remove()
    }
  }, [onProgress, requestDraw])

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const i = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(v * (FRAME_COUNT - 1))))
    if (i !== current.current) {
      current.current = i
      if (worker.current) worker.current.postMessage({ type: 'frame', index: i })
      else requestDraw()
    }
  })

  // The film camera's height, shared by the elevation drawing and the altimeter
  const cameraLevel = useTransform(scrollYProgress, CAMERA_PATH.at, CAMERA_PATH.level)
  // Birds only fly in the opening frame; they fade as soon as scrolling starts
  const birdsVisible = useTransform(scrollYProgress, [0, 0.03], [1, 0])

  // The film leans gently away from the cursor
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const px = useSpring(mx, { stiffness: 60, damping: 20 })
  const py = useSpring(my, { stiffness: 60, damping: 20 })
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const move = (e) => {
      mx.set((e.clientX / innerWidth - 0.5) * -12)
      my.set((e.clientY / innerHeight - 0.5) * -8)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [mx, my])

  return (
    <section ref={sectionRef} className={`hero ${ready ? 'hero--ready' : ''}`} id="top" aria-label="The Meridian, scroll to explore">
      <div className="hero__sticky">
        <div className="hero__copy">
        <div className="hero__beats">
        <Beat p={scrollYProgress} at={[0, 0.13]} variant="title" first>
          <h1 className="hero__title hero__title--film" aria-label="The Meridian">
            <FilmTitle play={ready} />
          </h1>
          <motion.p
            className="hero__lede"
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 2.05, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            A single residential tower at the edge of the hills.
          </motion.p>
        </Beat>

        <WordBeat p={scrollYProgress} at={[0.15, 0.31]} variant="left">
          <h2>
            <ScrubWords p={scrollYProgress} text="First light, above the valley." inAt={[0.15, 0.2]} outAt={[0.26, 0.305]} />
          </h2>
          <p>
            <ScrubWords p={scrollYProgress} mode="read" text="The tower faces east over the valley, so mornings reach your windows across the hills before they reach the city." inAt={[0.165, 0.225]} outAt={[0.265, 0.31]} />
          </p>
        </WordBeat>

        <WordBeat p={scrollYProgress} at={[0.37, 0.52]} variant="left mid">
          <h2>
            <ScrubWords p={scrollYProgress} text="A lobby of glass and stone." inAt={[0.37, 0.42]} outAt={[0.47, 0.515]} />
          </h2>
          <p>
            <ScrubWords p={scrollYProgress} mode="read" text="A triple-height entrance hall in bronze-tinted glass, with the residents’ crest set into the stone." inAt={[0.385, 0.445]} outAt={[0.475, 0.52]} />
          </p>
        </WordBeat>

        <WordBeat p={scrollYProgress} at={[0.55, 0.69]} variant="left low">
          <h2>
            <ScrubWords p={scrollYProgress} text="A reflecting pool at the door." inAt={[0.55, 0.6]} outAt={[0.64, 0.685]} />
          </h2>
          <p>
            <ScrubWords p={scrollYProgress} mode="read" text="A 60-metre reflecting pool lines the drive, with palms on either side and a gold-columned porte-cochère at the door." inAt={[0.565, 0.625]} outAt={[0.645, 0.69]} />
          </p>
        </WordBeat>

        <WordBeat p={scrollYProgress} at={[0.88, 1]} variant="left" last>
          <h2>
            <ScrubWords p={scrollYProgress} text="Sunset from the sky deck." inAt={[0.88, 0.93]} outAt={null} />
          </h2>
          <p>
            <ScrubWords p={scrollYProgress} mode="read" text="A glass-edged terrace wraps the whole sixtieth floor, with a lounge, an observatory and a private dining room." inAt={[0.895, 0.955]} outAt={null} />
          </p>
          <ActionsIn p={scrollYProgress} at={[0.93, 0.96]}>
            <Magnet padding={50} magnetStrength={3}>
              <a href="#visit" className="btn btn--gold" onClick={(e) => (e.preventDefault(), scrollToId('visit'))}>
                Book a site visit
              </a>
            </Magnet>
            <a
              href="#residences"
              className="btn btn--ghost"
              onClick={(e) => (e.preventDefault(), scrollToId('residences'))}
            >
              See the residences
            </a>
          </ActionsIn>
        </WordBeat>

        </div>
        <FilmChapters p={scrollYProgress} />
        </div>

        <Elevation level={cameraLevel} topLevel={TOP_LEVEL} topMetres={TOP_METRES} play={ready} />

        <motion.div
          className="hero__frame"
          aria-hidden="true"
          initial={{ clipPath: 'inset(24% 31% 24% 51% round 18px)' }}
          animate={ready ? { clipPath: 'inset(0% 0% 0% 0% round 0px)' } : {}}
          transition={{ duration: 1.8, ease: [0.7, 0, 0.2, 1], delay: 0.05 }}
        >
          <motion.div className="hero__media" style={{ x: px, y: py }}>
            <motion.div
              className="hero__push"
              initial={{ scale: 1.32 }}
              animate={ready ? { scale: 1 } : {}}
              transition={{ duration: 2.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            >
              <div ref={hostRef} className="hero__canvas-host" />
              <Birds visibility={birdsVisible} />
            </motion.div>
          </motion.div>
          <div className="hero__shade" />
          <Altimeter p={scrollYProgress} />
        </motion.div>

        <InfoBar />
      </div>
    </section>
  )
}

// A text moment whose words animate themselves; the block only toggles visibility
function WordBeat({ p, at: [a, b], variant, last, children }) {
  const visibility = useTransform(p, (v) => (v >= a - 0.005 && (last || v <= b + 0.005) ? 'visible' : 'hidden'))
  const pointerEvents = useTransform(p, (v) => (v >= a + 0.05 && (last || v <= b - 0.05) ? 'auto' : 'none'))
  return (
    <motion.div className={`beat ${variant.split(' ').map((v) => `beat--${v}`).join(' ')}`} style={{ visibility, pointerEvents }}>
      {children}
    </motion.div>
  )
}

function ActionsIn({ p, at, children }) {
  const opacity = useTransform(p, at, [0, 1])
  const y = useTransform(p, at, [24, 0])
  return (
    <motion.div className="hero__actions" style={{ opacity, y }}>
      {children}
    </motion.div>
  )
}

function Beat({ p, at: [a, b], variant, first, last, children }) {
  const fade = 0.035
  const opacity = useTransform(
    p,
    first ? [0, b - fade, b] : last ? [a, a + fade] : [a, a + fade, b - fade, b],
    first ? [1, 1, 0] : last ? [0, 1] : [0, 1, 1, 0],
  )
  const y = useTransform(p, first ? [0, b] : [a, last ? a + 0.08 : b], first ? [0, -80] : last ? [50, 0] : [50, -50])
  const pointerEvents = useTransform(opacity, (o) => (o > 0.6 ? 'auto' : 'none'))
  const visibility = useTransform(opacity, (o) => (o < 0.01 ? 'hidden' : 'visible'))

  return (
    <motion.div className={`beat ${variant.split(' ').map((v) => `beat--${v}`).join(' ')}`} style={{ opacity, y, pointerEvents, visibility }}>
      {children}
    </motion.div>
  )
}

const TITLE_LINES = ['The', 'Meridian']
// Hero title: Unbounded, a wide architectural display face
const TITLE_FONT = (px) => `800 ${px}px "Unbounded Variable", "Manrope Variable", sans-serif`

// The hero title: solid white display type, sized to fill the copy column.
function FilmTitle({ play }) {
  const wrapRef = useRef(null)
  const [m, setM] = useState(null)

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    let alive = true
    const measure = () => {
      const ctx = document.createElement('canvas').getContext('2d')
      ctx.font = TITLE_FONT(100)
      ctx.letterSpacing = '-1.5px'
      const widest = Math.max(...TITLE_LINES.map((t) => ctx.measureText(t).width))
      const asc = ctx.measureText('M').actualBoundingBoxAscent / 100
      // Fit the column width, and leave room in the slot for the lede below
      const slot = wrap.closest('.hero__beats')
      const room = slot ? slot.clientHeight * 0.3 : innerHeight * 0.2
      const fs = Math.min((wrap.clientWidth / widest) * 100 * 0.98, room)
      const lineH = fs * 0.9
      const y = TITLE_LINES.map((_, i) => asc * fs + i * lineH)
      if (alive) setM({ fs, y, asc: asc * fs, h: Math.ceil(y[y.length - 1] + fs * 0.08) })
    }
    document.fonts.load(TITLE_FONT(100)).then(measure, measure)
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    const slot = wrap.closest('.hero__beats')
    if (slot) ro.observe(slot)
    return () => {
      alive = false
      ro.disconnect()
    }
  }, [])

  return (
    <span ref={wrapRef} className="film-title" style={{ minHeight: m ? undefined : '1.8em' }} aria-hidden="true">
      <motion.span
        className="film-title__clip"
        initial={{ clipPath: 'inset(100% 0% -10% 0%)', y: 46 }}
        animate={play ? { clipPath: 'inset(-10% 0% -10% 0%)', y: 0 } : {}}
        transition={{ delay: 1.15, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {m &&
          TITLE_LINES.map((t, i) => (
            <span
              key={t}
              className="film-title__line"
              style={{ font: TITLE_FONT(m.fs), letterSpacing: `${-0.015 * m.fs}px` }}
            >
              {t}
            </span>
          ))}
      </motion.span>
    </span>
  )
}

// Tracks the camera's height in the film: level and metres above the street.
function Altimeter({ p }) {
  const lvl = useTransform(p, CAMERA_PATH.at, CAMERA_PATH.level)
  const level = useTransform(lvl, (v) => String(Math.round(v)).padStart(2, '0'))
  const metres = useTransform(lvl, (v) => `${Math.round((v / TOP_LEVEL) * TOP_METRES)} m`)
  const markerBottom = useTransform(lvl, (v) => `${(v / TOP_LEVEL) * 100}%`)
  const fill = useTransform(lvl, (v) => v / TOP_LEVEL)

  return (
    <div className="alti" aria-hidden="true">
      <div className="alti__readout">
        <span className="alti__label">Level</span>
        <motion.span className="alti__level">{level}</motion.span>
        <motion.span className="alti__metres">{metres}</motion.span>
      </div>
      <div className="alti__track">
        {Array.from({ length: TOP_LEVEL + 1 }, (_, i) => (
          <span key={i} className={`alti__tick ${i % 10 === 0 ? 'alti__tick--major' : ''}`} style={{ bottom: `${(i / TOP_LEVEL) * 100}%` }} />
        ))}
        <motion.span className="alti__fill" style={{ scaleY: fill }} />
        <motion.span className="alti__marker" style={{ bottom: markerBottom }} />
      </div>
    </div>
  )
}
