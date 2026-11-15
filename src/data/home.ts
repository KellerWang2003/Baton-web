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

// A few Relay picks worth going to today (each opens relay-detail)
export const worthGoing = {
  title: 'Worth going today',
  picks: ['larchmont', 'la-matcha', 'la-pier'],
}

export const regulars = {
  title: 'Your regulars',
  place: 'Philz Coffee',
  photo: '/today/philz.jpg',
  visits: '14×',
  ask: 'Why do you keep going?',
  saved: 'Saved to your legacy',
}

