
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import ProjectPhotosGallery from "./ProjectPhotosGallery";
import FinancialDetailsDialog from "./FinancialDetailsDialog";
import { ProjetCulture } from "@/types/culture";

interface Culture {
  id_culture: number;
  nom_culture: string;
  cout_exploitation_ha: number;
  rendement_ha: number;
  prix_tonne: number;
}

interface AgriculturalProjectCardProps {
  id: number;
  title: string;
  region: string;
  district: string;
  terrain: string;
  statut: string;
  surface: number;
  cultures: ProjetCulture[];
  photos: string[];
  coordinates?: number[][];
  onClick?: () => void;
}

const AgriculturalProjectCard: React.FC<AgriculturalProjectCardProps> = ({
  id,
  title,
  region,
  district,
  terrain,
  statut,
  surface,
  cultures,
  photos,
  coordinates,
  onClick,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [financialDialogOpen, setFinancialDialogOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card click
    if (photos && photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    }
  };
  
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card click
    if (photos && photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    }
  };

  const totalBudget = cultures && cultures.length > 0 ? cultures.reduce((sum, culture) => {
    return sum + (culture.cout_exploitation_previsionnel || 
      (culture.surface_prevue && culture.culture?.cout_exploitation_ha 
        ? culture.surface_prevue * culture.culture.cout_exploitation_ha 
        : 0));
  }, 0) : 0;

  const hasFinancialData = cultures && cultures.length > 0;
  
  const statusColorMap: Record<string, string> = {
    "en attente": "bg-yellow-400 hover:bg-yellow-500",
    "en financement": "bg-blue-500 hover:bg-blue-600",
    "financé": "bg-green-500 hover:bg-green-600",
    "en cours": "bg-purple-500 hover:bg-purple-600",
    "terminé": "bg-gray-500 hover:bg-gray-600",
    "annulé": "bg-red-500 hover:bg-red-600",
  };

  // Safe status class determination
  const getStatusColorClass = (status: string | undefined) => {
    if (!status) return "bg-gray-500"; // Default if no status
    
    const normalizedStatus = status.toLowerCase();
    return statusColorMap[normalizedStatus] || "bg-gray-500";
  };

  return (
    <>
      <Card 
        className="h-full overflow-hidden flex flex-col transition-shadow hover:shadow-md cursor-pointer"
        onClick={onClick}
      >
        <div className="relative h-40 bg-gray-200 overflow-hidden">
          {photos && photos.length > 0 ? (
            <>
              <img 
                src={photos[currentPhotoIndex]} 
                alt={title} 
                className="w-full h-full object-cover"
              />
              
              {/* Navigation buttons on the photo */}
              {photos.length > 1 && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-5 w-5 text-white" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-5 w-5 text-white" />
                  </Button>
                  
                  {/* Photo counter */}
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
                    {currentPhotoIndex + 1} / {photos.length}
                  </div>
                </>
              )}
              
              <Button 
                variant="secondary"
                size="sm"
                className="absolute bottom-2 left-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setDialogOpen(true);
                }}
              >
                <Eye className="mr-1 h-3 w-3" />
                Voir les photos
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <p className="text-gray-400 text-sm">Aucune photo disponible</p>
            </div>
          )}
          
          <Badge className={`absolute top-2 right-2 ${getStatusColorClass(statut)}`}>
            {statut || "Non défini"}
          </Badge>
        </div>
        
        <CardContent className="flex-grow flex flex-col p-4">
          <div className="mb-2">
            <h3 className="font-semibold text-base truncate">{title || `Projet #${id}`}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="truncate">{region}, {district}</span>
            </div>
          </div>
          
          <div className="space-y-1 text-sm mt-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Terrain:</span>
              <span className="font-medium truncate max-w-[130px]">{terrain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Surface:</span>
              <span className="font-medium">{surface} ha</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cultures:</span>
              <span className="font-medium truncate max-w-[130px]">
                {cultures?.map(c => c.culture?.nom_culture).join(', ') || "Aucune culture"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Budget total:</span>
              <span className="font-medium">
                {hasFinancialData ? (
                  <button 
                    className="text-blue-600 hover:underline font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFinancialDialogOpen(true);
                    }}
                  >
                    {formatCurrency(totalBudget)}
                  </button>
                ) : (
                  formatCurrency(0)
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <ProjectPhotosGallery
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        photos={photos}
        title={title}
        terrainCoordinates={coordinates}
      />
      
      <FinancialDetailsDialog
        isOpen={financialDialogOpen}
        onClose={() => setFinancialDialogOpen(false)}
        projectCultures={cultures || []}
        title={`Détails financiers - ${title}`}
      />
    </>
  );
};

export default AgriculturalProjectCard;
