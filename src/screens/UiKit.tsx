import { useState } from 'react'
import type { ReactNode } from 'react'
import { chloe } from '../data/people'
import { archiveSummaries } from '../data/stages'
import {
  ArrowRightIcon,
  Avatar,
  BackButton,
  BookmarkButton,
  BottomSheet,
  Button,
  Card,
  CategoryChip,
  CheckCircle,
  Chip,
  FluidGlass,
  GlassRim,
  HomeIcon,
  InlinePhoto,
  ListRow,
  ListSection,
  MomentCard,
  NoteIcon,
  PhotoOrb,
  PickCard,
  PlaneIcon,
  RecCard,
  SaveButton,
  Scrap,
  Screen,
  SegmentedControl,
  SetupCard,
  SpellOut,
  StageTag,
  Steps,
  TextArea,
  TextField,
  TodayCard,
  TodoCard,
  TodoKindIcon,
  ToneTile,
  TypedSummary,
  VisibilityBadge,
} from '../ui'
import type { RecTone, StageTone } from '../ui'

const textStyles = [
  ['text-large-title', 'Large title · 30 (page titles, greeting)'],
  ['text-title-2', 'Title 2 · 24 (section headings)'],
  ['text-today-card font-medium', 'Card title · 20, medium'],
  ['text-headline font-medium', 'Headline · 18, medium (buttons, lead)'],
  ['text-body', 'Body · 16'],
  ['text-subhead text-ink-muted', 'Subhead · 14, muted (detail lines)'],
  ['text-caption text-ink-faint', 'Caption · 12, faint (dates, placeholders)'],
]

const stageTones: StageTone[] = ['moving', 'newcomer', 'local']
const recTones: RecTone[] = ['blue', 'yellow', 'pink', 'olive', 'cream', 'navy']
const todoCopy = { markDone: 'Mark as done', markUndone: 'Not done yet', noTips: 'No tips yet.' }

