import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from '@/lib/utils';
import { ChartContainer } from '@/components/ui/chart';
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  Layers,
  CreditCard,
  Map,
  PieChartIcon,
  Sprout,
  Wallet
} from 'lucide-react';

interface ProjectActivitiesSummaryProps {
  // Projets créés
  totalCreatedProjects: number;
  totalCreatedArea: number;
  totalCreatedFunding: number;
  totalCreatedProfit: number;
  
  // Investissements
  totalInvestedProjects: number;
  totalInvested: number;
  totalInvestmentProfit: number;
  averageROI: number;
  
  // Statuts combinés
  ongoingProjects: number;
  completedProjects: number;
  
  // Données pour les graphiques
  activitiesBreakdown: Array<{name: string, value: number, fill: string}>;
  statusBreakdown: Array<{name: string, value: number, fill: string}>;
  
  // Pour différencier profil personnel vs consulté
  isCurrentUser: boolean;
}

const ProjectActivitiesSummary: React.FC<ProjectActivitiesSummaryProps> = ({
  totalCreatedProjects,
  totalCreatedArea,
  totalCreatedFunding,
  totalCreatedProfit,
  totalInvestedProjects,
  totalInvested,
  totalInvestmentProfit,
  averageROI,
  ongoingProjects,
  completedProjects,
  activitiesBreakdown,
  statusBreakdown,
  isCurrentUser
}) => {
  const isPositiveROI = averageROI >= 0;
  const totalGlobalProfit = totalCreatedProfit + totalInvestmentProfit;
  const totalActivities = totalCreatedProjects + totalInvestedProjects;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {isCurrentUser ? 'Résumé de mes activités' : 'Aperçu des activités'}
        </h3>
        <div className="text-sm text-muted-foreground">
          {totalActivities} {totalActivities > 1 ? 'activités' : 'activité'} au total
        </div>
      </div>
      
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projets créés</CardDescription>
            <CardTitle className="flex items-center">
              <Sprout className="h-5 w-5 mr-2 text-green-500" />
              {totalCreatedProjects}
            </CardTitle>
            {totalCreatedArea > 0 && (
              <CardDescription className="text-xs">
                {totalCreatedArea.toFixed(2)} ha au total
              </CardDescription>
            )}
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projets investis</CardDescription>
            <CardTitle className="flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-blue-500" />
              {totalInvestedProjects}
            </CardTitle>
            {isCurrentUser && (
              <CardDescription className="text-xs">
                {formatCurrency(totalInvested)} investi
              </CardDescription>
            )}
          </CardHeader>
        </Card>
        
        {isCurrentUser && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>ROI moyen</CardDescription>
              <CardTitle className={`flex items-center ${isPositiveROI ? 'text-green-600' : 'text-red-500'}`}>
                {isPositiveROI ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {averageROI.toFixed(1)}%
              </CardTitle>
            </CardHeader>
          </Card>
        )}
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Statut des projets</CardDescription>
            <CardTitle className="flex space-x-2 text-sm">
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-blue-500" />
                {ongoingProjects} en cours
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                {completedProjects} terminés
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition des activités */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des activités</CardTitle>
            <CardDescription>Projets créés vs investissements</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activitiesBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {activitiesBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const value = payload[0].value as number;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-md">
                            <div className="font-medium">{payload[0].name}</div>
                            <div>{`${value} projets`}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Statuts des projets */}
        <Card>
          <CardHeader>
            <CardTitle>Statuts des projets</CardTitle>
            <CardDescription>Distribution par statut</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBreakdown}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    content={({ payload, label }) => {
                      if (payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-md">
                            <div className="font-medium">{label}</div>
                            <div>{`${payload[0].value} projets`}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="#8884d8">
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Résumé financier (seulement pour l'utilisateur courant) */}
      {isCurrentUser && (totalCreatedFunding > 0 || totalInvested > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Résumé financier</CardTitle>
            <CardDescription>Vue d'ensemble de vos finances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalCreatedFunding)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Financements reçus
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalInvested)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Montant investi
                </div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${totalGlobalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {formatCurrency(totalGlobalProfit)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Bénéfice estimé total
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectActivitiesSummary;