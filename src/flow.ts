import type { ComponentType } from 'react'
import { AboutYou, AboutYouTags } from './screens/AboutYou'
import { ExpectedDeparture } from './screens/ExpectedDeparture'
import { Archive } from './screens/Archive'
import { ArchiveDetail } from './screens/ArchiveDetail'
import { ArchiveSelected } from './screens/ArchiveSelected'
import { Capture } from './screens/Capture'
import { Reflection } from './screens/Reflection'
import { Community } from './screens/Community'
import { Features } from './screens/Features'
import { InstagramTag } from './screens/InstagramTag'
import { Intentions, IntentionsVideo } from './screens/Intentions'
import { IntentionsSet } from './screens/IntentionsSet'
import { LaWrapped } from './screens/LaWrapped'
import { NewcomerNow } from './screens/NewcomerNow'
import { LocalInsight } from './screens/LocalInsight'
import { FriendNote } from './screens/FriendNote'
import { LeaveDate } from './screens/LeaveDate'
import { PhotoAccess } from './screens/PhotoAccess'
import { Places } from './screens/Places'
import { Profile } from './screens/Profile'
import { RelayDetail } from './screens/RelayDetail'
import { RelaySearch } from './screens/RelaySearch'
import { RollingPaper } from './screens/RollingPaper'
import { ArrivedSplash, LocalSplash } from './screens/StageSplash'
import { SignUp } from './screens/SignUp'
import { Splash } from './screens/Splash'
import { Today, TodayLastWeek } from './screens/Today'
import { Todos } from './screens/Todos'
import { TodayNext } from './screens/TodayNext'
import { YourMove } from './screens/YourMove'
import { ProfileNext } from './screens/ProfileNext'

export type Stage = 'moving' | 'newcomer' | 'local'

export type FlowScreen = {
  id: string
  title: string
  stage: Stage
  component: ComponentType
  // Tab this screen shows under, when it isn't a tab itself (a Today variant)
  tab?: string
  // Where Back goes: the screen above this one in the IA, never just the one
  // opened before it (Keller, Oct 21). Tabs, onboarding and story moments have none.
  // A list when it lives in more than one place: Back goes to the one it was
  // opened from, else the first.
  parent?: string | string[]
}

