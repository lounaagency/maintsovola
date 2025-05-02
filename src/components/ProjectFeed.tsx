import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AgriculturalProjectCard from '@/components/AgriculturalProjectCard';
import { useProjectData, ProjectFilter } from '@/hooks/use-project-data';

export interface ProjectFeedProps {
  /**
   * Filter options for the feed
   */
  filters?: ProjectFilter;
  
  /**
   * Whether to show the filter badges and controls
   */
  showFilters?: boolean;
  
  /**
   * Whether to show the "Following" tab
   */
  showFollowingTab?: boolean;
  
  /**
   * Title to display above the feed
   */
  title?: string;
  
  /**
   * The tab that should be active by default
   */
  defaultTab?: 'for-you' | 'following';
  
  /**
   * CSS class to apply to the container
   */
  className?: string;
  
  /**
   * Whether to use a grid layout instead of stack
   */
  gridLayout?: boolean;
  
  /**
   * Callback for when filters are updated
   */
  onFilterChange?: (filters: ProjectFilter) => void;
}

const ProjectFeed: React.FC<ProjectFeedProps> = ({
  filters = {},
  showFilters = true,
  showFollowingTab = true,
  title = "Projets en financement",
  defaultTab = 'for-you',
  className = '',
  gridLayout = false,
  onFilterChange
}) => {
  const navigate = useNavigate();
  const [activeFilters, setActiveFilters] = useState<ProjectFilter>(filters);
  const [currentTab, setCurrentTab] = useState<'for-you' | 'following'>(defaultTab);
  
  // For "For You" tab
  const { 
    projects, 
    loading, 
    toggleLike: toggleLikeForYou 
  } = useProjectData({
    ...activeFilters,
    followedUsersOnly: false
  });
  
  // For "Following" tab
  const {
    projects: followedProjects,
    loading: loadingFollowed,
    toggleLike: toggleLikeFollowing
  } = useProjectData({
    ...activeFilters,
    followedUsersOnly: true
  });

  const handleToggleLike = (projectId: string, isLiked: boolean) => {
    if (currentTab === 'for-you') {
      toggleLikeForYou(projectId, isLiked);
    } else {
      toggleLikeFollowing(projectId, isLiked);
    }
  };

  const applyFilter = (filterType: string, value: string) => {
    const newFilters = {
      ...activeFilters,
      [filterType]: value
    };
    
    setActiveFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };
  
  const clearFilters = () => {
    // Keep the projectId filter if it exists
    const projectId = activeFilters.projectId;
    const userId = activeFilters.userId;
    const status = activeFilters.status;
    
    const newFilters = {
      ...(projectId ? { projectId } : {}),
      ...(userId ? { userId } : {}),
      ...(status ? { status } : {})
    };
    
    setActiveFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const renderActiveFilters = () => {
    if (!showFilters) return null;
    
    const filtersToShow = { ...activeFilters };
    // Don't show these as filter badges
    delete filtersToShow.projectId;
    delete filtersToShow.userId;
    delete filtersToShow.followedUsersOnly;
    delete filtersToShow.status;
    
    const hasFilters = Object.keys(filtersToShow).length > 0;
    
    if (!hasFilters) return null;
    
    return (
      <div className="mb-4 p-2 bg-muted rounded-lg flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Filtres :</span>
        {Object.entries(filtersToShow).map(([key, value]) => (
          <span 
            key={key} 
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground"
          >
            {key}: {value}
            <button 
              className="ml-1 rounded-full" 
              onClick={() => {
                const newFilters = { ...activeFilters };
                delete newFilters[key as keyof ProjectFilter];
                setActiveFilters(newFilters);
                
                if (onFilterChange) {
                  onFilterChange(newFilters);
                }
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

  const renderProjects = (projectsList: any[], isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (projectsList.length === 0) {
      return (
        <div className="flex items-center justify-center h-40 border rounded-lg border-dashed text-gray-500">
          {Object.keys(activeFilters).some(key => !['projectId', 'userId', 'status'].includes(key))
            ? "Aucun projet ne correspond à ces filtres" 
            : currentTab === 'following' 
              ? "Suivez des agriculteurs pour voir leurs projets"
              : "Aucun projet disponible pour le moment"}
        </div>
      );
    }

    return (
      <motion.div
        className={gridLayout 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
          : "space-y-4"}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {projectsList.map((project) => (
          <motion.div key={project.id} variants={item}>
            <AgriculturalProjectCard 
              project={{
                ...project,
                farmer: {
                  ...project.farmer,
                  name: (
                    <Link 
                      to={`/profile/${project.farmer.id}${filters.projectId ? `?id_projet=${filters.projectId}` : ''}`} 
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {project.farmer.name}
                    </Link>
                  )
                },
                cultivationType: showFilters ? (
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
                ) : project.cultivationType,
                location: {
                  region: showFilters ? (
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
                  ) : project.location.region,
                  district: showFilters ? (
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
                  ) : project.location.district,
                  commune: showFilters ? (
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
                  ) : project.location.commune
                }
              }}
              onLikeToggle={(isLiked) => handleToggleLike(project.id, isLiked)}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  // If we're not showing tabs, just render the projects directly
  if (!showFollowingTab) {
    return (
      <div className={className}>
        {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
        {renderActiveFilters()}
        {renderProjects(projects, loading)}
      </div>
    );
  }

  // Otherwise, render with tabs for "For You" and "Following"
  return (
    <div className={className}>
      {title && <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>}
      
      <Tabs 
        defaultValue={defaultTab} 
        className="mb-6" 
        onValueChange={(value) => setCurrentTab(value as 'for-you' | 'following')}
      >
        <TabsList className="grid w-full grid-cols-2 bg-muted rounded-lg">
          <TabsTrigger value="for-you" className="rounded-md">Pour vous</TabsTrigger>
          <TabsTrigger value="following" className="rounded-md">Abonnements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="for-you" className="mt-4">
          {renderActiveFilters()}
          {renderProjects(projects, loading)}
        </TabsContent>
        
        <TabsContent value="following" className="mt-4">
          {renderActiveFilters()}
          {renderProjects(followedProjects, loadingFollowed)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectFeed;
