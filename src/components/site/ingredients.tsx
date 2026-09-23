/** Small illustrated ingredients used as floating decoration. Purely decorative (aria-hidden). */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

export const Basil = (p: P) => (
  <svg viewBox="0 0 40 40" aria-hidden {...p}>
    <path d="M20 2 C34 10 34 28 20 38 C6 28 6 10 20 2 Z" fill="#2f7d32" />
    <path d="M20 5 L20 36" stroke="#5fb163" strokeWidth="1.6" />
    <path d="M20 14 L27 10 M20 21 L28 17 M20 28 L26 25 M20 14 L13 10 M20 21 L12 17 M20 28 L14 25" stroke="#5fb163" strokeWidth="1" />
  </svg>
);

export const TomatoSlice = (p: P) => (
  <svg viewBox="0 0 40 40" aria-hidden {...p}>
    <circle cx="20" cy="20" r="18" fill="#d93a22" />
    <circle cx="20" cy="20" r="14" fill="#f25a3d" />
    <path d="M20 8 L20 32 M8 20 L32 20" stroke="#d93a22" strokeWidth="2" />
    {[
      [14, 14],
      [26, 14],
      [14, 26],
      [26, 26],
    ].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx="2.2" ry="3" fill="#ffd9a8" />
    ))}
  </svg>
);

export const Chili = (p: P) => (
  <svg viewBox="0 0 40 40" aria-hidden {...p}>
    <path d="M30 6 C22 8 22 14 18 20 C14 27 8 30 4 36 C14 36 26 28 30 16 Z" fill="#e5311b" />
    <path d="M28 6 C30 3 33 3 35 4" stroke="#2f7d32" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M24 12 C22 18 18 24 12 29" stroke="#ff8a6e" strokeWidth="1.6" strokeLinecap="round" fill="none" />
  </svg>
);

export const Olive = (p: P) => (
  <svg viewBox="0 0 40 40" aria-hidden {...p}>
    <ellipse cx="20" cy="20" rx="14" ry="11" fill="#1f1b1a" />
    <ellipse cx="20" cy="20" rx="6" ry="4.5" fill="#6b3d2e" />
    <ellipse cx="15" cy="15" rx="3" ry="1.6" fill="#fff" opacity="0.25" />
  </svg>
);

export const Pepperoni = (p: P) => (
  <svg viewBox="0 0 40 40" aria-hidden {...p}>
    <circle cx="20" cy="20" r="17" fill="#b3261e" />
    <circle cx="20" cy="20" r="17" fill="none" stroke="#7d1a13" strokeWidth="2" />
    <circle cx="14" cy="15" r="2.6" fill="#e0563f" />
    <circle cx="25" cy="23" r="2" fill="#e0563f" />
    <circle cx="22" cy="12" r="1.5" fill="#7a1510" />
    <circle cx="13" cy="25" r="1.7" fill="#7a1510" />
  </svg>
);

export const Mushroom = (p: P) => (
  <svg viewBox="0 0 40 40" aria-hidden {...p}>
    <path d="M5 20 C5 6 35 6 35 20 Z" fill="#f1e2cd" stroke="#8c6a4a" strokeWidth="2" />
    <path d="M15 20 L14 33 Q20 36 26 33 L25 20 Z" fill="#e8d4b8" stroke="#8c6a4a" strokeWidth="2" />
  </svg>
);

export const Slice = (p: P) => (
  <svg viewBox="0 0 60 60" aria-hidden {...p}>
    <path d="M30 56 L6 10 Q30 0 54 10 Z" fill="#ffcf5c" stroke="#141110" strokeWidth="3" strokeLinejoin="round" />
    <path d="M6 10 Q30 0 54 10 L51 16 Q30 7 9 16 Z" fill="#d98b3a" stroke="#141110" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="26" cy="22" r="5" fill="#b3261e" />
    <circle cx="37" cy="30" r="4" fill="#b3261e" />
    <circle cx="29" cy="39" r="3.5" fill="#b3261e" />
    <path d="M18 18 Q20 26 17 30" stroke="#ffe08a" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);
