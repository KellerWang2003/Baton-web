import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { judgeReflection } from '../app/judgeReflection'
import { toLocal } from '../app/localPoint'
import { goBack, navigate } from '../app/navigate'
import { saveCapture } from '../app/supabase'
import { setState, useArchive, useDailyPrompt, useStore } from '../app/store'
import { freeSpot } from '../data/archiveCloud'
import { reflectionCopy } from '../data/pages'
import { reflectionCategoryLabel } from '../data/reflection'
import { BackButton, Button, PhotoOrb } from '../ui'
import { DISSOLVE_MS } from '../ui/PhotoOrb'
import type { CloudCategory } from '../ui'
import { filterColor } from '../ui/filterColor'

// The photo's orb, as on the Archive's opened photos (Figma ARCHIVE_selected)
const ORB = 300
// How long after she stops typing the note is read
const SETTLE_MS = 400
// The camera's picture turning into the orb (the camera's own curve)
const MORPH = { duration: 700, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'forwards' } as const
// The camera rectangle's corner radius (CameraBubble)
const CAMERA_RADIUS = 52
// Size of the photo once it's in LA's cloud, like the cloud's bigger photos
const CLOUD_SIZE = 60
// Shown with it in the Archive
const PROMPT_NUMBER = 41
const PLACE = 'Campus'
// Used when the page is opened without a photo (from the debug panel)
const FALLBACK_PHOTO = '/archive/la-sunset.jpg'

// On Add to archive the orb shrinks to this much of its size here, its glass
// and rim fading as it goes, then carries on shrinking into LA's cloud
const LEAVE_SCALE = 0.45
const LEAVE = { duration: DISSOLVE_MS, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'forwards' } as const

