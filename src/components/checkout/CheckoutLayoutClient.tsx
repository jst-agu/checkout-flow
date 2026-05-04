"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/cn";
import { PRODUCTS } from "@/lib/catalog";
import { computeSubtotalCents } from "@/lib/pricing";
import { validateShipping } from "@/lib/validation";
import { useCheckoutStore } from "@/store/checkoutStore";
import { OrderSummary } from "@/components/checkout/OrderSummary";

type StepKey = "cart" | "shipping" | "payment" | "confirmation";

const steps: Array<{ key: StepKey; label: string; href: string }> = [
  { key: "cart", label: "Cart", href: "/checkout/cart" },
  { key: "shipping", label: "Shipping", href: "/checkout/shipping" },
  { key: "payment", label: "Payment", href: "/checkout/payment" },
  { key: "confirmation", label: "Confirmation", href: "/checkout/confirmation" },
];

function currentStepFromPath(pathname: string): StepKey {
  if (pathname.startsWith("/checkout/shipping")) return "shipping";
  if (pathname.startsWith("/checkout/payment")) return "payment";
  if (pathname.startsWith("/checkout/confirmation")) return "confirmation";
  return "cart";
}

export function CheckoutLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const cartItems = useCheckoutStore((s) => s.cartItems);
  const shippingInfo = useCheckoutStore((s) => s.shippingInfo);
  const lastOrder = useCheckoutStore((s) => s.lastOrder);
  const hasHydrated = useCheckoutStore((s) => s.hasHydrated);

  const subtotalCents = computeSubtotalCents(cartItems, PRODUCTS);
  const shippingValidation = validateShipping(shippingInfo);
  const current = currentStepFromPath(pathname);

  const canAccessShipping = cartItems.length > 0;
  const canAccessPayment = canAccessShipping && shippingValidation.isValid;
  const canAccessConfirmation = hasHydrated && Boolean(lastOrder);

  const showSummary = current === "shipping" || current === "payment";

  const isAllowed = (key: StepKey) => {
    if (key === "cart") return true;
    if (key === "shipping") return canAccessShipping;
    if (key === "payment") return canAccessPayment;
    if (key === "confirmation") return canAccessConfirmation;
    return false;
  };

  return (
    <div className="flex-1">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-gradient-to-b from-white/80 to-white/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25">
              M
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">Minimal Store</div>
              <div className="text-xs text-slate-500">Secure checkout</div>
            </div>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/checkout/cart"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Cart
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                {cartItems.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </Link>
            <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:flex">
              <span className="size-2 rounded-full bg-emerald-500" />
              {subtotalCents > 0 ? "Stripe-ready" : "Ready"}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav className="mb-6">
          <ol className="grid grid-cols-4 gap-2">
            {steps.map((step, index) => {
              const active = step.key === current;
              const allowed = isAllowed(step.key);
              const completed = index < steps.findIndex((s) => s.key === current);
              const base =
                "flex items-center justify-center rounded-xl border px-3 py-2 text-sm transition";
              const stateClass = active
                ? "border-slate-200 bg-white text-slate-900 shadow-sm shadow-slate-900/5"
                : completed
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-white/60 text-slate-600";

              const content = (
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-xs font-semibold",
                      active
                        ? "bg-indigo-600 text-white"
                        : completed
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-700",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.label.slice(0, 1)}</span>
                </span>
              );

              return (
                <li key={step.key}>
                  {allowed ? (
                    <Link className={cn(base, stateClass)} href={step.href}>
                      {content}
                    </Link>
                  ) : (
                    <div className={cn(base, stateClass, "opacity-60")}>{content}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div
          className={cn(
            "grid gap-6",
            showSummary ? "lg:grid-cols-[1fr_380px]" : "lg:grid-cols-1",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.section
              key={pathname}
              className="rounded-2xl"
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.section>
          </AnimatePresence>

          {showSummary ? (
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
              >
                <OrderSummary />
              </motion.div>
            </aside>
          ) : null}
        </div>
      </main>
    </div>
  );
}
