
import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TerrainMapSelectorProps {
  polygonCoordinates: L.LatLngExpression[];
  setPolygonCoordinates: React.Dispatch<React.SetStateAction<L.LatLngExpression[]>>;
}

const MapEvents = () => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      // Initialize map event handlers if needed
    }
  }, [map]);
  
  return null;
};

const TerrainMapSelector: React.FC<TerrainMapSelectorProps> = ({
  polygonCoordinates,
  setPolygonCoordinates
}) => {
  const [mapInitialized, setMapInitialized] = useState(false);

  return (
    <div className="w-full">
      <MapContainer
        center={[-18.913684, 47.536131]}
        zoom={13}
        style={{ height: '400px', width: '100%' }}
        className="rounded-md border border-gray-200"
        whenReady={() => setMapInitialized(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polygon
          positions={polygonCoordinates}
          pathOptions={{ color: '#ff4444', weight: 2, fillOpacity: 0.5, fillColor: '#ff4444' }}
        />
        <MapEvents />
      </MapContainer>
      
      <div className="mt-2 text-sm text-gray-500">
        Pour définir le périmètre du terrain, vous pourrez utiliser les outils de dessin sur la carte.
      </div>
    </div>
  );
};

export default TerrainMapSelector;
