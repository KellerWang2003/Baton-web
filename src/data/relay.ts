// Relay > For you: Baton's own picks from her past routine, and tips from the
// public legacies of people who lived like her and left New York. Every pick
// and tip opens the same detail page, where people leave notes on it.
import type { Stage } from '../flow'
import type { RecTone } from '../ui'
import { intention } from './stages'

export type RelayCategory = 'food' | 'groceries' | 'exercise' | 'housing' | 'getting-around' | 'setup' | 'hobbies' | 'feelings'

// Filter chips on Relay, in order. Each card takes its category's color.
export const relayCategories: { id: RelayCategory; label: string; tone: RecTone }[] = [
  { id: 'food', label: 'Food', tone: 'cream' },
  { id: 'groceries', label: 'Groceries', tone: 'yellow' },
  { id: 'exercise', label: 'Exercise', tone: 'olive' },
  { id: 'housing', label: 'Housing', tone: 'pink' },
  { id: 'getting-around', label: 'Getting around', tone: 'blue' },
  { id: 'setup', label: 'Setup', tone: 'navy' },
  { id: 'hobbies', label: 'Hobbies', tone: 'blue' },
  { id: 'feelings', label: 'Feelings', tone: 'pink' },
]

export function relayCategory(id: RelayCategory) {
  return relayCategories.find((category) => category.id === id) ?? relayCategories[0]
}

// Her place in New York, the blue dot on the map (East Village)
export const relayYou = { x: 174, y: 450 }

export const relayPlaceholderPhoto = '/relay/placeholder.jpg'
export const relayPlaceholderAvatar = '/relay/avatar-placeholder.jpg'

// Stand-in portraits for leavers and note writers (Keller, Oct 21: real
// faces, not initials), in public/people/ with CREDITS.md
const relayFaces = ['Jess', 'Kai', 'Leo', 'Marco', 'Priya', 'Maya', 'Ana', 'Sam', 'Mina', 'Theo']
export function relayAvatar(name: string) {
  return relayFaces.includes(name) ? `/people/${name.toLowerCase()}.jpg` : relayPlaceholderAvatar
}

export type RelayNote = { from: string; detail: string; text: string }

export type RelayLeaver = {
  id: string
  name: string
  // When they left, and what they share with her lifestyle
  left: string
  match: string
}

export type RelayItem = {
  id: string
  // Baton's pick from her routine, or a tip from a leaver's legacy
  source: { kind: 'baton'; why: string; forIntention?: boolean } | { kind: 'leaver'; leaver: string }
  title: string
  // Their own words, shown in quotes on the card (tips from people)
  quote?: string
  category: RelayCategory
  place?: string
  // Where its pin sits on the Relay map (map drawing coordinates)
  map?: { x: number; y: number }
  body: string
  // Free Unsplash photos in public/relay/ (named by id); missing shows the placeholder
  photo?: string
  notes: RelayNote[]
}

export const leavers: RelayLeaver[] = [
  { id: 'maya', name: 'Maya', left: 'Left NYC in 2025', match: 'Gym before work, cooks at home' },
  { id: 'ana', name: 'Ana', left: 'Left NYC in 2024', match: 'Illustrator, worked from cafés' },
  { id: 'sam', name: 'Sam', left: 'Left NYC in 2025', match: 'Moved from abroad, like you' },
  { id: 'mina', name: 'Mina', left: 'Left NYC in 2024', match: 'Grad student from Seoul, cooks at home' },
  { id: 'theo', name: 'Theo', left: 'Left NYC in 2025', match: 'Illustrator, bikes everywhere' },
]

