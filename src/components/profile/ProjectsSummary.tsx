
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
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { Layers, CreditCard, Map, PieChartIcon, Tractor, Sprout, Clock } from 'lucide-react';

interface ProjectCultureCount {
  name: string;
  count: number;
  fill: string;
}

interface ProjectCategoryData {
  count: number;
  area: number;
  funding: number;
  profit: number;
  ownerProfit: number;
  cultures: ProjectCultureCount[];
}

interface ProjectStatusData {
  enFinancement: ProjectCategoryData;
  enCours: ProjectCategoryData;
  termine: ProjectCategoryData;
}

interface ProjectsSummaryProps {
  totalProjects: number;
  totalArea: number;
  totalFunding: number;
  totalProfit: number;
  ownerProfit: number;
  projectsByStatus: ProjectStatusData;
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
  totalProfit,
  ownerProfit,
  projectsByStatus,
  projectsByCulture = [],
}) => {
  const statusData = [
    { name: "En financement", value: projectsByStatus.enFinancement.count, fill: "#94a3b8" },
    { name: "En cours", value: projectsByStatus.enCours.count, fill: "#3b82f6" },
    { name: "Terminés", value: projectsByStatus.termine.count, fill: "#10b981" },
  ];

  // Fonction pour rendre la section de résumé d'une catégorie de projet
  const renderCategorySection = (title: string, data: ProjectCategoryData, color: string) => (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center">
              {title === "En financement" && <Clock className="mr-2 h-5 w-5 text-slate-400" />}
              {title === "En cours" && <Tractor className="mr-2 h-5 w-5 text-blue-500" />}
              {title === "Terminés" && <Sprout className="mr-2 h-5 w-5 text-emerald-500" />}
              {title} ({data.count})
            </CardTitle>
            <CardDescription>Résumé financier</CardDescription>
          </div>
          {data.count > 0 && (
            <div className="flex items-center text-sm font-medium">
              {((data.count / totalProjects) * 100).toFixed(1)}% des projets
            </div>
          )}
        </div>
      </CardHeader>
      
      {data.count > 0 ? (
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Surface</CardDescription>
                <CardTitle className="flex items-center text-sm">
                  <Map className="mr-2 h-4 w-4 text-muted-foreground" />
                  {data.area.toFixed(2)} ha
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Financement</CardDescription>
                <CardTitle className="flex items-center text-sm">
                  <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                  {formatCurrency(data.funding)}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Bénéfice total</CardDescription>
                <CardTitle className="flex items-center text-sm">
                  <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
                  {formatCurrency(data.profit)}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Part propriétaire (40%)</CardDescription>
                <CardTitle className="flex items-center text-sm">
                  <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
                  {formatCurrency(data.ownerProfit)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {data.cultures.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Cultures</h4>
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={data.cultures} 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={60} 
                      dataKey="count" 
                      nameKey="name"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.cultures.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ payload }) => {
                        if (payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-md">
                              <div className="font-medium">{payload[0].name}</div>
                              <div>{`${payload[0].value} projets`}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      ) : (
        <CardContent>
          <div className="text-muted-foreground text-center py-2">Pas de projets {title.toLowerCase()}</div>
        </CardContent>
      )}
    </Card>
  );

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
            <CardDescription>Bénéfice propriétaire</CardDescription>
            <CardTitle className="flex items-center text-sm">
              <PieChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="text-base">{formatCurrency(ownerProfit)}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              40% du bénéfice total ({formatCurrency(totalProfit)})
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

      {/* Sections par catégorie de projet */}
      {renderCategorySection("En financement", projectsByStatus.enFinancement, "#94a3b8")}
      {renderCategorySection("En cours", projectsByStatus.enCours, "#3b82f6")}
      {renderCategorySection("Terminés", projectsByStatus.termine, "#10b981")}
    </div>
  );
};

export default ProjectsSummary;
