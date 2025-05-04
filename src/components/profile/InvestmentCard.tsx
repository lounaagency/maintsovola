
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Eye, User2, Landmark, TrendingUp, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  ChartContainer, 
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface InvestmentCardProps {
  project: {
    id: string;
    title: string;
    status: string;
    farmer: {
      name: string;
    };
    userInvestment: number;
    investmentShare: number;
    userProfit: number;
    roi: number;
    chartData: any[];
    completedJalons: number;
    totalJalons: number;
    jalonProgress: number;
    jalons: any[];
    dateLancement?: string;
    currentFunding: number;
    fundingGoal: number;
  };
  onViewDetails: (projectId: number) => void;
}

const InvestmentCard: React.FC<InvestmentCardProps> = ({ project, onViewDetails }) => {
  return (
    <Card className="overflow-hidden border border-muted">
      <CardHeader className="p-4 pb-2 space-y-1">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">{project.title}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User2 size={12} />
                <span>{project.farmer.name}</span>
              </div>
            </div>
          </div>
          <Badge variant={project.status === 'terminé' ? 'secondary' : 'default'}>
            {project.status || "Non défini"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-4">
        {/* Financial Summary Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <Landmark size={12} className="mr-1" />
              <span>Votre investissement</span>
            </div>
            <div className="text-base font-bold">{formatCurrency(project.userInvestment)}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round(project.investmentShare * 100)}% du total
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp size={12} className="mr-1" />
              <span>Bénéfice estimé</span>
            </div>
            <div className={`text-base font-bold ${project.userProfit > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(project.userProfit)}
            </div>
            <div className="text-xs text-muted-foreground">
              ROI: {project.roi > 0 ? '+' : ''}{Math.round(project.roi)}%
            </div>
          </div>
        </div>

        {/* Chart showing investment vs expected return - HAUTEUR RÉDUITE */}
        <div className="h-[80px] -mx-2">
          <ChartContainer 
            config={{
              investment: { color: '#94a3b8' },
              profit: { color: project.userProfit > 0 ? '#10b981' : '#f43f5e' }
            }}
          >
            <BarChart 
              width={300} 
              height={80}
              data={project.chartData}
              margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              barSize={40}
            >
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis hide />
              <ChartTooltip 
                cursor={false}
                content={<ChartTooltipContent />}
              />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]} 
              >
                {project.chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        {/* Séparateur visuel pour mieux séparer les sections */}
        <div className="border-t border-gray-100 pt-2"></div>

        {/* Project Progress Section - DÉPLACÉ APRÈS LE GRAPHIQUE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock size={12} className="mr-1" />
              <span>Progrès du projet</span>
            </div>
            {project.dateLancement && (
              <span className="text-xs">
                Lancé le {formatDate(project.dateLancement)}
              </span>
            )}
          </div>

          {project.totalJalons > 0 ? (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>{project.completedJalons}/{project.totalJalons} jalons complétés</span>
                <span>{Math.round(project.jalonProgress)}%</span>
              </div>
              <Progress value={project.jalonProgress} className="h-1.5" />
              
              {/* Jalons Preview - first 2 jalons */}
              {project.jalons && project.jalons.length > 0 && (
                <div className="mt-2 space-y-1">
                  {project.jalons.slice(0, 2).map((jalon: any, index: number) => (
                    <div key={`jalon-${index}`} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${jalon.date_reelle ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className={jalon.date_reelle ? 'text-green-700' : ''}>
                          {jalon.jalon_agricole?.nom_jalon || `Jalon ${index + 1}`}
                        </span>
                      </div>
                      <span className={`text-xs ${jalon.date_reelle ? 'text-green-700' : 'text-muted-foreground'}`}>
                        {jalon.date_reelle ? formatDate(jalon.date_reelle) : formatDate(jalon.date_previsionnelle)}
                      </span>
                    </div>
                  ))}
                  
                  {project.jalons.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center mt-1">
                      +{project.jalons.length - 2} autres jalons
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-center text-muted-foreground py-2">
              Aucun jalon défini pour ce projet
            </div>
          )}
        </div>

        {/* Project Funding Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Financement</span>
            <span>
              {formatCurrency(project.currentFunding)} / {formatCurrency(project.fundingGoal)}
            </span>
          </div>
          <Progress 
            value={project.fundingGoal > 0 ? Math.min(Math.round((project.currentFunding / project.fundingGoal) * 100), 100) : 0} 
            className="h-1.5" 
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewDetails(Number(project.id))}
            className="flex items-center gap-1"
          >
            <Eye size={16} />
            Voir détails
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentCard;
