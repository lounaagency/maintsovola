
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  X,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Milestone {
  id: string;
  name: string;
  description?: string;
  status: 'planned' | 'in-progress' | 'completed' | 'delayed';
  plannedDate: string;
  completedDate?: string;
  technicianReport?: string;
  images?: string[];
  validatedBy?: string;
}

interface ProjectMilestonesProps {
  projectId: string;
  milestones: Milestone[];
  userRole?: string;
  onAddReport?: (milestoneId: string) => void;
  onValidate?: (milestoneId: string) => void;
}

const ProjectMilestones: React.FC<ProjectMilestonesProps> = ({
  projectId,
  milestones,
  userRole,
  onAddReport,
  onValidate,
}) => {
  const completedMilestones = milestones.filter(
    (milestone) => milestone.status === 'completed'
  ).length;
  
  const progressPercentage = Math.round(
    (completedMilestones / milestones.length) * 100
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="outline" className="bg-gray-100">Planifié</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500">En cours</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Terminé</Badge>;
      case 'delayed':
        return <Badge variant="destructive">En retard</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const isTechnician = userRole === 'technicien';
  const isSupervisor = userRole === 'superviseur';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-xl font-bold">Suivi de production</h2>
        <div className="flex items-center mt-2 sm:mt-0">
          <span className="text-sm font-medium mr-2">Progression globale:</span>
          <div className="flex items-center w-40">
            <Progress value={progressPercentage} className="h-2" />
            <span className="ml-2 text-sm font-medium">{progressPercentage}%</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-0 bottom-0 left-6 border-l-2 border-dashed border-gray-200"></div>
        <div className="space-y-6">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="relative">
              <div className="flex">
                <div className="flex-shrink-0 relative z-10">
                  {milestone.status === 'completed' ? (
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                  ) : milestone.status === 'in-progress' ? (
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                  ) : milestone.status === 'delayed' ? (
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                      <X className="h-6 w-6 text-red-600" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-gray-600" />
                    </div>
                  )}
                </div>

                <div className="ml-6 w-full">
                  <Card className="border-l-4 shadow-sm" style={{
                    borderLeftColor: 
                      milestone.status === 'completed' ? 'rgb(34 197 94)' : 
                      milestone.status === 'in-progress' ? 'rgb(59 130 246)' : 
                      milestone.status === 'delayed' ? 'rgb(239 68 68)' : 
                      'rgb(203 213 225)'
                  }}>
                    <CardHeader className="py-3 flex flex-row justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{milestone.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            Prévu: {formatDate(milestone.plannedDate)}
                          </span>
                          {milestone.completedDate && (
                            <>
                              <span className="text-xs text-gray-500">•</span>
                              <Check className="h-3.5 w-3.5 text-green-500" />
                              <span className="text-xs text-green-600">
                                Terminé: {formatDate(milestone.completedDate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(milestone.status)}
                    </CardHeader>

                    {(milestone.technicianReport || milestone.images?.length) && (
                      <CardContent className="py-2 space-y-3">
                        {milestone.technicianReport && (
                          <div className="text-sm">
                            <div className="flex items-center mb-1">
                              <FileText className="h-4 w-4 mr-1 text-gray-500" />
                              <span className="font-medium text-xs">Rapport du technicien:</span>
                            </div>
                            <p className="pl-5 text-gray-700">{milestone.technicianReport}</p>
                          </div>
                        )}

                        {milestone.images && milestone.images.length > 0 && (
                          <div>
                            <div className="flex items-center mb-2">
                              <Upload className="h-4 w-4 mr-1 text-gray-500" />
                              <span className="font-medium text-xs">Photos:</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {milestone.images.map((image, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={image}
                                  alt={`Photo ${imgIndex + 1} du jalon ${milestone.name}`}
                                  className="h-20 w-full object-cover rounded"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {milestone.validatedBy && (
                          <div className="flex items-center mt-2">
                            <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                            <span className="text-xs text-gray-600">
                              Validé par: {milestone.validatedBy}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    )}

                    {(isTechnician || isSupervisor) && (
                      <div className="px-6 py-2 border-t bg-gray-50 rounded-b-lg flex justify-end space-x-2">
                        {isTechnician && milestone.status !== 'completed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onAddReport && onAddReport(milestone.id)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Ajouter rapport
                          </Button>
                        )}
                        {isSupervisor && milestone.status === 'in-progress' && (
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => onValidate && onValidate(milestone.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Valider
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectMilestones;
