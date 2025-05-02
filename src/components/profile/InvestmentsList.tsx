
import React from 'react';
import InvestmentCard from './InvestmentCard';

interface InvestmentsListProps {
  investedProjects: any[];
  loading: boolean;
  onViewDetails: (projectId: number) => void;
}

const InvestmentsList: React.FC<InvestmentsListProps> = ({ 
  investedProjects, 
  loading,
  onViewDetails
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (investedProjects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aucun investissement trouvé</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      {investedProjects.map(project => (
        <InvestmentCard 
          key={project.id}
          project={project}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};

export default InvestmentsList;
