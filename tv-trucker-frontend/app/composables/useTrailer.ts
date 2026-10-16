import { getTrailer, type TitleKind } from "~/services/trailers";

// The trailer for one title. Resolved on the server too, so the "watch the trailer" chip is in the first paint.
export function useTrailer(kind: TitleKind, tmdbId: number) {
  return useAsyncData(`trailer-${kind}-${tmdbId}`, () => getTrailer(kind, tmdbId), { default: () => null });
}
