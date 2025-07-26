import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Filter, Layers, Maximize } from "lucide-react";

interface SuperviseurMapProps {
  userId: string;
}

const SuperviseurMap: React.FC<SuperviseurMapProps> = ({ userId }) => {
  // Mock data pour les parcelles - à remplacer par de vraies données
  const parcelles = [
    {
      id: 1,
      titre: "Rizière de Fianarantsoa",
      statut: "en_cours",
      technicien: "Jean Rakoto",
      surface: 2.5,
      latitude: -21.4568,
      longitude: 47.0876
    },
    {
      id: 2,
      titre: "Culture de maïs Antsirabe",
      statut: "valide",
      technicien: "Marie Rabe",
      surface: 1.8,
      latitude: -19.8667,
      longitude: 47.0333
    }
  ];

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'en_cours': return 'bg-blue-500';
      case 'valide': return 'bg-green-500';
      case 'en_retard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Contrôles de la carte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Carte Interactive des Projets
          </CardTitle>
          <CardDescription>
            Visualisation géographique de tous vos projets supervisés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filtrer
            </Button>
            <Button variant="outline" size="sm">
              <Layers className="h-4 w-4 mr-1" />
              Couches
            </Button>
            <Button variant="outline" size="sm">
              <Maximize className="h-4 w-4 mr-1" />
              Plein écran
            </Button>
          </div>
          
          {/* Zone de carte placeholder */}
          <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500 font-medium">Carte Interactive</p>
              <p className="text-sm text-gray-400">
                L'intégration cartographique sera implémentée avec Leaflet ou MapBox
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Légende et informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Légende des Statuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Projet validé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm">En cours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm">En financement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">En retard</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Parcelles Sélectionnées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parcelles.map((parcelle) => (
                <div key={parcelle.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(parcelle.statut)}`}></div>
                    <div>
                      <div className="font-medium text-sm">{parcelle.titre}</div>
                      <div className="text-xs text-muted-foreground">
                        {parcelle.technicien} • {parcelle.surface} ha
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Voir
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outils d'analyse */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Outils d'Analyse Géographique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" size="sm">
              Mesurer distance
            </Button>
            <Button variant="outline" size="sm">
              Calculer surface
            </Button>
            <Button variant="outline" size="sm">
              Zone tampon
            </Button>
            <Button variant="outline" size="sm">
              Exporter carte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperviseurMap;