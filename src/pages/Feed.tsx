
import React, { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { Search, Filter, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import LandingPages from "@/components/LandingPages";
import AgriculturalProjectCard from "@/components/AgriculturalProjectCard";
import ProjectDetailsDialog from "@/components/ProjectDetailsDialog";
import { useToast } from "@/components/ui/use-toast";

interface Project {
  id_projet: number;
  surface_ha: number;
  statut: string;
  created_at: string;
  id_tantsaha: string;
  id_commune: number;
  id_technicien: string;
  titre?: string;
  description?: string;
  financement_actuel?: number;
  cout_total?: number;
  utilisateur: {
    id_utilisateur: string;
    nom: string;
    prenoms: string;
    photo_profil: string;
  };
  commune: {
    nom_commune: string;
    district: {
      nom_district: string;
      region: {
        nom_region: string;
      };
    };
  };
}

export const Feed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'funding' | 'production'>('funding');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [cultureFilter, setCultureFilter] = useState<string>("all");
  const [showLanding, setShowLanding] = useState(false);
  const [regions, setRegions] = useState<{id_region: number, nom_region: string}[]>([]);
  const [cultures, setCultures] = useState<{id_culture: number, nom_culture: string}[]>([]);
  
  useEffect(() => {
    if (user) {
      // Check if this is user's first visit
      const hasSeenLanding = localStorage.getItem('hasSeenLanding');
      if (!hasSeenLanding) {
        setShowLanding(true);
      }
      
      fetchProjects();
      fetchFilters();
    }
  }, [user]);
  
  useEffect(() => {
    applyFilters();
  }, [searchTerm, regionFilter, cultureFilter, projects, activeTab]);
  
  const fetchFilters = async () => {
    try {
      // Fetch regions
      const { data: regionsData, error: regionsError } = await supabase
        .from('region')
        .select('id_region, nom_region')
        .order('nom_region', { ascending: true });
        
      if (regionsError) throw regionsError;
      setRegions(regionsData || []);
      
      // Fetch cultures
      const { data: culturesData, error: culturesError } = await supabase
        .from('culture')
        .select('id_culture, nom_culture')
        .order('nom_culture', { ascending: true });
        
      if (culturesError) throw culturesError;
      setCultures(culturesData || []);
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };
  
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projet')
        .select(`
          id_projet,
          surface_ha,
          statut,
          created_at,
          titre,
          description,
          id_tantsaha,
          id_commune,
          id_technicien,
          financement_actuel,
          cout_total,
          utilisateur:id_tantsaha(
            id_utilisateur,
            nom,
            prenoms,
            photo_profil
          ),
          commune:id_commune(
            nom_commune,
            district:id_district(
              nom_district,
              region:id_region(
                nom_region
              )
            )
          ),
          projet_culture(
            id_culture,
            culture:id_culture(
              nom_culture
            )
          )
        `)
        .in('statut', ['validé', 'en_financement', 'en cours', 'en_production']);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setProjects(data as any[]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...projects];
    
    // Filter by tab (funding status)
    if (activeTab === 'funding') {
      filtered = filtered.filter(p => p.statut === 'validé' || p.statut === 'en_financement');
    } else {
      filtered = filtered.filter(p => p.statut === 'en cours' || p.statut === 'en_production');
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.titre?.toLowerCase().includes(term) || 
        p.description?.toLowerCase().includes(term) ||
        p.utilisateur.nom.toLowerCase().includes(term) ||
        p.commune.nom_commune.toLowerCase().includes(term) ||
        p.commune.district.nom_district.toLowerCase().includes(term) ||
        p.commune.district.region.nom_region.toLowerCase().includes(term)
      );
    }
    
    // Filter by region
    if (regionFilter !== 'all') {
      filtered = filtered.filter(p => 
        p.commune.district.region.nom_region === regionFilter
      );
    }
    
    // Filter by culture
    if (cultureFilter !== 'all') {
      filtered = filtered.filter(p => 
        p.projet_culture?.some((pc: any) => 
          pc.culture?.nom_culture === cultureFilter
        )
      );
    }
    
    setFilteredProjects(filtered);
  };
  
  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsOpen(true);
  };
  
  const finishLanding = () => {
    localStorage.setItem('hasSeenLanding', 'true');
    setShowLanding(false);
  };
  
  if (!user) {
    navigate('/auth');
    return null;
  }
  
  if (showLanding) {
    return <LandingPages onFinish={finishLanding} />;
  }
  
  return (
    <div className="container py-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Projets agricoles</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Rechercher un projet..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter size={16} />
                Région
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={regionFilter} onValueChange={setRegionFilter}>
                <DropdownMenuRadioItem value="all">Toutes les régions</DropdownMenuRadioItem>
                {regions.map(region => (
                  <DropdownMenuRadioItem key={region.id_region} value={region.nom_region}>
                    {region.nom_region}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter size={16} />
                Culture
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={cultureFilter} onValueChange={setCultureFilter}>
                <DropdownMenuRadioItem value="all">Toutes les cultures</DropdownMenuRadioItem>
                {cultures.map(culture => (
                  <DropdownMenuRadioItem key={culture.id_culture} value={culture.nom_culture}>
                    {culture.nom_culture}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Tabs 
        defaultValue="funding"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'funding' | 'production')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="funding">En cours de financement</TabsTrigger>
          <TabsTrigger value="production">Production en cours</TabsTrigger>
        </TabsList>
        
        <TabsContent value="funding" className="pt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-40 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredProjects.map((project) => (
                <AgriculturalProjectCard
                  key={project.id_projet}
                  project={project as any}
                  onDetailsClick={() => handleProjectClick(project)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border rounded-lg border-dashed">
              <h3 className="text-xl font-semibold text-gray-600">Aucun projet trouvé</h3>
              <p className="text-gray-500 mt-2">
                Aucun projet ne correspond à vos critères de recherche.
              </p>
              {searchTerm || regionFilter !== 'all' || cultureFilter !== 'all' ? (
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchTerm('');
                    setRegionFilter('all');
                    setCultureFilter('all');
                  }}
                  className="mt-2"
                >
                  Réinitialiser les filtres
                </Button>
              ) : (
                <Button onClick={() => navigate('/terrain')} className="mt-4">
                  Créer un projet
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="production" className="pt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-40 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredProjects.map((project) => (
                <AgriculturalProjectCard
                  key={project.id_projet}
                  project={project as any}
                  onDetailsClick={() => handleProjectClick(project)}
                  isProduction={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border rounded-lg border-dashed">
              <h3 className="text-xl font-semibold text-gray-600">Aucun projet en production</h3>
              <p className="text-gray-500 mt-2">
                Aucun projet en cours de production ne correspond à vos critères
              </p>
              {searchTerm || regionFilter !== 'all' || cultureFilter !== 'all' ? (
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchTerm('');
                    setRegionFilter('all');
                    setCultureFilter('all');
                  }}
                  className="mt-2"
                >
                  Réinitialiser les filtres
                </Button>
              ) : null}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {selectedProject && (
        <ProjectDetailsDialog
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          projectId={selectedProject.id_projet}
          userRole="simple" // Default view
        />
      )}
    </div>
  );
};

export default Feed;
