"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import * as React from "react";

import type { Product } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import type { CartItemOptions } from "@/lib/pricing";
import { computeUnitPriceCents } from "@/lib/pricing";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { useCheckoutStore } from "@/store/checkoutStore";
import { useToast } from "@/components/ui/Toast";

type ToggleKey = Exclude<keyof CartItemOptions, "color" | "size">;

type Toggle = {
  key: ToggleKey;
  label: string;
  description: string;
};

type Config = {
  colors: string[];
  sizes?: string[];
  toggles?: Toggle[];
};

const CONFIGS: Record<string, Config> = {
  "minimal-sneakers": {
    colors: ["Obsidian", "Bone", "Indigo"],
    sizes: ["7", "8", "9", "10", "11", "12"],
    toggles: [
      { key: "careKit", label: "Care kit", description: "Protective spray + microfiber cloth" },
      { key: "giftWrap", label: "Gift wrap", description: "Premium wrap + note card" },
    ],
  },
  "classic-hoodie": {
    colors: ["Charcoal", "Oat", "Midnight"],
    sizes: ["S", "M", "L", "XL"],
    toggles: [
      { key: "giftWrap", label: "Gift wrap", description: "Premium wrap + note card" },
    ],
  },
  "structured-cap": {
    colors: ["Black", "Sand", "Forest"],
    toggles: [{ key: "monogram", label: "Monogram", description: "Embroidered initials" }],
  },
  "everyday-tote": {
    colors: ["Natural", "Slate", "Olive"],
    toggles: [{ key: "organizer", label: "Organizer", description: "Internal insert with pockets" }],
  },
};

function Pill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-indigo-200 bg-indigo-50 text-indigo-900 shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}

export function ProductConfigurator({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  const config = product ? CONFIGS[product.id] : null;

  if (!product || !config) {
    return null;
  }

  const titleId = `config-${product.id}`;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
          aria-labelledby={titleId}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <div className="relative mx-auto grid h-full max-w-3xl place-items-center px-4 py-8">
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <ConfiguratorPanel
                key={product.id}
                product={product}
                config={config}
                titleId={titleId}
                onClose={onClose}
              />
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ConfiguratorPanel({
  product,
  config,
  titleId,
  onClose,
}: {
  product: Product;
  config: Config;
  titleId: string;
  onClose: () => void;
}) {
  const addConfiguredItem = useCheckoutStore((s) => s.addConfiguredItem);
  const { toast } = useToast();
  const [quantity, setQuantity] = React.useState(1);
  const [options, setOptions] = React.useState<CartItemOptions>(() => ({
    color: config.colors[0],
    size: config.sizes?.[0],
  }));

  const unitPriceCents = computeUnitPriceCents(product, options);
  const totalCents = unitPriceCents * quantity;

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative bg-slate-50">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-fuchsia-500/10" />
          <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full">
            <Image
              src={product.imageDataUri}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div id={titleId} className="text-xl font-semibold text-slate-900">
                {product.name}
              </div>
              <div className="mt-1 text-sm text-slate-600">{product.description}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Close"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="mt-5 grid gap-5">
            <div className="grid gap-2">
              <div className="text-sm font-semibold text-slate-900">Color</div>
              <div className="flex flex-wrap gap-2">
                {config.colors.map((c) => (
                  <Pill
                    key={c}
                    active={options.color === c}
                    onClick={() => setOptions((o) => ({ ...o, color: c }))}
                  >
                    {c}
                  </Pill>
                ))}
              </div>
            </div>

            {config.sizes?.length ? (
              <div className="grid gap-2">
                <div className="text-sm font-semibold text-slate-900">Size</div>
                <div className="flex flex-wrap gap-2">
                  {config.sizes.map((s) => (
                    <Pill
                      key={s}
                      active={options.size === s}
                      onClick={() => setOptions((o) => ({ ...o, size: s }))}
                    >
                      {s}
                    </Pill>
                  ))}
                </div>
              </div>
            ) : null}

            {config.toggles?.length ? (
              <div className="grid gap-2">
                <div className="text-sm font-semibold text-slate-900">Add‑ons</div>
                <div className="grid gap-2">
                  {config.toggles.map((t) => {
                    const checked = Boolean(options[t.key]);
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setOptions((o) => ({ ...o, [t.key]: !checked }))}
                        className={cn(
                          "flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition",
                          checked
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-slate-200 bg-white hover:bg-slate-50",
                        )}
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{t.label}</div>
                          <div className="mt-1 text-xs text-slate-600">{t.description}</div>
                        </div>
                        <span
                          className={cn(
                            "grid size-5 place-items-center rounded-full",
                            checked
                              ? "bg-emerald-600 text-white"
                              : "border border-slate-300 bg-white text-transparent",
                          )}
                        >
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
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <div className="text-xs text-slate-600">Total</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {formatMoney(totalCents)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <div className="grid min-w-10 place-items-center text-sm font-semibold text-slate-900">
                  {quantity}
                </div>
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={() => {
                  addConfiguredItem(product.id, options, quantity);
                  const summary = Object.entries(options)
                    .filter(([, v]) => v !== undefined && v !== false && v !== "")
                    .map(([k, v]) => `${k}: ${String(v)}`)
                    .join(" · ");
                  toast({
                    variant: "success",
                    title: "Added customized item",
                    description: summary ? `${product.name} · ${summary}` : product.name,
                  });
                  onClose();
                }}
              >
                Add to cart
              </Button>
              <Button
                type="button"
                className="w-full"
                size="lg"
                variant="secondary"
                onClick={onClose}
              >
                Keep browsing
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
