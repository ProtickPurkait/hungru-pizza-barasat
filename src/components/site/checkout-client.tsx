"use client";

import { clsx } from "clsx";
import { ArrowRight, Bike, ChevronDown, ExternalLink, Loader2, MessageCircle, Phone, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { submitOrder } from "@/app/(site)/checkout/actions";
import { track } from "@/lib/analytics";
import { useCart } from "@/lib/cart/store";
import { formatINR } from "@/lib/money";
import { useCartView, useSite, type CartViewLine } from "./site-provider";

const SAVED_DETAILS_KEY = "hungru-checkout-details";

type Details = { name: string; phone: string; address: string };

function loadDetails(): Details | null {
  try {
    const raw = localStorage.getItem(SAVED_DETAILS_KEY);
    return raw ? (JSON.parse(raw) as Details) : null;
  } catch {
    return null;
  }
}

function saveDetails(details: Details) {
  try {
    localStorage.setItem(SAVED_DETAILS_KEY, JSON.stringify(details));
  } catch {
    /* storage unavailable */
  }
}

export function CheckoutClient() {
  const { ordering } = useSite();
  const { validLines, hydrated } = useCartView();

  if (!hydrated) {
    return <div className="mx-auto h-96 max-w-3xl animate-pulse px-4 py-10" aria-busy="true" />;
  }
  if (validLines.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <h1 className="font-display text-5xl uppercase">Nothing to order yet</h1>
        <p className="mt-3 text-ink/65">Add something delicious to your cart first.</p>
        <Link
          href="/menu"
          className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-8 font-extrabold text-white uppercase ring-2 ring-ink"
        >
          Go to menu <ArrowRight className="size-5" aria-hidden />
        </Link>
      </div>
    );
  }
  if (ordering.mode === "external" || ordering.mode === "phone") return <Handoff />;
  return <CheckoutForm />;
}

function OrderSummary({ lines, collapsible }: { lines: CartViewLine[]; collapsible?: boolean }) {
  const content = (
    <ul className="flex flex-col gap-2.5">
      {lines.map((line) => (
        <li key={line.key} className="flex justify-between gap-3">
          <span className="min-w-0">
            <span className="font-bold">
              {line.quantity} × {line.product!.name}
            </span>
            {line.priced!.options.length > 0 && (
              <span className="block text-sm text-ink/60">{line.priced!.options.map((o) => o.optionName).join(" · ")}</span>
            )}
          </span>
          <span className="shrink-0 font-bold tabular-nums">{formatINR(line.priced!.lineTotal)}</span>
        </li>
      ))}
    </ul>
  );
  if (!collapsible) return content;
  return (
    <details className="group rounded-3xl bg-white p-4 ring-1 ring-ink/10 lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between font-extrabold">
        <span>Order summary · {lines.reduce((n, l) => n + l.quantity, 0)} items</span>
        <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-4">{content}</div>
    </details>
  );
}

