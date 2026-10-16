// "How did it make you feel?" — the 12 Peek feelings (brand kit v5.8; the emoji are cut from
// design-references/originals/tvtracker-peek-figma-board-v5.8.svg into public/images/feelings/<key>.svg),
// and three episodes to feel something about. Episode names, IMDb ratings and stills come from the
// TVTracker API (fetched 2026-10-16). How everyone felt is an illustration (shares out of 100).

export const feelingKeys = [
  "shocked", "frustrated", "sad", "reflective",
  "touched", "amused", "scared", "bored",
  "understood", "thrilled", "confused", "tense",
] as const;
export type Feeling = (typeof feelingKeys)[number];

export interface FeelEpisode {
  id: string;
  /** id in hero-titles.ts (show title, poster) */
  show: string;
  season: number;
  episode: number;
  name: { en: string; ar: string };
  still: string;
  imdb: number;
  votes: number;
  share: Partial<Record<Feeling, number>>;
}

export const feelEpisodes: FeelEpisode[] = [
  {
    id: "rains-of-castamere",
    show: "game-of-thrones",
    season: 3,
    episode: 9,
    name: { en: "The Rains of Castamere", ar: "أمطار كاستامير" },
    still: "/images/episodes/rains-of-castamere.jpg",
    imdb: 9.9,
    votes: 12840,
    share: { shocked: 46, sad: 18, frustrated: 12, scared: 8, tense: 7, touched: 4, thrilled: 2, confused: 1, reflective: 1, understood: 1 },
  },
  {
    id: "long-long-time",
    show: "the-last-of-us",
    season: 1,
    episode: 3,
    name: { en: "Long, Long Time", ar: "زمن طويل جدًا" },
    still: "/images/episodes/long-long-time.jpg",
    imdb: 8.1,
    votes: 9312,
    share: { touched: 41, sad: 27, reflective: 13, understood: 9, amused: 4, thrilled: 2, shocked: 1, tense: 1, frustrated: 1, confused: 1 },
  },
  {
    id: "cold-harbor",
    show: "severance",
    season: 2,
    episode: 10,
    name: { en: "Cold Harbor", ar: "كولد هاربر" },
    still: "/images/episodes/cold-harbor.jpg",
    imdb: 9.4,
    votes: 6205,
    share: { shocked: 24, tense: 22, thrilled: 18, confused: 11, touched: 8, reflective: 6, understood: 4, frustrated: 3, sad: 2, scared: 1, amused: 1 },
  },
];
