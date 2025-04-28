import React, { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { AgriculturalProject } from "@/types/agriculturalProject";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AgriculturalProjectCard from '@/components/AgriculturalProjectCard';

const Feed: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const projectId = searchParams.get('id_projet');
  const [projects, setProjects] = useState<AgriculturalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<{
    culture?: string;
    region?: string;
    district?: string;
    commune?: string;
  }>({});
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newFilters: {
      culture?: string;
      region?: string;
      district?: string;
      commune?: string;
    } = {};

    if (params.has('culture')) newFilters.culture = params.get('culture') || undefined;
    if (params.has('region')) newFilters.region = params.get('region') || undefined;
    if (params.has('district')) newFilters.district = params.get('district') || undefined;
    if (params.has('commune')) newFilters.commune = params.get('commune') || undefined;

    setActiveFilters(newFilters);
  }, [location.search]);
  
  if (!user) {
    return <Navigate to={`/auth${location.search}`} replace />;
  }
  
  useEffect(() => {
    fetchProjects();
  }, [activeFilters, projectId]);
  
  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('projet')
        .select(`
          id_projet,
          surface_ha,
          statut,
          created_at,
          id_tantsaha,
          id_commune,
          id_technicien,
          titre,
          description,
          utilisateur!id_tantsaha(id_utilisateur, nom, prenoms, photo_profil),
          commune(nom_commune, district(nom_district, region(nom_region)))
        `)
        .eq('statut', 'en financement')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('id_projet', parseInt(projectId));
      }
      
      // Apply filters directly in the query if they exist
      if (activeFilters.region) {
        query = query.eq('commune.district.region.nom_region', activeFilters.region);
      }
      
      if (activeFilters.district) {
        query = query.eq('commune.district.nom_district', activeFilters.district);
      }
      
      if (activeFilters.commune) {
        query = query.eq('commune.nom_commune', activeFilters.commune);
      }
      
      let { data: projetsData, error: projetsError } = await query;
      
      if (projetsError) throw projetsError;
      
      const { data: culturesData, error: culturesError } = await supabase
        .from('projet_culture')
        .select(`
          id_projet,
          id_culture,
          cout_exploitation_previsionnel,
          rendement_previsionnel,
          culture(nom_culture, prix_tonne,rendement_ha)
        `);
      if (culturesError) throw culturesError;

      const culturesByProjet: Record<number, typeof culturesData> = {};
      culturesData.forEach(pc => {
        if (!culturesByProjet[pc.id_projet]) culturesByProjet[pc.id_projet] = [];
        culturesByProjet[pc.id_projet].push(pc);
      });

      const { data: investissementsData, error: investissementsError } = await supabase
        .from('investissement')
        .select(`
          id_projet,
          montant
        `);
      if (investissementsError) throw investissementsError;

      const projectCurrentFundings: Record<number, number> = {};
      investissementsData.forEach(inv => {
        if (!projectCurrentFundings[inv.id_projet]) projectCurrentFundings[inv.id_projet] = 0;
        projectCurrentFundings[inv.id_projet] += inv.montant;
      });

      const { data: likesData, error: likesError } = await supabase
        .from('aimer_projet')
        .select(`
          id_projet,
          id_utilisateur
        `);
      if (likesError) throw likesError;

      const { data: commentsCountData, error: commentsError } = await supabase
        .from('commentaire')
        .select('id_projet');
      if (commentsError) throw commentsError;
      const commentsCount: Record<string, number> = {};
      commentsCountData.forEach(comment => {
        const projectId = comment.id_projet.toString();
        commentsCount[projectId] = (commentsCount[projectId] || 0) + 1;
      });

      // Apply culture filter separately if needed
      let filteredProjects = projetsData || [];
      if (activeFilters.culture && projetsData) {
        filteredProjects = projetsData.filter(projet => {
          const projetCultures = culturesByProjet[projet.id_projet] || [];
          return projetCultures.some(pc => 
            pc.culture?.nom_culture === activeFilters.culture
          );
        });
      }

      const transformedProjects = filteredProjects.map(projet => {
        const projetCultures = culturesByProjet[projet.id_projet] || [];

        const totalFarmingCost = projetCultures.reduce((sum, pc) => 
          sum + ((pc.cout_exploitation_previsionnel || 0)), 0);

        const yieldStrings = projetCultures.map(pc => {
          const nom = pc.culture?.nom_culture || "Non spécifié";
          const tonnage = pc.rendement_previsionnel != null ? pc.rendement_previsionnel : (pc.culture?.rendement_ha || 0) * (projet.surface_ha || 1);

          return `${Math.round(tonnage * 100) / 100} t de ${nom}`;
        });
        const expectedYieldLabel = yieldStrings.length > 0 ? yieldStrings.join(", ") : "N/A";

        const totalEstimatedRevenue = projetCultures.reduce((sum, pc) => {
          const rendement = pc.rendement_previsionnel || 0;
          const prixTonne = pc.culture?.prix_tonne || 0;
          return sum + (rendement *  prixTonne);
        }, 0);

        const totalProfit = totalEstimatedRevenue - totalFarmingCost;

        const cultivationTypes = projetCultures.map(pc => pc.culture?.nom_culture || "Non spécifié");
        const cultivationType = cultivationTypes.length > 0 ? cultivationTypes.join(", ") : "Non spécifié";
        
        const tantsaha = projet.utilisateur;
        const farmer = tantsaha ? {
          id: tantsaha.id_utilisateur,
          name: `${tantsaha.nom} ${tantsaha.prenoms || ''}`.trim(),
          username: tantsaha.nom.toLowerCase().replace(/\s+/g, ''),
          avatar: tantsaha.photo_profil,
        } : {
          id: "",
          name: "Utilisateur inconnu",
          username: "inconnu",
          avatar: undefined,
        };

        const likes = likesData.filter(like => like.id_projet === projet.id_projet).length;
        const isLiked = user ? 
          likesData.some(like => like.id_projet === projet.id_projet && like.id_utilisateur === user.id) : 
          false;
        const commentCount = commentsCount[projet.id_projet.toString()] || 0;

        const locationRegion = projet.commune?.district?.region?.nom_region || "Non spécifié";
        const locationDistrict = projet.commune?.district?.nom_district || "Non spécifié";
        const locationCommune = projet.commune?.nom_commune || "Non spécifié";

        return {
          id: projet.id_projet.toString(),
          title: projet.titre || `Projet de culture de ${cultivationType}`,
          description: projet.description || `Projet de culture de ${cultivationType} sur un terrain de ${projet.surface_ha} hectares.`,
          farmer,
          location: {
            region: locationRegion,
            district: locationDistrict,
            commune: locationCommune
          },
          cultivationArea: projet.surface_ha,
          cultivationType,
          farmingCost: totalFarmingCost,
          expectedYield: expectedYieldLabel,
          expectedRevenue: totalEstimatedRevenue,
          totalProfit : totalProfit,
          creationDate: new Date(projet.created_at).toISOString().split('T')[0],
          images: [],
          fundingGoal: totalFarmingCost,
          currentFunding: projectCurrentFundings[projet.id_projet] || 0,
          likes,
          comments: commentCount,
          shares: 0,
          isLiked,
          technicianId: projet.id_technicien,
          _multiCultures: projetCultures,
        };
      });
      
      setProjects(transformedProjects);
    } catch (error) {
      console.error("Erreur lors de la récupération des projets:", error);
      toast.error("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleLike = async (projectId: string, isCurrentlyLiked: boolean) => {
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
  
  const applyFilter = (filterType: string, value: string) => {
    const updatedFilters = {
      ...activeFilters,
      [filterType]: value
    };
    setActiveFilters(updatedFilters);
    
    const currentParams = new URLSearchParams(location.search);
    currentParams.set(filterType, value);
    
    if (projectId) {
      currentParams.set('id_projet', projectId);
    }
    
    navigate(`${location.pathname}?${currentParams.toString()}`, { replace: true });
  };
  
  const clearFilters = () => {
    setActiveFilters({});
    
    if (projectId) {
      navigate(`${location.pathname}?id_projet=${projectId}`, { replace: true });
    } else {
      navigate(location.pathname, { replace: true });
    }
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 25 } }
  };

  const renderActiveFilters = () => {
    if (Object.keys(activeFilters).length === 0) return null;
    
    return (
      <div className="mb-4 p-2 bg-muted rounded-lg flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Filtres :</span>
        {Object.entries(activeFilters).map(([key, value]) => (
          <span 
            key={key} 
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground"
          >
            {key}: {value}
            <button 
              className="ml-1 rounded-full" 
              onClick={() => {
                const newFilters = {...activeFilters};
                delete newFilters[key as keyof typeof activeFilters];
                setActiveFilters(newFilters);
                
                const currentParams = new URLSearchParams(location.search);
                currentParams.delete(key);
                
                if (projectId) {
                  currentParams.set('id_projet', projectId);
                }
                
                navigate(`${location.pathname}?${currentParams.toString()}`, { replace: true });
              }}
            >
              ×
            </button>
          </span>
        ))}
        <button 
          className="text-xs text-muted-foreground hover:text-primary ml-auto"
          onClick={clearFilters}
        >
          Effacer tout
        </button>
      </div>
    );
  };
  
  const [followedProjects, setFollowedProjects] = useState<AgriculturalProject[]>([]);
  const [loadingFollowed, setLoadingFollowed] = useState(true);
  
  useEffect(() => {
    if (user) {
      fetchFollowedProjects();
    }
  }, [user]);
  
  const fetchFollowedProjects = async () => {
    if (!user) return;
    
    try {
      setLoadingFollowed(true);
      
      // First, get the list of users that the current user follows
      const { data: followedUsers, error: followedError } = await supabase
        .from('abonnement')
        .select('id_suivi')
        .eq('id_abonne', user.id);
        
      if (followedError) throw followedError;
      
      if (!followedUsers || followedUsers.length === 0) {
        setFollowedProjects([]);
        return;
      }
      
      const followedIds = followedUsers.map(f => f.id_suivi);
      
      // Then get the projects from these users
      let query = supabase
        .from('projet')
        .select(`
          id_projet,
          surface_ha,
          statut,
          created_at,
          id_tantsaha,
          id_commune,
          id_technicien,
          titre,
          description,
          utilisateur!id_tantsaha(id_utilisateur, nom, prenoms, photo_profil),
          commune(nom_commune, district(nom_district, region(nom_region)))
        `)
        .eq('statut', 'en financement')
        .in('id_tantsaha', followedIds)
        .order('created_at', { ascending: false });
      
      let { data: projetsData, error: projetsError } = await query;
      
      if (projetsError) throw projetsError;
      
      const { data: culturesData, error: culturesError } = await supabase
        .from('projet_culture')
        .select(`
          id_projet,
          id_culture,
          cout_exploitation_previsionnel,
          rendement_previsionnel,
          culture(nom_culture, prix_tonne,rendement_ha)
        `);
      if (culturesError) throw culturesError;

      const culturesByProjet: Record<number, typeof culturesData> = {};
      culturesData.forEach(pc => {
        if (!culturesByProjet[pc.id_projet]) culturesByProjet[pc.id_projet] = [];
        culturesByProjet[pc.id_projet].push(pc);
      });

      const { data: investissementsData, error: investissementsError } = await supabase
        .from('investissement')
        .select(`
          id_projet,
          montant
        `);
      if (investissementsError) throw investissementsError;

      const projectCurrentFundings: Record<number, number> = {};
      investissementsData.forEach(inv => {
        if (!projectCurrentFundings[inv.id_projet]) projectCurrentFundings[inv.id_projet] = 0;
        projectCurrentFundings[inv.id_projet] += inv.montant;
      });

      const { data: likesData, error: likesError } = await supabase
        .from('aimer_projet')
        .select(`
          id_projet,
          id_utilisateur
        `);
      if (likesError) throw likesError;

      const { data: commentsCountData, error: commentsError } = await supabase
        .from('commentaire')
        .select('id_projet');
      if (commentsError) throw commentsError;
      const commentsCount: Record<string, number> = {};
      commentsCountData.forEach(comment => {
        const projectId = comment.id_projet.toString();
        commentsCount[projectId] = (commentsCount[projectId] || 0) + 1;
      });

      // Apply culture filter separately if needed
      let filteredProjects = projetsData || [];
      if (activeFilters.culture && projetsData) {
        filteredProjects = projetsData.filter(projet => {
          const projetCultures = culturesByProjet[projet.id_projet] || [];
          return projetCultures.some(pc => 
            pc.culture?.nom_culture === activeFilters.culture
          );
        });
      }

      const transformedProjects = filteredProjects.map(projet => {
        const projetCultures = culturesByProjet[projet.id_projet] || [];

        const totalFarmingCost = projetCultures.reduce((sum, pc) => 
          sum + ((pc.cout_exploitation_previsionnel || 0)), 0);

        const yieldStrings = projetCultures.map(pc => {
          const nom = pc.culture?.nom_culture || "Non spécifié";
          const tonnage = pc.rendement_previsionnel != null ? pc.rendement_previsionnel : (pc.culture?.rendement_ha || 0) * (projet.surface_ha || 1);

          return `${Math.round(tonnage * 100) / 100} t de ${nom}`;
        });
        const expectedYieldLabel = yieldStrings.length > 0 ? yieldStrings.join(", ") : "N/A";

        const totalEstimatedRevenue = projetCultures.reduce((sum, pc) => {
          const rendement = pc.rendement_previsionnel || 0;
          const prixTonne = pc.culture?.prix_tonne || 0;
          return sum + (rendement *  prixTonne);
        }, 0);

        const totalProfit = totalEstimatedRevenue - totalFarmingCost;

        const cultivationTypes = projetCultures.map(pc => pc.culture?.nom_culture || "Non spécifié");
        const cultivationType = cultivationTypes.length > 0 ? cultivationTypes.join(", ") : "Non spécifié";
        
        const tantsaha = projet.utilisateur;
        const farmer = tantsaha ? {
          id: tantsaha.id_utilisateur,
          name: `${tantsaha.nom} ${tantsaha.prenoms || ''}`.trim(),
          username: tantsaha.nom.toLowerCase().replace(/\s+/g, ''),
          avatar: tantsaha.photo_profil,
        } : {
          id: "",
          name: "Utilisateur inconnu",
          username: "inconnu",
          avatar: undefined,
        };

        const likes = likesData.filter(like => like.id_projet === projet.id_projet).length;
        const isLiked = user ? 
          likesData.some(like => like.id_projet === projet.id_projet && like.id_utilisateur === user.id) : 
          false;
        const commentCount = commentsCount[projet.id_projet.toString()] || 0;

        const locationRegion = projet.commune?.district?.region?.nom_region || "Non spécifié";
        const locationDistrict = projet.commune?.district?.nom_district || "Non spécifié";
        const locationCommune = projet.commune?.nom_commune || "Non spécifié";

        return {
          id: projet.id_projet.toString(),
          title: projet.titre || `Projet de culture de ${cultivationType}`,
          description: projet.description || `Projet de culture de ${cultivationType} sur un terrain de ${projet.surface_ha} hectares.`,
          farmer,
          location: {
            region: locationRegion,
            district: locationDistrict,
            commune: locationCommune
          },
          cultivationArea: projet.surface_ha,
          cultivationType,
          farmingCost: totalFarmingCost,
          expectedYield: expectedYieldLabel,
          expectedRevenue: totalEstimatedRevenue,
          totalProfit : totalProfit,
          creationDate: new Date(projet.created_at).toISOString().split('T')[0],
          images: [],
          fundingGoal: totalFarmingCost,
          currentFunding: projectCurrentFundings[projet.id_projet] || 0,
          likes,
          comments: commentCount,
          shares: 0,
          isLiked,
          technicianId: projet.id_technicien,
          _multiCultures: projetCultures,
        };
      });
      
      setFollowedProjects(transformedProjects);
    } catch (error) {
      console.error("Erreur lors de la récupération des projets suivis:", error);
      toast.error("Erreur lors du chargement des projets suivis");
    } finally {
      setLoadingFollowed(false);
    }
  };

  return (
    <div className={`${isMobile ? 'w-full' : 'max-w-md'} mx-auto px-4 py-4`}>
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Projets en financement</h1>
      </header>
      
      <Tabs defaultValue="for-you" className="mb-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted rounded-lg">
          <TabsTrigger value="for-you" className="rounded-md">Pour vous</TabsTrigger>
          <TabsTrigger value="following" className="rounded-md">Abonnements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="for-you" className="mt-4">
          {renderActiveFilters()}
          
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <motion.div
              className="space-y-4"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {projects.length > 0 ? (
                projects.map((project) => (
                  <motion.div key={project.id} variants={item}>
                    <AgriculturalProjectCard 
                      project={{
                        ...project,
                        farmer: {
                          ...project.farmer,
                          name: (
                            <Link 
                              to={`/profile/${project.farmer.id}${projectId ? `?id_projet=${projectId}` : ''}`} 
                              className="hover:underline"
                            >
                              {project.farmer.name}
                            </Link>
                          )
                        },
                        cultivationType: (
                          <button 
                            className="text-primary hover:underline" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              applyFilter('culture', project.cultivationType as string);
                            }}
                          >
                            {project.cultivationType}
                          </button>
                        ),
                        location: {
                          region: (
                            <button 
                              className="text-primary hover:underline" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                applyFilter('region', project.location.region as string);
                              }}
                            >
                              {project.location.region}
                            </button>
                          ),
                          district: (
                            <button 
                              className="text-primary hover:underline" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                applyFilter('district', project.location.district as string);
                              }}
                            >
                              {project.location.district}
                            </button>
                          ),
                          commune: (
                            <button 
                              className="text-primary hover:underline" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                applyFilter('commune', project.location.commune as string);
                              }}
                            >
                              {project.location.commune}
                            </button>
                          )
                        }
                      }}
                      onLikeToggle={(isLiked) => handleToggleLike(project.id, isLiked)}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="flex items-center justify-center h-40 border rounded-lg border-dashed text-gray-500">
                  {Object.keys(activeFilters).length > 0 
                    ? "Aucun projet ne correspond à ces filtres" 
                    : "Aucun projet en financement disponible pour le moment"}
                </div>
              )}
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="following" className="mt-4">
          {loadingFollowed ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            followedProjects.length > 0 ? (
              <motion.div
                className="space-y-4"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {followedProjects.map((project) => (
                  <motion.div key={project.id} variants={item}>
                    <AgriculturalProjectCard 
                      project={{
                        ...project,
                        farmer: {
                          ...project.farmer,
                          name: (
                            <Link 
                              to={`/profile/${project.farmer.id}${projectId ? `?id_projet=${projectId}` : ''}`} 
                              className="hover:underline"
                            >
                              {project.farmer.name}
                            </Link>
                          )
                        },
                        cultivationType: (
                          <button 
                            className="text-primary hover:underline" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              applyFilter('culture', project.cultivationType as string);
                            }}
                          >
                            {project.cultivationType}
                          </button>
                        ),
                        location: {
                          region: (
                            <button 
                              className="text-primary hover:underline" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                applyFilter('region', project.location.region as string);
                              }}
                            >
                              {project.location.region}
                            </button>
                          ),
                          district: (
                            <button 
                              className="text-primary hover:underline" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                applyFilter('district', project.location.district as string);
                              }}
                            >
                              {project.location.district}
                            </button>
                          ),
                          commune: (
                            <button 
                              className="text-primary hover:underline" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                applyFilter('commune', project.location.commune as string);
                              }}
                            >
                              {project.location.commune}
                            </button>
                          )
                        }
                      }}
                      onLikeToggle={(isLiked) => handleToggleLike(project.id, isLiked)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-40 border rounded-lg border-dashed text-gray-500">
                Suivez des agriculteurs pour voir leurs projets
              </div>
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Feed;
