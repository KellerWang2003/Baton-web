import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { flow, stageLabels } from '../flow'
import type { Stage } from '../flow'
import { stageNames } from '../data/stages'
import { cx } from '../ui'
import { archiveDirections } from '../data/archiveSketches'
import { promptsFor, slotAt, timeSlots } from '../data/dailyPrompts'
import type { TimeSlot } from '../data/dailyPrompts'
import { frameLimits } from './useFrameSize'
import type { FrameSettings } from './useFrameSize'
import { changeStage, setMove, setState, useNow, useStatus, useStore } from './store'
import { clearSavedCaptures } from './supabase'

type DebugPanelProps = {
  index: number
  goTo: (index: number) => void
  framed: boolean
  toggleFrame: () => void
  frame: FrameSettings
  updateFrame: (patch: Partial<FrameSettings>) => void
  joystick: boolean
  toggleJoystick: () => void
  lockRatio: boolean
  toggleLockRatio: () => void
  backgroundColor: string | null
  setBackgroundColor: (color: string | null) => void
  kitOpen: boolean
  toggleKit: () => void
  mapsOpen: boolean
  toggleMaps: () => void
  motionOpen: boolean
  toggleMotion: () => void
  looksOpen: boolean
  toggleLooks: () => void
  todayLooksOpen: boolean
  toggleTodayLooks: () => void
  archiveMockOpen: boolean
  toggleArchiveMock: () => void
  sketchesOpen: boolean
  toggleSketches: () => void
  archiveIdeasOpen: boolean
  toggleArchiveIdeas: () => void
  collageOpen: boolean
  toggleCollage: () => void
}

const stages: Stage[] = ['moving', 'newcomer', 'local']
const debugTabs = ['Recording', 'Demo', 'Playgrounds'] as const
type DebugTab = (typeof debugTabs)[number]

type Position = { x: number; y: number }

// Drag something by a handle and remember where it lands (per key). A press
// that barely moves still counts as a click. With snapToEdge it ends up
// against whichever side of the screen is closer.
function useDraggable(key: string, snapToEdge = false) {
  const [position, setPosition] = useState<Position | null>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? 'null')
      return typeof saved?.x === 'number' && typeof saved?.y === 'number' ? saved : null
    } catch {
      return null
    }
  })
  const drag = useRef<{ el: HTMLElement; dx: number; dy: number; startX: number; startY: number; moved: boolean } | null>(null)
  const last = useRef(position)
  const moved = useRef(false)

  const handlers = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      const el = event.currentTarget.closest<HTMLElement>('[data-draggable]')
      if (!el || event.button !== 0) return
      // Inside the handle, other buttons (like close) keep working
      if (event.currentTarget !== event.target && (event.target as HTMLElement).closest('button') !== event.currentTarget.closest('button')) return
      const rect = el.getBoundingClientRect()
      drag.current = { el, dx: event.clientX - rect.left, dy: event.clientY - rect.top, startX: event.clientX, startY: event.clientY, moved: false }
      moved.current = false
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      const d = drag.current
      if (!d) return
      const el = d.el
      if (!d.moved && Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < 5) return
      d.moved = true
      const next = {
        x: Math.min(Math.max(0, event.clientX - d.dx), Math.max(0, window.innerWidth - el.offsetWidth)),
        y: Math.min(Math.max(0, event.clientY - d.dy), Math.max(0, window.innerHeight - el.offsetHeight)),
      }
      last.current = next
      setPosition(next)
    },
    onPointerUp: () => {
      const d = drag.current
      if (!d) return
      moved.current = d.moved
      drag.current = null
      if (!moved.current) return
      if (snapToEdge && last.current) {
        const right = last.current.x + d.el.offsetWidth / 2 > window.innerWidth / 2
        last.current = { x: right ? 1 : 0, y: last.current.y }
        setPosition(last.current)
      }
      try {
        localStorage.setItem(key, JSON.stringify(last.current))
      } catch {
        // not remembered
      }
    },
  }
  // Snapped, x is the side: 0 left, 1 right (while dragging it's the real x)
  const right = snapToEdge && position?.x === 1
  const style = !position
    ? undefined
    : right
      ? { right: 0, left: 'auto', top: position.y, bottom: 'auto' }
      : { left: snapToEdge && position.x === 0 ? 0 : position.x, top: position.y, right: 'auto', bottom: 'auto' }
  // Read in onClick: true when the press was a drag, not a tap
  const wasDragged = () => moved.current
  return { style, side: right ? ('right' as const) : ('left' as const), handlers: { ...handlers, onPointerCancel: handlers.onPointerUp }, wasDragged }
}

