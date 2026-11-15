import type { ReactNode } from 'react'
import { navigate } from '../app/navigate'
import { setState, toggleIn, useStore } from '../app/store'
import { cities, friendNotesPreview, mockMove, moveCard, moveTodos, yourMove } from '../data/move'
import { todoKind } from '../data/onboarding'
import { relayCategory, relayItems, relayPlaceholderPhoto } from '../data/relay'
import { allTodos, beforeYouLeave, daysUntil, shortDate, tips } from '../data/today'
import { CityStamp, PlusIcon, RecCard, Screen, TodoCard, cx } from '../ui'

// IA v2: Your move, pushed from the Moving card on Today. Before she leaves:
// to-dos with tips, places saved in New York, friends' notes so far, and her LA
// legacy (locked until her last night). After landing (Debug > Demo > Landed):
// the Rolling Paper and LA Wrapped, arrival to-dos, saved places and the new
// New York folder.
export function YourMove() {
  const { landed, moveDate, moveCity, saved, doneTodos } = useStore()
  const date = moveDate || mockMove.date
  const days = daysUntil(mockMove.today, date)
  const savedItems = saved.ny.flatMap((id) => relayItems.find((item) => item.id === id) ?? [])
  const todoIds = landed ? moveTodos.after : moveTodos.before

  const todos = (
    <Section title={landed ? yourMove.arrivalTodos : yourMove.todos}>
      <div className="flex flex-col gap-3">
        {todoIds.flatMap((id) => allTodos.find((todo) => todo.id === id) ?? []).map((todo) => {
          const todoTips = tips[todo.id] ?? []
          return (
            <TodoCard
              key={todo.id}
              kind={todoKind[todo.id] ?? 'home'}
              title={todo.title}
              subtitle={todoTips.length ? beforeYouLeave.tipCount(todoTips.length) : undefined}
              tips={todoTips}
              done={doneTodos.includes(todo.id)}
              onToggleDone={() => setState((s) => ({ doneTodos: toggleIn(s.doneTodos, todo.id) }))}
              copy={beforeYouLeave}
            />
          )
        })}
      </div>
    </Section>
  )

  const savedRow = (
    <Section title={landed ? yourMove.savedPlaces : yourMove.saved(moveCity || cities.ny.name)}>
      <div className="-mx-gutter flex snap-x scroll-px-gutter gap-1 overflow-x-auto px-gutter [scrollbar-width:none]">
        {savedItems.map((item, i) => (
          <RecCard
            key={item.id}
            look="scrapbook"
            size="sm"
            index={i}
            title={item.title}
            text={item.place ?? ''}
            tone={relayCategory(item.category).tone}
            photo={item.photo ?? relayPlaceholderPhoto}
            onClick={() => {
              setState({ selectedRec: item.id })
              navigate('relay-detail')
            }}
          />
        ))}
        {/* Find more in New York: Relay switched to it */}
        <button
          type="button"
          aria-label={`Browse ${cities.ny.name}`}
          onClick={() => {
            setState({ relayCity: 'ny', relaySaved: false })
            navigate('community')
          }}
          className="my-3 ml-2 flex w-24 shrink-0 items-center justify-center rounded-card border-2 border-dashed border-ink-faint text-ink-muted active:opacity-60"
        >
          <PlusIcon />
        </button>
      </div>
    </Section>
  )

  return (
    <Screen onBack background="bg-baton-paper">
      <div className="flex flex-col gap-10 pb-12">
        {/* LA and NY joined by a dashed arc, the countdown big */}
        <header className="flex flex-col items-center gap-1 pt-1">
          <div className="relative flex w-full items-end justify-between px-4">
            <CityStamp city="la" size={72} />
            <svg aria-hidden viewBox="0 0 160 60" className="absolute inset-x-[88px] top-0 h-14 w-[calc(100%-176px)]" preserveAspectRatio="none">
              <path d="M4 56 Q80 -14 156 56" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeDasharray="5 6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <CityStamp city="ny" size={72} />
          </div>
          <p className="pt-4 font-display text-[56px] leading-none text-ink">{landed ? moveCard.day(mockMove.daysInNewYork) : moveCard.days(days)}</p>
          <p className="text-body text-ink-muted">{shortDate(date)}</p>
        </header>

        {landed ? (
          <>
            <Section title={yourMove.keepsakes}>
              <div className="-mx-gutter flex snap-x scroll-px-gutter gap-1 overflow-x-auto px-gutter [scrollbar-width:none]">
                <RecCard look="scrapbook" size="sm" index={0} tone="yellow" photo={yourMove.paperPhoto} title={yourMove.paper} text="" onClick={() => navigate('rolling-paper')} />
                <RecCard look="scrapbook" size="sm" index={1} tone="blue" photo={yourMove.wrappedPhoto} title={yourMove.wrapped} text="" onClick={() => navigate('la-wrapped')} />
              </div>
            </Section>
            {todos}
            {savedRow}
            <Section title={yourMove.folder}>
              <Folder
                tone="yellow"
                title={cities.ny.name}
                detail={yourMove.folderDates}
                onClick={() => {
                  setState({ selectedFolder: 'ny' })
                  navigate('archive-detail')
                }}
              />
            </Section>
          </>
        ) : (
          <>
            {todos}
            {savedRow}
            <Section title={yourMove.notes}>
              <div className="flex items-center">
                {friendNotesPreview.map((note, i) => (
                  <div
                    key={note.name}
                    className={cx(
                      'flex aspect-square w-[34%] shrink-0 flex-col justify-between rounded-[8px] bg-note-yellow p-3 shadow-moment-note',
                      i > 0 && '-ml-[10%]',
                      ['-rotate-6', 'rotate-3 translate-y-2', '-rotate-2'][i],
                    )}
                  >
                    <p className="line-clamp-4 text-footnote leading-snug text-baton-navy">{note.text}</p>
                    <p className="text-caption text-baton-navy/60">{note.name}</p>
                  </div>
                ))}
                <button
                  type="button"
                  aria-label={yourMove.askFriends}
                  onClick={() => navigate('setup-instagram')}
                  className="ml-4 inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-card text-ink shadow-today-card active:scale-95"
                >
                  <PlusIcon />
                </button>
              </div>
            </Section>
            <Section title={yourMove.legacy}>
              <Folder
                tone="blue"
                title={cities.la.name}
                detail={yourMove.legacyOpens}
                locked
                onClick={() => {
                  setState({ selectedFolder: 'la' })
                  navigate('archive-detail')
                }}
              />
            </Section>
          </>
        )}
      </div>
    </Screen>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-section font-normal text-ink">{title}</h2>
      {children}
    </section>
  )
}

