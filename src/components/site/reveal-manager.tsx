"use client";

import { useEffect } from "react";

/**
 * Reveals every `.reveal` element once its top edge enters the viewport — including anything the
 * page jumped past (anchor links, fast flicks), which a plain IntersectionObserver would miss.
 */
export function RevealManager() {
  useEffect(() => {
    let frame = 0;
    const check = () => {
      const limit = window.innerHeight * 0.92;
      document.querySelectorAll<HTMLElement>(".reveal:not([data-inview])").forEach((el) => {
        if (el.getBoundingClientRect().top < limit) el.setAttribute("data-inview", "true");
      });
    };
    // Throttle (never cancel a pending check) so a busy DOM can't starve it.
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        check();
      });
    };
    check();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mutations.disconnect();
    };
  }, []);
  return null;
}
