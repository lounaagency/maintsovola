
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ProjectTable from "@/components/ProjectTable";
import NewProject from "@/components/NewProject";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";

const Projects = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("tous");
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
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
            onClick={() => setShowNewProjectDialog(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tous" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="tous">Tous</TabsTrigger>
          <TabsTrigger value="en_attente">En attente</TabsTrigger>
          <TabsTrigger value="en_cours">En cours</TabsTrigger>
          <TabsTrigger value="terminé">Terminés</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tous" className="mt-6">
          <ProjectTable filter={search} />
        </TabsContent>
        
        <TabsContent value="en_attente" className="mt-6">
          <ProjectTable filter={`${search} ${search ? ',' : ''}statut.eq.en attente`} />
        </TabsContent>
        
        <TabsContent value="en_cours" className="mt-6">
          <ProjectTable filter={`${search} ${search ? ',' : ''}statut.eq.en cours`} />
        </TabsContent>
        
        <TabsContent value="terminé" className="mt-6">
          <ProjectTable filter={`${search} ${search ? ',' : ''}statut.eq.terminé`} />
        </TabsContent>
      </Tabs>

      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau projet</DialogTitle>
          </DialogHeader>
          <NewProject 
            onProjectCreated={() => {
              setShowNewProjectDialog(false);
            }} 
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Projects;
