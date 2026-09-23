import { clsx } from "clsx";
import { Headline } from "./headline";
import { Reveal } from "./reveal";

export function SectionHeading({
  id,
  eyebrow,
  heading,
  subtext,
  tone = "light",
  align = "left",
  className,
  action,
}: {
  id: string;
  eyebrow?: string;
  heading: string;
  subtext?: string;
  tone?: "light" | "dark" | "brand";
  align?: "left" | "center";
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={clsx("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", align === "center" && "items-center text-center sm:flex-col sm:items-center", className)}>
      <div className={clsx("max-w-3xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <Reveal
            as="p"
            className={clsx(
              "inline-flex -rotate-2 items-center rounded-full px-3 py-1 text-xs font-extrabold tracking-[0.18em] uppercase sm:text-sm",
              tone === "dark" ? "bg-accent text-ink" : tone === "brand" ? "bg-ink text-accent" : "bg-ink text-cream",
            )}
          >
            {eyebrow}
          </Reveal>
        )}
        <Reveal as="h2" index={1} id={id} className="font-display mt-4 text-[clamp(2.5rem,9.5vw,5.75rem)] leading-[0.88] tracking-[-0.03em] uppercase text-balance">
          <Headline text={heading} accentClassName={tone === "brand" ? "text-ink" : "text-primary"} />
        </Reveal>
        {subtext && (
          <Reveal as="p" index={2} className={clsx("mt-4 max-w-xl text-base leading-relaxed sm:text-lg", tone === "light" ? "text-ink/70" : "text-current opacity-80")}>
            {subtext}
          </Reveal>
        )}
      </div>
      {action && (
        <Reveal index={2} className="shrink-0">
          {action}
        </Reveal>
      )}
    </div>
  );
}
