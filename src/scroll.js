// Shared smooth-scroll helpers. Lenis is optional (disabled for reduced motion).
let lenis = null

export const setLenis = (instance) => {
  lenis = instance
}

export const scrollToId = (id) => {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.6 })
  else el.scrollIntoView({ behavior: 'auto' })
}

export const lockScroll = (locked) => {
  document.documentElement.classList.toggle('is-locked', locked)
  if (!lenis) return
  if (locked) lenis.stop()
  else lenis.start()
}


// Move the page by a few pixels right now (used by the continuous auto scroll)
export const scrollStep = (dy) => {
  if (lenis) lenis.scrollTo(lenis.targetScroll + dy, { immediate: true, force: true })
  else window.scrollBy(0, dy)
}
