
import { useState } from 'react';

interface MvolaPaymentData {
  amount: string;
  currency: string;
  description: string;
  merchantID: string;
  customerMsisdn: string;
  X_Callback_URL: string;
}

interface MvolaResponse {
  status: number;
  serverCorrelationId: string;
  objectReference?: string;
}

export const useMvola = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = async (paymentData: MvolaPaymentData): Promise<MvolaResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      // Simulation d'un appel API MVola réussi
      console.log('Initiating MVola payment:', paymentData);
      
      // Simulation d'une réponse API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Délai de simulation
      
      const mockResponse: MvolaResponse = {
        status: 200,
        serverCorrelationId: `MVOLA-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        objectReference: `REF-${Date.now()}`
      };

      return mockResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du paiement MVola';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkTransactionStatus = async (correlationId: string): Promise<MvolaResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('Checking MVola transaction status:', correlationId);
      
      // Simulation d'une vérification de statut réussie
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResponse: MvolaResponse = {
        status: 200,
        serverCorrelationId: correlationId,
        objectReference: `VERIFIED-${correlationId}`
      };

      return mockResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la vérification du statut';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    initiatePayment,
    checkTransactionStatus,
    loading,
    error
  };
};

export default useMvola;
