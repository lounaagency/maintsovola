import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Truck, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useLogisticsRequests } from "@/hooks/useLogisticsRequests";
import { LogisticsRequest } from "@/types/superviseur";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface LogisticsPanelProps {
  userId: string;
}

const LogisticsPanel: React.FC<LogisticsPanelProps> = ({ userId }) => {
  const { data: requests, isLoading } = useLogisticsRequests(userId);

  const getMaterialIcon = (type: LogisticsRequest['type_materiel']) => {
    switch (type) {
      case 'semences':
        return <Package className="h-4 w-4 text-green-600" />;
      case 'engrais':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'outils':
        return <Package className="h-4 w-4 text-gray-600" />;
      case 'equipement':
        return <Package className="h-4 w-4 text-purple-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getUrgencyBadge = (urgence: LogisticsRequest['urgence']) => {
    const urgencyConfig = {
      'critique': { label: 'Critique', variant: 'destructive' as const },
      'urgente': { label: 'Urgente', variant: 'destructive' as const },
      'normale': { label: 'Normale', variant: 'default' as const }
    };
    
    const config = urgencyConfig[urgence];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (statut: LogisticsRequest['statut']) => {
    const statusConfig = {
      'en_attente': { label: 'En attente', variant: 'secondary' as const, icon: Clock },
      'approuvee': { label: 'Approuvée', variant: 'default' as const, icon: CheckCircle },
      'en_cours': { label: 'En cours', variant: 'default' as const, icon: Truck },
      'livree': { label: 'Livrée', variant: 'default' as const, icon: CheckCircle },
      'refusee': { label: 'Refusée', variant: 'destructive' as const, icon: AlertCircle }
    };
    
    const config = statusConfig[statut];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement des demandes...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const demandesEnAttente = requests?.filter(r => r.statut === 'en_attente').length || 0;
  const demandesApprouvees = requests?.filter(r => r.statut === 'approuvee').length || 0;
  const demandesEnCours = requests?.filter(r => r.statut === 'en_cours').length || 0;

  return (
    <div className="space-y-6">
      {/* Statistiques des demandes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              En Attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demandesEnAttente}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Approuvées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demandesApprouvees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-500" />
              En Livraison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demandesEnCours}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Demandes ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Formulaire de nouvelle demande */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Nouvelle Demande de Matériel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button className="w-full md:w-auto">
            <Package className="h-4 w-4 mr-2" />
            Créer une demande
          </Button>
        </CardContent>
      </Card>

      {/* Tableau des demandes */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes de Matériel</CardTitle>
          <CardDescription>
            Gestion des demandes de matériel pour vos projets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type & Description</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Urgence</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Livraison Souhaitée</TableHead>
                <TableHead>Projet</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests?.map((demande) => (
                <TableRow key={demande.id_demande}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getMaterialIcon(demande.type_materiel)}
                      <div>
                        <div className="font-medium capitalize">
                          {demande.type_materiel}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {demande.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{demande.quantite}</span>
                  </TableCell>
                  <TableCell>
                    {getUrgencyBadge(demande.urgence)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(demande.statut)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDistanceToNow(new Date(demande.date_livraison_souhaitee), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {demande.projet_concerne && (
                      <Badge variant="outline">
                        Projet #{demande.projet_concerne}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {demande.statut === 'en_attente' && (
                        <>
                          <Button size="sm" variant="default">
                            Approuver
                          </Button>
                          <Button size="sm" variant="outline">
                            Refuser
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost">
                        Voir détails
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!requests?.length && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2" />
              <p>Aucune demande de matériel</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogisticsPanel;