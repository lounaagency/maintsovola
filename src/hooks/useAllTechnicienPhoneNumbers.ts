
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserTelephone } from "@/types/userProfile";
import { PhoneType } from "@/types/paymentTypes";

export const useAllTechnicienPhoneNumbers = (technicienId: string) => {
  return useQuery({
    queryKey: ['all-technicien-phone-numbers', technicienId],
    queryFn: async (): Promise<UserTelephone[]> => {
      console.log('📱 useAllTechnicienPhoneNumbers called with ID:', technicienId);
      
      if (!technicienId) {
        console.log('❌ No technicien ID provided');
        return [];
      }
      
      console.log('🔍 Fetching all phone numbers for technicien:', technicienId);
      
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
          modified_at
        `)
        .eq('id_utilisateur', technicienId);
        
      
      if (error) {
        console.error('❌ Error fetching technicien phone numbers:', error);
        return [];
      }
      
      console.log(`📱 Found ${allPhones?.length || 0} phone numbers for user ${technicienId}:`, allPhones);
      
      // Vérifier que l'utilisateur est bien un technicien
      const { data: userRole, error: roleError } = await supabase
        .from('utilisateur')
        .select(`
          role!inner(nom_role)
        `)
        .eq('id_utilisateur', technicienId)
        .single();

      if (roleError || !userRole?.role?.nom_role || userRole.role.nom_role !== 'technicien') {
        console.log('❌ User is not a technicien or role check failed:', roleError, userRole);
        return [];
      }
      
      console.log('✅ User role verified as technicien');
      console.log('📱 All phones found for technicien:', allPhones);
      
      // Mapper les données pour caster le type correctement
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
      
      console.log('✅ Returning typed phones:', typedPhones);
      return typedPhones;
    },
    enabled: !!technicienId,
  });
};
