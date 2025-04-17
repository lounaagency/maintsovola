
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';

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
  title = 'Photos',
  terrainCoordinates = [],
  initialTab = 'photos'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'photos' | 'map'>(initialTab);
  
  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };
  
  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  };
  
  // Convert coordinates to LatLngTuple[] for Leaflet
  const polygonCoordinates: LatLngTuple[] = terrainCoordinates.map(
    coord => [coord[1], coord[0]] as LatLngTuple
  );
  
  // Calculate map center
  const calculateCenter = (): LatLngTuple => {
    if (polygonCoordinates.length === 0) {
      // Default to Madagascar's approximate center
      return [-18.9, 47.5];
    }
    
    const lats = polygonCoordinates.map(coord => coord[0]);
    const lngs = polygonCoordinates.map(coord => coord[1]);
    
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    
    return [centerLat, centerLng];
  };
  
  const mapCenter = calculateCenter();
  const hasMap = terrainCoordinates.length >= 3;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] min-h-[500px] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        {hasMap ? (
          <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as 'photos' | 'map')} className="flex flex-col h-full">
            <TabsList className="mx-4 mb-0">
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="map">Carte</TabsTrigger>
            </TabsList>
            
            <TabsContent value="photos" className="flex-1 relative mt-0">
              {photos.length > 0 ? (
                <>
                  <div className="w-full h-[400px] relative">
                    <img 
                      src={photos[currentIndex]} 
                      alt={`Photo ${currentIndex + 1}`} 
                      className="w-full h-full object-contain"
                    />
                    
                    {photos.length > 1 && (
                      <>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80"
                          onClick={handlePrevious}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80"
                          onClick={handleNext}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    {photos.length > 1
                      ? `Photo ${currentIndex + 1} sur ${photos.length}`
                      : 'Photo unique'
                    }
                  </div>
                </>
              ) : (
                <div className="w-full h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Aucune photo disponible</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="map" className="flex-1 mt-0">
              <div className="w-full h-[400px]">
                <MapContainer 
                  center={mapCenter} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {polygonCoordinates.length >= 3 && (
                    <Polygon 
                      positions={polygonCoordinates}
                      pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.2 }}
                    />
                  )}
                </MapContainer>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <>
            {photos.length > 0 ? (
              <div className="relative">
                <div className="w-full h-[400px] relative">
                  <img 
                    src={photos[currentIndex]} 
                    alt={`Photo ${currentIndex + 1}`} 
                    className="w-full h-full object-contain"
                  />
                  
                  {photos.length > 1 && (
                    <>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80"
                        onClick={handlePrevious}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80"
                        onClick={handleNext}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                
                <div className="p-2 text-center text-sm text-muted-foreground">
                  {photos.length > 1
                    ? `Photo ${currentIndex + 1} sur ${photos.length}`
                    : 'Photo unique'
                  }
                </div>
              </div>
            ) : (
              <div className="w-full h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground">Aucune photo disponible</p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProjectPhotosGallery;
