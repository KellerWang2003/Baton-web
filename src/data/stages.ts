// Placeholder content that changes with Chloe's stage (set in onboarding, or
// from the stage switcher in the debug panel). Each tab reads its part from
// here until the real flows for that stage are built.
import type { Stage } from '../flow'
import type { ArchiveFolder, InlinePhotoItem, SummaryPart } from '../ui'
import { pages } from './pages'

export const stageNames: Record<Stage, string> = {
  moving: 'Moving',
  newcomer: 'Newcomer',
  local: 'Local',
}

// The tag under her profile picture
export const stageTags: Record<Stage, string> = {
  moving: 'Moving',
  newcomer: 'Newcomer',
  local: 'Local',
}

export const stageCity: Record<Stage, string> = {
  moving: 'Los Angeles',
  newcomer: 'New York',
  local: 'New York',
}

// What she answered on her last night in LA. Seeds Newcomer suggestions and
// the Local insight page.
export const intention = 'Find people to draw with every week'

// Extra cards at the top of the list on Today, per stage. `to` opens a tab
// when tapped; cards without it wait for their flow.
export type StageCard = {
  id: string
  eyebrow: string
  title: string
  subtitle: string
  photo: string
  // stage: the key moment, filled with her stage's color (MomentCard)
  tone?: 'stage'
  to?: { screen: 'community' } | { screen: 'archive' } | { screen: 'local-insight' } | { screen: 'la-wrapped' }
}

export const todayCards: Record<Stage, StageCard[]> = {
  moving: [
    {
      id: 'notes-waiting',
      photo: '/archive/la-party-1.jpg',
      eyebrow: 'From friends',
      title: '3 friends left you notes',
      subtitle: "They stay sealed until you land in New York.",
    },
  ],
  newcomer: [
    {
      id: 'wrapped',
      photo: '/wrapped/m12-jun07.jpg',
      eyebrow: 'You landed',
      title: 'Your LA Wrapped is ready',
      subtitle: 'Four years of LA, and the 5 notes friends left you.',
      tone: 'stage',
      to: { screen: 'la-wrapped' },
    },
    {
      id: 'gym-hint',
      photo: '/relay/gym.jpg',
      eyebrow: "From Maya's legacy",
      title: "A gym with a Trader Joe's next door",
      subtitle: 'Like yours in Pasadena. Crunch on 14th St, 6 min from you.',
      to: { screen: 'community' },
    },
    {
      id: 'intention',
      photo: '/relay/studio.jpg',
      eyebrow: 'For your intention',
      title: 'Figure drawing at Spring Studio',
      subtitle: `Thursdays at 7. You said: "${intention}".`,
      to: { screen: 'community' },
    },
  ],
  local: [
    {
      id: 'insight',
      photo: '/relay/domino.jpg',
      eyebrow: "You're a local now",
      title: 'See how your life changed since LA',
      subtitle: 'Compared with your LA snapshot, and your intention.',
      tone: 'stage',
      to: { screen: 'local-insight' },
    },
    {
      id: 'bookend',
      photo: '/relay/ana-cafe.jpg',
      eyebrow: 'Same prompt, a year apart',
      title: 'Your seat in LA, and your seat here',
      subtitle: 'Take the photo from your usual café, then see both side by side.',
      to: { screen: 'archive' },
    },
  ],
}

// Archive folders, top to bottom LA, Seoul, Chicago (Figma ARCHIVE_default,
// 256:196). Once she lives in New York (Newcomer, Local) its folder sits on
// top (Keller, Oct 21). Each city keeps its color (NY yellow, LA blue, Seoul
// cream, Chicago olive).
export function archiveFolders(stage: Stage = 'moving'): ArchiveFolder[] {
  const { folders, newYork } = pages.archive
  return stage === 'moving' ? folders : [newYork, ...folders]
}

// Lifestyle summary on each city folder: one short sentence about how she
// lived there, with photos from that city's archive set into the line.
// Written by hand to match the archive (places, reflections), standing in for
// what Baton would generate.
export type ArchiveSummary = {
  parts: SummaryPart[]
}

