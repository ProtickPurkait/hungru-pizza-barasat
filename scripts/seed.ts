/**
 * Idempotent seed: fills an empty database with the structure the site needs.
 *   npm run db:seed            → categories, clearly-marked sample reviews/features, first published version
 *   npm run db:seed -- --demo  → also loads the SAMPLE demo menu (development/testing only)
 *
 * It never overwrites content an admin has already created.
 */
import { count, eq } from "drizzle-orm";
import * as t from "../src/db/schema";
import { demoMenu } from "../src/db/seed-data/demo-menu";
import { realMenu } from "../src/db/seed-data/menu";
import type { MenuSeed } from "../src/db/seed-data/types";
import { publishContent } from "../src/lib/content/publish";
import { slugify } from "../src/lib/slug";
import { connect } from "./db";

const DEFAULT_CATEGORIES = ["Pizzas", "Combos", "Sides", "Beverages", "Deals"];

async function main() {
  const demo = process.argv.includes("--demo");
  const { db, pool } = connect();

  const [{ n: categoryCount }] = await db.select({ n: count() }).from(t.categories);
  const [{ n: productCount }] = await db.select({ n: count() }).from(t.products);

  const menu: MenuSeed | null = productCount === 0 ? (realMenu ?? (demo ? demoMenu : null)) : null;
  const isSampleMenu = menu === demoMenu;

  if (categoryCount === 0) {
    const names = menu ? menu.categories.map((c) => c.name) : DEFAULT_CATEGORIES;
    await db.insert(t.categories).values(
      names.map((name, i) => ({
        name,
        slug: slugify(name),
        description: menu?.categories.find((c) => c.name === name)?.description ?? "",
        sortOrder: i,
      })),
    );
    console.log(`✓ Categories: ${names.join(", ")}`);
  }

  if (menu) {
    const categoryRows = await db.select().from(t.categories);
    let bestsellerSort = 0;
    for (const category of menu.categories) {
      const categoryRow = categoryRows.find((c) => c.slug === slugify(category.name));
      if (!categoryRow) continue;
      for (const [i, p] of category.products.entries()) {
        await db.insert(t.products).values({
          categoryId: categoryRow.id,
          name: p.name,
          slug: slugify(p.name),
          description: p.description ?? "",
          price: Math.round(p.price * 100),
          discountPrice: p.discountPrice ? Math.round(p.discountPrice * 100) : null,
          diet: p.diet,
          badge: p.badge ?? "",
          isBestseller: Boolean(p.isBestseller),
          bestsellerSort: p.isBestseller ? bestsellerSort++ : 0,
          options: p.options ?? [],
          isSample: isSampleMenu,
          sortOrder: i,
        });
      }
    }
    console.log(isSampleMenu ? "✓ Loaded SAMPLE demo menu (flagged as sample)" : "✓ Loaded menu from src/db/seed-data/menu.ts");
  } else if (productCount === 0) {
    console.log("• No products yet: add the menu in Admin → Menu (or fill src/db/seed-data/menu.ts).");
  }

  const [{ n: featureCount }] = await db.select({ n: count() }).from(t.features);
  if (featureCount === 0) {
    const sample = (topic: string) =>
      `Sample text: tell customers about your ${topic}. Replace this in Admin → Why Hungru.`;
    await db.insert(t.features).values([
      { title: "Freshness", description: sample("ingredients and freshness"), icon: "leaf", isSample: true, sortOrder: 0 },
      { title: "Flavour", description: sample("signature flavours"), icon: "flame", isSample: true, sortOrder: 1 },
      { title: "Value", description: sample("pricing and portions"), icon: "badge-percent", isSample: true, sortOrder: 2 },
      { title: "Preparation", description: sample("kitchen and how every pizza is made"), icon: "chef-hat", isSample: true, sortOrder: 3 },
    ]);
    console.log("✓ Why Hungru: 4 SAMPLE points (marked as sample until replaced)");
  }

  const [{ n: reviewCount }] = await db.select({ n: count() }).from(t.reviews);
  if (reviewCount === 0) {
    const text =
      "Placeholder review: paste a real customer review here (from Google, Zomato, Instagram or in person). Edit in Admin → Reviews.";
    await db.insert(t.reviews).values(
      [0, 1, 2].map((i) => ({ authorName: `Sample reviewer ${i + 1}`, content: text, source: "Placeholder", isSample: true, sortOrder: i })),
    );
    console.log("✓ Reviews: 3 PLACEHOLDER reviews (marked as sample until replaced)");
  }

  const [{ n: offerCount }] = await db.select({ n: count() }).from(t.offers);
  if (offerCount === 0) {
    await db.insert(t.offers).values({
      title: "Your first offer",
      description: "Sample offer: describe a real deal here, then switch it on. Offers stay hidden until you activate them.",
      badge: "Sample",
      ctaLabel: "Order now",
      ctaTarget: { type: "menu", value: "" },
      isActive: false,
      isSample: true,
    });
    console.log("✓ Offers: 1 inactive SAMPLE offer to edit");
  }

  const [{ n: snapshotCount }] = await db.select({ n: count() }).from(t.publishedSnapshots);
  if (snapshotCount === 0 || menu) {
    await publishContent(db, null, snapshotCount === 0 ? "Initial version" : "Seeded menu");
    console.log("✓ Published the current content");
  }

  const [owner] = await db.select({ n: count() }).from(t.adminUsers).where(eq(t.adminUsers.role, "owner"));
  if (!owner || owner.n === 0) {
    console.log("• No owner account yet: run `npm run admin:create` to create one.");
  }

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
