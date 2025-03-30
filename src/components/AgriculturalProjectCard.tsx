
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { MessageCircle, Heart } from "lucide-react";
import { ProjectData } from "@/types/agriculturalProject";
import UserAvatar from "./UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AgriculturalProjectCardProps {
  project: ProjectData;
  onMessageClick?: (userId: string, userName: string) => void;
  onDetailsClick?: (project: ProjectData) => void;
  onInvestSuccess?: () => void;
}

const AgriculturalProjectCard: React.FC<AgriculturalProjectCardProps> = ({
  project,
  onMessageClick,
  onDetailsClick,
  onInvestSuccess,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(project.likes || 0);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState<number>(0);

  const coutTotal = project.cout_total || 0;
  const financementActuel = project.financement_actuel || 0;
  const gap = Math.max(0, coutTotal - financementActuel);
  const progressPercentage = coutTotal > 0 ? Math.min(100, (financementActuel / coutTotal) * 100) : 0;

  const handleLikeClick = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    // TODO: Implement like functionality with API
  };

  const handleMessageClick = () => {
    if (onMessageClick && project.agriculteur) {
      onMessageClick(
        project.agriculteur.id_utilisateur,
        `${project.agriculteur.nom} ${project.agriculteur.prenoms || ""}`
      );
    }
  };

  const handleInvestClick = () => {
    if (gap > 0) {
      setInvestmentAmount(gap);
      setShowInvestmentForm(true);
    } else {
      toast({
        title: "Financement complet",
        description: "Ce projet a déjà atteint son objectif de financement.",
      });
    }
  };

  const handleInvestmentSubmit = async () => {
    if (!user) {
      toast({
        title: "Non connecté",
        description: "Vous devez être connecté pour investir.",
        variant: "destructive",
      });
      return;
    }

    if (investmentAmount <= 0 || investmentAmount > gap) {
      toast({
        title: "Montant invalide",
        description: `Le montant doit être entre 1 et ${gap.toLocaleString()} Ar.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Save investment to database
      const { error } = await supabase.from("investissement").insert({
        id_investisseur: user.id,
        id_projet: project.id_projet,
        montant: investmentAmount,
        date_decision_investir: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Investissement réussi",
        description: `Vous avez investi ${investmentAmount.toLocaleString()} Ar dans ce projet.`,
        variant: "success",
      });

      setShowInvestmentForm(false);

      // Update the project's financement_actuel
      const { error: updateError } = await supabase
        .from("projet")
        .update({
          financement_actuel: (financementActuel + investmentAmount),
        })
        .eq("id_projet", project.id_projet);

      if (updateError) throw updateError;

      if (onInvestSuccess) {
        onInvestSuccess();
      }
    } catch (error) {
      console.error("Erreur lors de l'investissement:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'investissement.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Non spécifié";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <UserAvatar
              src={project.agriculteur?.photo_profil || ""}
              alt={project.agriculteur?.nom || ""}
              size="sm"
            />
            <div>
              <CardTitle className="text-base">
                {project.titre || `Projet #${project.id_projet}`}
              </CardTitle>
              <CardDescription>
                par {project.agriculteur?.nom} {project.agriculteur?.prenoms} •{" "}
                {formatDate(project.created_at)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Badge variant={project.statut === "en_financement" ? "default" : "outline"}>
              {project.statut === "en_attente"
                ? "En attente"
                : project.statut === "en_financement"
                ? "En financement"
                : project.statut === "en_production"
                ? "En production"
                : project.statut === "terminé"
                ? "Terminé"
                : "Statut inconnu"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {/* Project image or default image */}
        <div className="h-40 bg-muted rounded-md mb-3 overflow-hidden">
          <img
            src={project.image || "/placeholder.svg"}
            alt={project.titre || "Projet agricole"}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Project details */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="text-muted-foreground">Surface:</div>
            <div className="text-right font-medium">{project.surface_ha} ha</div>
            
            <div className="text-muted-foreground">Cultures:</div>
            <div className="text-right font-medium">
              {project.cultures?.map(c => c.nom_culture).join(", ") || "Non spécifié"}
            </div>
            
            <div className="text-muted-foreground">Cout total:</div>
            <div className="text-right font-medium">
              {coutTotal.toLocaleString()} Ar
            </div>
            
            <div className="text-muted-foreground">Rendement estimé:</div>
            <div className="text-right font-medium">
              {project.rendement_estime?.toLocaleString() || "Non spécifié"} Ar
            </div>
          </div>
          
          {(project.statut === "en_financement" || project.statut === "en_production") && (
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs">
                <span>Financement: {progressPercentage.toFixed(0)}%</span>
                <span>
                  {financementActuel.toLocaleString()} / {coutTotal.toLocaleString()} Ar
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-0">
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={handleLikeClick}>
            <Heart
              className={`h-4 w-4 mr-1 ${liked ? "fill-red-500 text-red-500" : ""}`}
            />
            <span>{likes.toString()}</span>
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleMessageClick}>
            <MessageCircle className="h-4 w-4 mr-1" />
            <span>Message</span>
          </Button>
        </div>
        
        <div className="flex space-x-2">
          {project.statut === "en_financement" && user && (
            <Button variant="default" size="sm" onClick={handleInvestClick}>
              Investir
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={() => onDetailsClick?.(project)}>
            Détails
          </Button>
        </div>
      </CardFooter>
      
      {showInvestmentForm && (
        <div className="px-4 pb-4 space-y-3 border-t pt-3">
          <h4 className="font-medium">Montant d'investissement</h4>
          
          <div className="space-y-4">
            <Input
              type="number"
              min={1}
              max={gap}
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Number(e.target.value))}
              className="w-full"
            />
            
            <Slider
              value={[investmentAmount]}
              min={0}
              max={gap}
              step={1000}
              onValueChange={(values) => setInvestmentAmount(values[0])}
              className="w-full"
            />
            
            <div className="flex justify-between text-sm">
              <span>Min: 0 Ar</span>
              <span>Max: {gap.toLocaleString()} Ar</span>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowInvestmentForm(false)}
              >
                Annuler
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleInvestmentSubmit}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AgriculturalProjectCard;
