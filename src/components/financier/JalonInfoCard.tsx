
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, MapPin, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { JalonFinancement } from "@/types/financier";

interface JalonInfoCardProps {
  jalon: JalonFinancement;
}

const JalonInfoCard: React.FC<JalonInfoCardProps> = ({ jalon }) => {
  return (
    <Card className="mb-4">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {jalon.technicien_nom} {jalon.technicien_prenoms}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{jalon.nom_projet} ({jalon.surface_ha} ha)</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            Échéance: {format(new Date(jalon.date_limite), 'dd MMMM yyyy', { locale: fr })}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-bold text-green-600">
            Montant demandé: {formatCurrency(jalon.montant_demande)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default JalonInfoCard;