function Field({
  label,
  error,
  children,
  hint,
  id,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
  id: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-extrabold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-bold text-primary">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-ink/65">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

const inputClass = (error?: string) =>
  clsx(
    "w-full rounded-2xl border-2 bg-white px-4 text-base font-semibold text-ink placeholder:font-normal placeholder:text-ink/40 focus:outline-none focus-visible:border-ink focus-visible:ring-4 focus-visible:ring-accent/60",
    error ? "border-primary" : "border-ink/15",
  );

function CheckoutForm() {
  const router = useRouter();
  const uid = useId();
  const { ordering, live, mode: siteMode } = useSite();
  const clear = useCart((s) => s.clear);
  const rawLines = useCart((s) => s.lines);
  const defaultFulfillment = ordering.delivery ? "delivery" : "pickup";
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">(defaultFulfillment);
  const { validLines, totals, hasProblems, belowMinimum } = useCartView(fulfillment);
  // CheckoutForm only renders in the browser (after the cart hydrates), so localStorage is safe here.
  const [details, setDetails] = useState<Details>(() => loadDetails() ?? { name: "", phone: "", address: "" });
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const whatsapp = ordering.mode === "whatsapp";
  const blocked = live.ordersPaused || hasProblems || belowMinimum;

  const submit = () => {
    setFormError(null);
    track("order_initiated", { value: totals.total / 100, currency: "INR", method: ordering.mode, fulfillment });
    start(async () => {
      const result = await submitOrder({
        fulfillment,
        name: details.name,
        phone: details.phone,
        address: details.address,
        notes,
        website: honeypot,
        lines: rawLines
          .filter((l) => validLines.some((v) => v.key === l.key))
          .map((l) => ({ productId: l.productId, selection: l.selection, quantity: l.quantity })),
      });
      if (result.ok) {
        saveDetails(details);
        clear();
        router.push(`/order/${result.token}`);
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.message);
        requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true'], [data-form-error]")?.focus());
      }
    });
  };

  const ids = { name: `${uid}-name`, phone: `${uid}-phone`, address: `${uid}-address`, notes: `${uid}-notes` };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-40 sm:px-6 lg:grid lg:grid-cols-[1fr_24rem] lg:gap-10 lg:px-8 lg:pb-16">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!blocked && !pending) submit();
        }}
        noValidate
        className="flex flex-col gap-6"
      >
        <div>
          <Link href="/cart" className="text-sm font-extrabold tracking-wide text-ink/65 uppercase hover:text-ink">
            ← Back to cart
          </Link>
          <h1 className="font-display mt-2 text-[clamp(3rem,12vw,5.5rem)] leading-[0.85] uppercase">Checkout</h1>
          {whatsapp && <p className="mt-3 text-ink/70">Fill this in and we&apos;ll open WhatsApp with your order ready to send.</p>}
        </div>

        <OrderSummary lines={validLines} collapsible />

        {ordering.delivery && ordering.pickup ? (
          <fieldset>
            <legend className="font-extrabold">How do you want it?</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(
                [
                  ["delivery", "Delivery", <Bike key="b" className="size-6" aria-hidden />],
                  ["pickup", "Pickup", <Store key="s" className="size-6" aria-hidden />],
                ] as const
              ).map(([value, label, icon]) => (
                <label
                  key={value}
                  className={clsx(
                    "flex h-16 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 text-lg font-extrabold transition-all has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent",
                    fulfillment === value
                      ? "border-ink bg-ink text-cream shadow-[3px_3px_0_0_var(--brand-primary)]"
                      : "border-ink/15 bg-white hover:border-ink/40",
                  )}
                >
                  <input
                    type="radio"
                    name="fulfillment"
                    value={value}
                    checked={fulfillment === value}
                    onChange={() => setFulfillment(value)}
                    className="sr-only"
                  />
                  {icon}
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-bold ring-1 ring-ink/10">
            {ordering.delivery ? <Bike className="size-5" aria-hidden /> : <Store className="size-5" aria-hidden />}
            {ordering.delivery ? "Delivery only" : "Pickup only: collect from the restaurant"}
          </p>
        )}

        <div className="flex flex-col gap-4 rounded-[1.75rem] bg-white p-5 ring-1 ring-ink/10 sm:p-6">
          <Field label="Your name" id={ids.name} error={errors.name}>
            <input
              id={ids.name}
              autoComplete="name"
              value={details.name}
              onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
              aria-invalid={Boolean(errors.name) || undefined}
              aria-describedby={errors.name ? `${ids.name}-error` : undefined}
              className={clsx(inputClass(errors.name), "h-14")}
              maxLength={60}
              required
            />
          </Field>
          <Field label="Mobile number" id={ids.phone} error={errors.phone} hint="So the restaurant can reach you about your order.">
            <input
              id={ids.phone}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={details.phone}
              onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
              aria-invalid={Boolean(errors.phone) || undefined}
              aria-describedby={errors.phone ? `${ids.phone}-error` : `${ids.phone}-hint`}
              className={clsx(inputClass(errors.phone), "h-14")}
              maxLength={20}
              required
            />
          </Field>
          {fulfillment === "delivery" && (
            <Field
              label="Delivery address"
              id={ids.address}
              error={errors.address}
              hint={ordering.deliveryNote || "House no., street, landmark and area."}
            >
              <textarea
                id={ids.address}
                autoComplete="street-address"
                rows={3}
                value={details.address}
                onChange={(e) => setDetails((d) => ({ ...d, address: e.target.value }))}
                aria-invalid={Boolean(errors.address) || undefined}
                aria-describedby={errors.address ? `${ids.address}-error` : `${ids.address}-hint`}
                className={clsx(inputClass(errors.address), "py-3")}
                maxLength={300}
                required
              />
            </Field>
          )}
          <Field label="Notes (optional)" id={ids.notes} error={errors.notes}>
            <textarea
              id={ids.notes}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything we should know? e.g. extra spicy, ring the bell"
              className={clsx(inputClass(errors.notes), "py-3")}
              maxLength={300}
            />
          </Field>
          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name="website" />
            </label>
          </div>
        </div>

        {ordering.paymentNote && (
          <p className="rounded-2xl bg-accent/30 px-4 py-3 font-semibold ring-1 ring-accent">
            <span aria-hidden>💳 </span>
            {ordering.paymentNote}
          </p>
        )}

        {formError && (
          <p
            data-form-error
            tabIndex={-1}
            role="alert"
            className="rounded-2xl bg-primary/10 px-4 py-3 font-bold text-primary ring-2 ring-primary focus:outline-none"
          >
            {formError}
          </p>
        )}
        {live.ordersPaused && <p className="rounded-2xl bg-accent/40 px-4 py-3 font-bold">{live.pausedMessage}</p>}
        {siteMode === "preview" && <p className="text-sm font-semibold text-ink/60">Preview mode: placing orders is disabled.</p>}

        <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink/10 bg-cream/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <button
            type="submit"
            disabled={blocked || pending}
            className={clsx(
              "flex h-16 w-full items-center justify-between gap-3 rounded-full px-6 text-lg font-extrabold tracking-wide uppercase ring-2 ring-ink transition-transform",
              blocked
                ? "cursor-not-allowed bg-ink/20 text-ink/65 ring-ink/20"
                : whatsapp
                  ? "bg-basil text-white shadow-[4px_4px_0_0_var(--color-ink)] active:translate-y-0.5"
                  : "bg-primary text-white shadow-[4px_4px_0_0_var(--color-ink)] active:translate-y-0.5",
            )}
          >
            <span className="flex items-center gap-2">
              {pending ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : whatsapp ? (
                <MessageCircle className="size-5" aria-hidden />
              ) : null}
              {pending ? "Placing order…" : whatsapp ? "Continue to WhatsApp" : "Place order"}
            </span>
            <span className="tabular-nums">{formatINR(totals.total)}</span>
          </button>
        </div>
      </form>

      <aside aria-label="Order summary" className="hidden lg:block">
        <div className="sticky top-24 mt-24 rounded-[1.75rem] bg-white p-5 ring-2 ring-ink shadow-[5px_5px_0_0_var(--color-ink)]">
          <h2 className="font-display mb-4 text-3xl uppercase">Your order</h2>
          <OrderSummary lines={validLines} />
          <Totals totals={totals} />
        </div>
      </aside>
      <div className="mt-6 lg:hidden">
        <Totals totals={totals} />
      </div>
    </div>
  );
}

