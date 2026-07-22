import { prisma } from '@netflix/db'
import { notFound } from 'next/navigation'
import { ContentEditForm } from './ContentEditForm'

interface Props {
  params: { id: string }
}

export default async function ContentEditPage({ params }: Props) {
  const { id } = params

  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      genres: { include: { genre: true } },
      videoFiles: { orderBy: { createdAt: 'asc' } },
      contentSeasons: {
        orderBy: { seasonNumber: 'asc' },
        include: { episodes: { orderBy: { episodeNumber: 'asc' }, include: { videoFiles: true } } },
      },
    },
  })

  if (!content) notFound()

  const allGenres = await prisma.genre.findMany({ orderBy: { name: 'asc' } })

  return <ContentEditForm content={JSON.parse(JSON.stringify(content))} allGenres={allGenres} />
}
