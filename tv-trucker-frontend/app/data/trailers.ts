// Hard-coded trailers for the hero carousel, keyed by TMDB id. Temporary: the backend will serve these
// (see app/services/trailers.ts). Keys are YouTube video ids, picked from tvtracker.tv/api/v1/media
// on 2026-10-16 and checked to allow embedding.

import type { Trailer } from "~/services/trailers";

export const hardcodedTrailers: Record<number, Trailer> = {
  94997: { youtubeKey: "DotnJ7tTA34", name: "Official Trailer" }, // House of the Dragon
  76479: { youtubeKey: "tcrNsIaQkb4", name: "Final Trailer" }, // The Boys
  1399: { youtubeKey: "KPLWWIOCOOQ", name: "Official Series Trailer" }, // Game of Thrones
  100088: { youtubeKey: "uLtkt8BonwM", name: "Official Trailer" }, // The Last of Us
  125988: { youtubeKey: "8ZYhuvIv1pA", name: "Official Trailer" }, // Silo
  95396: { youtubeKey: "xEQP4VVuyrY", name: "Official Trailer" }, // Severance
  693134: { youtubeKey: "U2Qp5pL3ovA", name: "Official Trailer 3" }, // Dune: Part Two
  872585: { youtubeKey: "bK6ldnjE3Y0", name: "Official Trailer" }, // Oppenheimer
  157336: { youtubeKey: "LY19rHKAaAg", name: "Trailer 4" }, // Interstellar
  666277: { youtubeKey: "kA244xewjcI", name: "Official Trailer" }, // Past Lives
  496243: { youtubeKey: "isOGD_7hNIY", name: "Official US Trailer" }, // Parasite
};
