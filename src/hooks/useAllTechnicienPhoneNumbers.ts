
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserTelephone } from "@/types/userProfile";
import { PhoneType } from "@/types/paymentTypes";

export const useAllTechnicienPhoneNumbers = (technicienId: string) => {
  return useQuery({
    queryKey: ['all-technicien-phone-numbers', technicienId],
    queryFn: async (): Promise<UserTelephone[]> => {
      if (!technicienId) return [];
      
      console.log('Fetching all phone numbers for technicien:', technicienId);
      
      // Récupérer tous les téléphones du technicien
      const { data: allPhones, error } = await supabase
        .from('telephone')
        .select('id_telephone, id_utilisateur, numero, type, est_whatsapp, est_mobile_banking, created_at, modified_at')
        .eq('id_utilisateur', technicienId);
      
      if (error) {
        console.error('Error fetching all technicien phone numbers:', error);
        return [];
      }
      
      console.log('All phones found for technicien:', allPhones);
      
      // Mapper les données pour caster le type correctement
      const typedPhones: UserTelephone[] = (allPhones || []).map(phone => ({
        ...phone,
        type: phone.type as PhoneType
      }));
      
      return typedPhones;
    },
    enabled: !!technicienId,
  });
};
