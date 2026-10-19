# The Meridian v2: scroll-driven 3D site

Built from `../merged.mp4` (Downloads 1.mp4 + 2.mp4 + 3.mp4 joined losslessly, 3832x2164, 24 fps, 9.1 s).
v2 tells a single-tower story: 62 floors, sky deck on level 60, glass crown, reflecting-pool arrival.

React + Vite, `motion` (Framer Motion) for scroll animation, Lenis for smooth scrolling,
React Three Fiber + drei + postprocessing (bloom, vignette) for the 3D tower.

React Bits components (installed with `npx shadcn@latest add @react-bits/<Name>-JS-CSS`, registry in
`components.json`): Magnet (CTA buttons), 
CircularGallery (WebGL gallery), GradualBlur (screen-edge blur), CountUp (figures).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/, deploy to Vercel / Netlify / any static host
```

## How the hero works
The film is split into 219 frames in two layers, drawn by a Web Worker onto a full-screen canvas as you scroll:

- `public/frames-lo/` – 1280px WebP (~9.5 MB). Downloaded and decoded up front, coarse-to-fine, so scrubbing starts almost immediately.
- `public/frames-4k/` – the original 3832px frames as AVIF (~22 MB). Streamed in the background, nearest-to-the-viewer first; frames around the playhead are decoded at screen resolution and replace the 1280px layer.

To swap the video, re-export both layers and update `FRAME_COUNT` / `SRC_W` / `SRC_H` in `Hero.jsx`:
```bash
ffmpeg -i new.mp4 -vf "scale=1280:-2" -c:v libwebp -quality 72 public/frames-lo/f_%04d.webp
ffmpeg -i new.mp4 public/png/f_%04d.png   # then per frame:
ffmpeg -i f_0001.png -c:v libaom-av1 -still-picture 1 -crf 23 -cpu-used 8 -row-mt 1 -tiles 2x2 -pix_fmt yuv420p frames-4k/f_0001.avif
```

When hosting, serve `frames-lo/` and `frames-4k/` from a CDN (Vercel and Cloudflare do this by default) with long cache headers.

## Before launch
- All project facts (name, prices, sizes, levels, address, travel times) are placeholders in `src/data.js` and `Hero.jsx`.
- The site-visit form in `src/components/Visit.jsx` is front-end only. Connect `submit` to the CRM or a form endpoint.
- Add the RERA registration number in `src/components/Footer.jsx`.

## Auto scroll (for demos)
- **P**: start or pause a smooth, continuous scroll through the whole site
- **+ / −**: faster or slower (5 speeds)
- **Esc**, scrolling, or touching the screen stops it

Keys are ignored while typing in the booking form. Speeds are set in `src/components/AutoScroll.jsx`.
