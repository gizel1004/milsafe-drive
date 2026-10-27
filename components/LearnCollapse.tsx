"use client";

import { useEffect } from "react";

/** 모바일에서는 교육 카드를 접어 두고, 바로가기로 선택한 카드만 펼친다 */
export default function LearnCollapse() {
  useEffect(() => {
    const cards = () => Array.from(document.querySelectorAll<HTMLDetailsElement>("details.learn-card"));
    const openHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = id ? (document.getElementById(id) as HTMLDetailsElement | null) : null;
      if (target && target.tagName === "DETAILS") {
        target.open = true;
        target.scrollIntoView({ block: "start" });
      }
    };
    if (window.matchMedia("(max-width: 800px)").matches) {
      cards().forEach((c) => (c.open = false));
    }
    openHash();
    window.addEventListener("hashchange", openHash);
    return () => window.removeEventListener("hashchange", openHash);
  }, []);
  return null;
}
