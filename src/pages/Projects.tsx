
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ProjectTable from "@/components/ProjectTable";
import NewProject from "@/components/NewProject";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Projects = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("en_attente");
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNoTerrainAlert, setShowNoTerrainAlert] = useState(false);
  const [hasValidTerrains, setHasValidTerrains] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  useEffect(() => {
    if (user && profile?.nom_role === 'simple') {
      checkForValidTerrains();
    }
  }, [user, profile]);

  const checkForValidTerrains = async () => {
    if (!user) return;
    
    try {
      // Get ALL projects (including deleted ones) to exclude their terrains
      // This prevents users from creating projects on terrains that already had projects
      const { data: allProjects, error: projectsError } = await supabase
        .from('projet')
        .select('id_terrain');
        
      if (projectsError) {
        console.error("Error fetching all projects:", projectsError);
        return;
      }
      
      // Get the list of terrain IDs that have ever been in projects
      const excludedTerrainIds = allProjects?.map(p => p.id_terrain) || [];
            
      // Fetch terrains that belong to the user, are validated, and have never been in projects
      let query = supabase
        .from('terrain')
        .select('id_terrain')
        .eq('id_tantsaha', user.id)
        .eq('statut', true) // Only validated terrains
        .eq('archive', false);
        
      if (excludedTerrainIds.length > 0) {
        query = query.not('id_terrain', 'in', `(${excludedTerrainIds.join(',')})`);
      }
      
      const { data: terrains, error: terrainsError } = await query;
      
      if (terrainsError) {
        console.error("Error checking for valid terrains:", terrainsError);
        return;
      }
      
      setHasValidTerrains(terrains && terrains.length > 0);
    } catch (error) {
      console.error("Unexpected error checking terrains:", error);
    }
  };

  const handleNewProjectClick = () => {
    if (profile?.nom_role === 'simple' && !hasValidTerrains) {
      setShowNoTerrainAlert(true);
    } else {
      setShowNewProjectDialog(true);
    }
  };

  const handleRedirectToTerrains = () => {
    navigate('/terrain');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projets</h1>
          <p className="text-muted-foreground">
            Gérez vos projets agricoles ici
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher..."
                className="pl-8 w-full sm:w-[300px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </form>
          
          <Button
            onClick={handleNewProjectClick}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Button>
        </div>
      </div>

      <Tabs defaultValue="en_attente" value={activeTab} onValueChange={handleTabChange} className={isMobile ? "space-y-4" : ""}>
        <div className={isMobile ? "sticky top-0 z-10 bg-background pt-2 pb-4" : ""}>
          <TabsList className={isMobile ? "w-full grid grid-cols-5" : "grid grid-cols-5 w-full sm:w-auto"}>
            <TabsTrigger value="en_attente">En attente</TabsTrigger>
            <TabsTrigger value="en_financement_100">Financement 100%</TabsTrigger>
            <TabsTrigger value="en_financement">Levée de fonds</TabsTrigger>
            <TabsTrigger value="en_cours">En production</TabsTrigger>
            <TabsTrigger value="terminé">Terminés</TabsTrigger>
          </TabsList>
        </div>
               
        <TabsContent value="en_attente" className="mt-4">
          <ProjectTable filter={search} statutFilter="en attente" />
        </TabsContent>
        
        <TabsContent value="en_financement_100" className="mt-4">
          <ProjectTable 
            filter={search} 
            statutFilter="en financement" 
            fundingStatus="completed" 
          />
        </TabsContent>
        
        <TabsContent value="en_financement" className="mt-4">
          <ProjectTable 
            filter={search} 
            statutFilter="en financement" 
            fundingStatus="in_progress" 
          />
        </TabsContent>
        
        <TabsContent value="en_cours" className="mt-4">
          <ProjectTable filter={search} statutFilter="en cours" />
        </TabsContent>

        <TabsContent value="terminé" className="mt-4">
          <ProjectTable filter={search} statutFilter="terminé" />
        </TabsContent>
      </Tabs>

      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau projet</DialogTitle>
          </DialogHeader>
          <ProjectEditDialog 
            isOpen={showNewProjectDialog}
            onClose={() => setShowNewProjectDialog(false)}
            onSubmitSuccess={() => {
              setShowNewProjectDialog(false);
            }}
            userId={user?.id}
            userRole={profile?.nom_role}
            isEdit={false}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showNoTerrainAlert} onOpenChange={setShowNoTerrainAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aucun terrain disponible</AlertDialogTitle>
            <AlertDialogDescription>
              Vous devez d'abord ajouter un terrain et attendre sa validation avant de pouvoir créer un projet agricole.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleRedirectToTerrains}>
              Ajouter un terrain
            </AlertDialogAction>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default Projects;
