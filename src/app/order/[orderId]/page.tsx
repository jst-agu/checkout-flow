"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/money";
import { useCheckoutStore } from "@/store/checkoutStore";

type Step = {
  key: string;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  { key: "confirmed", title: "Order confirmed", description: "Payment and details verified" },
  { key: "packed", title: "Packed", description: "Items are being prepared" },
  { key: "shipped", title: "Shipped", description: "Handed over to the carrier" },
  { key: "out", title: "Out for delivery", description: "Almost there" },
  { key: "delivered", title: "Delivered", description: "Delivered to your address" },
];

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "2-digit" }).format(d);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getProgressIndex(createdAt: number, now: number) {
  const elapsed = Math.max(0, now - createdAt);
  const idx = Math.floor(elapsed / 8000);
  return Math.max(0, Math.min(STEPS.length - 1, idx));
}

export default function OrderTrackingPage() {
  const params = useParams<{ orderId: string }>();
  const routeOrderId = params?.orderId ? decodeURIComponent(String(params.orderId)) : "";

  const hasHydrated = useCheckoutStore((s) => s.hasHydrated);
  const lastOrder = useCheckoutStore((s) => s.lastOrder);

  const [now, setNow] = React.useState(() => Number(new Date()));
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Number(new Date())), 500);
    return () => window.clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(id);
  }, [copied]);

  if (!hasHydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="size-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Loading tracking</div>
              <div className="mt-1 text-sm text-slate-600">Fetching your latest order…</div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const order = lastOrder && lastOrder.orderId === routeOrderId ? lastOrder : null;

  if (!order) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Track your order</h1>
              <p className="mt-2 text-sm text-slate-600">
                No order found for this ID in your current browser session.
              </p>
            </div>
            <Link href="/">
              <Button variant="secondary">Back to store</Button>
            </Link>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Order ID: <span className="font-semibold text-slate-900">{routeOrderId || "—"}</span>
          </div>
        </Card>
      </div>
    );
  }

  const progressIndex = getProgressIndex(order.createdAt, now);
  const progressPct = (progressIndex / (STEPS.length - 1)) * 100;
  const etaMinDays = order.deliveryType === "express" ? 1 : 3;
  const etaMaxDays = order.deliveryType === "express" ? 2 : 5;
  const etaMin = addDays(new Date(order.createdAt), etaMinDays);
  const etaMax = addDays(new Date(order.createdAt), etaMaxDays);

  async function copyOrderId(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="overflow-hidden p-0">
            <div className="relative bg-white px-6 py-6">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_320px_at_10%_0%,rgba(99,102,241,0.16),transparent_60%),radial-gradient(700px_320px_at_90%_0%,rgba(236,72,153,0.12),transparent_60%)]" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Track your order
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">
                    Estimated delivery:{" "}
                    <span className="font-semibold text-slate-900">
                      {formatDate(etaMin)} – {formatDate(etaMax)}
                    </span>
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                      {order.deliveryType === "express" ? "Express" : "Normal"} delivery
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                      {order.paymentMethod === "cod" ? "Cash on delivery" : "Digital payment"}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <div className="text-xs text-slate-600">Order ID</div>
                  <div className="mt-1 font-mono text-xs font-semibold text-slate-900">
                    {order.orderId}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => copyOrderId(order.orderId)}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              <div className="relative mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-semibold text-slate-900">{STEPS[progressIndex].title}</div>
                  <div className="text-slate-600">{Math.round(progressPct)}%</div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>

                <div className="mt-5 grid gap-3">
                  {STEPS.map((s, idx) => {
                    const done = idx < progressIndex;
                    const active = idx === progressIndex;
                    return (
                      <div key={s.key} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <motion.div
                            className={
                              done
                                ? "grid size-7 place-items-center rounded-full bg-emerald-600 text-white"
                                : active
                                  ? "grid size-7 place-items-center rounded-full bg-indigo-600 text-white"
                                  : "grid size-7 place-items-center rounded-full border border-slate-300 bg-white text-slate-500"
                            }
                            animate={active ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                            transition={active ? { duration: 1.4, repeat: Infinity } : undefined}
                          >
                            {done ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M20 6L9 17l-5-5"
                                  stroke="currentColor"
                                  strokeWidth="2.4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : (
                              <span className="text-xs font-semibold">{idx + 1}</span>
                            )}
                          </motion.div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                          <div className="mt-0.5 text-xs text-slate-600">{s.description}</div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {idx <= progressIndex ? "✓" : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Order total</div>
                <div className="mt-1 text-xs text-slate-600">Taxes included</div>
              </div>
              <div className="text-xl font-semibold text-slate-900">
                {formatMoney(order.amountCents, order.currency.toUpperCase())}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Delivery address</span>
              </div>
              <div className="mt-2 font-medium text-slate-900">{order.shippingInfo.address}</div>
              <div className="mt-1 text-slate-600">
                {order.shippingInfo.city}, {order.shippingInfo.country}
              </div>
              <div className="mt-2 text-slate-600">{order.shippingInfo.email}</div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <Link href="/checkout/cart">
                <Button variant="secondary" className="w-full">
                  Start a new checkout
                </Button>
              </Link>
              <Link href="/">
                <Button className="w-full">Continue shopping</Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
