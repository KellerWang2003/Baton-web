import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { openComposer, registerComposerField } from '../app/composer'
import { navigate } from '../app/navigate'
import { saveCapture } from '../app/supabase'
import { setState, useDailyPrompt, useStatus, useStore } from '../app/store'
import { useKeyboardArea } from '../app/useKeyboardArea'
import { pages, tabs } from '../data/pages'
import { chloe } from '../data/people'
import { recentPhotos } from '../data/photos'
import { stageTags } from '../data/stages'
import { ArchiveIcon, Avatar, CameraBubble, MapPinIcon, RelayIcon, Screen, StageTag, TabBar, TodayIcon } from '../ui'

type MainLayoutProps = {
  // Tabs have no page title; Today shows its greeting here
  title?: string
  subtitle?: string
  children: ReactNode
  // Full-bleed body that stretches to the bottom edge (e.g. Archive folders)
  bleed?: boolean
  // Profile button beside the greeting (Today only)
  profile?: boolean
  // Page background class (Relay sits on the paper color, like Archive)
  background?: string
  // The stage tag under the avatar (off in IA v2, which has no stages)
  stageTag?: boolean
}

type TabShellProps = {
  activeTab: string
  children: ReactNode
}

const tabIcons: Record<string, ReactNode> = {
  today: <TodayIcon />,
  archive: <ArchiveIcon />,
  community: <RelayIcon />,
}

// Page layout for the three tab pages. No top bar: on Today the greeting
// and profile avatar scroll together with the page.
// Pushed pages (Profile) use Screen directly, without the tab bar.
export function MainLayout({ title, subtitle, children, bleed = false, profile = false, background, stageTag = true }: MainLayoutProps) {
  const status = useStatus()
  const greeting = title && (
    // One sentence in one style, the second part on its own line, 30pt in
    // from the sides (Figma TODAY 334:10106)
    <header className="flex items-start justify-between gap-3 pb-2 pt-3">
      <h1 className="min-w-0 flex-1 font-display text-greeting font-normal text-ink">
        {title}
        {subtitle && (
          <>
            <br />
            {subtitle}
          </>
        )}
      </h1>
      {profile && (
        <button
          type="button"
          onClick={() => navigate('profile')}
          aria-label="Profile"
          className="relative inline-flex shrink-0 items-center justify-center rounded-full transition-transform duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand motion-reduce:transition-none"
        >
          {/* 48pt picture with the stage tag overlapping its bottom by 4pt (Figma 617:2838) */}
          <Avatar name={chloe.name} src={chloe.avatar} size="lg" className="size-12" />
          {stageTag && <StageTag stage={status} label={stageTags[status]} className="absolute top-11 left-1/2 -translate-x-1/2" />}
        </button>
      )}
    </header>
  )

  return (
    <div className="relative h-full">
      <Screen bleed={bleed} background={background}>
        {bleed ? (
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        ) : (
          // Room so the last content can scroll above the floating tab bar
          <div className="pb-24" data-glass-scene>
            {greeting || <div className="h-3" />}
            {children}
          </div>
        )}
      </Screen>
    </div>
  )
}

// The floating tab bar over the tab pages. App renders it once around whichever
// tab is showing, so switching tabs only swaps the page and the bar stays put
// (remounting it with each page made every tab switch look like a reload).
// Tapping + turns it into a text field for today's prompt, right in the tab bar.
export function TabShell({ activeTab, children }: TabShellProps) {
  const { composing, hideNav } = useStore()
  const dailyPrompt = useDailyPrompt()
  const [toast, setToast] = useState(false)
  const keyboard = useKeyboardArea()

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(false), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <div className="relative h-full">
      {/* The page keeps its full size while the keyboard is up (resizing it
          made it jump), and if Safari still pans the view, it moves back down
          by as much so it stays where it was */}
      <div style={keyboard?.top ? { transform: `translateY(${keyboard.top}px)` } : undefined} className="h-full">
        {children}
      </div>

      {/* Today's camera, opened out of the prompt bubble; covers the tab bar */}
      <CameraBubble />

      {/* While the keyboard is up this layer fills just the part of the screen
          above it, so the dim covers what's visible and the bar sits right on
          the keyboard */}
      <div
        style={keyboard ? { position: 'fixed', left: 0, right: 0, top: keyboard.top, height: keyboard.height } : undefined}
        className={`pointer-events-none absolute inset-0 z-20 ${hideNav ? 'hidden' : ''}`}
      >
        {/* While typing: a heavy blur over the whole page, so nothing behind
            can be read, under a blue glow at the bottom, around the field */}
        <div
          onClick={() => setState({ composing: false })}
          className={`absolute inset-0 z-20 ${composing ? 'pointer-events-auto' : 'pointer-events-none'}`}
        >
          {/* The blur itself eases in and out, so it doesn't land all at once */}
          <div
            className={`absolute inset-0 transition-[backdrop-filter] duration-500 ease-out ${composing ? 'backdrop-blur-[24px]' : 'backdrop-blur-[0px]'}`}
          />
          {/* A light white tint, so the page behind reads even less */}
          <div
            className={`absolute inset-0 bg-surface/55 transition-opacity duration-500 ease-out ${composing ? 'opacity-100' : 'opacity-0'}`}
          />
          <div
            className={`absolute inset-0 bg-linear-to-b from-baton-blue/0 from-55% to-baton-blue/90 transition-opacity duration-500 ease-out ${composing ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>

        {/* Rides on top of the keyboard on phones */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col transition-[padding] duration-300 ease-out ${keyboard ? 'pb-2' : 'pb-6'}`}
        >
          <div
            className={`mx-4 mb-3 flex flex-col gap-1 px-1 transition duration-300 ${composing ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
          >
            <p className="font-display text-title-1 font-medium text-ink">{dailyPrompt.question}</p>
            <p className="flex items-center gap-1.5 text-subhead font-medium text-ink">
              <MapPinIcon className="size-4 shrink-0" />
              {dailyPrompt.seed}
            </p>
          </div>
          <p
            role="status"
            className={`mx-auto mb-3 whitespace-nowrap rounded-full bg-ink px-4 py-2 text-subhead text-canvas transition duration-300 ${toast ? 'opacity-100' : 'pointer-events-none h-0 overflow-hidden p-0 opacity-0'}`}
          >
            {pages.capture.saved}
          </p>
          <TabBar
            tabs={tabs.map((tab) => ({ ...tab, icon: tabIcons[tab.id] }))}
            active={activeTab}
            onSelect={navigate}
            composing={composing}
            onOpen={openComposer}
            onClose={() => setState({ composing: false })}
            recentPhotos={recentPhotos}
            fieldRef={registerComposerField}
            placeholder={pages.capture.composerPlaceholder}
            saveLabel={pages.capture.save}
            onSubmit={(text, photos) => {
              setState((s) => ({ reflections: [...s.reflections, { text, photos }] }))
              void saveCapture({ photo: null, question: '', note: text, category: null, place: '', promptNumber: 0, timeLabel: '', spot: null })
              setToast(true)
            }}
          />
        </div>
      </div>
    </div>
  )
}

// The tab bar as a picture: not tappable, no + field (Archive sketches page)
export function StaticTabBar({ active }: { active: string }) {
  return (
    <TabBar
      tabs={tabs.map((tab) => ({ ...tab, icon: tabIcons[tab.id] }))}
      active={active}
      composing={false}
      onOpen={() => {}}
      onClose={() => {}}
      onSubmit={() => {}}
      onSelect={() => {}}
    />
  )
}
