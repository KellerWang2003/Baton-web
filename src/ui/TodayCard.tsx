import type { ReactNode } from 'react'
import { cx } from './cx'
import { ArrowRightIcon, ChevronRightIcon } from './icons'
import { stageTones, type StageTone } from './stageTones'

type TodayCardProps = {
  title: string
  // Parts of the title to pick out in blue (places, people)
  highlight?: string[]
  subtitle?: string
  // A photo on the left, or another leading element (a check circle)
  photo?: string
  // Which part of the photo shows in the square (CSS object-position)
  photoPosition?: string
  leading?: ReactNode
  trailing?: ReactNode
  done?: boolean
  onClick?: () => void
}

// Splits a title around its highlighted parts, keeping the order
function parts(title: string, highlight: string[]) {
  if (!highlight.length) return [{ text: title, on: false }]
  const pattern = new RegExp(`(${highlight.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`)
  return title
    .split(pattern)
    .filter(Boolean)
    .map((text) => ({ text, on: highlight.includes(text) }))
}

// A card in Today's "Before you leave" list (Figma TODAY 334:11284): a photo
// from her archive, a title with its places and people in blue, and the
// reason it's suggested.
export function TodayCard({ title, highlight = [], subtitle, photo, photoPosition, leading, trailing, done = false, onClick }: TodayCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="flex min-h-[81px] w-full items-center gap-2.5 rounded-card bg-today-panel p-2.5 text-left shadow-today-card transition active:scale-[0.99] disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {photo ? (
        <img src={photo} alt="" className="size-[61px] shrink-0 self-start rounded-inset object-cover" style={{ objectPosition: photoPosition }} />
      ) : (
        leading && <span className="flex size-[61px] shrink-0 items-center justify-center">{leading}</span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className={cx('text-today-card font-medium', done ? 'text-ink-muted line-through' : 'text-ink')}>
          {parts(title, highlight).map((part, index) =>
            part.on ? (
              <span key={index} className="text-highlight">
                {part.text}
              </span>
            ) : (
              part.text
            ),
          )}
        </span>
        {subtitle && <span className="text-today-detail text-today-muted">{subtitle}</span>}
      </span>
      {trailing ?? (onClick && <span className="shrink-0 pr-1 text-ink-faint"><ChevronRightIcon /></span>)}
    </button>
  )
}

type MomentCardProps = {
  stage: StageTone
  eyebrow: string
  title: string
  subtitle?: string
  photo: string
  onClick?: () => void
}

// The one card on Today that marks a moment in her move (her LA archive in
// the last week, LA Wrapped after landing, the Local insight): filled with her
// stage's color, as on StageTag and the stage splash, with a photo on top and
// a round arrow (Keller, Oct 21: these are the ones that stand out).
export function MomentCard({ stage, eyebrow, title, subtitle, photo, onClick }: MomentCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cx(
        'flex w-full flex-col gap-3 rounded-card p-2.5 pb-4 text-left shadow-today-card transition active:scale-[0.99] disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        stageTones[stage],
      )}
    >
      <img src={photo} alt="" className="aspect-[2/1] w-full rounded-inset object-cover" />
      <span className="flex items-end gap-3 px-1.5">
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="text-today-detail opacity-75">{eyebrow}</span>
          <span className="text-today-card font-medium">{title}</span>
          {subtitle && <span className="text-today-detail opacity-75">{subtitle}</span>}
        </span>
        {onClick && (
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-baton-paper text-baton-navy">
            <ArrowRightIcon />
          </span>
        )}
      </span>
    </button>
  )
}

type MoveCardProps = {
  stamp: ReactNode
  big: string
  next: string
  onClick: () => void
}

// IA v2: the Moving card at the top of Today while "I'm moving" is on. Blue
// like the Moving stage, the city sticker, the countdown big, the next to-do,
// and a round arrow that opens Your move.
export function MoveCard({ stamp, big, next, onClick }: MoveCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex w-full items-center gap-4 rounded-card p-4 text-left shadow-today-card transition active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        stageTones.moving,
      )}
    >
      {stamp}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-display text-greeting leading-none">{big}</span>
        <span className="truncate text-today-detail opacity-85">{next}</span>
      </span>
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-baton-paper text-baton-navy">
        <ArrowRightIcon />
      </span>
    </button>
  )
}
