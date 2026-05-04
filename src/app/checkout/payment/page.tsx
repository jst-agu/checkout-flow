"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { PRODUCTS } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import {
  computeDiscountCents,
  computeShippingCents,
  computeSubtotalCents,
  computeTotalCents,
  normalizePromoCode,
} from "@/lib/pricing";
import { validateShipping } from "@/lib/validation";
import { useCheckoutStore } from "@/store/checkoutStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type IntentResponse =
  | { ok: true; clientSecret: string; paymentIntentId: string; currency: string; amountCents: number }
  | { ok: false; error: string };

function BrandBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
      {label}
    </span>
  );
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  const groups = digits.match(/.{1,4}/g) ?? [];
  return groups.join(" ");
}

function formatExpiry(value: string) {
  let digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 1) {
    const d = Number(digits);
    if (d > 1) digits = `0${digits}`;
  }
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isValidExpiry(value: string) {
  const [mm, yy] = value.split("/");
  if (!mm || !yy) return false;
  if (!/^\d{2}$/.test(mm) || !/^\d{2}$/.test(yy)) return false;
  const month = Number(mm);
  if (month < 1 || month > 12) return false;
  return true;
}

function randomHex(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function createOrderId(prefix: string) {
  return `${prefix}_${randomHex(8)}_${randomHex(4)}`;
}

function DemoPaymentForm({
  amountCents,
  subtotalCents,
  shippingCents,
  discountCents,
  promoCode,
  deliveryType,
  currency,
}: {
  amountCents: number;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  promoCode: string;
  deliveryType: "normal" | "express";
  currency: string;
}) {
  const router = useRouter();
  const cartItems = useCheckoutStore((s) => s.cartItems);
  const shippingInfo = useCheckoutStore((s) => s.shippingInfo);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const setPaymentStatus = useCheckoutStore((s) => s.setPaymentStatus);
  const paymentStatus = useCheckoutStore((s) => s.paymentStatus);
  const paymentError = useCheckoutStore((s) => s.paymentError);
  const setPaymentError = useCheckoutStore((s) => s.setPaymentError);
  const setLastOrder = useCheckoutStore((s) => s.setLastOrder);

  const [cardholder, setCardholder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [simulateFailure, setSimulateFailure] = useState(false);

  const digits = cardNumber.replace(/\D/g, "");
  const expiryOk = isValidExpiry(expiry.trim());
  const cvcOk = /^\d{3,4}$/.test(cvc.trim().replace(/\D/g, ""));
  const cardOk = digits.length >= 12 && digits.length <= 19;
  const nameOk = cardholder.trim().length >= 2;

  const canSubmit =
    paymentStatus !== "processing" && cartItems.length > 0 && cardOk && expiryOk && cvcOk && nameOk;

  async function onPay() {
    setPaymentError(null);
    setPaymentStatus("processing");

    await new Promise((r) => setTimeout(r, 900));

    const shouldFail = simulateFailure || digits.endsWith("0000");
    if (shouldFail) {
      setPaymentStatus("failed");
      setPaymentError("Payment failed. Please try again or use a different test card.");
      return;
    }

    const orderId = createOrderId("demo");
    setPaymentStatus("succeeded");
    setLastOrder({
      orderId,
      paymentIntentId: orderId,
      createdAt: Number(new Date()),
      currency,
      amountCents,
      subtotalCents,
      shippingCents,
      discountCents,
      promoCode,
      deliveryType,
      paymentMethod,
      cartItems,
      shippingInfo,
    });
    router.replace(`/checkout/confirmation?orderId=${encodeURIComponent(orderId)}`);
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Payment</h1>
          <p className="mt-1 text-sm text-slate-600">
            Demo payment mode. No Stripe keys required — this simulates a realistic checkout.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
          Test
        </span>
      </div>

      <div className="mt-6 grid gap-4">
        <Input
          label="Cardholder name"
          value={cardholder}
          onChange={(e) => setCardholder(e.target.value)}
          placeholder="Alex Morgan"
          autoComplete="cc-name"
        />

        <Input
          label="Card number"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          placeholder="4242 4242 4242 4242"
          inputMode="numeric"
          maxLength={23}
          autoComplete="cc-number"
          hint="Type digits only. Ends with 0000 to simulate a failure."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Expiry"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY"
            inputMode="numeric"
            maxLength={5}
            autoComplete="cc-exp"
          />
          <Input
            label="CVC"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="123"
            inputMode="numeric"
            maxLength={4}
            autoComplete="cc-csc"
          />
        </div>

        <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <span className="text-slate-700">Simulate failure</span>
          <input
            type="checkbox"
            checked={simulateFailure}
            onChange={(e) => setSimulateFailure(e.target.checked)}
            className="size-4 rounded border-slate-300"
          />
        </label>
      </div>

      {paymentError ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {paymentError}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={() => router.push("/checkout/shipping")}>
          Back to shipping
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onPay}
          disabled={!canSubmit}
          isLoading={paymentStatus === "processing"}
        >
          Pay {formatMoney(amountCents, currency.toUpperCase())}
        </Button>
      </div>
    </Card>
  );
}

function PaymentForm({
  clientSecret,
  paymentIntentId,
  amountCents,
  subtotalCents,
  shippingCents,
  discountCents,
  promoCode,
  deliveryType,
  currency,
}: {
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  promoCode: string;
  deliveryType: "normal" | "express";
  currency: string;
}) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const cartItems = useCheckoutStore((s) => s.cartItems);
  const shippingInfo = useCheckoutStore((s) => s.shippingInfo);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const setPaymentStatus = useCheckoutStore((s) => s.setPaymentStatus);
  const paymentStatus = useCheckoutStore((s) => s.paymentStatus);
  const paymentError = useCheckoutStore((s) => s.paymentError);
  const setPaymentError = useCheckoutStore((s) => s.setPaymentError);
  const setLastOrder = useCheckoutStore((s) => s.setLastOrder);

  const canSubmit = Boolean(stripe && elements) && paymentStatus !== "processing";

  async function onPay() {
    if (!stripe || !elements) return;
    setPaymentError(null);
    setPaymentStatus("processing");

    const result = await stripe.confirmPayment({
      elements,
      clientSecret,
      redirect: "if_required",
    });

    if (result.error) {
      setPaymentStatus("failed");
      setPaymentError(result.error.message ?? "Payment failed. Try again.");
      return;
    }

    setPaymentStatus("succeeded");
    setLastOrder({
      orderId: paymentIntentId,
      paymentIntentId,
      createdAt: Number(new Date()),
      currency,
      amountCents,
      subtotalCents,
      shippingCents,
      discountCents,
      promoCode,
      deliveryType,
      paymentMethod,
      cartItems,
      shippingInfo,
    });
    router.replace(`/checkout/confirmation?orderId=${encodeURIComponent(paymentIntentId)}`);
  }

  return (
    <Card className="p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Payment</h1>
        <p className="mt-1 text-sm text-slate-600">
          Secure card payments powered by Stripe. This is test mode.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <PaymentElement />
      </div>

      {paymentError ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {paymentError}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={() => router.push("/checkout/shipping")}>
          Back to shipping
        </Button>
        <Button type="button" size="lg" onClick={onPay} disabled={!canSubmit} isLoading={paymentStatus === "processing"}>
          Pay {formatMoney(amountCents, currency.toUpperCase())}
        </Button>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        Use card 4242 4242 4242 4242 with any future expiry and any CVC.
      </div>
    </Card>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const cartItems = useCheckoutStore((s) => s.cartItems);
  const shippingInfo = useCheckoutStore((s) => s.shippingInfo);
  const promoCode = useCheckoutStore((s) => s.promoCode);
  const deliveryType = useCheckoutStore((s) => s.deliveryType);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const setPaymentMethod = useCheckoutStore((s) => s.setPaymentMethod);
  const setLastOrder = useCheckoutStore((s) => s.setLastOrder);
  const setPaymentError = useCheckoutStore((s) => s.setPaymentError);
  const setPaymentStatus = useCheckoutStore((s) => s.setPaymentStatus);
  const paymentStatus = useCheckoutStore((s) => s.paymentStatus);

  const shippingValidation = useMemo(() => validateShipping(shippingInfo), [shippingInfo]);

  const subtotalCents = computeSubtotalCents(cartItems, PRODUCTS);
  const shippingCentsBase = computeShippingCents(subtotalCents, deliveryType);
  const discountCents = computeDiscountCents(subtotalCents, promoCode);
  const shippingCentsEffective =
    normalizePromoCode(promoCode) === "FREESHIP" ? 0 : shippingCentsBase;
  const totalCents = computeTotalCents({
    subtotalCents,
    shippingCents: shippingCentsBase,
    discountCents,
    promoCode,
  });

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const stripeEnabled = Boolean(publishableKey);
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  const [intent, setIntent] = useState<IntentResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (cartItems.length === 0) {
      router.replace("/checkout/cart");
      return;
    }
    if (!shippingValidation.isValid) {
      router.replace("/checkout/shipping");
    }
  }, [cartItems.length, router, shippingValidation.isValid]);

  useEffect(() => {
    let isMounted = true;

    async function createIntent() {
      if (!stripeEnabled) return;
      if (cartItems.length === 0 || !shippingValidation.isValid) return;
      if (paymentMethod !== "digital") return;
      setIsCreating(true);
      setPaymentError(null);
      setPaymentStatus("idle");
      try {
        const res = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartItems, shippingInfo, promoCode, deliveryType }),
        });
        const json = (await res.json()) as IntentResponse;
        if (!isMounted) return;
        setIntent(json);
        if (!json.ok) setPaymentError(json.error);
      } catch {
        if (!isMounted) return;
        setIntent({ ok: false, error: "Could not start payment. Please try again." });
        setPaymentError("Could not start payment. Please try again.");
      } finally {
        if (isMounted) setIsCreating(false);
      }
    }

    createIntent();
    return () => {
      isMounted = false;
    };
  }, [
    cartItems,
    deliveryType,
    paymentMethod,
    promoCode,
    setPaymentError,
    setPaymentStatus,
    shippingInfo,
    shippingValidation.isValid,
    stripeEnabled,
  ]);

  const stripeUnavailable =
    !stripeEnabled ||
    (intent?.ok === false && intent.error.toLowerCase().includes("missing stripe_secret_key"));

  async function confirmCashOnDelivery() {
    setPaymentError(null);
    setPaymentStatus("processing");
    await new Promise((r) => setTimeout(r, 700));

    const orderId = createOrderId("cod");
    setPaymentStatus("succeeded");
    setLastOrder({
      orderId,
      paymentIntentId: orderId,
      createdAt: Number(new Date()),
      currency: "usd",
      amountCents: totalCents,
      subtotalCents,
      shippingCents: shippingCentsEffective,
      discountCents,
      promoCode,
      deliveryType,
      paymentMethod: "cod",
      cartItems,
      shippingInfo,
    });
    router.replace(`/checkout/confirmation?orderId=${encodeURIComponent(orderId)}`);
  }

  const methodPill = (method: "digital" | "cod") =>
    paymentMethod === method
      ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left shadow-sm"
      : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left hover:bg-slate-50";

  return (
    <div className="grid gap-6">
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between bg-emerald-600 px-5 py-4 text-white">
          <div className="text-sm font-medium">Order total</div>
          <div className="text-sm font-semibold">{formatMoney(totalCents)}</div>
        </div>
        <div className="p-5">
          <div className="text-sm font-semibold text-slate-900">Payment method</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className={methodPill("cod")}
              onClick={() => setPaymentMethod("cod")}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Cash on delivery</div>
                <span
                  className={
                    paymentMethod === "cod"
                      ? "grid size-5 place-items-center rounded-full bg-emerald-600 text-white"
                      : "grid size-5 place-items-center rounded-full border border-slate-300 bg-white"
                  }
                >
                  {paymentMethod === "cod" ? (
                    <svg
                      width="12"
                      height="12"
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
                  ) : null}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-600">Pay when the package arrives</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <BrandBadge label="Cash" />
                <BrandBadge label="Pay on delivery" />
              </div>
            </button>

            <button
              type="button"
              className={methodPill("digital")}
              onClick={() => setPaymentMethod("digital")}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Digital payment</div>
                <span
                  className={
                    paymentMethod === "digital"
                      ? "grid size-5 place-items-center rounded-full bg-emerald-600 text-white"
                      : "grid size-5 place-items-center rounded-full border border-slate-300 bg-white"
                  }
                >
                  {paymentMethod === "digital" ? (
                    <svg
                      width="12"
                      height="12"
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
                  ) : null}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-600">Card / wallet (Stripe or demo)</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <BrandBadge label="VISA" />
                <BrandBadge label="Mastercard" />
                <BrandBadge label="Apple Pay" />
              </div>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <div className="text-slate-700">
              Delivery:{" "}
              <span className="font-semibold text-slate-900">
                {deliveryType === "express" ? "Express" : "Normal"}
              </span>
            </div>
            <div className="text-slate-700">
              Shipping:{" "}
              <span className="font-semibold text-slate-900">
                {formatMoney(shippingCentsEffective)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {paymentMethod === "cod" ? (
        <Card className="p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Confirm your order
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              You’ll pay in cash when your delivery arrives.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Amount due on delivery</span>
              <span className="font-semibold text-slate-900">{formatMoney(totalCents)}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => router.push("/checkout/shipping")}>
              Back to shipping
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={confirmCashOnDelivery}
              isLoading={paymentStatus === "processing"}
            >
              Confirm order
            </Button>
          </div>
        </Card>
      ) : stripeUnavailable ? (
        <>
          <DemoPaymentForm
            amountCents={totalCents}
            subtotalCents={subtotalCents}
            shippingCents={shippingCentsEffective}
            discountCents={discountCents}
            promoCode={promoCode}
            deliveryType={deliveryType}
            currency="usd"
          />
          <Card className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Stripe optional</div>
                <div className="mt-1 text-sm text-slate-600">
                  Add Stripe keys later to switch to real Stripe Elements automatically.
                </div>
              </div>
              <Button type="button" variant="secondary" onClick={() => router.refresh()}>
                Retry Stripe
              </Button>
            </div>
          </Card>
        </>
      ) : !stripePromise ? null : isCreating ? (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Preparing secure payment
              </h1>
              <p className="mt-1 text-sm text-slate-600">Total: {formatMoney(totalCents)}</p>
            </div>
            <div className="size-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          </div>
        </Card>
      ) : intent?.ok ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: intent.clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#4f46e5",
                colorBackground: "#ffffff",
                colorText: "#0b1220",
                borderRadius: "14px",
                fontFamily:
                  "var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
              },
            },
          }}
        >
          <PaymentForm
            clientSecret={intent.clientSecret}
            paymentIntentId={intent.paymentIntentId}
            amountCents={intent.amountCents}
            subtotalCents={subtotalCents}
            shippingCents={shippingCentsEffective}
            discountCents={discountCents}
            promoCode={promoCode}
            deliveryType={deliveryType}
            currency={intent.currency}
          />
        </Elements>
      ) : (
        <Card className="p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Payment</h1>
          <p className="mt-2 text-sm text-slate-600">
            {intent?.ok === false ? intent.error : "Could not start payment."}
          </p>
          <Button className="mt-5" variant="secondary" onClick={() => router.refresh()}>
            Retry
          </Button>
        </Card>
      )}
    </div>
  );
}
