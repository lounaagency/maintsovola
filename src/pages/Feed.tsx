
import React, { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import ProjectFeed from "@/components/ProjectFeed";
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
    
    setSearchParams(params);
  };

  return (
    <div className={`${isMobile ? 'w-full' : 'max-w-md'} mx-auto px-4 py-4`}>
      <ProjectFeed
        filters={filters}
        showFilters={true}
        showFollowingTab={true}
        title="Projets en financement"
        onFilterChange={handleFilterChange}
      />
    </div>
  );
};

export default Feed;
