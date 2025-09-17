import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResumeFinancier, JalonFinancement, HistoriquePaiementFinancier } from "@/types/financier";

export const useFinancialSummary = () => {
  return useQuery({
    queryKey: ['financial-summary'],
    queryFn: async () => {
      console.log('Fetching financial summary...');
      
      // Utiliser la nouvelle fonction RPC pour obtenir les vraies données
      const { data, error } = await supabase.rpc('get_financial_summary');
      
      if (error) {
        console.error('Error fetching financial summary:', error);
        // Fallback vers des données de base si erreur
        return {
          annee: new Date().getFullYear(),
          mois: new Date().getMonth() + 1,
          budget_total: 0,
          montant_engage: 0,
          montant_utilise: 0,
          solde_disponible: 0,
          jalons_en_attente: 0
        };
      }
      
      // La fonction RPC retourne un tableau avec un seul élément
      const summaryData = data[0] || {
        budget_total: 0,
        montant_engage: 0,
        montant_utilise: 0,
        solde_disponible: 0,
        jalons_en_attente: 0
      };
      
      return {
        annee: new Date().getFullYear(),
        mois: new Date().getMonth() + 1,
        budget_total: Number(summaryData.budget_total) || 0,
        montant_engage: Number(summaryData.montant_engage) || 0,
        montant_utilise: Number(summaryData.montant_utilise) || 0,
        solde_disponible: Number(summaryData.solde_disponible) || 0,
        jalons_en_attente: Number(summaryData.jalons_en_attente) || 0,
      };
    },
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });
};

export const useJalonsFinancement = () => {
  return useQuery({
    queryKey: ['jalons-financement'],
    queryFn: async (): Promise<JalonFinancement[]> => {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() + 30);
      
      // Récupérer les jalons avec leurs coûts calculés
      const { data, error } = await supabase
        .from('jalon_projet')
        .select(`
          id_jalon_projet,
          id_projet,
          date_previsionnelle,
          statut,
          jalon_agricole:id_jalon_agricole(
            nom_jalon,
            id_jalon_agricole
          ),
          projet:id_projet(
            titre,
            surface_ha,
            id_technicien,
            utilisateur:id_technicien(
              nom,
              prenoms
            ),
            projet_culture(
              id_culture,
              culture:id_culture(nom_culture)
            )
          )
        `)
        .in('statut', ['Prévu', 'En cours'])
        .lte('date_previsionnelle', dateLimit.toISOString().split('T')[0])
        .order('date_previsionnelle');

      if (error) {
        console.error('Error fetching jalons financement:', error);
        throw error;
      }

      // Pour chaque jalon, calculer le montant basé sur les coûts de référence
      const jalonsAvecCouts = await Promise.all(
        (data || []).map(async (jalon) => {
          const projet = jalon.projet as any;
          const technicien = projet?.utilisateur as any;
          const jalonAgricole = jalon.jalon_agricole as any;
          const projetCulture = projet?.projet_culture?.[0];
          
          let montantDemande = 0;
          
          if (projetCulture && jalonAgricole) {
            // Calculer le coût basé sur les coûts de référence
            const { data: coutsRef, error: coutsError } = await supabase
              .from('cout_jalon_reference')
              .select('montant_par_hectare')
              .eq('id_culture', projetCulture.id_culture)
              .eq('id_jalon_agricole', jalonAgricole.id_jalon_agricole);

            if (!coutsError && coutsRef) {
              const coutTotal = coutsRef.reduce((sum, cout) => sum + cout.montant_par_hectare, 0);
              montantDemande = coutTotal * (projet?.surface_ha || 1);
            }
          }

          // Fallback si pas de coûts de référence
          if (montantDemande === 0) {
            montantDemande = (projet?.surface_ha || 1) * 150000; // 150k Ar/ha comme base
          }
          
          return {
            id_jalon_projet: jalon.id_jalon_projet,
            id_projet: jalon.id_projet,
            date_previsionnelle: jalon.date_previsionnelle,
            statut: jalon.statut,
            nom_jalon: jalonAgricole?.nom_jalon || '',
            nom_projet: projet?.titre || '',
            id_technicien: projet?.id_technicien || '',
            technicien_nom: technicien?.nom || '',
            technicien_prenoms: technicien?.prenoms || '',
            montant_demande: montantDemande,
            surface_ha: projet?.surface_ha || 0
          };
        })
      );

      return jalonsAvecCouts;
    },
    refetchInterval: 60000, // Refresh every minute
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
        justificatif_url: item.justificatif_url,
        statut_justificatif: item.statut_justificatif || 'en_attente',
        observation: item.observation,
        technicien_nom: item.projet?.utilisateur ? `${item.projet.utilisateur.nom} ${item.projet.utilisateur.prenoms || ''}`.trim() : 'Non assigné',
        nom_projet: item.projet?.titre || 'Projet inconnu'
      }));
    },
  });
};
