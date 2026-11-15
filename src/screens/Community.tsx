import { Suspense, lazy, useRef, useState } from 'react'
import { navigate } from '../app/navigate'
import { setState, useHomeCity, useStatus, useStore } from '../app/store'
import { cities } from '../data/move'
import type { CityId } from '../data/move'
import { cityLeavers, cityPicks, leaverTips, relayCategory, relayChipIds, relayCopy, relayHeaders, relayItems, relayPlaceholderPhoto } from '../data/relay'
import { homeSpot, mapNeighborhoods, relaySpots } from '../data/mapSpots'
import type { RelayCategory, RelayItem } from '../data/relay'
import { CategoryChip, CityStamp, MapIcon, SearchIcon, cx, relayChipIdle, relayPage } from '../ui'
import { useRelayEntrance } from '../ui/relayEntrance'
import { MainLayout } from './MainLayout'
import { RelayFeed } from './RelayFeed'

// The map library is big, so it loads with Relay's map, not the whole app
const LiveMap = lazy(() => import('../ui/LiveMap').then((m) => ({ default: m.LiveMap })))

// Match the 28px above the 40px filters with 28px below them, before
// the tab bar (61px tall, resting 24px above the bottom of the screen).
const mapPeek = 28 + 40 + 28 + 61 + 24

function open(id: string) {
  setState({ selectedRec: id })
  navigate('relay-detail')
}

