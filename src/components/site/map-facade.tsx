"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";

/** Loads the Google Maps iframe only when the visitor asks for it (keeps the page fast and private). */
export function MapFacade({ embedUrl, label }: { embedUrl: string; label: string }) {
  const [loaded, setLoaded] = useState(false);
  if (loaded) {
    return (
      <iframe
        src={embedUrl}
        title={`Map: ${label}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="h-full w-full border-0"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className="group relative flex h-full w-full items-center justify-center overflow-hidden bg-[#e9dcc4]"
      aria-label={`Load interactive map for ${label}`}
    >
      <MapArt />
      <span className="relative z-10 flex flex-col items-center gap-3">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-white ring-4 ring-cream shadow-xl transition-transform group-hover:-translate-y-1">
          <MapPin className="size-8" aria-hidden />
        </span>
        <span className="rounded-full bg-ink px-5 py-2.5 text-sm font-extrabold tracking-wide text-cream uppercase">Tap to load map</span>
      </span>
    </button>
  );
}

export function MapArt() {
  return (
    <svg aria-hidden viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <rect width="400" height="300" fill="#efe3cc" />
      <path d="M-10 210 C80 190 120 240 220 200 S360 150 420 170" stroke="#fff" strokeWidth="26" fill="none" />
      <path d="M150 -10 C160 80 130 140 170 320" stroke="#fff" strokeWidth="18" fill="none" />
      <path d="M-10 80 L420 110" stroke="#fff" strokeWidth="12" fill="none" />
      <path d="M300 -10 L280 320" stroke="#fff" strokeWidth="10" fill="none" />
      <rect x="30" y="110" width="80" height="60" rx="6" fill="#dfd0b4" />
      <rect x="200" y="20" width="60" height="70" rx="6" fill="#dfd0b4" />
      <rect x="310" y="190" width="70" height="80" rx="6" fill="#cfe0b8" />
      <circle cx="60" cy="40" r="26" fill="#cfe0b8" />
    </svg>
  );
}
