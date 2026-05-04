"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/cn";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  createdAt: number;
};

type ToastInput = Omit<ToastItem, "id" | "createdAt"> & { durationMs?: number };

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

function randomHex(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function createId() {
  return `t_${randomHex(8)}_${randomHex(4)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const timers = React.useRef(new Map<string, number>());

  const remove = React.useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) {
      window.clearTimeout(t);
      timers.current.delete(id);
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toast = React.useCallback(
    (input: ToastInput) => {
      const id = createId();
      const createdAt = Number(new Date());
      const durationMs = Math.max(1200, Math.min(8000, input.durationMs ?? 3200));
      const item: ToastItem = {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant,
        createdAt,
      };

      setItems((prev) => [item, ...prev].slice(0, 4));
      const timerId = window.setTimeout(() => remove(id), durationMs);
      timers.current.set(id, timerId);
    },
    [remove],
  );

  React.useEffect(() => {
    const timersMap = timers.current;
    return () => {
      timersMap.forEach((t) => window.clearTimeout(t));
      timersMap.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] mx-auto flex max-w-xl flex-col gap-2 px-4 sm:top-6">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10, scale: 0.98, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, scale: 0.98, filter: "blur(6px)" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "pointer-events-auto rounded-2xl border bg-white/85 p-4 shadow-lg shadow-slate-900/10 backdrop-blur",
                t.variant === "success" && "border-emerald-200",
                t.variant === "error" && "border-rose-200",
                t.variant === "info" && "border-slate-200",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 grid size-9 place-items-center rounded-xl",
                    t.variant === "success" && "bg-emerald-50 text-emerald-700",
                    t.variant === "error" && "bg-rose-50 text-rose-700",
                    t.variant === "info" && "bg-slate-100 text-slate-700",
                  )}
                >
                  {t.variant === "success" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : t.variant === "error" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 9v4m0 4h.01M10.29 3.86l-8.4 14.55A2 2 0 003.62 21h16.76a2 2 0 001.73-3.02l-8.4-14.55a2 2 0 00-3.46 0z"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                  {t.description ? (
                    <div className="mt-1 text-sm text-slate-600">{t.description}</div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  className="grid size-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  aria-label="Dismiss"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
