
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Download, CheckCircle, AlertCircle, Clock, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { HistoriquePaiementFinancier } from "@/types/financier";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { usePaymentActions } from "@/hooks/usePaymentActions";

interface PaymentHistoryListProps {
  historique: HistoriquePaiementFinancier[];
  isLoading: boolean;
}

const PaymentHistoryList: React.FC<PaymentHistoryListProps> = ({
  historique,
  isLoading
}) => {
  const [validationComment, setValidationComment] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<number | null>(null);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);

  const { validateJustificatif } = usePaymentActions();

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'valide':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Validé</Badge>;
      case 'rejete':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Rejeté</Badge>;
      case 'en_attente':
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    }
  };

  const handleValidateJustificatif = async (paymentId: number, status: string) => {
    await validateJustificatif.mutateAsync({ paymentId, status });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des Paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
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

  if (historique.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des Paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2" />
            <p>Aucun paiement effectué</p>
            <p className="text-sm">L'historique apparaîtra ici après les premiers paiements</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des Paiements ({historique.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Technicien</TableHead>
              <TableHead>Projet</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Justificatif</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historique.map((paiement) => (
              <TableRow key={paiement.id_historique_paiement}>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(paiement.date_paiement), 'dd MMM yyyy', { locale: fr })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(paiement.date_paiement), 'HH:mm', { locale: fr })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm">
                    {paiement.reference_paiement}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {paiement.type_paiement}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {paiement.technicien_nom || 'Non assigné'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {paiement.nom_projet || 'Projet inconnu'}
                  </div>
                  {paiement.observation && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {paiement.observation}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-bold text-green-600">
                    {formatCurrency(paiement.montant)}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(paiement.statut_justificatif)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {paiement.justificatif_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => window.open(paiement.justificatif_url, '_blank')}
                      >
                        <Eye className="h-3 w-3" />
                        Voir
                      </Button>
                    )}
                    
                    {paiement.statut_justificatif === 'en_attente' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-green-600"
                          onClick={() => handleValidateJustificatif(paiement.id_historique_paiement, 'valide')}
                          disabled={validateJustificatif.isPending}
                        >
                          <CheckCircle className="h-3 w-3" />
                          Valider
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-600"
                          onClick={() => handleValidateJustificatif(paiement.id_historique_paiement, 'rejete')}
                          disabled={validateJustificatif.isPending}
                        >
                          <AlertCircle className="h-3 w-3" />
                          Rejeter
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PaymentHistoryList;
