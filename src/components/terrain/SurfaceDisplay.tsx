import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

interface SurfaceDisplayProps {
  surface: number | null;
  polygonCoordinates: number[][];
}

const SurfaceDisplay: React.FC<SurfaceDisplayProps> = ({ surface, polygonCoordinates }) => {
  const map = useMap();

  useEffect(() => {
    let marker: L.Marker | null = null;

    // Attendre que la carte soit prête
    if (!map || !map.getContainer()) {
      return;
    }

    // Supprimer les marqueurs existants avec la classe spécifique
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && (layer as any)._surfaceDisplay) {
        map.removeLayer(layer);
      }
    });

    if (surface !== null && surface > 0 && polygonCoordinates.length >= 3) {
      // Calculer le centre du polygone pour positionner l'affichage
      const latLngs = polygonCoordinates
        .filter(coord => coord.length >= 2)
        .map(coord => [coord[1], coord[0]] as L.LatLngTuple);
      
      if (latLngs.length >= 3) {
        const bounds = new L.LatLngBounds(latLngs);
        const center = bounds.getCenter();

        // Créer un marqueur personnalisé avec DivIcon
        const divIcon = L.divIcon({
          html: `
            <div class="bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm border border-primary/20">
              <div class="text-sm font-medium">Surface</div>
              <div class="text-lg font-bold">${surface.toFixed(2)} ha</div>
            </div>
          `,
          className: 'surface-display-marker',
          iconSize: [120, 60],
          iconAnchor: [60, 30]
        });

        marker = L.marker(center, { 
          icon: divIcon,
          interactive: false
        });

        // Marquer ce marqueur comme un affichage de surface
        (marker as any)._surfaceDisplay = true;

        // Ajouter le marqueur à la carte de manière sécurisée
        try {
          marker.addTo(map);
        } catch (error) {
          console.error('Erreur lors de l\'ajout du marqueur de surface:', error);
        }
      }
    }

    // Cleanup function
    return () => {
      if (marker) {
        try {
          map.removeLayer(marker);
        } catch (error) {
          console.error('Erreur lors de la suppression du marqueur de surface:', error);
        }
      }
    };
  }, [map, surface, polygonCoordinates]);

  return null;
};

export default SurfaceDisplay;