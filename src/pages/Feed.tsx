import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import NewPost from "@/components/NewPost";
import Post from "@/components/Post";
import ProjectCard from "@/components/ProjectCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AgriculturalProject } from "@/types/agriculturalProject";
import AgriculturalProjectCard from "@/components/AgriculturalProjectCard";
import ProjectDetailsDialog from "@/components/ProjectDetailsDialog";

const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [projects, setProjects] = useState<AgriculturalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  
  useEffect(() => {
    if (projectIdParam) {
      setSelectedProjectId(parseInt(projectIdParam));
    }
  }, [projectIdParam]);
  
  useEffect(() => {
    fetchPosts();
  }, []);
  
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data: postsData, error: postsError } = await supabase
        .from('post')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (postsError) throw postsError;
      setPosts(postsData || []);
      
      const { data: projectsData, error: projectsError } = await supabase
        .from('projet')
        .select(`
          id_projet,
          titre,
          description,
          id_tantsaha,
          surface_ha,
          commune:id_commune(nom_commune),
          district:id_district(nom_district),
          region:id_region(nom_region),
          projet_culture(
            culture:id_culture(nom_culture)
          )
        `)
        .limit(5);
        
      if (projectsError) throw projectsError;
      
      // Mock data for now
      setProjects([
        {
          id: "1",
          farmer: {
            name: "Jean Dupont",
            avatar: "https://randomuser.me/api/portraits/men/1.jpg"
          },
          creationDate: "2023-04-15",
          cultivationType: "Riz",
          cultivationArea: 5,
          location: {
            region: "Analamanga",
            district: "Antananarivo",
            commune: "Antananarivo"
          },
          fundingGoal: 5000000,
          currentFunding: 2500000,
          farmingCost: 1000000,
          expectedYield: 3.5,
          expectedRevenue: 7000000,
          likes: 12,
          comments: 5,
          shares: 3,
          technicianId: "tech-123",
          isLiked: false
        },
        {
          id: "2",
          farmer: {
            name: "Marie Razafy",
            avatar: "https://randomuser.me/api/portraits/women/2.jpg"
          },
          creationDate: "2023-04-10",
          cultivationType: "Maïs",
          cultivationArea: 3,
          location: {
            region: "Itasy",
            district: "Miarinarivo",
            commune: "Miarinarivo"
          },
          fundingGoal: 3000000,
          currentFunding: 1800000,
          farmingCost: 800000,
          expectedYield: 2.5,
          expectedRevenue: 4500000,
          likes: 8,
          comments: 3,
          shares: 1,
          technicianId: "tech-456",
          isLiked: true
        }
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching feed data:", error);
      setLoading(false);
    }
  };
  
  const handleProjectDetailsClose = () => {
    setSelectedProjectId(null);
    // Remove the projectId parameter from the URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('projectId');
    setSearchParams(newSearchParams);
  };
  
  const handleLikeToggle = (projectId: string) => {
    // Update the like status in the projects list
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === projectId
          ? { ...project, isLiked: !project.isLiked, likes: project.isLiked ? project.likes - 1 : project.likes + 1 }
          : project
      )
    );
  };

  return (
    <div className="container mx-auto py-4 max-w-3xl">
      {user && <NewPost />}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div>
          {projects.map(project => (
            <AgriculturalProjectCard 
              key={project.id} 
              project={project} 
              onLikeToggle={(isLiked) => handleLikeToggle(project.id)}
            />
          ))}
          
          {posts.map(post => (
            <Post key={post.id} post={post} />
          ))}
        </div>
      )}
      
      {selectedProjectId && (
        <ProjectDetailsDialog 
          isOpen={!!selectedProjectId}
          onClose={handleProjectDetailsClose}
          projectId={selectedProjectId}
          userRole={profile?.nom_role?.toLowerCase()}
        />
      )}
    </div>
  );
};

export default Feed;
