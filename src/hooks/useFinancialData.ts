import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResumeFinancier, JalonFinancement, HistoriquePaiementFinancier } from "@/types/financier";

export const useFinancialSummary = () => {
  return useQuery({
    queryKey: ['financial-summary'],
    queryFn: async (): Promise<ResumeFinancier | null> => {
      // Simuler des données financières pour le moment
      // En attendant la création de la table budget_mensuel
      const currentDate = new Date();
      const annee = currentDate.getFullYear();
      const mois = currentDate.getMonth() + 1;
      
      // Récupérer le total des investissements du mois
      const { data: investissements } = await supabase
        .from('investissement')
        .select('montant')
        .gte('created_at', `${annee}-${mois.toString().padStart(2, '0')}-01`);
      
      const montant_investi = investissements?.reduce((sum, inv) => sum + inv.montant, 0) || 0;
      
      // Compter les jalons en attente
      const { data: jalons } = await supabase
        .from('jalon_projet')
        .select('id_jalon_projet')
        .in('statut', ['Prévu', 'En cours']);
      
      const jalons_en_attente = jalons?.length || 0;
      
      // Données simulées pour le budget
      const budget_total = 5000000; // 5M Ar
      const montant_engage = montant_investi * 0.8;
      const montant_utilise = montant_investi * 0.6;
      const solde_disponible = budget_total - montant_engage - montant_utilise;
      
      return {
        annee,
        mois,
        budget_total,
        montant_engage,
        montant_utilise,
        solde_disponible,
        jalons_en_attente
      };
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });
};

export const useJalonsFinancement = () => {
  return useQuery({
    queryKey: ['jalons-financement'],
    queryFn: async (): Promise<JalonFinancement[]> => {
      console.log('🔍 Fetching jalons financement...');
      
      const { data, error } = await supabase
        .from('jalon_projet')
        .select(`
          id_jalon_projet,
          id_projet,
          date_previsionnelle,
          statut,
          jalon_agricole:id_jalon_agricole(nom_jalon),
          projet:id_projet(
            titre,
            id_technicien,
            surface_ha,
            utilisateur!id_technicien(nom, prenoms)
          )
        `)
        .in('statut', ['Prévu', 'En cours'])
        .gte('date_previsionnelle', new Date().toISOString().split('T')[0])
        .lte('date_previsionnelle', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date_previsionnelle', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching jalons financement:', error);
        return [];
      }
      
      console.log('📄 Raw jalons data:', data);
      
      const mappedJalons = data.map((item: any) => {
        const mappedJalon = {
          id_jalon_projet: item.id_jalon_projet,
          id_projet: item.id_projet,
          date_previsionnelle: item.date_previsionnelle,
          statut: item.statut,
          nom_jalon: item.jalon_agricole?.nom_jalon || 'Jalon inconnu',
          nom_projet: item.projet?.titre || 'Projet inconnu',
          id_technicien: item.projet?.id_technicien || '',
          technicien_nom: item.projet?.utilisateur?.nom || 'Non assigné',
          technicien_prenoms: item.projet?.utilisateur?.prenoms || '',
          montant_demande: Math.floor(Math.random() * 500000) + 100000, // Montant simulé en attendant les coûts
          surface_ha: item.projet?.surface_ha || 0
        };
        
        console.log(`👤 Jalon ${item.id_jalon_projet} - Technicien ID: ${mappedJalon.id_technicien}, Nom: ${mappedJalon.technicien_nom} ${mappedJalon.technicien_prenoms}`);
        
        return mappedJalon;
      });
      
      console.log('✅ Mapped jalons:', mappedJalons);
      return mappedJalons;
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
          projet:id_projet(
            titre,
            id_technicien,
            utilisateur!id_technicien(nom, prenoms)
          )
        `)
        .order('date_paiement', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching payment history:', error);
        return [];
      }
      
      return data.map(item => ({
        id_historique_paiement: item.id_historique_paiement,
        id_projet: item.id_projet,
        montant: item.montant,
        date_paiement: item.date_paiement,
        reference_paiement: item.reference_paiement || '',
        type_paiement: item.type_paiement,
        justificatif_url: undefined, // Champ non encore ajouté à la table
        statut_justificatif: 'en_attente', // Valeur par défaut
        observation: item.observation,
        technicien_nom: item.projet?.utilisateur ? `${item.projet.utilisateur.nom} ${item.projet.utilisateur.prenoms || ''}`.trim() : 'Non assigné',
        nom_projet: item.projet?.titre || 'Projet inconnu'
      }));
    },
  });
};
