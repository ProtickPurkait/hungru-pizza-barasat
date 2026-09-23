"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { OpeningHours } from "@/lib/content/schemas";
import type { SiteContent } from "@/lib/content/types";
import { Headline } from "../headline";
import { HeroPizza } from "../hero-pizza";
import { Basil, Chili, Olive, Pepperoni, TomatoSlice } from "../ingredients";
import { OpenStatus } from "../open-status";

type Props = {
  hero: SiteContent["hero"];
  brandName: string;
  primaryHref: string;
  secondaryHref: string;
  primaryExternal: boolean;
  secondaryExternal: boolean;
  hours: OpeningHours;
};

function CtaLink({
  href,
  external,
  className,
  children,
}: {
  href: string;
  external: boolean;
  className: string;
  children: React.ReactNode;
}) {
  return external ? (
    <a href={href} className={className} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function HeroSection({ hero, brandName, primaryHref, secondaryHref, primaryExternal, secondaryExternal, hours }: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const drift = (amount: number) => (reduce ? 0 : amount);
  const yFast = useTransform(scrollYProgress, [0, 1], [0, drift(-220)]);
  const ySlow = useTransform(scrollYProgress, [0, 1], [0, drift(-90)]);
  const yText = useTransform(scrollYProgress, [0, 1], [0, drift(60)]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0.2]);

  const media = hero.media.type === "image" && hero.image ? "image" : hero.media.type === "video" && hero.video ? "video" : "illustration";
  const firstWord = brandName.split(" ")[0] ?? brandName;
  const headlineWords = hero.headline.replace(/\*/g, "").split(/\s+/).length;

  return (
    <section ref={ref} id="top" aria-labelledby="hero-heading" className="grain relative overflow-hidden bg-ink text-cream">
      {/* Oven glow + giant outlined wordmark */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="glow-loop absolute top-[48%] left-[62%] h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--brand-secondary)_0%,transparent_62%)] opacity-60 md:top-1/2 md:left-[72%]" />
        <div className="absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,var(--brand-primary)_0%,transparent_65%)] opacity-40" />
        <p className="font-display text-stroke absolute right-0 bottom-[-0.12em] left-0 text-center text-[34vw] leading-none text-cream/[0.07] uppercase select-none md:text-[22vw]">
          {firstWord}
        </p>
      </div>

      <div className="relative z-10 mx-auto grid h-[max(36rem,calc(100svh-4rem))] max-w-7xl grid-rows-[auto_minmax(0,1fr)] px-4 pt-5 xs:pt-7 sm:px-6 md:h-auto md:min-h-[calc(100svh-4rem)] md:grid-cols-[1.05fr_1fr] md:grid-rows-1 md:items-center md:gap-6 md:pt-10 md:pb-16 lg:px-8">
        <motion.div style={{ y: yText, opacity: textOpacity }} className="relative z-20 max-w-2xl">
          {hero.badge && (
            <p
              className="enter-pop inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-xs font-extrabold tracking-[0.12em] text-ink uppercase shadow-[3px_3px_0_0_var(--brand-primary)] sm:text-sm"
              style={{ ["--r" as string]: "-4deg", ["--d" as string]: 150 }}
            >
              <span aria-hidden>🔥</span> {hero.badge}
            </p>
          )}
          <h1
            id="hero-heading"
            className="font-display mt-4 text-[clamp(2.9rem,14.5vw,7.4rem)] xs:mt-5 leading-[0.86] tracking-[-0.035em] uppercase text-balance"
          >
            <Headline
              text={hero.headline}
              accentClassName="text-accent [text-shadow:4px_4px_0_var(--brand-primary)]"
              wordClassName="enter-rise mr-[0.18em] last:mr-0"
              wordStyle={(i) => ({ ["--d" as string]: 260 + i * 85 })}
            />
          </h1>
          {hero.subtext && (
            <p
              className="enter-fade-up mt-4 max-w-md text-[15px] leading-relaxed text-cream/80 xs:mt-5 xs:text-base sm:text-lg"
              style={{ ["--d" as string]: 300 + headlineWords * 85 }}
            >
              {hero.subtext}
            </p>
          )}
          <div
            className="enter-fade-up mt-6 flex flex-wrap items-center gap-2 xs:mt-7 xs:gap-3"
            style={{ ["--d" as string]: 380 + headlineWords * 85 }}
          >
            <CtaLink
              href={primaryHref}
              external={primaryExternal}
              className="group inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-extrabold xs:px-6 xs:text-[15px] tracking-wide uppercase shadow-[4px_4px_0_0_var(--brand-accent)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--brand-accent)] active:translate-y-0.5 active:shadow-[2px_2px_0_0_var(--brand-accent)] sm:h-16 sm:px-9 sm:text-lg"
            >
              {hero.primaryCta.label}
              <ArrowRight className="hidden size-5 transition-transform group-hover:translate-x-1 xs:block" aria-hidden />
            </CtaLink>
            <CtaLink
              href={secondaryHref}
              external={secondaryExternal}
              className="inline-flex h-14 items-center gap-2 rounded-full px-5 text-sm font-extrabold tracking-wide uppercase ring-2 ring-cream/40 xs:text-[15px] transition-colors hover:bg-cream hover:text-ink sm:h-16 sm:px-8"
            >
              {hero.secondaryCta.label}
              <ArrowDown className="hidden size-4 xs:block" aria-hidden />
            </CtaLink>
          </div>
          <div className="enter-fade-up mt-5" style={{ ["--d" as string]: 460 + headlineWords * 85 }}>
            <OpenStatus hours={hours} />
          </div>
        </motion.div>

        <div className="relative -mx-4 -mt-4 min-h-0 sm:mx-0 md:mt-0">
          <div
            className="enter-land relative mx-auto aspect-square w-[118%] max-w-[44rem] translate-x-[8%] md:w-full md:translate-x-[4%]"
            style={{ ["--d" as string]: 450 }}
          >
            {media === "illustration" && <HeroPizza scrollTarget={ref} className="h-full w-full" />}
            {media === "image" && hero.image && (
              <div className="relative h-full w-full overflow-hidden rounded-full shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)] ring-8 ring-cream/10">
                <Image
                  src={hero.image.src}
                  alt={hero.image.alt || "Hungru pizza"}
                  fill
                  priority
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  placeholder={hero.image.blurDataUrl ? "blur" : "empty"}
                  blurDataURL={hero.image.blurDataUrl ?? undefined}
                />
              </div>
            )}
            {media === "video" && hero.video && (
              <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)] ring-8 ring-cream/10">
                {reduce && hero.image ? (
                  <Image src={hero.image.src} alt={hero.image.alt || ""} fill sizes="50vw" className="object-cover" />
                ) : (
                  <video
                    src={hero.video.src}
                    poster={hero.image?.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label="Video of Hungru pizza"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            )}
          </div>

          {/* Floating ingredients (decorative) */}
          <motion.div aria-hidden style={{ y: yFast }} className="pointer-events-none absolute inset-0">
            <Basil
              className="float-loop absolute top-[4%] left-[8%] w-12 md:w-16"
              style={{ ["--r" as string]: "-20deg", ["--float-dur" as string]: "6s" }}
            />
            <Chili
              className="float-loop absolute right-[4%] bottom-[12%] w-14 md:w-20"
              style={{ ["--r" as string]: "25deg", ["--float-dur" as string]: "7s", ["--float-delay" as string]: "-2s" }}
            />
          </motion.div>
          <motion.div aria-hidden style={{ y: ySlow }} className="pointer-events-none absolute inset-0">
            <TomatoSlice
              className="float-loop absolute top-[2%] right-[14%] w-11 md:w-14"
              style={{ ["--float-dur" as string]: "8s", ["--float-delay" as string]: "-1s" }}
            />
            <Olive
              className="float-loop absolute bottom-[22%] left-[2%] w-8 md:w-10"
              style={{ ["--r" as string]: "15deg", ["--float-dur" as string]: "5.5s" }}
            />
            <Pepperoni
              className="float-loop absolute top-[42%] right-[-2%] w-10 md:w-12"
              style={{ ["--float-dur" as string]: "6.5s", ["--float-delay" as string]: "-3s" }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
