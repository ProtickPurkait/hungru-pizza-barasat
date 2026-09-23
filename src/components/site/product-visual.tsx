import { clsx } from "clsx";
import Image from "next/image";
import { FoodArt } from "@/components/ui/food-art";
import type { SiteProduct } from "@/lib/content/types";

/** Product photo if uploaded, otherwise the illustrated FoodArt. */
export function ProductVisual({
  product,
  categoryName,
  sizes,
  className,
  imageClassName,
  priority,
}: {
  product: Pick<SiteProduct, "name" | "image">;
  categoryName?: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <div className={clsx("overflow-hidden", !/\b(absolute|fixed)\b/.test(className ?? "") && "relative", className)}>
      {product.image ? (
        <Image
          src={product.image.src}
          alt={product.image.alt || product.name}
          fill
          sizes={sizes}
          priority={priority}
          placeholder={product.image.blurDataUrl ? "blur" : "empty"}
          blurDataURL={product.image.blurDataUrl ?? undefined}
          className={clsx("object-cover", imageClassName)}
        />
      ) : (
        <FoodArt name={product.name} category={categoryName} className={clsx("absolute inset-0 h-full w-full p-[8%]", imageClassName)} />
      )}
    </div>
  );
}
