
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Sprout } from 'lucide-react';
import { useAssignedParcels } from '@/hooks/useAssignedParcels';

interface AssignedParcelsViewProps {
  userId: string;
  userRole: string;
}

const AssignedParcelsView: React.FC<AssignedParcelsViewProps> = ({ userId, userRole }) => {
  const { parcels, loading, error } = useAssignedParcels(userId, userRole);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Erreur: {error}</p>
      </div>
    );
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'ensemencement': return 'bg-blue-100 text-blue-800';
      case 'croissance': return 'bg-green-100 text-green-800';
      case 'recolte': return 'bg-orange-100 text-orange-800';
      case 'termine': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Parcelles assignées</h3>
        <Badge variant="outline">{parcels.length} parcelle(s)</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {parcels.map((parcel) => (
          <Card key={parcel.id_projet} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{parcel.titre}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={14} />
                <span>{parcel.localisation.region}, {parcel.localisation.district}</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Surface:</span>
                <span className="text-sm">{parcel.surface_ha} ha</span>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Cultures:</span>
                {parcel.cultures.map((culture, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sprout size={14} />
                      <span className="text-sm">{culture.nom_culture}</span>
                    </div>
                    <Badge className={getPhaseColor(culture.phase_actuelle)}>
                      {culture.phase_actuelle}
                    </Badge>
                  </div>
                ))}
              </div>

              {parcel.date_debut_production && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar size={14} />
                  <span>Début: {new Date(parcel.date_debut_production).toLocaleDateString()}</span>
                </div>
              )}

              {parcel.prochaines_actions.length > 0 && (
                <div className="pt-2 border-t">
                  <span className="text-sm font-medium">Prochaines actions:</span>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    {parcel.prochaines_actions.slice(0, 2).map((action, idx) => (
                      <li key={idx}>• {action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {parcels.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Sprout size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucune parcelle assignée</p>
        </div>
      )}
    </div>
  );
};

export default AssignedParcelsView;
