"use client";

import { clsx } from "clsx";
import { Globe, MessageCircle, Phone, ShoppingBag } from "lucide-react";
import { saveDocument, saveLiveSettings } from "@/app/admin/_actions/content";
import { SaveBar } from "@/components/admin/save-bar";
import { Button, Card, Notice, PriceField, Switch, TextField } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { rupeesToPaise, type Live, type Ordering, type OrderingMode } from "@/lib/content/schemas";
import { paiseToInput } from "@/lib/money";

const MODES: { mode: OrderingMode; title: string; description: string; icon: React.ReactNode }[] = [
  { mode: "native", title: "Website checkout", description: "Customers place the order here. You see it in Admin → Orders.", icon: <ShoppingBag /> },
  { mode: "whatsapp", title: "WhatsApp", description: "The order is saved and sent to your WhatsApp as a ready-made message.", icon: <MessageCircle /> },
  { mode: "external", title: "Other platform", description: "Send customers to Zomato, Swiggy or your own ordering link.", icon: <Globe /> },
  { mode: "phone", title: "Phone call", description: "Customers see their order summary and call you to place it.", icon: <Phone /> },
];

type FormValues = Omit<Ordering, "deliveryFee" | "minOrder"> & { deliveryFee: string; minOrder: string };

export function OrderingEditor({
  ordering,
  live,
  contactPhone,
  contactWhatsapp,
}: {
  ordering: Ordering;
  live: Live;
  contactPhone: string;
  contactWhatsapp: string;
}) {
  const form = useAdminForm<FormValues>(
    { ...ordering, deliveryFee: paiseToInput(ordering.deliveryFee), minOrder: paiseToInput(ordering.minOrder) },
    (v) =>
      saveDocument("ordering", {
        ...v,
        deliveryFee: v.deliveryFee.trim() ? rupeesToPaise(v.deliveryFee) : null,
        minOrder: v.minOrder.trim() ? rupeesToPaise(v.minOrder) : null,
      }),
  );
  const liveForm = useAdminForm(live, (v) => saveLiveSettings(v), { successMessage: "Saved (live now)" });
  const { values, set, error } = form;
  const collectsOrders = values.mode === "native" || values.mode === "whatsapp";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.submit();
      }}
      noValidate
    >
      <div className="flex flex-col gap-6">
        <Card
          title="Pause online orders"
          description="Busy night or closed for the day? This goes live instantly, no publishing needed."
          className={liveForm.values.ordersPaused ? "border-red-300" : undefined}
        >
          <div className="flex flex-col gap-4">
            <Switch
              label={liveForm.values.ordersPaused ? "Orders are paused" : "Taking orders"}
              description={liveForm.values.ordersPaused ? "Customers can browse the menu but can't check out." : "Customers can order normally."}
              checked={!liveForm.values.ordersPaused}
              tone="success"
              onChange={(open) => liveForm.submit({ ...liveForm.values, ordersPaused: !open })}
              disabled={liveForm.saving}
            />
            <TextField
              label="Message while paused"
              value={liveForm.values.pausedMessage}
              onChange={(v) => liveForm.set("pausedMessage", v)}
              maxLength={160}
              error={liveForm.error("pausedMessage")}
            />
            {liveForm.dirty && (
              <div>
                <Button size="sm" onClick={() => liveForm.submit()} loading={liveForm.saving}>
                  Save message
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card title="How customers order">
          <fieldset>
            <legend className="sr-only">Ordering method</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {MODES.map((m) => (
                <label
                  key={m.mode}
                  className={clsx(
                    "flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition-colors [&_svg]:size-5",
                    values.mode === m.mode ? "border-stone-900 bg-stone-50" : "border-stone-200 hover:border-stone-300",
                  )}
                >
                  <input type="radio" name="mode" className="sr-only" checked={values.mode === m.mode} onChange={() => set("mode", m.mode)} />
                  <span className={clsx("mt-0.5 shrink-0", values.mode === m.mode ? "text-primary" : "text-stone-400")} aria-hidden>
                    {m.icon}
                  </span>
                  <span>
                    <span className="block font-semibold">{m.title}</span>
                    <span className="block text-sm text-stone-500">{m.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 flex flex-col gap-5">
            {values.mode === "native" && (
              <Notice tone="info" title="Keep an eye on Admin → Orders">
                New orders appear there (with a sound alert while the page is open). Payment is collected on delivery or pickup. The website doesn&apos;t take card payments.
              </Notice>
            )}
            {values.mode === "whatsapp" && (
              <TextField
                label="WhatsApp number for orders"
                type="tel"
                value={values.whatsappNumber}
                onChange={(v) => set("whatsappNumber", v)}
                error={error("whatsappNumber")}
                placeholder={contactWhatsapp || "+91 98765 43210"}
                help={contactWhatsapp ? `Leave empty to use your contact WhatsApp (${contactWhatsapp}).` : "Required: add it here or in Contact & hours."}
              />
            )}
            {values.mode === "external" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField label="Platform name" value={values.externalPlatformName} onChange={(v) => set("externalPlatformName", v)} error={error("externalPlatformName")} placeholder="e.g. Zomato" maxLength={40} />
                <TextField label="Ordering link" inputMode="url" value={values.externalUrl} onChange={(v) => set("externalUrl", v)} error={error("externalUrl")} placeholder="https://…" required />
              </div>
            )}
            {values.mode === "phone" && (
              <TextField
                label="Phone number for orders"
                type="tel"
                value={values.phoneNumber}
                onChange={(v) => set("phoneNumber", v)}
                error={error("phoneNumber")}
                placeholder={contactPhone || "+91 98765 43210"}
                help={contactPhone ? `Leave empty to use your contact phone (${contactPhone}).` : "Required: add it here or in Contact & hours."}
              />
            )}
          </div>
        </Card>

        {collectsOrders && (
          <Card title="Delivery & pickup">
            <div className="flex flex-col gap-5">
              <Switch label="Delivery" description="Customers can ask for delivery and enter an address." checked={values.delivery} onChange={(v) => set("delivery", v)} />
              <Switch label="Pickup" description="Customers can collect from the restaurant." checked={values.pickup} onChange={(v) => set("pickup", v)} />
              {error("pickup") && <p className="text-sm text-red-600">{error("pickup")}</p>}
              <div className="grid gap-5 sm:grid-cols-2">
                {values.delivery && (
                  <PriceField label="Delivery fee" optional value={values.deliveryFee} onChange={(v) => set("deliveryFee", v)} error={error("deliveryFee")} help="Leave empty if you don't charge one." />
                )}
                <PriceField label="Minimum order" optional value={values.minOrder} onChange={(v) => set("minOrder", v)} error={error("minOrder")} help="Leave empty for no minimum." />
              </div>
              {values.delivery && (
                <TextField label="Delivery info" optional value={values.deliveryNote} onChange={(v) => set("deliveryNote", v)} maxLength={200} placeholder="e.g. We deliver within 3 km of the shop" help="Shown at checkout. Only include what's true." />
              )}
            </div>
          </Card>
        )}

        {collectsOrders && (
          <Card title="Checkout & confirmation">
            <div className="flex flex-col gap-5">
              <TextField label="Payment note" value={values.paymentNote} onChange={(v) => set("paymentNote", v)} maxLength={200} error={error("paymentNote")} help="e.g. which payment methods you accept on delivery/pickup." />
              <TextField
                label="Message after ordering"
                optional
                multiline
                rows={2}
                value={values.confirmationNote}
                onChange={(v) => set("confirmationNote", v)}
                maxLength={300}
                placeholder="e.g. We'll call you to confirm your order."
                help="Shown on the order confirmation page. Don't promise times you can't guarantee."
              />
              <TextField
                label="Order number prefix"
                value={values.orderPrefix}
                onChange={(v) => set("orderPrefix", v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                error={error("orderPrefix")}
                help={`Orders look like ${values.orderPrefix || "HP"}-1042.`}
              />
            </div>
          </Card>
        )}
      </div>
      <SaveBar dirty={form.dirty} saving={form.saving} onSave={() => form.submit()} onDiscard={() => form.reset()} savedAt={form.savedAt} />
    </form>
  );
}
