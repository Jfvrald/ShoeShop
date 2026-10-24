import { useEffect } from "react";

// Section entrances are triggered by visibility; image depth follows actual scroll.
export default function useScrollMotion(rootRef, page) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !window.IntersectionObserver) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reveals = new Set();
    let layers = [];
    let drifters = [];
    let frame = null;
    let observer;

    function update() {
      frame = null;
      const height = window.innerHeight;
      // data-par="0.2": drift against the scroll, relative to the viewport centre.
      drifters.forEach((node) => {
        const anchor = node.parentElement.getBoundingClientRect();
        const offset = anchor.top + anchor.height / 2 - height / 2;
        node.style.translate = `0 ${(offset * -Number(node.dataset.par)).toFixed(1)}px`;
      });
      layers.forEach((node) => {
        const anchor = node.classList.contains("par-slow")
          ? node.closest("section") : node.parentElement;
        const bounds = anchor.getBoundingClientRect();
        const scene = node.closest(".community-scroll");
        const sceneBounds = scene?.getBoundingClientRect();
        const progress = scene && sceneBounds.height > bounds.height
          ? Math.min(1, Math.max(0, (72 - sceneBounds.top) / Math.max(1, sceneBounds.height - bounds.height)))
          : Math.min(1, Math.max(0, (height - bounds.top) / (height + bounds.height)));
        node.style.setProperty("--scroll-progress", progress.toFixed(4));
      });
    }

    function schedule() {
      if (frame === null) frame = window.requestAnimationFrame(update);
    }

    function collect() {
      if (preference.matches) return;
      // React can replace cards when filters change without remounting the page.
      reveals.forEach((node) => {
        if (!root.contains(node)) {
          observer.unobserve(node);
          reveals.delete(node);
        }
      });
      root.querySelectorAll(".rv, .par-cell").forEach((node) => {
        if (reveals.has(node)) return;
        reveals.add(node);
        node.classList.add("scroll-reveal");
        observer.observe(node);
      });
      drifters = [...root.querySelectorAll("[data-par]")];
      layers = [...root.querySelectorAll(".par-img, .culture-track, .par-slow")];
      layers.forEach((node) => node.classList.add("scroll-depth"));
      schedule();
    }

    function stop() {
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      reveals.forEach((node) => node.classList.remove("scroll-reveal", "is-in-view"));
      reveals.clear();
      layers.forEach((node) => {
        node.classList.remove("scroll-depth");
        node.style.removeProperty("--scroll-progress");
      });
      layers = [];
      drifters.forEach((node) => node.style.removeProperty("translate"));
      drifters = [];
    }

    function start() {
      stop();
      if (preference.matches) return;
      observer = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting, boundingClientRect }) => {
          if (isIntersecting) target.classList.add("is-in-view");
          // Re-arm below the viewport, keeping content above it visible.
          else if (boundingClientRect.top >= window.innerHeight * 0.9) {
            target.classList.remove("is-in-view");
          }
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0 });
      collect();
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
    }

    start();
    const mutations = new MutationObserver(collect);
    mutations.observe(root, { childList: true, subtree: true });
    preference.addEventListener("change", start);
    return () => {
      mutations.disconnect();
      preference.removeEventListener("change", start);
      stop();
    };
  }, [rootRef, page]);
}
