import type { CSSProperties, ReactNode } from 'react'
import { navigate } from '../app/navigate'
import { setMove, setState, useHomeCity, useStatus, useStore } from '../app/store'
import { cities } from '../data/move'
import { chloe } from '../data/people'
import { profileNext } from '../data/profile'
import { relayAvatar } from '../data/relay'
import { archiveSummary } from '../data/stages'
import { Avatar, ListRow, ListSection, Screen, TypedSummary, cx, pickedGoalFill } from '../ui'

// Inline photos are outlined in the color behind them
const paperOutline = { '--folder-fill': 'var(--color-baton-paper)' } as CSSProperties

// IA v2 Profile (Nov 15): no stages. Header card, Cities, Lifestyle,
// Intentions, Tags, Friends (they see only prompt answers), I'm moving (city
// and date; on shows the Moving card on Today and the second stamp in Relay),
// Settings.
export function ProfileNext() {
  const { goals, tags: savedTags, moving, moveCity, moveDate, landed } = useStore()
  const status = useStatus()
  const home = useHomeCity()
  const tags = savedTags.length ? savedTags : chloe.tags
  const lifestyle = archiveSummary('la', status)
  const cityList = landed ? [...profileNext.cityList, { id: 'ny', name: cities.ny.name, years: '2026–' }] : profileNext.cityList

  return (
    <Screen onBack background="bg-baton-paper">
      <div className="flex flex-col gap-10 pb-12 pt-2" style={paperOutline}>
        <header className="flex items-center gap-4 rounded-card bg-card p-5 shadow-card">
          <Avatar name={chloe.name} src={chloe.avatar} size="lg" className="size-20" />
          <div className="min-w-0">
            <h1 className="font-display text-title-1 text-ink">{chloe.name}</h1>
            <p className="mt-1 text-body text-ink-muted">{cities[home].name}</p>
          </div>
        </header>

        <Section title={profileNext.cities}>
          <ul className="flex flex-col gap-2">
            {[...cityList].reverse().map((city) => (
              <li key={city.id} className="flex items-baseline justify-between">
                <span className="font-display text-card-title text-ink">{city.name}</span>
                <span className="text-subhead text-ink-faint">{city.years}</span>
              </li>
            ))}
          </ul>
        </Section>

        {lifestyle && (
          <Section title={profileNext.lifestyle}>
            <TypedSummary parts={lifestyle.parts} play={false} className="text-section leading-[1.25] text-ink" />
          </Section>
        )}

        <Section title={profileNext.intentions} onEdit={() => navigate('intentions')}>
          {goals.length > 0 ? (
            <ul className="flex flex-wrap pl-2">
              {goals.map((goal, index) => (
                <li key={goal} className={cx('-ml-2 flex size-28 items-center justify-center rounded-full p-4 text-center text-subhead text-baton-navy', index % 2 === 1 && 'translate-y-3')} style={{ background: pickedGoalFill }}>
                  {goal}
                </li>
              ))}
            </ul>
          ) : (
            <button type="button" onClick={() => navigate('intentions')} className="flex size-28 items-center justify-center rounded-full border-2 border-dashed border-ink-faint text-title-1 text-ink-muted active:opacity-60">
              +
            </button>
          )}
        </Section>

        <Section title={profileNext.tags}>
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag} className="rounded-full bg-card px-3.5 py-2 text-subhead text-ink">{tag}</li>
            ))}
          </ul>
        </Section>

        <Section title={profileNext.friends}>
          <div className="flex flex-col gap-2">
            <div className="flex pl-2">
              {profileNext.friendList.map((name) => (
                <Avatar key={name} name={name} src={relayAvatar(name)} className="-ml-2 ring-2 ring-baton-paper" />
              ))}
            </div>
            <p className="text-subhead text-ink-muted">{profileNext.friendsSee}</p>
          </div>
        </Section>

        {/* The moving layer: turning it on adds the Moving card and NY stamp */}
        <ListSection>
          <ListRow title={profileNext.moving} trailing={<Switch on={moving} onChange={(on) => setMove({ moving: on })} label={profileNext.moving} />} />
          {moving && (
            <>
              <ListRow
                title={profileNext.to}
                trailing={<input value={moveCity} onChange={(event) => setState({ moveCity: event.target.value })} className="w-36 bg-transparent text-right text-body text-ink-muted focus:outline-none" />}
              />
              <ListRow
                title={profileNext.date}
                trailing={<input type="date" value={moveDate} onChange={(event) => setState({ moveDate: event.target.value })} className="bg-transparent text-right text-body text-ink-muted focus:outline-none" />}
              />
            </>
          )}
        </ListSection>

        <Section title={profileNext.settings}>
          <ListSection>
            {profileNext.settingsRows.map((row) => (
              <ListRow key={row} title={row} chevron onClick={row === 'Instagram tag' ? () => navigate('setup-instagram') : undefined} />
            ))}
          </ListSection>
        </Section>
      </div>
    </Screen>
  )
}

function Section({ title, onEdit, children }: { title: string; onEdit?: () => void; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-section font-normal text-ink">{title}</h2>
        {onEdit && (
          <button type="button" onClick={onEdit} className="min-h-11 text-body text-brand">
            Edit
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

// iOS-style switch
function Switch({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cx('relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors', on ? 'bg-brand' : 'bg-surface-muted')}
    >
      <span className={cx('absolute top-[2px] left-[2px] size-[27px] rounded-full bg-surface shadow-sm transition-transform', on && 'translate-x-5')} />
    </button>
  )
}
