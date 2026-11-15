import { cx } from './cx'
import { BookmarkIcon } from './icons'

type BookmarkButtonProps = {
  saved: boolean
  onToggle: () => void
  // glass: frosted disc over a photo (Relay's cards); paper: bare icon on the page (Relay detail)
  tone?: 'glass' | 'paper'
  label?: string
  className?: string
}

// Save toggle for a Relay pick: an outline bookmark that fills blue once saved.
// Saved picks go to that city's Saved list (`saved` in the store).
export function BookmarkButton({ saved, onToggle, tone = 'glass', label = 'Save', className }: BookmarkButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `${label}d` : label}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      className={cx(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full transition active:scale-90',
        tone === 'glass' ? 'bg-glass shadow-glass backdrop-blur-xl' : '',
        saved ? 'text-brand' : 'text-ink',
        className,
      )}
    >
      <BookmarkIcon filled={saved} className="size-[22px]" />
    </button>
  )
}
