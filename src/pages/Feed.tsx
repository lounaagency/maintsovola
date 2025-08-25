
import React, { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import ProjectFeedWithTabs from "@/components/ProjectFeedWithTabs";
import { ProjectFilter } from "@/hooks/use-project-data";

const Feed: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [filters, setFilters] = useState<ProjectFilter>({});
  
  useEffect(() => {
    const newFilters: ProjectFilter = {};
    
    if (searchParams.has('id_projet')) {
      newFilters.projectId = searchParams.get('id_projet') || undefined;
    }
    if (searchParams.has('culture')) {
      newFilters.culture = searchParams.get('culture') || undefined;
    }
    if (searchParams.has('region')) {
      newFilters.region = searchParams.get('region') || undefined;
    }
    if (searchParams.has('district')) {
      newFilters.district = searchParams.get('district') || undefined;
    }
    if (searchParams.has('commune')) {
      newFilters.commune = searchParams.get('commune') || undefined;
    }
    
    setFilters(newFilters);

    // Handle focus on comments if specified in URL
    if (searchParams.has('focus') && searchParams.get('focus') === 'comments') {
      // Scroll to project and expand comments after a short delay
      setTimeout(() => {
        const projectId = searchParams.get('id_projet');
        if (projectId) {
          const projectElement = document.querySelector(`[data-project-id="${projectId}"]`);
          if (projectElement) {
            projectElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Trigger comment expansion
            const commentButton = projectElement.querySelector('[data-comments-trigger]') as HTMLElement;
            if (commentButton) {
              commentButton.click();
            }
          }
        }
      }, 500);
    }
  }, [searchParams]);
  
  if (!user) {
    return <Navigate to={`/auth${location.search}`} replace />;
  }
  
  const handleFilterChange = (newFilters: ProjectFilter) => {
    const params = new URLSearchParams();
    
    if (newFilters.projectId) {
      params.set('id_projet', String(newFilters.projectId));
    }
    if (newFilters.culture) {
      params.set('culture', newFilters.culture);
    }
    if (newFilters.region) {
      params.set('region', newFilters.region);
    }
    if (newFilters.district) {
      params.set('district', newFilters.district);
    }
    if (newFilters.commune) {
      params.set('commune', newFilters.commune);
    }
    
    // Remove focus parameter when filters change (unless it's the first load)
    if (searchParams.has('focus')) {
      params.delete('focus');
    }
    
    setSearchParams(params);
  };

  return (
    <div className={`${isMobile ? 'w-full' : 'max-w-md'} mx-auto px-4 py-4`}>
      <ProjectFeedWithTabs
        filters={filters}
        showFilters={true}
        showFollowingTab={true}
        title="Projets en financement"
        onFilterChange={handleFilterChange}
        className={`${isMobile ? 'w-full' : 'max-w-md'} mx-auto px-4 py-4`}
      />
    </div>
  );
};

export default Feed;
