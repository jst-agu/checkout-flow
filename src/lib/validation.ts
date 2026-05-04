import type { ShippingInfo } from "@/store/checkoutStore";

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateShipping(info: ShippingInfo) {
  const errors: Partial<Record<keyof ShippingInfo, string>> = {};

  if (!info.fullName.trim()) errors.fullName = "Full name is required";
  if (!info.email.trim()) errors.email = "Email is required";
  else if (!isValidEmail(info.email)) errors.email = "Enter a valid email";
  if (!info.phone.trim()) errors.phone = "Phone number is required";
  if (!info.address.trim()) errors.address = "Address is required";
  if (!info.city.trim()) errors.city = "City is required";
  if (!info.country.trim()) errors.country = "Country is required";

  return { isValid: Object.keys(errors).length === 0, errors };
}
