import { createClient } from '@supabase/supabase-js'
import type { ArchiveMoment } from '../data/archiveMoments'
import type { CloudCategory, CloudPhoto } from '../ui/PhotoCloud'
import { setState } from './store'

// Captures persist in Supabase (table `baton_captures`, bucket `baton-capture-photos`; see
// docs/supabase.sql). No sign-in in the prototype: there is one shared archive,
// so every device that opens the app sees every capture. Without VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY in .env.local, everything stays in memory as before.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const client = url && key ? createClient(url, key) : null

const TABLE = 'baton_captures'
const BUCKET = 'baton-capture-photos'

type Row = {
  id: string
  city: string
  seed_key: string | null
  moment_photo: string | null
  tilt: number | null
  one_line: boolean | null
  photo_path: string | null
  question: string | null
  note: string
  category: CloudCategory | null
  place: string | null
  prompt_number: number | null
  time_label: string | null
  x: number | null
  y: number | null
  size: number | null
}

export type CaptureToSave = {
  photo: Blob | null
  question: string
  note: string
  category: CloudCategory | null
  place: string
  promptNumber: number
  timeLabel: string
  spot: { x: number; y: number; size: number } | null
}

// Save one capture: the photo file, then its row. Fire and forget; a failure
// is logged and the session carries on in memory. Resolves to the new row's
// id (so it can be deleted later), or null.
export async function saveCapture(capture: CaptureToSave): Promise<string | null> {
  if (!client) return null
  try {
    let photoPath: string | null = null
    if (capture.photo) {
      photoPath = `${crypto.randomUUID()}.jpg`
      const { error } = await client.storage.from(BUCKET).upload(photoPath, capture.photo, { contentType: capture.photo.type || 'image/jpeg' })
      if (error) throw error
    }
    const { data, error } = await client.from(TABLE).insert({
      device_id: 'app',
      photo_path: photoPath,
      question: capture.question,
      note: capture.note,
      category: capture.category,
      place: capture.place,
      prompt_number: capture.promptNumber,
      time_label: capture.timeLabel,
      x: capture.spot?.x ?? null,
      y: capture.spot?.y ?? null,
      size: capture.spot?.size ?? null,
    }).select('id').single()
    if (error) throw error
    return (data as { id: string }).id
  } catch (error) {
    console.warn('[baton] Could not save the capture', error)
    return null
  }
}

// A photo's address: a link or a file in the app's public folder as written,
// anything else is a path in the baton-capture-photos bucket
function photoUrl(path: string) {
  if (!client || path.startsWith('/') || path.startsWith('http')) return path
  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// Bring the saved archive back (once, on start): every city's cloud and the
// moments its photos open, from the baton_captures table
export async function loadSavedCaptures() {
  if (!client) return
  try {
    const { data, error } = await client.from(TABLE).select('*').order('sort', { nullsFirst: false }).order('created_at')
    if (error) throw error
    const rows = ((data ?? []) as Row[]).filter((row) => row.photo_path && row.category && row.x !== null && row.y !== null && row.size !== null)
    const clouds: Record<string, CloudPhoto[]> = {}
    const moments: Record<string, ArchiveMoment> = {}
    for (const row of rows) {
      const src = photoUrl(row.photo_path!)
      const category = row.category!
      ;(clouds[row.city] ??= []).push({ id: row.id, src, category, x: row.x!, y: row.y!, size: row.size! })
      moments[src] = {
        prompt: row.prompt_number ?? 0,
        question: row.question ?? '',
        photo: row.moment_photo ? photoUrl(row.moment_photo) : src,
        category,
        place: row.place ?? '',
        time: row.time_label ?? '',
        note: row.note ?? '',
        ...(row.tilt !== null ? { tilt: row.tilt } : {}),
        ...(row.one_line ? { oneLine: true } : {}),
      }
    }
    setState({ archive: { clouds, moments } })
  } catch (error) {
    console.warn('[baton] Could not load saved captures', error)
  }
}

// Long-press Delete in a city's cloud: the photo leaves the cloud at once
// (and its moment, unless the same photo is still in the cloud elsewhere),
// then its row goes from Supabase, with its file when it was uploaded
export async function deleteCapture(city: string, photo: CloudPhoto) {
  setState(({ archive, addedPhotos, addedMoments }) => {
    const cloud = (archive?.clouds[city] ?? []).filter((item) => item !== photo)
    const added = addedPhotos.filter((item) => item !== photo)
    const moments = { ...archive?.moments }
    const addedNext = { ...addedMoments }
    if (![...cloud, ...added].some((item) => item.src === photo.src)) {
      delete moments[photo.src]
      delete addedNext[photo.src]
    }
    return { archive: { clouds: { ...archive?.clouds, [city]: cloud }, moments }, addedPhotos: added, addedMoments: addedNext }
  })
  if (!client || !photo.id) return
  try {
    const { data, error } = await client.from(TABLE).delete().eq('id', photo.id).select('photo_path, moment_photo')
    if (error) throw error
    const removed = (data ?? []) as Pick<Row, 'photo_path' | 'moment_photo'>[]
    const files = removed.flatMap((row) => [row.photo_path, row.moment_photo]).filter((p): p is string => !!p && !p.startsWith('/') && !p.startsWith('http'))
    if (files.length) await client.storage.from(BUCKET).remove(files)
  } catch (error) {
    console.warn('[baton] Could not delete the capture', error)
  }
}

// Debug panel: forget the captures made in the app (the seeded archive stays)
export async function clearSavedCaptures() {
  if (!client) return
  const { data } = await client.from(TABLE).select('photo_path').is('seed_key', null)
  const paths = (data ?? []).map((row) => row.photo_path as string | null).filter((p): p is string => !!p && !p.startsWith('/') && !p.startsWith('http'))
  if (paths.length) await client.storage.from(BUCKET).remove(paths)
  await client.from(TABLE).delete().is('seed_key', null)
  setState({ addedPhotos: [], addedMoments: {} })
  await loadSavedCaptures()
}
