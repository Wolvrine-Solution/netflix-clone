import { Inject, Injectable } from '@nestjs/common'
import type { Database } from '@netflix/db'
import { filterByKidProfile } from '../../common/maturity'
import { DB } from '../../common/tokens'

@Injectable()
export class RowsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async list(kid: boolean) {
    const rows = await this.db.query.row.findMany({
      orderBy: (r, { asc }) => asc(r.order),
      with: {
        contents: {
          orderBy: (cr, { asc }) => asc(cr.order),
          limit: 20,
          with: { content: { with: { genres: { with: { genre: true } } } } },
        },
      },
    })
    return rows.map((row) => {
      const items = row.contents.map((cr) => ({
        id: cr.content.id,
        tmdbId: cr.content.tmdbId ?? undefined,
        title: cr.content.title,
        description: cr.content.description,
        posterPath: cr.content.posterPath,
        backdropPath: cr.content.backdropPath,
        releaseDate: cr.content.releaseDate,
        rating: cr.content.rating,
        mediaType: cr.content.mediaType,
        genres: cr.content.genres.map((cg) => ({ id: cg.genre.id, name: cg.genre.name })),
        runtime: cr.content.runtime ?? undefined,
        seasons: cr.content.seasons ?? undefined,
        maturityRating: cr.content.maturityRating,
        trailerKey: cr.content.trailerKey ?? undefined,
        isFeatured: cr.content.isFeatured,
        status: cr.content.status,
        language: cr.content.language,
        cast: cr.content.cast,
      }))
      return { id: row.id, title: row.title, items: kid ? filterByKidProfile(items, true) : items }
    })
  }
}
