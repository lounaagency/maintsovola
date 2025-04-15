import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngExpression, LatLngTuple } from 'leaflet';

interface ProjectPhotosGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  title?: string;
  terrainCoordinates?: number[][];
  initialTab?: 'photos' | 'map';
}

const ProjectPhotosGallery: React.FC<ProjectPhotosGalleryProps> = ({
  isOpen,
  onClose,
  photos,
  title = "Photos",
  terrainCoordinates,
  initialTab = 'photos'
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'photos' | 'map'>(initialTab);
  
  // Reset to initial tab each time the dialog opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  
  const hasPhotos = photos && photos.length > 0;
  const hasMapData = terrainCoordinates && terrainCoordinates.length >= 3;
  
  // If no content is available, don't render the dialog
  if (!hasPhotos && !hasMapData) {
    return null;
  }
  
  const handlePrevious = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };
  
  const handleThumbnailClick = (index: number) => {
    setCurrentPhotoIndex(index);
  };
  
  // Transform coordinates for Leaflet (swap lat/lng)
  // Fix: Explicitly convert to LatLngTuple[] to satisfy TypeScript
  const polygonCoordinates: LatLngTuple[] = terrainCoordinates ? 
    terrainCoordinates.map(coord => [coord[1], coord[0]] as LatLngTuple) : 
    [];

  // Improved focus management
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Allow proper focus return before closing
      setTimeout(() => {
        onClose();
      }, 0);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {hasPhotos && hasMapData 
              ? "Naviguez entre les photos et la carte du terrain" 
              : hasPhotos 
                ? "Parcourez les photos du terrain" 
                : "Visualisez l'emplacement du terrain"}
          </DialogDescription>
        </DialogHeader>
        
        {hasPhotos && hasMapData ? (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'photos' | 'map')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="map">Carte</TabsTrigger>
            </TabsList>
            
            <TabsContent value="photos" className="mt-4">
              {renderPhotoContent()}
            </TabsContent>
            
            <TabsContent value="map" className="mt-4">
              {renderMapContent()}
            </TabsContent>
          </Tabs>
        ) : hasPhotos ? (
          renderPhotoContent()
        ) : (
          renderMapContent()
        )}
      </DialogContent>
    </Dialog>
  );
  
  function renderPhotoContent() {
    if (!hasPhotos) return null;
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-full h-[300px] md:h-[400px] my-4 bg-gray-100 rounded-md overflow-hidden">
          {/* Main photo display */}
          <img 
            src={photos[currentPhotoIndex]} 
            alt={`Photo ${currentPhotoIndex + 1}`}
            className="w-full h-full object-contain"
          />
          
          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </Button>
            </>
          )}
          
          {/* Photo counter */}
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
            {currentPhotoIndex + 1} / {photos.length}
          </div>
        </div>
        
        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {photos.map((photo, index) => (
              <div
                key={index}
                className={cn(
                  "w-16 h-16 cursor-pointer rounded-md overflow-hidden border-2",
                  index === currentPhotoIndex ? "border-primary" : "border-transparent"
                )}
                onClick={() => handleThumbnailClick(index)}
              >
                <img 
                  src={photo} 
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  function renderMapContent() {
    if (!hasMapData) return (
      <div className="flex items-center justify-center h-[300px] bg-muted rounded-md">
        <p className="text-muted-foreground">Aucune donnée de carte disponible</p>
      </div>
    );
    
    return (
      <div className="w-full h-[400px] my-4 bg-gray-100 rounded-md overflow-hidden">
        <MapContainer
          bounds={polygonCoordinates as any}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          attributionControl={true}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polygon 
            positions={polygonCoordinates}
            pathOptions={{ color: 'red', fillColor: '#f03', weight: 2, opacity: 0.7, fillOpacity: 0.3 }}
          />
        </MapContainer>
      </div>
    );
  }
};

export default ProjectPhotosGallery;
