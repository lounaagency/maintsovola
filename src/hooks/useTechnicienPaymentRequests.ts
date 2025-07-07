
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useTechnicienPaymentRequests = () => {
  const [loading, setLoading] = useState(false);

  const requestPayment = async (jalonId: number, technicienId: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('request_milestone_payment', {
        p_jalon_projet_id: jalonId,
        p_technicien_id: technicienId
      });

      if (error) {
        throw error;
      }

      toast.success('Demande de paiement envoyée avec succès');
      return data;
    } catch (error: any) {
      console.error('Error requesting payment:', error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    requestPayment,
    loading
  };
};
