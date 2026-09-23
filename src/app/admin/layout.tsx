import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ConfirmProvider } from "@/components/admin/confirm";

export const metadata: Metadata = {
  title: { template: "%s · Hungru Admin", default: "Hungru Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <ConfirmProvider>
      {children}
      <Toaster position="top-center" richColors closeButton toastOptions={{ duration: 4000 }} />
    </ConfirmProvider>
  );
}
