"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useCheckoutStore } from "@/store/checkoutStore";
import { validateShipping } from "@/lib/validation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ShippingPage() {
  const router = useRouter();
  const cartItems = useCheckoutStore((s) => s.cartItems);
  const shippingInfo = useCheckoutStore((s) => s.shippingInfo);
  const setShippingInfo = useCheckoutStore((s) => s.setShippingInfo);
  const deliveryType = useCheckoutStore((s) => s.deliveryType);
  const setDeliveryType = useCheckoutStore((s) => s.setDeliveryType);

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (cartItems.length === 0) router.replace("/checkout/cart");
  }, [cartItems.length, router]);

  const validation = useMemo(() => validateShipping(shippingInfo), [shippingInfo]);
  const canContinue = cartItems.length > 0 && validation.isValid;

  const showError = (key: keyof typeof shippingInfo) =>
    touched[key] ? validation.errors[key] : undefined;

  return (
    <div className="grid gap-6">
      <Card className="p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Shipping information
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Enter your details. We’ll use this for delivery and receipts.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setShippingInfo({
                fullName: "Alex Morgan",
                email: "alex.morgan@example.com",
                phone: "+1 415 555 0199",
                address: "214 Market Street",
                city: "San Francisco",
                country: "United States",
              })
            }
          >
            Autofill test data
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Input
            label="Full Name"
            value={shippingInfo.fullName}
            onChange={(e) => setShippingInfo({ fullName: e.target.value })}
            onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
            error={showError("fullName")}
            placeholder="Jane Doe"
            autoComplete="name"
          />
          <Input
            label="Email"
            value={shippingInfo.email}
            onChange={(e) => setShippingInfo({ email: e.target.value })}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            error={showError("email")}
            placeholder="jane@company.com"
            autoComplete="email"
          />
          <Input
            label="Phone"
            value={shippingInfo.phone}
            onChange={(e) => setShippingInfo({ phone: e.target.value })}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            error={showError("phone")}
            placeholder="+1 (555) 000-0000"
            autoComplete="tel"
          />
          <div className="sm:col-span-2">
            <Input
              label="Address"
              value={shippingInfo.address}
              onChange={(e) => setShippingInfo({ address: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, address: true }))}
              error={showError("address")}
              placeholder="123 Main St"
              autoComplete="street-address"
            />
          </div>
          <Input
            label="City"
            value={shippingInfo.city}
            onChange={(e) => setShippingInfo({ city: e.target.value })}
            onBlur={() => setTouched((t) => ({ ...t, city: true }))}
            error={showError("city")}
            placeholder="New York"
            autoComplete="address-level2"
          />
          <Input
            label="Country"
            value={shippingInfo.country}
            onChange={(e) => setShippingInfo({ country: e.target.value })}
            onBlur={() => setTouched((t) => ({ ...t, country: true }))}
            error={showError("country")}
            placeholder="United States"
            autoComplete="country-name"
          />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">Delivery type</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setDeliveryType("normal")}
              className={
                deliveryType === "normal"
                  ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left shadow-sm"
                  : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left hover:bg-slate-50"
              }
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Normal</div>
                <span
                  className={
                    deliveryType === "normal"
                      ? "grid size-5 place-items-center rounded-full bg-emerald-600 text-white"
                      : "grid size-5 place-items-center rounded-full border border-slate-300 bg-white"
                  }
                >
                  {deliveryType === "normal" ? (
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
              <div className="mt-1 text-xs text-slate-600">Estimated 3–5 business days</div>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType("express")}
              className={
                deliveryType === "express"
                  ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left shadow-sm"
                  : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left hover:bg-slate-50"
              }
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Express</div>
                <span
                  className={
                    deliveryType === "express"
                      ? "grid size-5 place-items-center rounded-full bg-emerald-600 text-white"
                      : "grid size-5 place-items-center rounded-full border border-slate-300 bg-white"
                  }
                >
                  {deliveryType === "express" ? (
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
              <div className="mt-1 text-xs text-slate-600">Estimated 1–2 business days</div>
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/checkout/cart")}
          >
            Back to cart
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!canContinue}
            onClick={() => router.push("/checkout/payment")}
          >
            Continue to payment
          </Button>
        </div>

        {!validation.isValid ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            Complete required fields to continue.
          </div>
        ) : null}
      </Card>
    </div>
  );
}
