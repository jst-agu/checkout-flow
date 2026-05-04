export function formatMoney(
  amountCents: number,
  currency: string = "USD",
  locale: string = "en-US",
) {
  const amount = amountCents / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

