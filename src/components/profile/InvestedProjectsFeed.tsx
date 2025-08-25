import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from '@/lib/utils';
import { Eye, MapPin, Calendar, TrendingUp, Coins } from 'lucide-react';

interface InvestedProjectsFeedProps {
  investedProjects: any[];
  onViewDetails: (projectId: number) => void;
}

const InvestedProjectsFeed: React.FC<InvestedProjectsFeedProps> = ({
  investedProjects,
  onViewDetails
}) => {
  if (investedProjects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aucun projet investi</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {investedProjects.map((project) => (
        <Card key={project.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <Badge 
                    variant={
                      project.status === 'terminé' ? 'default' :
                      project.status === 'en_cours' ? 'secondary' :
                      project.status === 'en financement' ? 'outline' : 'secondary'
                    }
                  >
                    {project.status === 'en financement' ? 'En financement' :
                     project.status === 'en_cours' ? 'En cours' :
                     project.status === 'terminé' ? 'Terminé' : project.status}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 mr-1" />
                  {project.location.region} • {project.farmer.name}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(project.creationDate).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(parseInt(project.id))}
                className="flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                Détails
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Informations d'investissement */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Mon investissement</div>
                <div className="font-semibold text-blue-600 flex items-center justify-center">
                  <Coins className="h-4 w-4 mr-1" />
                  {formatCurrency(project.userInvestment)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Part d'investissement</div>
                <div className="font-semibold">
                  {(project.investmentShare * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground">ROI estimé</div>
                <div className={`font-semibold flex items-center justify-center ${
                  project.roi >= 0 ? 'text-green-600' : 'text-red-500'
                }`}>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {project.roi.toFixed(1)}%
                </div>
              </div>
            </div>
            
            {/* Informations du projet */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Surface</div>
                <div className="font-medium">{project.cultivationArea} ha</div>
              </div>
              
              <div>
                <div className="text-muted-foreground">Culture</div>
                <div className="font-medium">{project.cultivationType}</div>
              </div>
              
              <div>
                <div className="text-muted-foreground">Financement</div>
                <div className="font-medium">
                  {((project.currentFunding / project.fundingGoal) * 100).toFixed(0)}%
                </div>
              </div>
              
              {project.totalJalons > 0 && (
                <div>
                  <div className="text-muted-foreground">Progression</div>
                  <div className="font-medium">
                    {project.completedJalons}/{project.totalJalons} jalons
                  </div>
                </div>
              )}
            </div>
            
            {/* Barre de progression du financement */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Financement</span>
                <span className="font-medium">
                  {formatCurrency(project.currentFunding)} / {formatCurrency(project.fundingGoal)}
                </span>
              </div>
              <Progress 
                value={(project.currentFunding / project.fundingGoal) * 100} 
                className="h-2"
              />
            </div>
            
            {/* Barre de progression des jalons */}
            {project.totalJalons > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Jalons complétés</span>
                  <span className="font-medium">
                    {project.jalonProgress.toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={project.jalonProgress} 
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InvestedProjectsFeed;