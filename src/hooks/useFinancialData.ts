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
        justificatif_url: undefined, // Champ non encore ajouté à la table
        statut_justificatif: 'en_attente', // Valeur par défaut
        observation: item.observation,
        technicien_nom: item.projet?.utilisateur ? `${item.projet.utilisateur.nom} ${item.projet.utilisateur.prenoms || ''}`.trim() : 'Non assigné',
        nom_projet: item.projet?.titre || 'Projet inconnu'
      }));
    },
  });
};
