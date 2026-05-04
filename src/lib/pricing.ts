import type { Product } from "@/lib/catalog";

export type CartItemOptions = {
  color?: string;
  size?: string;
  giftWrap?: boolean;
  careKit?: boolean;
  monogram?: boolean;
  organizer?: boolean;
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  options?: CartItemOptions;
};

export type DeliveryType = "normal" | "express";

export function cartItemId(productId: string, options?: CartItemOptions) {
  const entries = Object.entries(options ?? {})
    .filter(([, v]) => v !== undefined && v !== false && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${String(v)}`);
  return entries.length ? `${productId}__${entries.join("|")}` : productId;
}

export function computeUnitPriceCents(product: Product, options?: CartItemOptions) {
  let price = product.priceCents;

  if (product.id === "classic-hoodie" && options?.size) {
    if (options.size === "L") price += 200;
    if (options.size === "XL") price += 400;
  }

  if (options?.giftWrap) price += 300;
  if (options?.careKit) price += 600;
  if (options?.monogram) price += 500;
  if (options?.organizer) price += 700;

  return price;
}

export function computeSubtotalCents(cartItems: CartItem[], products: Product[]) {
  const byId = new Map(products.map((p) => [p.id, p]));
  return cartItems.reduce((sum, item) => {
    const product = byId.get(item.productId);
    if (!product) return sum;
    const unit = computeUnitPriceCents(product, item.options);
    return sum + unit * item.quantity;
  }, 0);
}

export function computeShippingCents(
  subtotalCents: number,
  deliveryType: DeliveryType = "normal",
) {
  if (subtotalCents === 0) return 0;
  if (deliveryType === "express") {
    return subtotalCents >= 15000 ? 900 : 1900;
  }
  if (subtotalCents >= 15000) return 0;
  return 900;
}

export function normalizePromoCode(code: string) {
  return code.trim().toUpperCase();
}

export function computeDiscountCents(subtotalCents: number, promoCode: string) {
  const normalized = normalizePromoCode(promoCode);
  if (!normalized) return 0;
  if (normalized === "SAVE10") return Math.round(subtotalCents * 0.1);
  if (normalized === "FREESHIP") return 0;
  return 0;
}

export function computeTotalCents({
  subtotalCents,
  shippingCents,
  discountCents,
  promoCode,
}: {
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  promoCode: string;
}) {
  const normalized = normalizePromoCode(promoCode);
  const effectiveShipping = normalized === "FREESHIP" ? 0 : shippingCents;
  return Math.max(0, subtotalCents + effectiveShipping - discountCents);
}
