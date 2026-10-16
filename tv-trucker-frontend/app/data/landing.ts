// Placeholder content for the landing page. Swap the pictures and titles here when real resources arrive.

export interface FanSlot {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  /** Entrance delay, seconds */
  delay: number;
}

// The poster fan's places on the right of the phone, nearest first (depth 0–4); the left side mirrors them.
// Depths 3 and 4 are hidden on phones. The titles that fill them are in hero-titles.ts.
export const fanSlots: FanSlot[] = [
  { x: 215, y: 44, rotate: 4.0, scale: 1.0, delay: 0.12 },
  { x: 367, y: 79, rotate: 7.2, scale: 0.94, delay: 0.19 },
  { x: 519, y: 132, rotate: 10.4, scale: 0.88, delay: 0.26 },
  { x: 671, y: 203, rotate: 13.6, scale: 0.82, delay: 0.33 },
  { x: 823, y: 292, rotate: 16.8, scale: 0.76, delay: 0.4 },
];

// The moving wall behind the hero: 42 posters (from tvtracker-landing (1).html) in 3 rows of 14.
const wallPosters = Array.from({ length: 42 }, (_, i) => `/images/posters/wall-${String(i + 1).padStart(2, "0")}.jpg`);
export const wallRows: string[][] = [0, 1, 2].map((r) => wallPosters.slice(r * 14, r * 14 + 14));

export interface SwitchApp {
  /** i18n key under switching.apps */
  key: "tvtime" | "imdb" | "letterboxd" | "trakt";
  name: string;
  /** The app's badge: text on a colour, or Letterboxd's three dots */
  badge: { bg: string; fg?: string; text?: string; dots?: string[] };
}

// "Switching?" (from tvtracker-landing (1).html): the four apps that hand their history over,
// the 16 posters that fly from them into the phone (4 per app), and the totals the phone counts up to.
export const switchApps: SwitchApp[] = [
  { key: "tvtime", name: "TV Time", badge: { bg: "#ffd54a", fg: "#1d1d1f", text: "TV" } },
  { key: "imdb", name: "IMDb", badge: { bg: "#f5c518", fg: "#000", text: "IMDb" } },
  { key: "letterboxd", name: "Letterboxd", badge: { bg: "#202830", dots: ["#ff8000", "#00e054", "#40bcf4"] } },
  { key: "trakt", name: "Trakt", badge: { bg: "#ed1c24", fg: "#fff", text: "tr" } },
];
export const switchPosters = Array.from({ length: 16 }, (_, i) => `/images/posters/switch-${String(i + 1).padStart(2, "0")}.jpg`);
export const importTotals = { shows: 86, episodes: 1248, movies: 312 };
