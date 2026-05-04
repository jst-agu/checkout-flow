"use client";

import Image from "next/image";

import { PRODUCTS, getProductById } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import {
  computeUnitPriceCents,
  computeDiscountCents,
  computeShippingCents,
  computeSubtotalCents,
  computeTotalCents,
  normalizePromoCode,
} from "@/lib/pricing";
import { useCheckoutStore } from "@/store/checkoutStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/Toast";

export function OrderSummary({
  className,
  showPromo = true,
}: {
  className?: string;
  showPromo?: boolean;
}) {
  const cartItems = useCheckoutStore((s) => s.cartItems);
  const promoCode = useCheckoutStore((s) => s.promoCode);
  const setPromoCode = useCheckoutStore((s) => s.setPromoCode);
  const deliveryType = useCheckoutStore((s) => s.deliveryType);
  const { toast } = useToast();

  const subtotalCents = computeSubtotalCents(cartItems, PRODUCTS);
  const shippingCents = computeShippingCents(subtotalCents, deliveryType);
  const discountCents = computeDiscountCents(subtotalCents, promoCode);
  const totalCents = computeTotalCents({
    subtotalCents,
    shippingCents,
    discountCents,
    promoCode,
  });

  const normalizedPromo = normalizePromoCode(promoCode);
  const promoValid = !normalizedPromo || normalizedPromo === "SAVE10" || normalizedPromo === "FREESHIP";
  const promoLabel =
    normalizedPromo === "SAVE10"
      ? "SAVE10 · 10% off"
      : normalizedPromo === "FREESHIP"
        ? "FREESHIP · Shipping waived"
        : normalizedPromo
          ? "Invalid code"
          : "";

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Order summary</h3>
          <p className="mt-1 text-xs text-slate-500">
            Taxes are included. Free shipping over {formatMoney(15000)} (normal delivery).
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
          {cartItems.reduce((s, i) => s + i.quantity, 0)} items
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {cartItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
            Your cart is empty.
          </div>
        ) : (
          cartItems.map((item) => {
            const product = getProductById(item.productId);
            if (!product) return null;
            const unitPriceCents = computeUnitPriceCents(product, item.options);
            return (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative size-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <Image
                    src={product.imageDataUri}
                    alt={product.name}
                    fill
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">
                    {product.name}
                  </div>
                  <div className="text-xs text-slate-500">Qty {item.quantity}</div>
                </div>
                <div className="text-sm font-medium text-slate-900">
                  {formatMoney(unitPriceCents * item.quantity)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showPromo ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Promo code (SAVE10 or FREESHIP)"
              className={cn(
                "h-10 flex-1 rounded-xl border bg-white px-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10",
                !promoValid ? "border-rose-300 focus:border-rose-300 focus:ring-rose-500/10" : "border-slate-200",
              )}
            />
            <Button
              type="button"
              variant="secondary"
              className="h-10"
              onClick={() => {
                const normalized = normalizePromoCode(promoCode);
                setPromoCode(normalized);
                if (!normalized) return;
                if (normalized === "SAVE10") {
                  toast({ variant: "success", title: "Promo applied", description: "SAVE10 · 10% off" });
                  return;
                }
                if (normalized === "FREESHIP") {
                  toast({ variant: "success", title: "Promo applied", description: "FREESHIP · Shipping waived" });
                  return;
                }
                toast({ variant: "error", title: "Invalid promo code", description: "Try SAVE10 or FREESHIP" });
              }}
              disabled={!promoCode.trim()}
            >
              Apply
            </Button>
          </div>
          {promoLabel ? (
            <div className={cn("mt-2 text-xs", promoValid ? "text-slate-600" : "text-rose-600")}>
              {promoLabel}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-2 text-sm">
        <div className="flex items-center justify-between text-slate-600">
          <span>Subtotal</span>
          <span className="font-medium text-slate-900">{formatMoney(subtotalCents)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Delivery</span>
          <span className="font-medium text-slate-900">
            {deliveryType === "express" ? "Express" : "Normal"}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Shipping</span>
          <span className="font-medium text-slate-900">
            {formatMoney(
              normalizePromoCode(promoCode) === "FREESHIP" ? 0 : shippingCents,
            )}
          </span>
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
    </Card>
  );
}
