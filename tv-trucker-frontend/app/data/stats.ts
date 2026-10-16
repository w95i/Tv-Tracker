// The sample year in the Stats section (an illustration). The library totals — shows, episodes, films — are
// the ones the Switching section imports (landing.ts importTotals), so the page tells one story.
import type { Feeling } from "~/data/feelings";

export const statsSample = {
  // 1,248 episodes × ~50 min + 312 films × ~2 h
  hours: 1664,
  streak: 23,
  topFeeling: "thrilled" as Feeling,
  topFeelingCount: 148,
  favourite: { show: "severance", episodes: 19, hours: 17 },
  genres: [
    { k: "drama", pct: 34 },
    { k: "scifi", pct: 22 },
    { k: "crime", pct: 17 },
    { k: "comedy", pct: 15 },
    { k: "animation", pct: 12 },
  ],
};
