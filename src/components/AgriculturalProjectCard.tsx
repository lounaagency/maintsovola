
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Heart, MessageCircle, Share, Edit, Info } from 'lucide-react';
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

interface AgriculturalProjectCardProps {
  project: AgriculturalProject;
  onLikeToggle: (isLiked: boolean) => void;
}

const AgriculturalProjectCard: React.FC<AgriculturalProjectCardProps> = ({ project, onLikeToggle }) => {
  const [liked, setLiked] = useState<boolean>(project.isLiked || false);
  const [showInvestModal, setShowInvestModal] = useState<boolean>(false);
  const [investAmount, setInvestAmount] = useState<number>(0);
  const { user, profile } = useAuth();
  const userRole = profile?.nom_role?.toLowerCase() || '';
  
  const isInvestor = userRole === 'investisseur';
  const isFarmer = userRole === 'agriculteur';
  const canInvest = isInvestor || isFarmer;
  
  const fundingGap = Math.max(0, project.fundingGoal - project.currentFunding);
  
  // Initialiser le montant d'investissement au gap restant lors de l'ouverture du modal
  const handleOpenInvestModal = () => {
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
      
      // Rafraîchir les données du projet (idéalement via un callback)
    } catch (error) {
      console.error("Erreur lors de l'investissement:", error);
      toast.error("Une erreur est survenue lors de l'enregistrement de votre investissement");
    }
  };
  
  const handleLike = () => {
    setLiked(!liked);
    onLikeToggle(liked);
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
            
            <Button variant={project.technicianId ? "default" : "destructive"} size="sm" className="ml-2 text-xs">
              {project.technicianId ? "Validé" : "En attente"}
            </Button>
          </div>
          
          <div className="mb-3">
            <h3 className="font-semibold text-base mb-1">{project.title}</h3>
            <p className="text-sm text-gray-700">{project.description}</p>
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
          
          {/* Affichage du financement */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Financement</span>
              <span className="font-medium">{formatCurrency(project.currentFunding)} / {formatCurrency(project.fundingGoal)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${Math.min(100, (project.currentFunding / project.fundingGoal) * 100)}%` }}
              ></div>
            </div>
          </div>
          
          {/* Boutons d'actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex space-x-2">
              <button 
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                onClick={handleLike}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{project.likes}</span>
              </button>
              
              <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-primary transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span>{project.comments}</span>
              </button>
              
              <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-primary transition-colors">
                <Share className="h-4 w-4" />
              </button>
            </div>
            
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
      </Card>
      
      {/* Modal d'investissement */}
      <Dialog open={showInvestModal} onOpenChange={setShowInvestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Investir dans ce projet</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <h4 className="font-medium mb-1">{project.title}</h4>
              <p className="text-sm text-gray-600">{project.description}</p>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Objectif de financement:</span>
                <span>{formatCurrency(project.fundingGoal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Déjà financé:</span>
                <span>{formatCurrency(project.currentFunding)}</span>
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
    </>
  );
};

export default AgriculturalProjectCard;
