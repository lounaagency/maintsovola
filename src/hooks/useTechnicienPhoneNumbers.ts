
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TechnicienMobileBanking } from "@/types/financier";

export const useTechnicienPhoneNumbers = (technicienId: string) => {
  return useQuery({
    queryKey: ['technicien-mobile-banking', technicienId],
    queryFn: async (): Promise<TechnicienMobileBanking[]> => {
      if (!technicienId) return [];
      
      const { data, error } = await supabase
        .from('telephone')
        .select('id_telephone, numero, type')
        .eq('id_utilisateur', technicienId)
        .eq('est_mobile_banking', true);
      
      if (error) {
        console.error('Error fetching technicien phone numbers:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!technicienId,
  });
};
