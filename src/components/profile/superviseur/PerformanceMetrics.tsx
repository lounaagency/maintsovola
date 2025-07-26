import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { useSuperviseurDashboard } from "@/hooks/useSuperviseurDashboard";
import { useTechnicianPerformance } from "@/hooks/useTechnicianPerformance";

interface PerformanceMetricsProps {
  userId: string;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ userId }) => {
  const { data: kpis } = useSuperviseurDashboard(userId);
  const { data: technicians } = useTechnicianPerformance(userId);

  // Mock data pour les graphiques - à remplacer par de vraies données
  const monthlyData = [
    { month: 'Jan', projets: 12, completion: 85 },
    { month: 'Fév', projets: 15, completion: 78 },
    { month: 'Mar', projets: 18, completion: 92 },
    { month: 'Avr', projets: 22, completion: 88 },
    { month: 'Mai', projets: 25, completion: 95 },
    { month: 'Jun', projets: 28, completion: 90 }
  ];

  const projectStatusData = [
    { name: 'Validés', value: kpis?.projets_total ? kpis.projets_total - kpis.projets_en_cours - kpis.projets_en_retard : 0, color: '#22c55e' },
    { name: 'En cours', value: kpis?.projets_en_cours || 0, color: '#3b82f6' },
    { name: 'En retard', value: kpis?.projets_en_retard || 0, color: '#ef4444' }
  ];

  const averagePerformance = technicians?.reduce((acc, t) => acc + t.taux_completion, 0) / (technicians?.length || 1);

  return (
    <div className="space-y-6">
      {/* Métriques de performance globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Taux de Réussite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.taux_reussite?.toFixed(1)}%</div>
            <Progress value={kpis?.taux_reussite || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Objectif: 85%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Performance Techniciens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePerformance?.toFixed(0)}%</div>
            <Progress value={averagePerformance || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Moyenne équipe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Productivité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.productivite_moyenne}%</div>
            <Progress value={kpis?.productivite_moyenne || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Incidents Résolus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.incidents_resolus}</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600">+12% ce mois</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques de performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Évolution Mensuelle</CardTitle>
            <CardDescription>
              Nombre de projets et taux de completion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="projets" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition des Projets</CardTitle>
            <CardDescription>
              Statut actuel de tous les projets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performances par technicien */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance des Techniciens</CardTitle>
          <CardDescription>
            Taux de completion et qualité des rapports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {technicians?.map((technicien) => (
              <div key={technicien.id_technicien} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {technicien.nom} {technicien.prenoms}
                    </span>
                    <div className="flex gap-2">
                      <Badge variant={technicien.taux_completion >= 80 ? "default" : "secondary"}>
                        {technicien.taux_completion}% completion
                      </Badge>
                      <Badge variant="outline">
                        {technicien.qualite_rapports}% qualité
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Projets assignés</div>
                      <div className="font-medium">{technicien.projets_assignes}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tâches complétées</div>
                      <div className="font-medium">{technicien.taches_completees}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">En retard</div>
                      <div className="font-medium text-red-600">{technicien.taches_en_retard}</div>
                    </div>
                  </div>
                  <Progress value={technicien.taux_completion} className="mt-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Indicateurs de tendance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Satisfaction Agriculteurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{kpis?.satisfaction_agriculteurs}%</div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <Progress value={kpis?.satisfaction_agriculteurs || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Délais Respectés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">88%</div>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <Progress value={88} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Budget Respecté</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">92%</div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <Progress value={92} className="mt-2" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceMetrics;