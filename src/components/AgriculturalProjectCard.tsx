
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import UserAvatar from './UserAvatar';
import { formatCurrency } from '@/lib/utils';
import ProjectActions from './ProjectActions';
import { AgriculturalProject } from '@/types/agriculturalProject';

interface AgriculturalProjectCardProps {
  project: AgriculturalProject;
  onLikeToggle: (isLiked: boolean) => boolean;
  onCardClick?: () => void;
}

const AgriculturalProjectCard: React.FC<AgriculturalProjectCardProps> = ({
  project,
  onLikeToggle,
  onCardClick
}) => {
  const fundingProgress = project.fundingGoal > 0 
    ? Math.min(Math.round((project.currentFunding / project.fundingGoal) * 100), 100)
    : 0;
  
  const fundingGap = Math.max(0, project.fundingGoal - project.currentFunding);
  
  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header with farmer info */}
        <div className="flex items-center justify-between mb-3">
          <div 
            className="flex items-center cursor-pointer"
            onClick={handleCardClick}
          >
            <UserAvatar 
              src={project.farmer.avatar} 
              alt={typeof project.farmer.name === 'string' ? project.farmer.name : 'Farmer'} 
              size="sm" 
            />
            <div className="ml-2">
              <div className="text-sm font-medium">{project.farmer.name}</div>
              <div className="text-xs text-muted-foreground">
                @{project.farmer.username} · {project.creationDate}
              </div>
            </div>
          </div>
        </div>
        
        {/* Project details */}
        <div className="mb-4">
          <h3 
            className="text-base font-semibold mb-2 cursor-pointer"
            onClick={handleCardClick}
          >
            {project.title}
          </h3>
          <p 
            className="text-sm text-muted-foreground mb-3 line-clamp-2 cursor-pointer"
            onClick={handleCardClick}
          >
            {project.description}
          </p>
          
          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
            <div>
              <span className="text-muted-foreground">Localisation</span>
              <div className="font-medium">{project.location.region}, {project.location.district}</div>
              <div className="font-medium">{project.location.commune}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Culture</span>
              <div className="font-medium">{project.cultivationType}</div>
              <div>{project.cultivationArea} ha</div>
            </div>
          </div>
          
          <div 
            className="space-y-2 cursor-pointer"
            onClick={handleCardClick}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Financement</span>
              <span>{fundingProgress}%</span>
            </div>
            <Progress value={fundingProgress} className="h-2" />
            
            <div className="flex items-center justify-between text-xs">
              <span>
                <span className="text-muted-foreground">Actuel :</span> {formatCurrency(project.currentFunding)}
              </span>
              <span>
                <span className="text-muted-foreground">Objectif :</span> {formatCurrency(project.fundingGoal)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <ProjectActions 
          projectId={project.id}
          likes={project.likes}
          comments={project.comments}
          shares={project.shares}
          isLiked={project.isLiked}
          onLikeToggle={() => {
            return onLikeToggle(project.isLiked || false);
          }}
          onOpenComments={() => {}}
          onShare={() => {}}
          fundingGap={fundingGap}
        />
      </CardContent>
    </Card>
  );
};

export default AgriculturalProjectCard;
