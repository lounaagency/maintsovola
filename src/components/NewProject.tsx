
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AgriculturalProject } from "@/types/agriculturalProject";
import { toast } from "sonner";
import ProjectForm from "./ProjectForm";

interface NewProjectProps {
  onProjectCreated?: (project: AgriculturalProject) => void;
}

const NewProject: React.FC<NewProjectProps> = ({ onProjectCreated }) => {
  const { user, profile } = useAuth();

  const handleSubmit = async (data: any) => {
    if (!user) {
      toast.error("Vous devez être connecté pour créer un projet");
      return;
    }
    
    try {
      // Get terrain and culture details for better project data
      const { data: terrainData, error: terrainError } = await supabase
        .from('terrain')
        .select('*')
        .eq('id_terrain', data.id_terrain)
        .single();
        
      if (terrainError) throw terrainError;
      
      // Create the project
      const { data: projetData, error: projetError } = await supabase
        .from('projet')
        .insert({
          titre: data.titre,
          id_terrain: data.id_terrain,
          id_tantsaha: terrainData.id_tantsaha || user.id,
          surface_ha: data.surface_ha,
          statut: 'en attente',
          id_region: data.id_region,
          id_district: data.id_district,
          id_commune: data.id_commune,
          description: data.description,
          photos: data.photos
        })
        .select('id_projet')
        .single();
        
      if (projetError) throw projetError;
      
      // Create projet_culture entries for each selected culture
      const projetCulturePromises = data.cultures.map(async (cultureId: number) => {
        const { data: cultureData } = await supabase
          .from('culture')
          .select('*')
          .eq('id_culture', cultureId)
          .single();
          
        const { error: projetCultureError } = await supabase
          .from('projet_culture')
          .insert({
            id_projet: projetData.id_projet,
            id_culture: cultureId,
            cout_exploitation_previsionnel: cultureData?.cout_exploitation_ha || 0,
            rendement_previsionnel: cultureData?.rendement_ha || 0,
            date_debut_previsionnelle: new Date().toISOString().split('T')[0]
          });
          
        if (projetCultureError) throw projetCultureError;
      });
      
      await Promise.all(projetCulturePromises);
      
      // Create project object for callback
      const newProject: AgriculturalProject = {
        id: projetData.id_projet.toString(),
        title: data.titre || `Projet agricole sur ${terrainData.nom_terrain || 'terrain ' + terrainData.id_terrain}`,
        farmer: {
          id: terrainData.id_tantsaha || user.id,
          name: profile ? `${profile.nom} ${profile.prenoms || ''}`.trim() : 'Utilisateur',
          username: profile ? profile.nom.toLowerCase().replace(/\s+/g, '') : 'utilisateur',
          avatar: profile?.photo_profil,
        },
        location: {
          region: terrainData.id_region ? "Région " + terrainData.id_region : "À définir",
          district: terrainData.id_district ? "District " + terrainData.id_district : "À définir",
          commune: terrainData.id_commune ? "Commune " + terrainData.id_commune : "À définir"
        },
        cultivationArea: data.surface_ha,
        cultivationType: data.cultures.length > 0 ? "Cultures multiples" : "À définir",
        farmingCost: data.financialSummary.totalCost,
        expectedYield: 0,
        expectedRevenue: data.financialSummary.totalRevenue,
        creationDate: new Date().toISOString().split('T')[0],
        images: data.photos ? data.photos.split(',').filter((p: string) => p) : [],
        description: data.description,
        fundingGoal: data.financialSummary.totalCost,
        currentFunding: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        status: 'en_attente'
      };
      
      if (onProjectCreated) {
        onProjectCreated(newProject);
      }
      
      toast.success("Projet créé avec succès!");
    } catch (error) {
      console.error("Erreur lors de la création du projet:", error);
      toast.error("Erreur lors de la création du projet");
    }
  };

  return (
    <Card className="mb-4 overflow-hidden border-border">
      <CardContent className="p-4">
        <ProjectForm onSubmit={handleSubmit} />
      </CardContent>
    </Card>
  );
};

export default NewProject;
