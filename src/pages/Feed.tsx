
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgriculturalProjectCard from "@/components/AgriculturalProjectCard";
import NewProject from "@/components/NewProject";
import { motion } from "framer-motion";
import { AgriculturalProject } from "@/types/agriculturalProject";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Feed: React.FC = () => {
  const [projects, setProjects] = useState<AgriculturalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    fetchProjects();
  }, []);
  
  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Récupération des projets depuis Supabase
      const { data: projetsData, error: projetsError } = await supabase
        .from('projet')
        .select(`
          id_projet,
          surface_ha,
          statut,
          created_at,
          id_tantsaha,
          id_commune,
          id_technicien,
          tantsaha:id_tantsaha(id_utilisateur, nom, prenoms, photo_profil),
          commune(nom_commune, district(nom_district, region(nom_region)))
        `)
        .order('created_at', { ascending: false });
        
      if (projetsError) {
        throw projetsError;
      }
      
      // Récupération des cultures associées aux projets
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
      
      // Récupération des investissements
      const { data: investissementsData, error: investissementsError } = await supabase
        .from('investissement')
        .select(`
          id_projet,
          montant
        `);
        
      if (investissementsError) {
        throw investissementsError;
      }
      
      // Récupération des likes pour chaque projet
      const { data: likesData, error: likesError } = await supabase
        .from('aimer_projet')
        .select(`
          id_projet,
          id_utilisateur
        `);
        
      if (likesError) {
        throw likesError;
      }
      
      // Récupération du nombre de commentaires pour chaque projet
      const { data: commentsCountData, error: commentsError } = await supabase
        .from('commentaire')
        .select('id_projet');
        
      if (commentsError) {
        throw commentsError;
      }
      
      // Regroupement des commentaires par projet
      const commentsCount: Record<string, number> = {};
      commentsCountData.forEach(comment => {
        const projectId = comment.id_projet.toString();
        commentsCount[projectId] = (commentsCount[projectId] || 0) + 1;
      });
      
      // Traitement des données pour créer les objets AgriculturalProject
      const transformedProjects = projetsData.map(projet => {
        // Recherche des cultures associées au projet
        const projetCultures = culturesData.filter(pc => pc.id_projet === projet.id_projet);
        
        // Calcul du financement total pour ce projet
        const currentFunding = investissementsData
          .filter(inv => inv.id_projet === projet.id_projet)
          .reduce((sum, inv) => sum + inv.montant, 0);
        
        // Nombre de likes pour ce projet
        const likes = likesData.filter(like => like.id_projet === projet.id_projet).length;
        
        // Vérifier si l'utilisateur connecté a aimé ce projet
        const isLiked = user ? 
          likesData.some(like => like.id_projet === projet.id_projet && like.id_utilisateur === user.id) : 
          false;
        
        // Nombre de commentaires pour ce projet
        const commentCount = commentsCount[projet.id_projet.toString()] || 0;
        
        // Pour un exemple simple, on va considérer le coût d'exploitation comme objectif de financement
        const cultivationType = projetCultures.length > 0 
          ? projetCultures[0].culture.nom_culture 
          : "Non spécifié";
        
        const farmingCost = projetCultures.length > 0 
          ? projetCultures[0].cout_exploitation_previsionnel || 0 
          : 0;
        
        const expectedYield = projetCultures.length > 0 
          ? projetCultures[0].rendement_previsionnel || 0 
          : 0;
        
        // Calculer revenus attendus (exemple simple: rendement * surface * prix estimé)
        // Dans un cas réel, ce calcul serait plus complexe
        const expectedRevenue = expectedYield * projet.surface_ha * 1.5 * farmingCost;
        
        // Vérifier que l'agriculteur existe avant d'accéder à ses propriétés
        const farmer = projet.tantsaha ? {
          id: projet.tantsaha.id_utilisateur,
          name: `${projet.tantsaha.nom} ${projet.tantsaha.prenoms || ''}`.trim(),
          username: projet.tantsaha.nom.toLowerCase().replace(/\s+/g, ''),
          avatar: projet.tantsaha.photo_profil,
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
          images: [], // À implémenter avec le stockage Supabase
          description: `Projet de culture de ${cultivationType} sur un terrain de ${projet.surface_ha} hectares.`,
          fundingGoal: farmingCost * projet.surface_ha,
          currentFunding,
          likes,
          comments: commentCount,
          shares: 0, // À implémenter
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
        // Supprimer le like
        const { error } = await supabase
          .from('aimer_projet')
          .delete()
          .match({ 
            id_projet: parseInt(projectId), 
            id_utilisateur: user.id 
          });
          
        if (error) throw error;
      } else {
        // Ajouter un like
        const { error } = await supabase
          .from('aimer_projet')
          .insert({ 
            id_projet: parseInt(projectId), 
            id_utilisateur: user.id 
          });
          
        if (error) throw error;
      }
      
      // Mettre à jour l'état local
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
                      project={project} 
                      onLikeToggle={(isLiked) => handleToggleLike(project.id, isLiked)}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="flex items-center justify-center h-40 border rounded-lg border-dashed text-gray-500">
                  Aucun projet disponible pour le moment
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
