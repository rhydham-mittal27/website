// A soft gold glow rendered once and stamped with drawImage: far cheaper than
// building a radial gradient for every particle on every frame.
let sprite = null

export function glowSprite() {
  if (sprite) return sprite
  const size = 64
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255, 232, 184, 1)')
  g.addColorStop(0.35, 'rgba(228, 185, 106, 0.4)')
  g.addColorStop(1, 'rgba(228, 185, 106, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  sprite = c
  return sprite
}

// Stamp the glow centred on (x, y) with radius r and opacity a.
export function drawGlow(ctx, x, y, r, a) {
  ctx.globalAlpha = a
  ctx.drawImage(glowSprite(), x - r, y - r, r * 2, r * 2)
}