// Every shared block in src/ui with its variants, on one screen, to check a
// restyle at a glance. Opened from the debug panel (Debug > Design system), not
// part of the app. Blocks that only make sense inside their screen (the camera,
// the photo cloud, the folder stack, the map, the tab bar) are listed at the end
// with where to see them.
export function UiKit() {
  const [segment, setSegment] = useState('la')
  const [chip, setChip] = useState('Food')
  const [picked, setPicked] = useState(true)
  const [done, setDone] = useState(false)
  const [saved, setSaved] = useState(true)
  const [sheet, setSheet] = useState<'medium' | 'large' | null>(null)
  const [summaryRun, setSummaryRun] = useState(0)

  return (
    <>
      <Screen eyebrow="Prototype" title="Design system">
        <div className="flex flex-col gap-10 pt-2 pb-10">
          <Section title="Type" note="One scale: 30 / 24 / 20 / 18 / 16 / 14 / 12, headings at 400, card titles and buttons at 500.">
            <Card className="flex flex-col gap-1.5">
              {textStyles.map(([className, label]) => (
                <p key={label} className={className}>
                  {label}
                </p>
              ))}
              <p className="text-body">
                Places and people in <span className="text-highlight">blue</span>
              </p>
            </Card>
          </Section>

          <Section title="Button" note="variant: primary, blue, tinted, secondary, ghost, stage, destructive, glow · size: md, sm, pill, cta">
            <div className="flex flex-col gap-2">
              <Button block>Primary</Button>
              <Button block variant="blue">
                Blue
              </Button>
              <Button block variant="tinted">
                Tinted
              </Button>
              <Button block variant="secondary">
                Secondary
              </Button>
              <Button block variant="ghost">
                Ghost
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Small</Button>
              <Button size="sm" variant="tinted">
                Tinted
              </Button>
              <Button size="sm" variant="stage">
                Stage
              </Button>
              <Button size="sm" variant="destructive">
                Delete
              </Button>
              <Button size="pill" variant="blue">
                Pill
              </Button>
            </div>
            <div className="relative flex items-center gap-3">
              <SaveButton label="Save" />
              <Button variant="glow" size="cta" className="flex-1">
                Continue
                <ArrowRightIcon />
              </Button>
            </div>
            <Caption>glow + cta (LA Wrapped's Continue) next to SaveButton (tap it)</Caption>
          </Section>

          <Section title="BackButton and BookmarkButton">
            <div className="flex items-center gap-4">
              <BackButton onClick={() => {}} />
              <BookmarkButton saved={saved} onToggle={() => setSaved((value) => !value)} />
              <BookmarkButton saved={!saved} onToggle={() => setSaved((value) => !value)} tone="paper" />
            </div>
            <Caption>The one back arrow (navy, 48pt target). The bookmark saves a Relay pick for the city it's in.</Caption>
          </Section>

          <Section title="Chip and CategoryChip">
            <div className="flex flex-wrap gap-2">
              {['Food', 'Exercise', 'Hobbies'].map((label) => (
                <Chip key={label} selected={chip === label} onClick={() => setChip(label)}>
                  {label}
                </Chip>
              ))}
              <Chip variant="onboarding">Onboarding</Chip>
            </div>
            <div className="-mx-gutter flex gap-2 overflow-x-auto px-gutter pb-1">
              <CategoryChip>Idle</CategoryChip>
              <CategoryChip selected>All</CategoryChip>
              {recTones.map((tone) => (
                <CategoryChip key={tone} selected tone={tone}>
                  {tone}
                </CategoryChip>
              ))}
            </div>
          </Section>

          <Section title="SegmentedControl" note="Sub nav inside a page, e.g. Relay's city switch while she's moving.">
            <SegmentedControl
              segments={[
                { id: 'la', label: 'Los Angeles' },
                { id: 'ny', label: 'New York' },
              ]}
              value={segment}
              onChange={setSegment}
            />
          </Section>

          <Section title="StageTag" note="Accent pills. sizes sm, md, lg · tone stage or light.">
            <div className="flex flex-wrap items-center gap-2">
              <StageTag stage="moving" label="Moving" />
              <StageTag stage="newcomer" label="Landing" />
              <StageTag stage="local" label="Los Angeles" />
              <StageTag stage="moving" label="Moving" size="md" />
              <StageTag stage="newcomer" label="New York" size="lg" />
              <StageTag stage="local" label="Light" size="lg" tone="light" />
            </div>
          </Section>

          <Section title="TodayCard" note="Today's list card: a photo or leading element, a title with places in blue, why it's here.">
            <TodayCard
              title="One more morning at Philz Coffee"
              highlight={['Philz Coffee']}
              subtitle="You've been here 41 times"
              photo="/relay/cafe.jpg"
              onClick={() => {}}
            />
            <TodayCard title="Pick a place from today" subtitle="Leading element, no photo" leading={<TodoKindIcon kind="transit" size="lg" />} onClick={() => {}} />
            <TodayCard title="A finished card" subtitle="done" photo="/relay/diner.jpg" done />
          </Section>

          <Section title="MomentCard" note="The one card that marks a moment in her move, in an accent color.">
            {stageTones.map((stage) => (
              <MomentCard key={stage} stage={stage} eyebrow={`stage="${stage}"`} title="Your LA, wrapped" subtitle="Notes from 12 friends" photo="/archive/la-sunset.jpg" onClick={() => {}} />
            ))}
          </Section>

          <Section title="SetupCard" note="Finish setting up. tone blue, pink, olive · done.">
            <div className="-mx-gutter flex gap-3 overflow-x-auto px-gutter pb-3">
              <SetupCard icon={<NoteIcon />} tone="blue" title="Instagram tag" subtitle="So friends can leave notes" onClick={() => {}} />
              <SetupCard icon={<HomeIcon />} tone="pink" title="Moving to-dos" subtitle="Pick what you need" onClick={() => {}} />
              <SetupCard icon={<PlaneIcon />} tone="olive" title="Leave date" subtitle="Done" done />
            </div>
          </Section>

          <Section title="TodoCard, PickCard, TodoKindIcon">
            <TodoCard
              kind="home"
              title="Give notice to your landlord"
              subtitle="2 tips"
              tips={[{ text: 'Email it, so you have it in writing.', from: 'Maya, left LA in 2025' }]}
              done={done}
              onToggleDone={() => setDone((value) => !value)}
              copy={todoCopy}
            />
            <PickCard title="Forward your mail" detail="USPS, takes 5 minutes" picked={picked} onToggle={() => setPicked((value) => !value)} />
            <div className="flex gap-2">
              {(['home', 'belongings', 'accounts', 'goodbyes', 'transit'] as const).map((kind) => (
                <TodoKindIcon key={kind} kind={kind} size="lg" />
              ))}
            </div>
          </Section>

          <Section title="RecCard, Scrap, ToneTile" note="Relay's scrapbook look: size lg (Baton's picks) and sm (from people), one tone per category.">
            <div className="-mx-gutter flex gap-2 overflow-x-auto px-gutter">
              <RecCard look="scrapbook" title="Ground Support" text="Like Philz, but in SoHo" tone="blue" photo="/relay/cafe.jpg" label="Food" index={0} onClick={() => {}} />
              <RecCard look="scrapbook" size="sm" title="Climbing" text="Go on weeknights" tone="pink" photo="/relay/climbing.jpg" label="Exercise" index={1} onClick={() => {}} />
            </div>
            <Scrap tone="yellow" tilt={false}>
              <ToneTile tone="yellow" src="/relay/diner.jpg" alt="" label="Scrap + ToneTile" className="h-32" />
              <p className="px-1.5 pt-2.5 text-today-card font-medium">A scrap on its own, no tilt</p>
            </Scrap>
            <div className="grid grid-cols-6 gap-1.5">
              {recTones.map((tone) => (
                <ToneTile key={tone} tone={tone} alt={tone} className="aspect-square" />
              ))}
            </div>
          </Section>

          <Section title="Card and VisibilityBadge" note="Card tones: default, muted, outline, stage.">
            <Card className="flex items-center gap-3">
              <Avatar name={chloe.name} src={chloe.avatar} />
              <p className="min-w-0 flex-1 text-body">Default</p>
              <VisibilityBadge visibility="private" />
            </Card>
            <Card tone="muted" className="flex items-center justify-between">
              <p className="text-body">Muted</p>
              <VisibilityBadge visibility="community" />
            </Card>
            <Card tone="outline">Outline</Card>
            <Card tone="stage">Stage</Card>
          </Section>

          <Section title="ListSection and ListRow">
            <ListSection header="Header" footer="A footnote under the group.">
              <ListRow title="Moving to" value="New York" chevron onClick={() => {}} />
              <ListRow title={chloe.name} subtitle="Los Angeles" leading={<Avatar name={chloe.name} src={chloe.avatar} size="sm" />} />
              <ListRow title="Done row" done leading={<CheckCircle checked />} />
              <ListRow title="Open row" leading={<CheckCircle checked={false} />} />
            </ListSection>
          </Section>

          <Section title="Avatar, CheckCircle, Steps">
            <div className="flex items-center gap-3">
              <Avatar name={chloe.name} src={chloe.avatar} size="sm" />
              <Avatar name={chloe.name} src={chloe.avatar} />
              <Avatar name={chloe.name} src={chloe.avatar} size="lg" />
              <Avatar name="Maya Kim" size="lg" />
              <CheckCircle checked />
              <CheckCircle checked={false} />
              <Steps count={5} current={2} />
            </div>
          </Section>

          <Section title="InlinePhoto, TypedSummary, SpellOut">
            <p className="text-title-2">
              Coffee <InlinePhoto photos={[{ alt: 'Café', src: '/relay/cafe.jpg' }]} /> and hikes{' '}
              <InlinePhoto
                photos={[
                  { alt: 'Hike', src: '/archive/la-sunset.jpg' },
                  { alt: 'Diner', src: '/relay/diner.jpg' },
                ]}
              />
            </p>
            <button type="button" onClick={() => setSummaryRun((run) => run + 1)} className="text-left">
              <TypedSummary key={summaryRun} parts={archiveSummaries.la.moving!.parts} play className="text-title-2" />
            </button>
            <Caption>Tap the sentence to replay it.</Caption>
            <p className="text-title-2">
              <SpellOut key={summaryRun} text="Spelled out" />
            </p>
          </Section>

          <Section title="TextField and TextArea">
            <TextField label="Moving to" placeholder="New York" />
            <TextArea label="Reflection" placeholder="Write a few lines, or just one." />
          </Section>

          <Section title="BottomSheet">
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setSheet('medium')}>
                Medium sheet
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setSheet('large')}>
                Large sheet
              </Button>
            </div>
          </Section>

          <Section title="FluidGlass, GlassRim, PhotoOrb" note="Liquid glass only through FluidGlass. GlassRim holds still around it; PhotoOrb is a photo under the lens in the rim.">
            <div className="h-56 overflow-hidden rounded-card">
              <FluidGlass src="/archive/la-sunset.jpg" shape="blob" size={200} dispersion={0.85} />
            </div>
            <div className="flex items-center justify-around py-2">
              <div className="relative size-[120px]">
                <GlassRim size={120} />
              </div>
              <PhotoOrb src="/relay/cafe.jpg" size={150} category="places" idle={false} />
            </div>
          </Section>

          <Section title="Screen-level blocks" note="Built for one place; see them there.">
            <ListSection>
              {screenBlocks.map(([name, where]) => (
                <ListRow key={name} title={name} subtitle={where} />
              ))}
            </ListSection>
          </Section>
        </div>
      </Screen>

      <BottomSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet === 'large' ? 'Large sheet' : 'Medium sheet'}
        detent={sheet ?? 'medium'}
        action={
          <button type="button" onClick={() => setSheet(null)} className="text-body font-medium text-brand">
            Done
          </button>
        }
      >
        <ListSection>
          <ListRow title="Sheets slide up over the screen" />
          <ListRow title="Tap the dim area or Close to dismiss" />
        </ListSection>
      </BottomSheet>
    </>
  )
}

const screenBlocks: [string, string][] = [
  ['Screen', 'Every pushed page: back arrow, title, scrolling body, footer'],
  ['PromptWindow', "Today's daily prompt orb"],
  ['CameraBubble', 'The camera that opens from the orb'],
  ['TabBar and RecentPhotos', 'The floating tab bar and the + field'],
  ['FolderStack and FolderSideTab', 'Archive folders and the city page'],
  ['PhotoCloud, PhotoMenu, FilterOrb', 'Archive > a city'],
  ['LiveMap', 'Relay > Map view'],
  ['StageCardDeck, OnboardingStep, DepartureMonthPicker', 'Onboarding'],
  ['Confetti', 'Welcome to New York splash'],
  ['Logo and BatonMark', 'Feature overview, Relay detail'],
]

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-title-2">{title}</h2>
        {note && <p className="text-subhead text-ink-muted">{note}</p>}
      </div>
      {children}
    </section>
  )
}

function Caption({ children }: { children: ReactNode }) {
  return <p className="text-caption text-ink-faint">{children}</p>
}
