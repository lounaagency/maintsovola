import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useSuperviseurAlerts } from "@/hooks/useSuperviseurAlerts";
import { ProjectAlert } from "@/types/superviseur";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface AlertsPanelProps {
  userId: string;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ userId }) => {
  const { data: alerts, isLoading } = useSuperviseurAlerts(userId);

  const getAlertIcon = (type: ProjectAlert['type']) => {
    switch (type) {
      case 'retard':
        return <Clock className="h-4 w-4" />;
      case 'blocage':
        return <XCircle className="h-4 w-4" />;
      case 'anomalie':
        return <AlertTriangle className="h-4 w-4" />;
      case 'materiel':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getGravityBadge = (gravite: ProjectAlert['gravite']) => {
    const gravityConfig = {
      'critique': { label: 'Critique', variant: 'destructive' as const },
      'haute': { label: 'Haute', variant: 'destructive' as const },
      'moyenne': { label: 'Moyenne', variant: 'secondary' as const },
      'faible': { label: 'Faible', variant: 'outline' as const }
    };
    
    const config = gravityConfig[gravite];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (statut: ProjectAlert['statut']) => {
    switch (statut) {
      case 'ouverte':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'en_cours':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolue':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement des alertes...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const alertesOuvertes = alerts?.filter(a => a.statut === 'ouverte') || [];
  const alertesEnCours = alerts?.filter(a => a.statut === 'en_cours') || [];
  const alertesResolues = alerts?.filter(a => a.statut === 'resolue') || [];

  return (
    <div className="space-y-6">
      {/* Statistiques des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Alertes Ouvertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertesOuvertes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              En Cours de Traitement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{alertesEnCours.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Résolues (7 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{alertesResolues.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des alertes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertes et Incidents
          </CardTitle>
          <CardDescription>
            Alertes nécessitant votre attention et actions à prendre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts?.map((alerte) => (
              <div
                key={alerte.id_alerte}
                className={`p-4 border rounded-lg ${
                  alerte.statut === 'ouverte' ? 'border-red-200 bg-red-50' :
                  alerte.statut === 'en_cours' ? 'border-yellow-200 bg-yellow-50' :
                  'border-green-200 bg-green-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alerte.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">
                          Projet #{alerte.id_projet} - {alerte.type}
                        </h4>
                        {getGravityBadge(alerte.gravite)}
                        {getStatusIcon(alerte.statut)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {alerte.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alerte.date_creation), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {alerte.statut === 'ouverte' && (
                      <Button size="sm" variant="outline">
                        Prendre en charge
                      </Button>
                    )}
                    {alerte.statut === 'en_cours' && (
                      <Button size="sm" variant="default">
                        Marquer résolu
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      Voir détails
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!alerts?.length && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>Aucune alerte active. Tout va bien !</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsPanel;