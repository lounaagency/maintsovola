
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
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Layers, CreditCard, Map, PieChart as PieChartIcon } from 'lucide-react';

interface ProjectsSummaryProps {
  totalProjects: number;
  totalArea: number;
  totalFunding: number;
  projectsByStatus: {
    enFinancement: number;
    enCours: number;
    termine: number;
  };
  projectsByCulture?: Array<{
    name: string;
    count: number;
    fill: string;
  }>;
}

const ProjectsSummary: React.FC<ProjectsSummaryProps> = ({
  totalProjects,
  totalArea,
  totalFunding,
  projectsByStatus,
  projectsByCulture = [],
}) => {
  const statusData = [
    { name: "En financement", value: projectsByStatus.enFinancement, fill: "#94a3b8" },
    { name: "En cours", value: projectsByStatus.enCours, fill: "#3b82f6" },
    { name: "Terminés", value: projectsByStatus.termine, fill: "#10b981" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Résumé des projets</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total des projets</CardDescription>
            <CardTitle className="flex items-center">
              <Layers className="mr-2 h-5 w-5 text-muted-foreground" />
              {totalProjects}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Surface totale</CardDescription>
            <CardTitle className="flex items-center">
              <Map className="mr-2 h-5 w-5 text-muted-foreground" />
              {totalArea.toFixed(2)} ha
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Financements reçus</CardDescription>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-muted-foreground" />
              {formatCurrency(totalFunding)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Répartition</CardDescription>
            <CardTitle className="flex items-center text-sm">
              <PieChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="text-base">{statusData[0].value} à financer</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {statusData[1].value} en cours • {statusData[2].value} terminés
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      
      {totalProjects > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribution des projets</CardTitle>
            <CardDescription>Par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ChartContainer
                config={{
                  enFinancement: { label: "En financement" },
                  enCours: { label: "En cours" },
                  termine: { label: "Terminés" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      content={({ payload, label }) => {
                        if (payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-md">
                              <div className="font-medium">{label}</div>
                              <div>{`${payload[0].value} projets`}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" fill="#8884d8">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectsSummary;
