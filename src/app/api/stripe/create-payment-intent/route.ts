import Stripe from "stripe";

import { PRODUCTS } from "@/lib/catalog";
import {
  cartItemId,
  computeDiscountCents,
  computeShippingCents,
  computeSubtotalCents,
  computeTotalCents,
  normalizePromoCode,
  type CartItem,
  type CartItemOptions,
  type DeliveryType,
} from "@/lib/pricing";
import type { ShippingInfo } from "@/store/checkoutStore";
import { validateShipping } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  cartItems: CartItem[];
  shippingInfo: ShippingInfo;
  deliveryType?: DeliveryType;
  promoCode?: string;
};

function toSafeCartItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v) => typeof v === "object" && v !== null)
    .map((v) => v as Record<string, unknown>)
    .map((v) => ({
      id: String(v.id ?? ""),
      productId: String(v.productId ?? ""),
      quantity: Math.max(1, Math.min(99, Number(v.quantity ?? 1) || 1)),
      options: (v.options ?? undefined) as CartItemOptions | undefined,
    }))
    .filter((i) => Boolean(i.productId))
    .map((i) => ({
      ...i,
      id: i.id || cartItemId(i.productId, i.options),
    }));
}

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return Response.json(
      { ok: false, error: "Missing STRIPE_SECRET_KEY on the server." },
      { status: 500 },
    );
  }

  const stripe = new Stripe(secretKey);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const cartItems = toSafeCartItems(body.cartItems);
  const promoCode = normalizePromoCode(body.promoCode ?? "");
  const deliveryType: DeliveryType = body.deliveryType === "express" ? "express" : "normal";

  if (cartItems.length === 0) {
    return Response.json({ ok: false, error: "Your cart is empty." }, { status: 400 });
  }

  const shippingInfo = body.shippingInfo ?? ({} as ShippingInfo);
  const shippingValidation = validateShipping(shippingInfo);
  if (!shippingValidation.isValid) {
    return Response.json(
      { ok: false, error: "Shipping information is incomplete." },
      { status: 400 },
    );
  }

  const subtotalCents = computeSubtotalCents(cartItems, PRODUCTS);
  const shippingCents = computeShippingCents(subtotalCents, deliveryType);
  const discountCents = computeDiscountCents(subtotalCents, promoCode);
  const amountCents = computeTotalCents({
    subtotalCents,
    shippingCents,
    discountCents,
    promoCode,
  });

  if (amountCents <= 0) {
    return Response.json(
      { ok: false, error: "Order total must be greater than zero." },
      { status: 400 },
    );
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        items: JSON.stringify(cartItems),
        email: shippingInfo.email,
        promo: promoCode,
        deliveryType,
      },
    });

    if (!intent.client_secret) {
      return Response.json(
        { ok: false, error: "Could not initialize payment." },
        { status: 500 },
      );
    }

    return Response.json({
      ok: true,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      currency: intent.currency,
      amountCents,
    });
  } catch {
    return Response.json(
      { ok: false, error: "Stripe error while creating payment intent." },
      { status: 500 },
    );
  }
}
