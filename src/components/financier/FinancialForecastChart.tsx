
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const FinancialForecastChart: React.FC = () => {
  // Données simulées pour les prévisions
  const weeklyData = [
    { periode: "Sem 1", montant_prevu: 850000, montant_engage: 800000, ecart: 50000 },
    { periode: "Sem 2", montant_prevu: 920000, montant_engage: 950000, ecart: -30000 },
    { periode: "Sem 3", montant_prevu: 780000, montant_engage: 720000, ecart: 60000 },
    { periode: "Sem 4", montant_prevu: 1100000, montant_engage: 1050000, ecart: 50000 },
  ];

  const monthlyData = [
    { periode: "Jan", montant_prevu: 3200000, montant_engage: 3100000, ecart: 100000 },
    { periode: "Fév", montant_prevu: 2800000, montant_engage: 2950000, ecart: -150000 },
    { periode: "Mar", montant_prevu: 3500000, montant_engage: 3300000, ecart: 200000 },
    { periode: "Avr", montant_prevu: 3100000, montant_engage: 3200000, ecart: -100000 },
    { periode: "Mai", montant_prevu: 3600000, montant_engage: 3400000, ecart: 200000 },
    { periode: "Juin", montant_prevu: 3800000, montant_engage: 3750000, ecart: 50000 },
  ];

  const formatTooltipValue = (value: number) => formatCurrency(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Prévisions Financières
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Vue Hebdomadaire</TabsTrigger>
            <TabsTrigger value="monthly">Vue Mensuelle</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periode" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={formatTooltipValue}
                    labelFormatter={(label) => `Semaine ${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="montant_prevu" 
                    name="Montant Prévu" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="montant_engage" 
                    name="Montant Engagé" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weeklyData.map((week) => (
                <Card key={week.periode} className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{week.periode}</span>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="text-sm">
                      Écart: <span className={week.ecart >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(Math.abs(week.ecart))} {week.ecart >= 0 ? "sous budget" : "dépassement"}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periode" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={formatTooltipValue}
                    labelFormatter={(label) => `Mois de ${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="montant_prevu" 
                    name="Montant Prévu" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="montant_engage" 
                    name="Montant Engagé" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthlyData.slice(-3).map((month) => (
                <Card key={month.periode} className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{month.periode} 2024</span>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="text-sm">
                      Performance: <span className={month.ecart >= 0 ? "text-green-600" : "text-red-600"}>
                        {((month.montant_engage / month.montant_prevu) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Écart: {formatCurrency(Math.abs(month.ecart))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FinancialForecastChart;
