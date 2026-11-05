import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { cx } from './cx'
import { GLASS_RIM, drawCover, filterColor, filterGlassColor, filterGlow } from './filterColor'
import FluidGlass from './FluidGlass'
import { GlassRim } from './GlassRim'
import { defaultGlassTuning, photoGlass } from './promptGlass'
import type { GlassTuning } from './promptGlass'
import { useGlassBackdrop } from './useGlassBackdrop'
import { useScrollNudge } from './useScrollNudge'
import type { CloudCategory } from './PhotoCloud'

// Built like the Archive's opened photos (ArchiveSelected, Figma 236:234), at
// any size: Fluid Glass draws its lens a bit wider than the size it's given
// and fills 72% of its canvas, so a lens of 305/342 of the circle lands on it
const LENS = 305 / 342
// Let the stationary lens bleed under the fixed rim. Its curved edge and
// idle morph otherwise expose a strip of the unfiltered photo, especially
// on the smaller onboarding orbs. The overlay mask keeps the outside clean.
const RIM_BLEED = 1.06
// The whole photo shows through the lens (it magnifies the middle), with a
// full-bleed copy behind it for the glass to bend at the rim
const PHOTO = 0.5
// Moving, how much of the box the photo's middle square covers. The lens
// magnifies about 1.4x: at 0.5 the whole width shows but reads small, at 0.7
// only the middle half shows (Nov 5: 0.65, between them). Past the square the
// rest of the shot and a blurred copy carry on (drawPadded), so a drag never
// shows bare page
const SPOTLIGHT = 0.65
// The glass stops a few points inside the rim, so its edge can't darken it
const INSET = 3
// Moving, room above and below the glass to travel, as on Today
const DRAG_ROOM = 240
// How long the color takes to come in (the glass's rim tint and the glow)
const COLOR_IN_MS = 1000
// How long the glass and rim take to fade when it's leaving (Reflection
// shrinks the orb over the same time)
export const DISSOLVE_MS = 900

// A photo as an orb (Real-life's reflection page and the Archive's opened
// photos): the photo under liquid glass in a fixed glass rim. Once `category`
// is set, its filter color comes in the same way as on the Archive's opened
// photos (shared in filterColor): the glass tints its rim and the color glows
// in from the edge, easing in. `dissolve` gently fades the glass and the rim,
// leaving the photo and its glow. `glass` false holds off drawing the glass
// (ArchiveSelected, while the circle grows in from the cloud).
// `moves` makes it Today's moving orb (Keller, Oct 21), with the same `tuning`
// and set up like it: it gives when dragged and springs back, breathes,
// wobbles, spins and is nudged by scrolling; it sits above the rest of the
// page and bends whatever it passes over (the page is rasterized behind it,
// useGlassBackdrop, inside the nearest data-glass-scene); and the glass itself
// is the photo's only mask (no rim): the photo, bleeding past the glass's
// edge, stays put on the page while the glass moves over it like a spotlight.
// Give its wrapper a z-index so the glass stays above what follows it.
// `idle` false stops it moving on its own (no breathe, wobble or spin; the
// Archive's opened photos, Keller Oct 21); it still gives when dragged.
export function PhotoOrb({
  src,
  size,
  category,
  dissolve = false,
  moves = false,
  glass = true,
  idle = true,
  tuning = defaultGlassTuning,
  surround,
  style,
  className,
}: {
  src: string
  size: number
  category: CloudCategory | null
  dissolve?: boolean
  moves?: boolean
  glass?: boolean
  idle?: boolean
  tuning?: GlassTuning
  // The camera's whole frame around the photo (Real-life's captures), so a
  // drag shows real photo past the shot
  surround?: Surround
  style?: CSSProperties
  className?: string
}) {
  const box = Math.ceil((size + 4) / 0.72)
  // Moving, the canvas has Today's room above and below for the glass to travel
  const height = moves ? box + DRAG_ROOM * 2 : box
  const mask = `radial-gradient(circle at 50% 50%, black ${size / 2 - INSET - 1}px, transparent ${size / 2 - INSET}px)`
  const picture = usePicture(src, box, height, surround)
  const [glassReady, setGlassReady] = useState(false)
  const rim = useEased(category ? GLASS_RIM : 0, COLOR_IN_MS)
  // The color stays once it's in, so it can ease out instead of vanishing
  const [shown, setShown] = useState<CloudCategory | null>(category)
  if (category && category !== shown) setShown(category)
  const color = shown ? filterColor(shown) : null
  // The color fills a circle up to where the rim starts (Figma: 329 of 342)
  const glow = size - 13
  const root = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const push = useScrollNudge(root, moves)
  const backdrop = useGlassBackdrop(overlay, box, height, moves && glass)

  return (
    <div ref={root} className={cx('relative shrink-0', className)} style={{ width: size, height: size, ...style }}>
      {/* The plain photo until the glass is drawn, and after it dissolves */}
      <div
        aria-hidden
        data-html2canvas-ignore
        className={cx('absolute overflow-hidden rounded-full transition-opacity duration-500', moves && glassReady && !dissolve && 'opacity-0')}
        style={{ inset: INSET }}
      >
        {/* Moving, cropped the way the glass shows the photo at rest */}
        <img src={src} alt="" draggable={false} className="size-full object-cover" style={{ scale: moves ? SPOTLIGHT / PHOTO : undefined }} />
      </div>
      <div
        ref={overlay}
        data-glass-overlay
        data-html2canvas-ignore
        className={cx('absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity ease-out', moves && 'pointer-events-none z-20')}
        style={{ width: box, height, ...(moves ? {} : { maskImage: mask, WebkitMaskImage: mask }), opacity: glassReady && !dissolve ? 1 : 0, transitionDuration: `${dissolve ? DISSOLVE_MS : 500}ms` }}
      >
        {picture && glass && (
          <FluidGlass
            // Set up again when switching, so the new motion takes hold
            key={moves ? 'moves' : 'still'}
            canvas={picture}
            text=""
            {...photoGlass(tuning, moves)}
            {...(idle ? {} : { breathe: 0, wobble: 0, spin: 0 })}
            clipToGlass={moves}
            backdrop={backdrop}
            // Paper wherever neither the photo nor the page covers
            background={moves ? paper() : undefined}
            shape="lens"
            size={size * LENS * (moves ? 1 : RIM_BLEED)}
            color={shown ? filterGlassColor(shown) : '#ffffff'}
            rim={rim}
            intro={false}
            pushRef={push}
            onReady={() => setGlassReady(true)}
          />
        )}
      </div>
      <span
        aria-hidden
        data-html2canvas-ignore
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity ease-out"
        // Moving, the glass's rim carries the color; the glow comes back with
        // the plain photo as it dissolves
        style={{ width: glow, height: glow, opacity: category && (!moves || dissolve) ? 1 : 0, background: color ? filterGlow(color) : undefined, transitionDuration: `${COLOR_IN_MS}ms` }}
      />
      {!moves && (
        <span
          aria-hidden
          className="absolute inset-0 transition-opacity ease-in-out"
          style={{ opacity: dissolve ? 0 : 1, transitionDuration: `${DISSOLVE_MS}ms` }}
        >
          <GlassRim size={size} />
        </span>
      )}
    </div>
  )
}

