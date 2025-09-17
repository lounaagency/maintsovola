import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FinancialSummary {
  budget_total: number;
  montant_engage: number;
  montant_utilise: number;
  solde_disponible: number;
  jalons_en_attente: number;
}

export const useFinancialSummaryData = () => {
  return useQuery({
    queryKey: ['financial-summary-real'],
    queryFn: async (): Promise<FinancialSummary> => {
      console.log('Fetching real financial summary...');
      
      const { data, error } = await supabase.rpc('get_financial_summary');
      
      if (error) {
        console.error('Error fetching financial summary:', error);
        throw error;
      }
      
      // La fonction RPC retourne un tableau avec un seul élément
      const summaryData = data[0] || {
        budget_total: 0,
        montant_engage: 0,
        montant_utilise: 0,
        solde_disponible: 0,
        jalons_en_attente: 0
      };
      
      return {
        budget_total: Number(summaryData.budget_total) || 0,
        montant_engage: Number(summaryData.montant_engage) || 0,
        montant_utilise: Number(summaryData.montant_utilise) || 0,
        solde_disponible: Number(summaryData.solde_disponible) || 0,
        jalons_en_attente: Number(summaryData.jalons_en_attente) || 0,
      };
    },
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
    staleTime: 25000, // Considérer les données comme valides pendant 25 secondes
  });
};