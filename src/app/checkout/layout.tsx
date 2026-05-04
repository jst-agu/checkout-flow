import { CheckoutLayoutClient } from "@/components/checkout/CheckoutLayoutClient";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <CheckoutLayoutClient>{children}</CheckoutLayoutClient>;
}

