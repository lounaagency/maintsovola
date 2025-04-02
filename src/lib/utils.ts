
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  // For Malagasy phone numbers (03X, 03X, 03X)
  const phoneRegex = /^(032|033|034)\d{7}$/;
  return phoneRegex.test(phone);
};

export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('fr-MG', {
    style: 'currency',
    currency: 'MGA',
    minimumFractionDigits: 0
  }).format(amount);
};

export const generateProjectTitle = (cultures: string[]): string => {
  if (!cultures || cultures.length === 0) return 'Nouveau projet';
  
  return `Projet de culture de ${cultures.join(', ')}`;
};

export const generateProjectDescription = (
  cultures: string[], 
  surface: number, 
  commune: string, 
  district: string, 
  region: string,
  rendement: number,
  ca: number
): string => {
  return `Projet de culture de ${cultures.join(', ')} sur un terrain de ${surface} hectares dans la commune ${commune}, district de ${district} de la région ${region} pour une production de ${rendement} Tonnes estimée à ${formatPrice(ca)}.`;
};


export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MGA",
  }).format(value);
}

