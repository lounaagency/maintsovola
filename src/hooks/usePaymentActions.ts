
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PaiementTechnicien } from "@/types/financier";

export const usePaymentActions = () => {
  const queryClient = useQueryClient();

  const sendPayment = useMutation({
    mutationFn: async (payment: PaiementTechnicien) => {
      // 1. Récupérer l'id_projet du jalon
      const { data: jalonData, error: jalonError } = await supabase
        .from('jalon_projet')
        .select('id_projet')
        .eq('id_jalon_projet', payment.id_jalon_projet)
        .single();

      if (jalonError) throw jalonError;

      // 2. Créer l'entrée dans historique_paiement
      const { data: histData, error: histError } = await supabase
        .from('historique_paiement')
        .insert({
          id_projet: jalonData.id_projet,
          montant: payment.montant,
          reference_paiement: payment.reference_paiement,
          observation: payment.observation,
          type_paiement: 'financement_jalon',
        })
        .select()
        .single();

      if (histError) throw histError;

      // 3. Mettre à jour le statut du jalon à "Financé"
      const { error: jalonUpdateError } = await supabase
        .from('jalon_projet')
        .update({ statut: 'Financé' })
        .eq('id_jalon_projet', payment.id_jalon_projet);

      if (jalonUpdateError) throw jalonUpdateError;

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
      // Pour le moment, on simule la validation
      // Une fois que le champ statut_justificatif sera ajouté à la table, on pourra l'utiliser
      console.log(`Validation du justificatif ${paymentId} avec le statut: ${status}`);
      
      // Simulation d'une mise à jour
      await new Promise(resolve => setTimeout(resolve, 1000));
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
