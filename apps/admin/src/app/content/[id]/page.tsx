import { asc, content as contentTable, db, eq, genre as genreTable } from '@netflix/db'
import { notFound } from 'next/navigation'
import { ContentEditForm } from './ContentEditForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

export default async function ContentEditPage({ params }: Props) {
  const { id } = params

  const content = await db.query.content.findFirst({
    where: eq(contentTable.id, id),
    with: {
      genres: { with: { genre: true } },
      videoFiles: { orderBy: (v, { asc: a }) => a(v.createdAt) },
      contentSeasons: {
        orderBy: (s, { asc: a }) => a(s.seasonNumber),
        with: {
          episodes: {
            orderBy: (e, { asc: a }) => a(e.episodeNumber),
            with: { videoFiles: true },
          },
        },
      },
    },
  })

  if (!content) notFound()

  const allGenres = await db.select().from(genreTable).orderBy(asc(genreTable.name))

  return (
    <ContentEditForm
      content={JSON.parse(
        JSON.stringify(content, (_k, v) => (typeof v === 'bigint' ? Number(v) : v))
      )}
      allGenres={allGenres}
    />
  )
}
