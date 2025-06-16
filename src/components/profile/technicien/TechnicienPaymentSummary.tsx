
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Wallet, Calendar, TrendingUp, Clock } from 'lucide-react';

interface TechnicienPaymentMetrics {
  totalReceived: number;
  thisWeekForecast: number;
  thisMonthForecast: number;
  pendingPayments: number;
}

interface TechnicienPaymentSummaryProps {
  metrics: TechnicienPaymentMetrics;
}

const TechnicienPaymentSummary: React.FC<TechnicienPaymentSummaryProps> = ({ metrics }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Résumé des Paiements</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reçu</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.totalReceived)}
            </div>
            <Badge variant="outline" className="mt-2 text-green-600">
              Encaissé
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prévu Cette Semaine</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(metrics.thisWeekForecast)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              7 prochains jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prévu Ce Mois</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(metrics.thisMonthForecast)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Mois en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total en Attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(metrics.pendingPayments)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Jalons à venir
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TechnicienPaymentSummary;
