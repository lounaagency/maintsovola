
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PaiementTechnicien } from "@/types/financier";
import { PAYMENT_TYPES } from "@/types/paymentTypes";

export const usePaymentActions = () => {
  const queryClient = useQueryClient();

  const sendPayment = useMutation({
    mutationFn: async (payment: PaiementTechnicien) => {
      console.log('Sending payment with data:', payment);
      
      // Validation côté client
      if (!Object.values(PAYMENT_TYPES).includes(payment.type_paiement)) {
        throw new Error(`Type de paiement invalide: ${payment.type_paiement}. Types acceptés: ${Object.values(PAYMENT_TYPES).join(', ')}`);
      }

      // 1. Récupérer l'id_projet du jalon
      const { data: jalonData, error: jalonError } = await supabase
        .from('jalon_projet')
        .select('id_projet')
        .eq('id_jalon_projet', payment.id_jalon_projet)
        .single();

      if (jalonError) {
        console.error('Erreur lors de la récupération du jalon:', jalonError);
        throw jalonError;
      }

      // 2. Préparer l'observation avec les détails du paiement
      let observation = payment.observation || '';
      if (payment.type_paiement === PAYMENT_TYPES.MOBILE_BANKING && payment.numero_mobile_banking) {
        observation += ` | Mobile Banking: ${payment.numero_mobile_banking}`;
      } else if (payment.type_paiement === PAYMENT_TYPES.CHEQUE && payment.numero_cheque) {
        observation += ` | Chèque N°: ${payment.numero_cheque}`;
      } else if (payment.type_paiement === PAYMENT_TYPES.CASH) {
        observation += ` | Paiement en liquide - Reçu généré`;
      }

      const paymentData = {
        id_projet: jalonData.id_projet,
        montant: payment.montant,
        reference_paiement: payment.reference_paiement,
        observation: observation.trim(),
        type_paiement: payment.type_paiement,
      };

      console.log('Inserting payment data:', paymentData);

      // 3. Créer l'entrée dans historique_paiement
      const { data: histData, error: histError } = await supabase
        .from('historique_paiement')
        .insert(paymentData)
        .select()
        .single();

      if (histError) {
        console.error('Erreur lors de l\'insertion du paiement:', histError);
        throw histError;
      }

      // 4. Confirmer le paiement du jalon (qui change le statut à "Payé")
      const { error: confirmError } = await supabase.rpc('confirm_milestone_payment', {
        p_jalon_projet_id: payment.id_jalon_projet
      });

      if (confirmError) {
        console.error('Erreur lors de la confirmation du paiement:', confirmError);
        throw confirmError;
      }

      return histData;
    },
    onSuccess: () => {
      toast.success("Paiement envoyé avec succès !");
      queryClient.invalidateQueries({ queryKey: ['jalons-financement'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['historique-paiements'] });
    },
    onError: (error: any) => {
      console.error('Payment error:', error);
      let errorMessage = `Erreur lors du paiement: ${error.message}`;
      
      // Messages d'erreur plus spécifiques
      if (error.message?.includes('type_paiement_check')) {
        errorMessage = `Type de paiement invalide. Veuillez utiliser: ${Object.values(PAYMENT_TYPES).join(', ')}`;
      } else if (error.message?.includes('violates foreign key constraint')) {
        errorMessage = 'Erreur de référence de données. Veuillez réessayer.';
      }
      
      toast.error(errorMessage);
    },
  });

  const validateJustificatif = useMutation({
    mutationFn: async ({ paymentId, status, comment }: { paymentId: number; status: string; comment?: string }) => {
      console.log(`Validation du justificatif ${paymentId} avec le statut: ${status}`);
      
      const { data, error } = await supabase.rpc('validate_payment_justification', {
        p_payment_id: paymentId,
        p_status: status,
        p_comment: comment || null
      });

      if (error) {
        console.error('Erreur lors de la validation:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      const message = variables.status === 'valide' 
        ? "Justificatif validé avec succès !" 
        : "Justificatif rejeté.";
      toast.success(message);
      
      queryClient.invalidateQueries({ queryKey: ['historique-paiements'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error: any) => {
      console.error('Validation error:', error);
      let errorMessage = `Erreur lors de la validation: ${error.message}`;
      
      if (error.message?.includes('Seuls les financiers')) {
        errorMessage = 'Vous n\'êtes pas autorisé à valider les justificatifs.';
      }
      
      toast.error(errorMessage);
    },
  });

  return {
    sendPayment,
    validateJustificatif,
  };
};