function Totals({ totals }: { totals: ReturnType<typeof useCartView>["totals"] }) {
  return (
    <dl className="mt-4 flex flex-col gap-1.5 border-t-2 border-dashed border-ink/15 pt-4">
      <div className="flex justify-between">
        <dt className="text-ink/70">Subtotal</dt>
        <dd className="font-bold tabular-nums">{formatINR(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between text-basil">
          <dt className="font-semibold">Discount</dt>
          <dd className="font-bold tabular-nums">−{formatINR(totals.discount)}</dd>
        </div>
      )}
      {totals.deliveryFee > 0 && (
        <div className="flex justify-between">
          <dt className="text-ink/70">Delivery fee</dt>
          <dd className="font-bold tabular-nums">{formatINR(totals.deliveryFee)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between pt-1">
        <dt className="text-lg font-extrabold">Total</dt>
        <dd className="font-display text-3xl tabular-nums">{formatINR(totals.total)}</dd>
      </div>
    </dl>
  );
}

/** External platform / phone ordering: make the handoff obvious and give customers their list. */
function Handoff() {
  const { ordering, contact } = useSite();
  const { validLines, totals } = useCartView();
  const external = ordering.mode === "external";
  const platform = ordering.externalPlatformName || "our ordering partner";
  const phone = ordering.phoneNumber || contact.phone;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8 pb-16 sm:px-6">
      <Link href="/cart" className="text-sm font-extrabold tracking-wide text-ink/65 uppercase hover:text-ink">
        ← Back to cart
      </Link>
      <h1 className="font-display mt-2 text-[clamp(2.8rem,11vw,5rem)] leading-[0.88] uppercase">
        {external ? `Order on ${platform}` : "Call to order"}
      </h1>
      <p className="mt-3 text-lg text-ink/70">
        {external
          ? `We take orders through ${platform}. Your cart doesn't carry over automatically, so here's your list to add the same items there.`
          : "Give us a call and read out your list. We'll take it from there."}
      </p>
      <div className="mt-6 rounded-[1.75rem] bg-white p-5 ring-2 ring-ink shadow-[5px_5px_0_0_var(--color-ink)]">
        <h2 className="font-display mb-4 text-2xl uppercase">Your list</h2>
        <OrderSummary lines={validLines} />
        <Totals totals={totals} />
        <p className="mt-3 text-xs text-ink/65">Prices on {external ? platform : "the phone"} may differ from this website.</p>
      </div>
      <div className="mt-6">
        {external ? (
          <a
            href={ordering.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("order_initiated", { value: totals.total / 100, currency: "INR", method: "external" })}
            className="flex h-16 items-center justify-center gap-3 rounded-full bg-primary px-6 text-lg font-extrabold tracking-wide text-white uppercase shadow-[4px_4px_0_0_var(--color-ink)] ring-2 ring-ink"
          >
            Continue to {platform} <ExternalLink className="size-5" aria-hidden />
          </a>
        ) : phone ? (
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            onClick={() => track("order_initiated", { value: totals.total / 100, currency: "INR", method: "phone" })}
            className="flex h-16 items-center justify-center gap-3 rounded-full bg-primary px-6 text-lg font-extrabold tracking-wide text-white uppercase shadow-[4px_4px_0_0_var(--color-ink)] ring-2 ring-ink"
          >
            <Phone className="size-5" aria-hidden /> Call {phone}
          </a>
        ) : (
          <p className="rounded-2xl bg-accent/40 px-4 py-3 font-bold">Phone ordering isn&apos;t set up yet. Please check back soon.</p>
        )}
      </div>
    </div>
  );
}
