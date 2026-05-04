import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { cartItemId, type CartItem, type CartItemOptions, type DeliveryType } from "@/lib/pricing";

export type ShippingInfo = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
};

export type PaymentStatus = "idle" | "processing" | "succeeded" | "failed";

export type PaymentMethod = "digital" | "cod";

export type LastOrder = {
  orderId: string;
  paymentIntentId: string;
  createdAt: number;
  currency: string;
  amountCents: number;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  promoCode: string;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  cartItems: CartItem[];
  shippingInfo: ShippingInfo;
};

const emptyShipping: ShippingInfo = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
};

type CheckoutState = {
  cartItems: CartItem[];
  shippingInfo: ShippingInfo;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  promoCode: string;
  paymentStatus: PaymentStatus;
  paymentError: string | null;
  lastOrder: LastOrder | null;
  hasHydrated: boolean;
};

type CheckoutActions = {
  addItem: (productId: string) => void;
  addConfiguredItem: (
    productId: string,
    options?: CartItemOptions,
    quantity?: number,
  ) => void;
  removeItem: (cartItemId: string) => void;
  setQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  setShippingInfo: (patch: Partial<ShippingInfo>) => void;
  setDeliveryType: (deliveryType: DeliveryType) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setPromoCode: (promoCode: string) => void;
  setPaymentStatus: (status: PaymentStatus) => void;
  setPaymentError: (message: string | null) => void;
  setLastOrder: (order: LastOrder | null) => void;
  resetCheckout: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useCheckoutStore = create<CheckoutState & CheckoutActions>()(
  persist(
    (set, get) => ({
      cartItems: [
        { id: cartItemId("minimal-sneakers"), productId: "minimal-sneakers", quantity: 1 },
        { id: cartItemId("classic-hoodie"), productId: "classic-hoodie", quantity: 1 },
      ],
      shippingInfo: emptyShipping,
      deliveryType: "normal",
      paymentMethod: "digital",
      promoCode: "",
      paymentStatus: "idle",
      paymentError: null,
      lastOrder: null,
      hasHydrated: false,

      addItem: (productId) => get().addConfiguredItem(productId, undefined, 1),

      addConfiguredItem: (productId, options, quantity = 1) => {
        const id = cartItemId(productId, options);
        const q = Math.max(1, Math.min(99, Math.round(quantity)));
        const existing = get().cartItems.find((i) => i.id === id);
        if (existing) {
          set({
            cartItems: get().cartItems.map((i) =>
              i.id === id ? { ...i, quantity: Math.min(99, i.quantity + q) } : i,
            ),
          });
          return;
        }
        set({
          cartItems: [...get().cartItems, { id, productId, quantity: q, options }],
        });
      },

      removeItem: (cartItemIdValue) =>
        set({ cartItems: get().cartItems.filter((i) => i.id !== cartItemIdValue) }),

      setQuantity: (cartItemIdValue, quantity) => {
        const q = Math.max(1, Math.min(99, Math.round(quantity)));
        set({
          cartItems: get().cartItems.map((i) =>
            i.id === cartItemIdValue ? { ...i, quantity: q } : i,
          ),
        });
      },

      clearCart: () => set({ cartItems: [] }),

      setShippingInfo: (patch) =>
        set({ shippingInfo: { ...get().shippingInfo, ...patch } }),

      setDeliveryType: (deliveryType) => set({ deliveryType }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      setPromoCode: (promoCode) => set({ promoCode }),

      setPaymentStatus: (status) => set({ paymentStatus: status }),

      setPaymentError: (message) => set({ paymentError: message }),

      setLastOrder: (order) => set({ lastOrder: order }),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      resetCheckout: () =>
        set({
          shippingInfo: emptyShipping,
          deliveryType: "normal",
          paymentMethod: "digital",
          promoCode: "",
          paymentStatus: "idle",
          paymentError: null,
          lastOrder: null,
        }),
    }),
    {
      name: "checkout:v1",
      version: 3,
      storage:
        typeof window === "undefined"
          ? undefined
          : createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== "object") return persistedState;
        const state = persistedState as Record<string, unknown>;

        const shippingInfoRaw = (state.shippingInfo ?? {}) as Record<string, unknown>;
        const shippingInfo = {
          fullName: String(shippingInfoRaw.fullName ?? ""),
          email: String(shippingInfoRaw.email ?? ""),
          phone: String(shippingInfoRaw.phone ?? ""),
          address: String(shippingInfoRaw.address ?? ""),
          city: String(shippingInfoRaw.city ?? ""),
          country: String(shippingInfoRaw.country ?? ""),
        };

        const deliveryType = state.deliveryType === "express" ? "express" : "normal";
        const paymentMethod = state.paymentMethod === "cod" ? "cod" : "digital";

        const cartItemsRaw = state.cartItems;
        const cartItems = Array.isArray(cartItemsRaw)
          ? (cartItemsRaw as Array<Record<string, unknown>>).map((raw) => {
              const productId = String(raw.productId ?? "");
              const quantity = Math.max(1, Math.min(99, Number(raw.quantity ?? 1) || 1));
              const options = (raw.options ?? undefined) as CartItemOptions | undefined;
              const id = String(raw.id ?? cartItemId(productId, options));
              return { id, productId, quantity, options } satisfies CartItem;
            })
          : [];

        const lastOrderRaw = state.lastOrder as Record<string, unknown> | null | undefined;
        const lastOrder = lastOrderRaw
          ? {
              orderId: String(lastOrderRaw.orderId ?? ""),
              paymentIntentId: String(lastOrderRaw.paymentIntentId ?? ""),
              createdAt: Number(lastOrderRaw.createdAt ?? Date.now()),
              currency: String(lastOrderRaw.currency ?? "usd"),
              amountCents: Number(lastOrderRaw.amountCents ?? 0),
              subtotalCents: Number(lastOrderRaw.subtotalCents ?? 0),
              shippingCents: Number(lastOrderRaw.shippingCents ?? 0),
              discountCents: Number(lastOrderRaw.discountCents ?? 0),
              promoCode: String(lastOrderRaw.promoCode ?? ""),
              deliveryType:
                lastOrderRaw.deliveryType === "express" ? "express" : "normal",
              paymentMethod: lastOrderRaw.paymentMethod === "cod" ? "cod" : "digital",
              cartItems: Array.isArray(lastOrderRaw.cartItems)
                ? (lastOrderRaw.cartItems as Array<Record<string, unknown>>).map((raw) => {
                    const productId = String(raw.productId ?? "");
                    const quantity = Math.max(1, Math.min(99, Number(raw.quantity ?? 1) || 1));
                    const options = (raw.options ?? undefined) as CartItemOptions | undefined;
                    const id = String(raw.id ?? cartItemId(productId, options));
                    return { id, productId, quantity, options } satisfies CartItem;
                  })
                : [],
              shippingInfo,
            }
          : null;

        if (version >= 3) {
          return { ...state, cartItems, shippingInfo, deliveryType, paymentMethod, lastOrder };
        }

        return { ...state, cartItems, shippingInfo, deliveryType, paymentMethod, lastOrder };
      },
      partialize: (state) => ({
        cartItems: state.cartItems,
        shippingInfo: state.shippingInfo,
        deliveryType: state.deliveryType,
        paymentMethod: state.paymentMethod,
        promoCode: state.promoCode,
        lastOrder: state.lastOrder,
      }),
    },
  ),
);
