import type { Metadata } from "next";
import { CartView } from "@/components/site/cart-view";
import { TrackView } from "@/components/site/track-view";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <TrackView event="cart_view" />
      <CartView />
    </>
  );
}
