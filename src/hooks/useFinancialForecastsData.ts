import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PrevisionFinanciere } from "@/types/financier";

export const useFinancialForecastsData = () => {
  return useQuery({
    queryKey: ['financial-forecasts-real'],
    queryFn: async (): Promise<PrevisionFinanciere[]> => {
      console.log('Fetching real financial forecasts...');
      
      const { data, error } = await supabase.rpc('get_financial_forecasts');
      
      if (error) {
        console.error('Error fetching financial forecasts:', error);
        throw error;
      }
      
      return (data || []).map((item: any) => ({
        periode: item.periode,
        montant_prevu: Number(item.montant_prevu) || 0,
        montant_engage: Number(item.montant_engage) || 0,
        ecart: Number(item.ecart) || 0,
      }));
    },
    refetchInterval: 60000, // Actualiser chaque minute
    staleTime: 50000, // Considérer les données comme valides pendant 50 secondes
  });
};