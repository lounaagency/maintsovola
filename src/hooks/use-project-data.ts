
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AgriculturalProject } from '@/types/agriculturalProject';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export type ProjectFilter = {
  projectId?: string | number;
  userId?: string;
  followedUsersOnly?: boolean;
  status?: string;
  region?: string;
  district?: string;
  commune?: string;
  culture?: string;
}

export const useProjectData = (filters: ProjectFilter = {}) => {
  const [projects, setProjects] = useState<AgriculturalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const toggleLike = async (projectId: string, isCurrentlyLiked: boolean) => {
    if (!user) {
      toast.error("Vous devez être connecté pour aimer un projet");
      return;
    }
    
    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from('aimer_projet')
          .delete()
          .match({ 
            id_projet: parseInt(projectId), 
            id_utilisateur: user.id 
          });
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('aimer_projet')
          .insert({ 
            id_projet: parseInt(projectId), 
            id_utilisateur: user.id 
          });
          
        if (error) throw error;
      }
      
      setProjects(projects.map(project => {
        if (project.id === projectId) {
          return {
            ...project,
            likes: isCurrentlyLiked ? project.likes - 1 : project.likes + 1,
            isLiked: !isCurrentlyLiked
          };
        }
        return project;
      }));
    } catch (error) {
      console.error("Erreur lors de la gestion du like:", error);
      toast.error("Erreur lors de la gestion du like");
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('vue_projet_detaille')
        .select(`
          id_projet,
          titre,
          description,
          surface_ha,
          statut,
          created_at,
          id_tantsaha,
          id_commune,
          id_technicien,
          nom_tantsaha,
          prenoms_tantsaha,
          photo_profil,
          nom_commune,
          nom_district,
          nom_region,
          cultures,
          cout_total,
          revenu_total,
          rendement_total,
          rendements_detail,
          montant_investi,
          gap_a_financer,
          est_finance_completement,
          nombre_likes,
          nombre_commentaires
        `);

      // Apply specific project ID filter
      if (filters.projectId) {
        query = query.eq('id_projet', parseInt(String(filters.projectId)));
      }

      // Apply user ID filter (for profile view)
      if (filters.userId) {
        query = query.eq('id_tantsaha', filters.userId);
      }

      // Apply status filter
      if (filters.status) {
        query = query.eq('statut', filters.status);
      } else {
        // Default to "en financement" if no status is specified
        query = query.eq('statut', 'en financement');
      }

      // Apply regional filters
      if (filters.region) {
        query = query.eq('nom_region', filters.region);
      }
      
      if (filters.district) {
        query = query.eq('nom_district', filters.district);
      }
      
      if (filters.commune) {
        query = query.eq('nom_commune', filters.commune);
      }

      // Always order by creation date (newest first)
      query = query.order('created_at', { ascending: false });

      let { data: projetsData, error: projetsError } = await query;

      if (projetsError) throw projetsError;

      // Filter by followed users if requested
      if (filters.followedUsersOnly && user) {
        const { data: followedUsers, error: followedError } = await supabase
          .from('abonnement')
          .select('id_suivi')
          .eq('id_abonne', user.id);
          
        if (followedError) throw followedError;
        
        if (followedUsers && followedUsers.length > 0) {
          const followedIds = followedUsers.map(f => f.id_suivi);
          projetsData = projetsData?.filter(projet => followedIds.includes(projet.id_tantsaha)) || [];
        } else {
          // If user doesn't follow anyone, return empty array
          projetsData = [];
        }
      }

      // Apply culture filter if specified - IMPROVED LOGIC
      if (filters.culture && projetsData) {
        console.log('🌾 Culture filter applied:', filters.culture);
        console.log('📊 Projects before culture filter:', projetsData.length);
        
        const cultureFilter = filters.culture.toLowerCase().trim();
        projetsData = projetsData.filter(projet => {
          if (!projet.cultures) {
            console.log('❌ Project has no cultures:', projet.id_projet);
            return false;
          }
          
          const projectCultures = projet.cultures.toLowerCase().trim();
          console.log(`🔍 Comparing filter "${cultureFilter}" with project cultures "${projectCultures}" for project ${projet.id_projet}`);
          
          // Improved matching: exact match or contains as word
          const matches = projectCultures === cultureFilter || 
                         projectCultures.includes(cultureFilter) ||
                         cultureFilter.includes(projectCultures);
          
          console.log(`✅ Match result for project ${projet.id_projet}:`, matches);
          return matches;
        });
        
        console.log('📊 Projects after culture filter:', projetsData.length);
      }

      // Transform projects to match our application's AgriculturalProject interface
      const transformedProjects: AgriculturalProject[] = (projetsData || []).map(projet => {
        const totalFarmingCost = projet.cout_total;
        const expectedYieldLabel = projet.rendements_detail || "N/A";
        const totalEstimatedRevenue = projet.revenu_total;
        const totalProfit = totalEstimatedRevenue - totalFarmingCost;
  
        const farmer = {
          id: projet.id_tantsaha,
          name: `${projet.nom_tantsaha} ${projet.prenoms_tantsaha || ''}`.trim(),
          username: projet.nom_tantsaha?.toLowerCase()?.replace(/\s+/g, '') || "",
          avatar: projet.photo_profil,
        };
  
        const likes = projet.nombre_likes || 0;
        const commentCount = projet.nombre_commentaires || 0;
  
        const locationRegion = projet.nom_region || "Non spécifié";
        const locationDistrict = projet.nom_district || "Non spécifié";
        const locationCommune = projet.nom_commune || "Non spécifié";
        const cultivationType = projet.cultures || "Non spécifié";

        return {
          id: projet.id_projet.toString(),
          title: projet.titre || `Projet de culture de ${projet.cultures}`,
          description: projet.description || `Projet de culture de ${projet.cultures} sur un terrain de ${projet.surface_ha} hectares.`,
          farmer,
          location: {
            region: locationRegion,
            district: locationDistrict,
            commune: locationCommune,
          },
          cultivationArea: projet.surface_ha,
          farmingCost: totalFarmingCost,
          expectedYield: expectedYieldLabel,
          expectedRevenue: totalEstimatedRevenue,
          cultivationType: cultivationType,
          totalProfit: totalProfit,
          creationDate: new Date(projet.created_at).toISOString().split('T')[0],
          fundingGoal: totalFarmingCost,
          currentFunding: projet.montant_investi || 0,
          gapToFinance: projet.gap_a_financer || 0,
          isFullyFunded: projet.est_finance_completement || false,
          likes,
          comments: commentCount,
          shares: 0,
          images: [], // Default empty array for images
          isLiked: false, // Default value, will be updated if needed
          status: projet.statut as AgriculturalProject['status'],
          technicianId: projet.id_technicien,
          cultures: projet.cultures,
        };
      });
      
      // Check if user has liked any of these projects
      if (user && transformedProjects.length > 0) {
        // Get the IDs of all projects
        const projectIds = transformedProjects.map(project => parseInt(project.id));
        
        // Fetch likes for these projects made by the current user
        const { data: userLikes, error: likesError } = await supabase
          .from('aimer_projet')
          .select('id_projet')
          .eq('id_utilisateur', user.id)
          .in('id_projet', projectIds);
          
        if (likesError) throw likesError;
        
        // Create a set of liked project IDs for faster lookup
        const likedProjectIds = new Set(userLikes?.map(like => like.id_projet.toString()) || []);
        
        // Update the isLiked property for each project
        const updatedProjects = transformedProjects.map(project => ({
          ...project,
          isLiked: likedProjectIds.has(project.id)
        }));
        
        setProjects(updatedProjects);
      } else {
        setProjects(transformedProjects);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des projets:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      toast.error("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [
    filters.projectId,
    filters.userId,
    filters.followedUsersOnly,
    filters.status,
    filters.region,
    filters.district,
    filters.commune,
    filters.culture
  ]);

  return {
    projects,
    loading,
    error,
    toggleLike,
    refetch: fetchProjects
  };
};