const photo = (alt: string, file: string): InlinePhotoItem => ({
  alt,
  src: file.startsWith('/') ? file : `/archive/${file}.jpg`,
})

const laSummary: SummaryPart[] = [
  'You chase beautiful sunsets',
  [photo('Sunset on the walk home', 'la-sunset')],
  'and late night street tacos.',
  [photo('Tacos at Grand Central Market', 'la-tacos-1'), photo('Tacos from the truck on Colorado', 'la-tacos-2')],
  'Once an',
  [photo('Chloe, first week in LA', 'la-selfie')],
  'introvert, now the life of every',
  [photo('Studio party', 'la-party-1'), photo('Dancing at the year-end show', 'la-party-2')],
  'party.',
]

export const archiveSummaries: Record<string, Partial<Record<Stage, ArchiveSummary>>> = {
  la: {
    moving: { parts: laSummary },
    newcomer: { parts: laSummary },
    local: { parts: laSummary },
  },
  ny: {
    newcomer: {
      // No photo yet: her New York archive starts out empty (Keller, Oct 21)
      parts: ['Still being written. Your first weeks here will show up as you add to your archive.'],
    },
    local: {
      parts: [
        'A gym',
        [photo('Gym with the Trader Joe’s next door', '/relay/gym.jpg')],
        'with Trader Joe’s next door, a new window seat',
        [photo('Window seat at the corner café', '/relay/cafe.jpg')],
        'and sunsets over the Hudson.',
        [photo('Sunset over the Hudson', '/relay/greenway.jpg')],
      ],
    },
  },
  // Figma ARCHIVE_SEOUL (302:7451)
  seoul: {
    newcomer: {
      parts: [
        'Your last months at home, well spent: Han River picnics,',
        [photo('Picnic by the Han River', 'seoul-han-1'), photo('Han River at sunset', 'seoul-han-2')],
        'karaoke until 2am,',
        [photo('Karaoke room in Hongdae', 'seoul-karaoke-1'), photo('Singing at the noraebang', 'seoul-karaoke-2')],
        'and every café in Seongsu.',
        [photo('Café in Seongsu', 'seoul-cafe')],
      ],
    },
  },
  // Figma ARCHIVE_default (256:196)
  chicago: {
    newcomer: {
      parts: [
        'You know the L by heart',
        [photo('Brown Line over the Loop', 'chicago-l-train')],
        'and every skyline rooftop.',
        [photo('Rooftop at sunset', 'chicago-rooftop-1'), photo('Skyline from a rooftop', 'chicago-rooftop-2')],
        'Brutal winters, but 10/10 perfect lake summers.',
        [photo('North Avenue Beach', 'chicago-lake-1'), photo('Lake Michigan in July', 'chicago-lake-2')],
      ],
    },
  },
}

// Older cities don't change with her stage, so they fall back to one summary.
export function archiveSummary(folderId: string, stage: Stage): ArchiveSummary | undefined {
  const byStage = archiveSummaries[folderId]
  return byStage?.[stage] ?? byStage?.newcomer
}

export type ArchiveEntry = {
  title: string
  detail: string
  // Only after she left: what she made public in her legacy
  visibility?: 'private' | 'community'
}

export type ArchiveDetailContent = {
  summary: string
  sections: { header: string; entries: ArchiveEntry[] }[]
}

const laPlaces = [
  { title: 'Lake Ave Café', detail: '214 photos · your seat by the window' },
  { title: 'Eaton Canyon', detail: '42 photos · Sunday mornings' },
  { title: 'Grand Central Market', detail: '31 photos, mostly of food' },
  { title: 'ArtCenter Hillside studio', detail: '88 photos · late nights' },
]

