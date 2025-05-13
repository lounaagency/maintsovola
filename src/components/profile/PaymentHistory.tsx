
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Payment {
  id_paiement: number;
  reference_transaction: string;
  methode_paiement: string;
  montant: number;
  status: string;
  date_paiement: string;
  id_investissement: number | null;
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
  const [loading, setLoading] = useState(true);

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
          return;
        }

        const investmentIds = userInvestments.map(inv => inv.id_investissement);

        // Using a simpler query to avoid deep type instantiation
        const { data: paymentHistory, error: paymentsError } = await supabase
          .from('historique_paiement')
          .select('*, id_investissement')
          .in('id_investissement', investmentIds)
          .order('date_paiement', { ascending: false });

        if (paymentsError) throw paymentsError;

        // Fetch projects separately to avoid deep nesting
        const paymentProjects: Record<string, any> = {};
        
        if (paymentHistory && paymentHistory.length > 0) {
          // Get all investments with project data
          const relevantInvestments = paymentHistory
            .filter(p => p.id_investissement)
            .map(p => p.id_investissement);
            
          if (relevantInvestments.length > 0) {
            const { data: investmentProjects } = await supabase
              .from('investissement')
              .select('id_investissement, id_projet, projet:id_projet(id_projet, titre)')
              .in('id_investissement', relevantInvestments);
              
            if (investmentProjects) {
              investmentProjects.forEach((item: any) => {
                if (item.projet) {
                  paymentProjects[item.id_investissement] = item.projet;
                }
              });
            }
          }
        }

        // Format the payment data
        const formattedPayments = paymentHistory?.map((payment: any) => ({
          ...payment,
          projet: payment.id_investissement ? paymentProjects[payment.id_investissement] : null
        })) || [];

        setPayments(formattedPayments);
      } catch (error) {
        console.error('Erreur lors de la récupération des paiements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Aucun paiement effectué pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                  {payment.reference_transaction?.substring(0, 8)}...
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
    </div>
  );
};

export default PaymentHistory;
