
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number | null | undefined, currency: string = "MGA") => {
  if (amount === null || amount === undefined) return "0 MGA";
  
  return new Intl.NumberFormat("fr-MG", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0, // Ariary n'a pas de sous-unité officielle
  }).format(amount);
};

// Function to convert WKT format to GeoJSON
export const wktToGeoJSON = (wktString: string | null): GeoJSON.Feature | null => {
  if (!wktString) return null;
  
  try {
    // Simple WKT POLYGON parser
    const match = wktString.match(/POLYGON\s*\(\((.*)\)\)/i);
    if (!match || !match[1]) return null;

    const coordsPairs = match[1].split(',').map(pair => pair.trim());
    const coordinates = coordsPairs.map(pair => {
      const [lng, lat] = pair.split(' ').map(Number);
      return [lng, lat];
    });

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      },
      properties: {}
    };
  } catch (error) {
    console.error('Error parsing WKT:', error);
    return null;
  }
};
