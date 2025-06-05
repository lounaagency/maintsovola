
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send, User, MapPin, LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { JalonFinancement } from "@/types/financier";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MilestoneSectionProps {
  title: string;
  icon: LucideIcon;
  badgeVariant: "destructive" | "secondary" | "outline";
  jalons: JalonFinancement[];
  onSendPayment: (jalon: JalonFinancement) => void;
  getUrgencyBadge: (dateLimite: string) => React.ReactNode;
}

const MilestoneSection: React.FC<MilestoneSectionProps> = ({
  title,
  icon: Icon,
  badgeVariant,
  jalons,
  onSendPayment,
  getUrgencyBadge
}) => {
  if (jalons.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </div>
          <Badge variant={badgeVariant}>
            {jalons.length} jalon{jalons.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jalon</TableHead>
              <TableHead>Technicien</TableHead>
              <TableHead>Projet</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Date Limite</TableHead>
              <TableHead>Urgence</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jalons.map((jalon) => (
              <TableRow key={jalon.id_jalon_projet}>
                <TableCell>
                  <div className="font-medium">{jalon.nom_jalon}</div>
                  <div className="text-sm text-muted-foreground">
                    Statut: {jalon.statut}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {jalon.technicien_nom} {jalon.technicien_prenoms}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{jalon.nom_projet}</div>
                      <div className="text-sm text-muted-foreground">
                        {jalon.surface_ha} ha
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-green-600">
                    {formatCurrency(jalon.montant_demande)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(jalon.date_limite), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </TableCell>
                <TableCell>
                  {getUrgencyBadge(jalon.date_limite)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => onSendPayment(jalon)}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Envoyer
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MilestoneSection;
