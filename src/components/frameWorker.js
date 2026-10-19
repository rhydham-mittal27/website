// Hero film renderer, off the main thread (owns an OffscreenCanvas).
//
// Two layers, like adaptive video streaming:
//  1. Instant layer: every frame at 1280px (WebP, ~9 MB total) is downloaded and
//     decoded up front, so scrubbing just draws a ready bitmap.
//  2. 4K layer: the original 3832px frames (AVIF, ~22 MB) stream in behind it,
//     nearest-to-the-viewer first. Frames around the current position are decoded
//     at full screen resolution and replace the instant layer as soon as they're
//     ready. All 219 frames at 4K would need ~7 GB decoded, so only a small window
//     around the playhead is ever held at 4K.

let FRAME_COUNT = 0
let SRC_W = 0
let SRC_H = 0
let loSrc = (i) => i
let hiSrc = (i) => i

const LO_CONCURRENCY = 6
const LO_DECODES = 3
const HI_CONCURRENCY = 4 // 4K downloads in flight
const HI_DECODES = 2 // 4K decodes in flight
const HI_WINDOW = 3 // frames either side of the playhead kept at 4K
const HI_SETTLE_MS = 90 // scroll pause before 4K decoding starts
let hiTimer = 0

let canvas = null
let ctx = null
let target = { w: 0, h: 0, x: 0, y: 0 }
let lowW = 1280
let lowH = 0
let current = 0
let drawQueued = false
let generation = 0


// instant layer
const loBlobs = []
const low = []
const loQueue = []
let loActive = 0
let loDecoded = 0
let loLoaded = 0

// 4K layer
const hiBlobs = []
const hiFetching = new Set()
const hiBmp = new Map() // frame -> bitmap at screen size
const hiDecoding = new Set()
let hiStarted = false
let hiSupported = true
let hiFailures = 0

const nextTick = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (f) => setTimeout(f, 16)

function draw() {
  drawQueued = false
  if (!ctx) return
  let bmp = hiBmp.get(current) || null
  for (let d = 0; d < FRAME_COUNT && !bmp; d++) bmp = low[current - d] || low[current + d] || null
  if (!bmp) return
  ctx.drawImage(bmp, target.x, target.y, target.w, target.h)
}

function requestDraw() {
  if (drawQueued) return
  drawQueued = true
  nextTick(draw)
}

const nearest = (list) => {
  let best = 0
  for (let k = 1; k < list.length; k++) if (Math.abs(list[k] - current) < Math.abs(list[best] - current)) best = k
  return best
}

// ---- instant layer -------------------------------------------------------

function pumpLow() {
  while (loActive < LO_DECODES && loQueue.length) {
    const i = loQueue.splice(nearest(loQueue), 1)[0]
    loActive++
    createImageBitmap(loBlobs[i], { resizeWidth: lowW, resizeHeight: lowH, resizeQuality: 'high' })
      .then((bmp) => {
        low[i] = bmp
        loBlobs[i] = null // the decoded bitmap is all we need
        loDecoded++
        postMessage({ type: 'decoded', count: loDecoded })
        if (Math.abs(i - current) < 8) requestDraw()
      })
      .catch(() => {})
      .finally(() => {
        loActive--
        pumpLow()
      })
  }
}

function loadLow(order) {
  let next = 0
  const one = () => {
    if (next >= order.length) return
    const i = order[next++]
    fetch(loSrc(i))
      .then((r) => r.blob())
      .then((blob) => {
        loBlobs[i] = blob
        loQueue.push(i)
        pumpLow()
        loLoaded++
        // once the coarse pass is in, start streaming 4K alongside
        if (!hiStarted && loLoaded >= Math.ceil(FRAME_COUNT / 8)) startHi()
        one()
      })
      .catch(one)
  }
  for (let k = 0; k < LO_CONCURRENCY; k++) one()
}

// ---- 4K layer ------------------------------------------------------------

function startHi() {
  hiStarted = true
  for (let k = 0; k < HI_CONCURRENCY; k++) fetchHi()
}

