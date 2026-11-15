import { useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { bubbleFriends, bubblePrompts } from '../data/home'
import type { BubblePrompt } from '../data/home'
import { relayAvatar } from '../data/relay'
import { cx } from '../ui'
import { PencilIcon, PromptCameraIcon } from '../ui/icons'

// Prompt map (experiment, Nov 15; Today with `?bubbles=map` or `map-frost`):
// today's prompts as a quiet field you can drag around like a map, fading out
// toward the phone's edges. Only today's main prompt has words; the others
// are small glass dots with just their icon. Done prompts are her photo, crisp.
// Friends' answers sit near the prompt they answered, pushed back: faded
// (`map`) or frosted (`map-frost`), with a tiny face.
export type MapFriends = 'faded' | 'frost'

const FIELD_H = 460
const WORLD = { w: 940, h: 820 }

type Spot = { x: number; y: number; d: number }

// World positions (centers) and diameters
const promptSpots: Record<string, Spot> = {
  daily: { x: 470, y: 410, d: 220 },
  philz: { x: 626, y: 295, d: 84 },
  morning: { x: 331, y: 279, d: 92 },
  walk: { x: 609, y: 533, d: 70 },
  lunch: { x: 290, y: 533, d: 78 },
  studio: { x: 741, y: 418, d: 66 },
  sound: { x: 199, y: 402, d: 60 },
  gym: { x: 470, y: 197, d: 64 },
}

const friendSpots: Record<string, Spot> = {
  Jess: { x: 355, y: 402, d: 56 },
  Kai: { x: 544, y: 500, d: 62 },
  Mina: { x: 568, y: 344, d: 44 },
  Ana: { x: 413, y: 521, d: 48 },
  Marco: { x: 691, y: 271, d: 46 },
  Sam: { x: 650, y: 221, d: 38 },
  Priya: { x: 249, y: 238, d: 48 },
  Leo: { x: 380, y: 205, d: 40 },
  Theo: { x: 216, y: 582, d: 46 },
  Maya: { x: 683, y: 599, d: 42 },
}

export function PromptMap({ friends, daily }: { friends: MapFriends; daily: { question: string; medium: 'photo' | 'write' } }) {
  const field = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  // Start with today's prompt in the middle of the field
  const [pan, setPan] = useState({ x: 201 - promptSpots.daily.x, y: FIELD_H / 2 - promptSpots.daily.y })
  const clamp = (x: number, y: number) => ({
    x: Math.min(120, Math.max(402 - WORLD.w - 120, x)),
    y: Math.min(120, Math.max(FIELD_H - WORLD.h - 120, y)),
  })
  const prompts = bubblePrompts.map((prompt) => (prompt.id === 'daily' ? { ...prompt, ...daily } : prompt))

  return (
    <div
      ref={field}
      className="relative -mx-gutter mt-2 cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
      style={{ height: FIELD_H, ...edgeFade }}
      onPointerDown={(event) => {
        drag.current = { x: event.clientX, y: event.clientY, px: pan.x, py: pan.y }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        const start = drag.current
        if (!start) return
        setPan(clamp(start.px + event.clientX - start.x, start.py + event.clientY - start.y))
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <div className="absolute left-0 top-0" style={{ width: WORLD.w, height: WORLD.h, transform: `translate(${pan.x}px, ${pan.y}px)` }}>
        {bubbleFriends.map((friend) => {
          const spot = friendSpots[friend.name]
          return spot ? <Friend key={friend.name} name={friend.name} photo={friend.photo} spot={spot} look={friends} /> : null
        })}
        {prompts.map((prompt) => {
          const spot = promptSpots[prompt.id]
          if (!spot) return null
          if (prompt.answer) return <Done key={prompt.id} prompt={prompt} spot={spot} />
          return prompt.id === 'daily' ? <Main key={prompt.id} prompt={prompt} spot={spot} /> : <Dot key={prompt.id} prompt={prompt} spot={spot} />
        })}
      </div>
    </div>
  )
}

// Fades the field out toward every edge of the phone
const fade = 'linear-gradient(to right, transparent 0, black 18%, black 82%, transparent 100%), linear-gradient(to bottom, transparent 0, black 16%, black 84%, transparent 100%)'
const edgeFade: CSSProperties = { maskImage: fade, WebkitMaskImage: fade, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' }

const at = ({ x, y, d }: Spot): CSSProperties => ({ left: x - d / 2, top: y - d / 2, width: d, height: d })

const glass = (rim: number): CSSProperties => ({
  background: `radial-gradient(circle at 46% 40%, var(--color-surface) 0%, var(--color-surface) 48%, color-mix(in srgb, var(--color-baton-blue) ${rim}%, var(--color-surface)) 100%)`,
  boxShadow: '0 0 0 1px color-mix(in srgb, var(--color-baton-blue) 14%, transparent), 0 10px 30px color-mix(in srgb, var(--color-baton-blue) 14%, transparent)',
})

// Today's prompt: the one place with words, set quietly
function Main({ prompt, spot }: { prompt: BubblePrompt; spot: Spot }) {
  return (
    <button type="button" aria-label={prompt.question} className="absolute z-20 rounded-full" style={{ ...at(spot), ...glass(55) }}>
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-9 text-center font-display text-[19px] font-normal leading-[1.2] text-ink/80">
        <Icon medium={prompt.medium} className="text-brand/70" />
        {prompt.question}
      </span>
    </button>
  )
}

// Another prompt not done yet: a small glass dot with only its icon
function Dot({ prompt, spot }: { prompt: BubblePrompt; spot: Spot }) {
  return (
    <button type="button" aria-label={prompt.question} className="absolute z-10 flex items-center justify-center rounded-full" style={{ ...at(spot), ...glass(40) }}>
      <Icon medium={prompt.medium} className="text-brand/60" small />
    </button>
  )
}

// Done: her photo, crisp
function Done({ prompt, spot }: { prompt: BubblePrompt; spot: Spot }) {
  return (
    <button type="button" aria-label={prompt.question} className="absolute z-10 rounded-full" style={at(spot)}>
      <img src={prompt.answer} alt="" draggable={false} className="size-full rounded-full object-cover shadow-md ring-2 ring-surface" />
    </button>
  )
}

// A friend's answer, pushed back: faded, or frosted, with a tiny face
function Friend({ name, photo, spot, look }: { name: string; photo: string; spot: Spot; look: MapFriends }) {
  return (
    <button type="button" aria-label={`${name}'s answer`} className="absolute z-0 rounded-full" style={at(spot)}>
      <img
        src={photo}
        alt=""
        draggable={false}
        className={cx('size-full rounded-full object-cover', look === 'faded' ? 'opacity-45 saturate-50' : 'opacity-80 blur-[3px] saturate-75')}
      />
      <img src={relayAvatar(name)} alt="" draggable={false} className="absolute -bottom-0.5 -left-0.5 size-[18px] rounded-full object-cover opacity-90 ring-[1.5px] ring-surface" />
    </button>
  )
}

function Icon({ medium, className, small = false }: { medium: 'photo' | 'write'; className?: string; small?: boolean }) {
  return medium === 'photo' ? (
    <PromptCameraIcon className={cx(small ? 'h-3.5 w-4' : 'h-5 w-6', className)} />
  ) : (
    <PencilIcon className={cx(small ? 'size-4' : 'size-5', className)} />
  )
}
