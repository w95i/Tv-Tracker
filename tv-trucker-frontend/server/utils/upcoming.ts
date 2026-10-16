// The "Never miss a return" timeline: what's coming next for a hand-picked set of well-known shows and films,
// read live from the TVTracker API (next episode to air, release dates, where to watch) in English and Arabic.

const API = "https://tvtracker.tv/api/v1/media";

// Picked for recognisable names and a spread of dates. Past ones drop out by themselves; add new ones here.
const SHOWS = [247718, 153312, 213375, 95480, 273247, 2190, 196322, 1413, 203857, 114461, 125988, 94997, 100088, 95396, 119051, 66732];
const MOVIES = [1400940, 791523, 1381071, 1117898, 1170608, 1003596];

export interface UpcomingItem {
  kind: "show" | "movie";
  tmdbId: number;
  /** YYYY-MM-DD */
  date: string;
  title: { en: string; ar: string };
  poster: string | null;
  season: number | null;
  episode: number | null;
  episodeName: { en: string; ar: string } | null;
  /** a show's season or series premiere / finale */
  tag: "premiere" | "finale" | null;
  /** first streaming service (shows), or null (films: in cinemas) */
  provider: string | null;
}

interface ApiTitle {
  name?: string;
  title?: string;
  poster?: { w342?: string } | null;
  release_date?: string | null;
  next_episode_to_air?: { air_date: string; season_number: number; episode_number: number; name: string; episode_type?: string } | null;
  providers?: { flatrate?: { provider_name: string }[] } | null;
}

// Shorter, familiar names for the services the API spells out in full.
const PROVIDERS: [RegExp, string][] = [
  [/^apple tv/i, "Apple TV+"],
  [/^hbo max|^max$/i, "HBO Max"],
  [/^netflix/i, "Netflix"],
  [/^disney/i, "Disney+"],
  [/^paramount/i, "Paramount+"],
  [/^hulu/i, "Hulu"],
  [/^amazon prime|^prime video/i, "Prime Video"],
];
const providerName = (t: ApiTitle) => {
  for (const p of t.providers?.flatrate ?? []) {
    const hit = PROVIDERS.find(([re]) => re.test(p.provider_name));
    if (hit) return hit[1];
  }
  return null;
};

const get = (kind: "shows" | "movies", id: number, lang: "en" | "ar") =>
  $fetch<{ data: ApiTitle }>(`${API}/${kind}/${id}`, { query: { lang }, timeout: 8000 }).then((r) => r.data);

export async function loadUpcoming(today = new Date().toISOString().slice(0, 10)): Promise<UpcomingItem[]> {
  const shows = SHOWS.map(async (id): Promise<UpcomingItem | null> => {
    const [en, ar] = await Promise.all([get("shows", id, "en"), get("shows", id, "ar")]);
    const n = en.next_episode_to_air, nAr = ar.next_episode_to_air;
    if (!n?.air_date || n.air_date < today) return null;
    const generic = /^episode \d+$/i.test(n.name); // not named yet
    return {
      kind: "show",
      tmdbId: id,
      date: n.air_date,
      title: { en: en.name ?? "", ar: ar.name || en.name || "" },
      poster: en.poster?.w342 ?? null,
      season: n.season_number,
      episode: n.episode_number,
      episodeName: generic ? null : { en: n.name, ar: nAr?.name && !/^(episode|الحلقة) \d+$/i.test(nAr.name) ? nAr.name : n.name },
      tag: n.episode_number === 1 ? "premiere" : n.episode_type === "finale" ? "finale" : null,
      provider: providerName(en),
    };
  });
  const movies = MOVIES.map(async (id): Promise<UpcomingItem | null> => {
    const [en, ar] = await Promise.all([get("movies", id, "en"), get("movies", id, "ar")]);
    if (!en.release_date || en.release_date < today) return null;
    return {
      kind: "movie",
      tmdbId: id,
      date: en.release_date,
      title: { en: en.title ?? "", ar: ar.title || en.title || "" },
      poster: en.poster?.w342 ?? null,
      season: null,
      episode: null,
      episodeName: null,
      tag: null,
      provider: null,
    };
  });
  const all = await Promise.allSettled([...shows, ...movies]);
  return all
    .flatMap((r) => (r.status === "fulfilled" && r.value ? [r.value] : []))
    .sort((a, b) => a.date.localeCompare(b.date));
}