// Download the missing 4K frame closest to the playhead, then the next
function fetchHi() {
  if (!hiSupported) return
  let pick = -1
  let best = Infinity
  for (let i = 0; i < FRAME_COUNT; i++) {
    if (hiBlobs[i] || hiFetching.has(i)) continue
    const d = Math.abs(i - current)
    if (d < best) {
      best = d
      pick = i
    }
  }
  if (pick === -1) return
  hiFetching.add(pick)
  fetch(hiSrc(pick))
    .then((r) => (r.ok && (r.headers.get('content-type') || '').startsWith('image/') ? r.blob() : Promise.reject()))
    .then((blob) => {
      hiBlobs[pick] = blob
      if (Math.abs(pick - current) <= HI_WINDOW) pumpHi()
    })
    .catch(() => {})
    .finally(() => {
      hiFetching.delete(pick)
      fetchHi()
    })
}

// Keep the frames around the playhead decoded at screen resolution
function pumpHi() {
  for (const [k, bmp] of hiBmp) {
    if (Math.abs(k - current) > HI_WINDOW + 1) {
      bmp.close()
      hiBmp.delete(k)
    }
  }
  if (!hiSupported || !target.w) return
  const wanted = [current]
  for (let d = 1; d <= HI_WINDOW; d++) wanted.push(current + d, current - d)
  for (const i of wanted) {
    if (hiDecoding.size >= HI_DECODES) return
    if (i < 0 || i >= FRAME_COUNT || hiBmp.has(i) || hiDecoding.has(i) || !hiBlobs[i]) continue
    const gen = generation
    hiDecoding.add(i)
    createImageBitmap(hiBlobs[i], { resizeWidth: target.w, resizeHeight: target.h, resizeQuality: 'high' })
      .then((bmp) => {
        if (gen !== generation || Math.abs(i - current) > HI_WINDOW + 1) return bmp.close()
        hiBmp.set(i, bmp)
        if (i === current) requestDraw()
      })
      .catch(() => {
        // repeated failures mean this browser can't decode AVIF: stay on the instant layer
        hiBlobs[i] = null
        if (++hiFailures >= 3) hiSupported = false
      })
      .finally(() => {
        hiDecoding.delete(i)
        pumpHi()
      })
  }
}

// ---------------------------------------------------------------------------

function resize({ cw, ch }) {
  if (!canvas) return
  canvas.width = cw
  canvas.height = ch
  ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  const scale = Math.min(1, Math.max(cw / SRC_W, ch / SRC_H))
  const w = Math.round(SRC_W * scale)
  const h = Math.round(SRC_H * scale)
  // On portrait screens the tower sits right of centre in the film, so bias the crop toward it.
  const focusX = cw < ch ? 0.56 : 0.5
  target = { w, h, x: Math.round((cw - w) * focusX), y: Math.round((ch - h) / 2) }
  generation++
  for (const bmp of hiBmp.values()) bmp.close()
  hiBmp.clear()
  hiDecoding.clear()
  requestDraw()
  pumpHi()
}

onmessage = ({ data }) => {
  if (data.type === 'init') {
    canvas = data.canvas
    FRAME_COUNT = data.frameCount
    SRC_W = data.srcW
    SRC_H = data.srcH
    lowW = data.lowW
    lowH = Math.round((lowW * SRC_H) / SRC_W)
    const n = (i) => String(i + 1).padStart(4, '0')
    const lo = data.loDir || 'frames-lo', hi = data.hiDir || 'frames-4k', ext = data.hiExt || 'avif'
    loSrc = (i) => `${data.base}/${lo}/f_${n(i)}.webp`
    hiSrc = (i) => `${data.base}/${hi}/f_${n(i)}.${ext}`
    resize(data)
    loadLow(data.order)
  } else if (data.type === 'resize') {
    resize(data)
  } else if (data.type === 'frame') {
    current = data.index
    requestDraw()
    // decode 4K only once scrolling slows, so fast scrubs stay on the light layer
    clearTimeout(hiTimer)
    hiTimer = setTimeout(pumpHi, HI_SETTLE_MS)
  }
}
