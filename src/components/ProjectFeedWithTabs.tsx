import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProjectFeed from "@/components/ProjectFeed";
import ProjectDetailsDialog from "@/components/ProjectDetailsDialog";
import { ProjectFilter } from "@/hooks/use-project-data";

interface ProjectFeedWithTabsProps {
  filters: ProjectFilter;
  showFilters: boolean;
  showFollowingTab: boolean;
  title: string;
  onFilterChange: (newFilters: ProjectFilter) => void;
  className?: string;
}

const ProjectFeedWithTabs: React.FC<ProjectFeedWithTabsProps> = ({
  filters,
  showFilters,
  showFollowingTab,
  title,
  onFilterChange,
  className
}) => {
  const [searchParams] = useSearchParams();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [dialogTab, setDialogTab] = useState<'finances' | 'jalons'>('finances');

  useEffect(() => {
    // Check if we need to open a project dialog with specific tab
    const tab = searchParams.get('tab');
    const projectId = searchParams.get('id_projet');
    
    if (projectId && tab && (tab === 'finances' || tab === 'jalons')) {
      setSelectedProjectId(parseInt(projectId));
      setDialogTab(tab);
    }
  }, [searchParams]);

  const handleCloseDialog = () => {
    setSelectedProjectId(null);
    // Clear tab parameter from URL when closing dialog
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.delete('tab');
    const newUrl = `${window.location.pathname}${currentParams.toString() ? '?' + currentParams.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  };

  return (
    <>
      <ProjectFeed
        filters={filters}
        showFilters={showFilters}
        showFollowingTab={showFollowingTab}
        title={title}
        onFilterChange={onFilterChange}
        className={className}
      />
      
      {selectedProjectId && (
        <ProjectDetailsDialog
          isOpen={true}
          onClose={handleCloseDialog}
          projectId={selectedProjectId}
          defaultTab={dialogTab}
        />
      )}
    </>
  );
};

export default ProjectFeedWithTabs;