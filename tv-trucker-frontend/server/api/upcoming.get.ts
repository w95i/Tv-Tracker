// GET /api/upcoming — the timeline's titles, live from the TVTracker API, cached for 6 hours.
// If the API can't be reached, the snapshot taken when this was built stands in (the page drops past dates).
import snapshot from "../data/upcoming-snapshot.json";
import type { UpcomingItem } from "../utils/upcoming";

export default defineCachedEventHandler(
  async () => {
    try {
      const items = await loadUpcoming();
      if (items.length >= 4) return items;
    } catch {
      // fall through to the snapshot
    }
    return snapshot as UpcomingItem[];
  },
  { name: "upcoming", maxAge: 60 * 60 * 6, swr: true },
);
