
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, Eye } from 'lucide-react';
import { useWeeklyPlannings } from '@/hooks/useWeeklyPlannings';
import { WeeklyTask } from '@/types/technicien';
import JalonReportDialog from '@/components/JalonReportDialog';

interface CompletedTasksListProps {
  userId: string;
  userRole: string;
}

const CompletedTasksList: React.FC<CompletedTasksListProps> = ({ userId, userRole }) => {
  const { tasks, loading, error } = useWeeklyPlannings(userId, userRole);
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

  // Filter only completed tasks
  const completedTasks = tasks.filter(task => task.statut === 'fait');

  // Sort by completion date (most recent first)
  const sortedCompletedTasks = completedTasks.sort((a, b) => {
    const dateA = new Date(a.date_prevue);
    const dateB = new Date(b.date_prevue);
    return dateB.getTime() - dateA.getTime();
  });

  const getPriorityColor = (priority: WeeklyTask['priorite']) => {
    switch (priority) {
      case 'haute': return 'bg-red-100 text-red-800';
      case 'moyenne': return 'bg-orange-100 text-orange-800';
      case 'basse': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewReport = (task: WeeklyTask) => {
    setSelectedTask(task);
    setIsReportDialogOpen(true);
  };

  const handleCloseReportDialog = () => {
    setIsReportDialogOpen(false);
    setSelectedTask(null);
  };

  const renderCompletedTaskCard = (task: WeeklyTask) => (
    <Card key={task.id_tache} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={16} />
              <h4 className="font-medium">{task.description}</h4>
              <Badge className={getPriorityColor(task.priorite)}>
                {task.priorite}
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                Effectué
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Prévu: {new Date(task.date_prevue).toLocaleDateString()}</span>
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
            <button
              onClick={() => handleViewReport(task)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Eye size={14} />
              Voir rapport
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tâches effectuées</h3>
        <Badge variant="outline">{completedTasks.length} tâche(s) terminée(s)</Badge>
      </div>

      {completedTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucune tâche effectuée pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCompletedTasks.map(renderCompletedTaskCard)}
        </div>
      )}

      {selectedTask && (
        <JalonReportDialog
          isOpen={isReportDialogOpen}
          onClose={handleCloseReportDialog}
          projectId={selectedTask.id_projet}
          jalonId={selectedTask.id_tache}
          jalonName={selectedTask.description}
          datePrevue={selectedTask.date_prevue}
          readOnly={true}
        />
      )}
    </div>
  );
};

export default CompletedTasksList;
