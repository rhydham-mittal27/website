// Shared timeline for the "Stands alone" story: the 3D scene and the DOM overlay
// both read these so the camera, chapters and compass stay in sync.

export const CHAPTERS = {
  rise: [0, 0.2], // the crowded city rises
  clear: [0.22, 0.45], // neighbours sink, the Meridian grows, boundary draws
  views: [0.47, 0.68], // camera sweeps: sunrise east, city lights west
  light: [0.7, 0.97], // floors light up, figures count
}

// Camera keyframes over scroll progress
export const CAMERA = {
  at: [0, 0.2, 0.45, 0.5, 0.68, 0.72, 1],
  angle: [-0.4, -0.55, -0.95, -1.5, 1.5, 1.15, 0.65],
  radius: [30, 25, 17, 15, 15, 11.5, 9],
  height: [19, 14, 9, 5.5, 5.5, 3.2, 2.2],
  lookY: [1, 2, 3.6, 4, 4, 5.2, 6.8],
  // Shifts the framing so the tower sits right of centre, clear of the headline
  side: [3.5, 3.5, 2.6, 2.4, 2.4, 2.4, 2.7],
}

export const clamp01 = (v) => Math.min(1, Math.max(0, v))
export const range = (p, a, b) => clamp01((p - a) / (b - a))
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const lerp = (a, b, t) => a + (b - a) * t

// Piecewise interpolation with easing inside each segment
export function keyframe(p, at, values) {
  if (p <= at[0]) return values[0]
  for (let i = 1; i < at.length; i++) {
    if (p <= at[i]) return lerp(values[i - 1], values[i], ease(range(p, at[i - 1], at[i])))
  }
  return values[values.length - 1]
}
