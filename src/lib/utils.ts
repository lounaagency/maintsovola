import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const formatCurrency = (amount: number, currency: string = "MGA") => {
  return new Intl.NumberFormat("fr-MG", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0, // Ariary n'a pas de sous-unité officielle
  }).format(amount);
};