// Relay (Figma 265:2550): category filters, Baton's picks from her life, then
// tips from the legacies of people with a similar lifestyle; each card takes
// its category's color. The Map button slides the whole list down like a sheet
// (the AllTrails list/map pattern) to show the same picks as pins on a map.
export function Community() {
  const status = useStatus()
  const { relayMap: mapOpen, relayFilter, relayLook, relayEntrance, relayEntranceSpeed, relayCity, relaySaved, saved, moving, landed } = useStore()
  // IA v2: Relay shows her city; while she's moving, the other city's stamp
  // peeks behind and switches to it
  const home = useHomeCity()
  const city: CityId = relayCity ?? home
  const other: CityId | null = moving && !landed ? (city === 'la' ? 'ny' : 'la') : relayCity && relayCity !== home ? home : null
  const entranceRef = useRef<HTMLDivElement>(null)
  const category = relayFilter as RelayCategory | null
  useRelayEntrance(entranceRef, relayEntrance, relayEntranceSpeed, `${status}:${relayLook}:${relayFilter}:${city}:${relaySaved}`)
  const [pinned, setPinned] = useState<string | null>(null)
  // Where the press on the peek started; mouse and pen drags also keep recent
  // samples for a flick and the phone frame's scale, so the sheet stays under the pointer
  const dragFrom = useRef<{ y: number; mouse: boolean; scale: number; samples: { y: number; t: number }[] } | null>(null)
  // How far the sheet is being pulled up right now (negative), while a finger is on it
  const [pull, setPull] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const shown = (item: RelayItem) => (!category || item.category === category) && (!relaySaved || saved[city].includes(item.id))
  const setCategory = (id: RelayCategory | null) => {
    setState({ relayFilter: id, relaySaved: false })
    setPinned(null)
  }
  const showMap = (on: boolean) => {
    // The sheet slides down showing its top (filters and first heading), wherever the list was scrolled
    if (on) listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setState({ relayMap: on })
    setPinned(null)
  }

  // The Saved chip lists every saved pick of the city, Baton's and leavers'
  const savedPicks = relayItems.filter((item) => saved[city].includes(item.id) && (!category || item.category === category))
  const picks = relaySaved ? savedPicks : cityPicks(city, status).filter(shown)
  const people = (relaySaved ? [] : cityLeavers(city))
    .map((leaver) => ({ leaver, tips: leaverTips(leaver.id).filter(shown) }))
    .filter((row) => row.tips.length > 0)
  const onMap = [...picks, ...people.flatMap((row) => row.tips)].filter((item) => relaySpots[item.id])
  const pinnedItem = onMap.find((item) => item.id === pinned)
  const headers = { picks: relaySaved ? relayCopy.saved : relayCopy.forYou, people: relayHeaders[status].people }

  return (
    <MainLayout bleed background={relayPage[relayLook]}>
      <div ref={entranceRef} className="relative min-h-0 flex-1 overflow-hidden">
        {/* The map, behind everything; the list slides down to show it */}
        <div className="absolute inset-0" inert={!mapOpen}>
          {/* A real New York to drag and zoom, in the Paper look Keller picked (Oct 18) */}
          <Suspense>
            <LiveMap
              look="paper"
              you={homeSpot}
              labels={mapNeighborhoods}
              selected={pinned}
              onSelect={setPinned}
              coverBottom={mapPeek}
              pins={onMap.map((item) => ({
                id: item.id,
                ...relaySpots[item.id],
                tone: relayCategory(item.category).tone,
                title: item.title,
              }))}
              className="size-full"
            />
          </Suspense>
        </div>

        {/* Everything, filters included, is one sheet: slid down to a peek above the tab bar while the map shows */}
        <div
          style={{ transform: mapOpen ? `translateY(calc(100% - ${mapPeek}px + ${pull ?? 0}px))` : `translateY(${pull ?? 0}px)` }}
          className={cx(
            'absolute inset-0 z-10 ease-[cubic-bezier(0.32,0.72,0,1)]',
            // Follows the finger while pulled, glides otherwise
            pull === null && 'transition-[transform,border-radius,box-shadow] duration-500',
            relayPage[relayLook],
            mapOpen && 'rounded-t-map-sheet shadow-sheet',
          )}
        >
          {mapOpen && (
            // The visible top of the sheet: swipe it up (or tap) to bring the list back
            <button
              type="button"
              aria-label="Show the list"
              onPointerDown={(event) => {
                const mouse = event.pointerType !== 'touch'
                if (mouse && event.button !== 0) return
                if (mouse) event.preventDefault()
                const rect = event.currentTarget.getBoundingClientRect()
                const scale = mouse ? rect.width / event.currentTarget.offsetWidth || 1 : 1
                dragFrom.current = { y: event.clientY, mouse, scale, samples: [{ y: event.clientY, t: event.timeStamp }] }
                event.currentTarget.setPointerCapture(event.pointerId)
                setPull(0)
              }}
              onPointerMove={(event) => {
                const d = dragFrom.current
                if (!d) return
                const dy = (event.clientY - d.y) / d.scale
                if (!d.mouse) {
                  setPull(Math.min(0, dy))
                  return
                }
                d.samples = [...d.samples.filter((sample) => event.timeStamp - sample.t < 100), { y: event.clientY, t: event.timeStamp }]
                // Up follows the pointer; down gives a little and resists
                setPull(dy < 0 ? dy : Math.min(24, dy * 0.25))
              }}
              onPointerUp={(event) => {
                const d = dragFrom.current
                dragFrom.current = null
                setPull(null)
                if (!d) return
                const moved = (d.y - event.clientY) / d.scale
                if (!d.mouse) {
                  // A swipe up, or a plain tap, brings the list back; a small nudge snaps back down
                  if (moved > 40 || Math.abs(moved) < 6) showMap(false)
                  return
                }
                const first = d.samples[0]
                const speed = event.timeStamp > first.t ? (first.y - event.clientY) / d.scale / (event.timeStamp - first.t) : 0
                // Mouse: a click, a drag up past 30pt, or a quick flick up brings the list back
                if (Math.abs(moved) < 6 || moved > 30 || (speed > 0.3 && moved > 8)) showMap(false)
              }}
              onPointerCancel={() => {
                dragFrom.current = null
                setPull(null)
              }}
              // Two-finger swipe up on a trackpad
              onWheel={(event) => {
                if (event.deltaY > 12) showMap(false)
              }}
              className="absolute inset-0 z-10 cursor-grab touch-none select-none rounded-t-map-sheet active:cursor-grabbing"
            >
              {/* The grabber: says the sheet can be pulled back up */}
              <span aria-hidden className="absolute top-2 left-1/2 h-[5px] w-9 -translate-x-1/2 rounded-full bg-ink-faint" />
            </button>
          )}
          <div
            ref={listRef}
            className={cx(
              'flex h-full flex-col gap-10 overscroll-y-contain px-gutter pb-44 transition-[padding] duration-500',
              // Room for the grabber over the filters while it's a sheet
              mapOpen ? 'overflow-hidden pt-7' : 'overflow-y-auto pt-4',
            )}
          >
            {/* Search on top, always (opens its own page), with the map beside it */}
            {!mapOpen && (
              <div data-relay-enter className="-mb-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('relay-search')}
                  className={cx('flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full px-4 text-left text-body text-ink-muted active:opacity-70', relayChipIdle[relayLook])}
                >
                  <SearchIcon className="size-[18px] shrink-0" />
                  <span className="truncate">{relayCopy.searchIn(cities[city].name)}</span>
                </button>
                <button
                  type="button"
                  aria-label={relayCopy.map}
                  onClick={() => showMap(true)}
                  className={cx('flex size-12 shrink-0 items-center justify-center rounded-full active:opacity-60', relayChipIdle[relayLook])}
                >
                  <MapIcon />
                </button>
              </div>
            )}
            {/* Saved first, then the categories */}
            <div data-relay-enter className="-mb-4">
              <div className="-mx-gutter flex gap-2 overflow-x-auto px-gutter [scrollbar-width:none]">
                <CategoryChip look={relayLook} tone="yellow" selected={relaySaved} onClick={() => setState({ relaySaved: !relaySaved, relayFilter: null })}>
                  <span className="inline-flex items-center gap-1.5">
                    <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
                      <path d="M8 1.2l2 4.2 4.6.6-3.4 3.2.9 4.6L8 11.6 3.9 13.8l.9-4.6L1.4 6l4.6-.6L8 1.2z" />
                    </svg>
                    {relayCopy.saved}
                  </span>
                </CategoryChip>
                <CategoryChip look={relayLook} selected={!category && !relaySaved} onClick={() => setCategory(null)}>
                  {relayCopy.all}
                </CategoryChip>
                {relayChipIds.map((id) => {
                  const item = relayCategory(id)
                  return (
                    <CategoryChip
                      key={item.id}
                      tone={item.tone}
                      look={relayLook}
                      selected={category === item.id}
                      onClick={() => setCategory(category === item.id ? null : item.id)}
                    >
                      {item.label}
                    </CategoryChip>
                  )
                })}
              </div>
            </div>
            {/* Below the filters: hidden behind the nav while the map shows */}
            <div className={cx('flex flex-col gap-10 transition-opacity duration-300', mapOpen && 'pointer-events-none opacity-0')}>
              <RelayFeed look={relayLook} headers={headers} picks={picks} people={people} onOpen={open} />

              {picks.length === 0 && people.length === 0 && (
                <p data-relay-enter className="text-subhead text-ink-muted">{relaySaved ? relayCopy.savedEmpty : relayCopy.noResults}</p>
              )}
            </div>
          </div>
        </div>

        {/* A tapped pin: a small card that opens the recommendation */}
        {mapOpen && pinnedItem && (
          <button
            type="button"
            onClick={() => open(pinnedItem.id)}
            className="absolute inset-x-6 bottom-[173px] z-20 flex items-center gap-3 rounded-card bg-surface p-2 pr-4 text-left shadow-float animate-fade-in"
          >
            <img src={pinnedItem.photo ?? relayPlaceholderPhoto} alt="" className="size-16 shrink-0 rounded-tile object-cover" />
            <div className="min-w-0">
              <p className="truncate font-display text-headline font-medium text-baton-navy">{pinnedItem.title}</p>
              <p className="line-clamp-2 text-footnote text-ink-muted">
                {pinnedItem.quote ? `“${pinnedItem.quote}”` : pinnedItem.source.kind === 'baton' ? pinnedItem.source.why : pinnedItem.body}
              </p>
            </div>
          </button>
        )}

        {/* Her city's stamp, floating bottom right above the nav. While she's
            moving the other city's stamp peeks behind it; tapping switches */}
        {!mapOpen && (
          <button
            type="button"
            aria-label={other ? `Show ${cities[other].name}` : cities[city].name}
            disabled={!other}
            onClick={() => other && setState({ relayCity: other, relayFilter: null, relaySaved: false })}
            className="absolute right-5 bottom-[110px] z-20 size-[84px] transition active:scale-95"
          >
            {other && <CityStamp key={`back-${other}`} city={other} size={60} className="absolute -top-4 -left-3 -rotate-12 animate-fade-in" />}
            <CityStamp key={city} city={city} size={76} className="absolute right-0 bottom-0 rotate-6 animate-fade-in" />
          </button>
        )}
      </div>
    </MainLayout>
  )
}
