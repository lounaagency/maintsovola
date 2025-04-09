import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Heart, MessageCircle, Share, Edit, Info, Shield, Image, Map } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import UserAvatar from './UserAvatar';
import { Badge } from "@/components/ui/badge";
import { AgriculturalProject } from "@/types/agriculturalProject";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProjectActions from './ProjectActions';
import CommentSection from './CommentSection';
import TechnicienContactLink from './TechnicienContactLink';
import ProjectPhotosGallery from './ProjectPhotosGallery';

interface AgriculturalProjectCardProps {
  project: AgriculturalProject;
  onLikeToggle: (isLiked: boolean) => void;
}

const AgriculturalProjectCard: React.FC<AgriculturalProjectCardProps> = ({ project, onLikeToggle }) => {
  const [liked, setLiked] = useState<boolean>(project.isLiked || false);
  const [showInvestModal, setShowInvestModal] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [showPhotos, setShowPhotos] = useState<boolean>(false);
  const [investAmount, setInvestAmount] = useState<number>(0);
  const [currentFunding, setCurrentFunding] = useState<number>(project.currentFunding);
  const [fundingGap, setFundingGap] = useState<number>(Math.max(0, project.fundingGoal - project.currentFunding));
  const [projectPhotos, setProjectPhotos] = useState<string[]>([]);
  const [terrainPhotos, setTerrainPhotos] = useState<string[]>([]);
  const [displayedPhotos, setDisplayedPhotos] = useState<string[]>([]);
  const [polygonCoordinates, setPolygonCoordinates] = useState<[number, number][]>([]);
  const [projectTitle, setProjectTitle] = useState<string>(project.title as string);
  const [projectDescription, setProjectDescription] = useState<string>(project.description);
  const { user, profile } = useAuth();
  const userRole = profile?.nom_role?.toLowerCase() || '';
  
  const isInvestor = userRole === 'investisseur';
  const isFarmer = userRole === 'agriculteur';
  const isSimpleUser = userRole === 'simple';
  const canInvest = isInvestor || isFarmer || isSimpleUser;
  
  useEffect(() => {
    fetchPhotos();
  }, [project.id]);
  
  const fetchPhotos = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projet')
        .select('photos, id_terrain, geom, titre, description')
        .eq('id_projet', parseInt(project.id))
        .single();
      
      if (projectError) throw projectError;
      
      if (projectData.titre) {
        setProjectTitle(projectData.titre);
      }
      
      if (projectData.description) {
        setProjectDescription(projectData.description);
      }
      
      if (projectData.photos) {
        const photos = Array.isArray(projectData.photos) 
          ? projectData.photos 
          : typeof projectData.photos === 'string' 
            ? projectData.photos.split(',') 
            : [];
        
        setProjectPhotos(photos);
        setDisplayedPhotos(photos);
      } else if (projectData.id_terrain) {
        const { data: terrainData, error: terrainError } = await supabase
          .from('terrain')
          .select('photos, geom')
          .eq('id_terrain', projectData.id_terrain)
          .single();
        
        if (terrainError) throw terrainError;
        
        if (terrainData.photos) {
          const photos = Array.isArray(terrainData.photos) 
            ? terrainData.photos 
            : typeof terrainData.photos === 'string' 
              ? terrainData.photos.split(',') 
              : [];
          
          setTerrainPhotos(photos);
          setDisplayedPhotos(photos);
        }

        if (terrainData.geom) {
          extractPolygonCoordinates(terrainData.geom);
        }
      }
      
      if (projectData.geom) {
        extractPolygonCoordinates(projectData.geom);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    }
  };
  
  const extractPolygonCoordinates = (geom: any) => {
    try {
      const geomData = typeof geom === 'string' 
        ? JSON.parse(geom) 
        : geom;
        
      if (geomData && geomData.coordinates && geomData.coordinates[0]) {
        const coords = geomData.coordinates[0].map((coord: number[]) => 
          [coord[1], coord[0]] as [number, number]
        );
        setPolygonCoordinates(coords);
      }
    } catch (error) {
      console.error("Error parsing polygon geometry:", error);
    }
  };
  
  const fetchCurrentFundingData = async () => {
    try {
      const { data: investmentsData, error } = await supabase
        .from('investissement')
        .select('montant')
        .eq('id_projet', parseInt(project.id));
        
      if (error) throw error;
      
      const totalFunding = investmentsData.reduce((sum, inv) => sum + (inv.montant || 0), 0);
      setCurrentFunding(totalFunding);
      setFundingGap(Math.max(0, project.fundingGoal - totalFunding));
    } catch (error) {
      console.error("Error fetching current funding data:", error);
      toast.error("Impossible de récupérer les données de financement actuelles");
    }
  };
  
  const handleOpenInvestModal = async () => {
    await fetchCurrentFundingData();
    setInvestAmount(fundingGap);
    setShowInvestModal(true);
  };
  
  const handleInvestAmountChange = (value: number[]) => {
    setInvestAmount(value[0]);
  };
  
  const handleInvestAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      setInvestAmount(0);
    } else {
      setInvestAmount(Math.min(Math.max(0, value), fundingGap));
    }
  };
  
  const handleInvest = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour investir");
      return;
    }

    if (investAmount <= 0) {
      toast.error("Le montant de l'investissement doit être supérieur à 0");
      return;
    }

    try {
      const { error } = await supabase.from('investissement').insert({
        id_investisseur: user.id,
        id_projet: parseInt(project.id),
        montant: investAmount,
        date_decision_investir: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
      
      toast.success("Votre investissement a été enregistré avec succès");
      setShowInvestModal(false);
      
      await fetchCurrentFundingData();
    } catch (error) {
      console.error("Erreur lors de l'investissement:", error);
      toast.error("Une erreur est survenue lors de l'enregistrement de votre investissement");
    }
  };
  
  const handleLike = () => {
    setLiked(!liked);
    onLikeToggle(liked);
  };

  const handleToggleComments = () => {
    setShowComments(!showComments);
  };
  
  const hasPhotos = displayedPhotos.length > 0;
  const hasMap = polygonCoordinates.length > 2;
  
  const openPhotoGallery = (initialTab: 'photos' | 'map' = 'photos') => {
    setShowPhotos(true);
  };
  
  return (
    <>
      <Card className="overflow-hidden mb-4">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <UserAvatar 
                src={project.farmer?.avatar} 
                alt={typeof project.farmer?.name === 'string' ? project.farmer.name : 'Agriculteur'} 
                size="md" 
              />
              <div className="ml-3">
                <div className="font-semibold text-sm text-gray-900">
                  {project.farmer?.name}
                </div>
                <div className="text-xs text-gray-500">
                  {project.creationDate}
                </div>
              </div>
            </div>
            
            <div>
              <Button variant={project.technicianId ? "default" : "destructive"} size="sm" className="text-xs">
                {project.technicianId ? "Validé" : "En attente"}
              </Button>
            </div>
          </div>
          
          <div className="mb-3">
            <h3 className="font-semibold text-base mb-1">{projectTitle}</h3>
            <p className="text-sm text-gray-700">{projectDescription}</p>
          </div>
          
          {project.technicianId && (
            <div className="mb-4 bg-muted/30 p-2 rounded-md">
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-primary mr-2" />
                <span className="text-xs font-medium">Validé par:</span>
              </div>
              <TechnicienContactLink 
                technicienId={project.technicianId} 
                variant="avatar"
                className="mt-1"
              />
            </div>
          )}
          
          <div className="mb-4 flex space-x-2">
            {hasPhotos && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => openPhotoGallery('photos')}
              >
                <Image className="h-4 w-4" />
                <span>Voir les photos {projectPhotos.length > 0 ? 'du projet' : 'du terrain'}</span>
              </Button>
            )}
            
            {hasMap && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => openPhotoGallery('map')}
              >
                <Map className="h-4 w-4" />
                <span>Voir sur la carte</span>
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-xs">
              <span className="text-gray-500 block">Culture</span>
              <span className="font-medium">{project.cultivationType}</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500 block">Surface</span>
              <span className="font-medium">{project.cultivationArea} ha</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500 block">Localisation</span>
              <span className="font-medium">{project.location.commune}, {project.location.district}</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500 block">Région</span>
              <span className="font-medium">{project.location.region}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4 bg-muted/30 p-2 rounded-md">
            <div className="text-xs">
              <span className="text-gray-500 block">Coût d'exploitation</span>
              <span className="font-medium">{formatCurrency(project.farmingCost)} / ha</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500 block">Rendement prévu</span>
              <span className="font-medium">{project.expectedYield} t / ha</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500 block">Revenu estimé</span>
              <span className="font-medium">{formatCurrency(project.expectedRevenue)}</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500 block">Objectif financement</span>
              <span className="font-medium">{formatCurrency(project.fundingGoal)}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Financement</span>
              <span className="font-medium">{formatCurrency(currentFunding)} / {formatCurrency(project.fundingGoal)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${Math.min(100, (currentFunding / project.fundingGoal) * 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <ProjectActions 
              projectId={project.id}
              likes={project.likes}
              comments={project.comments}
              shares={project.shares}
              isLiked={liked}
              onLikeToggle={handleLike}
              onOpenComments={handleToggleComments}
              onShare={() => {
                toast.info("Fonctionnalité de partage à venir");
              }}
            />
            
            {canInvest && (
              <Button 
                size="sm" 
                className="text-xs" 
                onClick={handleOpenInvestModal}
                disabled={fundingGap === 0}
              >
                {fundingGap > 0 ? "S'investir" : "Financé"}
              </Button>
            )}
          </div>
        </div>
        
        {showComments && (
          <CommentSection postId={project.id} />
        )}
      </Card>
      
      <Dialog open={showInvestModal} onOpenChange={setShowInvestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Investir dans ce projet</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <h4 className="font-medium mb-1">{projectTitle}</h4>
              <p className="text-sm text-gray-600">{projectDescription}</p>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Objectif de financement:</span>
                <span>{formatCurrency(project.fundingGoal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Déjà financé:</span>
                <span>{formatCurrency(currentFunding)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Reste à financer:</span>
                <span>{formatCurrency(fundingGap)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="invest-amount">Montant de votre investissement</Label>
                <Input 
                  id="invest-amount" 
                  type="number"
                  min={0}
                  max={fundingGap}
                  value={investAmount}
                  onChange={handleInvestAmountInput}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Ajuster le montant</Label>
                <Slider
                  defaultValue={[investAmount]}
                  max={fundingGap}
                  step={1000}
                  onValueChange={handleInvestAmountChange}
                  value={[investAmount]}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>{formatCurrency(fundingGap)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvestModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleInvest} disabled={investAmount <= 0}>
              Confirmer l'investissement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ProjectPhotosGallery 
        isOpen={showPhotos}
        onClose={() => setShowPhotos(false)}
        photos={displayedPhotos}
        title={projectPhotos.length > 0 ? 'Photos du projet' : 'Photos du terrain'}
        polygonCoordinates={polygonCoordinates}
      />
    </>
  );
};

export default AgriculturalProjectCard;
