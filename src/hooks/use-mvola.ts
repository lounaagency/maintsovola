
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

  const initiatePayment = async (paymentData: MvolaPaymentData): Promise<MvolaResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('Initiating MVola payment:', paymentData);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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

  const sendPaymentToMvola = async (paymentData: SendPaymentData): Promise<MvolaResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('Sending payment to MVola:', paymentData);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResponse: MvolaResponse = {
        status: 200,
        serverCorrelationId: `MVOLA-PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        objectReference: `PAY-REF-${Date.now()}`
      };

      return mockResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'envoi du paiement MVola';
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
    sendPaymentToMvola,
    checkTransactionStatus,
    loading,
    error
  };
};

export default useMvola;
