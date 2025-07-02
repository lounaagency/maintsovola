import { useState } from "react";
import apiClientMvola from "../utils/apiClientMvola";

interface InitiatePaymentRequest {
  amount: string;
  currency: string;
  description: string;
  merchantID: string;
  customerMsisdn: string;
  X_Callback_URL?: string;
}

interface InitiatePaymentResponse {
  serverCorrelationId: string;
  objectReference: string;
  status: number;
}

interface TransactionStatusResponse {
  serverCorrelationId: string;
  status: number;
  message: string;
}

const useMvola = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction d'initiation du paiement
  const initiatePayment = async (
    paymentData: InitiatePaymentRequest
  ): Promise<InitiatePaymentResponse | undefined> => {
    setLoading(true);
    try {
      const response = await apiClientMvola.post(
        "/mvola/mm/transactions/type/merchantpay/1.0.0/",
        paymentData
      );
      console.log("Paiement initié:", response.data);
      return response.data;
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erreur lors de l'initiation du paiement"
      );
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour vérifier le statut de la transaction
  const checkTransactionStatus = async (
    serverCorrelationId: string
  ): Promise<TransactionStatusResponse | undefined> => {
    setLoading(true);
    try {
      const response = await apiClientMvola.get(
        `/mvola/mm/transactions/type/merchantpay/1.0.0/status/${serverCorrelationId}`
      );
      console.log("Statut de la transaction:", response.data);
      return response.data;
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de la vérification du statut"
      );
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour envoyer un paiement via MVola
  const sendPaymentToMvola = async (paymentData: {
    amount: string;
    phoneNumber: string;
    description: string;
    merchantId: string;
    investmentId: number;
  }) => {
    return initiatePayment({
      amount: paymentData.amount,
      currency: "MGA",
      description: paymentData.description,
      merchantID: paymentData.merchantId,
      customerMsisdn: paymentData.phoneNumber,
    });
  };

  return {
    loading,
    error,
    initiatePayment,
    checkTransactionStatus,
    sendPaymentToMvola,
  };
};

export default useMvola;