export const archiveDetail: Record<string, Record<Stage, ArchiveDetailContent>> = {
  la: {
    moving: {
      summary: 'Only you can see this. On your last night you choose what to pass on.',
      sections: [
        { header: 'Places', entries: laPlaces },
        {
          header: 'Reflections',
          entries: [
            { title: 'The view from my seat', detail: 'Oct 18 · daily prompt' },
            { title: "Why this café: Trader Joe's next door", detail: 'Oct 12 · at Lake Ave Café' },
          ],
        },
      ],
    },
    newcomer: {
      summary: 'Your LA legacy: 6 of 14 pieces public, with 5 notes from people they helped.',
      sections: [
        {
          header: 'Legacy',
          entries: [
            { ...laPlaces[0], visibility: 'community' },
            { ...laPlaces[1], visibility: 'community' },
            { ...laPlaces[2], visibility: 'community' },
            { ...laPlaces[3], visibility: 'private' },
          ],
        },
        // IA v2: her answers on Today's regulars card become legacy tips
        {
          header: 'Your regulars’ tips',
          entries: [
            { title: '"The window seat gets the morning light. Go before 9."', detail: 'Philz Coffee · 14×' },
            { title: '"Trader Joe’s next door, so I always end up here."', detail: 'Lake Ave Café · 214 photos' },
          ],
        },
        {
          header: 'Notes on your legacy',
          entries: [{ title: '"Went to your café on day two. You were right about the window."', detail: 'Jess · moved to LA in January' }],
        },
      ],
    },
    local: {
      summary: 'Your LA legacy: 6 of 14 pieces public, with 12 notes from people they helped.',
      sections: [
        {
          header: 'Legacy',
          entries: [
            { ...laPlaces[0], visibility: 'community' },
            { ...laPlaces[1], visibility: 'community' },
            { ...laPlaces[2], visibility: 'community' },
            { ...laPlaces[3], visibility: 'private' },
          ],
        },
        // IA v2: her answers on Today's regulars card become legacy tips
        {
          header: 'Your regulars’ tips',
          entries: [
            { title: '"The window seat gets the morning light. Go before 9."', detail: 'Philz Coffee · 14×' },
            { title: '"Trader Joe’s next door, so I always end up here."', detail: 'Lake Ave Café · 214 photos' },
          ],
        },
        {
          header: 'Notes on your legacy',
          entries: [
            { title: '"Went to your café on day two. You were right about the window."', detail: 'Jess · moved to LA in January' },
            { title: '"The Eaton Canyon tip saved my first Sunday."', detail: 'Marco · moved to LA in March' },
          ],
        },
      ],
    },
  },
  ny: {
    moving: { summary: 'Opens when you arrive.', sections: [] },
    newcomer: {
      summary: 'Only you can see this. Your first weeks in New York.',
      sections: [
        {
          header: 'Reflections',
          entries: [
            { title: 'What confused me today: the express train', detail: 'Feb 3 · daily prompt' },
            { title: 'Coffee here costs more and comes faster', detail: 'Feb 5 · daily prompt' },
          ],
        },
      ],
    },
    local: {
      summary: 'Only you can see this. A year of New York.',
      sections: [
        {
          header: 'Places',
          entries: [
            { title: 'Devoción, Williamsburg', detail: '96 photos · your seat by the plants' },
            { title: 'Spring Studio', detail: '24 Thursdays of figure drawing' },
            { title: "Crunch on 14th St", detail: "Trader Joe's next door" },
          ],
        },
        {
          header: 'Reflections',
          entries: [{ title: 'The view from my seat, a year later', detail: 'Same prompt as LA' }],
        },
      ],
    },
  },
}

// Shared fallback for folders from before Baton (Seoul).
export const olderArchive: ArchiveDetailContent = {
  summary: 'From before Baton. Photos you imported, nothing else yet.',
  sections: [],
}

export const profileRows: Record<Stage, { lifestyle: string; intention?: string }> = {
  moving: { lifestyle: 'Captured on your last night' },
  newcomer: { lifestyle: 'From LA · Dec 18', intention },
  local: { lifestyle: 'Changed since LA', intention },
}
