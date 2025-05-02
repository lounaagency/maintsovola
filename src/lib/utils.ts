
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

export function formatRelativeTime(timestamp: number): string {
  const now = new Date().getTime();
  const diff = now - timestamp;
  
  // Convert to seconds
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) {
    return "à l'instant";
  }
  
  // Convert to minutes
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `il y a ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
  
  // Convert to hours
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `il y a ${hours} ${hours === 1 ? 'heure' : 'heures'}`;
  }
  
  // Convert to days
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `il y a ${days} ${days === 1 ? 'jour' : 'jours'}`;
  }
  
  // Convert to months
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `il y a ${months} ${months === 1 ? 'mois' : 'mois'}`;
  }
  
  // Convert to years
  const years = Math.floor(months / 12);
  return `il y a ${years} ${years === 1 ? 'an' : 'ans'}`;
}
