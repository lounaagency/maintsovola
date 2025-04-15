
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AgriculturalProjectCard from '@/components/AgriculturalProjectCard';
import { AgriculturalProject } from '@/types/agriculturalProject';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

const ProjectDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const idFromParams = id || searchParams.get('id');
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<AgriculturalProject | null>(null);
  
  useEffect(() => {
    if (!idFromParams) {
      navigate('/projects');
      return;
    }
    
    fetchProjectDetails(idFromParams);
  }, [idFromParams, navigate]);
  
  const fetchProjectDetails = async (projectId: string) => {
    try {
      setIsLoading(true);
      
      const { data: projectData, error } = await supabase
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
        .eq('id_projet', projectId)
        .single();
      
      if (error) throw error;
      
      // Fetch current funding
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('investissement')
        .select('montant')
        .eq('id_projet', projectId);
        
      if (investmentsError) throw investmentsError;
      
      const totalFunding = investmentsData.reduce((sum, inv) => sum + (inv.montant || 0), 0);
      
      // Format project data for AgriculturalProjectCard
      const formattedProject: AgriculturalProject = {
        id: projectData.id_projet.toString(),
        title: projectData.titre || 'Projet agricole',
        farmer: {
          id: projectData.utilisateur_tantsaha?.id_utilisateur || '',
          name: `${projectData.utilisateur_tantsaha?.nom || ''} ${projectData.utilisateur_tantsaha?.prenoms || ''}`,
          username: projectData.utilisateur_tantsaha?.nom || '',
          avatar: projectData.utilisateur_tantsaha?.photo_profil || ''
        },
        location: {
          region: projectData.region?.nom_region || '',
          district: projectData.district?.nom_district || '',
          commune: projectData.commune?.nom_commune || ''
        },
        cultivationArea: projectData.terrain?.surface_validee || 0,
        cultivationType: projectData.projet_culture?.map(pc => pc.culture?.nom_culture).join(', ') || '',
        farmingCost: projectData.cout_exploitation || 0,
        expectedYield: projectData.rendement_attendu || 0,
        expectedRevenue: projectData.revenu_attendu || 0,
        creationDate: new Date(projectData.created_at).toLocaleDateString('fr-FR'),
        images: projectData.photos || [],
        description: projectData.description || '',
        fundingGoal: projectData.objectif_financement || 0,
        currentFunding: totalFunding || 0,
        likes: 0,
        comments: 0,
        shares: 0,
        technicianId: projectData.id_technicien || undefined,
        status: projectData.statut || 'en_attente'
      };
      
      setProject(formattedProject);
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error);
      toast.error('Impossible de charger les détails du projet');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLikeToggle = (isLiked: boolean) => {
    // Cette fonction pourrait être implémentée plus tard pour gérer les likes
    console.log('Toggle like:', isLiked);
  };
  
  return (
    <div className="container max-w-3xl py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
          <span>Retour</span>
        </Button>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Détails du projet</h1>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : project ? (
        <AgriculturalProjectCard 
          project={project} 
          onLikeToggle={handleLikeToggle} 
        />
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl mb-2">Projet introuvable</h2>
          <p className="text-muted-foreground mb-6">
            Le projet que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <Button onClick={() => navigate('/projects')}>
            Voir tous les projets
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
