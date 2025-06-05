
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
      
      // Récupérer tous les téléphones du technicien avec vérification du rôle
      const { data: allPhones, error } = await supabase
        .from('telephone')
        .select(`
          id_telephone, 
          id_utilisateur, 
          numero, 
          type, 
          est_whatsapp, 
          est_mobile_banking, 
          created_at, 
          modified_at,
          utilisateur!inner(
            id_utilisateur,
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
      
      console.log('All phones found for technicien:', allPhones);
      
      // Mapper les données pour caster le type correctement et nettoyer la structure
      const typedPhones: UserTelephone[] = (allPhones || []).map(phone => ({
        id_telephone: phone.id_telephone,
        id_utilisateur: phone.id_utilisateur,
        numero: phone.numero,
        type: phone.type as PhoneType,
        est_whatsapp: phone.est_whatsapp,
        est_mobile_banking: phone.est_mobile_banking,
        created_at: phone.created_at,
        modified_at: phone.modified_at
      }));
      
      return typedPhones;
    },
    enabled: !!technicienId,
  });
};
