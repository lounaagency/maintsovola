
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
  }, [userId, filters.limit, filters.type]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const activitiesData: Activity[] = [];
      
      // Utiliser Promise.allSettled pour éviter qu'une erreur bloque tout le processus
      const results = await Promise.allSettled([
        // 1. Récupérer les projets créés
        supabase
          .from('projet')
          .select('id_projet, titre, created_at')
          .eq('id_tantsaha', userId)
          .order('created_at', { ascending: false })
          .limit(5),

        // 2. Récupérer les investissements
        supabase
          .from('investissement')
          .select(`
            id_investissement,
            montant,
            created_at,
            projet:id_projet(titre)
          `)
          .eq('id_investisseur', userId)
          .order('created_at', { ascending: false })
          .limit(5),

        // 3. Récupérer les terrains ajoutés
        supabase
          .from('terrain')
          .select('id_terrain, nom_terrain, created_at')
          .eq('id_tantsaha', userId)
          .eq('archive', false)
          .order('created_at', { ascending: false })
          .limit(5),

        // 4. Récupérer les jalons complétés
        supabase
          .from('jalon_projet')
          .select(`
            id_jalon_projet,
            date_reelle,
            jalon_agricole:id_jalon_agricole(nom_jalon),
            projet:id_projet(titre, id_tantsaha)
          `)
          .not('date_reelle', 'is', null)
          .order('date_reelle', { ascending: false })
          .limit(5),

        // 5. Récupérer les abonnements (follows)
        supabase
          .from('abonnement')
          .select('id_abonnement, created_at, id_suivi')
          .eq('id_abonne', userId)
          .order('created_at', { ascending: false })
          .limit(5),

        // 6. Récupérer les commentaires créés
        supabase
          .from('commentaire')
          .select(`
            id_commentaire,
            texte,
            date_creation,
            projet:id_projet(titre)
          `)
          .eq('id_utilisateur', userId)
          .order('date_creation', { ascending: false })
          .limit(5),

        // 7. Récupérer les j'aimes sur projets
        supabase
          .from('aimer_projet')
          .select(`
            id_aimer_projet,
            created_at,
            projet:id_projet(titre)
          `)
          .eq('id_utilisateur', userId)
          .order('created_at', { ascending: false })
          .limit(5),

        // 8. Récupérer les j'aimes sur commentaires
        supabase
          .from('aimer_commentaire')
          .select(`
            id_aimer_commentaire,
            created_at,
            commentaire:id_commentaire(texte, projet:id_projet(titre))
          `)
          .eq('id_utilisateur', userId)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // Traiter les résultats même si certaines requêtes échouent
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data) {
          const data = result.value.data as any[];
          
          switch (index) {
            case 0: // Projets créés
              data.forEach((project: any) => {
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
              break;

            case 1: // Investissements
              data.forEach((investment: any) => {
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
              break;

            case 2: // Terrains
              data.forEach((terrain: any) => {
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
              break;

            case 3: // Jalons
              data
                .filter((milestone: any) => milestone.projet?.id_tantsaha === userId)
                .forEach((milestone: any) => {
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
              break;

            case 4: // Abonnements - traitement séparé pour récupérer les noms d'utilisateurs
              if (data.length > 0) {
                const userIds = data.map((follow: any) => follow.id_suivi);
                supabase
                  .from('utilisateur')
                  .select('id_utilisateur, nom, prenoms')
                  .in('id_utilisateur', userIds)
                  .then(({ data: followedUsers }) => {
                    const userMap = new Map();
                    if (followedUsers) {
                      followedUsers.forEach(user => {
                        userMap.set(user.id_utilisateur, user);
                      });
                    }

                    data.forEach((follow: any) => {
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
                    
                    // Re-trier après ajout des abonnements
                    const sortedActivities = activitiesData
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, filters.limit || 20);
                    setActivities(sortedActivities);
                  });
              }
              break;

            case 5: // Commentaires créés
              data.forEach((comment: any) => {
                const shortText = comment.texte?.substring(0, 100) + (comment.texte?.length > 100 ? '...' : '');
                activitiesData.push({
                  id: `comment_${comment.id_commentaire}`,
                  type: 'comment_created',
                  title: 'Commentaire ajouté',
                  description: `Commentaire sur "${comment.projet?.titre}": ${shortText}`,
                  date: comment.date_creation,
                  icon: 'MessageSquare',
                  entityId: comment.id_commentaire,
                  entityType: 'commentaire',
                  metadata: {
                    projectTitle: comment.projet?.titre,
                    commentText: shortText
                  }
                });
              });
              break;

            case 6: // J'aimes sur projets
              data.forEach((like: any) => {
                activitiesData.push({
                  id: `project_like_${like.id_aimer_projet}`,
                  type: 'project_liked',
                  title: 'Projet aimé',
                  description: `Vous avez aimé le projet "${like.projet?.titre}"`,
                  date: like.created_at,
                  icon: 'Heart',
                  entityId: like.id_aimer_projet,
                  entityType: 'aimer_projet',
                  metadata: {
                    projectTitle: like.projet?.titre
                  }
                });
              });
              break;

            case 7: // J'aimes sur commentaires
              data.forEach((like: any) => {
                const shortText = like.commentaire?.texte?.substring(0, 100) + (like.commentaire?.texte?.length > 100 ? '...' : '');
                activitiesData.push({
                  id: `comment_like_${like.id_aimer_commentaire}`,
                  type: 'comment_liked',
                  title: 'Commentaire aimé',
                  description: `Vous avez aimé un commentaire sur "${like.commentaire?.projet?.titre}": ${shortText}`,
                  date: like.created_at,
                  icon: 'Heart',
                  entityId: like.id_aimer_commentaire,
                  entityType: 'aimer_commentaire',
                  metadata: {
                    projectTitle: like.commentaire?.projet?.titre,
                    commentText: shortText
                  }
                });
              });
              break;
          }
        } else if (result.status === 'rejected') {
          console.warn(`Erreur lors de la récupération d'activités (requête ${index}):`, result.reason);
        }
      });

      // Trier toutes les activités par date décroissante (sauf les abonnements traités séparément)
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