function readTab(): DebugTab {
  try {
    const saved = localStorage.getItem('debugTab')
    return debugTabs.find((name) => name === saved) ?? 'Recording'
  } catch {
    return 'Recording'
  }
}

// Team-only controls, not part of the app, so reviewers never see a way in:
// press and hold one spot for 4 seconds (mouse or touch, anywhere) and its
// launcher appears until the page is refreshed: the Debug button (framed) or the
// edge tab (phone). From then on ` (backtick) opens it, and ← → move between
// screens, 1 2 3 set Chloe's stage and F toggles the phone frame.
const HOLD_MS = 4000
const HOLD_SLOP = 10

export function DebugPanel({ index, goTo, framed, toggleFrame, frame, updateFrame, joystick, toggleJoystick, lockRatio, toggleLockRatio, backgroundColor, setBackgroundColor, kitOpen, toggleKit, mapsOpen, toggleMaps, motionOpen, toggleMotion, looksOpen, toggleLooks, todayLooksOpen, toggleTodayLooks, archiveIdeasOpen, toggleArchiveIdeas, collageOpen, toggleCollage, archiveMockOpen, toggleArchiveMock, sketchesOpen, toggleSketches }: DebugPanelProps) {
  const [open, setOpen] = useState(false)
  // The launcher and shortcuts stay hidden until the 4-second hold
  const [unlocked, setUnlocked] = useState(false)
  const [tab, setTab] = useState<DebugTab>(readTab)
  const panel = useDraggable('debugPosition')
  const launcher = useDraggable('debugLauncherPosition')
  const handle = useDraggable('debugHandlePosition', true)
  const [phone] = useState(() => window.matchMedia('(max-width: 500px)').matches)
  const chooseTab = (next: DebugTab) => {
    setTab(next)
    try {
      localStorage.setItem('debugTab', next)
    } catch {
      // not remembered
    }
  }
  const status = useStatus()
  const { onboardingPhotoAccess, hideNav, hideStatusBar } = useStore()

  // Hold still on one spot for 4 seconds to show the launcher
  useEffect(() => {
    if (unlocked) return
    let timer = 0
    let start: { x: number; y: number; id: number } | null = null
    const cancel = () => {
      window.clearTimeout(timer)
      start = null
    }
    // The press that revealed it shouldn't also tap whatever is under it
    const swallowClick = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
    }
    const onDown = (event: PointerEvent) => {
      cancel()
      if (!event.isPrimary) return
      start = { x: event.clientX, y: event.clientY, id: event.pointerId }
      timer = window.setTimeout(() => {
        start = null
        setUnlocked(true)
        window.addEventListener('click', swallowClick, { capture: true, once: true })
        window.setTimeout(() => window.removeEventListener('click', swallowClick, { capture: true }), 600)
      }, HOLD_MS)
    }
    const onMove = (event: PointerEvent) => {
      if (start && event.pointerId === start.id && Math.hypot(event.clientX - start.x, event.clientY - start.y) > HOLD_SLOP) cancel()
    }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', cancel, true)
    window.addEventListener('pointercancel', cancel, true)
    return () => {
      cancel()
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', cancel, true)
      window.removeEventListener('pointercancel', cancel, true)
    }
  }, [unlocked])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, [contenteditable="true"]')) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (!unlocked) return
      if (event.key === '`') setOpen((value) => !value)
      else if (event.key === 'Escape') setOpen(false)
      else if (event.key === 'ArrowRight') goTo(index + 1)
      else if (event.key === 'ArrowLeft') goTo(index - 1)
      else if (event.key === 'f') toggleFrame()
      else if (['1', '2', '3'].includes(event.key)) changeStage(stages[Number(event.key) - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, goTo, toggleFrame, unlocked])

  if (!open && !unlocked) return null

  if (!open && phone) {
    // On a phone: a small see-through tab on the screen's edge. Slide it up or
    // down, or over to the other edge; a tap opens the panel. (No edge swipe: it
    // clashed with the browser's swipe back.)
    return (
      <button
        data-draggable
        type="button"
        {...handle.handlers}
        onClick={() => !handle.wasDragged() && setOpen(true)}
        style={handle.style}
        aria-label="Open debug panel"
        className={cx(
          'fixed left-0 top-1/2 z-50 h-20 w-6 touch-none select-none bg-ink/40 backdrop-blur-sm',
          handle.side === 'right' ? 'rounded-l-control' : 'rounded-r-control',
        )}
      />
    )
  }

  if (!open) {
    // A small black button you can drag anywhere (kept out of the app's way);
    // a tap opens the panel
    return (
      <button
        data-draggable
        type="button"
        {...launcher.handlers}
        onClick={() => !launcher.wasDragged() && setOpen(true)}
        style={launcher.style}
        title="Open debug panel (`). Drag to move."
        className="fixed bottom-4 left-4 z-50 touch-none select-none rounded-full bg-ink px-4 py-2 font-body text-sm font-semibold text-surface shadow-float hover:opacity-90"
      >
        Debug
      </button>
    )
  }

  return (
    <aside
      data-draggable
      style={phone ? undefined : panel.style}
      className="fixed bottom-4 left-4 z-50 flex max-h-[85vh] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-card bg-surface font-body text-sm text-ink shadow-float"
    >
      <div className="flex flex-col gap-3 border-b border-line p-3">
        <header
          {...(phone ? {} : panel.handlers)}
          title="Drag to move"
          className="-m-3 flex cursor-grab touch-none select-none items-center justify-between p-3 active:cursor-grabbing"
        >
          <p className="font-display text-base font-bold">
            Debug <span aria-hidden className="ml-1 text-ink-faint">⠿</span>
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close debug panel"
            className="inline-flex size-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted"
          >
            ×
          </button>
        </header>

        {/* Chloe's stage: Today, Archive, Community and Profile follow it */}
        <div className="flex flex-col gap-2">
          <div role="radiogroup" aria-label="Chloe's stage" className="flex gap-1 rounded-full bg-surface-muted p-0.5">
            {stages.map((stage) => (
              <button
                key={stage}
                type="button"
                role="radio"
                aria-checked={status === stage}
                data-stage={stage}
                onClick={() => changeStage(stage)}
                className={cx(
                  'flex-1 rounded-full px-2 py-1 text-xs font-semibold transition',
                  status === stage ? 'bg-stage text-on-stage' : 'text-ink hover:bg-surface',
                )}
              >
                {stageNames[stage]}
              </button>
            ))}
          </div>
          <select
            aria-label="Go to screen"
            value={index}
            onChange={(event) => goTo(Number(event.target.value))}
            className="w-full truncate rounded-control bg-surface-muted px-2.5 py-2 text-xs font-semibold"
          >
            {stages.map((stage) => {
              const screens = flow.map((screen, i) => ({ screen, i })).filter(({ screen }) => screen.stage === stage && screen.id !== 'intentions-video' && (onboardingPhotoAccess || screen.id !== 'photos'))
              if (screens.length === 0) return null
              return (
                <optgroup key={stage} label={stageLabels[stage]}>
                  {screens.map(({ screen, i }) => (
                    <option key={screen.id} value={i}>
                      {String(i + 1).padStart(2, '0')} {screen.title}
                    </option>
                  ))}
                </optgroup>
              )
            })}
          </select>
        </div>

        <div role="tablist" aria-label="Debug sections" className="-mb-3 flex gap-4">
          {debugTabs.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              onClick={() => chooseTab(name)}
              className={cx(
                'border-b-2 pb-2 text-xs font-semibold transition',
                tab === name ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink',
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3">
        {tab === 'Recording' && (
          <>
            <Group title="Phone">
              <DebugToggle label="Phone frame" on={framed} onClick={toggleFrame} hint="F" />
              <DebugToggle label="Lock aspect ratio" on={lockRatio} onClick={toggleLockRatio} />
              {framed && (
                <div className="flex flex-col gap-2 px-2 py-2">
                  <div role="radiogroup" aria-label="Frame preset" className="flex gap-1 rounded-full bg-surface p-0.5">
                    {(['iphone', 'custom'] as const).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        role="radio"
                        aria-checked={frame.preset === preset}
                        onClick={() => updateFrame({ preset })}
                        className={cx('flex-1 rounded-full px-2 py-1 text-xs font-semibold transition', frame.preset === preset ? 'bg-ink text-surface' : 'text-ink hover:bg-surface-muted')}
                      >
                        {preset === 'iphone' ? 'iPhone' : 'Custom'}
                      </button>
                    ))}
                  </div>
                  {frame.preset === 'custom' && (
                    <>
                      <div className="flex items-center gap-2 text-xs">
                        <SizeInput label="W" value={frame.width} onChange={(width) => updateFrame({ width })} />
                        <SizeInput label="H" value={frame.height} onChange={(height) => updateFrame({ height })} />
                        <button type="button" aria-label="Swap width and height" onClick={() => updateFrame({ width: frame.height, height: frame.width })} className="rounded-control bg-surface px-2 py-1 font-semibold hover:bg-line">⇄</button>
                      </div>
                      <div className="flex gap-1">
                        {[['Phone', 402, 874], ['Tablet', 820, 1180], ['Wide', 1280, 800]].map(([name, width, height]) => (
                          <button key={name} type="button" onClick={() => updateFrame({ width: Number(width), height: Number(height) })} className="flex-1 rounded-control bg-surface px-1 py-1 text-xs font-semibold hover:bg-line">{name}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </Group>

            <Group title="While filming">
              <DebugToggle label="Scroll joystick" on={joystick} onClick={toggleJoystick} />
              <DebugToggle label="Hide navigation" on={hideNav} onClick={() => setState({ hideNav: !hideNav })} />
              <DebugToggle label="Hide status bar" on={hideStatusBar} onClick={() => setState({ hideStatusBar: !hideStatusBar })} />
            </Group>

            <Group title="Background" note="Outside the phone frame. Close Debug with ` before recording.">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <input
                  type="color"
                  aria-label="Background color"
                  value={backgroundColor ?? getComputedStyle(document.documentElement).getPropertyValue('--color-backdrop').trim()}
                  onChange={(event) => setBackgroundColor(event.target.value)}
                  className="h-7 w-10 cursor-pointer rounded-control bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setBackgroundColor(getComputedStyle(document.documentElement).getPropertyValue('--color-recording-green').trim())}
                  className="flex-1 rounded-control bg-surface px-2 py-1.5 text-xs font-semibold hover:bg-line"
                >
                  Green screen
                </button>
                <button
                  type="button"
                  onClick={() => setBackgroundColor(null)}
                  className="rounded-control bg-surface px-2 py-1.5 text-xs font-semibold hover:bg-line"
                >
                  Reset
                </button>
              </div>
            </Group>

        </>
        )}

        {tab === 'Demo' && (
          <>
            <Group title="Moving (IA v2)" note="Moving shows the Moving card on Today and the NY stamp in Relay. Landed is the first month in New York.">
              <MoveToggles />
            </Group>
            <Group title="Today">
              <PromptPicker />
            </Group>
            <Group title="Archive direction">
              <ArchiveDirectionPicker goToArchive={() => goTo(flow.findIndex((screen) => screen.id === 'archive'))} />
            </Group>
            <Group title="Real-life" note="Live camera, then write a line about it. The camera needs https (the Vercel link) or localhost. On a phone, open the link with ?real-life#/today.">
              <RealLife goToToday={() => goTo(flow.findIndex((screen) => screen.id === 'today'))} />
            </Group>
          </>
        )}

        {tab === 'Playgrounds' && (
          <Group title="Playgrounds" note="Each one opens over the app. Close it from here or with ×.">
            {[
              ['Design system', kitOpen, toggleKit],
              ['Brand collage', collageOpen, toggleCollage],
              ['Map looks', mapsOpen, toggleMaps],
              ['Relay looks', looksOpen, toggleLooks],
              ['Relay entrances', motionOpen, toggleMotion],
              ['Today looks', todayLooksOpen, toggleTodayLooks],
              ['Archive sketches', sketchesOpen, toggleSketches],
              ['Archive ideas', archiveIdeasOpen, toggleArchiveIdeas],
              ['3D proto', archiveMockOpen, toggleArchiveMock],
            ].map(([label, isOpen, toggle]) => (
              <PlaygroundLink key={label as string} label={label as string} open={isOpen as boolean} onClick={toggle as () => void} />
            ))}
          </Group>
        )}
      </div>

      <p className="border-t border-line px-3 py-2 text-xs text-ink-muted">` panel · ← → screens · 1 2 3 stage · F frame</p>
    </aside>
  )
}

// A titled card of related controls; rows inside are separated by hairlines.
function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</h3>
      <div className="flex flex-col divide-y divide-line overflow-hidden rounded-control bg-surface-muted">{children}</div>
      {note && <p className="px-1 text-xs text-ink-muted">{note}</p>}
    </section>
  )
}

function SizeInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="flex flex-1 items-center gap-1 font-semibold text-ink-muted">
      {label}
      <input
        type="number"
        min={frameLimits.min}
        max={frameLimits.max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full min-w-0 rounded-control bg-surface-muted px-1.5 py-1 font-normal text-ink"
      />
    </label>
  )
}

function DebugToggle({ label, on, onClick, hint }: { label: string; on: boolean; onClick: () => void; hint?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className="flex items-center justify-between px-2 py-2 text-left hover:bg-line"
    >
      <span>
        {label}
        {hint && <span className="ml-2 text-xs text-ink-muted">{hint}</span>}
      </span>
      <span className={`flex h-5 w-9 items-center rounded-full p-0.5 ${on ? 'justify-end bg-ink' : 'justify-start bg-line'}`}>
        <span className="size-4 rounded-full bg-surface" />
      </span>
    </button>
  )
}

// An entrance to a playground: opens it over the app, or closes it if it's showing
function PlaygroundLink({ label, open, onClick }: { label: string; open: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center justify-between px-2 py-2 text-left hover:bg-line">
      <span className={cx(open && 'font-semibold')}>{label}</span>
      <span className="text-xs text-ink-muted">{open ? 'Close ×' : 'Open →'}</span>
    </button>
  )
}

// Another direction in place of the real Archive tab's folders, for the
// video's explorations part (picking one jumps there): the scrubbable photo
// wall (from the Archive ideas) or a wireframe direction from the Archive
// sketches
// Real-life: for filming someone using the app for real on a phone. Today
// asks for a photo of their school building, the orb opens the live camera
// (with a back arrow), and the photo goes on to a page to write a line about it
function MoveToggles() {
  const { moving, landed } = useStore()
  return (
    <>
      <DebugToggle label="I'm moving" on={moving} onClick={() => setMove({ moving: !moving })} />
      <DebugToggle label="Landed" on={landed} onClick={() => setMove({ moving: true, landed: !landed })} />
    </>
  )
}

function RealLife({ goToToday }: { goToToday: () => void }) {
  const { realLife } = useStore()
  return (
    <>
      <DebugToggle
        label="Today: photo of your school"
        on={realLife}
        onClick={() => {
          setState({ realLife: !realLife, camera: null })
          if (!realLife) goToToday()
        }}
      />
      <button
        type="button"
        onClick={() => void clearSavedCaptures()}
        className="m-1.5 self-start rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold hover:bg-line"
      >
        Clear my saved captures
      </button>
    </>
  )
}

function ArchiveDirectionPicker({ goToArchive }: { goToArchive: () => void }) {
  const { archiveSketch, archiveWall } = useStore()
  const options = [
    { key: 'off', label: 'Off', sketch: null, wall: false },
    { key: 'wall', label: 'Photo wall', sketch: null, wall: true },
    ...archiveDirections.map((direction) => ({ key: direction.id, label: direction.label, sketch: direction.id, wall: false })),
  ]
  return (
    <div className="p-1.5">
      <div role="radiogroup" aria-label="Archive direction" className="flex flex-wrap gap-1 rounded-[14px] bg-surface p-0.5">
        {options.map((option) => {
          const on = archiveSketch === option.sketch && archiveWall === option.wall
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setState({ archiveSketch: option.sketch, archiveWall: option.wall })
                goToArchive()
              }}
              className={cx(
                'flex-1 whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold transition',
                on ? 'bg-ink text-surface' : 'text-ink hover:bg-surface-muted',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Which time of day Today goes by, and which of that slot's prompts it shows
// (prompts and their slots in src/data/dailyPrompts.ts).
function PromptPicker() {
  const status = useStatus()
  const now = useNow()
  const { promptSlot, promptIndex } = useStore()
  const prompts = promptsFor(status, slotAt(now))
  const clockSlot = timeSlots.find((slot) => slot.id === slotAt(new Date()))!
  const selectClass = 'w-full truncate rounded-control bg-surface px-2 py-1.5 text-xs'
  return (
    <div className="flex flex-col gap-2 p-2">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-ink-muted">Time of day</span>
        <select
          value={promptSlot ?? ''}
          onChange={(event) => setState({ promptSlot: (event.target.value || null) as TimeSlot | null, promptIndex: null })}
          className={selectClass}
        >
          <option value="">Now: {clockSlot.label}</option>
          {timeSlots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-ink-muted">Prompt</span>
        <select
          value={promptIndex === null ? '' : promptIndex % prompts.length}
          onChange={(event) => setState({ promptIndex: event.target.value === '' ? null : Number(event.target.value) })}
          className={selectClass}
        >
          <option value="">Rotate daily</option>
          {prompts.map((prompt, i) => (
            <option key={`${status}-${i}`} value={i}>
              {prompt.question}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
