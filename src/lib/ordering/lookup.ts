import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

const TOKEN = /^[A-Za-z0-9_-]{20,40}$/;

export async function findOrderByToken(token: string) {
  if (!TOKEN.test(token)) return null;
  const [order] = await db.select().from(orders).where(eq(orders.publicToken, token)).limit(1);
  return order ?? null;
}
