import React, { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Heart, MessageCircle, Share, Edit, Info, Shield, Image, Map, BarChart, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
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
import FinancialDetailsDialog from './FinancialDetailsDialog';
import { ProjetCulture } from "@/types/culture";
import PaymentOptions from './PaymentOptions';
import TerrainCardDialog from './terrain/TerrainCardDialog';

interface AgriculturalProjectCardProps {
  project: AgriculturalProject;
  onLikeToggle: (isLiked: boolean) => void;
}
const AgriculturalProjectCard: React.FC<AgriculturalProjectCardProps> = ({
  project,
  onLikeToggle
}) => {
  const [liked, setLiked] = useState<boolean>(project.isLiked || false);
  const [showInvestModal, setShowInvestModal] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [showPhotos, setShowPhotos] = useState<boolean>(false);
  const [showFinancialDetails, setShowFinancialDetails] = useState<boolean>(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState<boolean>(false);
  const [investAmount, setInvestAmount] = useState<number>(0);
  const [currentFunding, setCurrentFunding] = useState<number>(project.currentFunding);
  const [fundingGap, setFundingGap] = useState<number>(Math.max(0, project.fundingGoal - project.currentFunding));
  const [projectPhotos, setProjectPhotos] = useState<string[]>([]);
  const [terrainPhotos, setTerrainPhotos] = useState<string[]>([]);
  const [displayedPhotos, setDisplayedPhotos] = useState<string[]>([]);
  const [terrainCoordinates, setTerrainCoordinates] = useState<number[][]>([]);
  const [projectDetails, setProjectDetails] = useState<{
    title: string | null;
    description: string | null;
  }>({
    title: null,
    description: null
  });
  const [projectCultures, setProjectCultures] = useState<ProjetCulture[]>([]);
  const [galleryTab, setGalleryTab] = useState<'photos' | 'map'>('photos');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [currentInvestmentId, setCurrentInvestmentId] = useState<number | null>(null);
  const [terrainName, setTerrainName] = useState<string>("");
  const [terrainId, setTerrainId] = useState<number | null>(null);
  const [terrainDialogOpen, setTerrainDialogOpen] = useState<boolean>(false);
  const [commentCount, setCommentCount] = useState<number>(project.comments);
  const {
    user,
    profile
  } = useAuth();
  const userRole = profile?.nom_role?.toLowerCase() || '';
  const isInvestor = userRole === 'investisseur';
  const isFarmer = userRole === 'agriculteur';
  const isSimpleUser = userRole === 'simple';
  const canInvest = isInvestor || isFarmer || isSimpleUser;
  const fetchProjectDetails = useCallback(async () => {
    try {
      const {
        data: projectData,
        error: projectError
      } = await supabase.from('projet').select(`
          photos, 
          id_terrain, 
          titre, 
          description,
          terrain:id_terrain(id_terrain, nom_terrain),
          projet_culture (
            id_projet_culture,
            id_culture,
            rendement_previsionnel,
            cout_exploitation_previsionnel,
            culture (
              id_culture,
              nom_culture,
              rendement_ha,
              cout_exploitation_ha,
              prix_tonne
            )
          )
        `).eq('id_projet', parseInt(project.id)).single();
      if (projectError) throw projectError;
      
      setProjectDetails({
        title: projectData.titre,
        description: projectData.description
      });
      
      // Set terrain information if available
      if (projectData.terrain) {
        setTerrainId(projectData.terrain.id_terrain);
        setTerrainName(projectData.terrain.nom_terrain || `Terrain #${projectData.terrain.id_terrain}`);
      }
      
      if (projectData.projet_culture) {
        setProjectCultures(projectData.projet_culture);
      }
      
      if (projectData.photos) {
        const photos = Array.isArray(projectData.photos) ? projectData.photos : typeof projectData.photos === 'string' ? projectData.photos.split(',') : [];
        setProjectPhotos(photos);
        setDisplayedPhotos(photos);
      }
      
      if (projectData.id_terrain) {
        const {
          data: terrainData,
          error: terrainError
        } = await supabase.from('terrain').select('photos, geom').eq('id_terrain', projectData.id_terrain).single();
        if (terrainError) throw terrainError;
        if (terrainData.photos) {
          const photos = Array.isArray(terrainData.photos) ? terrainData.photos : typeof terrainData.photos === 'string' ? terrainData.photos.split(',') : [];
          setTerrainPhotos(photos);
          if (photos.length > 0 && projectPhotos.length === 0) {
            setDisplayedPhotos(photos);
          }
        }
        if (terrainData.geom) {
          try {
            const geomData = typeof terrainData.geom === 'string' ? JSON.parse(terrainData.geom) : terrainData.geom;
            if (geomData && geomData.coordinates && geomData.coordinates[0]) {
              setTerrainCoordinates(geomData.coordinates[0]);
            }
          } catch (error) {
            console.error("Error parsing terrain geometry:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching project details:", error);
    }
  }, [project.id, projectPhotos]);
  const fetchCurrentFundingData = async () => {
    try {
      const {
        data: investmentsData,
        error
      } = await supabase.from('investissement').select('montant').eq('id_projet', parseInt(project.id));
      if (error) throw error;
      const totalFunding = investmentsData.reduce((sum, inv) => sum + (inv.montant || 0), 0);
      setCurrentFunding(totalFunding);
      setFundingGap(Math.max(0, project.fundingGoal - totalFunding));
    } catch (error) {
      console.error("Error fetching current funding data:", error);
      toast.error("Impossible de récupérer les données de financement actuelles");
    }
  };
  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);
  const handleOpenInvestModal = async () => {
    await fetchCurrentFundingData();
    setInvestAmount(fundingGap);
    setShowInvestModal(true);
    setShowPaymentOptions(false);
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
      const {
        data: investmentData,
        error: investmentError
      } = await supabase.from('investissement').insert({
        id_investisseur: user.id,
        id_projet: parseInt(project.id),
        montant: investAmount,
        date_decision_investir: new Date().toISOString().split('T')[0],
        statut_paiement: 'en attente' // Added status
      }).select('id_investissement');
      
      if (investmentError) throw investmentError;

      // Instead of directly notifying, now show payment options
      setShowInvestModal(false);
      setShowPaymentOptions(true);
      
      // Store the investment ID for the payment process
      if (investmentData && investmentData.length > 0) {
        setCurrentInvestmentId(investmentData[0].id_investissement);
      }
    } catch (error) {
      console.error("Erreur lors de l'investissement:", error);
      toast.error("Une erreur est survenue lors de l'enregistrement de votre investissement");
    }
  };

  const handlePaymentComplete = async (success: boolean, transactionId?: string) => {
    setShowPaymentOptions(false);
    
    if (success) {
      // Additional success handling if needed
      await fetchCurrentFundingData();

      // Envoyer des notifications aux parties prenantes du projet
      try {
        // Récupérer les informations du projet pour les notifications
        const { data: projectData, error: projectError } = await supabase
          .from('projet')
          .select('id_tantsaha, id_superviseur, id_technicien, titre')
          .eq('id_projet', parseInt(project.id))
          .single();

        if (projectError) throw projectError;

        if (projectData && user) {
          // Créer la liste des destinataires (propriétaire, superviseur, technicien)
          const recipients: { id_utilisateur: string }[] = [];
          
          if (projectData.id_tantsaha && projectData.id_tantsaha !== user.id) {
            recipients.push({ id_utilisateur: projectData.id_tantsaha });
          }
          if (projectData.id_superviseur && projectData.id_superviseur !== user.id) {
            recipients.push({ id_utilisateur: projectData.id_superviseur });
          }
          if (projectData.id_technicien && projectData.id_technicien !== user.id) {
            recipients.push({ id_utilisateur: projectData.id_technicien });
          }

          // Envoyer les notifications
          if (recipients.length > 0) {
            const { sendNotification } = await import('@/types/notification');
            await sendNotification(
              supabase,
              user.id,
              recipients,
              "Nouvel investissement reçu",
              `Un investissement de ${investAmount.toLocaleString()} Ar a été effectué sur le projet "${projectData.titre || 'Sans titre'}"`,
              'info',
              'projet',
              parseInt(project.id),
              parseInt(project.id)
            );
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'envoi des notifications:", error);
      }

      // Show success message with transaction ID if available
      if (transactionId) {
        toast.success(`Paiement effectué avec succès`, {
          description: `Référence de transaction: ${transactionId}`
        });
      }
    } else {
      // Payment failed but investment is still recorded
      toast.info("Votre investissement a été enregistré mais le paiement n'a pas été effectué", {
        description: "Vous pouvez effectuer le paiement ultérieurement dans votre profil"
      });
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    onLikeToggle(liked);
  };
  const handleToggleComments = () => {
    setShowComments(!showComments);
  };

  const handleCommentCountChange = (newCount: number) => {
    setCommentCount(newCount);
  };

  const handleOpenGallery = (initialTab: 'photos' | 'map' = 'photos') => {
    setGalleryTab(initialTab);
    setShowPhotos(true);
  };
  const handleOpenFinancialDetails = () => {
    setShowFinancialDetails(true);
  };
  const handlePhotoNavigation = (direction: 'next' | 'prev') => {
    const totalPhotos = displayedPhotos.length;
    if (totalPhotos <= 1) return;
    setCurrentPhotoIndex(prevIndex => {
      if (direction === 'next') {
        return (prevIndex + 1) % totalPhotos;
      } else {
        return (prevIndex - 1 + totalPhotos) % totalPhotos;
      }
    });
  };
  const handleOpenTerrainDialog = () => {
    if (terrainId) {
      setTerrainDialogOpen(true);
    }
  };
  const hasPhotos = displayedPhotos.length > 0;
  const hasMap = terrainCoordinates.length >= 3;
  const displayTitle = projectDetails.title || `Projet de culture de ${project.cultures}`;
  const displayDescription = projectDetails.description || `Projet de culture de ${typeof project.cultures === 'string' ? project.cultures : 'cultures'} sur un terrain de ${project.cultures} hectares.`;
  return <>
      <Card className="overflow-hidden mb-4">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <UserAvatar src={project.farmer?.avatar} alt={typeof project.farmer?.name === 'string' ? project.farmer.name : 'Agriculteur'} size="md" />
              <div className="ml-3">
                <div className="font-semibold text-sm text-gray-900">
                  {project.farmer?.name}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(project.creationDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-3">
            <h3 className="font-semibold text-base mb-1 text-maintso-500">{displayTitle}</h3>
            <p className="text-sm text-gray-700">{displayDescription}</p>
          </div>
          
          {displayedPhotos.length > 0 && <div className="mb-4 rounded-md overflow-hidden relative">
              <img src={displayedPhotos[currentPhotoIndex]} alt={`Photo du projet ${currentPhotoIndex + 1}`} className="w-full h-48 object-cover" />
              {displayedPhotos.length > 1 && <>
                  <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50" onClick={e => {
              e.stopPropagation();
              handlePhotoNavigation('prev');
            }}>
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </Button>
                  <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50" onClick={e => {
              e.stopPropagation();
              handlePhotoNavigation('next');
            }}>
                    <ChevronRight className="h-6 w-6 text-white" />
                  </Button>
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
                    {currentPhotoIndex + 1} / {displayedPhotos.length}
                  </div>
                </>}
            </div>}
          
          <div className="mb-4 flex gap-2">
            {hasPhotos && <Button variant="outline" size="sm" onClick={() => handleOpenGallery('photos')} className="flex-1 flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300">
                <Image className="h-4 w-4" />
                <span>Voir les photos</span>
              </Button>}
            
            {hasMap && <Button variant="outline" size="sm" onClick={() => handleOpenGallery('map')} className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300">
                <Map className="h-4 w-4" />
                <span>Voir sur la carte</span>
              </Button>}
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-xs">
              <span className="text-gray-500 block">Culture</span>
              <span className="font-medium">{project.cultivationType}</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500 block">Terrain</span>
              <span 
                className="font-medium underline cursor-pointer hover:text-green-700"
                onClick={handleOpenTerrainDialog}
              >
                {terrainName} ({project.cultivationArea} ha)
              </span>
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
          
          {project.technicianId && <div className="mb-4 bg-muted/30 p-2 rounded-md">
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-primary mr-2" />
                <span className="text-xs font-medium">Contactez votre technicien agricole pour plus de détails.</span>
              </div>
              <TechnicienContactLink technicienId={project.technicianId} variant="avatar" className="mt-1" />
            </div>}
          
          <div className="grid grid-cols-2 gap-3 mb-4 bg-muted/30 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleOpenFinancialDetails}>
            <div className="text-xs">
              <span className="text-gray-500 block">Coût d'exploitation</span>
              <span className="font-medium flex items-center">
                {formatCurrency(project.farmingCost)} 
                <ExternalLink className="h-3 w-3 ml-1 text-primary" />
              </span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500 block">Rendement prévu</span>
              <span className="font-medium flex items-center">
                {project.expectedYield} 
                <ExternalLink className="h-3 w-3 ml-1 text-primary" />
              </span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500 block">Revenu estimé</span>
              <span className="font-medium flex items-center">
                {formatCurrency(project.expectedRevenue)}
                <ExternalLink className="h-3 w-3 ml-1 text-primary" />
              </span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500 block">Bénéfice total</span>
              <span className="font-medium">{formatCurrency(project.totalProfit)}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Financement</span>
              <span className="font-medium">{formatCurrency(currentFunding)} / {formatCurrency(project.fundingGoal)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full" style={{
              width: `${Math.min(100, currentFunding / project.fundingGoal * 100)}%`
            }}></div>
            </div>
          </div>
          <ProjectActions projectId={project.id} likes={project.likes} comments={commentCount} shares={project.shares} isLiked={liked} onLikeToggle={handleLike} onOpenComments={handleToggleComments} onInvest={handleOpenInvestModal} fundingGap={fundingGap} canInvest={canInvest} onShare={() => {
          toast.info("Fonctionnalité de partage à venir");
        }} />            
        </div>
        
        {showComments && <CommentSection postId={project.id} onCommentCountChange={handleCommentCountChange} />}
      </Card>
      
      <Dialog open={showInvestModal} onOpenChange={setShowInvestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Investir dans ce projet</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <h4 className="font-medium mb-1">{displayTitle}</h4>
              <p className="text-sm text-gray-600">{displayDescription}</p>
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
                <Input id="invest-amount" type="number" min={0} max={fundingGap} value={investAmount} onChange={handleInvestAmountInput} className="mt-1" />
              </div>
              
              <div>
                <Label>Ajuster le montant</Label>
                <Slider defaultValue={[investAmount]} max={fundingGap} step={1000} onValueChange={handleInvestAmountChange} value={[investAmount]} className="mt-2" />
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
      
      <Dialog open={showPaymentOptions} onOpenChange={setShowPaymentOptions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paiement de l'investissement</DialogTitle>
          </DialogHeader>
          
          <PaymentOptions 
            investmentId={currentInvestmentId} 
            amount={investAmount}
            onPaymentComplete={handlePaymentComplete}
          />
        </DialogContent>
      </Dialog>
      
      <ProjectPhotosGallery isOpen={showPhotos} onClose={() => setShowPhotos(false)} photos={displayedPhotos} title={projectPhotos.length > 0 ? 'Photos du projet' : 'Photos du terrain'} terrainCoordinates={terrainCoordinates} initialTab={galleryTab} />
      
      <FinancialDetailsDialog isOpen={showFinancialDetails} onClose={() => setShowFinancialDetails(false)} projectCultures={projectCultures} />
      
      {terrainId && (
        <TerrainCardDialog
          isOpen={terrainDialogOpen}
          onClose={() => setTerrainDialogOpen(false)}
          terrainId={terrainId}
        />
      )}
    </>;
};
export default AgriculturalProjectCard;
