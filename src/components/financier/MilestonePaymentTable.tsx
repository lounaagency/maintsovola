
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Calendar, User, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { JalonFinancement } from "@/types/financier";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import SendPaymentModal from "./SendPaymentModal";

interface MilestonePaymentTableProps {
  jalons: JalonFinancement[];
  isLoading: boolean;
}

const MilestonePaymentTable: React.FC<MilestonePaymentTableProps> = ({
  jalons,
  isLoading
}) => {
  const [selectedJalon, setSelectedJalon] = useState<JalonFinancement | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleSendPayment = (jalon: JalonFinancement) => {
    setSelectedJalon(jalon);
    setShowPaymentModal(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jalons à Financer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (jalons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jalons à Financer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2" />
            <p>Aucun jalon en attente de financement</p>
            <p className="text-sm">Tous les jalons du mois sont financés</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getUrgencyBadge = (dateLimite: string) => {
    const today = new Date();
    const limite = new Date(dateLimite);
    const diffDays = Math.ceil((limite.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge variant="destructive">En retard</Badge>;
    } else if (diffDays <= 3) {
      return <Badge variant="destructive">Urgent</Badge>;
    } else if (diffDays <= 7) {
      return <Badge variant="secondary">Cette semaine</Badge>;
    } else {
      return <Badge variant="outline">Planifié</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Jalons à Financer ({jalons.length})
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
                      onClick={() => handleSendPayment(jalon)}
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

      <SendPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedJalon(null);
        }}
        jalon={selectedJalon}
      />
    </>
  );
};

export default MilestonePaymentTable;
