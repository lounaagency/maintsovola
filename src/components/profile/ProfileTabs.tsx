import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import InvestmentTable from './InvestmentTable';
import ProjectList from './ProjectList';
import PaymentHistory from './PaymentHistory';

interface ProfileTabsProps {
  userId: string;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ 
  userId
}) => {
  const [investments, setInvestments] = useState([]);
  const [projects, setProjects] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    // Fetch investments and projects data here
    // For now, let's use dummy data
    setInvestments([
      { id: 1, project: 'Projet A', amount: 1000, date: '2023-01-01' },
      { id: 2, project: 'Projet B', amount: 2000, date: '2023-02-01' },
    ]);

    setProjects([
      { id: 1, name: 'Projet X', status: 'En cours' },
      { id: 2, name: 'Projet Y', status: 'Terminé' },
    ]);
  }, []);
  
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
          <InvestmentTable investments={investments} />
        </div>
      </TabsContent>
      
      <TabsContent value="projects" className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-lg font-semibold mb-4">Mes projets</h3>
          <ProjectList projects={projects} />
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