const paper = () => getComputedStyle(document.documentElement).getPropertyValue('--color-baton-paper').trim()

// A number that eases to its target over `ms` instead of jumping (the glass
// takes its props as they are, so its rim tint would otherwise snap in)
function useEased(target: number, ms: number) {
  const [value, setValue] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = performance.now()
    const begin = from.current
    let frame = requestAnimationFrame(function step(now) {
      const k = Math.min(1, (now - start) / ms)
      const next = begin + (target - begin) * (1 - (1 - k) ** 3)
      from.current = next
      setValue(next)
      if (k < 1) frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [target, ms])
  return value
}

// The camera's whole frame around a photo, and where the photo sits in it
export type Surround = { src: string; crop: { x: number; y: number; width: number; height: number } }

// Moving, the photo for the glass to glide over, centered on the canvas: the
// middle square (`side` wide) holds what the orb shows at rest. Around it the
// picture carries on, sharp, well past the glass's edge (Nov 5: the rim of the
// glass shows photo from further out than the circle, about half the square
// from the middle, so the blur used to show at the rim): the camera's whole
// frame when there is one, then the picture mirrored at its edges. Far out it
// eases slowly into a blurred copy of the same picture, only lightly washed
// toward the paper at the very ends, so a drag never reaches bare page
function drawPadded(context: CanvasRenderingContext2D, image: HTMLImageElement, side: number, frame?: { image: HTMLImageElement; crop: Surround['crop'] }) {
  const { width, height } = context.canvas
  const cx = width / 2
  const cy = height / 2
  const k = side / Math.min(image.naturalWidth, image.naturalHeight)
  const w = image.naturalWidth * k
  const h = image.naturalHeight * k
  // The picture and where it goes: the whole frame placed so the photo inside
  // it lands where the photo would, or just the photo
  const source = frame?.image ?? image
  const rw = frame ? w / frame.crop.width : w
  const rh = frame ? h / frame.crop.height : h
  const rx = frame ? cx - w / 2 - frame.crop.x * rw : cx - w / 2
  const ry = frame ? cy - h / 2 - frame.crop.y * rh : cy - h / 2

  // Sharp everywhere: the picture, with mirrored copies of it all around
  const full = document.createElement('canvas')
  full.width = width
  full.height = height
  const all = full.getContext('2d')
  if (!all) return
  const reach = Math.ceil(Math.max(width / rw, height / rh) / 2) + 1
  for (let i = -reach; i <= reach; i++) {
    for (let j = -reach; j <= reach; j++) {
      all.save()
      all.translate(rx + i * rw + rw / 2, ry + j * rh + rh / 2)
      all.scale(i % 2 ? -1 : 1, j % 2 ? -1 : 1)
      all.drawImage(source, -rw / 2, -rh / 2, rw, rh)
      all.restore()
    }
  }

  // A progressive blur (Nov 5: more gradual): the most blurred copy across
  // the whole canvas, then ever sharper copies over it, each fading out over
  // its own wide ring a little further out than the sharper one above it, so
  // the blur builds up step by step with no band where it starts. The sharp
  // picture stays fully sharp out past the glass's edge (0.6 of the square
  // from the middle; at rest the rim shows out to about 0.5)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(blurred(full, side / 12), 0, 0)
  // Only at the far ends, a light wash toward the paper
  const tone = rgb(paper())
  if (tone) {
    const wash = context.createRadialGradient(cx, cy, side * 1.2, cx, cy, side * 1.9)
    wash.addColorStop(0, `rgba(${tone}, 0)`)
    wash.addColorStop(1, `rgba(${tone}, 0.35)`)
    context.fillStyle = wash
    context.fillRect(0, 0, width, height)
  }
  // From blurriest to sharp: how blurred (pixels, 0 = sharp), and the ring
  // it fades out over, in squares from the middle
  const layers: [number, number, number][] = [
    [side / 24, 1.15, 1.6],
    [side / 48, 0.98, 1.35],
    [side / 96, 0.84, 1.15],
    [side / 192, 0.72, 0.98],
    [0, 0.6, 0.84],
  ]
  for (const [blur, from, to] of layers) {
    const layer = blur ? blurred(full, blur) : full
    const ctx = layer.getContext('2d')
    if (!ctx) continue
    ctx.globalCompositeOperation = 'destination-in'
    const ring = ctx.createRadialGradient(cx, cy, side * from, cx, cy, side * to)
    for (let t = 0; t <= 1.0001; t += 0.1) {
      const k = Math.min(1, t)
      ring.addColorStop(k, `rgba(0,0,0,${(1 - k * k * (3 - 2 * k)).toFixed(3)})`)
    }
    ctx.fillStyle = ring
    ctx.fillRect(0, 0, width, height)
    context.drawImage(layer, 0, 0)
  }
}

// A blurred copy of a canvas, about `radius` pixels soft: halved step by step
// until that coarse, then scaled back up smoothly (works in every browser),
// and softened again with the canvas's own blur where it has one
function blurred(source: HTMLCanvasElement, radius: number) {
  const { width, height } = source
  let current = source
  let scale = 1
  while (scale * 2 <= radius) {
    const half = document.createElement('canvas')
    half.width = Math.max(1, Math.round(current.width / 2))
    half.height = Math.max(1, Math.round(current.height / 2))
    const ctx = half.getContext('2d')
    if (!ctx) break
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(current, 0, 0, half.width, half.height)
    current = half
    scale *= 2
  }
  const out = document.createElement('canvas')
  out.width = width
  out.height = height
  const ctx = out.getContext('2d')
  if (!ctx) return out
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.filter = `blur(${Math.max(1, Math.round(radius / 2))}px)`
  // A step larger all round, so the blur doesn't fade at the edges
  ctx.drawImage(current, -scale, -scale, width + scale * 2, height + scale * 2)
  ctx.filter = 'none'
  return out
}

// A hex color token as "r, g, b", for canvas gradients that fade it
function rgb(color: string) {
  const hex = color.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')
}

// The photo laid out for the glass, cropped square like object-cover: across
// the box, then again at PHOTO size in the middle. Moving (a taller canvas),
// it's the one photo, SPOTLIGHT of the box, in the middle, padded out to the
// canvas's edges (drawPadded), so it reads as a single picture wherever the
// glass moves over it
function usePicture(src: string, box: number, height: number, surround?: Surround) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const frameSrc = height === box ? undefined : surround?.src
  const crop = surround?.crop
  useEffect(() => {
    let alive = true
    const load = (url: string) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const image = new Image()
        // Saved captures come from Supabase storage: without this the photo
        // taints the canvas and the glass can't use it, so it never shows
        image.crossOrigin = 'anonymous'
        image.onload = () => resolve(image)
        image.onerror = () => resolve(null)
        image.src = url
      })
    Promise.all([load(src), frameSrc ? load(frameSrc) : null]).then(([image, frame]) => {
      if (!alive || !image) return
      const picture = document.createElement('canvas')
      picture.width = box * 2
      picture.height = height * 2
      const context = picture.getContext('2d')
      if (!context) return
      const inner = box * 2 * PHOTO
      if (height === box) {
        drawCover(context, image, 0, 0, box * 2)
        drawCover(context, image, (box * 2 - inner) / 2, (box * 2 - inner) / 2, inner)
      } else {
        drawPadded(context, image, box * 2 * SPOTLIGHT, frame && crop ? { image: frame, crop } : undefined)
      }
      setCanvas(picture)
    })
    return () => {
      alive = false
    }
  }, [src, box, height, frameSrc, crop])
  return canvas
}
