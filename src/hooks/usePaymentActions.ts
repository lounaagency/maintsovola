
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PaiementTechnicien } from "@/types/financier";

export const usePaymentActions = () => {
  const queryClient = useQueryClient();

  const sendPayment = useMutation({
    mutationFn: async (payment: PaiementTechnicien) => {
      // 1. Créer l'entrée dans historique_paiement
      const { data: histData, error: histError } = await supabase
        .from('historique_paiement')
        .insert({
          id_projet: payment.id_jalon_projet, // Nous devons récupérer l'id_projet du jalon
          montant: payment.montant,
          reference_paiement: payment.reference_paiement,
          observation: payment.observation,
          type_paiement: 'financement_jalon',
          date_limite: payment.date_limite,
        })
        .select()
        .single();

      if (histError) throw histError;

      // 2. Mettre à jour le statut du jalon à "Financé"
      const { error: jalonError } = await supabase
        .from('jalon_projet')
        .update({ statut: 'Financé' })
        .eq('id_jalon_projet', payment.id_jalon_projet);

      if (jalonError) throw jalonError;

      // 3. Mettre à jour le budget mensuel (montant_engage)
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      const { error: budgetError } = await supabase
        .rpc('update_budget_engage', {
          p_annee: currentYear,
          p_mois: currentMonth,
          p_montant: payment.montant
        });

      if (budgetError) {
        console.warn('Could not update budget:', budgetError);
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
      toast.error(`Erreur lors du paiement: ${error.message}`);
    },
  });

  const validateJustificatif = useMutation({
    mutationFn: async ({ paymentId, status }: { paymentId: number; status: string }) => {
      const { error } = await supabase
        .from('historique_paiement')
        .update({ statut_justificatif: status })
        .eq('id_historique_paiement', paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Statut du justificatif mis à jour !");
      queryClient.invalidateQueries({ queryKey: ['historique-paiements'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    sendPayment,
    validateJustificatif,
  };
};
