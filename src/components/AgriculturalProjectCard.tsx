
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MessageCircle, Heart, Share } from "lucide-react";
import { AgriculturalProject } from "@/types/agriculturalProject";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import MessageDialog from "./MessageDialog";

interface AgriculturalProjectCardProps {
  project: AgriculturalProject;
  onLikeToggle?: (isLiked: boolean) => void;
}

const AgriculturalProjectCard: React.FC<AgriculturalProjectCardProps> = ({
  project,
  onLikeToggle,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(project.isLiked || false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState<number>(
    Math.max(0, project.fundingGoal - project.currentFunding)
  );
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  
  // Calculate the funding percentage safely
  const fundingPercentage = project.fundingGoal > 0
    ? Math.min(Math.round((project.currentFunding / project.fundingGoal) * 100), 100)
    : 0;

  // Calculate the remaining gap for investment
  const remainingGap = Math.max(0, project.fundingGoal - project.currentFunding);

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (onLikeToggle) {
      onLikeToggle(isLiked);
    }
  };

  const handleInvestmentSliderChange = (value: number[]) => {
    setInvestmentAmount(value[0]);
  };

  const handleInvestmentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setInvestmentAmount(Math.min(Math.max(0, value), remainingGap));
    } else {
      setInvestmentAmount(0);
    }
  };

  const handleInvestmentSubmit = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour investir",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('investissement')
        .insert({
          id_projet: parseInt(project.id),
          id_utilisateur: user.id,
          montant: investmentAmount,
          date_investissement: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Succès",
        description: `Votre investissement de ${investmentAmount.toLocaleString()} Ar a été enregistré`,
        variant: "default",
      });
      
      setIsInvestModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de l'investissement:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de votre investissement",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden mr-3">
                {project.farmer.avatar && (
                  <img 
                    src={project.farmer.avatar} 
                    alt={typeof project.farmer.name === 'string' ? project.farmer.name : 'Farmer'} 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <div className="font-medium">
                  {project.farmer.name}
                </div>
                <div className="text-xs text-gray-500">
                  {project.creationDate}
                </div>
              </div>
            </div>
            {project.technicienId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMessageDialogOpen(true)}
              >
                Contacter
              </Button>
            )}
          </div>
          
          <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
          
          <div className="text-sm text-gray-600 mb-3">
            {project.description}
          </div>

          <div className="space-y-2 mb-3 text-sm">
            <div className="flex justify-between">
              <span>Culture:</span>
              <span className="font-medium">{project.cultivationType}</span>
            </div>
            <div className="flex justify-between">
              <span>Surface:</span>
              <span className="font-medium">{project.cultivationArea} ha</span>
            </div>
            <div className="flex justify-between">
              <span>Location:</span>
              <span className="font-medium">{project.location.commune}, {project.location.district}</span>
            </div>
            <div className="flex justify-between">
              <span>Région:</span>
              <span className="font-medium">{project.location.region}</span>
            </div>
          </div>

          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-sm">
              <span>Financement:</span>
              <span className="font-medium text-sm">{String(fundingPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${fundingPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs">
              <span>{project.currentFunding.toLocaleString()} Ar</span>
              <span>{project.fundingGoal.toLocaleString()} Ar</span>
            </div>
          </div>

          <div className="space-y-2 mb-3 text-sm">
            <div className="flex justify-between">
              <span>Coût d'exploitation:</span>
              <span className="font-medium">{project.farmingCost.toLocaleString()} Ar/ha</span>
            </div>
            <div className="flex justify-between">
              <span>Rendement attendu:</span>
              <span className="font-medium">{project.expectedYield} tonnes/ha</span>
            </div>
            <div className="flex justify-between">
              <span>Revenus attendus:</span>
              <span className="font-medium">{project.expectedRevenue.toLocaleString()} Ar</span>
            </div>
          </div>

          <Button 
            className="w-full" 
            onClick={() => setIsInvestModalOpen(true)}
            disabled={fundingPercentage >= 100}
          >
            {fundingPercentage >= 100 ? "Financement complet" : "Investir"}
          </Button>

          <Dialog open={isInvestModalOpen} onOpenChange={setIsInvestModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Investir dans ce projet</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Montant de l'investissement (Ar)
                  </label>
                  <Input 
                    type="number"
                    value={investmentAmount}
                    onChange={handleInvestmentAmountChange}
                    min={0}
                    max={remainingGap}
                  />
                  <Slider 
                    value={[investmentAmount]} 
                    max={remainingGap} 
                    step={1000}
                    onValueChange={handleInvestmentSliderChange}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0 Ar</span>
                    <span>{remainingGap.toLocaleString()} Ar</span>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsInvestModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleInvestmentSubmit}>
                    Confirmer l'investissement
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between p-4 pt-0 border-t">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLike}
          className={isLiked ? "text-red-500" : ""}
        >
          <Heart className="mr-1 h-4 w-4" />
          <span>{project.likes + (isLiked !== project.isLiked ? (isLiked ? 1 : -1) : 0)}</span>
        </Button>
        <Badge variant="outline" className="flex gap-1 items-center">
          <MessageCircle className="h-3.5 w-3.5" />
          <span>{project.comments}</span>
        </Badge>
        <Badge variant="outline" className="flex gap-1 items-center">
          <Share className="h-3.5 w-3.5" />
          <span>{project.shares}</span>
        </Badge>
      </CardFooter>
      
      {isMessageDialogOpen && project.technicienId && (
        <MessageDialog
          isOpen={isMessageDialogOpen}
          onClose={() => setIsMessageDialogOpen(false)}
          recipientId={project.technicienId}
          recipientName={`Technicien du projet ${project.title}`}
          recipientPhoto={undefined}
        />
      )}
    </Card>
  );
};

export { AgriculturalProjectCard };
