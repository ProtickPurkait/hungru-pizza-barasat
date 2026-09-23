import { Slice } from "../ingredients";

function Band({ words, reverse, className }: { words: string[]; reverse?: boolean; className: string }) {
  return (
    <div className={className} aria-hidden>
      <div
        className="motion-loop flex w-max animate-marquee items-center gap-6 py-3 sm:gap-10 sm:py-4"
        style={{ animationDirection: reverse ? "reverse" : "normal", ["--marquee-duration" as string]: `${Math.max(18, words.length * 2.2)}s` }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-6 sm:gap-10">
            {words.map((word, i) => (
              <span key={`${copy}-${i}`} className="flex items-center gap-6 sm:gap-10">
                <span className="font-display text-4xl whitespace-nowrap uppercase sm:text-6xl">{word}</span>
                <Slice className="size-9 shrink-0 sm:size-12" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Two crossing "tape" bands of big words scrolling in opposite directions. */
export function MarqueeSection({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  const words = [...items, ...items, ...items];
  return (
    <section className="relative overflow-hidden bg-cream pt-8 pb-16 sm:pt-12 sm:pb-24">
      <p className="sr-only">{items.join(" · ")}</p>
      <Band words={words} reverse className="absolute inset-x-0 top-[46%] -mx-6 rotate-[3.5deg] bg-accent text-ink ring-2 ring-ink sm:top-[44%]" />
      <Band words={words} className="relative z-10 -mx-6 -rotate-2 bg-primary text-cream ring-2 ring-ink shadow-[0_10px_0_0_rgb(20_17_16/0.12)]" />
    </section>
  );
}
