
import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewProject from "@/components/NewProject";
import { motion } from "framer-motion";
import { AgriculturalProject } from "@/types/agriculturalProject";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import AgriculturalProjectCard from '@/components/AgriculturalProjectCard';

const Feed: React.FC = () => {
  const [projects, setProjects] = useState<AgriculturalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<{
    culture?: string;
    region?: string;
    district?: string;
    commune?: string;
  }>({});
  const { user } = useAuth();
  
  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  useEffect(() => {
    fetchProjects();
  }, [activeFilters]);
  
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
          utilisateur!id_tantsaha(id_utilisateur, nom, prenoms, photo_profil),
          commune(nom_commune, district(nom_district, region(nom_region)))
        `)
        .order('created_at', { ascending: false });
      
      if (activeFilters.region) {
        query = query.eq('commune.district.region.nom_region', activeFilters.region);
      }
      
      if (activeFilters.district) {
        query = query.eq('commune.district.nom_district', activeFilters.district);
      }
      
      if (activeFilters.commune) {
        query = query.eq('commune.nom_commune', activeFilters.commune);
      }
        
      const { data: projetsData, error: projetsError } = await query;
        
      if (projetsError) {
        throw projetsError;
      }
      
      const { data: culturesData, error: culturesError } = await supabase
        .from('projet_culture')
        .select(`
          id_projet,
          id_culture,
          cout_exploitation_previsionnel,
          rendement_previsionnel,
          culture(nom_culture)
        `);
        
      if (culturesError) {
        throw culturesError;
      }
      
      let filteredCultures = culturesData;
      if (activeFilters.culture) {
        filteredCultures = culturesData.filter(
          pc => pc.culture && pc.culture.nom_culture === activeFilters.culture
        );
      }
      
      const { data: investissementsData, error: investissementsError } = await supabase
        .from('investissement')
        .select(`
          id_projet,
          montant
        `);
        
      if (investissementsError) {
        throw investissementsError;
      }
      
      const { data: likesData, error: likesError } = await supabase
        .from('aimer_projet')
        .select(`
          id_projet,
          id_utilisateur
        `);
        
      if (likesError) {
        throw likesError;
      }
      
      const { data: commentsCountData, error: commentsError } = await supabase
        .from('commentaire')
        .select('id_projet');
        
      if (commentsError) {
        throw commentsError;
      }
      
      const commentsCount: Record<string, number> = {};
      commentsCountData.forEach(comment => {
        const projectId = comment.id_projet.toString();
        commentsCount[projectId] = (commentsCount[projectId] || 0) + 1;
      });
      
      let finalProjects = projetsData;
      if (activeFilters.culture) {
        const filteredProjectIds = filteredCultures.map(fc => fc.id_projet);
        finalProjects = projetsData.filter(
          project => filteredProjectIds.includes(project.id_projet)
        );
      }
      
      const transformedProjects = finalProjects.map(projet => {
        const projetCultures = culturesData.filter(pc => pc.id_projet === projet.id_projet);
        
        const currentFunding = investissementsData
          .filter(inv => inv.id_projet === projet.id_projet)
          .reduce((sum, inv) => sum + inv.montant, 0);
        
        const likes = likesData.filter(like => like.id_projet === projet.id_projet).length;
        
        const isLiked = user ? 
          likesData.some(like => like.id_projet === projet.id_projet && like.id_utilisateur === user.id) : 
          false;
        
        const commentCount = commentsCount[projet.id_projet.toString()] || 0;
        
        const cultivationType = projetCultures.length > 0 
          ? projetCultures[0].culture.nom_culture 
          : "Non spécifié";
        
        const farmingCost = projetCultures.length > 0 
          ? projetCultures[0].cout_exploitation_previsionnel || 0 
          : 0;
        
        const expectedYield = projetCultures.length > 0 
          ? projetCultures[0].rendement_previsionnel || 0 
          : 0;
        
        const expectedRevenue = expectedYield * projet.surface_ha * 1.5 * farmingCost;
        
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
        
        return {
          id: projet.id_projet.toString(),
          title: `Projet de culture de ${cultivationType}`,
          farmer,
          location: {
            region: projet.commune?.district?.region?.nom_region || "Non spécifié",
            district: projet.commune?.district?.nom_district || "Non spécifié",
            commune: projet.commune?.nom_commune || "Non spécifié"
          },
          cultivationArea: projet.surface_ha,
          cultivationType,
          farmingCost,
          expectedYield,
          expectedRevenue,
          creationDate: new Date(projet.created_at).toISOString().split('T')[0],
          images: [],
          description: `Projet de culture de ${cultivationType} sur un terrain de ${projet.surface_ha} hectares.`,
          fundingGoal: farmingCost * projet.surface_ha,
          currentFunding,
          likes,
          comments: commentCount,
          shares: 0,
          isLiked,
          technicienId: projet.id_technicien,
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
  
  const handleNewProject = (newProject: AgriculturalProject) => {
    setProjects(prevProjects => [newProject, ...prevProjects]);
    toast.success("Projet créé avec succès!");
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
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  const clearFilters = () => {
    setActiveFilters({});
  };
  
  // Animation variants
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

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Projets agricoles</h1>
      </header>
      
      <Tabs defaultValue="for-you" className="mb-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted rounded-lg">
          <TabsTrigger value="for-you" className="rounded-md">Pour vous</TabsTrigger>
          <TabsTrigger value="following" className="rounded-md">Abonnements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="for-you" className="mt-4">
          <NewProject onProjectCreated={handleNewProject} />
          
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
                            <Link to={`/profile/${project.farmer.id}`} className="hover:underline">
                              {project.farmer.name}
                            </Link>
                          )
                        },
                        cultivationType: (
                          <button 
                            className="text-primary hover:underline" 
                            onClick={() => applyFilter('culture', project.cultivationType as string)}
                          >
                            {project.cultivationType}
                          </button>
                        ),
                        location: {
                          region: (
                            <button 
                              className="text-primary hover:underline" 
                              onClick={() => applyFilter('region', project.location.region as string)}
                            >
                              {project.location.region}
                            </button>
                          ),
                          district: (
                            <button 
                              className="text-primary hover:underline" 
                              onClick={() => applyFilter('district', project.location.district as string)}
                            >
                              {project.location.district}
                            </button>
                          ),
                          commune: (
                            <button 
                              className="text-primary hover:underline" 
                              onClick={() => applyFilter('commune', project.location.commune as string)}
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
                    : "Aucun projet disponible pour le moment"}
                </div>
              )}
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="following" className="mt-4">
          <div className="flex items-center justify-center h-40 border rounded-lg border-dashed text-gray-500">
            Suivez des agriculteurs pour voir leurs projets
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Feed;
