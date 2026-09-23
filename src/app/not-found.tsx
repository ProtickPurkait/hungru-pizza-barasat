import Link from "next/link";
import { FoodArt } from "@/components/ui/food-art";

export default function NotFound() {
  return (
    <main className="grain relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-ink px-4 text-center text-cream">
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative size-48 sm:size-60">
          <FoodArt name="margherita" className="h-full w-full" aria-hidden />
          <span className="font-display absolute inset-0 flex items-center justify-center text-7xl text-ink [text-shadow:0_2px_0_#fff3df] sm:text-8xl">
            404
          </span>
        </div>
        <h1 className="font-display mt-6 text-5xl leading-none uppercase sm:text-7xl">
          This slice <span className="text-accent">went missing</span>
        </h1>
        <p className="mt-4 max-w-md text-cream/70">The page you&apos;re looking for isn&apos;t here. The pizza is, though.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/menu"
            className="inline-flex h-14 items-center rounded-full bg-primary px-8 font-extrabold tracking-wide uppercase shadow-[4px_4px_0_0_var(--brand-accent)]"
          >
            See the menu
          </Link>
          <Link
            href="/"
            className="inline-flex h-14 items-center rounded-full px-8 font-extrabold tracking-wide uppercase ring-2 ring-cream/40"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
