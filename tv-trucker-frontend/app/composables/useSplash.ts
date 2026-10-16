// The intro splash plays on every visit (every full page load). `active` lets the hero hold its
// entrance — and the carousel and trailer their timers — until it's over.
export function useSplash() {
  const active = useState("splash-active", () => true);

  /** Runs `fn` now, or as soon as the splash has finished. */
  const afterSplash = (fn: () => void) => {
    if (!active.value) return fn();
    const stop = watch(active, (v) => {
      if (v) return;
      stop();
      fn();
    });
  };

  return { active, afterSplash };
}