// Debug > Real-life: after taking the photo for today's prompt, she writes a
// line about it, laid out like a moment opened from the Archive. The camera's
// picture morphs into an orb (the photo under liquid glass in a glass rim),
// she types on a square yellow post-it, and once she pauses Claude reads it
// and the orb's edge glows the color of what it's about (Feeling pink, People
// yellow, Places blue). Add to archive flies the orb into its spot in LA's
// cloud (ArchiveDetail plays the landing).
export function Reflection() {
  const prompt = useDailyPrompt()
  const { clouds } = useArchive()
  const { capturePhoto, captureSurround, captureFrom, addedPhotos, orbMoves, glassTuning } = useStore()
  // Kept for the rest of the session: the photo goes on to LA's cloud
  const photo = useMemo(() => (capturePhoto ? URL.createObjectURL(capturePhoto) : null), [capturePhoto])
  // The camera's whole frame around it, for the orb to show past the shot
  const surround = useMemo(
    () => (capturePhoto && captureSurround ? { src: URL.createObjectURL(captureSurround.photo), crop: captureSurround.crop } : undefined),
    [capturePhoto, captureSurround],
  )
  const src = photo ?? FALLBACK_PHOTO
  const [text, setText] = useState('')
  const [category, setCategory] = useState<CloudCategory | null>(null)
  const [adding, setAdding] = useState(false)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const orbRef = useRef<HTMLDivElement>(null)
  const morphRef = useRef<HTMLDivElement>(null)
  // Where the camera's picture was, read once
  const [morphFrom] = useState(() => captureFrom)
  const [morphing, setMorphing] = useState(!!morphFrom)

  useEffect(() => {
    setState({ captureFrom: null })
  }, [])

  // The camera's rectangle shrinks and rounds into the orb
  useLayoutEffect(() => {
    const element = morphRef.current
    const page = rootRef.current
    const orb = orbRef.current
    if (!morphFrom || !element || !page || !orb) return
    const local = toLocal(page)
    const a = local({ x: morphFrom.x, y: morphFrom.y })
    const b = local({ x: morphFrom.x + morphFrom.width, y: morphFrom.y + morphFrom.height })
    const target = orb.getBoundingClientRect()
    const c = local({ x: target.left, y: target.top })
    const d = local({ x: target.right, y: target.bottom })
    const animation = element.animate(
      [
        { left: `${a.x}px`, top: `${a.y}px`, width: `${b.x - a.x}px`, height: `${b.y - a.y}px`, borderRadius: `${CAMERA_RADIUS}px` },
        { left: `${c.x}px`, top: `${c.y}px`, width: `${d.x - c.x}px`, height: `${d.y - c.y}px`, borderRadius: `${(d.x - c.x) / 2}px` },
      ],
      MORPH,
    )
    animation.finished.then(() => setMorphing(false), () => {})
    return () => animation.cancel()
  }, [morphFrom])

  // Once she pauses typing, read what it's about; the last color stays until
  // the new one arrives (no loading state), and clearing the note removes it
  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(async () => {
      if (!text.trim()) {
        setCategory(null)
        return
      }
      const kind = await judgeReflection(text, prompt.question)
      if (cancelled) return
      setCategory(kind)
    }, SETTLE_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [text, prompt.question])

  const leave = () => {
    setState({ capturePhoto: null, captureSurround: null })
    goBack()
  }

  const addToArchive = async () => {
    if (adding) return
    setAdding(true)
    const kind = category ?? (await judgeReflection(text, prompt.question))
    setCategory(kind)
    // The orb starts shrinking here while its glass and rim fade, and the rest
    // of the page fades away; the cloud picks it up from where it gets to
    await orbRef.current?.animate([{ transform: 'scale(1)' }, { transform: `scale(${LEAVE_SCALE})` }], LEAVE).finished
    // A unique address in the cloud, even for the stand-in photo
    const cloudSrc = photo ?? `${FALLBACK_PHOTO}?added=${Date.now()}`
    const spot = freeSpot([...(clouds.la ?? []), ...addedPhotos], CLOUD_SIZE)
    const at = orbRef.current?.getBoundingClientRect()
    const time = momentTime(new Date())
    const added = { src: cloudSrc, category: kind, x: spot.x, y: spot.y, size: CLOUD_SIZE }
    // Once saved, the photo keeps its row's id so a long press can delete it
    void saveCapture({
      photo: capturePhoto,
      question: prompt.question,
      note: text.trim(),
      category: kind,
      place: PLACE,
      promptNumber: PROMPT_NUMBER,
      timeLabel: time,
      spot: { x: spot.x, y: spot.y, size: CLOUD_SIZE },
    }).then((id) => {
      if (id) setState((current) => ({ addedPhotos: current.addedPhotos.map((item) => (item === added ? { ...item, id } : item)) }))
    })
    setState((current) => ({
      addedPhotos: [...current.addedPhotos, added],
      addedMoments: {
        ...current.addedMoments,
        [cloudSrc]: {
          prompt: PROMPT_NUMBER,
          question: prompt.question,
          photo: src,
          category: kind,
          place: PLACE,
          time,
          note: text.trim(),
        },
      },
      reflections: [...current.reflections, { text: text.trim(), photos: [] }],
      // The orb flies from here into its spot (ArchiveDetail)
      arrivingPhoto: at ? { src: cloudSrc, x: at.left, y: at.top, size: at.width, color: filterColor(kind) } : null,
      capturePhoto: null,
      captureSurround: null,
      selectedFolder: 'la',
      cloudView: null,
      cloudFilter: null,
    }))
    // Saved, so the page is done: LA's cloud takes its place, with the Archive
    // under it, so Back from the cloud goes to the folders
    navigate('archive-detail', { replace: true })
  }

  const color = category ? filterColor(category) : null
  // Everything but the orb fades in as the picture becomes the orb
  const settle = morphFrom ? 'animate-fade-in [animation-delay:350ms]' : ''
  // Leaving for the cloud, everything but the orb fades out
  const away = adding ? 'opacity-0 transition-opacity duration-700' : ''

  return (
    <div ref={rootRef} className="relative h-full bg-baton-paper font-display text-baton-navy">
      {/* Scrolls up and down only: the orb's glass canvas is wider than a
          phone screen, so the content is clipped at its sides (clip, not
          hidden, so it doesn't count toward scrolling; iOS can pan hidden) */}
      <div
        className="absolute inset-0 overflow-x-hidden overflow-y-auto"
        // Tapping anywhere off the note ends typing (iOS doesn't always do it)
        onPointerDown={(event) => event.target !== noteRef.current && noteRef.current?.blur()}
      >
        <div className="flex flex-col items-center overflow-x-clip px-gutter pb-40" data-glass-scene>
          <div className={`flex flex-col items-center ${adding ? away : settle}`}>
            <p className="mt-[62px] text-moment-meta text-wrap-faint">{reflectionCopy.label}</p>
            <h1 className="mt-2 w-[260px] text-center text-moment-question font-medium">{prompt.question}</h1>
          </div>

          {/* Her photo as an orb, its edge glowing the color of what she wrote about */}
          <div ref={orbRef} className="relative z-10 mt-8">
            <PhotoOrb src={src} surround={surround} size={ORB} category={category} dissolve={adding} moves={orbMoves} tuning={glassTuning} style={{ opacity: morphing ? 0 : 1 }} />
          </div>

          {/* What it's about, once the color settles */}
          <p className={`mt-4 flex h-5 items-center gap-1.5 text-moment-meta text-wrap-faint ${adding ? away : settle}`} aria-live="polite">
            {category && (
              <>
                <span aria-hidden className="size-2.5 rounded-full" style={{ background: color ?? undefined }} />
                {reflectionCategoryLabel[category]}
              </>
            )}
          </p>

          {/* A square post-it like her notes in the Archive (Figma 236:418) */}
          <label className={`mt-6 block size-[327px] shrink-0 -rotate-3 rounded-[10px] bg-note-yellow px-5 pt-[30px] pb-5 shadow-moment-note ${adding ? away : settle}`}>
            <span className="sr-only">Your reflection</span>
            <textarea
              ref={noteRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={reflectionCopy.placeholder}
              className="block size-full resize-none bg-transparent text-moment-note text-baton-navy placeholder:text-baton-navy/40 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {/* The camera's picture on its way to becoming the orb */}
      {morphing && (
        <div ref={morphRef} aria-hidden className="pointer-events-none absolute z-20 overflow-hidden">
          <img src={src} alt="" className="size-full object-cover" />
        </div>
      )}

      {/* Back to Today, as on the Archive's opened photos */}
      <BackButton onClick={leave} label="Back to Today" className="absolute top-2 left-5 z-10" />

      {/* Pinned to the bottom and always there, even with nothing written,
          since a capture can be saved without a note (Keller, Oct 21) */}
      <div className={`pointer-events-none absolute inset-x-0 bottom-[36px] z-10 flex justify-center ${adding ? away : settle}`}>
        <div className="pointer-events-auto">
          <Button variant="glow" onClick={addToArchive} className="h-[52px] w-[309px] text-cta">
            {reflectionCopy.save}
          </Button>
        </div>
      </div>
    </div>
  )
}

// "1:34 pm | July 25.2026", the way the Archive's moments show their time
function momentTime(date: Date) {
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  const day = String(date.getDate()).padStart(2, '0')
  return `${time} | ${month} ${day}.${date.getFullYear()}`
}
