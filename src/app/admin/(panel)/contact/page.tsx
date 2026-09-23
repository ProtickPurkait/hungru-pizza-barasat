import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { loadDocument } from "@/lib/content/compile";
import { ContactEditor } from "./contact-editor";

export const metadata: Metadata = { title: "Contact & hours" };

export default async function ContactPage() {
  await requireAdmin();
  const [contact, social] = await Promise.all([loadDocument(db, "contact"), loadDocument(db, "social")]);
  return (
    <>
      <PageHeader
        title="Contact & hours"
        description="Shown in the Location section, footer and Google search info. Anything left empty is simply hidden. Nothing is made up."
      />
      <ContactEditor contact={contact} social={social} />
    </>
  );
}
