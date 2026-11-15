// IA v2 (Nov 15): Today answers "what about today?". One pick per slot, never
// a list. Mock content for the base Today.

// The second prompt behind the daily one, from where she is right now
export const placePrompt = {
  place: 'Philz',
  question: 'Take a photo of your usual order.',
  photo: '/today/philz.jpg',
}

export const friendsToday = {
  title: 'Friends today',
  answers: [
    { name: 'Jess', photo: '/wrapped/m18-mar21.jpg' },
    { name: 'Kai', photo: '/wrapped/m12-jun07.jpg' },
    { name: 'Mina', photo: '/wrapped/m15-oct25.jpg' },
    { name: 'Marco', photo: '/wrapped/m03-jan04.jpg' },
    { name: 'Priya', photo: '/wrapped/m19-may09.jpg' },
  ],
}

// One Relay pick worth going to today (opens relay-detail with this id)
export const worthGoing = {
  title: 'Worth going today',
  pick: 'larchmont',
}

export const regulars = {
  title: 'Your regulars',
  place: 'Philz Coffee',
  photo: '/today/philz.jpg',
  visits: '14×',
  ask: 'Why do you keep going?',
  saved: 'Saved to your legacy',
}

// Prompt bubbles (experiment, Nov 15; `?bubbles=a|b|c`): today's prompts all
// out at once as bubbles, like memories. Open prompts are glass with words,
// done ones show her photo, and friends' answers float next to the prompt
// they answered. `daily` takes today's prompt from the store.
export type BubblePrompt = {
  id: string
  question: string
  medium: 'photo' | 'write'
  place?: string
  // Her answer: a done prompt shows it in place of the glass
  answer?: string
}

export const bubblePrompts: BubblePrompt[] = [
  { id: 'daily', question: '', medium: 'photo' },
  { id: 'philz', question: 'Take a photo of your usual order.', medium: 'photo', place: 'Philz' },
  { id: 'morning', question: 'Take a photo of the first thing you saw outside.', medium: 'photo', answer: '/wrapped/m21-aug01.jpg' },
  { id: 'walk', question: 'Write one thing you passed on your walk home.', medium: 'write' },
]

// Friends' answers, each to one of the prompts above
export const bubbleFriends = [
  { name: 'Jess', prompt: 'daily', photo: '/wrapped/m18-mar21.jpg' },
  { name: 'Kai', prompt: 'daily', photo: '/wrapped/m12-jun07.jpg' },
  { name: 'Mina', prompt: 'daily', photo: '/wrapped/m15-oct25.jpg' },
  { name: 'Marco', prompt: 'philz', photo: '/wrapped/m03-jan04.jpg' },
  { name: 'Priya', prompt: 'morning', photo: '/wrapped/m19-may09.jpg' },
  { name: 'Leo', prompt: 'morning', photo: '/wrapped/m09-jan25.jpg' },
]
