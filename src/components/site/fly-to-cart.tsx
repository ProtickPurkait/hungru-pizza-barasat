"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart/store";

type Flight = { id: number; from: { x: number; y: number }; to: { x: number; y: number } };

/** A little slice arcs from the ADD button into the cart: feedback that doesn't block browsing. */
export function FlyToCart() {
  const reduce = useReducedMotion();
  const [flights, setFlights] = useState<Flight[]>([]);

  useEffect(
    () =>
      useCart.subscribe((state, prev) => {
        const lastAdd = state.lastAdd;
        if (!lastAdd || lastAdd === prev.lastAdd || lastAdd.x === undefined || lastAdd.y === undefined || reduce) return;
        const targets = [
          ...document.querySelectorAll<HTMLElement>('[data-cart-target="primary"]'),
          ...document.querySelectorAll<HTMLElement>('[data-cart-target="secondary"]'),
        ];
        const target = targets.map((el) => el.getBoundingClientRect()).find((r) => r.width > 0 && r.height > 0);
        if (!target) return;
        const flight: Flight = {
          id: lastAdd.at,
          from: { x: lastAdd.x, y: lastAdd.y },
          to: { x: target.left + Math.min(target.width / 2, 40), y: target.top + target.height / 2 },
        };
        setFlights((f) => [...f.slice(-3), flight]);
      }),
    [reduce],
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      {flights.map((f) => (
        <motion.div
          key={f.id}
          className="absolute top-0 left-0 flex size-10 items-center justify-center rounded-full bg-accent text-xl shadow-lg ring-2 ring-ink"
          initial={{ x: f.from.x - 20, y: f.from.y - 20, scale: 0.6, opacity: 0 }}
          animate={{
            x: [f.from.x - 20, (f.from.x + f.to.x) / 2 - 20, f.to.x - 20],
            y: [f.from.y - 20, Math.min(f.from.y, f.to.y) - 120, f.to.y - 20],
            scale: [0.6, 1.1, 0.4],
            opacity: [0, 1, 0.9],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 0.75, ease: [0.3, 0, 0.3, 1] }}
          onAnimationComplete={() => setFlights((all) => all.filter((x) => x.id !== f.id))}
        >
          🍕
        </motion.div>
      ))}
    </div>
  );
}
