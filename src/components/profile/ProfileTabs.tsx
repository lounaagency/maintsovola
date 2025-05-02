
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PenSquare, Landmark } from 'lucide-react';
import ProjectFeed from '@/components/ProjectFeed';
import InvestmentsList from './InvestmentsList';

interface ProfileTabsProps {
  userId: string;
  investedProjects: any[];
  loading: boolean;
  onViewDetails: (projectId: number) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  userId,
  investedProjects,
  loading,
  onViewDetails
}) => {
  return (
    <Tabs defaultValue="projects">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="projects" className="flex items-center">
          <PenSquare size={16} className="mr-2" />
          Projets
        </TabsTrigger>
        <TabsTrigger value="investments" className="flex items-center">
          <Landmark size={16} className="mr-2" />
          Investissements
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="projects" className="mt-6">
        <div className="max-w-md mx-auto">
          <ProjectFeed 
            filters={{ 
              userId: userId 
            }}
            showFilters={false}
            showFollowingTab={false}
            title=""
            className="mt-0"
          />
        </div>
      </TabsContent>
      
      <TabsContent value="investments" className="mt-6">
        <InvestmentsList 
          investedProjects={investedProjects}
          loading={loading}
          onViewDetails={onViewDetails}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ProfileTabs;
