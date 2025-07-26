import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, AlertTriangle, User, MapPin } from "lucide-react";
import { useSuperviseurProjects } from "@/hooks/useSuperviseurProjects";

interface ProjectsOverviewProps {
  userId: string;
}

const ProjectsOverview: React.FC<ProjectsOverviewProps> = ({ userId }) => {
  const { data: projects, isLoading } = useSuperviseurProjects(userId);

  const getStatusBadge = (statut: string) => {
    const statusConfig = {
      "en_cours": { label: "En cours", variant: "default" as const },
      "en_financement": { label: "En financement", variant: "secondary" as const },
      "valide": { label: "Validé", variant: "default" as const },
      "en_attente": { label: "En attente", variant: "outline" as const },
      "en_retard": { label: "En retard", variant: "destructive" as const }
    };
    
    const config = statusConfig[statut as keyof typeof statusConfig] || statusConfig["en_attente"];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement des projets...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Projets Supervisés
        </CardTitle>
        <CardDescription>
          Vue d'ensemble de tous les projets sous votre supervision
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projet</TableHead>
              <TableHead>Technicien</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Avancement</TableHead>
              <TableHead>Alertes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects?.map((projet) => (
              <TableRow key={projet.id_projet}>
                <TableCell>
                  <div>
                    <div className="font-medium">{projet.titre}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {projet.id_projet}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <div className="font-medium">
                        {projet.technicien_assigne.nom} {projet.technicien_assigne.prenoms}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(projet.statut)}
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Progress value={projet.avancement_pourcentage} className="w-[60px]" />
                    <span className="text-sm text-muted-foreground">
                      {projet.avancement_pourcentage}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {projet.retards > 0 && (
                    <div className="flex items-center gap-1 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">{projet.retards} retard(s)</span>
                    </div>
                  )}
                  {projet.alertes.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {projet.alertes.length}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Voir détails
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!projects?.length && (
          <div className="text-center py-8 text-muted-foreground">
            Aucun projet assigné pour le moment
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectsOverview;