
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
  status: string;
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
        
        // Fetch payments associated with user's investments
        const { data: userInvestments, error: investmentsError } = await supabase
          .from('investissement')
          .select('id_investissement')
          .eq('id_investisseur', userId);

        if (investmentsError) throw investmentsError;

        if (!userInvestments || userInvestments.length === 0) {
          setPayments([]);
          setPendingPayments([]);
          return;
        }

        const investmentIds = userInvestments.map(inv => inv.id_investissement);

        // Using a simpler query to avoid deep type instantiation
        const { data: paymentHistory, error: paymentsError } = await supabase
          .from('historique_paiement')
          .select('*')
          .in('id_investissement', investmentIds)
          .order('date_paiement', { ascending: false });

        if (paymentsError) throw paymentsError;

        // Fetch pending payments (investments without payment records)
        const { data: pendingPaymentsData, error: pendingPaymentsError } = await supabase
          .from('investissement')
          .select('*, projet:id_projet(id_projet, titre)')
          .eq('id_investisseur', userId)
          .eq('statut_paiement', 'en attente');

        if (pendingPaymentsError) throw pendingPaymentsError;

        // Fetch projects separately to avoid deep nesting
        const paymentProjects: Record<string, any> = {};
        
        if (paymentHistory && paymentHistory.length > 0) {
          // Get all investments with project data
          const { data: investmentProjects } = await supabase
            .from('investissement')
            .select('id_investissement, id_projet, projet:id_projet(id_projet, titre)')
            .in('id_investissement', investmentIds);
              
          if (investmentProjects) {
            investmentProjects.forEach((item: any) => {
              if (item.projet) {
                paymentProjects[item.id_projet] = item.projet;
              }
            });
          }
        }

        // Format the payment data
        const formattedPayments = paymentHistory?.map((payment: any) => ({
          ...payment,
          projet: payment.id_projet ? paymentProjects[payment.id_projet] : null
        })) || [];

        setPayments(formattedPayments);
        setPendingPayments(pendingPaymentsData || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des paiements:', error);
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
                      {format(new Date(payment.date_investissement), 'dd MMM yyyy', { locale: fr })}
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
                      <Badge variant={payment.status === 'effectué' ? 'success' : 'default'}>
                        {payment.status}
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
