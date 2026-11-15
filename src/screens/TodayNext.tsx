import { useRef, useState } from 'react'
import { navigate } from '../app/navigate'
import { setState, useDailyPrompt, useNow, useStatus, useStore } from '../app/store'
import { greeting, timeOfDay } from '../data/greetings'
import { friendsToday, placePrompt, regulars, worthGoing } from '../data/home'
import { mockMove, moveCard } from '../data/move'
import { promptMedium, promptMediumLabel } from '../data/pages'
import { findLeaver, relayAvatar, relayItems } from '../data/relay'
import { daysUntil } from '../data/today'
import { Avatar, CityStamp, MapPinIcon, MoveCard, PhotoOrb, PromptWindow, Scrap, cx } from '../ui'
import { MainLayout } from './MainLayout'
import { PromptBubbles } from './PromptBubbles'
import type { BubbleLayout } from './PromptBubbles'

// Prompt bubbles experiment: Today with ?bubbles=a, b or c
const bubbleLayout = ((): BubbleLayout | null => {
  const value = new URLSearchParams(window.location.search).get('bubbles')
  return value === 'a' || value === 'b' || value === 'c' ? value : null
})()

// IA v2 Today (Nov 15): answers "what about today?". One pick per slot, never
// a list. Top to bottom: greeting and avatar; the Moving card while "I'm
// moving" is on; the prompt slot (today's prompt, and one from where she is
// behind it); friends' answers; one place worth going today; her regulars.
export function TodayNext() {
  const { promptGlass, glassTuning, orbMoves, moving, landed, moveDate } = useStore()
  const status = useStatus()
  const prompt = useDailyPrompt()
  const now = useNow()
  const medium = promptMedium(prompt.question)
  const days = daysUntil(mockMove.today, moveDate || mockMove.date)
  const hello = greeting(status, timeOfDay(now), moving && !landed ? days : Infinity)

  return (
    <MainLayout title={hello.title} subtitle={hello.subtitle} profile stageTag={false} background="bg-baton-paper">
      {moving && (
        <div className="pt-5">
          <MoveCard
            stamp={<CityStamp city="ny" size={60} />}
            big={landed ? moveCard.day(mockMove.daysInNewYork) : moveCard.days(days)}
            next={landed ? moveCard.nextAfter : moveCard.nextBefore}
            onClick={() => navigate('move')}
          />
        </div>
      )}

      {bubbleLayout ? (
        <PromptBubbles layout={bubbleLayout} daily={{ question: prompt.question, medium }} />
      ) : (
        <PromptSlot
          question={prompt.question}
          medium={medium}
          glass={promptGlass}
          tuning={glassTuning}
          moves={orbMoves}
        />
      )}

      <div className="flex flex-col gap-10 pt-2">
        {!bubbleLayout && <FriendsToday />}
        <WorthGoing />
        <Regulars />
      </div>
    </MainLayout>
  )
}

// Today's prompt in the glass orb, with a second prompt from where she is
// behind it: swipe between them, dots below. A tap opens the camera.
function PromptSlot({ question, medium, glass, tuning, moves }: { question: string; medium: 'photo' | 'write'; glass: Parameters<typeof PromptWindow>[0]['glass']; tuning: Parameters<typeof PromptWindow>[0]['tuning']; moves: boolean }) {
  const [slide, setSlide] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const size = tuning?.size ?? 300
  const openCamera = (circle: { cx: number; cy: number; size: number }) => setState({ camera: circle, composing: false })

  return (
    <div className="flex flex-col items-center">
      <div
        ref={track}
        onScroll={(event) => {
          const el = event.currentTarget
          setSlide(Math.round(el.scrollLeft / el.clientWidth))
        }}
        className="-mx-gutter flex w-[calc(100%+2*var(--spacing-gutter))] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
      >
        <div className="w-full shrink-0 snap-center px-gutter">
          <PromptWindow
            className="pb-6 pt-6"
            question={question}
            medium={medium}
            mediumLabel={promptMediumLabel[medium]}
            glass={glass}
            tuning={tuning}
            moves={moves}
            onClick={openCamera}
          />
        </div>
        <div className="flex w-full shrink-0 snap-center flex-col items-center justify-center gap-4 px-gutter pb-6 pt-6">
          <button
            type="button"
            aria-label={placePrompt.question}
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              openCamera({ cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, size })
            }}
            className="relative rounded-full"
          >
            <PhotoOrb src={placePrompt.photo} size={Math.min(size, 300)} category={null} idle={false} />
            <span className="absolute -bottom-1 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-baton-paper px-3 py-1.5 text-subhead font-medium text-ink shadow-sm">
              <MapPinIcon className="size-4 text-brand" />
              {placePrompt.place}
            </span>
          </button>
          <p className="max-w-[280px] text-center font-display text-today-card text-ink">{placePrompt.question}</p>
        </div>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1].map((dot) => (
          <span key={dot} className={cx('size-1.5 rounded-full transition-colors', slide === dot ? 'bg-ink' : 'bg-ink-faint')} />
        ))}
      </div>
    </div>
  )
}

