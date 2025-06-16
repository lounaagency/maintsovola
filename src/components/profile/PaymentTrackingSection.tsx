
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface PaymentMetrics {
  totalInvested: number;
  totalPaid: number;
  pendingPayments: number;
  thisMonthPaid: number;
  nextPaymentDue?: {
    amount: number;
    date: string;
    project: string;
  };
}

interface PaymentTrackingSectionProps {
  metrics: PaymentMetrics;
}

const PaymentTrackingSection: React.FC<PaymentTrackingSectionProps> = ({ metrics }) => {
  const paymentProgress = metrics.totalInvested > 0 
    ? (metrics.totalPaid / metrics.totalInvested) * 100 
    : 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Suivi des Paiements</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalInvested)}</div>
            <div className="mt-2">
              <Progress value={paymentProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {paymentProgress.toFixed(1)}% payé
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements en Attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(metrics.pendingPayments)}
            </div>
            <Badge variant="outline" className="mt-2">
              {metrics.pendingPayments > 0 ? 'Action requise' : 'À jour'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payé ce Mois</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.thisMonthPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Mois en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochaine Échéance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {metrics.nextPaymentDue ? (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.nextPaymentDue.amount)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(metrics.nextPaymentDue.date).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {metrics.nextPaymentDue.project}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Aucune échéance
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentTrackingSection;
