
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { useFinancialSummary, useJalonsFinancement, useHistoriquePaiements } from "@/hooks/useFinancialData";
import { formatCurrency } from "@/lib/utils";
import FinancialSummaryCards from "@/components/financier/FinancialSummaryCards";
import MilestonePaymentTable from "@/components/financier/MilestonePaymentTable";
import FinancialForecastChart from "@/components/financier/FinancialForecastChart";
import PaymentHistoryList from "@/components/financier/PaymentHistoryList";

const Financier = () => {
  const { profile } = useAuth();

  // Vérifier si l'utilisateur a le rôle financier
  if (!profile || profile.nom_role !== 'financier') {
    return <Navigate to="/feed" replace />;
  }

  const { data: summary, isLoading: summaryLoading } = useFinancialSummary();
  const { data: jalons, isLoading: jalonsLoading } = useJalonsFinancement();
  const { data: historique, isLoading: historiqueLoading } = useHistoriquePaiements();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion Financière</h1>
          <p className="text-muted-foreground">
            Suivi budgétaire et gestion des paiements aux techniciens
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <DollarSign className="w-4 h-4 mr-1" />
          Rôle Financier
        </Badge>
      </div>

      {/* Résumé financier */}
      <FinancialSummaryCards 
        summary={summary} 
        isLoading={summaryLoading} 
      />

      <Tabs defaultValue="jalons" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jalons">Jalons à Financer</TabsTrigger>
          <TabsTrigger value="previsions">Prévisions</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="jalons" className="space-y-4">
          <MilestonePaymentTable 
            jalons={jalons || []} 
            isLoading={jalonsLoading} 
          />
        </TabsContent>

        <TabsContent value="previsions" className="space-y-4">
          <FinancialForecastChart />
        </TabsContent>

        <TabsContent value="historique" className="space-y-4">
          <PaymentHistoryList 
            historique={historique || []} 
            isLoading={historiqueLoading} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Financier;
