
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TechnicienMobileBanking } from "@/types/financier";

interface TechnicienPhoneData {
  mobileBankingNumbers: TechnicienMobileBanking[];
  allNumbers: TechnicienMobileBanking[];
}

export const useTechnicienPhoneNumbers = (technicienId: string) => {
  return useQuery({
    queryKey: ['technicien-phone-numbers', technicienId],
    queryFn: async (): Promise<TechnicienPhoneData> => {
      if (!technicienId) return { mobileBankingNumbers: [], allNumbers: [] };
      
      // Récupérer tous les numéros de téléphone du technicien
      const { data: allData, error: allError } = await supabase
        .from('telephone')
        .select('id_telephone, numero, type')
        .eq('id_utilisateur', technicienId);
      
      if (allError) {
        console.error('Error fetching all phone numbers:', allError);
        return { mobileBankingNumbers: [], allNumbers: [] };
      }
      
      // Récupérer uniquement les numéros Mobile Banking
      const { data: mbData, error: mbError } = await supabase
        .from('telephone')
        .select('id_telephone, numero, type')
        .eq('id_utilisateur', technicienId)
        .eq('est_mobile_banking', true);
      
      if (mbError) {
        console.error('Error fetching mobile banking numbers:', mbError);
        return { mobileBankingNumbers: [], allNumbers: allData || [] };
      }
      
      return {
        mobileBankingNumbers: mbData || [],
        allNumbers: allData || []
      };
    },
    enabled: !!technicienId,
  });
};
