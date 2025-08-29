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

    // Supprimer le marqueur existant
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer.options.pane === 'surface-display') {
        map.removeLayer(layer);
      }
    });

    if (surface !== null && surface > 0 && polygonCoordinates.length >= 3) {
      // Calculer le centre du polygone pour positionner l'affichage
      const latLngs = polygonCoordinates
        .filter(coord => coord.length >= 2)
        .map(coord => [coord[1], coord[0]] as L.LatLngTuple);
      const bounds = new L.LatLngBounds(latLngs);
      const center = bounds.getCenter();

      // Créer l'élément HTML pour l'affichage de surface
      const surfaceElement = document.createElement('div');
      surfaceElement.className = 'surface-display-badge';
      surfaceElement.innerHTML = `
        <div class="bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm border border-primary/20">
          <div class="text-sm font-medium">Surface</div>
          <div class="text-lg font-bold">${surface.toFixed(2)} ha</div>
        </div>
      `;

      // Créer un marqueur personnalisé avec DivIcon
      const divIcon = L.divIcon({
        html: surfaceElement.innerHTML,
        className: 'surface-display-marker',
        iconSize: [100, 60],
        iconAnchor: [50, 30]
      });

      marker = L.marker(center, { 
        icon: divIcon,
        pane: 'surface-display',
        interactive: false
      });

      marker.addTo(map);
    }

    // Cleanup function
    return () => {
      if (marker) {
        map.removeLayer(marker);
      }
    };
  }, [map, surface, polygonCoordinates]);

  return null;
};

export default SurfaceDisplay;