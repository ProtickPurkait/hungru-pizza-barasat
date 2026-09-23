import type { ProductOptionGroup } from "@/lib/content/schemas";

export type MenuSeedProduct = {
  name: string;
  description?: string;
  /** Price in rupees. */
  price: number;
  discountPrice?: number;
  diet: "veg" | "non_veg";
  isBestseller?: boolean;
  badge?: string;
  options?: ProductOptionGroup[];
};

export type MenuSeed = {
  categories: { name: string; description?: string; products: MenuSeedProduct[] }[];
};
