/**
 * Mock, TMDB-style content used to drive the UI without touching any API.
 * Poster/backdrop URLs use picsum.photos with stable seeds so images are
 * deterministic and load offline-friendly during development.
 */

export type Title = {
  id: string
  title: string
  /** Tall poster image (2:3-ish). */
  poster: string
  /** Wide backdrop image (16:9-ish). */
  backdrop: string
  year: number
  rating: string
  /** Runtime or "N Seasons". */
  meta: string
  /** Percent of an episode watched (0-100), used by Continue Watching. */
  progress?: number
  genres: string[]
  overview: string
  isNew?: boolean
  topTen?: boolean
}

const poster = (seed: string) => `https://picsum.photos/seed/${seed}/400/600`
const backdrop = (seed: string) => `https://picsum.photos/seed/${seed}/1280/720`

const make = (
  id: string,
  title: string,
  opts: Partial<Title> & Pick<Title, 'year' | 'rating' | 'meta' | 'genres' | 'overview'>
): Title => ({
  id,
  title,
  poster: poster(`${id}-p`),
  backdrop: backdrop(`${id}-b`),
  ...opts,
})

export const featured: Title = make('stranger-things', 'Stranger Things', {
  year: 2024,
  rating: 'TV-14',
  meta: '4 Seasons',
  genres: ['Sci-Fi', 'Horror', 'Drama'],
  overview:
    'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
  isNew: true,
})

const pool: Title[] = [
  make('dark-matter', 'Dark Matter', {
    year: 2024, rating: 'TV-MA', meta: '1 Season', genres: ['Sci-Fi', 'Thriller'],
    overview: 'A physicist is abducted into an alternate version of his life and must fight to return to his true reality.',
    isNew: true,
  }),
  make('the-crown', 'The Crown', {
    year: 2023, rating: 'TV-MA', meta: '6 Seasons', genres: ['Drama', 'History'],
    overview: 'Follows the political rivalries and romance of Queen Elizabeth II’s reign and the events that shaped the second half of the 20th century.',
  }),
  make('blue-eye-samurai', 'Blue Eye Samurai', {
    year: 2023, rating: 'TV-MA', meta: '1 Season', genres: ['Animation', 'Action'],
    overview: 'In Edo-period Japan, a mixed-race swordmaster sets out on a path of vengeance.',
    topTen: true,
  }),
  make('the-witcher', 'The Witcher', {
    year: 2023, rating: 'TV-MA', meta: '3 Seasons', genres: ['Fantasy', 'Adventure'],
    overview: 'Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.',
  }),
  make('wednesday', 'Wednesday', {
    year: 2022, rating: 'TV-14', meta: '1 Season', genres: ['Comedy', 'Mystery'],
    overview: 'Wednesday Addams navigates her years at Nevermore Academy while mastering an emerging psychic ability.',
    topTen: true,
  }),
  make('the-night-agent', 'The Night Agent', {
    year: 2024, rating: 'TV-MA', meta: '2 Seasons', genres: ['Thriller', 'Action'],
    overview: 'A low-level FBI agent answers a phone call that plunges him into a deadly conspiracy reaching the White House.',
    isNew: true, topTen: true,
  }),
  make('arcane', 'Arcane', {
    year: 2024, rating: 'TV-14', meta: '2 Seasons', genres: ['Animation', 'Action'],
    overview: 'Amid the stark discord of twin cities, two sisters fight on rival sides of a war between magic technologies and clashing convictions.',
    topTen: true,
  }),
  make('the-diplomat', 'The Diplomat', {
    year: 2024, rating: 'TV-MA', meta: '2 Seasons', genres: ['Drama', 'Politics'],
    overview: 'A career diplomat lands in a high-profile job for which she is woefully unsuited, with tectonic implications for her marriage and her future.',
  }),
  make('one-piece', 'One Piece', {
    year: 2023, rating: 'TV-14', meta: '1 Season', genres: ['Adventure', 'Fantasy'],
    overview: 'With his straw hat and ragtag crew, young pirate Monkey D. Luffy goes on an epic voyage for treasure.',
    topTen: true,
  }),
  make('black-mirror', 'Black Mirror', {
    year: 2023, rating: 'TV-MA', meta: '6 Seasons', genres: ['Sci-Fi', 'Anthology'],
    overview: 'An anthology series exploring a twisted, high-tech near-future where humanity’s greatest innovations collide with its darkest instincts.',
  }),
  make('lupin', 'Lupin', {
    year: 2023, rating: 'TV-MA', meta: '3 Parts', genres: ['Crime', 'Mystery'],
    overview: 'Inspired by the adventures of Arsène Lupin, gentleman thief Assane Diop sets out to avenge his father.',
  }),
  make('the-gentlemen', 'The Gentlemen', {
    year: 2024, rating: 'TV-MA', meta: '1 Season', genres: ['Crime', 'Comedy'],
    overview: 'When an aristocrat inherits a sprawling estate, he discovers it’s home to a weed empire — and its proprietors aren’t going anywhere.',
    isNew: true,
  }),
]

const byIds = (ids: string[]) => ids.map((id) => pool.find((t) => t.id === id)!).filter(Boolean)

export const rows = {
  trending: pool,
  topTen: pool.filter((t) => t.topTen).slice(0, 10),
  continueWatching: byIds(['the-witcher', 'dark-matter', 'arcane', 'lupin']).map((t, i) => ({
    ...t,
    progress: [68, 32, 91, 14][i],
  })),
  newReleases: pool.filter((t) => t.isNew),
} as const

/** Combined catalogue, handy for search / grids. */
export const catalogue: Title[] = [featured, ...pool]

/** A subset pretending to be the user's saved list. */
export const myList: Title[] = byIds([
  'arcane', 'blue-eye-samurai', 'wednesday', 'one-piece', 'the-witcher', 'dark-matter',
])

export const newAndHot: Title[] = [
  featured,
  ...pool.filter((t) => t.isNew || t.topTen),
]
