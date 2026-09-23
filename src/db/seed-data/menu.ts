import type { MenuSeed } from "./types";

/**
 * Hungru Pizza's REAL menu goes here (names, descriptions, prices in ₹, veg/non-veg, options).
 * When set, `npm run db:seed` loads it into an empty database. The owner can always edit the
 * menu afterwards in Admin → Menu, so this file is only a starting point.
 *
 * Leave as `null` until real menu data is supplied — never put invented items or prices here.
 */
export const realMenu: MenuSeed | null = null;
