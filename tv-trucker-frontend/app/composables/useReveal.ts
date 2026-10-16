// Fades `.rv` elements in as they scroll into view. Without IntersectionObserver,
// or with reduced motion, everything is shown at once.
export function useReveal() {
  onMounted(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".rv"));
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!("IntersectionObserver" in window) || still) {
      items.forEach((n) => n.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    items.forEach((n) => io.observe(n));

    // A fast fling can skip past an element entirely — reveal anything already above the fold line.
    let pending = items;
    const onScroll = () => {
      pending = pending.filter((n) => {
        if (n.classList.contains("in")) return false;
        if (n.getBoundingClientRect().top < innerHeight * 0.95) {
          n.classList.add("in");
          return false;
        }
        return true;
      });
    };
    addEventListener("scroll", onScroll, { passive: true });

    onBeforeUnmount(() => {
      io.disconnect();
      removeEventListener("scroll", onScroll);
    });
  });
}