// The hero flow, in order. Add screens here as they are built; the debug panel,
// arrow keys and URL hash all follow this list.
export const flow: FlowScreen[] = [
  // 1. Onboarding
  { id: 'features', title: 'Onboarding: feature overview', stage: 'moving', component: Features },
  { id: 'signup', title: 'Onboarding: sign up / log in', stage: 'moving', component: SignUp },
  { id: 'about', title: 'Onboarding: about you', stage: 'moving', component: AboutYou },
  { id: 'about-leave', title: 'Onboarding: expected departure', stage: 'moving', component: ExpectedDeparture },
  { id: 'about-tags', title: 'Onboarding: about you tags', stage: 'moving', component: AboutYouTags },
  { id: 'photos', title: 'Onboarding: photo access', stage: 'moving', component: PhotoAccess },
  { id: 'welcome', title: 'Onboarding: welcome splash', stage: 'moving', component: Splash },
  // 2. Today, Moving, with the setup list (each item opens a setup page)
  // IA v2 (Nov 15): Today is the base app; the moving layer adds Your move
  { id: 'today', title: 'Today', stage: 'moving', component: TodayNext },
  { id: 'move', title: 'Your move', stage: 'moving', component: YourMove, parent: 'today' },
  // The stage version of Today (before IA v2), kept for the debug panel
  { id: 'today-stages', title: 'Today (stages, old)', stage: 'moving', component: Today, tab: 'today' },
  { id: 'setup-archive', title: 'Setup: organize archive', stage: 'moving', component: Places, parent: 'today' },
  { id: 'setup-todos', title: 'Setup: logistics to-dos', stage: 'moving', component: Todos, parent: 'today' },
  { id: 'setup-leave', title: 'Setup: leave date', stage: 'moving', component: LeaveDate, parent: ['today', 'profile'] },
  { id: 'setup-instagram', title: 'Setup: Instagram tag', stage: 'moving', component: InstagramTag, parent: ['today', 'move'] },
  { id: 'archive', title: 'Archive', stage: 'moving', component: Archive },
  { id: 'archive-detail', title: 'Archive: city detail', stage: 'moving', component: ArchiveDetail, parent: ['archive', 'move'] },
  { id: 'archive-selected', title: 'Archive: a photo opened', stage: 'moving', component: ArchiveSelected, parent: 'archive-detail' },
  { id: 'community', title: 'Relay', stage: 'moving', component: Community },
  // Relay's search icon opens its own page, like search in iOS apps
  { id: 'relay-search', title: 'Relay: search', stage: 'moving', component: RelaySearch, parent: 'community' },
  { id: 'capture', title: 'Capture (+)', stage: 'moving', component: Capture, parent: 'today' },
  // Debug > Real-life: writing a line about the photo just taken
  { id: 'reflection', title: 'Real-life: reflection', stage: 'moving', component: Reflection, parent: 'today' },
  { id: 'profile', title: 'Profile', stage: 'moving', component: ProfileNext, parent: 'today' },
  { id: 'profile-stages', title: 'Profile (stages, old)', stage: 'moving', component: Profile, parent: 'today' },
  // 6. Before her last night in LA: her intentions for New York (from Profile)
  { id: 'intentions', title: 'Profile: intentions for New York', stage: 'moving', component: Intentions, parent: 'profile' },
  { id: 'intentions-set', title: 'Your next chapter in New York', stage: 'moving', component: IntentionsSet },
  // 5. Friend follows Chloe's Instagram link to the public note form.
  { id: 'friend-note', title: 'Friend: leave Chloe a note', stage: 'moving', component: FriendNote },
  // 6. Last week in LA: Today shows the legacy card
  { id: 'today-last-week', title: 'Today: last week in LA', stage: 'moving', component: TodayLastWeek, tab: 'today' },
  // 7. Landing: the congrats splash pops up as she becomes a Newcomer...
  { id: 'arrived', title: 'Stage change: welcome to New York', stage: 'newcomer', component: ArrivedSplash },
  // ...then the Rolling Paper of friends' notes prints out of the Dynamic Island
  { id: 'rolling-paper', title: 'Rolling Paper', stage: 'newcomer', component: RollingPaper },
  // ...and its button opens LA Wrapped (dots zoom open into the timeline)
  { id: 'la-wrapped', title: 'LA Wrapped', stage: 'newcomer', component: LaWrapped },
  // ...and its Continue: her LA folder hands off to a new New York one, with her goals
  { id: 'newcomer-now', title: "You're a Newcomer now", stage: 'newcomer', component: NewcomerNow },
  // 9. Recommendation detail: a Relay pick or tip, with notes on it
  { id: 'relay-detail', title: 'Relay: recommendation detail', stage: 'newcomer', component: RelayDetail, parent: ['community', 'relay-search', 'today', 'move'] },
  // 10. Local: the congrats splash as she becomes a Local
  { id: 'local-splash', title: "Stage change: you're a Local", stage: 'local', component: LocalSplash },
  // ...whose button opens the insight page: LA vs New York, her intention, the café bookend
  { id: 'local-insight', title: 'Local: how your life changed', stage: 'local', component: LocalInsight },
  // Team-only recording shortcut, outside the normal story sequence.
  { id: 'intentions-video', title: 'Video: intentions from blank', stage: 'moving', component: IntentionsVideo },
]

export const stageLabels: Record<Stage, string> = {
  moving: 'Moving · LA',
  newcomer: 'Newcomer · New York',
  local: 'Local · New York',
}