export const relayItems: RelayItem[] = [
  // Baton's picks, based on her routine
  {
    id: 'gym',
    photo: '/relay/gym.jpg',
    source: { kind: 'baton', why: "Like your gym in Pasadena: open at 6, with a Trader Joe's next door." },
    title: 'Crunch, 14th St',
    category: 'exercise',
    place: 'Union Square · 6 min from you',
    map: { x: 172, y: 404 },
    body: "You went to the gym four mornings a week in LA and shopped on the way home. This one is the closest match: early hours, quiet after 8 pm, and Trader Joe's is in the same block.",
    notes: [
      { from: 'Jess', detail: 'Arrived in August', text: 'Went at 8:30 like Maya said. Had the squat rack to myself.' },
      { from: 'Kai', detail: 'Arrived in September', text: 'The Trader Joe’s line is shorter right after it opens at 8.' },
    ],
  },
  {
    id: 'cafe',
    photo: '/relay/cafe.jpg',
    source: { kind: 'baton', why: 'Big tables and window light, like your usual café seat in LA.' },
    title: 'Devoción, Williamsburg',
    category: 'food',
    place: 'Williamsburg · 25 min by L',
    map: { x: 244, y: 456 },
    body: 'You spent most Sunday afternoons drawing at the same café table. Devoción has long tables under a skylight, and nobody rushes you out.',
    notes: [{ from: 'Priya', detail: 'Arrived in March', text: 'Get there before 11 on weekends or every table is taken.' }],
  },
  {
    id: 'studio',
    photo: '/relay/studio.jpg',
    source: { kind: 'baton', why: `For your intention: "${intention}".`, forIntention: true },
    title: 'Spring Studio',
    category: 'hobbies',
    place: 'SoHo · Thursdays at 7',
    map: { x: 160, y: 470 },
    body: 'Figure drawing every Thursday at 7, $25 drop-in. The same faces come back each week, so it is an easy place to find people to draw with.',
    notes: [{ from: 'Leo', detail: 'Local since 2023', text: 'Bring your own board. They run out fast.' }],
  },
  {
    id: 'market',
    photo: '/relay/market.jpg',
    source: { kind: 'baton', why: 'Saturday mornings at the market, like you did in South Pasadena.' },
    title: 'Union Square Greenmarket',
    category: 'groceries',
    place: 'Union Square · Saturdays',
    map: { x: 162, y: 418 },
    body: 'Open Monday, Wednesday, Friday and Saturday. Saturday is the big one, and the bread stalls sell out by noon.',
    notes: [],
  },

  {
    id: 'greenway',
    photo: '/relay/greenway.jpg',
    source: { kind: 'baton', why: 'You ran the Arroyo loop most Saturdays. This one is flat, car-free and by the water.' },
    title: 'Hudson River Greenway',
    category: 'exercise',
    place: 'West Village · along the river',
    map: { x: 152, y: 448 },
    body: 'A path along the whole west side of Manhattan, away from traffic. Sunset runs here are what people miss most when they leave.',
    notes: [{ from: 'Kai', detail: 'Arrived in September', text: 'Start at Pier 45. The water fountains work until November.' }],
  },
  {
    id: 'falafel',
    photo: '/relay/falafel.jpg',
    source: { kind: 'baton', why: 'Cheap and open late, like the taco truck you went to after studio.' },
    title: "Mamoun's Falafel",
    category: 'food',
    place: 'MacDougal St · open until 5 am',
    map: { x: 168, y: 452 },
    body: 'A falafel sandwich for under $6, a few blocks from where you live. Perfect for nights you stay late drawing.',
    notes: [],
  },
  {
    id: 'citibike',
    photo: '/relay/citibike.jpg',
    source: { kind: 'baton', why: 'You biked to class in Pasadena. There is a dock on almost every corner here.' },
    title: 'Citi Bike',
    category: 'getting-around',
    place: 'Dock on 1st Ave & E 10th St',
    map: { x: 182, y: 430 },
    body: 'An annual pass costs less than three months of subway rides. The first 45 minutes of each ride are included.',
    notes: [{ from: 'Jess', detail: 'Arrived in August', text: 'The app shows which docks have bikes. Check before you walk over.' }],
  },
  {
    id: 'greenpoint',
    photo: '/relay/greenpoint.jpg',
    source: { kind: 'baton', why: 'Quiet streets and small cafés, like Highland Park, and one train to your office.' },
    title: 'Greenpoint',
    category: 'housing',
    place: 'Brooklyn · G train',
    map: { x: 282, y: 452 },
    body: 'Most people who lived like you and moved to New York ended up here or nearby. Rents are a little lower than Williamsburg.',
    notes: [],
  },
  {
    id: 'domino',
    photo: '/relay/domino.jpg',
    source: { kind: 'baton', why: 'Your camera roll in LA is full of sunsets. This is where people watch them here.' },
    title: 'Domino Park',
    category: 'feelings',
    place: 'Williamsburg waterfront',
    map: { x: 240, y: 474 },
    body: 'A long park on the river facing Manhattan. Good for the evenings you miss home and want to sit somewhere for a while.',
    notes: [{ from: 'Marco', detail: 'Arrived in October', text: 'Went alone on a Tuesday. Didn’t feel alone.' }],
  },
  {
    id: 'idnyc',
    photo: '/relay/idnyc.jpg',
    source: { kind: 'baton', why: 'You just arrived. This free city ID unlocks a lot of small things.' },
    title: 'Get your IDNYC',
    category: 'setup',
    body: 'A free New York City ID card. It works as a library card and gives you free memberships at dozens of museums for a year.',
    notes: [],
  },

  // From people who lived like her: in their own words, titled by their place
  {
    id: 'potatoes',
    photo: '/relay/potatoes.jpg',
    source: { kind: 'leaver', leaver: 'maya' },
    title: "Maya's market",
    quote: "Potatoes and eggs are a dollar cheaper here than at Trader Joe's.",
    category: 'groceries',
    place: 'Key Food, 3rd Ave',
    map: { x: 184, y: 434 },
    body: "Trader Joe's is great for most things, but potatoes, onions, eggs and rice cost about a dollar less at the Key Food on 3rd Ave. I split my shop between the two every week.",
    notes: [
      { from: 'Kai', detail: 'Arrived in September', text: 'Still true. Rice is cheaper there too.' },
      { from: 'Jess', detail: 'Arrived in August', text: 'This saved me about $15 a week.' },
    ],
  },
  {
    id: 'gym-late',
    photo: '/relay/gym-late.jpg',
    source: { kind: 'leaver', leaver: 'maya' },
    title: "Maya's gym",
    quote: 'Totally empty after 8 pm. I had the squat rack to myself.',
    category: 'exercise',
    place: 'Crunch, 14th St',
    map: { x: 181, y: 393 },
    body: "Mornings are packed with the before-work crowd. After 8 pm it's quiet, and you can shop at Trader Joe's next door on the way home.",
    notes: [{ from: 'Jess', detail: 'Arrived in August', text: 'Went at 8:30 like Maya said. Same, nobody there.' }],
  },
  {
    id: 'month-two',
    photo: '/relay/month-two.jpg',
    source: { kind: 'leaver', leaver: 'maya' },
    title: "Maya's first winter",
    quote: 'Month two was the hardest. I booked something every weekend.',
    category: 'feelings',
    body: 'The first month is all new things. The second is when it gets quiet and you miss home. I planned something for every weekend that month, even something small, and it got me through.',
    notes: [{ from: 'Marco', detail: 'Arrived in October', text: 'Reading this in week six. Booked a class for every Saturday.' }],
  },
  {
    id: 'library',
    photo: '/relay/ana-drawing-spot.jpg',
    source: { kind: 'leaver', leaver: 'ana' },
    title: "Ana's drawing spot",
    quote: 'Free, big tables, and nobody minds a sketchbook.',
    category: 'hobbies',
    place: 'Brooklyn Public Library, Grand Army Plaza',
    map: { x: 236, y: 536 },
    body: 'Good light and long tables. I drew there three afternoons a week instead of buying three coffees.',
    notes: [],
  },
  {
    id: 'ana-cafe',
    photo: '/relay/ana-cafe.jpg',
    source: { kind: 'leaver', leaver: 'ana' },
    title: "Ana's café",
    quote: "Get the window bar before 11. After that it's laptops everywhere.",
    category: 'food',
    place: 'Devoción, Williamsburg',
    map: { x: 258, y: 470 },
    body: 'The window bar has the best light in Williamsburg for drawing. Weekends fill up fast, so I went early and stayed through lunch.',
    notes: [{ from: 'Priya', detail: 'Arrived in March', text: 'Went at 10:30 on a Sunday and got the last seat.' }],
  },
  {
    id: 'omny',
    photo: '/relay/omny.jpg',
    source: { kind: 'leaver', leaver: 'ana' },
    title: "Ana's commute",
    quote: 'Tap your phone. After 12 rides the rest of the week is free.',
    category: 'getting-around',
    body: "Skip the MetroCard. Tap your phone or card at the turnstile, and after 12 rides in a week the rest are free. No pass needed.",
    notes: [{ from: 'Priya', detail: 'Arrived in March', text: 'Use the same card every time or the cap doesn’t count.' }],
  },
  {
    id: 'laundry',
    photo: '/relay/laundry.jpg',
    source: { kind: 'leaver', leaver: 'sam' },
    title: "Sam's laundromat",
    quote: 'Wash-and-fold is worth it. I got my Sundays back.',
    category: 'housing',
    place: 'Bubbles, E 13th St',
    map: { x: 190, y: 410 },
    body: 'No machine in my building, and carrying bags in the snow was miserable. Drop it off in the morning, pick it up folded at night.',
    notes: [],
  },
  {
    id: 'bank',
    photo: '/relay/bank.jpg',
    source: { kind: 'leaver', leaver: 'sam' },
    title: "Sam's bank",
    quote: 'Go in person with your passport and offer letter. Online kept failing.',
    category: 'setup',
    body: 'Landlords and phone plans kept asking for a US account. Without a credit history the online forms kept rejecting me, so go to a branch in your first week.',
    notes: [],
  },
  {
    id: 'lease',
    photo: '/relay/lease.jpg',
    source: { kind: 'leaver', leaver: 'sam' },
    title: "Sam's lease",
    quote: 'Ask for 13 months. They gave me one month free.',
    category: 'housing',
    body: 'Landlords often offer one free month on a 13-month lease. If they don’t mention it, ask. It worked for me twice.',
    notes: [{ from: 'Marco', detail: 'Arrived in October', text: 'Asked and got it. Thank you Sam.' }],
  },
  {
    id: 'hmart',
    photo: '/relay/hmart.jpg',
    source: { kind: 'leaver', leaver: 'mina' },
    title: "Mina's grocery",
    quote: 'Get the big rice bag here and split it with a friend.',
    category: 'groceries',
    place: 'H Mart, 32nd St',
    map: { x: 190, y: 372 },
    body: 'Koreatown has everything I missed from home. The 20 lb bag of rice is the best deal, but it is heavy, so I always went with someone.',
    notes: [{ from: 'Kai', detail: 'Arrived in September', text: 'The food court upstairs is a good cheap lunch too.' }],
  },
  {
    id: 'esim',
    photo: '/relay/esim.jpg',
    source: { kind: 'leaver', leaver: 'mina' },
    title: "Mina's phone plan",
    quote: 'Get an eSIM before you land. I had data at JFK.',
    category: 'setup',
    body: 'I set up a US eSIM the week before my flight, so I could call a car and message my landlord as soon as I landed. No store line.',
    notes: [],
  },
  {
    id: 'say-yes',
    photo: '/relay/say-yes.jpg',
    source: { kind: 'leaver', leaver: 'mina' },
    title: "Mina's first friends",
    quote: 'I said yes to every invite for two months.',
    category: 'feelings',
    body: 'Most were not my thing, but my closest friends came from the second and the fifth. After two months I could start saying no.',
    notes: [{ from: 'Jess', detail: 'Arrived in August', text: 'Doing this now. Three invites this week.' }],
  },
  {
    id: 'listings',
    photo: '/relay/listings.jpg',
    source: { kind: 'leaver', leaver: 'mina' },
    title: "Mina's apartment hunt",
    quote: 'Look on Monday mornings. The good ones are gone by Wednesday.',
    category: 'housing',
    body: 'New listings go up early in the week. Have your documents ready in one folder, and be ready to apply the same day you see a place.',
    notes: [],
  },
  {
    id: 'bridge',
    photo: '/relay/bridge.jpg',
    source: { kind: 'leaver', leaver: 'theo' },
    title: "Theo's bike route",
    quote: 'Take the Williamsburg Bridge, not the Manhattan. Less traffic, better view.',
    category: 'getting-around',
    place: 'Williamsburg Bridge',
    map: { x: 214, y: 448 },
    body: 'The bike path is separated from cars the whole way. I rode it every morning to the studio, and it never got old.',
    notes: [],
  },
  {
    id: 'climbing',
    photo: '/relay/climbing.jpg',
    source: { kind: 'leaver', leaver: 'theo' },
    title: "Theo's climbing gym",
    quote: 'The off-peak pass is half price before 4 pm.',
    category: 'exercise',
    place: 'VITAL, Williamsburg',
    map: { x: 268, y: 478 },
    body: 'If your schedule is flexible, go in the afternoon. It is quiet, and the regulars will show you the easy routes.',
    notes: [{ from: 'Marco', detail: 'Arrived in October', text: 'Went at 2 pm, had a wall to myself.' }],
  },
  {
    id: 'blick',
    photo: '/relay/blick.jpg',
    source: { kind: 'leaver', leaver: 'theo' },
    title: "Theo's art store",
    quote: 'Bring your student ID. They still gave me the discount.',
    category: 'hobbies',
    place: 'Blick, Bond St',
    map: { x: 174, y: 444 },
    body: 'Two floors of paper, ink and paint. The student discount worked with my old school ID for a while after I graduated.',
    notes: [],
  },
  {
    id: 'diner',
    photo: '/relay/diner.jpg',
    source: { kind: 'leaver', leaver: 'theo' },
    title: "Theo's diner",
    quote: 'Two eggs, toast and coffee for under $10. They knew my order by week three.',
    category: 'food',
    place: 'Veselka, 2nd Ave',
    map: { x: 186, y: 440 },
    body: 'Open all day. It was the first place in New York that felt like mine.',
    notes: [{ from: 'Kai', detail: 'Arrived in September', text: 'The pierogi too. Trust me.' }],
  },
]

