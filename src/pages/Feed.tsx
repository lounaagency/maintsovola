import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AgriculturalProjectCard from '@/components/AgriculturalProjectCard';
import LandingPages from '@/components/LandingPages';
import { Project } from '@/types/project';
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

const Feed: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [productionProjects, setProductionProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast()

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const { data: investissementData, error: investissementError } = await supabase
          .from('projet')
          .select(`
            *,
            terrain (
              nom_terrain
            )
          `)
          .eq('statut', 'financement')
          .order('date_creation', { ascending: false });

        if (investissementError) {
          throw investissementError;
        }

        if (investissementData) {
          setProjects(investissementData);
        }

        const { data: productionData, error: productionError } = await supabase
          .from('projet')
          .select(`
            *,
            terrain (
              nom_terrain
            )
          `)
          .eq('statut', 'en_production')
          .order('date_creation', { ascending: false });

        if (productionError) {
          throw productionError;
        }

        if (productionData) {
          setProductionProjects(productionData);
        }
      } catch (error: any) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les projets",
          variant: "destructive",
        })
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Projets en financement</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg shadow-md p-4">
              <Skeleton className="h-40 w-full rounded-md mb-2" />
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-6">Projets en production</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg shadow-md p-4">
              <Skeleton className="h-40 w-full rounded-md mb-2" />
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <LandingPages />

      <h1 className="text-3xl font-bold mb-6">Projets en financement</h1>
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => {
            const cultures = project.cultures || [];

            return (
              <AgriculturalProjectCard 
                key={index} 
                project={project} 
              />
            );
          })}
        </div>
      ) : (
        <p>Aucun projet en financement pour le moment.</p>
      )}

      <h2 className="text-2xl font-bold mt-8 mb-6">Projets en production</h2>
      {productionProjects && productionProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productionProjects.map((project, index) => (
            <AgriculturalProjectCard
              key={index}
              project={project}
              isProduction={true}
            />
          ))}
        </div>
      ) : (
        <p>Aucun projet en production pour le moment.</p>
      )}
    </div>
  );
};

export default Feed;
