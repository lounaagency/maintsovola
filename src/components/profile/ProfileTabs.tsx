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
import PaymentTrackingSection from './PaymentTrackingSection';
import PaymentAnalytics from './PaymentAnalytics';
import PaymentFilters, { PaymentFilterState } from './PaymentFilters';
import { usePaymentData } from '@/hooks/usePaymentData';
import { Separator } from '@/components/ui/separator';

// Nouveaux composants pour techniciens
import AssignedParcelsView from './technicien/AssignedParcelsView';
import WeeklyPlanningTable from './technicien/WeeklyPlanningTable';
import CompletedTasksList from './technicien/CompletedTasksList';
import TechnicalResourcesLibrary from './technicien/TechnicalResourcesLibrary';
import TechnicienPaymentDashboard from './technicien/TechnicienPaymentDashboard';

// Nouveaux composants pour superviseurs
import SuperviseurDashboard from './superviseur/SuperviseurDashboard';

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
  isCurrentUser: boolean;
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
  isCurrentUser,
  investedProjects = [],
  loading = false,
  onViewDetails = () => {},
  investmentSummary,
  projectsSummary
}) => {
  const { user, profile } = useAuth();
  const { metrics, paymentTrends, paymentMethods, loading: paymentLoading } = usePaymentData(userId);
  
  // Déterminer le rôle de l'utilisateur
  const userRole = profile?.nom_role || 'simple';

  const handlePaymentFilter = (filters: PaymentFilterState) => {
    console.log('Applying filters:', filters);
    // TODO: Implémenter la logique de filtrage
  };

  const handleExport = (type: 'csv' | 'pdf') => {
    console.log('Exporting as:', type);
    // TODO: Implémenter la logique d'export
  };
  
  // Fonction pour rendre les onglets selon le rôle
  const renderTabsList = () => {
    if (userRole === 'technicien') {
      return (
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="parcelles">Parcelles</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="rapports">Effectués</TabsTrigger>
          <TabsTrigger value="ressources">Ressources</TabsTrigger>
          <TabsTrigger value="paiements">Paiements</TabsTrigger>
        </TabsList>
      );
    }
    
    if (userRole === 'superviseur') {
      // Pas de barre d'onglets pour superviseur - géré par SuperviseurDashboard
      return null;
    }
    
    // Utilisateurs simples (défaut)
    if (!isCurrentUser) {
      // Profil public - onglets limités
      return (
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="projects">Projets publics</TabsTrigger>
          <TabsTrigger value="activity">Activité publique</TabsTrigger>
        </TabsList>
      );
    }
    
    // Profil personnel - tous les onglets
    return (
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="investments">Investissements</TabsTrigger>
        <TabsTrigger value="projects">Projets</TabsTrigger>
        <TabsTrigger value="payments">Paiements</TabsTrigger>
        <TabsTrigger value="activity">Activité</TabsTrigger>
      </TabsList>
    );
  };

  // Fonction pour rendre le contenu selon le rôle
  const renderTabsContent = () => {
    if (userRole === 'technicien') {
      return (
        <>
          <TabsContent value="parcelles" className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <AssignedParcelsView userId={userId} userRole={userRole} />
            </div>
          </TabsContent>
          
          <TabsContent value="planning" className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <WeeklyPlanningTable userId={userId} userRole={userRole} />
            </div>
          </TabsContent>
          
          <TabsContent value="rapports" className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <CompletedTasksList userId={userId} userRole={userRole} />
            </div>
          </TabsContent>
          
          <TabsContent value="ressources" className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <TechnicalResourcesLibrary />
            </div>
          </TabsContent>
          
          <TabsContent value="paiements" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <TechnicienPaymentDashboard userId={userId} />
            </div>
          </TabsContent>
        </>
      );
    }
    
    if (userRole === 'superviseur') {
      return (
        <SuperviseurDashboard userId={userId} />
      );
    }
    
    // Contenu différent selon le type de profil
    if (!isCurrentUser) {
      // Profil public - contenu limité
      return (
        <>
          <TabsContent value="projects" className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-lg font-semibold mb-4">Projets publics</h3>
              <ProjectFeed 
                filters={{ userId: userId, status: ['validé', 'en financement', 'en cours'] }}
                showFilters={false}
                showFollowingTab={false}
                title=""
                gridLayout={true}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-lg font-semibold mb-4">Activité publique</h3>
              <ActivityFeed userId={userId} />
            </div>
          </TabsContent>
        </>
      );
    }
    
    // Profil personnel - contenu complet
    return (
      <>
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
        
        <TabsContent value="payments" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            {/* Section Suivi des Paiements */}
            <PaymentTrackingSection metrics={metrics} />
            
            <Separator className="my-6" />
            
            {/* Section Filtres et Actions */}
            <PaymentFilters 
              onFilterChange={handlePaymentFilter}
              onExport={handleExport}
            />
            
            <Separator className="my-6" />
            
            {/* Section Analytics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Analyse des Paiements</h3>
              <PaymentAnalytics 
                paymentTrends={paymentTrends}
                paymentMethods={paymentMethods}
              />
            </div>
            
            <Separator className="my-6" />
            
            {/* Section Historique détaillé */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Historique détaillé des paiements</h3>
              <PaymentHistory userId={userId} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-lg font-semibold mb-4">Activité récente</h3>
            <ActivityFeed userId={userId} />
          </div>
        </TabsContent>
      </>
    );
  };

  // Déterminer la valeur par défaut selon le rôle et le type de profil
  const getDefaultValue = () => {
    if (userRole === 'technicien') return 'parcelles';
    if (userRole === 'superviseur') return 'overview';
    return isCurrentUser ? 'investments' : 'projects';
  };
  
  // Pour superviseur, pas besoin de Tabs wrapper
  if (userRole === 'superviseur') {
    return (
      <div className="mt-6">
        {renderTabsContent()}
      </div>
    );
  }

  return (
    <Tabs defaultValue={getDefaultValue()} className="mt-6">
      {renderTabsList()}
      {renderTabsContent()}
    </Tabs>
  );
};

export default ProfileTabs;