export const relayHeaders: Record<Stage, { picks: string; people: string }> = {
  moving: { picks: 'Based on your life in LA', people: 'From people with similar lifestyle' },
  newcomer: { picks: 'Based on your life in LA', people: 'From people with similar lifestyle' },
  local: { picks: 'Based on your life in New York', people: 'From people with similar lifestyle' },
}

// Baton's picks for her stage: intention picks once she has set one (last night in LA)
export function relayPicks(stage: Stage) {
  return relayItems.filter(
    (item) => item.source.kind === 'baton' && (stage !== 'moving' || !item.source.forIntention),
  )
}

export function leaverTips(leaverId: string) {
  return relayItems.filter((item) => item.source.kind === 'leaver' && item.source.leaver === leaverId)
}

export function findLeaver(id: string) {
  return leavers.find((leaver) => leaver.id === id)
}

// Relay's search page: a few recent searches to start with, and suggestions
// that each find something
export const relaySearchSeed = ['Williamsburg', 'Late night food']
export const relaySearchSuggestions = ['Coffee', 'Bike', 'Laundromat', 'First winter', 'Lease']

export const relayCopy = {
  searchPlaceholder: 'Search places and tips',
  searchRecent: 'Recent',
  searchClear: 'Clear',
  searchSuggested: 'Try searching',
  searchBrowse: 'Browse by category',
  searchResults: (count: number) => `${count} ${count === 1 ? 'result' : 'results'}`,
  searchNone: (query: string) => `Nothing for “${query}” yet. Try a place, a feeling or someone’s name.`,
  all: 'All',
  map: 'Map view',
  legacy: (name: string) => `${name}’s legacy`,
  noResults: 'Nothing here yet. Try another category.',
  pickedBy: 'Picked by Baton',
  notesHeader: 'Notes',
  noNotes: 'No notes yet. Be the first to say how it went.',
  leaveNote: 'Leave a note',
  noteOn: (title: string) => `On “${title}”`,
  notePost: 'Stick it on',
  noteCancel: 'Not now',
  notePlaceholder: 'How did it go? Did it help?',
  noteStarters: ['It helped me', 'Still true', 'Changed since'],
  you: 'You',
  youDetail: 'Just now',
}
