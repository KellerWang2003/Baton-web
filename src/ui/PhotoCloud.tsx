import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { toLocal } from '../app/localPoint'
import { cx } from './cx'

export type CloudCategory = 'feeling' | 'people' | 'places'

// Where the canvas sits: its offset on screen and zoom
export type CloudView = { x: number; y: number; scale: number }

export type CloudPhoto = {
  // Its row in Supabase (captures), to delete it
  id?: string
  src: string
  category: CloudCategory
  // Top-left corner on the 402pt-wide canvas the layout was drawn on
  x: number
  y: number
  size: number
}

type PhotoCloudProps = {
  photos: CloudPhoto[]
  // Keep only this category's photos sharp and blur the rest (the orb filter)
  focus?: CloudCategory | null
  // A quick, still tap on a photo (not a drag, pinch or double-tap zoom), with
  // where that photo sits on screen right now and where the canvas is
  onSelect?: (photo: CloudPhoto, rect: DOMRect, view: CloudView) => void
  // Pressing and holding still on a photo (or right-clicking it), as for an
  // iOS context menu, with the same details as onSelect
  onLongPress?: (photo: CloudPhoto, rect: DOMRect, view: CloudView) => void
  // A photo to leave out of sight (lifted into the context menu)
  hidden?: CloudPhoto | null
  // Open where the canvas was left (coming back from a photo) instead of at
  // the start, and without the photos popping in
  resume?: CloudView | null
  // Whether the photos pop in when the page opens (opening the folder plays
  // its own entrance instead, see folderTransition)
  pop?: boolean
  className?: string
}

const CANVAS_WIDTH = 402
const POP_STAGGER_MS = 18
const MIN_SCALE = 0.6
const MAX_SCALE = 3.5
// Fastest glide after letting go, in px per frame
const MAX_GLIDE = 24
// Per-frame velocity kept after letting go (higher glides further)
const GLIDE_FRICTION = 0.9
const DOUBLE_TAP_MS = 280
// How long a still press on a photo takes to open its context menu
const LONG_PRESS_MS = 450
// Photos hang on springs and follow the finger: how far they trail per
// px/frame of movement, how far at most (screen px), the distance (screen px)
// at which a photo follows the finger only half as much, and how the spring
// settles
const LAG_PER_SPEED = 0.8
const MAX_LAG = 20
const FINGER_REACH = 110
const SPRING_STIFFNESS = 0.07
const SPRING_DAMPING = 0.2

type View = CloudView
type Point = { x: number; y: number }

// Room kept between any two photos, on the canvas: enough that their gentle
// bob (photo-float, up to 2.5pt each way) never brings two edges together
const GAP = 4

// The layouts come from Figma (and photos added later), where circles can
// touch or overlap. Nudge them apart, each as little as it can: every pass,
// any two that are too close are pushed away from each other along the line
// between them, the smaller one moving further, until none are.
function separate(entries: CloudPhoto[]): CloudPhoto[] {
  const placed = entries.map((photo) => ({ x: photo.x + photo.size / 2, y: photo.y + photo.size / 2, r: photo.size / 2 }))
  for (let pass = 0; pass < 300; pass++) {
    let moved = false
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i]
        const b = placed[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let distance = Math.hypot(dx, dy)
        const need = a.r + b.r + GAP
        if (distance >= need - 0.01) continue
        // Two on the same spot: part them along a fixed slant
        if (distance < 0.01) {
          dx = 1
          dy = 0.6
          distance = Math.hypot(dx, dy)
        }
        const push = need - distance
        const share = a.r / (a.r + b.r)
        a.x -= (dx / distance) * push * (1 - share)
        a.y -= (dy / distance) * push * (1 - share)
        b.x += (dx / distance) * push * share
        b.y += (dy / distance) * push * share
        moved = true
      }
    }
    if (!moved) break
  }
  return entries.map((photo, index) => ({ ...photo, x: placed[index].x - photo.size / 2, y: placed[index].y - photo.size / 2 }))
}