// A city folder like the Archive's, small: a tab on top, the city and a date
function Folder({ tone, title, detail, locked = false, onClick }: { tone: 'blue' | 'yellow'; title: string; detail: string; locked?: boolean; onClick: () => void }) {
  const fill = tone === 'blue' ? 'bg-baton-blue text-on-brand' : 'bg-baton-yellow text-baton-olive'
  return (
    <button type="button" onClick={onClick} className="relative block w-full pt-5 text-left transition active:scale-[0.99]">
      <span aria-hidden className={cx('absolute left-0 top-0 h-7 w-28 rounded-t-[14px]', fill)} />
      <span className={cx('relative flex h-32 items-end justify-between rounded-card rounded-tl-none p-5 shadow-today-card', fill)}>
        <span className="font-display text-greeting leading-none">{title}</span>
        <span className="flex items-center gap-1.5 text-subhead opacity-85">
          {locked && (
            <svg aria-hidden viewBox="0 0 16 18" className="size-4" fill="currentColor">
              <path d="M8 1a4 4 0 0 0-4 4v3H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-1V5a4 4 0 0 0-4-4Zm-2.5 7V5a2.5 2.5 0 0 1 5 0v3h-5Z" />
            </svg>
          )}
          {detail}
        </span>
      </span>
    </button>
  )
}
