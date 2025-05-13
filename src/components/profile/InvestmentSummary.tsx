
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Coins, BarChart3 } from 'lucide-react';

interface InvestmentSummaryProps {
  totalInvested: number;
  totalProfit: number;
  averageROI: number;
  ongoingProjects: number;
  completedProjects: number;
  projectsByStatusData: Array<{name: string, value: number, fill: string}>;
}

const InvestmentSummary: React.FC<InvestmentSummaryProps> = ({
  totalInvested,
  totalProfit,
  averageROI,
  ongoingProjects,
  completedProjects,
  projectsByStatusData
}) => {
  const isPositiveROI = averageROI >= 0;
  const totalProjects = ongoingProjects + completedProjects;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Résumé des investissements</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total investi</CardDescription>
            <CardTitle className="flex items-center">
              <Coins className="mr-2 h-5 w-5 text-muted-foreground" />
              {formatCurrency(totalInvested)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bénéfice estimé</CardDescription>
            <CardTitle className={`flex items-center ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalProfit >= 0 ? 
                <TrendingUp className="mr-2 h-5 w-5" /> : 
                <TrendingDown className="mr-2 h-5 w-5" />}
              {formatCurrency(totalProfit)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>ROI moyen</CardDescription>
            <CardTitle className={`flex items-center ${isPositiveROI ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveROI ? 
                <TrendingUp className="mr-2 h-5 w-5" /> : 
                <TrendingDown className="mr-2 h-5 w-5" />}
              {averageROI.toFixed(2)}%
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projets</CardDescription>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-muted-foreground" />
              {totalProjects} ({ongoingProjects} en cours)
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      {totalProjects > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Répartition des investissements</CardTitle>
            <CardDescription>Par statut de projet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ChartContainer
                config={{
                  ongoing: { label: "En cours" },
                  completed: { label: "Terminés" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectsByStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {projectsByStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent formatter={(value) => [`${formatCurrency(value)}`, 'Montant']} />
                      } 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvestmentSummary;