// A city's photos as small circles scattered over the page (Figma
// ARCHIVE_detail default, 267:5273), on a canvas you can float around: drag
// to move (it keeps gliding when you let go), pinch, ctrl/trackpad-pinch
// scroll or double-tap to zoom. The canvas keeps the design's 402pt width and
// starts centered. Photos pop in one after another when the page opens, then
// bob gently on their own. Each photo hangs on its own spring and follows your
// finger: the ones near it move right along with it, the far ones trail behind
// and wobble back into place.
export function PhotoCloud({ photos: entries, focus = null, onSelect, onLongPress, hidden = null, resume = null, pop = true, className }: PhotoCloudProps) {
  // Every photo sits where its row says (the Figma layout), nudged just enough
  // that no two touch; relaying them out by shuffle stretched the cloud into
  // a long, sparse column
  const photos = useMemo(() => separate(entries), [entries])
  const height = Math.max(0, ...photos.map((photo) => photo.y + photo.size))
  // The area the photos actually cover on the canvas (the middle of the
  // canvas once every photo is deleted)
  const bounds = photos.length
    ? {
        left: Math.min(...photos.map((photo) => photo.x)),
        top: Math.min(...photos.map((photo) => photo.y)),
        right: Math.max(...photos.map((photo) => photo.x + photo.size)),
        bottom: height,
      }
    : { left: CANVAS_WIDTH / 2, top: 0, right: CANVAS_WIDTH / 2, bottom: 0 }
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const view = useRef<View>({ x: 0, y: 0, scale: 1 })
  const pointers = useRef(new Map<number, Point>())
  const pinch = useRef<{ distance: number; mid: Point } | null>(null)
  const velocity = useRef<Point>({ x: 0, y: 0 })
  const lastMove = useRef(0)
  const lastTap = useRef(0)
  const glide = useRef(0)
  const zoomTween = useRef(0)
  const photoRefs = useRef<(HTMLDivElement | null)[]>([])
  // Where and when a one-finger press started, and how far it has moved, to
  // tell a tap from a drag
  const press = useRef<{ x: number; y: number; at: number; travel: number } | null>(null)
  // The long-press timer, and whether it fired for the finger still down
  const hold = useRef(0)
  const held = useRef(false)
  const boundsRef = useRef(bounds)

  // Wheel listeners stay mounted, so their clamp must read the latest layout.
  useLayoutEffect(() => {
    boundsRef.current = bounds
    stopMotion()
    set(view.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds.left, bounds.top, bounds.right, bounds.bottom])

  function apply() {
    const canvas = canvasRef.current
    if (!canvas) return
    const { x, y, scale } = view.current
    canvas.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
  }

  function clamp(next: View): View {
    const viewport = viewportRef.current
    if (!viewport) return next
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.scale))
    // The middle of the screen always stays over the photos, so they can't be flung away
    const midX = viewport.clientWidth / 2
    const midY = viewport.clientHeight / 2
    const bounds = boundsRef.current
    return {
      scale,
      x: Math.min(midX - bounds.left * scale, Math.max(midX - bounds.right * scale, next.x)),
      y: Math.min(midY - bounds.top * scale, Math.max(midY - bounds.bottom * scale, next.y)),
    }
  }

  function set(next: View) {
    view.current = clamp(next)
    apply()
  }

  // Zoom to a scale while keeping the point under `at` (viewport coords) fixed
  function zoomAt(at: Point, scale: number, from = view.current) {
    const bounded = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
    const ratio = bounded / from.scale
    set({ scale: bounded, x: at.x - (at.x - from.x) * ratio, y: at.y - (at.y - from.y) * ratio })
  }

  function stopMotion() {
    cancelAnimationFrame(glide.current)
    cancelAnimationFrame(zoomTween.current)
  }

  // Pointer position in the viewport's own pixels (the phone frame may be
  // scaled down to fit the window, or tilted in the Archive mock). The mapping
  // is measured again only when the viewport moves on screen.
  const localMap = useRef<{ key: string; map: (point: Point) => Point } | null>(null)
  function local(event: { clientX: number; clientY: number }): Point {
    const viewport = viewportRef.current!
    const rect = viewport.getBoundingClientRect()
    const key = `${rect.left},${rect.top},${rect.width},${rect.height}`
    if (localMap.current?.key !== key) localMap.current = { key, map: toLocal(viewport) }
    return localMap.current.map({ x: event.clientX, y: event.clientY })
  }

  // Centered horizontally, at the top like the Figma frame. The viewport
  // reaches up under the status bar (--status-bar), so start that much lower.
  function startView(): View {
    const viewport = viewportRef.current
    const statusBar = viewport ? parseFloat(getComputedStyle(viewport).getPropertyValue('--status-bar')) || 0 : 0
    return { x: ((viewport?.clientWidth ?? CANVAS_WIDTH) - CANVAS_WIDTH) / 2, y: statusBar, scale: 1 }
  }

  // Read once, on the first render
  const [resumeAt] = useState(resume)

  useEffect(() => {
    view.current = resumeAt ?? startView()
    apply()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Wheel: trackpad pinch (ctrlKey) or ctrl+wheel zooms, two-finger scroll moves.
  // Added by hand because React's wheel listener is passive.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    function onWheel(event: WheelEvent) {
      event.preventDefault()
      stopMotion()
      if (event.ctrlKey || event.metaKey) {
        zoomAt(local(event), view.current.scale * Math.exp(-event.deltaY * 0.01))
      } else {
        set({ ...view.current, x: view.current.x - event.deltaX, y: view.current.y - event.deltaY })
      }
    }
    viewport.addEventListener('wheel', onWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(
    () => () => {
      stopMotion()
      clearTimeout(hold.current)
    },
    [],
  )

  // Turning the orb to another filter (or swiping it back to all) brings the
  // photos back to where they started, however far they were moved or zoomed
  // (only on a real change, so mounting, even twice in dev, leaves it alone)
  const lastFocus = useRef(focus)
  useEffect(() => {
    if (lastFocus.current === focus) return
    lastFocus.current = focus
    stopMotion()
    animateTo(startView(), 600)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus])

  // Springs: each frame, measure how fast the view is panning (the canvas
  // point under the screen's center, so zooming alone doesn't count) and how
  // fast the finger moves. Each photo wants to move with the finger, less the
  // further it is from it, so near photos stay with the finger and far ones
  // trail the pan. With no finger down (gliding, trackpad) all of them trail.
  useEffect(() => {
    const count = photos.length
    const offset = new Float32Array(count * 2)
    const speed = new Float32Array(count * 2)
    // A little variety so photos at the same distance don't move in step
    const weight = photos.map((_, index) => 0.8 + ((index * 37) % 10) / 22)
    // Neighbors close enough that trailing could bring them together (each
    // can trail MAX_LAG screen px, which is more canvas when zoomed out)
    const reach = (2 * MAX_LAG) / MIN_SCALE + GAP
    const neighbors: [number, number][] = []
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const a = photos[i]
        const b = photos[j]
        const apart = Math.hypot(b.x + b.size / 2 - a.x - a.size / 2, b.y + b.size / 2 - a.y - a.size / 2)
        if (apart - (a.size + b.size) / 2 < reach) neighbors.push([i, j])
      }
    }
    let previous: Point | null = null
    let previousFinger: Point | null = null
    let previousTime = performance.now()
    let settled = true
    let frame = 0

    function step(now: number) {
      frame = requestAnimationFrame(step)
      const viewport = viewportRef.current
      if (!viewport) return
      const dt = Math.min(3, (now - previousTime) / 16.67)
      previousTime = now
      const { x, y, scale } = view.current
      const center = { x: (viewport.clientWidth / 2 - x) / scale, y: (viewport.clientHeight / 2 - y) / scale }
      // Screen px per frame the content is moving
      const moveX = previous ? ((previous.x - center.x) * scale) / dt : 0
      const moveY = previous ? ((previous.y - center.y) * scale) / dt : 0
      previous = center

      // The finger (or the middle of two), in screen px
      const touches = [...pointers.current.values()]
      const finger = touches.length
        ? {
            x: touches.reduce((sum, touch) => sum + touch.x, 0) / touches.length,
            y: touches.reduce((sum, touch) => sum + touch.y, 0) / touches.length,
          }
        : null
      const fingerX = finger && previousFinger ? (finger.x - previousFinger.x) / dt : 0
      const fingerY = finger && previousFinger ? (finger.y - previousFinger.y) / dt : 0
      previousFinger = finger
      if (settled && moveX === 0 && moveY === 0 && fingerX === 0 && fingerY === 0) return

      let energy = Math.abs(moveX) + Math.abs(moveY) + Math.abs(fingerX) + Math.abs(fingerY)
      for (let i = 0; i < count; i++) {
        let influence = 0
        if (finger) {
          const photo = photos[i]
          const distance = Math.hypot(
            x + (photo.x + photo.size / 2) * scale - finger.x,
            y + (photo.y + photo.size / 2) * scale - finger.y,
          )
          influence = 1 / (1 + (distance / FINGER_REACH) ** 2)
        }
        for (let axis = 0; axis < 2; axis++) {
          const k = i * 2 + axis
          const move = axis === 0 ? moveX : moveY
          const follow = (axis === 0 ? fingerX : fingerY) * influence
          // How much faster the photo wants to move than the canvas carries it
          const pull = (follow - move) * LAG_PER_SPEED * weight[i]
          const target = Math.max(-MAX_LAG, Math.min(MAX_LAG, pull))
          speed[k] += ((target - offset[k]) * SPRING_STIFFNESS - speed[k] * SPRING_DAMPING) * dt
          offset[k] += speed[k] * dt
          energy += Math.abs(offset[k]) + Math.abs(speed[k])
        }
      }
      // Trailing by different amounts can bring two photos together: push any
      // pair that's closer than the gap back apart, half each (offsets are
      // screen px, so compare on the canvas and push back in screen px)
      for (let pass = 0; pass < 3; pass++) {
        for (const [i, j] of neighbors) {
          const a = photos[i]
          const b = photos[j]
          const dx = b.x + b.size / 2 + offset[j * 2] / scale - (a.x + a.size / 2 + offset[i * 2] / scale)
          const dy = b.y + b.size / 2 + offset[j * 2 + 1] / scale - (a.y + a.size / 2 + offset[i * 2 + 1] / scale)
          const distance = Math.hypot(dx, dy) || 0.01
          const need = (a.size + b.size) / 2 + GAP
          if (distance >= need) continue
          const push = ((need - distance) / 2) * scale
          offset[i * 2] -= (dx / distance) * push
          offset[i * 2 + 1] -= (dy / distance) * push
          offset[j * 2] += (dx / distance) * push
          offset[j * 2 + 1] += (dy / distance) * push
        }
      }
      for (let i = 0; i < count; i++) {
        const node = photoRefs.current[i]
        // Offsets are screen px; the canvas is scaled, so divide back out
        if (node) node.style.transform = `translate3d(${offset[i * 2] / scale}px, ${offset[i * 2 + 1] / scale}px, 0)`
      }
      settled = energy < 0.05
      if (settled) {
        offset.fill(0)
        speed.fill(0)
        photoRefs.current.forEach((node) => node && (node.style.transform = ''))
      }
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [photos])

  function startGlide() {
    const speed = Math.hypot(velocity.current.x, velocity.current.y)
    const cap = speed > MAX_GLIDE ? MAX_GLIDE / speed : 1
    let vx = velocity.current.x * cap
    let vy = velocity.current.y * cap
    // Stale velocity (held still before letting go) means no glide
    if (performance.now() - lastMove.current > 80) return
    function step() {
      vx *= GLIDE_FRICTION
      vy *= GLIDE_FRICTION
      if (Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05) return
      set({ ...view.current, x: view.current.x + vx, y: view.current.y + vy })
      glide.current = requestAnimationFrame(step)
    }
    glide.current = requestAnimationFrame(step)
  }

  // Ease from the current view to `target`
  function animateTo(target: View, duration = 360) {
    const from = { ...view.current }
    const started = performance.now()
    function step(now: number) {
      const t = Math.min(1, (now - started) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      set({
        x: from.x + (target.x - from.x) * eased,
        y: from.y + (target.y - from.y) * eased,
        scale: from.scale + (target.scale - from.scale) * eased,
      })
      if (t < 1) zoomTween.current = requestAnimationFrame(step)
    }
    zoomTween.current = requestAnimationFrame(step)
  }

  function pinchState() {
    const [a, b] = [...pointers.current.values()]
    return {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    // Right-click is the context menu (onContextMenu), not a tap or drag
    if (event.button > 0) return
    stopMotion()
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, local(event))
    velocity.current = { x: 0, y: 0 }
    if (pointers.current.size === 2) pinch.current = pinchState()
    const start = local(event)
    press.current = pointers.current.size === 1 ? { ...start, at: performance.now(), travel: 0 } : null
    clearTimeout(hold.current)
    held.current = false
    // Held still on a photo: its context menu. Moving, a second finger or
    // letting go first cancels it
    const pressed = pointers.current.size === 1 && onLongPress ? photoAt(start) : null
    if (pressed) {
      hold.current = window.setTimeout(() => {
        if (!press.current || press.current.travel >= 6 || pointers.current.size !== 1) return
        if (openMenu(pressed)) {
          held.current = true
          lastTap.current = 0
          navigator.vibrate?.(10)
        }
      }, LONG_PRESS_MS)
    }

    if (pointers.current.size === 1) {
      const now = performance.now()
      if (now - lastTap.current < DOUBLE_TAP_MS) {
        // Double-tap zooms in where you tapped, or back out to the start if already close
        const at = local(event)
        const { x, y, scale } = view.current
        const zoom = 2.2 / scale
        animateTo(scale > 1.5 ? startView() : { scale: 2.2, x: at.x - (at.x - x) * zoom, y: at.y - (at.y - y) * zoom })
        lastTap.current = 0
      } else {
        lastTap.current = now
      }
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId)
    if (!previous) return
    const point = local(event)
    pointers.current.set(event.pointerId, point)
    // The menu is open under the finger: the canvas stays put
    if (held.current) return
    if (press.current) press.current.travel += Math.hypot(point.x - previous.x, point.y - previous.y)
    if (!press.current || press.current.travel >= 6) clearTimeout(hold.current)

    if (pointers.current.size >= 2 && pinch.current) {
      const next = pinchState()
      const from = view.current
      const scale = from.scale * (next.distance / pinch.current.distance)
      // Move with the fingers' midpoint, then zoom around it
      const moved = { ...from, x: from.x + next.mid.x - pinch.current.mid.x, y: from.y + next.mid.y - pinch.current.mid.y }
      zoomAt(next.mid, scale, moved)
      pinch.current = next
      return
    }

    const dx = point.x - previous.x
    const dy = point.y - previous.y
    const now = performance.now()
    const elapsed = Math.max(1, now - lastMove.current)
    // Smoothed, in px per 16ms frame
    const blend = 0.6
    velocity.current = {
      x: velocity.current.x * (1 - blend) + (dx / elapsed) * 16 * blend,
      y: velocity.current.y * (1 - blend) + (dy / elapsed) * 16 * blend,
    }
    lastMove.current = now
    set({ ...view.current, x: view.current.x + dx, y: view.current.y + dy })
  }

  // The photo under a point on screen, if any (topmost first)
  function photoAt(point: Point) {
    const { x, y, scale } = view.current
    const cx = (point.x - x) / scale
    const cy = (point.y - y) / scale
    for (let index = photos.length - 1; index >= 0; index--) {
      const photo = photos[index]
      const r = photo.size / 2
      if (Math.hypot(cx - (photo.x + r), cy - (photo.y + r)) <= r) return photo
    }
    return null
  }

  // Open a photo's context menu; false if it isn't on screen
  function openMenu(photo: CloudPhoto) {
    const image = photoRefs.current[photos.indexOf(photo)]?.firstElementChild
    if (!onLongPress || !image) return false
    stopMotion()
    onLongPress(entries[photos.indexOf(photo)], image.getBoundingClientRect(), { ...view.current })
    return true
  }

  // Right-click (and the long-press menu some browsers raise themselves)
  function onContextMenu(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault()
    if (held.current || !onLongPress) return
    const photo = photoAt(local(event))
    if (photo) openMenu(photo)
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return
    const tap = press.current
    press.current = null
    clearTimeout(hold.current)
    if (held.current) {
      // Letting go after the menu opened: no tap, no glide
      held.current = false
      pointers.current.delete(event.pointerId)
      if (pointers.current.size < 2) pinch.current = null
      return
    }
    if (tap && event.type === 'pointerup' && pointers.current.size === 1 && tap.travel < 6 && performance.now() - tap.at < 350) {
      const photo = onSelect && photoAt(local(event))
      const image = photo && photoRefs.current[photos.indexOf(photo)]?.firstElementChild
      if (photo && image) {
        pointers.current.delete(event.pointerId)
        onSelect(entries[photos.indexOf(photo)], image.getBoundingClientRect(), { ...view.current })
        return
      }
    }
    pointers.current.delete(event.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) startGlide()
  }

  return (
    <div
      ref={viewportRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={onContextMenu}
      // Up under the status bar, so photos float behind the time and icons
      style={{ top: 'calc(-1 * var(--status-bar, 0px))', WebkitTouchCallout: 'none' }}
      className={cx('absolute inset-0 cursor-grab touch-none overflow-hidden select-none active:cursor-grabbing', className)}
    >
      <div
        ref={canvasRef}
        style={{ width: `${CANVAS_WIDTH}px`, height: `${height}px` }}
        className="absolute top-0 left-0 origin-top-left will-change-transform"
      >
        {photos.map((photo, index) => (
          <div
            key={photo.id ?? photo.src}
            ref={(node) => {
              photoRefs.current[index] = node
            }}
            style={{
              left: `${photo.x}px`,
              top: `${photo.y}px`,
              width: `${photo.size}px`,
              height: `${photo.size}px`,
              // Each photo bobs on its own rhythm so the cloud never moves in step
              animationDuration: `${10 + (index % 7) * 0.8}s`,
              animationDelay: `${-((index * 1.37) % 10)}s`,
              transition: 'left 450ms ease, top 450ms ease',
            }}
            data-cloud-photo
            className="absolute animate-photo-float"
          >
            <img
              src={photo.src}
              alt=""
              draggable={false}
              style={{ animationDelay: `${index * POP_STAGGER_MS}ms` }}
              className={cx(
                pop && !resumeAt && 'animate-cloud-pop',
                'size-full rounded-full bg-placeholder object-cover transition-[filter,opacity] duration-500 ease-out',
                focus && photo.category !== focus && 'opacity-60 blur-[5px]',
                entries[index] === hidden && 'invisible',
              )}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
