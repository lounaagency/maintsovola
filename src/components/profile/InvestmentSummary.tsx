
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from '@/lib/utils';
import { ChartContainer } from '@/components/ui/chart';
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Clock, CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Vue d'ensemble des investissements</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total investi</CardDescription>
            <CardTitle>{formatCurrency(totalInvested)}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bénéfice estimé</CardDescription>
            <CardTitle className="flex items-center">
              {isPositiveROI ? (
                <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
              )}
              {formatCurrency(totalProfit)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>ROI moyen</CardDescription>
            <CardTitle className={`flex items-center ${isPositiveROI ? 'text-green-600' : 'text-red-500'}`}>
              {isPositiveROI ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {averageROI.toFixed(2)}%
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Statut des projets</CardDescription>
            <CardTitle className="flex space-x-2 text-sm">
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-blue-500" />
                {ongoingProjects} en cours
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                {completedProjects} terminés
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Répartition des investissements</CardTitle>
          <CardDescription>Par statut de projet</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectsByStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {projectsByStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const value = payload[0].value as number;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <div className="font-medium">{payload[0].name}</div>
                          <div>{`${value} projets`}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestmentSummary;
