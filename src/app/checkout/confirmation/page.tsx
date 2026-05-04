"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { motion } from "framer-motion";

import { getProductById } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { computeUnitPriceCents } from "@/lib/pricing";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useCheckoutStore } from "@/store/checkoutStore";

export default function ConfirmationPage() {
  const lastOrder = useCheckoutStore((s) => s.lastOrder);
  const resetCheckout = useCheckoutStore((s) => s.resetCheckout);
  const hasHydrated = useCheckoutStore((s) => s.hasHydrated);
  const clearCart = useCheckoutStore((s) => s.clearCart);
  const order = lastOrder;

  useEffect(() => {
    if (!hasHydrated) return;
    if (!order) return;
    clearCart();
  }, [clearCart, hasHydrated, order]);

  if (!hasHydrated) {
    return (
      <div className="mx-auto grid max-w-2xl gap-6">
        <Card className="overflow-hidden p-0">
          <div className="grid place-items-center bg-white px-6 py-12 text-center">
            <div className="size-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            <div className="mt-4 text-sm font-medium text-slate-900">
              Loading your confirmation
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Finalizing your order details…
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <Card className="p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Order confirmation
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No recent order found. Start a new checkout to see your confirmation.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/checkout/cart">
            <Button>Go to cart</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">Back to store</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      className="mx-auto grid max-w-2xl gap-6"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="overflow-hidden p-0">
        <div className="relative grid place-items-center bg-white px-6 py-10 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_0%,rgba(16,185,129,0.18),transparent_60%)]" />
          <motion.div
            className="relative grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-700"
            initial={{ scale: 0.85, rotate: -6 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
            Order confirmed!
          </h1>
          <p className="mt-2 max-w-md text-sm text-slate-600">
            {order.paymentMethod === "cod"
              ? "Your order has been placed successfully. You’ll pay on delivery."
              : "Your payment was successful and your order is on the way."}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
              Order ID: {order.orderId}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
              {new Date(order.createdAt).toLocaleString()}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
              {order.deliveryType === "express" ? "Express delivery" : "Normal delivery"}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-5">
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>Products</span>
              <span className="font-medium text-slate-900">
                {formatMoney(order.subtotalCents)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Discount</span>
              <span className="font-medium text-slate-900">
                {order.discountCents > 0 ? `-${formatMoney(order.discountCents)}` : formatMoney(0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Delivery</span>
              <span className="font-medium text-slate-900">
                {formatMoney(order.shippingCents)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-slate-900">Total amount</span>
              <span className="text-lg font-semibold text-slate-900">
                {formatMoney(order.amountCents, order.currency.toUpperCase())}
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/order/${encodeURIComponent(order.orderId)}`}>
              <Button>Track my order</Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">Continue shopping</Button>
            </Link>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Items</h2>
        <div className="mt-5 grid gap-3">
          {order.cartItems.map((item) => {
            const product = getProductById(item.productId);
            if (!product) return null;
            const unitPriceCents = computeUnitPriceCents(product, item.options);
            return (
              <div key={item.id} className="flex items-center gap-4">
                <div className="relative size-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <Image src={product.imageDataUri} alt={product.name} fill sizes="56px" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">
                    {product.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatMoney(unitPriceCents)} · Qty {item.quantity}
                  </div>
                  {item.options && Object.keys(item.options).length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(item.options)
                        .filter(([, v]) => v !== undefined && v !== false && v !== "")
                        .map(([k, v]) => (
                          <span
                            key={k}
                            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600"
                          >
                            {k}: {String(v)}
                          </span>
                        ))}
                    </div>
                  ) : null}
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {formatMoney(unitPriceCents * item.quantity)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-700">Shipping to</div>
          <div className="mt-1 text-sm text-slate-900">{order.shippingInfo.address}</div>
          <div className="mt-1 text-sm text-slate-600">
            {order.shippingInfo.city}, {order.shippingInfo.country}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {order.shippingInfo.email} · {order.shippingInfo.phone}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              resetCheckout();
            }}
          >
            Start new checkout
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
