import { Inject, Injectable } from '@nestjs/common'
import { and, content, eq, ilike, type Database } from '@netflix/db'
import { filterByKidProfile, kidsMaturityCondition } from '../../common/maturity'
import { DB } from '../../common/tokens'
import { TmdbService } from '../content/tmdb.service'
import { SearchIndexerService } from './search-indexer.service'

const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&')

@Injectable()
export class SearchService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(TmdbService) private readonly tmdb: TmdbService,
    @Inject(SearchIndexerService) private readonly indexer: SearchIndexerService
  ) {}

  async search(q: string, isKid: boolean) {
    const [dbResults, tmdbResults, indexedResults] = await Promise.all([
      this.db.query.content.findMany({
        where: (c) =>
          and(
            ilike(c.title, `%${escapeLike(q)}%`),
            eq(c.status, 'PUBLISHED'),
            isKid ? kidsMaturityCondition(c.maturityRating) : undefined
          ),
        limit: 10,
        with: { genres: { with: { genre: true } } },
      }),
      this.tmdb.search(q),
      this.indexer.searchCatalog(q, isKid),
    ])

    const dbIds = new Set(dbResults.map((c) => c.tmdbId))
    const mappedDb = dbResults.map((c) => ({
      id: c.id,
      tmdbId: c.tmdbId ?? undefined,
      title: c.title,
      description: c.description,
      posterPath: c.posterPath,
      backdropPath: c.backdropPath,
      releaseDate: c.releaseDate,
      rating: c.rating,
      mediaType: c.mediaType,
      genres: c.genres.map((cg) => ({ id: cg.genre.id, name: cg.genre.name })),
      maturityRating: c.maturityRating,
      trailerKey: c.trailerKey ?? undefined,
      isFeatured: c.isFeatured,
      status: c.status,
      language: c.language,
      cast: c.cast,
    }))

    const merged = [
      ...mappedDb,
      ...indexedResults
        .filter((r) => !dbResults.some((d) => d.id === r.id))
        .map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          posterPath: '',
          backdropPath: '',
          releaseDate: '',
          rating: 0,
          mediaType: r.mediaType as 'movie' | 'tv',
          genres: [],
          maturityRating: r.maturityRating,
          isFeatured: false,
          status: 'PUBLISHED' as const,
          language: 'en',
          cast: [] as string[],
        })),
      ...filterByKidProfile(
        tmdbResults.filter((r) => !dbIds.has(r.tmdbId ?? null)),
        isKid
      ),
    ]
    return merged.slice(0, 30)
  }
}
