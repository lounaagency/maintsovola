import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LogisticsRequest } from "@/types/superviseur";

export const useLogisticsRequests = (superviseurId: string) => {
  return useQuery({
    queryKey: ["logistics-requests", superviseurId],
    queryFn: async (): Promise<LogisticsRequest[]> => {
      const { data, error } = await supabase
        .from("demande_materiel")
        .select(`
          id_demande,
          id_superviseur,
          type_materiel,
          description,
          quantite,
          urgence,
          statut,
          date_demande,
          date_livraison_souhaitee,
          date_livraison_reelle,
          projet_concerne,
          observations
        `)
        .eq("id_superviseur", superviseurId)
        .order("date_demande", { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id_demande: item.id_demande,
        id_superviseur: item.id_superviseur,
        type_materiel: item.type_materiel as LogisticsRequest['type_materiel'],
        description: item.description,
        quantite: item.quantite,
        urgence: item.urgence as LogisticsRequest['urgence'],
        date_demande: item.date_demande,
        date_livraison_souhaitee: item.date_livraison_souhaitee,
        statut: item.statut as LogisticsRequest['statut'],
        projet_concerne: item.projet_concerne
      }));
    },
    enabled: !!superviseurId
  });
};