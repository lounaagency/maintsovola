
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  success?: boolean;
  message?: string;
  transactionId?: string;
}

interface SendPaymentData {
  amount: string;
  phoneNumber: string;
  description: string;
  merchantId: string;
  investmentId: number;
}

export const useMvola = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = async (paymentData: SendPaymentData): Promise<MvolaResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('Initiating MVola payment via edge function:', paymentData);
      
      const { data: response, error } = await supabase.functions.invoke('paiement-mvola', {
        body: {
          phone: paymentData.phoneNumber,
          amount: paymentData.amount,
          reason: paymentData.description,
          investissementId: paymentData.investmentId
        }
      });

      if (error) {
        throw new Error(`Erreur lors de l'appel à l'API MVola: ${error.message}`);
      }

      if (!response.success) {
        throw new Error(response.message || "Échec du paiement MVola");
      }

      return {
        status: 200,
        serverCorrelationId: response.transactionId,
        objectReference: response.transactionId,
        success: response.success,
        message: response.message,
        transactionId: response.transactionId
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du paiement MVola';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendPaymentToMvola = async (paymentData: SendPaymentData): Promise<MvolaResponse | null> => {
    // Cette fonction est maintenant un alias de initiatePayment pour maintenir la compatibilité
    return initiatePayment(paymentData);
  };

  const checkTransactionStatus = async (correlationId: string): Promise<MvolaResponse | null> => {
    // L'edge function gère déjà le statut, pas besoin de vérification séparée
    return {
      status: 200,
      serverCorrelationId: correlationId,
      objectReference: correlationId
    };
  };

  return {
    initiatePayment,
    sendPaymentToMvola,
    checkTransactionStatus,
    loading,
    error
  };
};

export default useMvola;
