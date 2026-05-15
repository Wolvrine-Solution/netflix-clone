export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  genre_ids: number[]
  adult: boolean
}

export interface TMDBTVShow {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  genre_ids: number[]
}

export interface TMDBVideoResult {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number
  genres: Array<{ id: number; name: string }>
  videos: { results: TMDBVideoResult[] }
  credits: {
    cast: Array<{ id: number; name: string; character: string }>
    crew: Array<{ id: number; name: string; job: string }>
  }
}

export interface TMDBTVDetails extends TMDBTVShow {
  number_of_seasons: number
  number_of_episodes: number
  genres: Array<{ id: number; name: string }>
  videos: { results: TMDBVideoResult[] }
  seasons: Array<{
    id: number
    season_number: number
    episode_count: number
    name: string
    poster_path: string | null
  }>
}

export interface TMDBSearchResult {
  page: number
  results: Array<(TMDBMovie | TMDBTVShow) & { media_type: 'movie' | 'tv' | 'person' }>
  total_pages: number
  total_results: number
}
