import { useEffect, useState, useSyncExternalStore } from 'react'
import { foundPlaces } from '../data/onboarding'
import { realLifePrompt } from '../data/pages'
import { promptsFor, rotatingPrompt, slotAt, timeSlots } from '../data/dailyPrompts'
import type { TimeSlot } from '../data/dailyPrompts'
import { leave } from '../data/today'
import { relaySearchSeed } from '../data/relay'
import type { ArchiveSketchId } from '../data/archiveSketches'
import type { Stage } from '../flow'
import { defaultGlassTuning } from '../ui/promptGlass'
import type { GlassTuning, PromptGlass } from '../ui/promptGlass'
import type { ConfettiVariant } from '../ui/confettiVariants'
import type { RelayEntrance } from '../ui/relayEntrance'
import type { RelayLook } from '../ui/relayLooks'
import type { CloudCategory, CloudPhoto, CloudView } from '../ui/PhotoCloud'
import type { ArchiveMoment } from '../data/archiveMoments'

// Tiny in-memory store for choices that carry across screens (onboarding picks
// that show up on Today). Nothing persists; a reload starts fresh.
export type SetupItem = 'archive' | 'todos' | 'leave' | 'instagram'

// A photo's whole camera frame, and where the photo sits in it (fractions)
export type CaptureSurround = { photo: Blob; crop: { x: number; y: number; width: number; height: number } }

type State = {
  status: Stage | null
  // Optional onboarding step, enabled from the debug panel for demos.
  onboardingPhotoAccess: boolean
  // Debug: Today's orb moves like before (drag, wobble, spin, scroll nudge)
  // instead of holding still in its rim
  orbMoves: boolean
  intentionsVideoRun: number
  tags: string[]
  keptPlaces: string[]
  // null until picked from the setup list on Today
  todos: string[] | null
  doneTodos: string[]
  instagram: string
  friendNotes: { name: string; message: string }[]
  // When she leaves LA: her flight, or just a date she imagines (ISO date)
  leaveMode: 'flight' | 'date'
  flight: string
  leaveDate: string
  expectedLeaveMonth: string
  // Which Archive segment opens (the legacy card on Today opens Legacy)
  archiveSegment: 'mine' | 'legacy'
  // A city folder that files itself into Archive the next time it opens (the
  // new New York one, from You're a Newcomer now); cleared once it has played
  archiveArrival: string | null
  // Which city folder in Archive was tapped (opens the detail page next)
  selectedFolder: string | null
  // Which photo in a city's photo cloud was tapped (its cloud image src), and
  // where it sat on screen, so the opened page can grow it from there
  selectedPhoto: string | null
  // Real-life: photos added to LA's cloud from the reflection page this
  // session, and the moment each one opens (keyed by its src)
  addedPhotos: CloudPhoto[]
  addedMoments: Record<string, ArchiveMoment>
  // The archive as saved in Supabase (every city's cloud and its moments); null
  // until loaded or when Supabase isn't set up (then the archive is empty)
  archive: { clouds: Record<string, CloudPhoto[]>; moments: Record<string, ArchiveMoment> } | null
  // Real-life animations, in window pixels: where the camera's picture was when
  // the photo was taken (it morphs into the reflection page's orb), and where
  // the orb was when it was added (it shrinks into its spot in LA's cloud)
  captureFrom: { x: number; y: number; width: number; height: number } | null
  arrivingPhoto: { src: string; x: number; y: number; size: number; color: string } | null
  selectedPhotoFrom: { x: number; y: number; size: number } | null
  // The photo cloud as it was when a photo was opened (canvas position and
  // orb filter), so going back shows it the same; null opens it fresh
  cloudView: CloudView | null
  cloudFilter: CloudCategory | null
  // Which Relay pick or tip was tapped (opens its detail page)
  selectedRec: string | null
  // Notes she left on Relay picks and tips, by item id
  relayNotes: Record<string, string[]>
  // Relay shows the map (list slid down), and the picked category filter
  relayMap: boolean
  relayFilter: string | null
  // Relay's search page: what's typed, and her recent searches (newest first)
  relayQuery: string
  relaySearches: string[]
  // Visual treatment for Relay, picked in the team-only Relay looks playground
  relayEntrance: RelayEntrance
  relayEntranceSpeed: number
  relayLook: RelayLook
  // Archive page layout: the city folder stack, or the scrubbable photo wall (Photo wall in the debug panel's Archive direction, from the Archive ideas)
  archiveWall: boolean
  // Debug: hide the tab bar and + field, for clean recordings
  hideNav: boolean
  // Debug: only eight intention bubbles on the Intentions screen
  fewBubbles: boolean
  // Debug: hide the iOS status bar (time, signal, battery)
  hideStatusBar: boolean
  // Debug > Real-life: Today asks for a photo of your school building and the
  // photo goes on to the reflection page, for filming someone using the app for real
  realLife: boolean
  // The Rolling Paper's widened Dynamic Island is over the status bar, so its
  // time and icons fade out under it
  statusBarCovered: boolean
  // How Today's prompt circle is drawn, picked in the team-only Today looks playground
  promptGlass: PromptGlass
  // Fluid Glass settings for that circle, tuned live in the debug panel
  glassTuning: GlassTuning
  // Debug > Today: preview a time of day instead of the clock (null = the clock)
  promptSlot: TimeSlot | null
  // Debug > Today: pin one of that time slot's prompts (null = rotate daily)
  promptIndex: number | null
  setupDone: SetupItem[]
  // The + button is open as a text field in the tab bar
  composing: boolean
  // Photo taken directly from Today's photo prompt, ready for review in Capture.
  capturePhoto: File | null
  // The camera's whole frame around that photo (it's cropped to the camera's
  // rectangle), with where the photo sits in it as fractions; the reflection
  // page's orb shows real photo past the shot when dragged. Null for a photo
  // picked from her library
  captureSurround: CaptureSurround | null
  // The camera open inside Today's bubble: where the circle sits (screen
  // pixels, center) and how big it is (points); null while it's closed
  camera: { cx: number; cy: number; size: number } | null
  // photos are ids of the photos she picked
  reflections: { text: string; photos: string[] }[]
  // Stage whose congrats splash is showing over the app (after her stage moves forward)
  stageSplash: Stage | null
  // Status bar drawn light, over a dark full-bleed page (the Local splash)
  lightStatusBar: boolean
  // Confetti on the Welcome to New York splash, picked in the debug panel; bump
  // confettiRun to play it again
  confetti: ConfettiVariant
  confettiRun: number
  // Her intentions for New York, picked from Profile before her last night in LA
  goals: string[]
  // A wireframe direction shown in place of the Archive tab (Debug > Archive direction), or the real one
  archiveSketch: ArchiveSketchId | null
}

