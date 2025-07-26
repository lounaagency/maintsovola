import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Calendar, CheckCircle, AlertCircle, Star } from "lucide-react";
import { useTechnicianPerformance } from "@/hooks/useTechnicianPerformance";

interface TechnicianManagementProps {
  userId: string;
}

const TechnicianManagement: React.FC<TechnicianManagementProps> = ({ userId }) => {
  const { data: technicians, isLoading } = useTechnicianPerformance(userId);

  const getPerformanceColor = (taux: number) => {
    if (taux >= 80) return "text-green-600";
    if (taux >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceBadge = (taux: number) => {
    if (taux >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (taux >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Bon</Badge>;
    return <Badge className="bg-red-100 text-red-800">À améliorer</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement des techniciens...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des Techniciens
          </CardTitle>
          <CardDescription>
            Performance et activités des techniciens sous votre supervision
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicians?.map((technicien) => (
              <Card key={technicien.id_technicien} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={`/api/placeholder/32/32`} />
                      <AvatarFallback>
                        {technicien.nom.charAt(0)}{technicien.prenoms.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {technicien.nom} {technicien.prenoms}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getPerformanceBadge(technicien.taux_completion)}
                        <span className="text-sm text-muted-foreground">
                          {technicien.taux_completion}% completion
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Projets assignés */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Projets assignés</span>
                    <Badge variant="outline">{technicien.projets_assignes}</Badge>
                  </div>

                  {/* Tâches complétées */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tâches complétées</span>
                      <span className="text-sm font-medium">
                        {technicien.taches_completees}
                      </span>
                    </div>
                    <Progress value={technicien.taux_completion} className="h-2" />
                  </div>

                  {/* Retards */}
                  {technicien.taches_en_retard > 0 && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">
                        {technicien.taches_en_retard} tâche(s) en retard
                      </span>
                    </div>
                  )}

                  {/* Qualité des rapports */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Qualité rapports</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {technicien.qualite_rapports}%
                      </span>
                    </div>
                  </div>

                  {/* Présences */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Présences semaine</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {technicien.presences_semaine}/5 jours
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Voir planning
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Contacter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!technicians?.length && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun technicien assigné
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicianManagement;