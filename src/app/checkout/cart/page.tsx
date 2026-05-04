"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PRODUCTS, getProductById } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import {
  computeUnitPriceCents,
  computeDiscountCents,
  computeShippingCents,
  computeSubtotalCents,
  computeTotalCents,
} from "@/lib/pricing";
import { useCheckoutStore } from "@/store/checkoutStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function CheckoutCartPage() {
  const router = useRouter();
  const cartItems = useCheckoutStore((s) => s.cartItems);
  const setQuantity = useCheckoutStore((s) => s.setQuantity);
  const removeItem = useCheckoutStore((s) => s.removeItem);
  const addItem = useCheckoutStore((s) => s.addItem);
  const promoCode = useCheckoutStore((s) => s.promoCode);
  const deliveryType = useCheckoutStore((s) => s.deliveryType);

  const subtotalCents = computeSubtotalCents(cartItems, PRODUCTS);
  const shippingCents = computeShippingCents(subtotalCents, deliveryType);
  const discountCents = computeDiscountCents(subtotalCents, promoCode);
  const totalCents = computeTotalCents({
    subtotalCents,
    shippingCents,
    discountCents,
    promoCode,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Review your cart
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Adjust quantities, apply a promo code, then continue to shipping.
            </p>
          </div>
          <Link href="/" className="text-sm font-medium text-slate-700">
            Continue shopping →
          </Link>
        </div>

        <div className="mt-6 grid gap-4">
          {cartItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-600">
              Your cart is empty. Add a few items to get started.
            </div>
          ) : (
            cartItems.map((item) => {
              const product = getProductById(item.productId);
              if (!product) return null;
              const unitPriceCents = computeUnitPriceCents(product, item.options);

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative size-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <Image
                        src={product.imageDataUri}
                        alt={product.name}
                        fill
                        sizes="64px"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {product.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{product.description}</div>
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
                  </div>

                  <div className="flex flex-1 items-center justify-between gap-4 sm:justify-end">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <input
                        inputMode="numeric"
                        value={item.quantity}
                        onChange={(e) => setQuantity(item.id, Number(e.target.value || 1))}
                        className="h-9 w-14 rounded-xl border border-slate-200 bg-white text-center text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                        aria-label="Quantity"
                      />
                      <button
                        type="button"
                        className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold text-slate-900">
                        {formatMoney(unitPriceCents * item.quantity)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-900">Total</h2>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900">{formatMoney(subtotalCents)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Shipping</span>
              <span className="font-medium text-slate-900">{formatMoney(shippingCents)}</span>
            </div>
            {discountCents > 0 ? (
              <div className="flex items-center justify-between text-slate-600">
                <span>Discount</span>
                <span className="font-medium text-emerald-700">
                  -{formatMoney(discountCents)}
                </span>
              </div>
            ) : null}
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-slate-900">Total</span>
              <span className="text-lg font-semibold text-slate-900">
                {formatMoney(totalCents)}
              </span>
            </div>
          </div>

          <Button
            className="mt-5 w-full"
            size="lg"
            disabled={cartItems.length === 0}
            onClick={() => router.push("/checkout/shipping")}
          >
            Proceed to checkout
          </Button>

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <div className="font-medium text-slate-700">Test mode tips</div>
            <div className="mt-1">
              Use promo codes SAVE10 (10% off) or FREESHIP (waives shipping).
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Popular add-ons</h3>
            <span className="text-xs text-slate-500">One tap</span>
          </div>
          <div className="mt-4 grid gap-3">
            {PRODUCTS.filter((p) => !cartItems.some((i) => i.productId === p.id))
              .slice(0, 2)
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addItem(p.id)}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50"
                >
                  <div className="relative size-11 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <Image src={p.imageDataUri} alt={p.name} fill sizes="44px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-500">{formatMoney(p.priceCents)}</div>
                  </div>
                  <span className="text-xs font-medium text-slate-600 transition group-hover:text-slate-900">
                    Add →
                  </span>
                </button>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
