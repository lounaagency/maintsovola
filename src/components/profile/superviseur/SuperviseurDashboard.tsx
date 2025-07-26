import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Users, MapPin, Package, BarChart3, CheckCircle } from "lucide-react";
import { useSuperviseurDashboard } from "@/hooks/useSuperviseurDashboard";
import ProjectsOverview from "./ProjectsOverview";
import TechnicianManagement from "./TechnicianManagement";
import AlertsPanel from "./AlertsPanel";
import LogisticsPanel from "./LogisticsPanel";
import SuperviseurMap from "./SuperviseurMap";
import PerformanceMetrics from "./PerformanceMetrics";

interface SuperviseurDashboardProps {
  userId: string;
}

const SuperviseurDashboard: React.FC<SuperviseurDashboardProps> = ({ userId }) => {
  const { data: kpis, isLoading } = useSuperviseurDashboard(userId);

  return (
    <div className="space-y-6">
      {/* KPIs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.projets_total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {kpis?.projets_en_cours || 0} en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Réussite</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.taux_reussite?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Performance globale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets en Retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {kpis?.projets_en_retard || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Nécessitent attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents Résolus</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.incidents_resolus || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="projects">Projets</TabsTrigger>
          <TabsTrigger value="technicians">Techniciens</TabsTrigger>
          <TabsTrigger value="map">Carte</TabsTrigger>
          <TabsTrigger value="logistics">Logistique</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <PerformanceMetrics userId={userId} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <ProjectsOverview userId={userId} />
        </TabsContent>

        <TabsContent value="technicians" className="space-y-4">
          <TechnicianManagement userId={userId} />
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <SuperviseurMap userId={userId} />
        </TabsContent>

        <TabsContent value="logistics" className="space-y-4">
          <LogisticsPanel userId={userId} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertsPanel userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperviseurDashboard;