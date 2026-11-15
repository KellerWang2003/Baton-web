import type { Stage } from '../flow'

export const profile = {
  departure: 'Leaving',
  intentions: 'Make room for what’s next.',
  intentionsDetail: 'Choose what you want to try, find, or make time for in New York.',
  intentionsAction: 'Set your intentions',
  editIntentions: 'Edit intentions',
  about: 'About you',
  aboutDetail: 'A little context helps Baton find tips from people with a life like yours.',
  edit: 'Edit',
  keepsakes: 'Your time in LA',
  keepsakesDetail: 'Your moments and the people who were part of them.',
  lifestyle: 'See how your life has changed',
  // Her lifestyle sentence: LA so far while Moving, the snapshot from her
  // last night after that, and New York next to it once she's a Local
  lifestyleTitle: 'Your lifestyle',
  lifestyleWhen: {
    moving: 'Los Angeles · so far',
    newcomer: 'Los Angeles · your snapshot, Dec 18',
    local: 'Los Angeles · your snapshot, Dec 18',
  } satisfies Record<Stage, string>,
  nowWhen: 'New York · now',
  // Your time in LA, as two scraps
  wrappedPhoto: '/wrapped/m21-aug01.jpg',
  paperPhoto: '/archive/la-party-1.jpg',
  tagsTitle: 'About you',
  save: 'Save changes',
  stages: {
    moving: 'Making the most of Los Angeles before your next chapter.',
    newcomer: 'Finding your feet and your favorite places in New York.',
    local: 'Building a life in New York, one everyday moment at a time.',
  } satisfies Record<Stage, string>,
}

// IA v2 Profile (Nov 15): no stages. Section titles and rows.
export const profileNext = {
  cities: 'Cities',
  cityList: [
    { id: 'seoul', name: 'Seoul', years: '2003–2022' },
    { id: 'chicago', name: 'Chicago', years: '2022' },
    { id: 'la', name: 'Los Angeles', years: '2022–' },
  ],
  lifestyle: 'Lifestyle',
  intentions: 'Intentions',
  tags: 'Tags',
  friends: 'Friends',
  friendsSee: 'They see only your prompt answers',
  friendList: ['Jess', 'Kai', 'Mina', 'Marco', 'Priya', 'Leo'],
  moving: "I'm moving",
  to: 'To',
  date: 'Leaving',
  settings: 'Settings',
  settingsRows: ['Notifications', 'Privacy', 'Instagram tag', 'Account'],
}
