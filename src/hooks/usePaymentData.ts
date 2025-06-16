
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentMetrics {
  totalInvested: number;
  totalPaid: number;
  pendingPayments: number;
  thisMonthPaid: number;
  nextPaymentDue?: {
    amount: number;
    date: string;
    project: string;
  };
}

interface PaymentTrend {
  month: string;
  amount: number;
}

interface PaymentMethod {
  name: string;
  value: number;
  fill: string;
}

export const usePaymentData = (userId: string) => {
  const [metrics, setMetrics] = useState<PaymentMetrics>({
    totalInvested: 0,
    totalPaid: 0,
    pendingPayments: 0,
    thisMonthPaid: 0,
  });
  
  const [paymentTrends, setPaymentTrends] = useState<PaymentTrend[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Récupérer les investissements de l'utilisateur
        const { data: investments } = await supabase
          .from('investissement')
          .select('montant, statut_paiement, date_decision_investir, projet:id_projet(titre)')
          .eq('id_investisseur', userId);

        // Récupérer l'historique des paiements
        const { data: payments } = await supabase
          .from('historique_paiement_invest')
          .select('montant, methode_paiement, date_paiement')
          .eq('numero_telephone', userId);

        if (investments) {
          const totalInvested = investments.reduce((sum, inv) => sum + inv.montant, 0);
          const pendingInvestments = investments.filter(inv => inv.statut_paiement !== 'payé');
          const pendingPayments = pendingInvestments.reduce((sum, inv) => sum + inv.montant, 0);

          // Calculer le montant payé ce mois
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const thisMonthPaid = payments
            ?.filter(payment => {
              const paymentDate = new Date(payment.date_paiement);
              return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
            })
            ?.reduce((sum, payment) => sum + payment.montant, 0) || 0;

          const totalPaid = payments?.reduce((sum, payment) => sum + payment.montant, 0) || 0;

          // Prochaine échéance (simulation)
          const nextPaymentDue = pendingInvestments.length > 0 ? {
            amount: pendingInvestments[0].montant,
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            project: pendingInvestments[0].projet?.titre || 'Projet inconnu'
          } : undefined;

          setMetrics({
            totalInvested,
            totalPaid,
            pendingPayments,
            thisMonthPaid,
            nextPaymentDue
          });
        }

        // Calculer les tendances de paiement (6 derniers mois)
        if (payments) {
          const trends: { [key: string]: number } = {};
          const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
          
          payments.forEach(payment => {
            const date = new Date(payment.date_paiement);
            const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            trends[monthKey] = (trends[monthKey] || 0) + payment.montant;
          });

          const trendData = Object.entries(trends)
            .slice(-6)
            .map(([month, amount]) => ({ month, amount }));
          
          setPaymentTrends(trendData);

          // Calculer la répartition par méthode de paiement
          const methodCounts: { [key: string]: number } = {};
          payments.forEach(payment => {
            methodCounts[payment.methode_paiement] = (methodCounts[payment.methode_paiement] || 0) + payment.montant;
          });

          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
          const methodData = Object.entries(methodCounts).map(([name, value], index) => ({
            name,
            value,
            fill: colors[index % colors.length]
          }));

          setPaymentMethods(methodData);
        }
      } catch (error) {
        console.error('Error fetching payment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [userId]);

  return {
    metrics,
    paymentTrends,
    paymentMethods,
    loading
  };
};
