
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WeeklyTask } from '@/types/technicien';

export const useWeeklyPlannings = (userId: string, userRole: string) => {
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeeklyTasks = async () => {
      try {
        setLoading(true);
        
        // Calculer les dates de début et fin de semaine
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

        // Utiliser la bonne colonne de la table jalon_projet
        let query = supabase
          .from('jalon_projet')
          .select(`
            id_jalon_projet,
            id_projet,
            date_previsionnelle,
            date_reelle,
            observations,
            jalon_agricole:id_jalon_agricole(nom_jalon),
            projet:id_projet(titre)
          `)
          .gte('date_previsionnelle', startOfWeek.toISOString())
          .lte('date_previsionnelle', endOfWeek.toISOString());

        if (userRole === 'technicien') {
          // Filtrer par projets assignés au technicien
          query = query.eq('projet.id_technicien', userId);
        }

        const { data, error } = await query;
        
        if (error) throw error;

        const formattedTasks: WeeklyTask[] = data?.map(jalon => ({
          id_tache: jalon.id_jalon_projet,
          id_projet: jalon.id_projet,
          titre_projet: jalon.projet?.titre || `Projet ${jalon.id_projet}`,
          description: jalon.jalon_agricole?.nom_jalon || 'Tâche',
          date_prevue: jalon.date_previsionnelle,
          priorite: determinePriorite(jalon.date_previsionnelle),
          statut: jalon.date_reelle ? 'fait' : determineStatut(jalon.date_previsionnelle),
          type_intervention: jalon.jalon_agricole?.nom_jalon || 'Intervention',
          duree_estimee: 120, // 2 heures par défaut
        })) || [];

        setTasks(formattedTasks);
      } catch (err) {
        console.error('Error fetching weekly tasks:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchWeeklyTasks();
    }
  }, [userId, userRole]);

  const updateTaskStatus = async (taskId: number, newStatus: WeeklyTask['statut']) => {
    try {
      // Mettre à jour le statut de la tâche
      if (newStatus === 'fait') {
        await supabase
          .from('jalon_projet')
          .update({ date_reelle: new Date().toISOString().split('T')[0] })
          .eq('id_jalon_projet', taskId);
      }
      
      // Mettre à jour l'état local
      setTasks(prev => prev.map(task => 
        task.id_tache === taskId ? { ...task, statut: newStatus } : task
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  return { tasks, loading, error, updateTaskStatus };
};

// Fonctions utilitaires
const determinePriorite = (datePrevue: string): 'haute' | 'moyenne' | 'basse' => {
  const diff = new Date(datePrevue).getTime() - new Date().getTime();
  const jours = diff / (1000 * 60 * 60 * 24);
  
  if (jours < 1) return 'haute';
  if (jours < 3) return 'moyenne';
  return 'basse';
};

const determineStatut = (datePrevue: string): 'a_faire' | 'retard' => {
  return new Date(datePrevue) < new Date() ? 'retard' : 'a_faire';
};
