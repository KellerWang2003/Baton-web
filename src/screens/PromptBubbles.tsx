import type { CSSProperties } from 'react'
import { bubbleFriends, bubblePrompts } from '../data/home'
import type { BubblePrompt } from '../data/home'
import { relayAvatar } from '../data/relay'
import { cx } from '../ui'
import { CheckIcon, MapPinIcon, PencilIcon, PromptCameraIcon } from '../ui/icons'

// Prompt bubbles (experiment, Nov 15; Today with `?bubbles=a|b|c`): every
// prompt for today is out at once instead of a swipeable slot, as overlapping
// bubbles of different sizes, like memories. Open prompts are glass with
// words, done ones show her photo with a check, and friends' answers are
// bubbles too, next to the prompt they answered. Three layouts to compare:
//   a  Around the prompt: friends' answers sit on the rim of their prompt
//   b  Memory cloud: one loose field, friends' answers ringed in pink
//   c  Faces: friends are just faces around each prompt; tap to see theirs
export type BubbleLayout = 'a' | 'b' | 'c'

type Spot = { x: number; y: number; d: number; z?: number }

// The field is the full phone width (402) by FIELD_H; spots are bubble
// centers and diameters in that box
const FIELD_H = 470

const layouts: Record<BubbleLayout, { prompts: Record<string, Spot>; friends: Record<string, Spot> }> = {
  a: {
    prompts: { daily: { x: 190, y: 220, d: 258, z: 2 }, philz: { x: 322, y: 86, d: 132, z: 1 }, morning: { x: 66, y: 72, d: 92, z: 1 }, walk: { x: 330, y: 404, d: 104, z: 1 } },
    friends: {
      Jess: { x: 62, y: 214, d: 72 },
      Kai: { x: 252, y: 352, d: 78 },
      Mina: { x: 96, y: 336, d: 58 },
      Marco: { x: 378, y: 160, d: 48 },
      Priya: { x: 128, y: 34, d: 42 },
      Leo: { x: 30, y: 132, d: 38 },
    },
  },
  b: {
    prompts: { daily: { x: 176, y: 200, d: 236, z: 2 }, philz: { x: 330, y: 318, d: 120, z: 3 }, morning: { x: 34, y: 82, d: 104, z: 1 }, walk: { x: 52, y: 362, d: 108, z: 1 } },
    friends: {
      Jess: { x: 36, y: 222, d: 62 },
      Kai: { x: 196, y: 394, d: 70 },
      Mina: { x: 316, y: 92, d: 58 },
      Marco: { x: 372, y: 210, d: 50 },
      Priya: { x: 140, y: 52, d: 48 },
      Leo: { x: 288, y: 438, d: 44 },
    },
  },
  c: {
    prompts: { daily: { x: 158, y: 196, d: 240, z: 2 }, philz: { x: 312, y: 352, d: 128, z: 1 }, morning: { x: 330, y: 92, d: 96, z: 1 }, walk: { x: 104, y: 400, d: 100, z: 1 } },
    friends: {
      Jess: { x: 52, y: 106, d: 44 },
      Kai: { x: 262, y: 120, d: 38 },
      Mina: { x: 278, y: 262, d: 34 },
      Marco: { x: 374, y: 300, d: 32 },
      Priya: { x: 372, y: 52, d: 30 },
      Leo: { x: 290, y: 50, d: 28 },
    },
  },
}

export function PromptBubbles({ layout, daily }: { layout: BubbleLayout; daily: { question: string; medium: 'photo' | 'write' } }) {
  const spots = layouts[layout]
  const prompts = bubblePrompts.map((prompt) => (prompt.id === 'daily' ? { ...prompt, ...daily } : prompt))
  return (
    <div className="relative -mx-gutter mt-4" style={{ height: FIELD_H }}>
      {prompts.map((prompt) => {
        const spot = spots.prompts[prompt.id]
        if (!spot) return null
        return prompt.answer ? <DoneBubble key={prompt.id} prompt={prompt} spot={spot} /> : <OpenBubble key={prompt.id} prompt={prompt} spot={spot} big={prompt.id === 'daily'} />
      })}
      {bubbleFriends.map((friend) => {
        const spot = spots.friends[friend.name]
        if (!spot) return null
        return layout === 'c' ? (
          <Face key={friend.name} name={friend.name} spot={spot} />
        ) : (
          <FriendBubble key={friend.name} name={friend.name} photo={friend.photo} spot={spot} ringed={layout === 'b'} />
        )
      })}
    </div>
  )
}

