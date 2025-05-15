
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import PaymentOptions from '@/components/PaymentOptions';
import { toast } from '@/components/ui/use-toast';

interface Payment {
  id_paiement: number;
  reference_transaction: string;
  methode_paiement: string;
  montant: number;
  statut: string;
  date_paiement: string;
  id_investissement?: number | null;
  projet?: {
    id_projet: number;
    titre: string;
  };
}

interface PendingPayment {
  id_investissement: number;
  id_projet: number;
  montant: number;
  date_investissement: string;
  projet?: {
    id_projet: number;
    titre: string;
  };
}

interface PaymentHistoryProps {
  userId: string;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ userId }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        
        // Fetch investments made by the user
        const { data: userInvestments, error: investmentsError } = await supabase
          .from('investissement')
          .select('id_investissement, id_projet, montant, date_decision_investir, statut_paiement, projet:id_projet(id_projet, titre)')
          .eq('id_investisseur', userId);

        if (investmentsError) throw investmentsError;

        if (!userInvestments || userInvestments.length === 0) {
          setPayments([]);
          setPendingPayments([]);
          setLoading(false);
          return;
        }

        // Get pending payments (investments without payment)
        const pendingInvestments = userInvestments
          .filter(inv => inv.statut_paiement !== 'payé')
          .map(inv => ({
            id_investissement: inv.id_investissement,
            id_projet: inv.id_projet,
            montant: inv.montant,
            date_investissement: inv.date_decision_investir,
            projet: inv.projet
          }));

        // Fetch investment payment history
        // FIXED: Instead of filtering by phone number, we get payments for the user's investments
        const investmentIds = userInvestments.map(inv => inv.id_investissement);
        const { data: paymentHistory, error: paymentHistoryError } = await supabase
          .from('historique_paiement_invest')
          .select('*, investissement:id_investissement(id_projet)')
          .in('id_investissement', investmentIds);

        if (paymentHistoryError) throw paymentHistoryError;

        // Format the payment data
        const formattedPayments = (paymentHistory || []).map((payment) => {
          // Get project info from the related investment
          const investment = userInvestments.find(inv => inv.id_investissement === payment.id_investissement);
          
          return {
            id_paiement: payment.id_paiement,
            reference_transaction: payment.reference_transaction,
            methode_paiement: payment.methode_paiement,
            montant: payment.montant,
            statut: payment.statut,
            date_paiement: payment.date_paiement,
            id_investissement: payment.id_investissement,
            projet: investment?.projet || null
          };
        });

        setPayments(formattedPayments);
        setPendingPayments(pendingInvestments);
      } catch (error) {
        console.error('Erreur lors de la récupération des paiements:', error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer l'historique des paiements",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [userId, paymentDialogOpen]);

  const handlePayNow = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setPaymentDialogOpen(true);
  };

  const handlePaymentComplete = (success: boolean) => {
    if (success) {
      toast({
        title: "Paiement réussi",
        description: "Votre paiement a été traité avec succès",
        variant: "default",
      });
    }
    setPaymentDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending Payments Section */}
      {pendingPayments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Paiements en attente</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Projet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingPayments.map((payment) => (
                  <tr key={payment.id_investissement}>
                    <td className="px-4 py-3 text-sm">
                      {payment.date_investissement ? format(new Date(payment.date_investissement), 'dd MMM yyyy', { locale: fr }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {payment.projet ? payment.projet.titre : 'Non spécifié'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatCurrency(payment.montant)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="warning">En attente</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button 
                        size="sm"
                        variant="default"
                        onClick={() => handlePayNow(payment)}
                      >
                        Payer maintenant
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment History Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Historique des paiements</h3>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucun paiement effectué pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Référence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Projet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Méthode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => (
                  <tr key={payment.id_paiement}>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(payment.date_paiement), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-4 py-3 text-sm text-primary font-mono">
                      {payment.reference_transaction?.substring(0, 8) + "..."}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {payment.projet ? payment.projet.titre : 'Non spécifié'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {payment.methode_paiement}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatCurrency(payment.montant)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={payment.statut === 'effectué' ? 'success' : 'default'}>
                        {payment.statut}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Effectuer le paiement</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <PaymentOptions
              investmentId={selectedPayment.id_investissement}
              amount={selectedPayment.montant}
              onPaymentComplete={handlePaymentComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentHistory;
