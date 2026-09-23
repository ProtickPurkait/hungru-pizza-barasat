"use client";

import { Bell, BellOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/admin/ui";

const REFRESH_MS = 20_000;

function beep() {
  try {
    const ctx = new AudioContext();
    const play = (freq: number, at: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.25);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.3);
    };
    play(880, 0);
    play(1320, 0.28);
  } catch {
    /* audio not available */
  }
}

/** Refreshes the orders list every 20s and (optionally) plays a chime when new orders arrive. */
export function OrdersLive({ newCount }: { newCount: number }) {
  const router = useRouter();
  const [sound, setSound] = useState(false);
  const previous = useRef(newCount);

  useEffect(() => {
    const saved = localStorage.getItem("hungru-order-sound") === "on";
    setSound(saved);
  }, []);

  useEffect(() => {
    if (newCount > previous.current) {
      if (sound) beep();
      if (typeof document !== "undefined") document.title = `(${newCount}) New orders · Hungru Admin`;
    }
    previous.current = newCount;
  }, [newCount, sound]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible" || sound) router.refresh();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [router, sound]);

  return (
    <Button
      variant={sound ? "primary" : "secondary"}
      size="sm"
      icon={sound ? <Bell className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />}
      aria-pressed={sound}
      onClick={() => {
        const next = !sound;
        setSound(next);
        try {
          localStorage.setItem("hungru-order-sound", next ? "on" : "off");
        } catch {
          /* ignore */
        }
        if (next) beep();
      }}
    >
      {sound ? "Sound alerts on" : "Turn on sound alerts"}
    </Button>
  );
}