const place = ({ x, y, d, z = 3 }: Spot): CSSProperties => ({ left: x - d / 2, top: y - d / 2, width: d, height: d, zIndex: z })

// Not done yet: glass, blue toward the rim, with the prompt in it
function OpenBubble({ prompt, spot, big }: { prompt: BubblePrompt; spot: Spot; big: boolean }) {
  const fontSize = big ? 23 : spot.d > 115 ? 15 : 13
  return (
    <button
      type="button"
      aria-label={prompt.question}
      className="absolute rounded-full transition active:scale-[0.97]"
      style={{
        ...place(spot),
        background: 'radial-gradient(circle at 46% 40%, var(--color-surface) 0%, var(--color-surface) 42%, color-mix(in srgb, var(--color-baton-blue) 45%, var(--color-surface)) 72%, var(--color-baton-blue) 100%)',
        boxShadow: `0 0 0 ${big ? 6 : 3}px color-mix(in srgb, var(--color-surface) 92%, transparent), 0 0 0 ${big ? 7 : 4}px rgb(0 0 0 / 0.05), 0 14px 34px color-mix(in srgb, var(--color-baton-blue) 22%, transparent)`,
      }}
    >
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center font-display leading-[1.15] text-ink" style={{ padding: spot.d * 0.16, fontSize }}>
        {prompt.medium === 'photo' ? <PromptCameraIcon className={cx('text-brand', big ? 'h-6 w-7' : 'h-3.5 w-4')} /> : <PencilIcon className={cx('text-brand', big ? 'size-6' : 'size-4')} />}
        <span>{prompt.question}</span>
      </span>
      {prompt.place && (
        <span className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-baton-paper px-2.5 py-1 text-caption font-medium text-ink shadow-sm">
          <MapPinIcon className="size-3.5 text-brand" />
          {prompt.place}
        </span>
      )}
    </button>
  )
}

// Done: her photo fills it, with a blue check
function DoneBubble({ prompt, spot }: { prompt: BubblePrompt; spot: Spot }) {
  const check = Math.max(22, spot.d * 0.24)
  return (
    <button type="button" aria-label={prompt.question} className="absolute rounded-full" style={place(spot)}>
      <img src={prompt.answer} alt="" className="size-full rounded-full border-[3px] border-surface object-cover shadow-float" />
      <span className="absolute bottom-0.5 right-0.5 flex items-center justify-center rounded-full border-2 border-surface bg-brand text-on-brand" style={{ width: check, height: check }}>
        <CheckIcon />
      </span>
    </button>
  )
}

// A friend's answer: their photo, their face on its edge
function FriendBubble({ name, photo, spot, ringed }: { name: string; photo: string; spot: Spot; ringed: boolean }) {
  const face = Math.max(22, Math.round(spot.d * 0.4))
  return (
    <button type="button" aria-label={`${name}'s answer`} className="absolute rounded-full" style={place({ ...spot, z: spot.z ?? 4 })}>
      <img src={photo} alt="" className={cx('size-full rounded-full border-[3px] object-cover shadow-float', ringed ? 'border-baton-pink' : 'border-surface')} />
      <img src={relayAvatar(name)} alt="" className="absolute -bottom-1 -left-1 rounded-full border-2 border-surface object-cover" style={{ width: face, height: face }} />
    </button>
  )
}

// Layout c: just the friend's face; a tap would open their answer
function Face({ name, spot }: { name: string; spot: Spot }) {
  return (
    <button type="button" aria-label={`${name}'s answer`} className="absolute rounded-full" style={place({ ...spot, z: spot.z ?? 4 })}>
      <img src={relayAvatar(name)} alt="" className="size-full rounded-full border-[2.5px] border-surface object-cover shadow-float" />
    </button>
  )
}
