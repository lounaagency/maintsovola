import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import InvestmentTable from './InvestmentTable';
import ProjectFeed from '../ProjectFeed';
import PaymentHistory from './PaymentHistory';
import InvestmentsList from './InvestmentsList';
import InvestmentSummary from './InvestmentSummary';
import ProjectsSummary from './ProjectsSummary';
import ActivityFeed from './ActivityFeed';

interface ProjectCultureCount {
  name: string;
  count: number;
  fill: string;
}

interface ProjectCategoryData {
  count: number;
  area: number;
  funding: number;
  profit: number;
  ownerProfit: number;
  cultures: ProjectCultureCount[];
}

interface ProjectStatusData {
  enFinancement: ProjectCategoryData;
  enCours: ProjectCategoryData;
  termine: ProjectCategoryData;
}

interface ProfileTabsProps {
  userId: string;
  investedProjects?: any[];
  loading?: boolean;
  onViewDetails?: (projectId: number) => void;
  investmentSummary?: {
    totalInvested: number;
    totalProfit: number;
    averageROI: number;
    ongoingProjects: number;
    completedProjects: number;
    projectsByStatusData: Array<{name: string, value: number, fill: string}>;
  };
  projectsSummary?: {
    totalProjects: number;
    totalArea: number;
    totalFunding: number;
    totalProfit: number;
    ownerProfit: number;
    projectsByStatus: ProjectStatusData;
    projectsByCulture?: Array<{
      name: string;
      count: number;
      fill: string;
    }>;
  };
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ 
  userId,
  investedProjects = [],
  loading = false,
  onViewDetails = () => {},
  investmentSummary,
  projectsSummary
}) => {
  const { user } = useAuth();
  
  return (
    <Tabs defaultValue="investments" className="mt-6">
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="investments">Investissements</TabsTrigger>
        <TabsTrigger value="projects">Projets</TabsTrigger>
        <TabsTrigger value="payments">Paiements</TabsTrigger>
        <TabsTrigger value="activity">Activité</TabsTrigger>
      </TabsList>
      
      <TabsContent value="investments" className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          {investmentSummary && (
            <div className="mb-6">
              <InvestmentSummary
                totalInvested={investmentSummary.totalInvested}
                totalProfit={investmentSummary.totalProfit}
                averageROI={investmentSummary.averageROI}
                ongoingProjects={investmentSummary.ongoingProjects}
                completedProjects={investmentSummary.completedProjects}
                projectsByStatusData={investmentSummary.projectsByStatusData}
              />
            </div>
          )}
          
          <h3 className="text-lg font-semibold mb-4">Mes investissements</h3>
          {investedProjects && investedProjects.length > 0 ? (
            <InvestmentsList 
              investedProjects={investedProjects}
              loading={loading}
              onViewDetails={onViewDetails}
            />
          ) : (
            <InvestmentTable investments={[]} />
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="projects" className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          {projectsSummary && (
            <div className="mb-6">
              <ProjectsSummary
                totalProjects={projectsSummary.totalProjects}
                totalArea={projectsSummary.totalArea}
                totalFunding={projectsSummary.totalFunding}
                totalProfit={projectsSummary.totalProfit}
                ownerProfit={projectsSummary.ownerProfit}
                projectsByStatus={projectsSummary.projectsByStatus}
                projectsByCulture={projectsSummary.projectsByCulture}
              />
            </div>
          )}
          
          <ProjectFeed 
            filters={{ userId: userId }}
            showFilters={false}
            showFollowingTab={false}
            title="Projets publiés"
            gridLayout={true}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="payments" className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-lg font-semibold mb-4">Historique des paiements</h3>
          <PaymentHistory userId={userId} />
        </div>
      </TabsContent>
      
      <TabsContent value="activity" className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-lg font-semibold mb-4">Activité récente</h3>
          <ActivityFeed userId={userId} />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ProfileTabs;
