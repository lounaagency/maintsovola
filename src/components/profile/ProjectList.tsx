
import React from 'react';

interface Project {
  id: number;
  name: string;
  status: string;
}

interface ProjectListProps {
  projects: Project[];
}

const ProjectList: React.FC<ProjectListProps> = ({ projects }) => {
  if (projects.length === 0) {
    return <p className="text-muted-foreground">Aucun projet à afficher.</p>;
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <div key={project.id} className="p-3 border rounded flex justify-between items-center">
          <span className="font-medium">{project.name}</span>
          <span className="text-sm px-2 py-1 bg-muted rounded">{project.status}</span>
        </div>
      ))}
    </div>
  );
};

export default ProjectList;
