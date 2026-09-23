import { clsx } from "clsx";
import Image from "next/image";
import type { MediaRef } from "@/lib/content/types";

/** Uploaded logo if there is one, otherwise a typographic wordmark. */
export function BrandLogo({
  name,
  location,
  logo,
  className,
  tone = "light",
  priority,
}: {
  name: string;
  location: string;
  logo: MediaRef | null;
  className?: string;
  tone?: "light" | "dark";
  priority?: boolean;
}) {
  if (logo?.width && logo.height) {
    return (
      <Image
        src={logo.src}
        alt={logo.alt || name}
        width={logo.width}
        height={logo.height}
        priority={priority}
        sizes="160px"
        className={clsx("h-9 w-auto object-contain sm:h-10", className)}
      />
    );
  }
  const [first, ...rest] = name.split(" ");
  return (
    <span className={clsx("flex items-center gap-2 leading-none", className)}>
      <span
        aria-hidden
        className="flex size-9 shrink-0 -rotate-6 items-center justify-center rounded-xl bg-primary text-lg shadow-[2px_2px_0_0_var(--color-ink)] ring-2 ring-ink"
      >
        🍕
      </span>
      <span className="flex flex-col">
        <span className={clsx("font-display text-[1.45rem] tracking-tight uppercase", tone === "light" ? "text-cream" : "text-ink")}>
          {first}
          <span className="text-primary">.</span>
        </span>
        <span className={clsx("mt-0.5 text-[0.62rem] font-bold tracking-[0.22em] uppercase", tone === "light" ? "text-cream/60" : "text-ink/60")}>
          {[rest.join(" "), location].filter(Boolean).join(" · ")}
        </span>
      </span>
    </span>
  );
}
