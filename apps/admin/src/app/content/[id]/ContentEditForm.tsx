'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FiTrash2, FiCheck, FiX } from 'react-icons/fi'
import { buildContentUpdateBody, toggleGenreId } from '@/lib/contentForm'

interface VideoFile {
  id: string
  quality: string
  url: string
  isDefault: boolean
  format?: string
}
interface Episode {
  id: string
  episodeNumber: number
  title: string
  description?: string
  runtime?: number
  videoUrl?: string
  airDate?: string
}
interface Season {
  id: string
  seasonNumber: number
  title?: string
  episodes: Episode[]
}

interface ContentData {
  id: string
  title: string
  description: string
  mediaType: string
  status: string
  posterPath: string
  backdropPath: string
  releaseDate: string
  rating: number
  runtime?: number
  seasons?: number
  episodes?: number
  maturityRating: string
  isFeatured: boolean
  trailerKey?: string
  videoUrl?: string
  language: string
  country?: string
  studio?: string
  director?: string
  tagline?: string
  cast: string[]
  genres: Array<{ genre: { id: number; name: string } }>
  videoFiles: VideoFile[]
  contentSeasons: Season[]
}

interface Props {
  content: ContentData
  allGenres: Array<{ id: number; name: string }>
}

export function ContentEditForm({ content, allGenres }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const token = (session as { accessToken?: string })?.accessToken ?? ''
  const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'

  const [form, setForm] = useState({
    title: content.title,
    description: content.description,
    mediaType: content.mediaType,
    status: content.status,
    posterPath: content.posterPath,
    backdropPath: content.backdropPath,
    releaseDate: content.releaseDate,
    rating: content.rating,
    runtime: content.runtime ?? '',
    maturityRating: content.maturityRating,
    trailerKey: content.trailerKey ?? '',
    videoUrl: content.videoUrl ?? '',
    language: content.language,
    country: content.country ?? '',
    studio: content.studio ?? '',
    director: content.director ?? '',
    tagline: content.tagline ?? '',
    cast: content.cast.join(', '),
  })

  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>(
    content.genres.map((g) => g.genre.id)
  )
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'details' | 'videos' | 'seasons'>('details')

  // Video files state
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>(content.videoFiles)
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [newVideoQuality, setNewVideoQuality] = useState('AUTO')
  const [addingVideo, setAddingVideo] = useState(false)

  function update(k: string, v: unknown) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function save() {
    setSaving(true)
    try {
      const body = buildContentUpdateBody(form, selectedGenreIds)
      const res = await fetch(`${API}/api/admin/content/${content.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Save failed')
      router.refresh()
      alert('Saved!')
    } catch (e) {
      alert('Error saving: ' + String(e))
    } finally {
      setSaving(false)
    }
  }

  async function addVideoFile() {
    if (!newVideoUrl) return
    setAddingVideo(true)
    try {
      const res = await fetch(`${API}/api/admin/content/${content.id}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          quality: newVideoQuality,
          url: newVideoUrl,
          isDefault: videoFiles.length === 0,
        }),
      })
      const data = (await res.json()) as { data: VideoFile }
      setVideoFiles((v) => [...v, data.data])
      setNewVideoUrl('')
    } finally {
      setAddingVideo(false)
    }
  }

  async function removeVideoFile(id: string) {
    if (!confirm('Remove this video file?')) return
    await fetch(`${API}/api/admin/content/${content.id}/videos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setVideoFiles((v) => v.filter((f) => f.id !== id))
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-1 text-sm text-gray-500 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">{content.title}</h1>
          <p className="text-sm text-gray-500">{content.id}</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-netflix-red hover:bg-netflix-red-hover rounded-lg px-6 py-2 font-medium text-white transition disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-xl border border-gray-800 bg-gray-900 p-1">
        {(['details', 'videos', 'seasons'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition ${tab === t ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            {t}
            {t === 'videos' && videoFiles.length > 0 && (
              <span className="ml-1.5 rounded bg-green-700/50 px-1.5 text-xs text-green-300">
                {videoFiles.length}
              </span>
            )}
            {t === 'seasons' && content.contentSeasons.length > 0 && (
              <span className="ml-1.5 rounded bg-blue-700/50 px-1.5 text-xs text-blue-300">
                {content.contentSeasons.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── DETAILS TAB ── */}
      {tab === 'details' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <Field label="Title">
              <input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                className={inp}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={4}
                className={`${inp} resize-none`}
              />
            </Field>
            <Field label="Tagline">
              <input
                value={form.tagline}
                onChange={(e) => update('tagline', e.target.value)}
                className={inp}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Media Type">
                <select
                  value={form.mediaType}
                  onChange={(e) => update('mediaType', e.target.value)}
                  className={inp}
                >
                  <option value="movie">Movie</option>
                  <option value="tv">TV Show</option>
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => update('status', e.target.value)}
                  className={inp}
                >
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Rating (0–10)">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.rating}
                  onChange={(e) => update('rating', e.target.value)}
                  className={inp}
                />
              </Field>
              <Field label="Maturity Rating">
                <select
                  value={form.maturityRating}
                  onChange={(e) => update('maturityRating', e.target.value)}
                  className={inp}
                >
                  {[
                    'G',
                    'PG',
                    'PG-13',
                    'R',
                    'NC-17',
                    'TV-Y',
                    'TV-G',
                    'TV-PG',
                    'TV-14',
                    'TV-MA',
                  ].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Release Date">
                <input
                  type="date"
                  value={form.releaseDate}
                  onChange={(e) => update('releaseDate', e.target.value)}
                  className={inp}
                />
              </Field>
              <Field label="Runtime (min)">
                <input
                  type="number"
                  min="1"
                  value={form.runtime}
                  onChange={(e) => update('runtime', e.target.value)}
                  className={inp}
                />
              </Field>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Poster Path (URL)">
              <input
                value={form.posterPath}
                onChange={(e) => update('posterPath', e.target.value)}
                className={inp}
              />
              {form.posterPath && (
                <img src={form.posterPath} alt="" className="mt-2 w-24 rounded" />
              )}
            </Field>
            <Field label="Backdrop Path (URL)">
              <input
                value={form.backdropPath}
                onChange={(e) => update('backdropPath', e.target.value)}
                className={inp}
              />
            </Field>
            <Field label="Trailer Key (YouTube)">
              <input
                value={form.trailerKey}
                onChange={(e) => update('trailerKey', e.target.value)}
                className={inp}
              />
            </Field>
            <Field label="Primary Video URL">
              <input
                value={form.videoUrl}
                onChange={(e) => update('videoUrl', e.target.value)}
                placeholder="https://…"
                className={inp}
              />
            </Field>
            <Field label="Director">
              <input
                value={form.director}
                onChange={(e) => update('director', e.target.value)}
                className={inp}
              />
            </Field>
            <Field label="Studio">
              <input
                value={form.studio}
                onChange={(e) => update('studio', e.target.value)}
                className={inp}
              />
            </Field>
            <Field label="Language">
              <input
                value={form.language}
                onChange={(e) => update('language', e.target.value)}
                placeholder="en"
                className={inp}
              />
            </Field>
            <Field label="Cast (comma-separated)">
              <input
                value={form.cast}
                onChange={(e) => update('cast', e.target.value)}
                placeholder="Actor 1, Actor 2…"
                className={inp}
              />
            </Field>
            <div>
              <label className="mb-2 block text-sm text-gray-400">Genres</label>
              <div className="flex flex-wrap gap-2">
                {allGenres.map((g) => {
                  const active = selectedGenreIds.includes(g.id)
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGenreIds((ids) => toggleGenreId(ids, g.id))}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${active ? 'bg-netflix-red text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                      {g.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIDEOS TAB ── */}
      {tab === 'videos' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h3 className="mb-4 font-semibold">Add Video File</h3>
            <div className="flex gap-3">
              <select
                value={newVideoQuality}
                onChange={(e) => setNewVideoQuality(e.target.value)}
                className={`${inp} w-36`}
              >
                {['AUTO', 'Q_4K', 'Q_1080P', 'Q_720P', 'Q_480P', 'Q_360P'].map((q) => (
                  <option key={q} value={q}>
                    {q.replace('Q_', '').replace('AUTO', 'Auto/HLS')}
                  </option>
                ))}
              </select>
              <input
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="https://example.com/video.mp4 or HLS .m3u8"
                className={`${inp} flex-1`}
              />
              <button
                onClick={addVideoFile}
                disabled={addingVideo || !newVideoUrl}
                className="bg-netflix-red hover:bg-netflix-red-hover rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
              >
                {addingVideo ? 'Adding…' : 'Add'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Supports direct MP4 URLs or HLS (.m3u8) manifests. For enterprise use, upload to
              S3/Cloudinary and paste the CDN URL.
            </p>
          </div>

          <div className="space-y-2">
            {videoFiles.length === 0 && (
              <p className="text-sm text-gray-600">No video files added yet.</p>
            )}
            {videoFiles.map((vf) => (
              <div
                key={vf.id}
                className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4"
              >
                <span
                  className={`rounded px-2 py-0.5 font-mono text-xs ${vf.isDefault ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400'}`}
                >
                  {vf.quality.replace('Q_', '')}
                </span>
                <span className="flex-1 truncate font-mono text-sm text-gray-300">{vf.url}</span>
                {vf.isDefault && <span className="text-xs text-green-400">Default</span>}
                <button
                  onClick={() => removeVideoFile(vf.id)}
                  className="p-1 text-gray-600 transition hover:text-red-400"
                >
                  <FiTrash2 className="text-sm" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SEASONS TAB ── */}
      {tab === 'seasons' && (
        <div className="space-y-4">
          {content.mediaType !== 'tv' && (
            <p className="text-sm text-gray-500">Seasons are only available for TV shows.</p>
          )}
          {content.contentSeasons.map((season) => (
            <div key={season.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <h3 className="mb-3 font-semibold">
                Season {season.seasonNumber} {season.title ? `— ${season.title}` : ''}
              </h3>
              <div className="space-y-2">
                {season.episodes.map((ep) => (
                  <div
                    key={ep.id}
                    className="flex items-center gap-3 rounded-lg bg-gray-800/50 p-3 text-sm"
                  >
                    <span className="w-6 text-right font-mono text-gray-500">
                      {ep.episodeNumber}
                    </span>
                    <span className="flex-1 font-medium">{ep.title}</span>
                    {ep.runtime && <span className="text-gray-500">{ep.runtime}m</span>}
                    {ep.videoUrl ? (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <FiCheck /> Video
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <FiX /> No video
                      </span>
                    )}
                  </div>
                ))}
                {season.episodes.length === 0 && (
                  <p className="text-sm text-gray-600">No episodes yet.</p>
                )}
              </div>
            </div>
          ))}
          {content.contentSeasons.length === 0 && content.mediaType === 'tv' && (
            <p className="text-sm text-gray-500">
              No seasons added. Use the API to add seasons and episodes.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-400">{label}</label>
      {children}
    </div>
  )
}

const inp =
  'w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-netflix-red transition'
