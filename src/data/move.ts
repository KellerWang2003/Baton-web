// IA v2 (Nov 15): the moving layer. One base app; saying "I'm moving" adds the
// Moving card on Today (opens "Your move") and the second city stamp in Relay.
// Copy and mock values here; state is `moving`, `moveCity`, `moveDate` and
// `landed` in the store.
export type CityId = 'la' | 'ny'

export const cities: Record<CityId, { name: string; short: string }> = {
  la: { name: 'Los Angeles', short: 'LA' },
  ny: { name: 'New York', short: 'NY' },
}

// Chloe's move. The demo's "today" is fixed so the countdown reads 34 days.
export const mockMove = { city: 'New York', date: '2026-12-19', today: '2026-11-15', daysInNewYork: 3 }

// The Moving card on Today and the header of Your move
export const moveCard = {
  days: (n: number) => (n === 1 ? '1 day' : `${n} days`),
  day: (n: number) => `Day ${n}`,
  nextBefore: 'Book movers',
  nextAfter: 'Set up OMNY',
}

export const yourMove = {
  title: 'Your move',
  todos: 'To-dos',
  saved: (city: string) => `Saved in ${city}`,
  notes: 'Notes from friends',
  askFriends: 'Ask friends',
  legacy: 'Your LA legacy',
  legacyOpens: 'Opens Dec 12',
  legacyPhoto: '/archive/la-sunset.jpg',
  keepsakes: 'From LA',
  wrapped: 'LA Wrapped',
  paper: 'Rolling Paper',
  wrappedPhoto: '/wrapped/m23-nov07.jpg',
  paperPhoto: '/wrapped/m20-jun20.jpg',
  arrivalTodos: 'Arrival to-dos',
  savedPlaces: 'Saved places',
  folder: 'New York',
  folderDates: '12.2026 –',
}

// To-dos on Your move (ids from src/data/onboarding.ts, tips from today.ts)
export const moveTodos = { before: ['lease', 'ship', 'furniture', 'mail', 'goodbye-dinner'], after: ['omny', 'internet', 'insurance', 'grocery', 'address'] }

// Friends' notes so far, fanned on Your move (the Rolling Paper prints them after landing)
export const friendNotesPreview = [
  { name: 'Leo', text: 'Promise you won’t start saying “the city” like it’s the only one.' },
  { name: 'Sora', text: 'Call me when you miss the sun.' },
  { name: 'Jisoo', text: 'First snow in New York, send me a photo!!' },
]

// Profile > I'm moving
export const movingRow = {
  title: "I'm moving",
  to: 'To',
  date: 'Leaving',
  landed: 'Landed',
}
