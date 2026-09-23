"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import type { SiteContent } from "@/lib/content/types";
import { FoodArt } from "@/components/ui/food-art";
import { Headline } from "../headline";
import { Reveal } from "../reveal";

const FRAME_STYLES = [
  "rotate-[-5deg] md:translate-x-0",
  "rotate-[4deg] -mt-10 ml-auto md:-mt-24",
  "rotate-[-2deg] -mt-8 md:-mt-16",
  "rotate-[6deg] -mt-10 ml-auto md:-mt-20",
];

export function BrandStorySection({ story, brandName }: { story: SiteContent["story"]; brandName: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yA = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 60, reduce ? 0 : -60]);
  const yB = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 120, reduce ? 0 : -120]);
  const rotate = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : -25, reduce ? 0 : 25]);
  const paragraphs = story.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section ref={ref} id="story" aria-labelledby="story-heading" className="relative overflow-hidden bg-cream py-16 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 md:grid-cols-[1.1fr_1fr] md:items-center lg:gap-20 lg:px-8">
        <div className="relative order-2 md:order-1">
          {story.eyebrow && (
            <Reveal
              as="p"
              className="inline-flex -rotate-2 rounded-full bg-primary px-3 py-1 text-xs font-extrabold tracking-[0.18em] text-white uppercase sm:text-sm"
            >
              {story.eyebrow}
            </Reveal>
          )}
          <Reveal
            as="h2"
            index={1}
            id="story-heading"
            className="font-display mt-4 text-[clamp(2.75rem,10vw,6.5rem)] leading-[0.86] tracking-[-0.03em] uppercase text-balance"
          >
            <Headline text={story.heading} accentClassName="text-primary" />
          </Reveal>
          <div className="mt-6 flex max-w-xl flex-col gap-4 text-lg leading-relaxed text-ink/80">
            {paragraphs.map((p, i) => (
              <Reveal
                as="p"
                key={i}
                index={i + 2}
                className={
                  i === 0
                    ? "text-xl font-semibold text-ink first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-7xl first-letter:leading-[0.8] first-letter:text-primary"
                    : undefined
                }
              >
                {p}
              </Reveal>
            ))}
          </div>
          {story.highlights.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-3">
              {story.highlights.map((h, i) => (
                <Reveal
                  as="li"
                  key={i}
                  index={i}
                  className={`rounded-2xl bg-ink px-4 py-3 text-cream ring-2 ring-ink shadow-[3px_3px_0_0_var(--brand-accent)] ${i % 2 ? "rotate-2" : "-rotate-2"}`}
                >
                  <p className="font-display text-2xl leading-none text-accent uppercase">{h.title}</p>
                  {h.text && <p className="mt-1 max-w-[16rem] text-sm text-cream/75">{h.text}</p>}
                </Reveal>
              ))}
            </ul>
          )}
        </div>

        <div className="relative order-1 md:order-2">
          {story.images.length > 0 ? (
            <div className="relative mx-auto max-w-md">
              {story.images.map((image, i) => (
                <motion.figure
                  key={image.id}
                  style={{ y: i % 2 ? yB : yA }}
                  className={`relative w-[72%] rounded-[1.25rem] bg-white p-2.5 pb-8 shadow-[0_24px_50px_-20px_rgb(20_17_16/0.5)] ring-2 ring-ink ${FRAME_STYLES[i % 4]}`}
                >
                  <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-4deg] bg-accent/80" />
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream-2">
                    <Image
                      src={image.src}
                      alt={image.alt || `${brandName}`}
                      fill
                      sizes="(min-width: 768px) 30vw, 70vw"
                      className="object-cover"
                      placeholder={image.blurDataUrl ? "blur" : "empty"}
                      blurDataURL={image.blurDataUrl ?? undefined}
                    />
                  </div>
                </motion.figure>
              ))}
            </div>
          ) : (
            <div className="relative mx-auto aspect-square w-full max-w-md">
              <div aria-hidden className="absolute inset-4 rounded-full bg-accent ring-2 ring-ink" />
              <motion.div style={{ rotate }} className="absolute inset-0">
                <FoodArt name="margherita basil tomato" className="h-full w-full drop-shadow-2xl" aria-hidden />
              </motion.div>
              <span className="font-display absolute -bottom-2 left-1/2 -translate-x-1/2 -rotate-6 rounded-full bg-ink px-5 py-2 text-2xl whitespace-nowrap text-cream uppercase shadow-[3px_3px_0_0_var(--brand-primary)]">
                {brandName}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
