
import React, { useState } from "react";
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

type SortField = 'nom_jalon' | 'technicien_nom' | 'nom_projet' | 'montant_demande' | 'date_limite';
type SortDirection = 'asc' | 'desc' | null;

const MilestoneSection: React.FC<MilestoneSectionProps> = ({
  title,
  icon: Icon,
  badgeVariant,
  jalons,
  onSendPayment,
  getUrgencyBadge
}) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  if (jalons.length === 0) {
    return null;
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedJalons = React.useMemo(() => {
    if (!sortField || !sortDirection) {
      return jalons;
    }

    return [...jalons].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'nom_jalon':
          aValue = a.nom_jalon;
          bValue = b.nom_jalon;
          break;
        case 'technicien_nom':
          aValue = `${a.technicien_nom} ${a.technicien_prenoms}`.trim();
          bValue = `${b.technicien_nom} ${b.technicien_prenoms}`.trim();
          break;
        case 'nom_projet':
          aValue = a.nom_projet;
          bValue = b.nom_projet;
          break;
        case 'montant_demande':
          aValue = a.montant_demande;
          bValue = b.montant_demande;
          break;
        case 'date_limite':
          aValue = new Date(a.date_limite);
          bValue = new Date(b.date_limite);
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [jalons, sortField, sortDirection]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return '⇵';
    }
    if (sortDirection === 'asc') {
      return '▲';
    } else if (sortDirection === 'desc') {
      return '▼';
    }
    return '⇵';
  };

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
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('nom_jalon')}
              >
                <div className="flex items-center justify-between">
                  Jalon
                  <span className="ml-1 text-xs">{getSortIcon('nom_jalon')}</span>
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('technicien_nom')}
              >
                <div className="flex items-center justify-between">
                  Technicien
                  <span className="ml-1 text-xs">{getSortIcon('technicien_nom')}</span>
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('nom_projet')}
              >
                <div className="flex items-center justify-between">
                  Projet
                  <span className="ml-1 text-xs">{getSortIcon('nom_projet')}</span>
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('montant_demande')}
              >
                <div className="flex items-center justify-between">
                  Montant
                  <span className="ml-1 text-xs">{getSortIcon('montant_demande')}</span>
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('date_limite')}
              >
                <div className="flex items-center justify-between">
                  Date Limite
                  <span className="ml-1 text-xs">{getSortIcon('date_limite')}</span>
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('date_limite')}
              >
                <div className="flex items-center justify-between">
                  Urgence
                  <span className="ml-1 text-xs">{getSortIcon('date_limite')}</span>
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedJalons.map((jalon) => (
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
