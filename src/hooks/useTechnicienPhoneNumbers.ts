
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TechnicienMobileBanking } from "@/types/financier";
import { isMobileBankingPhone } from "@/types/paymentTypes";

export const useTechnicienPhoneNumbers = (technicienId: string) => {
  return useQuery({
    queryKey: ['technicien-mobile-banking', technicienId],
    queryFn: async (): Promise<TechnicienMobileBanking[]> => {
      if (!technicienId) return [];
      
      console.log('Fetching phone numbers for technicien:', technicienId);
      
      // Récupérer tous les téléphones du technicien avec vérification du rôle
      const { data: allPhones, error } = await supabase
        .from('telephone')
        .select(`
          id_telephone, 
          numero, 
          type, 
          est_mobile_banking,
          utilisateur!inner(
            role!inner(
              nom_role
            )
          )
        `)
        .eq('id_utilisateur', technicienId)
        .eq('utilisateur.role.nom_role', 'technicien');
      
      if (error) {
        console.error('Error fetching technicien phone numbers:', error);
        return [];
      }
      
      console.log('All phones found:', allPhones);
      
      // Filtrer pour ne garder que ceux qui sont Mobile Banking
      const mobileBankingPhones = allPhones?.filter(phone => 
        phone.est_mobile_banking === true || isMobileBankingPhone(phone.type)
      ) || [];
      
      console.log('Mobile banking phones:', mobileBankingPhones);
      
      return mobileBankingPhones.map(phone => ({
        id_telephone: phone.id_telephone,
        numero: phone.numero,
        type: phone.type
      }));
    },
    enabled: !!technicienId,
  });
};
