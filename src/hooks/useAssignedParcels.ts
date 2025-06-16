
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AssignedParcel } from '@/types/technicien';

export const useAssignedParcels = (userId: string, userRole: string) => {
  const [parcels, setParcels] = useState<AssignedParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignedParcels = async () => {
      try {
        setLoading(true);
        
        // Superviseurs voient tous les projets, techniciens seulement les leurs
        let query = supabase
          .from('projet')
          .select(`
            id_projet,
            titre,
            surface_ha,
            statut,
            date_debut_production,
            id_region,
            id_district,
            id_commune,
            projet_culture!inner(
              culture:id_culture(nom_culture),
              date_debut_previsionnelle,
              date_debut_reelle
            )
          `);

        if (userRole === 'technicien') {
          // Filtrer par technicien assigné
          query = query.eq('id_technicien', userId);
        }

        const { data, error } = await query;
        
        if (error) throw error;

        const formattedParcels: AssignedParcel[] = data?.map(project => ({
          id_projet: project.id_projet,
          titre: project.titre || `Projet ${project.id_projet}`,
          surface_ha: project.surface_ha || 0,
          statut: project.statut || 'en_cours',
          date_debut_production: project.date_debut_production,
          cultures: project.projet_culture?.map((pc: any) => ({
            nom_culture: pc.culture?.nom_culture || 'Non spécifié',
            phase_actuelle: determinePhase(pc.date_debut_previsionnelle, pc.date_debut_reelle),
            date_semis: pc.date_debut_previsionnelle,
            date_recolte_prevue: pc.date_debut_reelle,
          })) || [],
          localisation: {
            region: project.id_region?.toString() || 'Non spécifié',
            district: project.id_district?.toString() || 'Non spécifié',
            commune: project.id_commune?.toString() || 'Non spécifié',
          },
          prochaines_actions: [], // À implémenter selon la logique métier
        })) || [];

        setParcels(formattedParcels);
      } catch (err) {
        console.error('Error fetching assigned parcels:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAssignedParcels();
    }
  }, [userId, userRole]);

  return { parcels, loading, error };
};

// Fonction utilitaire pour déterminer la phase actuelle
const determinePhase = (datePrevisionnelle?: string, dateReelle?: string): 'ensemencement' | 'croissance' | 'recolte' | 'termine' => {
  if (!datePrevisionnelle) return 'ensemencement';
  
  const semis = new Date(datePrevisionnelle);
  const maintenant = new Date();
  const recolte = dateReelle ? new Date(dateReelle) : null;
  
  if (recolte && maintenant > recolte) return 'termine';
  if (recolte && maintenant >= new Date(recolte.getTime() - 30 * 24 * 60 * 60 * 1000)) return 'recolte';
  if (maintenant > semis) return 'croissance';
  
  return 'ensemencement';
};
