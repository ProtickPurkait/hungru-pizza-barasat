import { ArrowRight } from "lucide-react";
import type { ResolvedLink } from "@/lib/content/links";
import { CtaLink } from "../cta-link";
import { Headline } from "../headline";
import { Slice } from "../ingredients";
import { Reveal } from "../reveal";

export function FinalCtaSection({
  heading,
  subtext,
  label,
  link,
}: {
  heading: string;
  subtext: string;
  label: string;
  link: ResolvedLink;
}) {
  return (
    <section aria-labelledby="final-cta-heading" className="grain relative overflow-hidden bg-primary py-20 text-cream sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Slice
          className="float-loop absolute top-8 left-[6%] w-16 sm:w-24"
          style={{ ["--r" as string]: "-18deg", ["--float-dur" as string]: "7s" }}
        />
        <Slice
          className="float-loop absolute right-[8%] bottom-10 w-20 sm:w-32"
          style={{ ["--r" as string]: "160deg", ["--float-dur" as string]: "8s", ["--float-delay" as string]: "-3s" }}
        />
        <Slice
          className="float-loop absolute bottom-10 left-[22%] hidden w-14 lg:block"
          style={{ ["--r" as string]: "40deg", ["--float-dur" as string]: "6s", ["--float-delay" as string]: "-1s" }}
        />
      </div>
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-6">
        <Reveal
          as="h2"
          id="final-cta-heading"
          className="font-display text-[clamp(3rem,13vw,9rem)] leading-[0.84] tracking-[-0.035em] uppercase text-balance"
        >
          <Headline text={heading} accentClassName="text-accent" />
        </Reveal>
        {subtext && (
          <Reveal as="p" index={1} className="mt-5 max-w-xl text-lg text-cream/85 sm:text-xl">
            {subtext}
          </Reveal>
        )}
        <Reveal index={2} className="mt-9">
          <CtaLink
            link={link}
            className="group inline-flex h-16 items-center gap-3 rounded-full bg-ink px-10 text-lg font-extrabold tracking-wide text-cream uppercase shadow-[6px_6px_0_0_var(--brand-accent)] ring-2 ring-ink transition-transform hover:-translate-y-1 sm:h-20 sm:px-14 sm:text-xl"
          >
            {label}
            <ArrowRight className="size-6 transition-transform group-hover:translate-x-1.5" aria-hidden />
          </CtaLink>
        </Reveal>
      </div>
    </section>
  );
}
