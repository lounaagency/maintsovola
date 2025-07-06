
import React from 'react';
import { Separator } from '@/components/ui/separator';
import TechnicienPaymentSummary from './TechnicienPaymentSummary';
import UpcomingPaymentSchedule from './UpcomingPaymentSchedule';
import TechnicienPaymentHistory from './TechnicienPaymentHistory';
import TechnicienPaymentActions from './TechnicienPaymentActions';
import { useTechnicienPaymentData } from '@/hooks/useTechnicienPaymentData';

interface TechnicienPaymentDashboardProps {
  userId: string;
}

const TechnicienPaymentDashboard: React.FC<TechnicienPaymentDashboardProps> = ({ userId }) => {
  const { 
    metrics, 
    upcomingPayments, 
    receivedPayments, 
    loading 
  } = useTechnicienPaymentData(userId);

  // Convertir les paiements à venir en paiements éligibles pour les demandes
  const eligiblePayments = upcomingPayments
    .filter(payment => payment.statut === 'Terminé' && payment.montant !== null)
    .map(payment => ({
      id_jalon_projet: payment.id_jalon_projet,
      projet_titre: payment.projet_titre,
      jalon_nom: payment.jalon_nom,
      montant: payment.montant!,
      date_previsionnelle: payment.date_previsionnelle,
      statut: payment.statut
    }));

  const handlePaymentRequest = (jalonId: number) => {
    console.log(`Payment requested for jalon: ${jalonId}`);
    // La logique de demande de paiement sera gérée par le parent ou un hook dédié
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Résumé des Paiements */}
      <TechnicienPaymentSummary metrics={metrics} />
      
      <Separator className="my-6" />
      
      {/* Section Actions de Paiement */}
      <TechnicienPaymentActions 
        pendingPayments={eligiblePayments}
        onPaymentRequest={handlePaymentRequest}
      />
      
      <Separator className="my-6" />
      
      {/* Section Planning des Paiements à Venir */}
      <UpcomingPaymentSchedule upcomingPayments={upcomingPayments} />
      
      <Separator className="my-6" />
      
      {/* Section Historique des Paiements Reçus */}
      <TechnicienPaymentHistory receivedPayments={receivedPayments} />
    </div>
  );
};

export default TechnicienPaymentDashboard;
