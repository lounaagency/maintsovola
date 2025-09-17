import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  totalCoutReferences: number;
  totalCulturesActives: number;
  totalJalonsDéfinis: number;
  totalProjetsActifs: number;
  totalInvestissements: number;
  totalPaiements: number;
}

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats-real'],
    queryFn: async (): Promise<AdminStats> => {
      console.log('Fetching real admin stats...');
      
      const [
        coutReferencesResult,
        culturesResult,
        jalonsResult,
        projetsResult,
        investissementsResult,
        paiementsResult
      ] = await Promise.all([
        supabase.from('cout_jalon_reference').select('id_cout_jalon_reference', { count: 'exact', head: true }),
        supabase.from('culture').select('id_culture', { count: 'exact', head: true }),
        supabase.from('jalon_agricole').select('id_jalon_agricole', { count: 'exact', head: true }),
        supabase.from('projet').select('id_projet', { count: 'exact', head: true }).neq('statut', 'terminé'),
        supabase.from('investissement').select('id_investissement', { count: 'exact', head: true }),
        supabase.from('historique_paiement').select('id_historique_paiement', { count: 'exact', head: true })
      ]);

      return {
        totalCoutReferences: coutReferencesResult.count || 0,
        totalCulturesActives: culturesResult.count || 0,
        totalJalonsDéfinis: jalonsResult.count || 0,
        totalProjetsActifs: projetsResult.count || 0,
        totalInvestissements: investissementsResult.count || 0,
        totalPaiements: paiementsResult.count || 0,
      };
    },
    refetchInterval: 120000, // Actualiser toutes les 2 minutes
    staleTime: 100000, // Considérer les données comme valides pendant 100 secondes
  });
};