import { useState } from 'react'
import { navigate } from '../app/navigate'
import { setState, useDailyPrompt, useNow, useStatus, useStore } from '../app/store'
import { greeting, timeOfDay } from '../data/greetings'
import { friendsToday, regulars, worthGoing } from '../data/home'
import { mockMove, moveCard } from '../data/move'
import { promptMedium } from '../data/pages'
import { findLeaver, relayAvatar, relayItems } from '../data/relay'
import { daysUntil } from '../data/today'
import { Avatar, CityStamp, MoveCard, TodayCard } from '../ui'
import { MainLayout } from './MainLayout'
import { PromptPair } from './PromptPair'

// IA v2 Today (Nov 15): answers "what about today?". Top to bottom: greeting
// and avatar; the Moving card while "I'm moving" is on; today's prompt and the
// one from where she is as two overlapping circles; friends' answers; a few
// places worth going today (Keller: a list is fine); her regulars.
export function TodayNext() {
  const { moving, landed, moveDate } = useStore()
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

      <PromptPair
        daily={{ question: prompt.question, medium }}
        onOpen={(circle) => setState({ camera: circle, composing: false })}
      />

      <div className="flex flex-col gap-10 pt-2">
        <FriendsToday />
        <WorthGoing />
        <Regulars />
      </div>
    </MainLayout>
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
  const picks = worthGoing.picks.map((id) => relayItems.find((rec) => rec.id === id)).filter((rec) => rec !== undefined)
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-section font-normal text-ink">{worthGoing.title}</h2>
      <div className="flex flex-col gap-3">
        {picks.map((item) => {
          const leaver = item.source.kind === 'leaver' ? findLeaver(item.source.leaver) : undefined
          return (
            <TodayCard
              key={item.id}
              title={item.title}
              subtitle={item.place}
              photo={item.photo}
              trailing={leaver && <Avatar name={leaver.name} src={relayAvatar(leaver.name)} size="sm" className="mr-1 shrink-0" />}
              onClick={() => {
                setState({ selectedRec: item.id })
                navigate('relay-detail')
              }}
            />
          )
        })}
      </div>
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
