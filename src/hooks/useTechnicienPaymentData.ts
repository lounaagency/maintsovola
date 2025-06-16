
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TechnicienPaymentMetrics {
  totalReceived: number;
  thisWeekForecast: number;
  thisMonthForecast: number;
  pendingPayments: number;
}

interface UpcomingPayment {
  id_jalon_projet: number;
  projet_titre: string;
  jalon_nom: string;
  date_previsionnelle: string;
  montant: number;
  statut: string;
}

interface ReceivedPayment {
  id_historique_paiement: number;
  montant: number;
  date_paiement: string;
  reference_paiement: string;
  type_paiement: string;
  nom_projet: string;
  observation: string;
}

export const useTechnicienPaymentData = (userId: string) => {
  const [metrics, setMetrics] = useState<TechnicienPaymentMetrics>({
    totalReceived: 0,
    thisWeekForecast: 0,
    thisMonthForecast: 0,
    pendingPayments: 0,
  });
  
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [receivedPayments, setReceivedPayments] = useState<ReceivedPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTechnicienPaymentData = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Récupérer l'historique des paiements reçus par le technicien
        const { data: historiquePayments } = await supabase
          .from('historique_paiement')
          .select(`
            id_historique_paiement,
            montant,
            date_paiement,
            reference_paiement,
            type_paiement,
            observation,
            projet:id_projet(titre)
          `)
          .eq('id_technicien', userId);

        // Récupérer les jalons à venir avec leurs coûts
        const { data: jalonsData } = await supabase
          .from('jalon_projet')
          .select(`
            id_jalon_projet,
            date_previsionnelle,
            statut,
            projet:id_projet(titre),
            jalon_agricole:id_jalon_agricole(nom_jalon),
            cout_jalon_projet!inner(montant_total)
          `)
          .eq('projet.id_technicien', userId)
          .in('statut', ['Prévu', 'En cours'])
          .gte('date_previsionnelle', new Date().toISOString());

        // Calculer les métriques
        const totalReceived = historiquePayments?.reduce((sum, payment) => sum + payment.montant, 0) || 0;
        
        // Dates pour les prévisions
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        let thisWeekForecast = 0;
        let thisMonthForecast = 0;
        let pendingPayments = 0;

        const upcomingPaymentsList: UpcomingPayment[] = [];

        if (jalonsData) {
          jalonsData.forEach(jalon => {
            const datePrevisionnelle = new Date(jalon.date_previsionnelle);
            const montant = jalon.cout_jalon_projet?.[0]?.montant_total || 0;
            
            pendingPayments += montant;

            if (datePrevisionnelle <= oneWeekFromNow) {
              thisWeekForecast += montant;
            }
            
            if (datePrevisionnelle <= endOfMonth) {
              thisMonthForecast += montant;
            }

            upcomingPaymentsList.push({
              id_jalon_projet: jalon.id_jalon_projet,
              projet_titre: jalon.projet?.titre || 'Projet inconnu',
              jalon_nom: jalon.jalon_agricole?.nom_jalon || 'Jalon inconnu',
              date_previsionnelle: jalon.date_previsionnelle,
              montant: montant,
              statut: jalon.statut
            });
          });
        }

        // Préparer l'historique des paiements reçus
        const receivedPaymentsList: ReceivedPayment[] = historiquePayments?.map(payment => ({
          id_historique_paiement: payment.id_historique_paiement,
          montant: payment.montant,
          date_paiement: payment.date_paiement,
          reference_paiement: payment.reference_paiement || '',
          type_paiement: payment.type_paiement,
          nom_projet: payment.projet?.titre || 'Projet inconnu',
          observation: payment.observation || ''
        })) || [];

        setMetrics({
          totalReceived,
          thisWeekForecast,
          thisMonthForecast,
          pendingPayments
        });

        setUpcomingPayments(upcomingPaymentsList.sort((a, b) => 
          new Date(a.date_previsionnelle).getTime() - new Date(b.date_previsionnelle).getTime()
        ));

        setReceivedPayments(receivedPaymentsList.sort((a, b) => 
          new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime()
        ));

      } catch (error) {
        console.error('Error fetching technician payment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicienPaymentData();
  }, [userId]);

  return {
    metrics,
    upcomingPayments,
    receivedPayments,
    loading
  };
};
