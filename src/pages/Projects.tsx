
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AgriculturalProjectCard from '@/components/AgriculturalProjectCard';
import { AgriculturalProject } from '@/types/agriculturalProject';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState<AgriculturalProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const navigate = useNavigate();
  
  useEffect(() => {
    if (projectId) {
      // Rediriger vers la page détaillée si un ID est fourni
      navigate(`/projects/${projectId}`);
    } else {
      fetchProjects();
    }
  }, [projectId, navigate]);
  
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('projet')
        .select(`
          *,
          utilisateur_tantsaha:id_tantsaha(id_utilisateur, nom, prenoms, photo_profil),
          commune:id_commune(nom_commune),
          district:id_district(nom_district),
          region:id_region(nom_region),
          terrain:id_terrain(*),
          projet_culture(id_culture, culture:id_culture(nom_culture, nom_vernaculaire, rendement_moyen)),
          technicien:id_technicien(id_utilisateur, nom, prenoms, photo_profil)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get funding information for each project
      const projectsWithFunding = await Promise.all(
        data.map(async (project) => {
          const { data: investmentsData, error: investmentsError } = await supabase
            .from('investissement')
            .select('montant')
            .eq('id_projet', project.id_projet);
            
          if (investmentsError) throw investmentsError;
          
          const totalFunding = investmentsData.reduce((sum, inv) => sum + (inv.montant || 0), 0);
          
          return {
            id: project.id_projet.toString(),
            title: project.titre || 'Projet agricole',
            farmer: {
              id: project.utilisateur_tantsaha?.id_utilisateur || '',
              name: `${project.utilisateur_tantsaha?.nom || ''} ${project.utilisateur_tantsaha?.prenoms || ''}`,
              username: project.utilisateur_tantsaha?.nom || '',
              avatar: project.utilisateur_tantsaha?.photo_profil || ''
            },
            location: {
              region: project.region?.nom_region || '',
              district: project.district?.nom_district || '',
              commune: project.commune?.nom_commune || ''
            },
            cultivationArea: project.terrain?.surface_validee || 0,
            cultivationType: project.projet_culture?.map(pc => pc.culture?.nom_culture).join(', ') || '',
            farmingCost: project.cout_exploitation || 0,
            expectedYield: project.rendement_attendu || 0,
            expectedRevenue: project.revenu_attendu || 0,
            creationDate: new Date(project.created_at).toLocaleDateString('fr-FR'),
            images: project.photos || [],
            description: project.description || '',
            fundingGoal: project.objectif_financement || 0,
            currentFunding: totalFunding || 0,
            likes: Math.floor(Math.random() * 50), // Placeholder, à remplacer par des données réelles
            comments: Math.floor(Math.random() * 10), // Placeholder, à remplacer par des données réelles
            shares: Math.floor(Math.random() * 5), // Placeholder, à remplacer par des données réelles
            technicianId: project.id_technicien || undefined,
            status: project.statut || 'en_attente'
          };
        })
      );
      
      setProjects(projectsWithFunding);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
      toast.error('Impossible de charger les projets');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLikeToggle = (isLiked: boolean) => {
    // Cette fonction pourrait être implémentée plus tard pour gérer les likes
    console.log('Toggle like:', isLiked);
  };
  
  return (
    <div className="container py-6 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projets agricoles</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchProjects}
          disabled={isLoading}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-md" />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map((project) => (
            <AgriculturalProjectCard 
              key={project.id} 
              project={project} 
              onLikeToggle={handleLikeToggle} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl mb-2">Aucun projet disponible</h2>
          <p className="text-muted-foreground">
            Il n'y a actuellement aucun projet agricole à afficher.
          </p>
        </div>
      )}
    </div>
  );
};

export default Projects;
