import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useWeeklyPlannings } from '@/hooks/useWeeklyPlannings';
import { WeeklyTask } from '@/types/technicien';
import JalonReportDialog from '@/components/JalonReportDialog';

interface WeeklyPlanningTableProps {
  userId: string;
  userRole: string;
}

const WeeklyPlanningTable: React.FC<WeeklyPlanningTableProps> = ({ userId, userRole }) => {
  const { tasks, loading, error, updateTaskStatus } = useWeeklyPlannings(userId, userRole);
  const [selectedTask, setSelectedTask] = useState<WeeklyTask | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Erreur: {error}</p>
      </div>
    );
  }

  // Améliorer le filtrage des tâches avec debugging
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  console.log('All tasks received:', tasks);
  console.log('Today:', today);
  
  const overdueTasks = tasks.filter(task => {
    const taskDate = new Date(task.date_prevue);
    taskDate.setHours(0, 0, 0, 0);
    const isOverdue = taskDate < today && task.statut !== 'fait';
    console.log(`Task ${task.description}: date=${taskDate.toDateString()}, status=${task.statut}, isOverdue=${isOverdue}`);
    return isOverdue;
  });
  
  const currentWeekTasks = tasks.filter(task => {
    const taskDate = new Date(task.date_prevue);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate >= today || task.statut === 'fait';
  });

  console.log('Overdue tasks:', overdueTasks);
  console.log('Current week tasks:', currentWeekTasks);

  const getStatusColor = (status: WeeklyTask['statut']) => {
    switch (status) {
      case 'fait': return 'bg-green-100 text-green-800';
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'retard': return 'bg-red-100 text-red-800';
      case 'bloque': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: WeeklyTask['priorite']) => {
    switch (priority) {
      case 'haute': return 'bg-red-100 text-red-800';
      case 'moyenne': return 'bg-orange-100 text-orange-800';
      case 'basse': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (taskId: number, newStatus: WeeklyTask['statut']) => {
    updateTaskStatus(taskId, newStatus);
  };

  const handleStartTask = (task: WeeklyTask) => {
    setSelectedTask(task);
    setIsReportDialogOpen(true);
  };

  const handleReportSubmitSuccess = () => {
    if (selectedTask) {
      // Update task status to 'fait' after successful report submission
      updateTaskStatus(selectedTask.id_tache, 'fait');
    }
    setIsReportDialogOpen(false);
    setSelectedTask(null);
  };

  const handleCloseReportDialog = () => {
    setIsReportDialogOpen(false);
    setSelectedTask(null);
  };

  const renderTaskCard = (task: WeeklyTask) => (
    <Card key={task.id_tache} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h4 className="font-medium">{task.description}</h4>
              <Badge className={getPriorityColor(task.priorite)}>
                {task.priorite}
              </Badge>
              <Badge className={getStatusColor(task.statut)}>
                {task.statut.replace('_', ' ')}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{new Date(task.date_prevue).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{task.duree_estimee}min</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Projet: {task.titre_projet}
            </p>
          </div>

          <div className="flex gap-2">
            {task.statut === 'a_faire' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStartTask(task)}
                >
                  Démarrer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(task.id_tache, 'bloque')}
                >
                  <AlertTriangle size={14} />
                </Button>
              </>
            )}
            
            {task.statut === 'en_cours' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleStatusChange(task.id_tache, 'fait')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle size={14} />
                  Terminer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(task.id_tache, 'bloque')}
                >
                  <AlertTriangle size={14} />
                </Button>
              </>
            )}

            {task.statut === 'retard' && (
              <Button
                size="sm"
                onClick={() => handleStartTask(task)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle size={14} />
                Rattraper
              </Button>
            )}

            {task.statut === 'bloque' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(task.id_tache, 'en_cours')}
              >
                Reprendre
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Section des tâches en retard */}
      {overdueTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              <h3 className="text-lg font-semibold text-red-700">Tâches en retard</h3>
            </div>
            <Badge variant="destructive">{overdueTasks.length} tâche(s)</Badge>
          </div>

          <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            {overdueTasks.map(renderTaskCard)}
          </div>
        </div>
      )}

      {/* Section du planning de la semaine */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Planning de la semaine</h3>
          <Badge variant="outline">{currentWeekTasks.length} tâche(s)</Badge>
        </div>

        <div className="space-y-3">
          {currentWeekTasks.map(renderTaskCard)}
        </div>

        {currentWeekTasks.length === 0 && overdueTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p>Aucune tâche planifiée cette semaine</p>
          </div>
        )}

        {currentWeekTasks.length === 0 && overdueTasks.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune nouvelle tâche cette semaine</p>
          </div>
        )}
      </div>

      {selectedTask && (
        <JalonReportDialog
          isOpen={isReportDialogOpen}
          onClose={handleCloseReportDialog}
          projectId={selectedTask.id_projet}
          jalonId={selectedTask.id_tache}
          jalonName={selectedTask.description}
          datePrevue={selectedTask.date_prevue}
          onSubmitSuccess={handleReportSubmitSuccess}
        />
      )}
    </div>
  );
};

export default WeeklyPlanningTable;
