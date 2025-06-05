
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResumeFinancier, JalonFinancement, HistoriquePaiementFinancier } from "@/types/financier";

export const useFinancialSummary = () => {
  return useQuery({
    queryKey: ['financial-summary'],
    queryFn: async (): Promise<ResumeFinancier | null> => {
      const { data, error } = await supabase
        .from('vue_resume_financier')
        .select('*')
        .single();
      
      if (error) {
        console.error('Error fetching financial summary:', error);
        return null;
      }
      
      return data;
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });
};

export const useJalonsFinancement = () => {
  return useQuery({
    queryKey: ['jalons-financement'],
    queryFn: async (): Promise<JalonFinancement[]> => {
      const { data, error } = await supabase
        .from('vue_jalons_financement')
        .select('*')
        .order('date_limite', { ascending: true });
      
      if (error) {
        console.error('Error fetching jalons financement:', error);
        return [];
      }
      
      return data || [];
    },
    refetchInterval: 60000, // Rafraîchir chaque minute
  });
};

export const useHistoriquePaiements = () => {
  return useQuery({
    queryKey: ['historique-paiements'],
    queryFn: async (): Promise<HistoriquePaiementFinancier[]> => {
      const { data, error } = await supabase
        .from('historique_paiement')
        .select(`
          *,
          projet:id_projet(titre),
          utilisateur:id_technicien(nom, prenoms)
        `)
        .order('date_paiement', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching payment history:', error);
        return [];
      }
      
      return data.map(item => ({
        ...item,
        nom_projet: item.projet?.titre || 'Projet inconnu',
        technicien_nom: item.utilisateur ? `${item.utilisateur.nom} ${item.utilisateur.prenoms || ''}`.trim() : 'Non assigné'
      }));
    },
  });
};