function FriendsToday() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-section font-normal text-ink">{friendsToday.title}</h2>
      <div className="-mx-gutter flex snap-x scroll-px-gutter gap-3 overflow-x-auto px-gutter pb-2 [scrollbar-width:none]">
        {friendsToday.answers.map((answer) => (
          <div key={answer.name} className="relative shrink-0 snap-start">
            <img src={answer.photo} alt="" className="h-40 w-28 rounded-tile object-cover shadow-today-card" />
            <Avatar name={answer.name} src={relayAvatar(answer.name)} size="sm" className="absolute bottom-2 left-2 ring-2 ring-baton-paper" />
          </div>
        ))}
      </div>
    </section>
  )
}

function WorthGoing() {
  const item = relayItems.find((rec) => rec.id === worthGoing.pick)
  if (!item) return null
  const leaver = item.source.kind === 'leaver' ? findLeaver(item.source.leaver) : undefined
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-section font-normal text-ink">{worthGoing.title}</h2>
      <button
        type="button"
        onClick={() => {
          setState({ selectedRec: item.id })
          navigate('relay-detail')
        }}
        className="mx-auto block w-[86%] pt-3 text-left transition active:scale-[0.98]"
      >
        <Scrap tone="yellow" index={1} className="flex flex-col gap-3">
          <img src={item.photo} alt="" className="aspect-[4/3] w-full rounded-tile object-cover" />
          <div className="flex items-center gap-3 px-1">
            <p className="min-w-0 flex-1 font-display text-card-title font-medium">{item.title}</p>
            {leaver && <Avatar name={leaver.name} src={relayAvatar(leaver.name)} size="sm" />}
          </div>
        </Scrap>
      </button>
    </section>
  )
}

function Regulars() {
  const { regularsTip } = useStore()
  const [draft, setDraft] = useState(regularsTip)
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-section font-normal text-ink">{regulars.title}</h2>
      <div className="flex flex-col gap-4 rounded-card bg-card p-3 pb-5 shadow-today-card">
        <div className="flex items-center gap-4">
          <img src={regulars.photo} alt="" className="size-20 rounded-tile object-cover" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-card-title font-medium text-ink">{regulars.place}</p>
            <p className="font-display text-greeting leading-none text-brand">{regulars.visits}</p>
          </div>
        </div>
        {/* A post-it like her Archive notes; the answer becomes a legacy tip */}
        <label className="mx-2 block -rotate-1 rounded-[10px] bg-note-yellow px-4 pb-4 pt-5 shadow-moment-note">
          <span className="sr-only">{regulars.ask}</span>
          <textarea
            rows={2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => setState({ regularsTip: draft.trim() })}
            placeholder={regulars.ask}
            className="block w-full resize-none bg-transparent text-body text-baton-navy placeholder:text-baton-navy/50 focus:outline-none"
          />
        </label>
        {regularsTip && <p className="px-2 text-footnote text-ink-muted">{regulars.saved}</p>}
      </div>
    </section>
  )
}
