import { useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { bubblePrompts } from '../data/home'
import type { BubblePrompt } from '../data/home'
import { cx } from '../ui'
import { MapPinIcon, PencilIcon, PromptCameraIcon } from '../ui/icons'

// Prompt map (experiment, Nov 15; Today with `?bubbles=map`): today's prompt
// and the prompts from places she goes, as a quiet field you can drag around
// like a map, fading out toward the phone's edges. Only today's prompt has
// words; place prompts are small glass dots with their icon and the place
// under them. Friends stay in their own row below for now (Keller, Nov 15).

const FIELD_H = 420
const WORLD = { w: 940, h: 820 }

type Spot = { x: number; y: number; d: number }

// World positions (centers) and diameters
const promptSpots: Record<string, Spot> = {
  daily: { x: 470, y: 410, d: 220 },
  philz: { x: 640, y: 300, d: 92 },
  gym: { x: 318, y: 262, d: 78 },
  market: { x: 628, y: 548, d: 76 },
  tj: { x: 300, y: 560, d: 70 },
}

export function PromptMap({ daily }: { daily: { question: string; medium: 'photo' | 'write' } }) {  const field = useRef<HTMLDivElement>(null)
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
        {prompts.map((prompt) => {
          const spot = promptSpots[prompt.id]
          if (!spot) return null
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

// A prompt from a place she goes: a small glass dot with its icon, the place under it
function Dot({ prompt, spot }: { prompt: BubblePrompt; spot: Spot }) {
  return (
    <button type="button" aria-label={prompt.question} className="absolute z-10 rounded-full" style={{ ...at(spot), ...glass(40) }}>
      <span className="absolute inset-0 flex items-center justify-center">
        <Icon medium={prompt.medium} className="text-brand/60" small />
      </span>
      {prompt.place && (
        <span className="absolute left-1/2 top-full mt-2 inline-flex -translate-x-1/2 items-center gap-0.5 whitespace-nowrap text-caption text-ink-muted">
          <MapPinIcon className="size-3 text-brand/60" />
          {prompt.place}
        </span>
      )}
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
