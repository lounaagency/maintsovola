
import { useState } from "react";

export interface InitiatePaymentRequest {
  amount: string;
  phoneNumber: string;
  description: string;
  merchantId: string;
  investmentId: number;
}

export interface InitiatePaymentResponse {
  status: number;
  data?: any;
  message?: string;
}

const useMvola = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const initiatePayment = async (paymentData: InitiatePaymentRequest): Promise<InitiatePaymentResponse> => {
    setLoading(true);
    setError("");

    try {
      // Simulation d'un appel API MVola
      console.log("Initiating MVola payment:", paymentData);
      
      // Simuler un délai
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simuler une réponse de succès
      const response: InitiatePaymentResponse = {
        status: 200,
        data: {
          transactionId: `TXN-${Date.now()}`,
          correlationId: `CORR-${Date.now()}`,
        },
        message: "Payment initiated successfully"
      };

      setLoading(false);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || "Erreur lors de l'initiation du paiement";
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  const sendPaymentToMvola = async (paymentData: InitiatePaymentRequest): Promise<InitiatePaymentResponse> => {
    return await initiatePayment(paymentData);
  };

  const checkTransactionStatus = async (serverCorrelationId: string) => {
    setLoading(true);
    setError("");

    try {
      console.log("Checking transaction status:", serverCorrelationId);
      
      // Simuler un délai
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simuler une réponse de statut
      const response = {
        status: 200,
        data: {
          transactionStatus: "COMPLETED",
          amount: "1000",
          currency: "MGA"
        }
      };

      setLoading(false);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || "Erreur lors de la vérification du statut";
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  return {
    loading,
    error,
    initiatePayment,
    sendPaymentToMvola,
    checkTransactionStatus,
  };
};

export default useMvola;
