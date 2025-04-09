
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Map, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface ProjectPhotosGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  title?: string;
  polygonCoordinates?: [number, number][];
}

const ProjectPhotosGallery: React.FC<ProjectPhotosGalleryProps> = ({
  isOpen,
  onClose,
  photos,
  title = "Photos",
  polygonCoordinates
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<string>(photos.length > 0 ? "photos" : "map");
  
  const handlePrevious = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };
  
  const handleThumbnailClick = (index: number) => {
    setCurrentPhotoIndex(index);
  };
  
  const hasPolygon = polygonCoordinates && polygonCoordinates.length > 2;
  const hasPhotos = photos && photos.length > 0;
  
  if (!hasPhotos && !hasPolygon) {
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger 
              value="photos" 
              disabled={!hasPhotos}
              className="flex items-center gap-2"
            >
              <Image className="w-4 h-4" />
              <span>Photos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="map" 
              disabled={!hasPolygon}
              className="flex items-center gap-2"
            >
              <Map className="w-4 h-4" />
              <span>Carte</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="photos" className="mt-0">
            {hasPhotos && (
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
            )}
          </TabsContent>
          
          <TabsContent value="map" className="mt-0">
            {hasPolygon && (
              <div className="w-full h-[400px] rounded-md overflow-hidden">
                <MapContainer
                  bounds={polygonCoordinates as any}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Polygon 
                    positions={polygonCoordinates as any}
                    pathOptions={{ color: 'red', fillColor: '#f03', weight: 2, opacity: 0.7, fillOpacity: 0.3 }}
                  />
                </MapContainer>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectPhotosGallery;
