// Where trailers come from. Everything that shows a trailer goes through getTrailer(), so moving to the
// backend means changing only this function.
import { hardcodedTrailers } from "~/data/trailers";

export interface Trailer {
  /** YouTube video id */
  youtubeKey: string;
  name: string;
}

export type TitleKind = "show" | "movie";

export async function getTrailer(kind: TitleKind, tmdbId: number): Promise<Trailer | null> {
  // TODO(backend): replace with the API call, e.g.
  //   const res = await $fetch<{ data: { trailers: { key: string; name: string }[] } }>(
  //     `https://tvtracker.tv/api/v1/media/${kind}s/${tmdbId}`);
  //   const t = res.data.trailers[0];
  //   return t ? { youtubeKey: t.key, name: t.name } : null;
  void kind;
  return hardcodedTrailers[tmdbId] ?? null;
}
