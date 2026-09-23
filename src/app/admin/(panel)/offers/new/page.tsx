import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { getLinkOptions } from "../../../_lib/data";
import { OfferForm } from "../offer-form";

export const metadata: Metadata = { title: "Add offer" };

export default async function NewOfferPage() {
  await requireAdmin();
  const linkOptions = await getLinkOptions();
  return (
    <>
      <PageHeader title="Add offer" back={{ href: "/admin/offers", label: "Offers" }} />
      <OfferForm
        linkOptions={linkOptions}
        imagePreview={null}
        initial={{
          title: "",
          description: "",
          imageId: null,
          badge: "",
          price: "",
          originalPrice: "",
          ctaLabel: "Order now",
          ctaTarget: { type: "menu", value: "" },
          startsAt: "",
          endsAt: "",
          isActive: true,
        }}
      />
    </>
  );
}
