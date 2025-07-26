import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LogisticsRequest } from "@/types/superviseur";

export const useLogisticsRequests = (superviseurId: string) => {
  return useQuery({
    queryKey: ["logistics-requests", superviseurId],
    queryFn: async (): Promise<LogisticsRequest[]> => {
      // Pour l'instant, on utilise des données mockées car la table demande_materiel n'existe pas encore
      // À remplacer par une vraie requête une fois la table créée
      const mockRequests: LogisticsRequest[] = [
        {
          id_demande: 1,
          id_superviseur: superviseurId,
          type_materiel: "semences",
          description: "Semences de riz pour projet 101",
          quantite: 50,
          urgence: "normale",
          date_demande: new Date().toISOString(),
          date_livraison_souhaitee: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          statut: "en_attente",
          projet_concerne: 101
        },
        {
          id_demande: 2,
          id_superviseur: superviseurId,
          type_materiel: "engrais",
          description: "Engrais NPK pour démarrage saison",
          quantite: 100,
          urgence: "urgente",
          date_demande: new Date().toISOString(),
          date_livraison_souhaitee: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          statut: "approuvee",
          projet_concerne: 102
        }
      ];

      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return mockRequests;
    },
    enabled: !!superviseurId
  });
};