let state: State = {
  status: null,
  onboardingPhotoAccess: false,
  // Keller, Oct 21: the moving glass orb on Today is the default again
  orbMoves: true,
  intentionsVideoRun: 0,
  tags: [],
  keptPlaces: foundPlaces.map((place) => place.id),
  todos: null,
  doneTodos: [],
  instagram: '',
  friendNotes: [],
  leaveMode: 'flight',
  flight: '',
  leaveDate: leave.defaultDate,
  expectedLeaveMonth: '',
  archiveSegment: 'mine',
  archiveArrival: null,
  selectedFolder: null,
  selectedPhoto: null,
  addedPhotos: [],
  addedMoments: {},
  archive: null,
  captureFrom: null,
  arrivingPhoto: null,
  selectedPhotoFrom: null,
  cloudView: null,
  cloudFilter: null,
  selectedRec: null,
  relayNotes: {},
  relayMap: false,
  relayFilter: null,
  relayQuery: '',
  relaySearches: relaySearchSeed,
  // Keller picked Scrapbook (Oct 18)
  relayLook: 'scrapbook',
  archiveWall: false,
  hideNav: false,
  fewBubbles: false,
  hideStatusBar: false,
  // Fixed submission experience; team-only URL flags are ignored.
  realLife: false,
  statusBarCovered: false,
  // Keller picked Side sweep (Oct 19).
  relayEntrance: 'sweep',
  relayEntranceSpeed: 1,
  // Keller, Oct 18: the whole circle is one big blob of blue-tinted liquid glass
  // Prompt and pill sit together under the glass, so moving it bends them (Keller, Oct 19)
  promptGlass: 'glass',
  glassTuning: defaultGlassTuning,
  promptSlot: null,
  promptIndex: null,
  setupDone: [],
  composing: false,
  capturePhoto: null,
  captureSurround: null,
  camera: null,
  reflections: [],
  stageSplash: null,
  lightStatusBar: false,
  // Picked Oct 19 (the other styles stay in the debug panel)
  confetti: 'pop',
  confettiRun: 0,
  goals: [],
  archiveSketch: null,
}

const listeners = new Set<() => void>()

export function setState(update: Partial<State> | ((current: State) => Partial<State>)) {
  const patch = typeof update === 'function' ? update(state) : update
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useStore() {
  return useSyncExternalStore(subscribe, () => state)
}

// Add or remove an id in a list field.
export function toggleIn(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
}

// Mark a setup item on Today as done.
export function completeSetup(item: SetupItem) {
  setState((s) => ({ setupDone: s.setupDone.includes(item) ? s.setupDone : [...s.setupDone, item] }))
}

const stageOrder: Stage[] = ['moving', 'newcomer', 'local']

// Change her stage. Moving forward (to Newcomer or Local) pops up the congrats
// splash; going back, or picking her stage in onboarding, doesn't.
export function changeStage(next: Stage) {
  setState((s) => {
    const forward = stageOrder.indexOf(next) > stageOrder.indexOf(s.status ?? 'moving')
    return { status: next, stageSplash: forward ? next : null, promptIndex: null }
  })
}

// Her stage: picked in onboarding, or set from the stage switcher in the debug
// panel. Screens opened directly start her as Moving.
export function useStatus(): Stage {
  return useStore().status ?? 'moving'
}

// The time Today goes by: the clock, ticking each minute, or the middle of the
// time slot previewed in the debug panel
export function useNow(): Date {
  const { promptSlot } = useStore()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])
  if (!promptSlot) return now
  const preview = new Date(now)
  preview.setHours((timeSlots.find((slot) => slot.id === promptSlot)!.from + 1) % 24, 0, 0, 0)
  return preview
}

// Today's prompt for her stage and the time of day (also shown above the +
// field while typing), rotating daily within a time slot. Prompts and their
// slots are in src/data/dailyPrompts.ts; the debug panel can preview a slot or
// pin one prompt.
export function useDailyPrompt() {
  const status = useStatus()
  const now = useNow()
  const { promptIndex, realLife } = useStore()
  if (realLife) return realLifePrompt
  const prompts = promptsFor(status, slotAt(now))
  return promptIndex === null ? rotatingPrompt(prompts, now) : prompts[promptIndex % prompts.length]
}

// The archive's photo clouds by city and the moments they open, from Supabase
export function useArchive() {
  const { archive } = useStore()
  return { clouds: archive?.clouds ?? {}, moments: archive?.moments ?? {} }
}
