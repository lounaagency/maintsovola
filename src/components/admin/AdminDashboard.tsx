import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Calculator, Database } from 'lucide-react';
import { CoutReferencesAdmin } from './CoutReferencesAdmin';
import { useAdminStats } from '@/hooks/useAdminStats';

export const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminStats();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Administration</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coûts de référence</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : (stats?.totalCoutReferences || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Entrées configurées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cultures actives</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : (stats?.totalCulturesActives || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Types de cultures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jalons définis</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : (stats?.totalJalonsDéfinis || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Jalons agricoles
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cout-references" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cout-references">Coûts de référence</TabsTrigger>
          <TabsTrigger value="budgets">Budgets projets</TabsTrigger>
          <TabsTrigger value="analytics">Analytique</TabsTrigger>
        </TabsList>

        <TabsContent value="cout-references" className="space-y-4">
          <CoutReferencesAdmin />
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des budgets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Interface de gestion des budgets projets (à développer)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytique financière</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tableaux de bord analytiques (à développer)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};