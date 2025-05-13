
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import InvestmentTable from './InvestmentTable';
import ProjectFeed from '../ProjectFeed';
import PaymentHistory from './PaymentHistory';
import InvestmentsList from './InvestmentsList';

interface ProfileTabsProps {
  userId: string;
  investedProjects?: any[];
  loading?: boolean;
  onViewDetails?: (projectId: number) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ 
  userId,
  investedProjects = [],
  loading = false,
  onViewDetails = () => {}
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
          <p className="text-muted-foreground">Aucune activité récente à afficher.</p>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ProfileTabs;
