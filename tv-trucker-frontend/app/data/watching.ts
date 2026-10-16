// "Every episode, ticked off": the Watching now list you can tick through. Real episodes from the TVTracker
// API (tvtracker.tv/api/v1/media/shows/{id}/seasons/{n}, en + ar), fetched 2026-10-16. Titles, posters and
// backdrops come from hero-titles.ts by id.
// Rules (design-references/specs/app-my-shows-rules-and-motion.md): +N = aired episodes left after the
// current one; at 0 it reads FINALE if the series has ended, LATEST if it's still running. Ticking the last
// one: SERIES COMPLETE (+ confetti) if it has ended, ALL CAUGHT UP if not.

export interface WatchEpisode {
  n: number;
  en: string;
  ar: string;
}

export interface WatchShow {
  /** id in hero-titles.ts */
  id: string;
  season: number;
  /** the series has ended (its last episode completes the series) */
  ended: boolean;
  /** episodes in the seasons before this one (for "N episodes watched") */
  before: number;
  /** the season's episodes from the one you're on to the last aired one */
  episodes: WatchEpisode[];
}

export const watching: WatchShow[] = [
  {
    id: "the-boys",
    season: 5,
    ended: true,
    before: 32,
    episodes: [
      { n: 6, en: "Though the Heavens Fall", ar: "وإن سقطت السماء" },
      { n: 7, en: "The Frenchman, the Female, and the Man Called Mother's Milk", ar: "الرجل الفرنسي، الأنثى، والمدعوّ ماذرز ميلك" },
      { n: 8, en: "Blood and Bone", ar: "دم وعظم" },
    ],
  },
  {
    id: "severance",
    season: 2,
    ended: false,
    before: 9,
    episodes: [
      { n: 8, en: "Sweet Vitriol", ar: "زاج حلو" },
      { n: 9, en: "The After Hours", ar: "الساعات الإضافية" },
      { n: 10, en: "Cold Harbor", ar: "كولد هاربر" },
    ],
  },
  {
    id: "silo",
    season: 3,
    ended: false,
    before: 20,
    episodes: [
      { n: 8, en: "Gray Goo", ar: "الهلام الرمادي" },
      { n: 9, en: "Farewell", ar: "الوداع" },
      { n: 10, en: "Troy", ar: "تروي" },
    ],
  },
  {
    id: "house-of-the-dragon",
    season: 3,
    ended: false,
    before: 18,
    episodes: [
      { n: 6, en: "Faceless Men", ar: "رجال بلا وجوه" },
      { n: 7, en: "The Dragon in Winter", ar: "التنين في الشتاء" },
      { n: 8, en: "The Treasons at Tumbleton", ar: "خيانات في تامبلتون" },
    ],
  },
];
