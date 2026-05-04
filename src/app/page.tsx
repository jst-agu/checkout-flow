"use client";

import Image from "next/image";
import Link from "next/link";

import { motion } from "framer-motion";
import * as React from "react";

import { PRODUCTS } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { useCheckoutStore } from "@/store/checkoutStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";
import { useToast } from "@/components/ui/Toast";

export default function HomePage() {
  const cartItems = useCheckoutStore((s) => s.cartItems);
  const addItem = useCheckoutStore((s) => s.addItem);
  const [configProductId, setConfigProductId] = React.useState<string | null>(null);
  const configProduct = PRODUCTS.find((p) => p.id === configProductId) ?? null;
  const { toast } = useToast();

  return (
    <div className="flex-1">
      <header className="border-b border-slate-200/70 bg-gradient-to-b from-white/80 to-white/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25">
              M
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">Minimal Store</div>
              <div className="text-xs text-slate-500">Premium essentials</div>
            </div>
          </Link>
          <Link
            href="/checkout/cart"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Checkout
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {cartItems.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 -top-24 size-[420px] rounded-full bg-gradient-to-br from-indigo-500/25 to-fuchsia-500/10 blur-3xl" />
          <div className="absolute -right-24 top-10 size-[380px] rounded-full bg-gradient-to-br from-emerald-500/20 to-sky-500/10 blur-3xl" />
        </div>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-300 sm:text-5xl">
              A checkout flow that feels like a real store.
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-slate-600">
              Clean UI, smooth UX, and Stripe-ready payments. Add items to your cart,
              then complete the multi-step checkout.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/checkout/cart">
                <Button size="lg">Go to checkout</Button>
              </Link>
              <a
                href="https://stripe.com/docs/testing"
                target="_blank"
                rel="noreferrer"
              >
                <Button size="lg" variant="secondary">
                  Stripe test cards
                </Button>
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                Guest checkout
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                Responsive
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                Real-time summary
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
          >
            <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Fast checkout</div>
                <div className="mt-1 text-xs text-slate-500">
                  Promo codes: SAVE10, FREESHIP
                </div>
              </div>
              <Link href="/checkout/cart" className="text-sm font-medium text-indigo-600">
                View cart
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              {PRODUCTS.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="relative size-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <Image src={p.imageDataUri} alt={p.name} fill sizes="48px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-500">{formatMoney(p.priceCents)}</div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      addItem(p.id);
                      toast({ variant: "success", title: "Added to cart", description: p.name });
                    }}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
            </Card>
          </motion.div>
        </div>

        <div className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Featured</h2>
              <p className="mt-1 text-sm text-slate-600">
                Modern essentials with a premium feel.
              </p>
            </div>
            <Link href="/checkout/cart" className="text-sm font-medium text-slate-700">
              Proceed to checkout →
            </Link>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className="group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/10">
                  <div className="relative aspect-[4/3] bg-slate-50">
                    <Image
                      src={p.imageDataUri}
                      alt={p.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {p.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{p.description}</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {formatMoney(p.priceCents)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      className="mt-4 w-full"
                      variant="secondary"
                      onClick={() => {
                        addItem(p.id);
                        toast({ variant: "success", title: "Added to cart", description: p.name });
                      }}
                    >
                      Add to cart
                    </Button>
                    <button
                      type="button"
                      onClick={() => setConfigProductId(p.id)}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Customize →
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <footer className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-slate-200/70 pt-8 text-xs text-slate-500 sm:flex-row">
          <div>© {new Date().getFullYear()} Minimal Store</div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">Test mode</span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">Stripe Elements</span>
          </div>
        </footer>
      </main>
      <ProductConfigurator
        product={configProduct}
        open={Boolean(configProductId)}
        onClose={() => setConfigProductId(null)}
      />
    </div>
  );
}
