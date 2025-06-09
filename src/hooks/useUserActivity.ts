
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity, ActivityFilters } from '@/types/activity';

export const useUserActivity = (userId: string, filters: ActivityFilters = {}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    
    fetchActivities();
  }, [userId, filters]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const activitiesData: Activity[] = [];
      
      // 1. Récupérer les projets créés
      const { data: projects } = await supabase
        .from('projet')
        .select('id_projet, titre, created_at')
        .eq('id_tantsaha', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (projects) {
        projects.forEach(project => {
          activitiesData.push({
            id: `project_${project.id_projet}`,
            type: 'project_created',
            title: 'Projet créé',
            description: `Nouveau projet "${project.titre}" créé`,
            date: project.created_at,
            icon: 'Sprout',
            entityId: project.id_projet,
            entityType: 'projet',
            metadata: {
              projectTitle: project.titre
            }
          });
        });
      }

      // 2. Récupérer les investissements
      const { data: investments } = await supabase
        .from('investissement')
        .select(`
          id_investissement,
          montant,
          created_at,
          projet:id_projet(titre)
        `)
        .eq('id_investisseur', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (investments) {
        investments.forEach(investment => {
          activitiesData.push({
            id: `investment_${investment.id_investissement}`,
            type: 'project_investment',
            title: 'Investissement réalisé',
            description: `Investissement de ${new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA' }).format(investment.montant)} dans "${investment.projet?.titre}"`,
            date: investment.created_at,
            icon: 'Coins',
            entityId: investment.id_investissement,
            entityType: 'investissement',
            metadata: {
              amount: investment.montant,
              projectTitle: investment.projet?.titre
            }
          });
        });
      }

      // 3. Récupérer les terrains ajoutés
      const { data: terrains } = await supabase
        .from('terrain')
        .select('id_terrain, nom_terrain, created_at')
        .eq('id_tantsaha', userId)
        .eq('archive', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (terrains) {
        terrains.forEach(terrain => {
          activitiesData.push({
            id: `terrain_${terrain.id_terrain}`,
            type: 'terrain_added',
            title: 'Terrain ajouté',
            description: `Nouveau terrain "${terrain.nom_terrain}" ajouté`,
            date: terrain.created_at,
            icon: 'MapPin',
            entityId: terrain.id_terrain,
            entityType: 'terrain'
          });
        });
      }

      // 4. Récupérer les jalons complétés
      const { data: milestones } = await supabase
        .from('jalon_projet')
        .select(`
          id_jalon_projet,
          date_reelle,
          jalon_agricole:id_jalon_agricole(nom_jalon),
          projet:id_projet(titre, id_tantsaha)
        `)
        .not('date_reelle', 'is', null)
        .order('date_reelle', { ascending: false })
        .limit(10);

      if (milestones) {
        milestones
          .filter(milestone => milestone.projet?.id_tantsaha === userId)
          .forEach(milestone => {
            activitiesData.push({
              id: `milestone_${milestone.id_jalon_projet}`,
              type: 'milestone_completed',
              title: 'Jalon complété',
              description: `Jalon "${milestone.jalon_agricole?.nom_jalon}" complété pour "${milestone.projet?.titre}"`,
              date: milestone.date_reelle!,
              icon: 'CheckCircle',
              entityId: milestone.id_jalon_projet,
              entityType: 'jalon',
              metadata: {
                milestoneName: milestone.jalon_agricole?.nom_jalon,
                projectTitle: milestone.projet?.titre
              }
            });
          });
      }

      // 5. Récupérer les abonnements (follows) - requête simplifiée
      const { data: follows } = await supabase
        .from('abonnement')
        .select('id_abonnement, created_at, id_suivi')
        .eq('id_abonne', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (follows) {
        // Récupérer les informations des utilisateurs suivis séparément
        const userIds = follows.map(follow => follow.id_suivi);
        const { data: followedUsers } = await supabase
          .from('utilisateur')
          .select('id_utilisateur, nom, prenoms')
          .in('id_utilisateur', userIds);

        const userMap = new Map();
        if (followedUsers) {
          followedUsers.forEach(user => {
            userMap.set(user.id_utilisateur, user);
          });
        }

        follows.forEach(follow => {
          const followedUser = userMap.get(follow.id_suivi);
          const userName = followedUser 
            ? `${followedUser.nom || ''} ${followedUser.prenoms || ''}`.trim()
            : 'Utilisateur inconnu';
          
          activitiesData.push({
            id: `follow_${follow.id_abonnement}`,
            type: 'follow',
            title: 'Nouvel abonnement',
            description: `Vous suivez maintenant ${userName}`,
            date: follow.created_at,
            icon: 'UserPlus',
            entityId: follow.id_abonnement,
            entityType: 'abonnement',
            metadata: {
              userName
            }
          });
        });
      }

      // Trier toutes les activités par date décroissante
      const sortedActivities = activitiesData
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, filters.limit || 20);

      setActivities(sortedActivities);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Erreur lors du chargement des activités');
    } finally {
      setLoading(false);
    }
  };

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities
  };
};
