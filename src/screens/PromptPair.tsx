import type { CSSProperties } from 'react'
import { placePrompt } from '../data/home'
import { cx } from '../ui'
import { MapPinIcon, PencilIcon, PromptCameraIcon } from '../ui/icons'

// Prompt pair (experiment, Nov 15; Today with `?bubbles=pair`, from Keller's
// sketch): today's prompt as a big glass circle, and the prompt from where she
// is as a second circle tucked behind it at the lower right, overlapping only
// at the rims so each prompt stays centered in its circle. No fade or blur yet; friends stay in their row below.
export function PromptPair({ daily }: { daily: { question: string; medium: 'photo' | 'write' } }) {
  return (
    <div className="relative -mx-gutter mt-6 h-[400px]">
      <Circle
        className="z-0"
        style={{ left: 185, top: 190, width: 200, height: 200 }}
        question={placePrompt.question}
        medium="photo"
        place={placePrompt.place}
        fontSize={17}
      />
      <Circle className="z-10" style={{ left: 30, top: 0, width: 250, height: 250 }} question={daily.question} medium={daily.medium} fontSize={22} />
    </div>
  )
}

function Circle({ question, medium, place, fontSize, style, className, inset = 'px-[17%]' }: { question: string; medium: 'photo' | 'write'; place?: string; fontSize: number; style: CSSProperties; className?: string; inset?: string }) {
  return (
    <button
      type="button"
      aria-label={question}
      className={cx('absolute rounded-full transition active:scale-[0.98]', className)}
      style={{
        ...style,
        background: 'radial-gradient(circle at 46% 40%, var(--color-surface) 0%, var(--color-surface) 46%, color-mix(in srgb, var(--color-baton-blue) 50%, var(--color-surface)) 100%)',
        boxShadow: '0 0 0 5px color-mix(in srgb, var(--color-surface) 92%, transparent), 0 0 0 6px rgb(0 0 0 / 0.05), 0 14px 34px color-mix(in srgb, var(--color-baton-blue) 18%, transparent)',
      }}
    >
      <span className={cx('absolute inset-0 flex flex-col items-center justify-center gap-2 text-center font-display font-normal leading-[1.2] text-ink/85', inset)} style={{ fontSize }}>
        {medium === 'photo' ? <PromptCameraIcon className="h-5 w-6 text-brand/70" /> : <PencilIcon className="size-5 text-brand/70" />}
        {question}
        {place && (
          <span className="mt-1 inline-flex items-center gap-1 text-caption text-ink-muted">
            <MapPinIcon className="size-3.5 text-brand/70" />
            {place}
          </span>
        )}
      </span>
    </button>
  )
}
