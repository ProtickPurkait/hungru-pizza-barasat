import { clsx } from "clsx";
import { discountPercent, formatINR } from "@/lib/money";

export function Price({
  price,
  discountPrice,
  className,
  size = "md",
  showPercent = false,
}: {
  price: number;
  discountPrice: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  showPercent?: boolean;
}) {
  const discounted = discountPrice !== null && discountPrice < price;
  const main = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  return (
    <span className={clsx("inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={clsx("font-extrabold tabular-nums", main)}>{formatINR(discounted ? discountPrice! : price)}</span>
      {discounted && (
        <>
          <s className="text-sm font-semibold tabular-nums opacity-75">
            <span className="sr-only">was </span>
            {formatINR(price)}
          </s>
          {showPercent && (
            <span className="rounded-full bg-basil px-1.5 py-0.5 text-[11px] font-extrabold text-white">
              {discountPercent(price, discountPrice!)}% off
            </span>
          )}
        </>
      )}
    </span>
  );
}
